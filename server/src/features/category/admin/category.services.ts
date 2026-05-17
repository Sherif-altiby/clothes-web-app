import { prisma } from '../../../prisma';
import { ApiError } from '../../../shared/utils/ApiError';

export const createCategoryService = async (title: string) => {
  const existingCategory = await prisma.category.findFirst({
    where: { title },
  });

  if (existingCategory) {
    throw new ApiError(400, "Category with this title already exists");
  }

  const category = await prisma.category.create({
    data: {
      title,
    },
  });

  return category;
};

export const updateCategoryService = async (id: string, title: string) => {
  const existingCategory = await prisma.category.findUnique({
    where: { id },
  });

  if (!existingCategory) {
    throw new ApiError(404, "Category not found");
  }

  if (title && title !== existingCategory.title) {
    const titleExists = await prisma.category.findFirst({
      where: { title },
    });

    if (titleExists) {
      throw new ApiError(400, "Category with this title already exists");
    }
  }

  const category = await prisma.category.update({
    where: { id },
    data: { title },
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


