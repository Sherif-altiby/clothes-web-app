import { ProductDetails } from "@/components/product/ProductDetails";

export default async function ProductPage({
    params,
}: {
    params: Promise<{ locale: string; slug: string; id: string }>;
}) {
    const { id } = await params;

    return <ProductDetails key={id} productId={id} />;
}
