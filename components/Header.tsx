"use client";

import Link from "next/link";
import { ShoppingCart, Store } from "lucide-react";
import { useEffect, useState } from "react";

export default function Header() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const update = () => {
      try {
        const cart = JSON.parse(localStorage.getItem("store-cart") || "{}") as Record<string, number>;
        setCount(Object.values(cart).reduce((sum, qty) => sum + Number(qty || 0), 0));
      } catch { setCount(0); }
    };
    update();
    window.addEventListener("cart-updated", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("cart-updated", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  const storeName = process.env.NEXT_PUBLIC_STORE_NAME || "MY STORE";

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="rounded-xl bg-red-600 p-2 text-white"><Store size={22} /></span>
          <span className="text-lg font-black tracking-tight sm:text-xl">{storeName}</span>
        </Link>
        <nav className="flex items-center gap-3">
          <Link href="/admin/login" className="text-sm font-semibold text-gray-600 hover:text-red-600">Admin</Link>
          <Link href="/cart" className="flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2.5 text-sm font-bold text-white hover:bg-red-700">
            <ShoppingCart size={18} /> Cart ({count})
          </Link>
        </nav>
      </div>
    </header>
  );
}
