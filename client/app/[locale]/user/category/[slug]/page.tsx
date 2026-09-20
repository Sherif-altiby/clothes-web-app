import { PriceFilter } from "@/components/PriceFilter";
import { ProductCard } from "@/components/ProductCard";

// Temporary mock data – replace with a real query using `slug`
const PRODUCTS = Array.from({ length: 7 }, (_, i) => ({
  id: String(i + 1), // unique ids, so React keys and product links are correct
  title: "title",
  description:
    "Download the perfect product pictures. Find over 100+ of the best free product images. Free for commercial use No attribution required Copyright-free",
  price: 100,
  discountPercentage: 15,
  imageUrl:
    "https://tse1.mm.bing.net/th/id/OIP.Pd8LTgAHnthn7qC6qQxVggHaLH?rs=1&pid=ImgDetMain&o=7&rm=3",
}));

// params is a Promise in Next.js 15 (awaiting also works on 14)
const Page = async ({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) => {
  const { slug } = await params;  

  return (
    <div className="flex mt-10 gap-4">
      <div className="sticky top-20 h-fit">
        <PriceFilter />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {PRODUCTS.map((product) => (
          <ProductCard key={product.id} {...product} category={slug} />
        ))}
      </div>
    </div>
  );
};

export default Page;
