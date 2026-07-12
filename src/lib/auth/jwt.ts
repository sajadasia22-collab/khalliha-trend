const encoder = new TextEncoder();

export const DEV_ONLY_FALLBACK_SECRET =
  "default-fallback-development-only-secret-key-32-chars";

// A fallback secret is only safe outside production: anyone who reads this
// source can forge valid session tokens for any role if it is ever used live.
export function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (secret) {
    return secret;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET is required in production.");
  }
  return DEV_ONLY_FALLBACK_SECRET;
}

function base64urlEncode(arr: Uint8Array): string {
  const binaryString = String.fromCharCode(...arr);
  return btoa(binaryString).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function base64urlDecode(str: string): Uint8Array {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = 4 - (base64.length % 4);
  if (pad < 4) {
    base64 += "=".repeat(pad);
  }
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function signJWT(
  payload: Record<string, unknown>,
  secret: string,
): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64urlEncode(encoder.encode(JSON.stringify(header)));
  const encodedPayload = base64urlEncode(encoder.encode(JSON.stringify(payload)));
  const data = `${encodedHeader}.${encodedPayload}`;

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: { name: "SHA-256" } },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  const encodedSignature = base64urlEncode(new Uint8Array(signature));

  return `${data}.${encodedSignature}`;
}

export async function verifyJWT(
  token: string,
  secret: string,
): Promise<Record<string, unknown> | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    const [header, payload, signature] = parts;

    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: { name: "SHA-256" } },
      false,
      ["verify"],
    );

    const data = `${header}.${payload}`;
    const signatureBytes = base64urlDecode(signature);
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes.buffer as ArrayBuffer,
      encoder.encode(data),
    );

    if (!isValid) {
      return null;
    }

    const decodedPayload = JSON.parse(new TextDecoder().decode(base64urlDecode(payload)));

    // Check expiration if present
    if (decodedPayload.exp && typeof decodedPayload.exp === "number") {
      const nowSeconds = Math.floor(Date.now() / 1000);
      if (decodedPayload.exp < nowSeconds) {
        return null; // Expired
      }
    }

    return decodedPayload;
  } catch {
    return null;
  }
}
