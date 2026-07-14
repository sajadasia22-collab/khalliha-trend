import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const MAX_HTML_BYTES = 512_000;
const MAX_REDIRECTS = 3;
const FETCH_TIMEOUT_MS = 3_500;

export type LinkPreview = {
  title: string | null;
  description: string | null;
  imageUrl: string | null;
};

function isPrivateAddress(address: string) {
  const normalized = address.toLowerCase();
  if (normalized === "::1" || normalized === "::") return true;
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
  if (/^fe[89ab]/.test(normalized)) return true;
  if (normalized.startsWith("::ffff:")) {
    return isPrivateAddress(normalized.slice(7));
  }
  if (isIP(normalized) !== 4) return false;

  const parts = normalized.split(".").map(Number);
  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

export async function assertSafeExternalUrl(value: string) {
  const url = new URL(value);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("UNSAFE_COMMUNITY_LINK");
  }
  if (url.username || url.password) throw new Error("UNSAFE_COMMUNITY_LINK");
  if (url.port && !["80", "443"].includes(url.port)) {
    throw new Error("UNSAFE_COMMUNITY_LINK");
  }
  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    throw new Error("UNSAFE_COMMUNITY_LINK");
  }
  const addresses = await lookup(hostname, { all: true, verbatim: true }).catch(() => []);
  if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error("UNSAFE_COMMUNITY_LINK");
  }
  return url;
}

async function readLimitedHtml(response: Response) {
  const announcedLength = Number(response.headers.get("content-length") ?? 0);
  if (announcedLength > MAX_HTML_BYTES || !response.body) return null;
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_HTML_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function attribute(tag: string, name: string) {
  const match = tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, "i"));
  return match ? decodeHtml(match[1].trim()) : null;
}

function metaContent(html: string, keys: string[]) {
  for (const tag of html.match(/<meta\s+[^>]*>/gi) ?? []) {
    const key = attribute(tag, "property") ?? attribute(tag, "name");
    if (key && keys.includes(key.toLowerCase())) {
      const content = attribute(tag, "content");
      if (content) return content;
    }
  }
  return null;
}

function clean(value: string | null, maxLength: number) {
  return value?.replace(/\s+/g, " ").trim().slice(0, maxLength) || null;
}

async function fetchHtml(startUrl: URL) {
  let url = startUrl;
  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
    await assertSafeExternalUrl(url.toString());
    const response = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "KhallihaTrend-LinkPreview/1.0",
      },
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location || redirects === MAX_REDIRECTS) return null;
      url = new URL(location, url);
      continue;
    }
    if (!response.ok || !response.headers.get("content-type")?.includes("text/html")) {
      return null;
    }
    return { html: await readLimitedHtml(response), finalUrl: url };
  }
  return null;
}

export async function getLinkPreview(value: string): Promise<LinkPreview> {
  const safeUrl = await assertSafeExternalUrl(value);
  const result = await fetchHtml(safeUrl).catch(() => null);
  if (!result?.html) return { title: null, description: null, imageUrl: null };

  const titleTag = result.html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? null;
  const title = clean(
    metaContent(result.html, ["og:title", "twitter:title"]) ?? titleTag,
    200,
  );
  const description = clean(
    metaContent(result.html, ["og:description", "twitter:description", "description"]),
    500,
  );
  const rawImage = metaContent(result.html, ["og:image", "twitter:image"]);
  let imageUrl: string | null = null;
  if (rawImage) {
    const resolved = new URL(rawImage, result.finalUrl);
    imageUrl = await assertSafeExternalUrl(resolved.toString())
      .then((url) => url.toString())
      .catch(() => null);
  }
  return { title, description, imageUrl };
}
