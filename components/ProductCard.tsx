import Link from "next/link";
import type { Product } from "@/types";
import { money } from "@/lib/format";
import AddToCartButton from "@/components/AddToCartButton";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:-translate-y-0.5 hover:border-red-500 hover:shadow-lg">
      <Link href={`/products/${product.id}`} className="block">
        <div className="aspect-square bg-gray-100">
          {product.images?.[0] ? <img src={product.images[0]} alt={product.name} loading="lazy" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-sm text-gray-400">No image yet</div>}
        </div>
        <div className="p-3 sm:p-4">
          <h3 className="line-clamp-2 min-h-10 font-bold">{product.name}</h3>
          <p className="mt-1 text-xs text-gray-500">Code: {product.code}</p>
          <p className="mt-3 text-lg font-black text-red-600">{money(product.price)}</p>
        </div>
      </Link>
      <div className="px-3 pb-3 sm:px-4 sm:pb-4"><AddToCartButton productId={product.id} /></div>
    </article>
  );
}
