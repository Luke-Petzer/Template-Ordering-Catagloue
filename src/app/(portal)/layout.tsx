// Portal layout — wraps all buyer-facing routes (/dashboard, /orders, /cart)
export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-background">{children}</div>;
}
