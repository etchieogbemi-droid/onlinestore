"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import { supabase } from "@/lib/supabase";
import type { Category, Product } from "@/types";

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const [productResult, categoryResult] = await Promise.all([
        supabase.from("products").select("*").eq("published", true).eq("available", true).order("created_at", { ascending: false }),
        supabase.from("categories").select("*").order("name")
      ]);
      if (productResult.error) setError("Could not load products. Check your Supabase setup and database SQL.");
      else setProducts((productResult.data || []) as Product[]);
      setCategories((categoryResult.data || []) as Category[]);
      setLoading(false);
    }
    load();
  }, []);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q);
      const matchesCategory = category === "all" || p.category_id === category;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, category]);

  return (
    <main className="min-h-screen bg-white">
      <Header />
      <section className="bg-gradient-to-br from-gray-50 to-red-50 px-4 py-12 sm:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-3 inline-flex rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-bold uppercase tracking-widest text-red-600">Shop with confidence</p>
          <h1 className="text-4xl font-black tracking-tight sm:text-6xl">Find your next favourite.</h1>
          <p className="mx-auto mt-4 max-w-xl text-gray-600">Search our catalogue, compare products, and send your order straight to our WhatsApp.</p>
          <label className="mx-auto mt-8 flex max-w-2xl items-center gap-3 rounded-2xl border-2 border-red-600 bg-white p-2 pl-4 shadow-sm">
            <Search className="shrink-0 text-red-600" size={22} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by product name or code..." className="min-w-0 flex-1 py-3 outline-none" aria-label="Search products" />
            <button type="button" className="rounded-xl bg-red-600 px-4 py-3 font-bold text-white hover:bg-red-700">Search</button>
          </label>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div><h2 className="text-2xl font-black sm:text-3xl">Shop products</h2><p className="mt-1 text-sm text-gray-500">{visible.length} item(s) found</p></div>
          <label className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm">
            <SlidersHorizontal size={16} className="text-red-600" />
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="max-w-44 bg-white outline-none">
              <option value="all">All categories</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
        </div>
        {error && <p className="mb-4 rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
        {loading ? <div className="py-20 text-center text-gray-500">Loading products…</div> :
          visible.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">{visible.map((p) => <ProductCard key={p.id} product={p} />)}</div> :
          <div className="rounded-2xl border border-dashed p-12 text-center"><h3 className="font-bold">No products found</h3><p className="mt-2 text-sm text-gray-500">Try a different name, code, or category. Products appear here once published by the admin.</p></div>}
      </section>
      <footer className="border-t bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">© {new Date().getFullYear()} {process.env.NEXT_PUBLIC_STORE_NAME || "My Store"}. All rights reserved.</footer>
    </main>
  );
}
