"use client";

import { useState, useTransition, useRef } from "react";
import { Loader2, Send, CheckCircle2 } from "lucide-react";
import { inviteStaffAction } from "@/app/actions/admin";

export default function StaffInviteForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSent(false);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await inviteStaffAction(formData);
      if (result && "error" in result) {
        setError(result.error);
      } else {
        setSent(true);
        formRef.current?.reset();
      }
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="px-6 py-5 border-b border-slate-100">
        <h2 className="text-base font-semibold text-slate-900">
          Invite Staff Member
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">
          An invite email will be sent. The new admin can set their password via
          the link.
        </p>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              name="contact_name"
              required
              placeholder="e.g. Jane Smith"
              className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              required
              placeholder="admin@company.com"
              className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
            />
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-600 font-medium">{error}</p>
        )}

        {sent && (
          <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            Invite sent! The new admin will receive an email with a sign-in link.
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="h-10 px-5 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-40 disabled:pointer-events-none flex items-center gap-2"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {isPending ? "Sending…" : "Send Invitation"}
          </button>
        </div>
      </form>
    </div>
  );
}
