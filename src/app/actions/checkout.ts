"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { adminClient } from "@/lib/supabase/admin";
import type { Route } from "next";

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------

const CartItemSchema = z.object({
  productId: z.string().uuid(),
  sku: z.string().min(1),
  name: z.string().min(1),
  unitPrice: z.number().nonnegative(),
  quantity: z.number().int().positive(),
  primaryImageUrl: z.string().nullable().optional(),
  variantInfo: z
    .object({ label: z.string(), value: z.string() })
    .nullable()
    .optional(),
});

const CheckoutSchema = z.array(CartItemSchema).min(1, "Cart is empty");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Round to 2 decimal places — matches PostgreSQL ROUND(x, 2) for normal values. */
function r2(n: number): number {
  return parseFloat(n.toFixed(2));
}

// ---------------------------------------------------------------------------
// checkoutAction
// ---------------------------------------------------------------------------

/**
 * Validates the cart, writes order + order_items atomically, then diverges:
 *   buyer_default  → /checkout/payment?orderId=...  (EFT flow)
 *   buyer_30_day   → /checkout/confirmed?orderId=... (auto-confirmed)
 *
 * Returns { error } on validation / DB failure (caller shows the message).
 * On success redirect() is called — function never returns to the client.
 */
export async function checkoutAction(
  rawItems: unknown
): Promise<{ error: string } | void> {
  // 1. Authenticate
  const session = await getSession();
  if (!session) redirect("/login" as Route);

  // 2. Validate cart payload (passed from client Zustand store)
  const parsed = CheckoutSchema.safeParse(rawItems);
  if (!parsed.success) {
    return { error: "Invalid cart data. Please refresh and try again." };
  }
  const items = parsed.data;

  // 3. Fetch tenant VAT rate (default 15% if config not found)
  const { data: config } = await adminClient
    .from("tenant_config")
    .select("vat_rate")
    .eq("id", 1)
    .single();

  const vatRate = Number(config?.vat_rate ?? 0.15);

  // 4. Compute financials
  //    line_total per item = ROUND(unitPrice * quantity, 2)  (discount_pct = 0)
  //    subtotal = sum of line totals
  //    vat_amount = ROUND(subtotal * vatRate, 2)
  //    total_amount = subtotal + vat_amount
  const lineTotals = items.map((item) => r2(item.unitPrice * item.quantity));
  const subtotal = r2(lineTotals.reduce((s, lt) => s + lt, 0));
  const vatAmount = r2(subtotal * vatRate);
  const totalAmount = r2(subtotal + vatAmount);

  // 5. Determine role-dependent fields
  const is30Day = session.role === "buyer_30_day";
  const paymentMethod = is30Day ? ("30_day_account" as const) : ("eft" as const);
  const initialStatus = is30Day ? ("confirmed" as const) : ("pending" as const);
  const now = new Date().toISOString();

  // 6. Insert order row
  const { data: order, error: orderError } = await adminClient
    .from("orders")
    .insert({
      profile_id: session.profileId,
      status: initialStatus,
      payment_method: paymentMethod,
      subtotal,
      discount_amount: 0,
      vat_amount: vatAmount,
      total_amount: totalAmount,
      ...(is30Day ? { confirmed_at: now } : {}),
    })
    .select("id, reference_number")
    .single();

  if (orderError || !order) {
    console.error("[checkout] order insert:", orderError?.message);
    return { error: "Failed to create order. Please try again." };
  }

  // 7. Insert order_items
  //    line_total must equal ROUND(unit_price * quantity * (1 - discount_pct/100), 2)
  //    With discount_pct = 0: line_total = ROUND(unit_price * quantity, 2)
  const orderItemRows = items.map((item, idx) => ({
    order_id: order.id,
    product_id: item.productId,
    sku: item.sku,
    product_name: item.name,
    unit_price: item.unitPrice,
    quantity: item.quantity,
    discount_pct: 0,
    line_total: lineTotals[idx], // already rounded above
    variant_info: item.variantInfo ?? null,
  }));

  const { error: itemsError } = await adminClient
    .from("order_items")
    .insert(orderItemRows);

  if (itemsError) {
    // Compensating delete — order_items failed, order is unusable
    await adminClient.from("orders").delete().eq("id", order.id);
    console.error("[checkout] order_items insert:", itemsError.message);
    return { error: "Failed to save order items. Please try again." };
  }

  // 8. Divergent redirect
  if (is30Day) {
    redirect(`/checkout/confirmed?orderId=${order.id}` as Route);
  } else {
    redirect(`/checkout/payment?orderId=${order.id}` as Route);
  }
}

// ---------------------------------------------------------------------------
// markPaymentSubmittedAction
// ---------------------------------------------------------------------------

/**
 * Called from the EFT payment page when the buyer clicks "I have made payment".
 * Records a pending payment submission and redirects to the confirmation page.
 * The order remains in 'pending' status until an admin verifies via the admin
 * dashboard (Phase 5).
 */
export async function markPaymentSubmittedAction(
  formData: FormData
): Promise<{ error: string } | void> {
  const session = await getSession();
  if (!session) redirect("/login" as Route);

  const orderId = formData.get("orderId") as string | null;
  if (!orderId) return { error: "Missing order ID." };

  // Verify this order belongs to the authenticated buyer
  const { data: order, error: fetchError } = await adminClient
    .from("orders")
    .select("id, total_amount, payment_method, profile_id")
    .eq("id", orderId)
    .eq("profile_id", session.profileId)
    .single();

  if (fetchError || !order) {
    return { error: "Order not found." };
  }

  // Insert a pending payment submission record
  const { error: paymentError } = await adminClient.from("payments").insert({
    order_id: order.id,
    payment_method: order.payment_method as "eft" | "30_day_account",
    amount: Number(order.total_amount),
    status: "pending",
  });

  if (paymentError) {
    console.error("[payment] insert:", paymentError.message);
    return { error: "Failed to record payment. Please try again." };
  }

  redirect(`/checkout/confirmed?orderId=${orderId}` as Route);
}
