import { notFound } from "next/navigation";
import { OfferDetails } from "@/components/offers/OfferDetails";
import { getOffer } from "@/lib/offers";

export default async function OfferPage({
    params,
}: {
    params: Promise<{ offerId: string }>;
}) {
    const { offerId } = await params;
    const offer = getOffer(offerId);

    if (!offer) notFound();

    return <OfferDetails offerId={offer.id} />;
}
