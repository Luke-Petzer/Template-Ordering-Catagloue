// Phase 2: Product catalog renders here.
// Placeholder confirms auth + middleware are working correctly.
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <main className="container mx-auto px-4 py-10 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Product Catalogue</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Account:{" "}
            <span className="font-mono font-medium">
              {session.accountNumber}
            </span>
          </p>
        </div>
        <form action={logoutAction}>
          <Button variant="outline" size="sm" type="submit">
            Sign Out
          </Button>
        </form>
      </div>
      <p className="text-muted-foreground">
        Phase 2 — Product catalog coming soon.
      </p>
    </main>
  );
}
