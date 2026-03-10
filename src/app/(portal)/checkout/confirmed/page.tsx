import { getSession } from "@/lib/auth/session";
import { redirect, notFound } from "next/navigation";
import { adminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { CheckCircle2, Layers, ArrowLeft, Download } from "lucide-react";
import CartClearer from "./CartClearer";

const ZAR = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  minimumFractionDigits: 2,
});

interface PageProps {
  searchParams: Promise<{ orderId?: string }>;
}

export default async function ConfirmedPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { orderId } = await searchParams;
  if (!orderId) notFound();

  // Fetch order, scoped to this buyer
  const { data: order } = await adminClient
    .from("orders")
    .select("id, reference_number, total_amount, payment_method, status")
    .eq("id", orderId)
    .eq("profile_id", session.profileId)
    .single();

  if (!order) notFound();

  const isEft = order.payment_method === "eft";

  // Fetch bank details if needed (EFT buyers need to see them again)
  const { data: config } = await adminClient
    .from("tenant_config")
    .select(
      "business_name, bank_name, bank_account_holder, bank_account_number, bank_branch_code, bank_account_type, bank_reference_prefix, email_from_address"
    )
    .eq("id", 1)
    .single();

  const bankRef = `${config?.bank_reference_prefix ?? "INV"}-${order.reference_number}`;

  return (
    <div className="min-h-screen flex flex-col items-center relative bg-[#fafafa]">
      {/* Floating blurred nav — matches ea88ab06 design */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-7xl h-[64px] rounded-2xl border border-gray-100 bg-white/80 backdrop-blur-md flex items-center justify-between px-8 z-50 shadow-sm">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-900 rounded flex items-center justify-center">
              <Layers className="text-white w-[18px] h-[18px]" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              {config?.business_name ?? "Portal"}
            </span>
          </Link>
          <div className="flex items-center gap-8 ml-4">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-gray-400 hover:text-slate-900 transition-colors"
            >
              Catalogue
            </Link>
            <Link
              href="/orders"
              className="text-sm font-medium text-gray-400 hover:text-slate-900 transition-colors"
            >
              Order History
            </Link>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center w-full px-6 pt-32 pb-12">
        {/* Cart clear on mount — client component */}
        <CartClearer />

        {/* Success card */}
        <div className="w-full max-w-[560px] bg-white border border-gray-100 rounded-3xl p-10 flex flex-col items-center text-center shadow-sm">
          {/* Icon + heading */}
          <div className="mb-8">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-6 mx-auto">
              <CheckCircle2 className="w-9 h-9 text-green-600" />
            </div>
            <h1 className="text-[24px] font-semibold text-slate-900">
              Order Confirmed
            </h1>
            <p className="text-sm text-gray-400 mt-2">
              {isEft
                ? "Thank you. Please complete your EFT transfer to finalise the order."
                : "Your order is confirmed and will be invoiced to your 30-day account."}
            </p>
          </div>

          {/* Reference + total box */}
          <div className="w-full bg-slate-50 rounded-2xl p-6 text-left mb-8">
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-slate-200">
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Order Reference
                </p>
                <p className="text-sm font-medium text-slate-900">
                  #{order.reference_number}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Total Amount
                </p>
                <p className="text-sm font-medium text-slate-900">
                  {ZAR.format(Number(order.total_amount))}
                </p>
              </div>
            </div>

            {/* EFT bank details — only for eft payment method */}
            {isEft && (
              <div className="space-y-4">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  Payment Details (EFT)
                </p>
                <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                  <div>
                    <p className="text-[12px] text-gray-500 mb-0.5">Bank</p>
                    <p className="text-[14px] font-medium text-slate-900">
                      {config?.bank_name ?? "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[12px] text-gray-500 mb-0.5">
                      Account Name
                    </p>
                    <p className="text-[14px] font-medium text-slate-900">
                      {config?.bank_account_holder ?? config?.business_name ?? "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[12px] text-gray-500 mb-0.5">
                      Account Number
                    </p>
                    <p className="text-[14px] font-medium text-slate-900">
                      {config?.bank_account_number ?? "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[12px] text-gray-500 mb-0.5">
                      Branch Code
                    </p>
                    <p className="text-[14px] font-medium text-slate-900">
                      {config?.bank_branch_code ?? "—"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[12px] text-gray-500 mb-0.5">
                      Payment Reference
                    </p>
                    <p className="text-[14px] font-bold text-slate-900">
                      {bankRef}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 30-day account message */}
            {!isEft && (
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Account Terms
                </p>
                <p className="text-[14px] text-gray-600">
                  This order will be raised against your 30-day credit account.
                  An invoice will be sent to your registered email address.
                </p>
              </div>
            )}
          </div>

          {/* Download invoice CTA — wired in Phase 4 */}
          <button
            type="button"
            disabled
            className="w-full h-12 flex items-center justify-center gap-2 bg-slate-900 text-white rounded-xl font-semibold text-sm hover:bg-slate-800 active:scale-[0.98] transition-all mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
            title="PDF invoice available after Phase 4"
          >
            <Download className="w-5 h-5" />
            Download Invoice PDF
          </button>

          <p className="text-[13px] text-gray-400">
            A confirmation has been sent to your registered business email.
          </p>

          <div className="mt-10 pt-8 border-t border-gray-100 w-full">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-slate-900 hover:text-slate-700 inline-flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Catalogue
            </Link>
          </div>
        </div>
      </main>

      <footer className="py-8">
        <p className="text-[11px] text-gray-300 tracking-widest uppercase">
          {config?.business_name ?? "Portal"}
        </p>
      </footer>
    </div>
  );
}
