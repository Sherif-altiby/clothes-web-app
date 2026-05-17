import { prisma } from '../../../prisma';
import { ApiError } from '../../../shared/utils/ApiError';
import { Product } from '@prisma/client';


export const createProductService = async (data: Omit<Product, "id" | "createdAt" | "updatedAt">) => {
    const category = await prisma.category.findUnique({
        where: { id: data.categoryId },
    });

    if (!category) {
        throw new ApiError(404, "Category not found");
    }

    const product = await prisma.product.create({
        data: {
            title: data.title,
            description: data.description,
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
