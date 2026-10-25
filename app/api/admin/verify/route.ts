import { verifyAdmin, jsonError } from "@/lib/server";

export async function GET(request: Request) {
  const auth = await verifyAdmin(request);
  if (!auth.ok) return jsonError(auth.message, auth.status);
  return Response.json({ ok: true, email: auth.user.email });
}
