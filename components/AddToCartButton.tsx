"use client";

import { ShoppingCart } from "lucide-react";

export default function AddToCartButton({ productId, label = "Add to cart" }: { productId: string; label?: string }) {
  function add() {
    try {
      const cart = JSON.parse(localStorage.getItem("store-cart") || "{}") as Record<string, number>;
      cart[productId] = (cart[productId] || 0) + 1;
      localStorage.setItem("store-cart", JSON.stringify(cart));
      window.dispatchEvent(new Event("cart-updated"));
      alert("Added to your cart.");
    } catch {
      alert("Could not add this item. Please try again.");
    }
  }
  return <button onClick={add} className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-3 font-bold text-white transition hover:bg-red-700"><ShoppingCart size={17} />{label}</button>;
}
