import { OfferStatus, Prisma } from "@prisma/client";
import { prisma } from "../../prisma";
import { Lang } from "../../shared/middlewares/lang.middleware";
import { ApiError } from "../../shared/utils/ApiError";
import { localizeProduct } from "../../shared/utils/localize";
import { resolveProductPrices, isOfferAvailable } from "./offer-pricing";

const offerInclude = {
    products: {
        include: {
            product: { select: { id: true, titleAr: true, titleEn: true } },
        },
    },
    categories: {
        include: {
            category: { select: { id: true, titleAr: true, titleEn: true } },
        },
    },
} satisfies Prisma.OfferInclude;

const localizeOffer = <T extends Prisma.OfferGetPayload<{ include: typeof offerInclude }>>(
    offer: T,
    lang: Lang,
) => ({
    ...offer,
    title: lang === "ar" ? offer.titleAr : offer.titleEn,
    description: lang === "ar" ? offer.descriptionAr : offer.descriptionEn,
});

const validateTargets = async (
    tx: Prisma.TransactionClient,
    productIds: string[],
    categoryIds: string[],
) => {
    const uniqueProductIds = [...new Set(productIds)];
    const uniqueCategoryIds = [...new Set(categoryIds)];
    if (!uniqueProductIds.length && !uniqueCategoryIds.length) {
        throw new ApiError(400, "Select at least one product or category");
    }

    const [products, categories] = await Promise.all([
        tx.product.count({ where: { id: { in: uniqueProductIds } } }),
        tx.category.count({ where: { id: { in: uniqueCategoryIds } } }),
    ]);

    if (products !== uniqueProductIds.length || categories !== uniqueCategoryIds.length) {
        throw new ApiError(400, "One or more selected products or categories do not exist");
    }

    return { uniqueProductIds, uniqueCategoryIds };
};

export const getActiveOffers = async (lang: Lang) => {
    const now = new Date();
    const offers = await prisma.offer.findMany({
        where: {
            status: OfferStatus.ACTIVE,
            startsAt: { lte: now },
            endsAt: { gte: now },
        },
        orderBy: [{ endsAt: "asc" }, { createdAt: "desc" }],
    });

    return offers
        .filter((offer) => Number.isFinite(offer.discount) && offer.discount > 0 && offer.discount <= 100)
        .map((offer) => ({
        id: offer.id,
        title: lang === "ar" ? offer.titleAr : offer.titleEn,
        description: lang === "ar" ? offer.descriptionAr : offer.descriptionEn,
        image: offer.image,
        discount: offer.discount,
        startsAt: offer.startsAt,
        endsAt: offer.endsAt,
        }));
};

export const getActiveOfferById = async (id: string, lang: Lang) => {
    const offer = await prisma.offer.findUnique({
        where: { id },
        include: {
            products: { select: { productId: true } },
            categories: { select: { categoryId: true } },
        },
    });
    const now = new Date();

    if (!offer || !isOfferAvailable(offer, now)) {
        throw new ApiError(404, "Offer not found");
    }

    const productIds = offer.products.map((entry) => entry.productId);
    const categoryIds = offer.categories.map((entry) => entry.categoryId);
    const products = await prisma.product.findMany({
        where: {
            OR: [
                ...(productIds.length ? [{ id: { in: productIds } }] : []),
                ...(categoryIds.length ? [{ categoryId: { in: categoryIds } }] : []),
            ],
        },
        include: { category: { select: { titleAr: true, titleEn: true } } },
        orderBy: { createdAt: "desc" },
    });
    const prices = await resolveProductPrices(prisma, products, now);

    return {
        id: offer.id,
        title: lang === "ar" ? offer.titleAr : offer.titleEn,
        description: lang === "ar" ? offer.descriptionAr : offer.descriptionEn,
        image: offer.image,
        discount: offer.discount,
        startsAt: offer.startsAt,
        endsAt: offer.endsAt,
        products: products.map((product) => {
            const price = prices.get(product.id);
            if (!price) throw new ApiError(500, "Could not calculate offer product price");

            return {
                ...localizeProduct(product, lang),
                categoryTitle: lang === "ar" ? product.category.titleAr : product.category.titleEn,
                ...price,
            };
        }),
    };
};

export const getAdminOffers = async () => {
    const offers = await prisma.offer.findMany({
        include: offerInclude,
        orderBy: [{ createdAt: "desc" }],
    });
    const now = new Date();

    return offers.map((offer) => ({
        ...localizeOffer(offer, "en"),
        effectiveStatus:
            offer.status !== OfferStatus.ACTIVE
                ? offer.status
                : offer.startsAt > now
                  ? "UPCOMING"
                  : offer.endsAt < now
                    ? "EXPIRED"
                    : "ACTIVE",
    }));
};

export const createOffer = async (
    input: {
        titleAr: string;
        titleEn: string;
        descriptionAr: string;
        descriptionEn: string;
        image: string;
        discount: number;
        startsAt: Date;
        endsAt: Date;
        productIds: string[];
        categoryIds: string[];
    },
) =>
    prisma.$transaction(async (tx) => {
        const targets = await validateTargets(tx, input.productIds, input.categoryIds);
        return tx.offer.create({
            data: {
                titleAr: input.titleAr,
                titleEn: input.titleEn,
                descriptionAr: input.descriptionAr,
                descriptionEn: input.descriptionEn,
                image: input.image,
                discount: input.discount,
                startsAt: input.startsAt,
                endsAt: input.endsAt,
                products: {
                    create: targets.uniqueProductIds.map((productId) => ({ productId })),
                },
                categories: {
                    create: targets.uniqueCategoryIds.map((categoryId) => ({ categoryId })),
                },
            },
            include: offerInclude,
        });
    });

export const updateOffer = async (
    id: string,
    input: Partial<{
        titleAr: string;
        titleEn: string;
        descriptionAr: string;
        descriptionEn: string;
        image: string;
        discount: number;
        startsAt: Date;
        endsAt: Date;
        productIds: string[];
        categoryIds: string[];
    }>,
) =>
    prisma.$transaction(async (tx) => {
        const current = await tx.offer.findUnique({
            where: { id },
            include: {
                products: { select: { productId: true } },
                categories: { select: { categoryId: true } },
            },
        });
        if (!current) throw new ApiError(404, "Offer not found");
        if (current.status === OfferStatus.ARCHIVED) {
            throw new ApiError(400, "Archived offers cannot be edited");
        }

        const startsAt = input.startsAt ?? current.startsAt;
        const endsAt = input.endsAt ?? current.endsAt;
        if (endsAt <= startsAt) throw new ApiError(400, "Offer end date must be after its start date");

        const productIds = input.productIds ?? current.products.map((entry) => entry.productId);
        const categoryIds = input.categoryIds ?? current.categories.map((entry) => entry.categoryId);
        const targets = await validateTargets(tx, productIds, categoryIds);

        return tx.offer.update({
            where: { id },
            data: {
                ...(input.titleAr !== undefined && { titleAr: input.titleAr }),
                ...(input.titleEn !== undefined && { titleEn: input.titleEn }),
                ...(input.descriptionAr !== undefined && { descriptionAr: input.descriptionAr }),
                ...(input.descriptionEn !== undefined && { descriptionEn: input.descriptionEn }),
                ...(input.image !== undefined && { image: input.image }),
                ...(input.discount !== undefined && { discount: input.discount }),
                startsAt,
                endsAt,
                products: {
                    deleteMany: {},
                    create: targets.uniqueProductIds.map((productId) => ({ productId })),
                },
                categories: {
                    deleteMany: {},
                    create: targets.uniqueCategoryIds.map((categoryId) => ({ categoryId })),
                },
            },
            include: offerInclude,
        });
    });

export const updateOfferStatus = async (id: string, status: OfferStatus) =>
    prisma.$transaction(async (tx) => {
        const offer = await tx.offer.findUnique({
            where: { id },
            include: {
                products: { select: { productId: true } },
                categories: { select: { categoryId: true } },
            },
        });
        if (!offer) throw new ApiError(404, "Offer not found");
        if (offer.status === OfferStatus.ARCHIVED && status !== OfferStatus.ARCHIVED) {
            throw new ApiError(400, "Archived offers cannot be reactivated");
        }
        if (offer.status === status) {
            return tx.offer.findUniqueOrThrow({ where: { id }, include: offerInclude });
        }
        if (status === OfferStatus.ACTIVE && !offer.products.length && !offer.categories.length) {
            throw new ApiError(400, "An offer must target at least one product or category before activation");
        }

        return tx.offer.update({
            where: { id },
            data: { status },
            include: offerInclude,
        });
    });
