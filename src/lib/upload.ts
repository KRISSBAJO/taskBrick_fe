import type { UploadIntent } from "./api";

export async function uploadWithIntent(intent: UploadIntent, file: File) {
  if (!intent.uploadUrl) {
    throw new Error(intent.note || `${intent.provider} direct upload is not fully configured yet.`);
  }

  if (intent.provider === "cloudinary") {
    const body = new FormData();
    Object.entries(intent.fields).forEach(([key, value]) => body.append(key, String(value)));
    body.append("file", file);
    const response = await fetch(intent.uploadUrl, { method: "POST", body });
    const payload = await response.json().catch(() => ({})) as { secure_url?: string; url?: string; error?: { message?: string } | string };
    if (!response.ok) {
      const message = typeof payload.error === "string" ? payload.error : payload.error?.message;
      throw new Error(message || "Cloudinary upload failed.");
    }
    return payload.secure_url ?? payload.url ?? intent.fileUrl;
  }

  const response = await fetch(intent.uploadUrl, {
    method: intent.method,
    headers: intent.headers,
    body: file,
  });
  if (!response.ok) throw new Error(`${intent.provider} upload failed with status ${response.status}.`);
  return intent.fileUrl;
}
