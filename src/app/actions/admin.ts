"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { adminClient } from "@/lib/supabase/admin";
import type { Route } from "next";
import type { Database } from "@/lib/supabase/types";

type OrderStatus = Database["public"]["Tables"]["orders"]["Row"]["status"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function requireAdmin() {
  const session = await getSession();
  if (!session?.isAdmin) redirect("/admin/login" as Route);
  return session;
}

// ---------------------------------------------------------------------------
// markProcessedAction
// ---------------------------------------------------------------------------

/**
 * Marks an order as fulfilled ("processed in POS").
 * Called from the Order Ledger expanded row.
 */
export async function markProcessedAction(
  formData: FormData
): Promise<{ error: string } | void> {
  await requireAdmin();

  const orderId = formData.get("orderId") as string | null;
  if (!orderId) return { error: "Missing order ID." };

  const { error } = await adminClient
    .from("orders")
    .update({ status: "fulfilled", fulfilled_at: new Date().toISOString() })
    .eq("id", orderId);

  if (error) {
    console.error("[admin] markProcessed:", error.message);
    return { error: "Failed to update order. Please try again." };
  }
}

// ---------------------------------------------------------------------------
// exportOrdersCsvAction
// ---------------------------------------------------------------------------

/**
 * Streams a CSV of all orders matching the provided filters.
 * Returns the CSV string to the client for download.
 *
 * Filters (all optional, passed as FormData):
 *   status   — OrderStatus value
 *   dateFrom — ISO date string
 *   dateTo   — ISO date string
 *   search   — reference_number or business_name substring
 */
export async function exportOrdersCsvAction(
  formData: FormData
): Promise<{ csv: string } | { error: string }> {
  await requireAdmin();

  const status = (formData.get("status") as string | null) || null;
  const dateFrom = (formData.get("dateFrom") as string | null) || null;
  const dateTo = (formData.get("dateTo") as string | null) || null;
  const search = (formData.get("search") as string | null) || null;

  // Build query — join profiles for business name
  let query = adminClient
    .from("orders")
    .select(
      `id, reference_number, created_at, status, payment_method,
       subtotal, vat_amount, total_amount,
       profiles ( business_name, account_number, email ),
       order_items ( sku, product_name, quantity, unit_price, line_total )`
    )
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status as OrderStatus);
  if (dateFrom) query = query.gte("created_at", dateFrom);
  if (dateTo) query = query.lte("created_at", dateTo);

  const { data: orders, error } = await query;

  if (error) {
    console.error("[admin] exportCsv:", error.message);
    return { error: "Failed to fetch orders for export." };
  }

  // Build CSV rows
  const header = [
    "Order Date",
    "Reference",
    "Account No.",
    "Business Name",
    "Email",
    "SKU",
    "Product",
    "Qty",
    "Unit Price",
    "Line Total",
    "Subtotal",
    "VAT",
    "Total",
    "Payment Method",
    "Status",
  ].join(",");

  type RawProfile = { business_name: string; account_number: string | null; email: string | null };
  type RawItem = { sku: string; product_name: string; quantity: number; unit_price: number; line_total: number };

  const rows: string[] = [header];

  for (const order of orders ?? []) {
    const profile = order.profiles as RawProfile | null;
    const items = (order.order_items as RawItem[]) ?? [];
    const bizName = profile?.business_name ?? "";
    const accNo = profile?.account_number ?? "";
    const email = profile?.email ?? "";
    const date = new Date(order.created_at).toLocaleDateString("en-ZA");

    if (items.length === 0) {
      rows.push(
        [
          date, order.reference_number, accNo, csvEsc(bizName), email,
          "", "", "", "", "",
          order.subtotal, order.vat_amount, order.total_amount,
          order.payment_method, order.status,
        ].join(",")
      );
    } else {
      items.forEach((item, idx) => {
        rows.push(
          [
            idx === 0 ? date : "",
            idx === 0 ? order.reference_number : "",
            idx === 0 ? accNo : "",
            idx === 0 ? csvEsc(bizName) : "",
            idx === 0 ? email : "",
            item.sku,
            csvEsc(item.product_name),
            item.quantity,
            item.unit_price,
            item.line_total,
            idx === 0 ? order.subtotal : "",
            idx === 0 ? order.vat_amount : "",
            idx === 0 ? order.total_amount : "",
            idx === 0 ? order.payment_method : "",
            idx === 0 ? order.status : "",
          ].join(",")
        );
      });
    }
  }

  return { csv: rows.join("\n") };
}

function csvEsc(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
