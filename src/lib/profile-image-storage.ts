import { createClient } from "@supabase/supabase-js";

export const PROFILE_IMAGE_BUCKET = "profile-images";
export const PROFILE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export type ProfileImageKind = "avatar" | "cover" | `portfolio-${string}`;
type SupportedImageMime = "image/jpeg" | "image/png" | "image/webp";

const extensionByMime: Record<SupportedImageMime, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function detectProfileImageMime(bytes: Uint8Array): SupportedImageMime | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }

  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }

  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
}

function getStorageClient() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("PROFILE_STORAGE_NOT_CONFIGURED");
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function ensureProfileImageBucket() {
  const client = getStorageClient();
  const { data } = await client.storage.getBucket(PROFILE_IMAGE_BUCKET);

  if (!data) {
    const { error } = await client.storage.createBucket(PROFILE_IMAGE_BUCKET, {
      public: true,
      allowedMimeTypes: Object.keys(extensionByMime),
      fileSizeLimit: PROFILE_IMAGE_MAX_BYTES,
    });

    if (error && !error.message.toLowerCase().includes("already exists")) {
      throw new Error("PROFILE_STORAGE_BUCKET_FAILED");
    }
  }

  return client;
}

export async function uploadProfileImage(input: {
  userId: string;
  kind: ProfileImageKind;
  bytes: Uint8Array;
  mime: SupportedImageMime;
}) {
  const client = await ensureProfileImageBucket();
  const extension = extensionByMime[input.mime];
  const path = `${input.userId}/${input.kind}-${crypto.randomUUID()}.${extension}`;
  const { error } = await client.storage
    .from(PROFILE_IMAGE_BUCKET)
    .upload(path, input.bytes, {
      cacheControl: "31536000",
      contentType: input.mime,
      upsert: false,
    });

  if (error) {
    throw new Error("PROFILE_IMAGE_UPLOAD_FAILED");
  }

  const { data } = client.storage.from(PROFILE_IMAGE_BUCKET).getPublicUrl(path);
  return { publicUrl: data.publicUrl, path };
}

export async function deleteProfileImage(path: string) {
  const client = getStorageClient();
  await client.storage.from(PROFILE_IMAGE_BUCKET).remove([path]);
}

export function getProfileImagePath(publicUrl: string | null | undefined) {
  if (!publicUrl) return null;

  try {
    const url = new URL(publicUrl);
    const marker = `/storage/v1/object/public/${PROFILE_IMAGE_BUCKET}/`;
    const markerIndex = url.pathname.indexOf(marker);
    if (markerIndex === -1) return null;
    return decodeURIComponent(url.pathname.slice(markerIndex + marker.length));
  } catch {
    return null;
  }
}
