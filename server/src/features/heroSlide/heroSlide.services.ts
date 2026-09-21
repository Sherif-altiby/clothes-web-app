// heroSlide.services.ts
import { prisma } from "../../prisma";
import { ApiError } from "../../shared/utils/ApiError";
import { Lang } from "../../shared/middlewares/lang.middleware";
import { localizeHeroSlide } from "../../shared/utils/localize";

/* --------------------------------- Public ---------------------------------- */

// Active slides only, in carousel order
export const getActiveHeroSlidesService = async (lang: Lang) => {
    const slides = await prisma.heroSlide.findMany({
        where: { isActive: true },
        orderBy: { order: "asc" },
    });

    return slides.map((s) => localizeHeroSlide(s, lang));
};

/* --------------------------------- Admin ------------------------------------ */

// All slides (active + inactive), for the admin dashboard
export const getAllHeroSlidesService = async () => {
    return prisma.heroSlide.findMany({ orderBy: { order: "asc" } });
};

export const getHeroSlideByIdService = async (id: string) => {
    const slide = await prisma.heroSlide.findUnique({ where: { id } });

    if (!slide) {
        throw new ApiError(404, "Hero slide not found");
    }

    return slide;
};

type CreateHeroSlideInput = {
    titleAr: string;
    titleEn: string;
    subtitleAr: string;
    subtitleEn: string;
    ctaAr: string;
    ctaEn: string;
    image: string;
    href: string;
    order?: number;
    isActive?: boolean;
};

export const createHeroSlideService = async (data: CreateHeroSlideInput) => {
    // New slide goes after the current last one unless an order was given
    const order = data.order ?? (await nextOrder());

    return prisma.heroSlide.create({ data: { ...data, order } });
};

type UpdateHeroSlideInput = Partial<CreateHeroSlideInput>;

export const updateHeroSlideService = async (id: string, data: UpdateHeroSlideInput) => {
    const existing = await prisma.heroSlide.findUnique({ where: { id } });

    if (!existing) {
        throw new ApiError(404, "Hero slide not found");
    }

    return prisma.heroSlide.update({ where: { id }, data });
};

export const deleteHeroSlideService = async (id: string) => {
    const existing = await prisma.heroSlide.findUnique({ where: { id } });

    if (!existing) {
        throw new ApiError(404, "Hero slide not found");
    }

    await prisma.heroSlide.delete({ where: { id } });
};

// Bulk reorder: [{ id, order }, ...] from a drag-and-drop admin UI
export const reorderHeroSlidesService = async (items: { id: string; order: number }[]) => {
    const ids = items.map((i) => i.id);

    const existingCount = await prisma.heroSlide.count({ where: { id: { in: ids } } });

    if (existingCount !== ids.length) {
        throw new ApiError(400, "One or more hero slide ids are invalid");
    }

    await prisma.$transaction(
        items.map((i) => prisma.heroSlide.update({ where: { id: i.id }, data: { order: i.order } }))
    );

    return prisma.heroSlide.findMany({ orderBy: { order: "asc" } });
};

const nextOrder = async () => {
    const last = await prisma.heroSlide.findFirst({ orderBy: { order: "desc" } });
    return (last?.order ?? -1) + 1;
};