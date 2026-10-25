"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import Header from "@/components/Header";
import AddToCartButton from "@/components/AddToCartButton";
import { supabase } from "@/lib/supabase";
import { money } from "@/lib/format";
import type { Product } from "@/types";

export default function ProductPage({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(0);

  useEffect(() => {
    supabase.from("products").select("*").eq("id", params.id).eq("published", true).eq("available", true).single()
      .then(({ data }) => { setProduct(data as Product | null); setLoading(false); });
  }, [params.id]);

  return <main className="min-h-screen bg-white"><Header /><div className="mx-auto max-w-6xl px-4 py-8">
    <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-red-600"><ArrowLeft size={17}/> Back to products</Link>
    {loading ? <p className="py-20 text-center">Loading product…</p> : !product ? <div className="py-20 text-center"><h1 className="text-2xl font-black">Product not found</h1><p className="mt-2 text-gray-500">It may have been unpublished or is no longer available.</p></div> :
      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <div>
          <div className="aspect-square overflow-hidden rounded-2xl bg-gray-100">
            {product.images?.[active] ? <img src={product.images[active]} alt={product.name} className="h-full w-full object-contain"/> : <div className="flex h-full items-center justify-center text-gray-400">No image</div>}
          </div>
          {product.images?.length > 1 && <div className="mt-3 grid grid-cols-4 gap-3">{product.images.map((image, i) => <button key={image + i} onClick={() => setActive(i)} className={`aspect-square overflow-hidden rounded-xl border-2 ${active === i ? "border-red-600" : "border-gray-200"}`}><img src={image} alt={`${product.name} view ${i + 1}`} className="h-full w-full object-cover"/></button>)}</div>}
        </div>
        <div className="py-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700"><CheckCircle2 size={14}/> Available</span>
          <h1 className="mt-4 text-3xl font-black sm:text-4xl">{product.name}</h1>
          <p className="mt-2 text-sm text-gray-500">Product code: {product.code}</p>
          <p className="mt-5 text-3xl font-black text-red-600">{money(product.price)}</p>
          <div className="my-6 h-px bg-gray-200"/>
          <h2 className="font-bold">Product description</h2>
          <p className="mt-2 whitespace-pre-wrap leading-7 text-gray-600">{product.description || "Contact the store for more details about this product."}</p>
          <div className="mt-8 max-w-sm"><AddToCartButton productId={product.id} label="Add to cart"/></div>
        </div>
      </div>}
  </div></main>;
}
