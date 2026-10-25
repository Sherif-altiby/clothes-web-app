import { OfferStatus, Prisma, PrismaClient, Product } from "@prisma/client";
import { ApiError } from "../../shared/utils/ApiError";
import { round2 } from "../../shared/utils/price";

type OfferReader = Prisma.TransactionClient | PrismaClient;

export interface ProductPrice {
    originalUnitPrice: number;
    unitPrice: number;
    discountPercentage: number;
    offerId: string | null;
    offerTitleAr: string | null;
    offerTitleEn: string | null;
}

export const resolveProductPrices = async (
    reader: OfferReader,
    products: Pick<Product, "id" | "categoryId" | "baseSalary" | "profit" | "discount">[],
    at = new Date(),
) => {
    const productIds = [...new Set(products.map((product) => product.id))];
    const categoryIds = [...new Set(products.map((product) => product.categoryId))];

    if (!productIds.length) return new Map<string, ProductPrice>();

    const offers = await reader.offer.findMany({
        where: {
            status: OfferStatus.ACTIVE,
            startsAt: { lte: at },
            endsAt: { gte: at },
            OR: [
                { products: { some: { productId: { in: productIds } } } },
                { categories: { some: { categoryId: { in: categoryIds } } } },
            ],
        },
        include: {
            products: { select: { productId: true } },
            categories: { select: { categoryId: true } },
        },
        orderBy: [{ discount: "desc" }, { endsAt: "asc" }, { id: "asc" }],
    });

    const prices = new Map<string, ProductPrice>();

    for (const product of products) {
        const originalUnitPrice = round2(product.baseSalary + product.profit);
        const productDiscount = product.discount ?? 0;

        if (
            !Number.isFinite(originalUnitPrice) ||
            originalUnitPrice <= 0 ||
            !Number.isFinite(productDiscount) ||
            productDiscount < 0 ||
            productDiscount > 100
        ) {
            throw new ApiError(409, "A product has invalid pricing and cannot be purchased");
        }

        const applicableOffer = offers.find(
            (offer) =>
                offer.discount > productDiscount &&
                Number.isFinite(offer.discount) &&
                offer.discount > 0 &&
                offer.discount <= 100 &&
                (offer.products.some((entry) => entry.productId === product.id) ||
                    offer.categories.some((entry) => entry.categoryId === product.categoryId)),
        );
        const discountPercentage = applicableOffer?.discount ?? productDiscount;

        prices.set(product.id, {
            originalUnitPrice,
            unitPrice: round2(originalUnitPrice * (1 - discountPercentage / 100)),
            discountPercentage,
            offerId: applicableOffer?.id ?? null,
            offerTitleAr: applicableOffer?.titleAr ?? null,
            offerTitleEn: applicableOffer?.titleEn ?? null,
        });
    }

    return prices;
};

export const isOfferAvailable = (
    offer: { status: OfferStatus; startsAt: Date; endsAt: Date; discount: number },
    at = new Date(),
) =>
    offer.status === OfferStatus.ACTIVE &&
    Number.isFinite(offer.discount) &&
    offer.discount > 0 &&
    offer.discount <= 100 &&
    offer.startsAt.getTime() <= at.getTime() &&
    offer.endsAt.getTime() >= at.getTime();
