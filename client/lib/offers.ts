export const OFFER_CAMPAIGNS = [
    {
        id: "outerwear",
        category: "jackets",
        discount: 40,
        image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1200&q=85",
    },
    {
        id: "footwear",
        category: "shoes",
        discount: 30,
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=85",
    },
    {
        id: "activewear",
        category: "sportswear",
        discount: 25,
        image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=85",
    },
] as const;

export type OfferId = (typeof OFFER_CAMPAIGNS)[number]["id"];
type OfferCampaign = (typeof OFFER_CAMPAIGNS)[number];

export function getOffer(id: OfferId): OfferCampaign;
export function getOffer(id: string): OfferCampaign | undefined;
export function getOffer(id: string) {
    return OFFER_CAMPAIGNS.find((offer) => offer.id === id);
}
