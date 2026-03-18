import { adminClient } from "@/lib/supabase/admin";
import GlobalBanner from "@/components/portal/GlobalBanner";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch banner state — adminClient bypasses RLS; data is non-sensitive
  const { data: settings } = await adminClient
    .from("global_settings")
    .select("banner_message, is_banner_active")
    .eq("id", 1)
    .single();

  const showBanner =
    settings?.is_banner_active === true &&
    typeof settings.banner_message === "string" &&
    settings.banner_message.trim().length > 0;

  return (
    <>
      {showBanner && <GlobalBanner message={settings!.banner_message!} />}
      {children}
    </>
  );
}
