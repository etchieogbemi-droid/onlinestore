"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Minus, Plus, Trash2 } from "lucide-react";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";
import { money } from "@/lib/format";
import type { Product } from "@/types";

type CartLine = { product: Product; quantity: number };

export default function CartPage() {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadCart() {
    let cart: Record<string, number> = {};
    try { cart = JSON.parse(localStorage.getItem("store-cart") || "{}"); } catch {}
    const ids = Object.keys(cart).filter((id) => Number(cart[id]) > 0);
    if (!ids.length) { setLines([]); setLoading(false); return; }
    const { data } = await supabase.from("products").select("*").in("id", ids).eq("published", true).eq("available", true);
    const products = (data || []) as Product[];
    setLines(products.map((p) => ({ product: p, quantity: Math.min(99, Math.max(1, Number(cart[p.id] || 1)))})));
    setLoading(false);
  }

  useEffect(() => { loadCart(); }, []);

  function update(id: string, quantity: number) {
    const next = { ...JSON.parse(localStorage.getItem("store-cart") || "{}") } as Record<string, number>;
    if (quantity <= 0) delete next[id]; else next[id] = Math.min(99, quantity);
    localStorage.setItem("store-cart", JSON.stringify(next));
    window.dispatchEvent(new Event("cart-updated"));
    setLines((old) => old.map((line) => line.product.id === id ? { ...line, quantity: next[id] || 0 } : line).filter((line) => line.quantity > 0));
  }

  const total = lines.reduce((sum, line) => sum + Number(line.product.price) * line.quantity, 0);

  return <main className="min-h-screen bg-gray-50"><Header/><section className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
    <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-red-600"><ArrowLeft size={17}/> Continue shopping</Link>
    <h1 className="mt-5 text-3xl font-black">Your cart</h1>
    {loading ? <p className="py-16 text-center">Loading cart…</p> : !lines.length ? <div className="mt-6 rounded-2xl bg-white p-12 text-center shadow-sm"><h2 className="text-xl font-bold">Your cart is empty</h2><p className="mt-2 text-gray-500">Add products before checking out.</p><Link href="/" className="mt-5 inline-block rounded-xl bg-red-600 px-5 py-3 font-bold text-white">Browse products</Link></div> :
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">{lines.map((line) => <article key={line.product.id} className="flex gap-4 rounded-2xl bg-white p-3 shadow-sm sm:p-4">
          <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-gray-100">{line.product.images?.[0] && <img src={line.product.images[0]} alt={line.product.name} className="h-full w-full object-cover"/>}</div>
          <div className="min-w-0 flex-1"><Link href={`/products/${line.product.id}`} className="font-bold hover:text-red-600">{line.product.name}</Link><p className="mt-1 text-xs text-gray-500">{line.product.code}</p><p className="mt-2 font-extrabold text-red-600">{money(Number(line.product.price) * line.quantity)}</p>
            <div className="mt-2 flex items-center gap-3"><button aria-label="Decrease quantity" onClick={() => update(line.product.id, line.quantity - 1)} className="rounded-lg border p-2"><Minus size={14}/></button><span className="min-w-5 text-center font-bold">{line.quantity}</span><button aria-label="Increase quantity" onClick={() => update(line.product.id, line.quantity + 1)} className="rounded-lg border p-2"><Plus size={14}/></button><button aria-label="Remove product" onClick={() => update(line.product.id, 0)} className="ml-auto p-2 text-red-600"><Trash2 size={17}/></button></div>
          </div>
        </article>)}</div>
        <aside className="h-fit rounded-2xl bg-white p-5 shadow-sm"><h2 className="text-lg font-black">Order summary</h2><div className="mt-4 flex justify-between border-b pb-4 text-sm text-gray-600"><span>Items ({lines.reduce((s,l)=>s+l.quantity,0)})</span><span>{money(total)}</span></div><div className="flex justify-between py-4 text-lg font-black"><span>Subtotal</span><span className="text-red-600">{money(total)}</span></div><p className="text-xs leading-5 text-gray-500">Delivery charges, if any, will be confirmed by the store.</p><Link href="/checkout" className="mt-5 block rounded-xl bg-red-600 px-4 py-3 text-center font-bold text-white hover:bg-red-700">Proceed to checkout</Link></aside>
      </div>}
  </section></main>;
}
