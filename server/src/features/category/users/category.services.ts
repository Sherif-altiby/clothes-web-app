import { prisma } from "../../../prisma";
import { Lang } from "../../../shared/middlewares/lang.middleware";
import { localizeCategory } from "../../../shared/utils/localize";

export const getAllCategoriesService = async (lang: Lang) => {
  const categories = await prisma.category.findMany();

  return categories.map((c) => localizeCategory(c, lang));
};