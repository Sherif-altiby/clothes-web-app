import { OfferDetails } from "@/components/offers/OfferDetails";

export default async function OfferPage({
    params,
}: {
    params: Promise<{ offerId: string }>;
}) {
    const { offerId } = await params;
    return <OfferDetails offerId={offerId} />;
}
