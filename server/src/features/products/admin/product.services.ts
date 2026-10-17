import { prisma } from '../../../prisma';
import { ApiError } from '../../../shared/utils/ApiError';
import type { Prisma, Product } from '@prisma/client';

type GetAdminProductsOptions = {
    page: number;
    limit: number;
    searchTitle?: string;
    categoryId?: string;
};

export const getAdminProductsService = async ({
    page,
    limit,
    searchTitle,
    categoryId,
}: GetAdminProductsOptions) => {
    const where: Prisma.ProductWhereInput = {};
    if (searchTitle) {
        where.OR = [
            { titleEn: { contains: searchTitle, mode: "insensitive" } },
            { titleAr: { contains: searchTitle, mode: "insensitive" } },
        ];
    }
    if (categoryId) where.categoryId = categoryId;

    const [products, totalItems] = await Promise.all([
        prisma.product.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                category: {
                    select: { id: true, titleEn: true, titleAr: true },
                },
            },
        }),
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
    const reviewStatsByProductId = new Map(
        reviewStats.map((stats) => [stats.productId, stats])
    );

    return {
        pagination: {
            totalItems,
            currentPage: page,
            limit,
            totalPages: Math.ceil(totalItems / limit),
        },
        products: products.map((product) => {
            const stats = reviewStatsByProductId.get(product.id);
            return {
                ...product,
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

export const createProductService = async (data: Omit<Product, "id" | "createdAt" | "updatedAt">) => {
    const category = await prisma.category.findUnique({
        where: { id: data.categoryId },
    });

    if (!category) {
        throw new ApiError(404, "Category not found");
    }

    const product = await prisma.product.create({
        data: {
            titleAr: data.titleAr,
            titleEn: data.titleEn,
            descriptionAr: data.descriptionAr,
            descriptionEn: data.descriptionEn,
            baseSalary: data.baseSalary,
            profit: data.profit,
            discount: data.discount || 0,
            images: data.images,
            counts: data.counts || 1,
            categoryId: data.categoryId,
        },
    });

    return product;
};

export const updateProductService = async (
    id: string,
    data: Partial<Omit<Product, "id" | "createdAt" | "updatedAt">>
) => {
    const existingProduct = await prisma.product.findUnique({
        where: { id },
    });

    if (!existingProduct) {
        throw new ApiError(404, "Product not found");
    }

    if (data.categoryId) {
        const category = await prisma.category.findUnique({
            where: { id: data.categoryId },
        });

        if (!category) {
            throw new ApiError(404, "Category not found");
        }
    }

    const product = await prisma.product.update({
        where: { id },
        data,
    });

    return product;
};

export const deleteProductService = async (id: string) => {
    const existingProduct = await prisma.product.findUnique({
        where: { id },
    });

    if (!existingProduct) {
        throw new ApiError(404, "Product not found");
    }

    await prisma.product.delete({
        where: { id },
    });
};