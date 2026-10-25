import { serverSupabase, verifyAdmin, jsonError } from "@/lib/server";

export async function POST(request: Request) {
  const auth = await verifyAdmin(request);
  if (!auth.ok) return jsonError(auth.message, auth.status);
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return jsonError("Select an image file.");
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.type)) return jsonError("Only JPG, PNG and WebP images are allowed.");
  if (file.size > 5 * 1024 * 1024) return jsonError("Images must be 5 MB or smaller.");
  const ext = file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "webp";
  const path = `${crypto.randomUUID()}.${ext}`;
  const db = serverSupabase();
  const { error } = await db.storage.from("product-images").upload(path, file, { contentType: file.type, upsert: false });
  if (error) return jsonError(error.message, 400);
  const { data } = db.storage.from("product-images").getPublicUrl(path);
  return Response.json({ url: data.publicUrl });
}
