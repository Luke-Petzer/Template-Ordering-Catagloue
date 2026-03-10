"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { reorderAction } from "@/app/actions/order";

const ZAR = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  minimumFractionDigits: 2,
});

interface OrderItem {
  id: string;
  sku: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  line_total: number;
}

interface OrderRow {
  id: string;
  reference_number: string;
  created_at: string;
  total_amount: number;
  status: string;
  item_count: number;
  items: OrderItem[];
}

interface OrderHistoryTableProps {
  orders: OrderRow[];
}

export default function OrderHistoryTable({ orders }: OrderHistoryTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) =>
    setExpandedId((prev) => (prev === id ? null : id));

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-ZA", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  if (orders.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-16">
        No orders yet. Place your first order from the catalogue.
      </p>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm">
      {/* Table header */}
      <div
        className="grid items-center px-6 py-4 bg-gray-50/50 border-b border-gray-100"
        style={{ gridTemplateColumns: "140px 180px 1fr 140px 120px" }}
      >
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          Date
        </span>
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          Reference ID
        </span>
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          Items
        </span>
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          Total Cost
        </span>
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider text-right">
          Action
        </span>
      </div>

      {orders.map((order) => {
        const isExpanded = expandedId === order.id;
        return (
          <div key={order.id} className="border-b border-gray-50 last:border-b-0">
            {/* Order row */}
            <div
              className={[
                "grid items-center px-6 py-5 cursor-pointer transition-colors",
                isExpanded ? "bg-slate-50" : "hover:bg-gray-50",
              ].join(" ")}
              style={{ gridTemplateColumns: "140px 180px 1fr 140px 120px" }}
              onClick={() => toggle(order.id)}
            >
              <span className="text-[14px] text-gray-500">
                {formatDate(order.created_at)}
              </span>
              <div className="flex items-center gap-2">
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                )}
                <span className="text-[14px] font-medium text-slate-900 uppercase tracking-tight">
                  {order.reference_number}
                </span>
              </div>
              <span className="text-[14px] text-gray-500">
                {order.item_count} Unique{" "}
                {order.item_count === 1 ? "Item" : "Items"}
              </span>
              <span className="text-[14px] font-medium text-slate-900">
                {ZAR.format(order.total_amount)}
              </span>
              <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                <form action={reorderAction}>
                  <input type="hidden" name="orderId" value={order.id} />
                  <button
                    type="submit"
                    className={[
                      "text-[12px] font-bold px-4 py-2 rounded transition-colors",
                      isExpanded
                        ? "bg-slate-900 text-white hover:bg-slate-800"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200",
                    ].join(" ")}
                  >
                    Reorder
                  </button>
                </form>
              </div>
            </div>

            {/* Accordion — line items */}
            {isExpanded && (
              <div className="bg-gray-50 px-6 py-6">
                <div className="bg-white border border-gray-100 rounded shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/30">
                        <th className="px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                          SKU
                        </th>
                        <th className="px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                          Unit Price
                        </th>
                        <th className="px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider text-right">
                          Qty
                        </th>
                        <th className="px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider text-right">
                          Subtotal
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {order.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3 text-[13px] font-medium text-slate-900">
                            {item.sku}
                          </td>
                          <td className="px-4 py-3 text-[13px] text-gray-500">
                            {item.product_name}
                          </td>
                          <td className="px-4 py-3 text-[13px] text-gray-500">
                            {ZAR.format(item.unit_price)}
                          </td>
                          <td className="px-4 py-3 text-[13px] text-gray-900 font-medium text-right">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3 text-[13px] text-slate-900 font-medium text-right">
                            {ZAR.format(item.line_total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
