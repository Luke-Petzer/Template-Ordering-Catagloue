"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import ProductRow from "@/components/portal/ProductRow";
import CartSidebar from "@/components/portal/CartSidebar";

interface ProductRowData {
  productId: string;
  sku: string;
  name: string;
  description: string | null;
  price: number;
  primaryImageUrl: string | null;
  // Discount fields
  discountType: "percentage" | "fixed" | null;
  discountThreshold: number | null;
  discountValue: number | null;
}

interface CatalogueShellProps {
  products: ProductRowData[];
}

export default function CatalogueShell({ products }: CatalogueShellProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.sku.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q)
    );
  }, [query, products]);

  return (
    <>
      {/* SKU Search Bar */}
      <div className="bg-white border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center px-8 h-[40px]">
          <Search className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search by SKU or product name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-full text-sm outline-none text-slate-900 bg-transparent placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Main: product list + cart sidebar */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Product list */}
        <section className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-8">
            <h1 className="text-[28px] font-semibold text-slate-900 mb-6">
              Product Catalogue
            </h1>

            {/* Table header */}
            <div className="border-b border-gray-100 pb-3">
              <div
                className="grid items-center px-4"
                style={{
                  gridTemplateColumns: "60px 140px 1fr 120px 140px 100px",
                }}
              >
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  Thumb
                </span>
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  SKU
                </span>
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  Description
                </span>
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  Unit Price
                </span>
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  Quantity
                </span>
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider text-right">
                  Action
                </span>
              </div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-gray-50">
              {filtered.map((p) => (
                <ProductRow key={p.productId} {...p} />
              ))}
            </div>

            {filtered.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-16">
                {query
                  ? `No products match "${query}".`
                  : "No products available yet. Add products from the admin dashboard."}
              </p>
            )}
          </div>
        </section>

        {/* Cart sidebar */}
        <CartSidebar />
      </main>
    </>
  );
}
