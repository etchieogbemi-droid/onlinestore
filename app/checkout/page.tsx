"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";
import { money } from "@/lib/format";
import type { Product } from "@/types";

type Line = { product: Product; quantity: number };

export default function CheckoutPage() {
  const [lines, setLines] = useState<Line[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", location: "", address: "", notes: "" });

  useEffect(() => {
    async function load() {
      let cart: Record<string, number> = {};
      try { cart = JSON.parse(localStorage.getItem("store-cart") || "{}"); } catch {}
      const ids = Object.keys(cart).filter((id) => Number(cart[id]) > 0);
      if (ids.length) {
        const { data } = await supabase.from("products").select("*").in("id", ids).eq("published", true).eq("available", true);
        setLines(((data || []) as Product[]).map((product) => ({ product, quantity: Math.min(99, Math.max(1, Number(cart[product.id] || 1))) })));
      }
      setLoading(false);
    }
    load();
  }, []);

  const total = lines.reduce((sum, line) => sum + Number(line.product.price) * line.quantity, 0);
  function change(field: keyof typeof form, value: string) { setForm((old) => ({ ...old, [field]: value })); }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!lines.length) return setError("Your cart is empty. Please add products first.");
    if (!form.name.trim() || !form.phone.trim() || !form.location.trim()) return setError("Please complete your name, phone number, and location.");
    setSending(true);
    try {
      const cart = lines.map((line) => ({ product_id: line.product.id, quantity: line.quantity }));
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, items: cart })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not create the order.");

      const order = result.order;
      const message = [
        `*NEW ORDER — ${process.env.NEXT_PUBLIC_STORE_NAME || "MY STORE"}*`,
        `Order reference: ${order.order_number}`,
        "",
        "*CUSTOMER DETAILS*",
        `Name: ${form.name.trim()}`,
        `Phone: ${form.phone.trim()}`,
        `Location: ${form.location.trim()}`,
        form.address.trim() ? `Delivery address: ${form.address.trim()}` : "",
        "",
        "*ORDER ITEMS*",
        ...order.items.map((item: { name: string; code: string; quantity: number; unit_price: number; subtotal: number }, i: number) =>
          `${i + 1}. ${item.name}\nCode: ${item.code}\nQty: ${item.quantity} × ${money(item.unit_price)} = ${money(item.subtotal)}`),
        "",
        `*TOTAL: ${money(order.total_amount)}*`,
        form.notes.trim() ? `Notes: ${form.notes.trim()}` : "",
        "",
        "Please confirm availability and delivery arrangements."
      ].filter(Boolean).join("\n");

      const number = (process.env.NEXT_PUBLIC_STORE_WHATSAPP_NUMBER || "").replace(/\D/g, "");
      localStorage.removeItem("store-cart");
      window.dispatchEvent(new Event("cart-updated"));
      setSuccess(`Order ${order.order_number} saved successfully.`);
      if (number) window.location.href = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
      else setError("Order saved, but the store WhatsApp number is not configured. Add NEXT_PUBLIC_STORE_WHATSAPP_NUMBER in Vercel.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally { setSending(false); }
  }

  return <main className="min-h-screen bg-gray-50"><Header/><section className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
    <Link href="/cart" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-red-600"><ArrowLeft size={17}/> Back to cart</Link>
    <h1 className="mt-5 text-3xl font-black">Checkout</h1>
    {loading ? <p className="py-16 text-center">Loading checkout…</p> : !lines.length ? <div className="mt-6 rounded-2xl bg-white p-10 text-center"><p>Your cart is empty.</p><Link href="/" className="mt-4 inline-block font-bold text-red-600">Browse products</Link></div> :
    <div className="mt-6 grid gap-6 md:grid-cols-[1fr_340px]">
      <form onSubmit={submit} className="space-y-5 rounded-2xl bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-xl font-black">Your details</h2>
        {[
          { key: "name", label: "Full name", placeholder: "Enter your full name", required: true },
          { key: "phone", label: "Phone number", placeholder: "Enter your phone number", required: true },
          { key: "location", label: "City / location", placeholder: "e.g. Port Harcourt, Rivers State", required: true },
          { key: "address", label: "Delivery address (optional)", placeholder: "Street, area, landmark", required: false }
        ].map((field) => <label key={field.key} className="block"><span className="mb-1.5 block text-sm font-bold">{field.label}{field.required ? " *" : ""}</span><input required={field.required} value={form[field.key as keyof typeof form]} onChange={(e) => change(field.key as keyof typeof form, e.target.value)} placeholder={field.placeholder} className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100"/></label>)}
        <label className="block"><span className="mb-1.5 block text-sm font-bold">Order notes (optional)</span><textarea value={form.notes} onChange={(e) => change("notes", e.target.value)} rows={3} placeholder="Any extra information for the store" className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100"/></label>
        {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {success && <p className="flex items-center gap-2 rounded-xl bg-green-50 p-3 text-sm text-green-700"><CheckCircle2 size={17}/>{success}</p>}
        <button disabled={sending} className="w-full rounded-xl bg-red-600 px-4 py-4 font-black text-white hover:bg-red-700 disabled:opacity-60">{sending ? "Creating order…" : "Place order via WhatsApp"}</button>
        <p className="text-xs leading-5 text-gray-500">Your order is saved first. WhatsApp opens with a prepared message; you must press Send in WhatsApp to send it to the store.</p>
      </form>
      <aside className="h-fit rounded-2xl bg-white p-5 shadow-sm"><h2 className="text-lg font-black">Order summary</h2><div className="mt-4 space-y-4">{lines.map((line) => <div key={line.product.id} className="flex justify-between gap-3 text-sm"><div><p className="font-semibold">{line.product.name}</p><p className="text-gray-500">Qty: {line.quantity}</p></div><span className="shrink-0 font-bold">{money(Number(line.product.price) * line.quantity)}</span></div>)}</div><div className="mt-5 flex justify-between border-t pt-4 text-lg font-black"><span>Total</span><span className="text-red-600">{money(total)}</span></div></aside>
    </div>}
  </section></main>;
}
