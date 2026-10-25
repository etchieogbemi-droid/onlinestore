import { serverSupabase, verifyAdmin, jsonError } from "@/lib/server";

export async function GET(request: Request) {
  const auth = await verifyAdmin(request);
  if (!auth.ok) return jsonError(auth.message, auth.status);
  const db = serverSupabase();
  const { data, error } = await db.from("products").select("*").order("created_at", { ascending: false });
  if (error) return jsonError(error.message, 500);
  return Response.json({ products: data || [] });
}

export async function POST(request: Request) {
  const auth = await verifyAdmin(request);
  if (!auth.ok) return jsonError(auth.message, auth.status);
  const body = await request.json().catch(() => null);
  if (!body || !String(body.name || "").trim() || !String(body.code || "").trim()) return jsonError("Product name and code are required.");
  const price = Number(body.price);
  if (!Number.isFinite(price) || price < 0) return jsonError("Enter a valid non-negative price.");
  if (!Array.isArray(body.images) || body.images.length < 2) return jsonError("Upload at least two images.");
  if (body.images.some((url: unknown) => typeof url !== "string" || !url.startsWith(process.env.NEXT_PUBLIC_SUPABASE_URL || "https://invalid"))) return jsonError("Product images must be uploaded to this store's Supabase storage.");
  const db = serverSupabase();
  const { data, error } = await db.from("products").insert({
    name: String(body.name).trim(),
    code: String(body.code).trim().toUpperCase(),
    category_id: body.category_id || null,
    description: String(body.description || ""),
    price,
    images: body.images,
    available: Boolean(body.available),
    published: Boolean(body.published),
    updated_at: new Date().toISOString()
  }).select("*").single();
  if (error) return jsonError(error.message, 400);
  return Response.json({ product: data });
}

export async function PUT(request: Request) {
  const auth = await verifyAdmin(request);
  if (!auth.ok) return jsonError(auth.message, auth.status);
  const body = await request.json().catch(() => null);
  if (!body?.id) return jsonError("Product ID is required.");
  const price = Number(body.price);
  if (!String(body.name || "").trim() || !String(body.code || "").trim() || !Number.isFinite(price) || price < 0) return jsonError("Enter a valid name, code and price.");
  if (!Array.isArray(body.images) || body.images.length < 2) return jsonError("Each product needs at least two images.");
  const db = serverSupabase();
  const { data, error } = await db.from("products").update({
    name: String(body.name).trim(), code: String(body.code).trim().toUpperCase(),
    category_id: body.category_id || null, description: String(body.description || ""),
    price, images: body.images, available: Boolean(body.available),
    published: Boolean(body.published), updated_at: new Date().toISOString()
  }).eq("id", body.id).select("*").single();
  if (error) return jsonError(error.message, 400);
  return Response.json({ product: data });
}

export async function DELETE(request: Request) {
  const auth = await verifyAdmin(request);
  if (!auth.ok) return jsonError(auth.message, auth.status);
  const body = await request.json().catch(() => null);
  if (!body?.id) return jsonError("Product ID is required.");
  const db = serverSupabase();
  const { error } = await db.from("products").delete().eq("id", body.id);
  if (error) return jsonError(error.message, 400);
  return Response.json({ ok: true });
}
