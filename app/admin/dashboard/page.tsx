"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, LogOut, PackagePlus, RefreshCw, Save, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { money } from "@/lib/format";

type Category = { id: string; name: string; slug?: string };
type Product = { 
  id: string; 
  name: string; 
  code: string; 
  description?: string;
  price: number; 
  category_id?: string | null; 
  images: string[]; 
  available: boolean; 
  published: boolean;
};

type Order = { id: string; order_number: number; customer_name: string; customer_phone: string; customer_location: string; total_amount: number; status: string; created_at: string; items: unknown[] };

const emptyForm = { id: "", name: "", code: "", category_id: "", description: "", price: "", available: true, published: false, images: [] as string[] };

export default function AdminDashboard() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [categoryName, setCategoryName] = useState("");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function api(path: string, options: RequestInit = {}) {
    const response = await fetch(path, { ...options, headers: { ...(options.headers || {}), Authorization: `Bearer ${token}` } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Request failed.");
    return data;
  }

  async function refresh(accessToken = token) {
    if (!accessToken) return;
    if (accessToken !== token) setToken(accessToken);
    const headers = { Authorization: `Bearer ${accessToken}` };
    const [p, c, o] = await Promise.all([
      fetch("/api/admin/products", { headers }),
      fetch("/api/admin/categories", { headers }),
      fetch("/api/admin/orders", { headers })
    ]);
    const [pd, cd, od] = await Promise.all([p.json(), c.json(), o.json()]);
    if (!p.ok || !c.ok || !o.ok) throw new Error(pd.error || cd.error || od.error || "Could not load dashboard.");
    setProducts(pd.products || []); setCategories(cd.categories || []); setOrders(od.orders || []);
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const accessToken = data.session?.access_token;
      if (!accessToken) { router.replace("/admin/login"); return; }
      setToken(accessToken);
      try { await refresh(accessToken); } 
      catch (e) { setError(e instanceof Error ? e.message : "Could not load dashboard."); }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace("/admin/login");
      else setToken(session.access_token);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return products.filter((p) => !q || p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q));
  }, [products, search]);

  function setField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) { setForm((old) => ({ ...old, [key]: value })); }

  async function uploadFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(fileList)) {
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error(`${file.name}: use JPG, PNG, or WebP images.`);
        if (file.size > 5 * 1024 * 1024) throw new Error(`${file.name}: image must be 5 MB or smaller.`);
        const body = new FormData(); body.append("file", file);
        const result = await api("/api/admin/upload", { method: "POST", body });
        uploaded.push(result.url);
      }
      setForm((old) => ({ ...old, images: [...old.images, ...uploaded] }));
      setNotice(`${uploaded.length} image(s) uploaded.`);
    } catch (e) { setError(e instanceof Error ? e.message : "Image upload failed."); }
    finally { setBusy(false); }
  }

  async function saveProduct(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(""); setNotice("");
    if (form.images.length < 2) { setBusy(false); setError("Please upload at least two product images."); return; }
    try {
      const payload = { ...form, price: Number(form.price), category_id: form.category_id || null };
      await api("/api/admin/products", { method: form.id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      setNotice(form.id ? "Product updated." : "Product created.");
      setForm(emptyForm);
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save product."); }
    finally { setBusy(false); }
  }

  async function deleteProduct(id: string) {
    if (!confirm("Delete this product permanently?")) return;
    setBusy(true); setError(""); setNotice("");
    try { await api("/api/admin/products", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }); setNotice("Product deleted."); await refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not delete product."); }
    finally { setBusy(false); }
  }

  async function addCategory(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(""); setNotice("");
    try { await api("/api/admin/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: categoryName }) }); setCategoryName(""); await refresh(); setNotice("Category created."); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not create category."); }
    finally { setBusy(false); }
  }

  async function updateOrder(id: string, status: string) {
    setError(""); setNotice("");
    try { await api("/api/admin/orders", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) }); await refresh(); setNotice("Order status updated."); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not update order."); }
  }

  async function logout() { await supabase.auth.signOut(); router.replace("/admin/login"); }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4"><div><p className="text-xs font-bold uppercase tracking-widest text-red-600">Store management</p><h1 className="text-2xl font-black">Admin dashboard</h1></div><div className="flex gap-2"><button onClick={() => refresh()} className="rounded-xl border bg-white px-3 py-2 font-semibold"><RefreshCw size={16}/></button><button onClick={logout} className="flex items-center gap-2 rounded-xl bg-gray-900 px-3 py-2 font-bold text-white"><LogOut size={16}/> Logout</button></div></div></header>
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8">
        {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {notice && <p className="rounded-xl bg-green-50 p-3 text-sm text-green-700">{notice}</p>}
        <div className="grid gap-4 sm:grid-cols-3"><div className="rounded-2xl border bg-white p-5"><p className="text-sm text-gray-500">Total products</p><p className="mt-1 text-3xl font-black">{products.length}</p></div><div className="rounded-2xl border bg-white p-5"><p className="text-sm text-gray-500">Published products</p><p className="mt-1 text-3xl font-black">{products.filter(p=>p.published&&p.available).length}</p></div><div className="rounded-2xl border bg-white p-5"><p className="text-sm text-gray-500">Orders</p><p className="mt-1 text-3xl font-black">{orders.length}</p></div></div>

        <section className="rounded-2xl border bg-white p-5 sm:p-7"><div className="mb-5 flex items-center gap-2"><PackagePlus className="text-red-600"/><h2 className="text-xl font-black">{form.id ? "Edit product" : "Add a product"}</h2></div>
          <form onSubmit={saveProduct} className="grid gap-4 md:grid-cols-2">
            <label className="block"><span className="mb-1.5 block text-sm font-bold">Product name *</span><input required value={form.name} onChange={e=>setField("name",e.target.value)} className="w-full rounded-xl border px-3 py-3"/></label>
            <label className="block"><span className="mb-1.5 block text-sm font-bold">Unique product code *</span><input required value={form.code} onChange={e=>setField("code",e.target.value.toUpperCase())} className="w-full rounded-xl border px-3 py-3"/></label>
            <label className="block"><span className="mb-1.5 block text-sm font-bold">Price (₦) *</span><input required min="0" step="0.01" type="number" value={form.price} onChange={e=>setField("price",e.target.value)} className="w-full rounded-xl border px-3 py-3"/></label>
            <label className="block"><span className="mb-1.5 block text-sm font-bold">Category</span><select value={form.category_id} onChange={e=>setField("category_id",e.target.value)} className="w-full rounded-xl border bg-white px-3 py-3"><option value="">No category</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
            <label className="block md:col-span-2"><span className="mb-1.5 block text-sm font-bold">Description</span><textarea rows={3} value={form.description} onChange={e=>setField("description",e.target.value)} className="w-full rounded-xl border px-3 py-3"/></label>
            <div className="md:col-span-2"><span className="mb-2 block text-sm font-bold">Product images * (minimum 2)</span><label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 p-6 text-sm font-bold hover:border-red-600"><ImagePlus className="text-red-600"/> Choose images<input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={e=>{uploadFiles(e.target.files); e.currentTarget.value="";}}/></label>
              {form.images.length > 0 && <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-6">{form.images.map((url,i)=><div key={url} className="relative aspect-square overflow-hidden rounded-xl border"><img src={url} alt="" className="h-full w-full object-cover"/><button type="button" onClick={()=>setField("images",form.images.filter((_,index)=>index!==i))} className="absolute right-1 top-1 rounded-full bg-white p-1 text-red-600"><Trash2 size={14}/></button></div>)}</div>}
            </div>
            <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={form.available} onChange={e=>setField("available",e.target.checked)} className="h-4 w-4 accent-red-600"/> Available</label>
            <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={form.published} onChange={e=>setField("published",e.target.checked)} className="h-4 w-4 accent-red-600"/> Publish</label>
            <div className="flex flex-wrap gap-3 md:col-span-2"><button disabled={busy} className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-bold text-white disabled:opacity-60"><Save size={17}/>{busy ? "Saving…" : form.id ? "Update product" : "Save product"}</button>{form.id && <button type="button" onClick={()=>setForm(emptyForm)} className="rounded-xl border px-5 py-3 font-bold">Cancel</button>}</div>
          </form>
        </section>

        <section className="rounded-2xl border bg-white p-5 sm:p-7"><h2 className="text-xl font-black">Products</h2><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or code" className="mt-4 w-full rounded-xl border px-4 py-3 md:max-w-md"/><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="p-3">Product</th><th className="p-3">Code</th><th className="p-3">Price</th><th className="p-3">Status</th><th className="p-3">Actions</th></tr></thead><tbody>{filtered.map(p=><tr key={p.id} className="border-t"><td className="p-3"><div className="flex items-center gap-3"><div className="h-12 w-12 overflow-hidden rounded-lg bg-gray-100">{p.images?.[0]&&<img src={p.images[0]} alt="" className="h-full w-full object-cover"/>}</div><span className="font-bold">{p.name}</span></div></td><td className="p-3">{p.code}</td><td className="p-3 font-bold">{money(p.price)}</td><td className="p-3">{p.published&&p.available?<span className="rounded-full bg-green-50 px-2 py-1 text-xs font-bold text-green-700">Published</span>:<span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-bold text-gray-600">Hidden</span>}</td><td className="p-3"><div className="flex gap-2"><button onClick={()=>setForm({ id: p.id, name: p.name, code: p.code, description: p.description || "", price: String(p.price), category_id: p.category_id || "", images: p.images || [], available: p.available, published: p.published })} className="rounded-lg border px-3 py-2 font-semibold">Edit</button><button onClick={()=>deleteProduct(p.id)} className="rounded-lg border border-red-200 px-3 py-2 font-semibold text-red-600">Delete</button></div></td></tr>)}</tbody></table>{!filtered.length&&<p className="p-6 text-center text-sm text-gray-500">No products yet.</p>}</div></section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border bg-white p-5 sm:p-7"><h2 className="text-xl font-black">Categories</h2><form onSubmit={addCategory} className="mt-4 flex gap-2"><input required value={categoryName} onChange={e=>setCategoryName(e.target.value)} placeholder="New category name" className="min-w-0 flex-1 rounded-xl border px-3 py-3"/><button disabled={busy} className="rounded-xl bg-red-600 px-4 font-bold text-white">Add</button></form><div className="mt-4 flex flex-wrap gap-2">{categories.map(c=><span key={c.id} className="rounded-full bg-gray-100 px-3 py-2 text-sm font-semibold">{c.name}</span>)}</div></div>
          <div className="rounded-2xl border bg-white p-5 sm:p-7"><h2 className="text-xl font-black">Recent orders</h2><div className="mt-4 space-y-3">{orders.slice(0,8).map(o=><div key={o.id} className="rounded-xl border p-3"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-bold">Order #{o.order_number} · {o.customer_name}</p><p className="mt-1 text-xs text-gray-500">{o.customer_phone} · {o.customer_location}</p><p className="mt-1 font-extrabold text-red-600">{money(o.total_amount)}</p></div><select value={o.status} onChange={e=>updateOrder(o.id,e.target.value)} className="rounded-lg border bg-white px-2 py-2 text-xs font-semibold">{["pending","confirmed","processing","completed","cancelled"].map(s=><option key={s} value={s}>{s}</option>)}</select></div></div>)}{!orders.length&&<p className="text-sm text-gray-500">No orders received yet.</p>}</div></div>
        </section>
      </div>
    </main>
  );
}