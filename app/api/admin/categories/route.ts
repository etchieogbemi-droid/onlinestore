import { serverSupabase, verifyAdmin, jsonError } from "@/lib/server";

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function GET(request: Request) {
  const auth = await verifyAdmin(request);
  if (!auth.ok) return jsonError(auth.message, auth.status);
  const db = serverSupabase();
  const { data, error } = await db.from("categories").select("*").order("name");
  if (error) return jsonError(error.message, 500);
  return Response.json({ categories: data || [] });
}

export async function POST(request: Request) {
  const auth = await verifyAdmin(request);
  if (!auth.ok) return jsonError(auth.message, auth.status);
  const body = await request.json().catch(() => null);
  const name = String(body?.name || "").trim();
  const slug = slugify(name);
  if (!name || !slug) return jsonError("Enter a valid category name.");
  const db = serverSupabase();
  const { data, error } = await db.from("categories").insert({ name, slug }).select("*").single();
  if (error) return jsonError(error.message, 400);
  return Response.json({ category: data });
}
