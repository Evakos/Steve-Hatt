"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/products";
import type { SVGProps } from "react";
import {
  AllCategoryIcon,
  FreshCategoryIcon,
  CuredCategoryIcon,
  SmokedCategoryIcon,
  ShellfishCategoryIcon,
  OystersCategoryIcon,
  UncategorizedCategoryIcon,
} from "@/components/category-icons";

interface Props {
  products: Product[];
}

// Maps WooCommerce category names to an icon. Falls back to no icon for any category not in
// this set (e.g. a new one added in wp-admin) rather than guessing.
const categoryIcons: Record<string, (props: SVGProps<SVGSVGElement>) => React.ReactElement> = {
  Fresh: FreshCategoryIcon,
  Cured: CuredCategoryIcon,
  Smoked: SmokedCategoryIcon,
  Shellfish: ShellfishCategoryIcon,
  Oysters: OystersCategoryIcon,
  Uncategorized: UncategorizedCategoryIcon,
};

export default function ShopGrid({ products }: Props) {
  const categories = useMemo(() => [...new Set(products.map((p) => p.category))].sort(), [products]);
  const [selected, setSelected] = useState<string | null>(null);

  const visible = selected ? products.filter((p) => p.category === selected) : products;

  return (
    <>
      {categories.length > 1 && (
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelected(null)}
            className={
              selected === null
                ? "flex items-center gap-1.5 bg-navy px-3 py-1.5 text-xs font-medium text-white transition-colors"
                : "flex items-center gap-1.5 border border-border bg-white px-3 py-1.5 text-xs font-medium text-navy transition-colors hover:border-navy/40"
            }
            style={{ borderRadius: "999px" }}
          >
            <AllCategoryIcon className="h-3.5 w-3.5" />
            All
          </button>
          {categories.map((cat) => {
            const Icon = categoryIcons[cat];
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelected(cat)}
                className={
                  selected === cat
                    ? "flex items-center gap-1.5 bg-navy px-3 py-1.5 text-xs font-medium text-white transition-colors"
                    : "flex items-center gap-1.5 border border-border bg-white px-3 py-1.5 text-xs font-medium text-navy transition-colors hover:border-navy/40"
                }
                style={{ borderRadius: "999px" }}
              >
                {Icon && <Icon className="h-3.5 w-3.5" />}
                {cat}
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((p) => (
          <Link
            key={p.slug}
            href={`/shop/${p.slug}`}
            className="group border border-border bg-white p-4 transition-all hover:border-navy/30 hover:shadow-md"
            style={{ borderRadius: "5px" }}
          >
            <div className="relative mb-3 h-40 overflow-hidden bg-sand" style={{ borderRadius: "3px" }}>
              <Image src={p.image} alt={p.name} fill className="object-cover transition-transform group-hover:scale-105" />
              <span
                className="absolute left-2 top-2 bg-lobster px-2 py-1 text-[10px] font-medium tracking-wide text-white uppercase"
                style={{ borderRadius: "2px" }}
              >
                {p.tag}
              </span>
            </div>
            <h3 className="font-serif text-lg font-semibold text-navy">{p.name}</h3>
            <p className="mt-1 min-h-[45px] text-sm text-text-light">{p.weight}</p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-base font-semibold text-navy">{p.priceLabel}</span>
              <span
                className="bg-navy px-3 py-1.5 text-xs font-medium text-white transition-colors group-hover:bg-navy/90"
                style={{ borderRadius: "3px" }}
              >
                View
              </span>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
