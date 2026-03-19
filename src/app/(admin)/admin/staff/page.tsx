import { adminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import type { Route } from "next";
import StaffInviteForm from "@/components/admin/StaffInviteForm";

export const metadata = { title: "Staff | Admin" };

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
        isActive
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-slate-100 text-slate-500 border-slate-200"
      }`}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

export default async function StaffPage() {
  const session = await getSession();
  if (!session?.isAdmin) redirect("/admin/login" as Route);

  // Determine super-admin status (only they can see the invite form)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const superEmail = process.env.ADMIN_SUPER_EMAIL;
  const isSuperAdmin = Boolean(
    superEmail && user?.email && user.email === superEmail
  );

  // Fetch all admin profiles, ordered by join date
  const { data: admins } = await adminClient
    .from("profiles")
    .select("id, contact_name, email, is_active, created_at")
    .eq("role", "admin")
    .order("created_at", { ascending: true });

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
          Staff Management
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Admin users who can access this dashboard. Keep Supabase credentials
          private — manage all access from here.
        </p>
      </div>

      {/* Invite form — super admin only */}
      {isSuperAdmin && (
        <div className="mb-8">
          <StaffInviteForm />
        </div>
      )}

      {/* Current staff list */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">
            Current Staff
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {admins?.length ?? 0} admin{(admins?.length ?? 0) !== 1 ? "s" : ""}{" "}
            registered
          </p>
        </div>

        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="px-6 py-3.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-3.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Status
              </th>
              {isSuperAdmin && (
                <th className="px-6 py-3.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                  Role
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {(admins ?? []).length === 0 ? (
              <tr>
                <td
                  colSpan={isSuperAdmin ? 5 : 4}
                  className="px-6 py-16 text-center text-sm text-slate-400"
                >
                  No admin users found.
                </td>
              </tr>
            ) : (
              (admins ?? []).map((admin) => {
                const isSelf = admin.id === session.profileId;
                const isSuper = admin.email === superEmail;
                const joined = new Date(admin.created_at);

                return (
                  <tr
                    key={admin.id}
                    className={`hover:bg-slate-50/50 transition-colors ${
                      isSelf ? "bg-blue-50/30" : ""
                    }`}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {admin.contact_name}
                      {isSelf && (
                        <span className="ml-2 text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-1.5 py-0.5">
                          You
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {admin.email ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {joined.toLocaleDateString("en-ZA", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge isActive={admin.is_active} />
                    </td>
                    {isSuperAdmin && (
                      <td className="px-6 py-4 text-[11px] text-slate-500">
                        {isSuper ? (
                          <span className="font-semibold text-slate-700">
                            Super Admin
                          </span>
                        ) : (
                          "Staff"
                        )}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
