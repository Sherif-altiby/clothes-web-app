import { CategoryProducts } from "@/components/category/CategoryProducts";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;

  return (
    <main className="container mx-auto px-4">
      <CategoryProducts categoryId={slug} />
    </main>
  );
}
