// products.services.ts
import { Prisma } from "@prisma/client";
import { prisma } from "../../../prisma";
import { ApiError } from "../../../shared/utils/ApiError";
import { Lang } from "../../../shared/middlewares/lang.middleware";
import { localizeCategoryTitle, localizeProduct } from "../../../shared/utils/localize";
import { resolveProductPrices } from "../../offers/offer-pricing";

type GetProductsOptions = {
    lang: Lang;
    page?: number;
    limit?: number;
    searchTitle?: string;
    orderPrice?: "asc" | "desc";
    categoryId?: string;
};

const productReviewInclude = {
    reviews: {
        orderBy: { createdAt: "desc" },
        include: {
            user: {
                select: { id: true, name: true, avatar: true },
            },
        },
    },
} satisfies Prisma.ProductInclude;

export const getProducts = async ({
    lang,
    page = 1,
    limit = 10,
    searchTitle,
    orderPrice,
    categoryId,
}: GetProductsOptions) => {
    const skip = (page - 1) * limit;

    // Fail clearly if the category doesn't exist, instead of returning an empty list
    if (categoryId) {
        const category = await prisma.category.findUnique({ where: { id: categoryId } });

        if (!category) { throw new ApiError(404, "Category not found"); }
    }

    const where: Prisma.ProductWhereInput = {
        ...(categoryId && { categoryId }),
        // Search only in the title of the requested language
        ...(searchTitle &&
            (lang === "ar"
                ? { titleAr: { contains: searchTitle, mode: "insensitive" } }
                : { titleEn: { contains: searchTitle, mode: "insensitive" } })),
    };

    const orderBy: Prisma.ProductOrderByWithRelationInput[] = orderPrice
        ? [{ baseSalary: orderPrice }, { profit: orderPrice }]
        : [{ createdAt: "desc" }];

    const [products, totalItems] = await Promise.all([
        prisma.product.findMany({ where, skip, take: limit, orderBy }),
        prisma.product.count({ where }),
    ]);

    const reviewStats = products.length
        ? await prisma.review.groupBy({
              by: ["productId"],
              where: { productId: { in: products.map((product) => product.id) } },
              _avg: { rating: true },
              _count: { _all: true },
          })
        : [];
    const statsByProductId = new Map(reviewStats.map((stats) => [stats.productId, stats]));
    const prices = await resolveProductPrices(prisma, products);

    return {
        pagination: {
            totalItems,
            currentPage: page,
            limit,
            totalPages: Math.ceil(totalItems / limit),
        },
        products: products.map((product) => {
            const stats = statsByProductId.get(product.id);
            const price = prices.get(product.id);
            if (!price) throw new ApiError(500, "Could not calculate product price");

            return {
                ...localizeProduct(product, lang),
                discount: price.discountPercentage,
                originalUnitPrice: price.originalUnitPrice,
                unitPrice: price.unitPrice,
                offerId: price.offerId,
                offerTitle: lang === "ar" ? price.offerTitleAr : price.offerTitleEn,
                images: product.images.slice(0, 1),
                reviewSummary: {
                    averageRating: stats?._avg.rating
                        ? Math.round(stats._avg.rating * 10) / 10
                        : 0,
                    totalReviews: stats?._count._all ?? 0,
                },
            };
        }),
    };
};

export const getProductById = async (productId: string, lang: Lang) => {
    if (!productId) {
        throw new ApiError(400, "Product id is required");
    }

    const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
            category: {
                select: {
                    titleAr: true,
                    titleEn: true,
                },
            },
            ...productReviewInclude,
        },
    });

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    const price = (await resolveProductPrices(prisma, [product])).get(product.id);
    if (!price) throw new ApiError(500, "Could not calculate product price");

    const localizedProduct = {
        ...localizeProduct(product, lang),
        discount: price.discountPercentage,
        originalUnitPrice: price.originalUnitPrice,
        unitPrice: price.unitPrice,
        offerId: price.offerId,
        offerTitle: lang === "ar" ? price.offerTitleAr : price.offerTitleEn,
    };
    const { category, ...productData } = localizedProduct;

    return {
        ...productData,
        categoryTitle: localizeCategoryTitle(category, lang),
    };
};
