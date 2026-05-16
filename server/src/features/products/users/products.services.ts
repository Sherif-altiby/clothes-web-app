import { Prisma } from "@prisma/client";
import { prisma } from "../../../prisma";
import { ApiError } from "../../../shared/utils/ApiError";

export const getProducts = async (
    page: number = 1,
    limit: number = 10,
    searchTitle: string = "",
    orderPrice?: "asc" | "desc"
) => {
    const skip = (page - 1) * limit;

    // Filter by title if search string is provided
    const where: Prisma.ProductWhereInput = searchTitle
        ? {
            title: {
                contains: searchTitle,
                mode: "insensitive", // Case-insensitive search supported in Postgres
            },
        }
        : {};

    const orderBy: Prisma.ProductOrderByWithRelationInput[] = [];


    if (orderPrice) {
        orderBy.push({ baseSalary: orderPrice });
        orderBy.push({ profit: orderPrice });
    } else {
        orderBy.push({ createdAt: "desc" });
    }

    const [products, totalItems] = await Promise.all([
        prisma.product.findMany({
            where,
            skip,
            take: limit,
            orderBy: orderBy,
        }),
        prisma.product.count({ where }),
    ]);

    return {
        pagination: {
            totalItems,
            currentPage: page,
            limit,
            totalPages: Math.ceil(totalItems / limit),
        },
        products,
    };
};

export const getProductById = async (productId: string) => {

    if (!productId) {
        throw new ApiError(400, "Product id is required")
    }

    const product = await prisma.product.findUnique({
        where: { id: productId },
    });

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    return product;
};
