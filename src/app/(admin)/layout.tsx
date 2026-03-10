import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { adminClient } from "@/lib/supabase/admin";
import { Bell, ChevronDown } from "lucide-react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import type { Route } from "next";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session?.isAdmin) redirect("/admin/login" as Route);

  // Fetch admin's own profile for sidebar display
  const { data: profile } = await adminClient
    .from("profiles")
    .select("contact_name, email")
    .eq("id", session.profileId)
    .single();

  const adminName = profile?.contact_name ?? "Admin";
  const adminEmail = profile?.email ?? "";

  return (
    <div className="min-h-screen bg-slate-50 flex font-inter">
      <AdminSidebar adminName={adminName} adminEmail={adminEmail} />

      {/* Main area */}
      <div className="flex-1 ml-[250px] flex flex-col min-h-screen">
        {/* Top header — no global search per design spec */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-end px-8 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button className="relative w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors">
              <Bell className="w-5 h-5 text-slate-500" />
            </button>
            <div className="w-px h-8 bg-slate-200" />
            <div className="flex items-center gap-3 cursor-default">
              <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center text-xs text-white font-semibold">
                {adminName
                  .split(" ")
                  .slice(0, 2)
                  .map((w) => w[0]?.toUpperCase() ?? "")
                  .join("")}
              </div>
              <div className="hidden xl:block">
                <p className="text-sm font-medium text-slate-700">{adminName}</p>
                <p className="text-[11px] text-slate-400">Admin</p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 hidden xl:block" />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
