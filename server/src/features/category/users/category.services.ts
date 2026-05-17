import { prisma } from '../../../prisma';


export const getAllCategoriesService = async () => {
  const categories = await prisma.category.findMany();

  return categories;
};
