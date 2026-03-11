import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { adminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { LogOut } from "lucide-react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { logoutAction } from "@/app/actions/auth";
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

  // Determine super admin status via Supabase Auth email
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const superEmail = process.env.ADMIN_SUPER_EMAIL;
  const isSuperAdmin = Boolean(
    superEmail && user?.email && user.email === superEmail
  );

  return (
    <div className="min-h-screen bg-slate-50 flex font-inter">
      <AdminSidebar adminName={adminName} adminEmail={adminEmail} isSuperAdmin={isSuperAdmin} />

      {/* Main area */}
      <div className="flex-1 ml-[250px] flex flex-col min-h-screen">
        {/* Top header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-20">
          <p className="text-sm font-medium text-slate-700">
            {adminName}
            <span className="ml-2 text-[11px] font-normal text-slate-400">Admin</span>
          </p>
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex items-center gap-2 h-9 px-4 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </form>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-scroll p-8">{children}</main>
      </div>
    </div>
  );
}
