import { Construction } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const sectionContent = {
  orders: {
    title: "إدارة الطلبات",
    description: "متابعة طلبات المتجر وتحديث حالتها.",
  },
  reviews: {
    title: "إدارة التقييمات",
    description: "مراجعة تقييمات المنتجات ومتابعة تعليقات العملاء.",
  },
  hero: {
    title: "إدارة الواجهة الرئيسية",
    description: "إدارة الشرائح والعروض الظاهرة في الصفحة الرئيسية.",
  },
  moderators: {
    title: "إدارة المشرفين",
    description: "إدارة صلاحيات المشرفين وحساباتهم.",
  },
} as const;

export function AdminSectionPlaceholder({ section }: { section: keyof typeof sectionContent }) {
  const content = sectionContent[section];

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:py-14" dir="rtl">
      <p className="text-sm font-semibold tracking-wide text-primary">لوحة الإدارة</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground">{content.title}</h1>
      <Card className="mt-8 rounded-2xl border-border/70">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Construction className="h-5 w-5 text-primary" aria-hidden="true" />
            {content.title}
          </CardTitle>
          <CardDescription>{content.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-7 text-muted-foreground">
            هذه الصفحة قيد التطوير. لا تتوفر حاليًا واجهة إدارة مكتملة لهذا القسم.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
