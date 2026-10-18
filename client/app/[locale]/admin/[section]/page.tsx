import { notFound } from "next/navigation";
import { AdminCategoriesDashboard } from "@/components/admin/AdminCategoriesDashboard";
import { AdminReviewsDashboard } from "@/components/admin/AdminReviewsDashboard";
import { AdminSectionPlaceholder } from "@/components/admin/AdminSectionPlaceholder";

const sections = ["orders", "reviews", "hero", "moderators"] as const;

export default async function AdminSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;

  if (section === "categories") {
    return <AdminCategoriesDashboard />;
  }

  if (section === "reviews") {
    return <AdminReviewsDashboard />;
  }

  if (!sections.includes(section as (typeof sections)[number])) {
    notFound();
  }

  return <AdminSectionPlaceholder section={section as (typeof sections)[number]} />;
}
