import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { adminClient } from "@/lib/supabase/admin";
import NavBar from "@/components/portal/NavBar";
import CatalogueShell from "./CatalogueShell";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const { data: products, error } = await adminClient
    .from("products")
    .select(
      `id, sku, name, description, price,
       discount_type, discount_threshold, discount_value,
       product_images ( url, is_primary, display_order )`
    )
    .eq("is_active", true)
    .order("sku");

  if (error) {
    console.error("[dashboard] products fetch error:", error.message);
  }

  const rows = (products ?? []).map((p) => {
    const images = (p.product_images ?? []) as {
      url: string;
      is_primary: boolean;
      display_order: number;
    }[];
    const sorted = [...images].sort((a, b) => {
      if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
      return a.display_order - b.display_order;
    });
    return {
      productId: p.id,
      sku: p.sku,
      name: p.name,
      description: p.description as string | null,
      price: Number(p.price),
      primaryImageUrl: sorted[0]?.url ?? null,
      discountType: (p.discount_type as "percentage" | "fixed" | null) ?? null,
      discountThreshold: p.discount_threshold as number | null,
      discountValue: p.discount_value != null ? Number(p.discount_value) : null,
    };
  });

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-white">
      <NavBar />
      <CatalogueShell products={rows} />
    </div>
  );
}
