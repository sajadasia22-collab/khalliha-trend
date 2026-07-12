import { Platform } from "../generated/prisma/enums";

export type NormalizedPost = {
  platform: Platform;
  normalizedUrl: string;
  platformPostId: string;
};

function stripWww(hostname: string): string {
  return hostname.replace(/^www\./, "").toLowerCase();
}

// Only canonical URL shapes that embed the post ID directly are supported.
// Short links (vm.tiktok.com, fb.watch, ...) require following a redirect to
// resolve, which this function does not attempt.
export function normalizePostUrl(rawUrl: string): NormalizedPost | null {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return null;
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return null;
  }

  const host = stripWww(url.hostname);

  if (host === "tiktok.com") {
    const match = url.pathname.match(/\/video\/(\d+)/);
    if (!match) {
      return null;
    }
    return {
      platform: "TIKTOK",
      normalizedUrl: `https://www.tiktok.com${url.pathname}`,
      platformPostId: match[1],
    };
  }

  if (host === "instagram.com") {
    const match = url.pathname.match(/\/(p|reel|reels)\/([a-zA-Z0-9_-]+)/);
    if (!match) {
      return null;
    }
    return {
      platform: "INSTAGRAM",
      normalizedUrl: `https://www.instagram.com/${match[1]}/${match[2]}/`,
      platformPostId: match[2],
    };
  }

  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtu.be") {
    let id: string | null = null;
    if (host === "youtu.be") {
      id = url.pathname.slice(1).split("/")[0] || null;
    } else if (url.pathname.startsWith("/shorts/")) {
      id = url.pathname.split("/")[2] ?? null;
    } else {
      id = url.searchParams.get("v");
    }
    if (!id) {
      return null;
    }
    return {
      platform: "YOUTUBE",
      normalizedUrl: `https://www.youtube.com/watch?v=${id}`,
      platformPostId: id,
    };
  }

  if (host === "facebook.com" || host === "m.facebook.com") {
    const videoMatch = url.pathname.match(/\/videos\/(\d+)/);
    const reelMatch = url.pathname.match(/\/reel\/(\d+)/);
    const watchId = url.pathname.startsWith("/watch") ? url.searchParams.get("v") : null;
    const id = videoMatch?.[1] ?? reelMatch?.[1] ?? watchId;
    if (!id) {
      return null;
    }
    return {
      platform: "FACEBOOK",
      normalizedUrl: `https://www.facebook.com/watch/?v=${id}`,
      platformPostId: id,
    };
  }

  return null;
}
