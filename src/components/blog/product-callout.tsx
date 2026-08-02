import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/products";

export default function ProductCallout({ product }: { product: Product }) {
  return (
    <Link
      href={`/shop/${product.slug}`}
      className="group flex items-center gap-4 border border-border bg-white p-3 transition-all hover:border-navy/30 hover:shadow-md"
      style={{ borderRadius: "5px" }}
    >
      <div className="relative h-16 w-16 shrink-0 overflow-hidden bg-sand" style={{ borderRadius: "3px" }}>
        <Image src={product.image} alt={product.name} fill className="object-cover transition-transform group-hover:scale-105" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-serif text-base font-semibold text-navy">{product.name}</p>
        <p className="text-sm text-text-light">{product.priceLabel}</p>
      </div>
      <span className="shrink-0 text-sm text-navy underline group-hover:no-underline">Shop →</span>
    </Link>
  );
}
