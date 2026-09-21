// favorite.services.ts
import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma";
import { ApiError } from "../../shared/utils/ApiError";
import { localizeProduct } from "../../shared/utils/localize";
import { Lang } from "../../shared/middlewares/lang.middleware";
 

export const getFavoritesService = async (
    userId: string,
    lang: Lang,
    page: number = 1,
    limit: number = 10
) => {
    const skip = (page - 1) * limit;

    const [favorites, totalItems] = await Promise.all([
        prisma.favorite.findMany({
            where: { userId },
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: { product: true },
        }),
        prisma.favorite.count({ where: { userId } }),
    ]);

    return {
        pagination: {
            totalItems,
            currentPage: page,
            limit,
            totalPages: Math.ceil(totalItems / limit),
        },
        favorites: favorites.map((f) => ({
            id: f.id,
            createdAt: f.createdAt,
            product: localizeProduct(f.product, lang),
        })),
    };
};

export const isFavoriteService = async (userId: string, productId: string) => {
    const favorite = await prisma.favorite.findUnique({
        where: { userId_productId: { userId, productId } },
    });

    return { isFavorite: !!favorite };
};

export const addFavoriteService = async (userId: string, productId: string) => {
    const product = await prisma.product.findUnique({ where: { id: productId } });

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    try {
        return await prisma.favorite.create({
            data: { userId, productId },
        });
    } catch (error) {
        // Unique constraint (userId + productId): already in favorites
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            throw new ApiError(409, "Product is already in favorites");
        }
        throw error;
    }
};

export const removeFavoriteService = async (userId: string, productId: string) => {
    const result = await prisma.favorite.deleteMany({
        where: { userId, productId },
    });

    if (result.count === 0) {
        throw new ApiError(404, "Favorite not found");
    }
};

export const toggleFavoriteService = async (userId: string, productId: string) => {
    const existing = await prisma.favorite.findUnique({
        where: { userId_productId: { userId, productId } },
    });

    if (existing) {
        await prisma.favorite.delete({ where: { id: existing.id } });
        return { isFavorite: false };
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    await prisma.favorite.create({ data: { userId, productId } });
    return { isFavorite: true };
};