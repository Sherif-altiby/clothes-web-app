// products.services.ts
import { Prisma } from "@prisma/client";
import { prisma } from "../../../prisma";
import { ApiError } from "../../../shared/utils/ApiError";
import { Lang } from "../../../shared/middlewares/lang.middleware";
import { localizeProduct } from "../../../shared/utils/localize";

type GetProductsOptions = {
    lang: Lang;
    page?: number;
    limit?: number;
    searchTitle?: string;
    orderPrice?: "asc" | "desc";
    categoryId?: string;
};

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

    return {
        pagination: {
            totalItems,
            currentPage: page,
            limit,
            totalPages: Math.ceil(totalItems / limit),
        },
        products: products.map((p) => localizeProduct(p, lang)),
    };
};

export const getProductById = async (productId: string, lang: Lang) => {
    if (!productId) { throw new ApiError(400, "Product id is required"); }

    const product = await prisma.product.findUnique({ where: { id: productId } });

    if (!product) { throw new ApiError(404, "Product not found"); }

    return localizeProduct(product, lang);
};