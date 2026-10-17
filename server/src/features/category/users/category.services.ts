import { prisma } from "../../../prisma";
import { Lang } from "../../../shared/middlewares/lang.middleware";
import { localizeCategory } from "../../../shared/utils/localize";

export const getAllCategoriesService = async (lang: Lang) => {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
  });

  return categories.map((category) => ({
    ...category,
    title: localizeCategory(category, lang).title,
  }));
};