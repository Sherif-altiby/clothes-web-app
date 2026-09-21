// review.services.ts
import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma";
import { ApiError } from "../../shared/utils/ApiError";
import { Lang } from "../../shared/middlewares/lang.middleware";
import { localizeProduct } from "../../shared/utils/localize";

// Only expose safe user fields
const userSelect = { id: true, name: true, avatar: true } satisfies Prisma.UserSelect;

const pagination = (totalItems: number, page: number, limit: number) => ({
    totalItems,
    currentPage: page,
    limit,
    totalPages: Math.ceil(totalItems / limit),
});

// Reviews of one product + average rating
export const getReviewsService = async (productId: string, page: number = 1, limit: number = 10) => {
    const product = await prisma.product.findUnique({ where: { id: productId } });

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    const where: Prisma.ReviewWhereInput = { productId };

    const [reviews, totalItems, stats] = await Promise.all([
        prisma.review.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: { user: { select: userSelect } },
        }),
        prisma.review.count({ where }),
        prisma.review.aggregate({ where, _avg: { rating: true } }),
    ]);

    return {
        summary: {
            averageRating: stats._avg.rating ? Math.round(stats._avg.rating * 10) / 10 : 0,
            totalReviews: totalItems,
        },
        pagination: pagination(totalItems, page, limit),
        reviews,
    };
};

// Reviews written by the current user (with the product localized)
export const getMyReviewsService = async (
    userId: string,
    lang: Lang,
    page: number = 1,
    limit: number = 10
) => {
    const where: Prisma.ReviewWhereInput = { userId };

    const [reviews, totalItems] = await Promise.all([
        prisma.review.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: { product: true },
        }),
        prisma.review.count({ where }),
    ]);

    return {
        pagination: pagination(totalItems, page, limit),
        reviews: reviews.map((r) => ({
            ...r,
            product: localizeProduct(r.product, lang),
        })),
    };
};

export const createReviewService = async (
    userId: string,
    productId: string,
    rating: number,
    comment: string | null
) => {
    const product = await prisma.product.findUnique({ where: { id: productId } });

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    try {
        return await prisma.review.create({
            data: { userId, productId, rating, comment },
            include: { user: { select: userSelect } },
        });
    } catch (error) {
        // Unique constraint (userId + productId): one review per product
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            throw new ApiError(409, "You already reviewed this product");
        }
        throw error;
    }
};

export const updateReviewService = async (
    userId: string,
    reviewId: string,
    data: { rating?: number; comment?: string | null }
) => {
    const review = await prisma.review.findUnique({ where: { id: reviewId } });

    if (!review) {
        throw new ApiError(404, "Review not found");
    }

    if (review.userId !== userId) {
        throw new ApiError(403, "You can only edit your own reviews");
    }

    return prisma.review.update({
        where: { id: reviewId },
        data,
        include: { user: { select: userSelect } },
    });
};

export const deleteReviewService = async (userId: string, role: string, reviewId: string) => {
    const review = await prisma.review.findUnique({ where: { id: reviewId } });

    if (!review) {
        throw new ApiError(404, "Review not found");
    }

    const canModerate = role === "ADMIN" || role === "MODERATOR";

    if (review.userId !== userId && !canModerate) {
        throw new ApiError(403, "You can only delete your own reviews");
    }

    await prisma.review.delete({ where: { id: reviewId } });
};