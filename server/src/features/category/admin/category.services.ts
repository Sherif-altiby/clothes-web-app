import { prisma } from "../../../prisma";
import { ApiError } from "../../../shared/utils/ApiError";
import type { CreateCategoryInput } from "./category.validation";

export const createCategoryService = async ({ titleAr, titleEn, image }: CreateCategoryInput) => {
  const existingCategory = await prisma.category.findFirst({
    where: { OR: [{ titleAr }, { titleEn }] },
  });

  if (existingCategory) {
    throw new ApiError(400, "Category with this title already exists");
  }

  const category = await prisma.category.create({
    data: { titleAr, titleEn, image },
  });

  return category;
};

export const updateCategoryService = async (
  id: string,
  data: { titleAr?: string; titleEn?: string; image?: string }
) => {
  const existingCategory = await prisma.category.findUnique({
    where: { id },
  });

  if (!existingCategory) {
    throw new ApiError(404, "Category not found");
  }

  // Only check the fields that are actually changing
  const conditions: { titleAr?: string; titleEn?: string }[] = [];

  if (data.titleAr && data.titleAr !== existingCategory.titleAr) conditions.push({ titleAr: data.titleAr });
  if (data.titleEn && data.titleEn !== existingCategory.titleEn) conditions.push({ titleEn: data.titleEn });

  if (conditions.length > 0) {
    const titleExists = await prisma.category.findFirst({
      where: {
        id: { not: id },
        OR: conditions,
      },
    });

    if (titleExists) {
      throw new ApiError(400, "Category with this title already exists");
    }
  }

  const category = await prisma.category.update({
    where: { id },
    data,
  });

  return category;
};

export const deleteCategoryService = async (id: string) => {
  const existingCategory = await prisma.category.findUnique({
    where: { id },
  });

  if (!existingCategory) {
    throw new ApiError(404, "Category not found");
  }

  const productCount = await prisma.product.count({ where: { categoryId: id } });
  if (productCount > 0) {
    throw new ApiError(409, "Category cannot be deleted while it contains products");
  }

  await prisma.category.delete({
    where: { id },
  });
};