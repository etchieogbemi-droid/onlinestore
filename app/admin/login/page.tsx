"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LockKeyhole, Store } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function login(e: React.FormEvent) {
    e.preventDefault(); setError(""); setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) { setError(error.message); return; }
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) { setError("Could not create a login session."); return; }
    const check = await fetch("/api/admin/verify", { headers: { Authorization: `Bearer ${token}` } });
    const result = await check.json();
    if (!check.ok) { await supabase.auth.signOut(); setError(result.error || "This account is not authorised."); return; }
    router.push("/admin/dashboard");
  }

  return <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10"><div className="w-full max-w-md rounded-3xl border bg-white p-7 shadow-sm sm:p-9">
    <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-red-600">← Back to store</Link>
    <div className="mt-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600 text-white"><Store/></div>
    <h1 className="mt-5 text-3xl font-black">Admin login</h1><p className="mt-2 text-sm text-gray-500">Sign in with an approved store administrator account.</p>
    <form onSubmit={login} className="mt-7 space-y-4">
      <label className="block"><span className="mb-1.5 block text-sm font-bold">Email address</span><input type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full rounded-xl border px-4 py-3 outline-none focus:border-red-600"/></label>
      <label className="block"><span className="mb-1.5 block text-sm font-bold">Password</span><input type="password" required value={password} onChange={(e)=>setPassword(e.target.value)} className="w-full rounded-xl border px-4 py-3 outline-none focus:border-red-600"/></label>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3.5 font-bold text-white hover:bg-red-700 disabled:opacity-60"><LockKeyhole size={17}/>{busy ? "Signing in…" : "Sign in"}</button>
    </form>
  </div></main>;
}
