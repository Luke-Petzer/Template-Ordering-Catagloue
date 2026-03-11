"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Info, Loader2, Trash2 } from "lucide-react";
import { useCartStore } from "@/lib/cart/store";
import QuantityStepper from "@/components/portal/QuantityStepper";
import { checkoutAction } from "@/app/actions/checkout";

const ZAR = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  minimumFractionDigits: 2,
});

const VAT_RATE = 0.15;

interface ReorderItem {
  productId: string | null;
  sku: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

interface CartReviewShellProps {
  reorderItems: ReorderItem[] | null;
}

export default function CartReviewShell({ reorderItems }: CartReviewShellProps) {
  const { items, updateQuantity, removeItem, subtotal, addItem } = useCartStore();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Merge reorder items into cart on mount
  useEffect(() => {
    if (!reorderItems) return;
    reorderItems.forEach((item) => {
      if (item.productId) {
        addItem({
          productId: item.productId,
          sku: item.sku,
          name: item.name,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
        });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sub = subtotal();
  const vat = parseFloat((sub * VAT_RATE).toFixed(2));
  const total = parseFloat((sub + vat).toFixed(2));

  const handleCheckout = () => {
    setError(null);
    startTransition(async () => {
      const result = await checkoutAction(items);
      if (result?.error) setError(result.error);
      // On success: checkoutAction calls redirect() — component unmounts
    });
  };

  return (
    <main className="flex-1 max-w-[1440px] w-full mx-auto px-8 mt-12 mb-12">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Review Order</h1>
        <p className="text-sm text-gray-500 mt-1">
          Verify your items and quantities before proceeding to checkout.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Items table — 8 cols */}
        <div className="col-span-8 bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm">
          {items.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-sm text-gray-400">Your cart is empty.</p>
              <Link
                href="/dashboard"
                className="inline-block mt-4 text-sm font-medium text-slate-900 hover:underline"
              >
                ← Back to Catalogue
              </Link>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    Product SKU
                  </th>
                  <th className="px-6 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-wider text-right">
                    Line Total
                  </th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => (
                  <tr key={item.productId}>
                    <td className="px-6 py-5 text-sm font-medium text-slate-900 align-middle">
                      {item.sku}
                    </td>
                    <td className="px-6 py-5 text-sm text-gray-500 align-middle">
                      {item.name}
                    </td>
                    <td className="px-6 py-5 align-middle">
                      <QuantityStepper
                        value={item.quantity}
                        onChange={(q) => updateQuantity(item.productId, q)}
                      />
                    </td>
                    <td className="px-6 py-5 text-sm font-medium text-slate-900 text-right align-middle">
                      {ZAR.format(
                        parseFloat((item.unitPrice * item.quantity).toFixed(2))
                      )}
                    </td>
                    <td className="px-6 py-5 align-middle">
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId)}
                        className="text-gray-300 hover:text-red-500 transition-colors"
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Order summary — 4 cols */}
        <div className="col-span-4">
          <div className="bg-slate-100 border border-slate-200 rounded-lg p-6 sticky top-24">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6">
              Order Summary
            </h2>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Subtotal</span>
                <span className="text-sm font-medium text-slate-900">
                  {ZAR.format(sub)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">VAT (15%)</span>
                <span className="text-sm font-medium text-slate-900">
                  {ZAR.format(vat)}
                </span>
              </div>
              <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-900">
                  Final Total
                </span>
                <span className="text-lg font-bold text-slate-900">
                  {ZAR.format(total)}
                </span>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded text-[13px] text-red-700">
                {error}
              </div>
            )}

            {/* CTA */}
            <button
              type="button"
              onClick={handleCheckout}
              disabled={items.length === 0 || isPending}
              className="flex items-center justify-center gap-2 w-full h-12 bg-slate-900 text-white rounded font-semibold text-sm hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing…
                </>
              ) : (
                "Proceed to Checkout"
              )}
            </button>

            <div className="mt-6 flex items-start gap-3 p-3 bg-white/50 border border-slate-200 rounded text-[12px] text-gray-500">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-slate-400" />
              <p>
                VAT is calculated at 15% and confirmed at checkout.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
