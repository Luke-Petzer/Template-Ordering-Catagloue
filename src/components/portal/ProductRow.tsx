"use client";

import { useState } from "react";
import Image from "next/image";
import { Package } from "lucide-react";
import { useCartStore } from "@/lib/cart/store";
import QuantityStepper from "./QuantityStepper";

const ZAR = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  minimumFractionDigits: 2,
});

interface ProductRowProps {
  productId: string;
  sku: string;
  name: string;
  description: string | null;
  price: number;
  primaryImageUrl: string | null;
  // Discount metadata
  discountType: "percentage" | "fixed" | null;
  discountThreshold: number | null;
  discountValue: number | null;
}

export default function ProductRow({
  productId,
  sku,
  name,
  description,
  price,
  primaryImageUrl,
  discountType,
  discountThreshold,
  discountValue,
}: ProductRowProps) {
  const [qty, setQty] = useState(1);
  const addItem = useCartStore((s) => s.addItem);

  const handleAdd = () => {
    addItem({
      productId,
      sku,
      name,
      unitPrice: price,
      quantity: qty,
      primaryImageUrl,
      discountType,
      discountThreshold,
      discountValue,
    });
  };

  return (
    <div
      className="product-row grid items-center px-4 py-3"
      style={{
        gridTemplateColumns: "60px 140px 1fr 120px 140px 100px",
      }}
    >
      {/* Thumbnail */}
      <div className="relative group w-fit flex-shrink-0">
        <div className="w-[44px] h-[44px] bg-gray-50 border border-gray-100 rounded flex items-center justify-center overflow-hidden">
          {primaryImageUrl ? (
            <Image
              src={primaryImageUrl}
              alt={name}
              width={44}
              height={44}
              className="object-cover w-full h-full"
            />
          ) : (
            <Package className="w-5 h-5 text-gray-300" />
          )}
        </div>
        {primaryImageUrl && (
          <div className="absolute bottom-full left-0 mb-2 z-50 w-48 h-48 rounded-lg overflow-hidden shadow-xl border border-slate-200 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200">
            <Image
              src={primaryImageUrl}
              alt={name}
              fill
              className="object-cover"
            />
          </div>
        )}
      </div>

      {/* SKU */}
      <span className="text-sm font-medium text-slate-900">{sku}</span>

      {/* Description */}
      <p className="text-sm text-gray-500 truncate pr-8">
        {description ?? name}
      </p>

      {/* Price */}
      <span className="text-sm font-medium text-slate-900">
        {ZAR.format(price)}
      </span>

      {/* Quantity stepper */}
      <div className="flex items-center">
        <QuantityStepper value={qty} onChange={setQty} />
      </div>

      {/* Add button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleAdd}
          className="text-xs font-semibold px-4 py-2 bg-slate-900 text-white rounded hover:bg-slate-800 active:scale-[0.98] transition-all"
        >
          Add
        </button>
      </div>
    </div>
  );
}
