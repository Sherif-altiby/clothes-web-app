import { prisma } from "../../../prisma";
import { ApiError } from "../../../shared/utils/ApiError";

export const createCategoryService = async (titleAr: string, titleEn: string) => {
  const existingCategory = await prisma.category.findFirst({
    where: { OR: [{ titleAr }, { titleEn }] },
  });

  if (existingCategory) {
    throw new ApiError(400, "Category with this title already exists");
  }

  const category = await prisma.category.create({
    data: { titleAr, titleEn },
  });

  return category;
};

export const updateCategoryService = async (
  id: string,
  titleAr?: string,
  titleEn?: string
) => {
  const existingCategory = await prisma.category.findUnique({
    where: { id },
  });

  if (!existingCategory) {
    throw new ApiError(404, "Category not found");
  }

  // Only check the fields that are actually changing
  const conditions: { titleAr?: string; titleEn?: string }[] = [];

  if (titleAr && titleAr !== existingCategory.titleAr) conditions.push({ titleAr });
  if (titleEn && titleEn !== existingCategory.titleEn) conditions.push({ titleEn });

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
    data: {
      ...(titleAr && { titleAr }),
      ...(titleEn && { titleEn }),
    },
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

  await prisma.category.delete({
    where: { id },
  });
};