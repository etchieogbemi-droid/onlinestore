import { createClient } from "@supabase/supabase-js";

export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function serverSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase server environment variables are missing.");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

export async function verifyAdmin(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) return { ok: false as const, status: 401, message: "Please sign in." };

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return { ok: false as const, status: 500, message: "Supabase environment variables are missing." };
  }

  const authClient = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data.user?.email) {
    return { ok: false as const, status: 401, message: "Your session is invalid. Please sign in again." };
  }

  if (!adminEmails().includes(data.user.email.toLowerCase())) {
    return { ok: false as const, status: 403, message: "This account is not an approved administrator." };
  }

  return { ok: true as const, user: data.user };
}

export function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}
