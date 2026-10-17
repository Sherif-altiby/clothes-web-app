import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <div className="flex min-h-screen flex-col bg-muted/20 lg:flex-row" dir="rtl">
      <AdminSidebar locale={locale} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
