import { serverSupabase, verifyAdmin, jsonError } from "@/lib/server";

const statuses = ["pending", "confirmed", "processing", "completed", "cancelled"];

export async function GET(request: Request) {
  const auth = await verifyAdmin(request);
  if (!auth.ok) return jsonError(auth.message, auth.status);
  const db = serverSupabase();
  const { data, error } = await db.from("orders").select("*").order("created_at", { ascending: false }).limit(100);
  if (error) return jsonError(error.message, 500);
  return Response.json({ orders: data || [] });
}

export async function PATCH(request: Request) {
  const auth = await verifyAdmin(request);
  if (!auth.ok) return jsonError(auth.message, auth.status);
  const body = await request.json().catch(() => null);
  if (!body?.id || !statuses.includes(body.status)) return jsonError("Provide an order ID and valid status.");
  const db = serverSupabase();
  const { data, error } = await db.from("orders").update({ status: body.status }).eq("id", body.id).select("*").single();
  if (error) return jsonError(error.message, 400);
  return Response.json({ order: data });
}
