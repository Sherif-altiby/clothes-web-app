import { Category, HeroSlide, Prisma, Product } from "@prisma/client";
import { Lang } from "../middlewares/lang.middleware";

export const localizeProduct = (product: Product, lang: Lang) => {
    const { titleAr, titleEn, descriptionAr, descriptionEn, ...rest } = product;

    return {
        ...rest,
        title: lang === "ar" ? titleAr || titleEn : titleEn || titleAr,
        description: lang === "ar" ? descriptionAr || descriptionEn : descriptionEn || descriptionAr,
    };
};

export const localizeCategory = (category: Category, lang: Lang) => {
    const { titleAr, titleEn, ...rest } = category;

    return {
        ...rest,
        title: lang === "ar" ? titleAr || titleEn : titleEn || titleAr,
    };
};


type CartWithItems = Prisma.CartGetPayload<{
    include: { items: { include: { product: true } } };
}>;

export const localizeCart = (cart: CartWithItems, lang: Lang) => ({
    ...cart,
    items: cart.items.map((item) => ({
        ...item,
        product: localizeProduct(item.product, lang),
    })),
});

type OrderWithItems = Prisma.OrderGetPayload<{
    include: { items: { include: { product: true } } };
}>;

export const localizeOrder = <T extends OrderWithItems>(order: T, lang: Lang) => ({
    ...order,
    items: order.items.map((item) => ({
        ...item,
        product: localizeProduct(item.product, lang),
    })),
});


export const localizeHeroSlide = (slide: HeroSlide, lang: Lang) => {
    const { titleAr, titleEn, subtitleAr, subtitleEn, ctaAr, ctaEn, ...rest } = slide;

    return {
        ...rest,
        title: lang === "ar" ? titleAr : titleEn,
        subtitle: lang === "ar" ? subtitleAr : subtitleEn,
        cta: lang === "ar" ? ctaAr : ctaEn,
    };
};