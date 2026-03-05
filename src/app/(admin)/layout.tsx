// Admin layout — wraps all admin routes (/admin/dashboard, /admin/products, etc.)
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-background">{children}</div>;
}
