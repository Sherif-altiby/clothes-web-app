"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { CategorySkeleton } from "@/components/skeletons/CategorySkeleton";

interface Category {
    id: string;
    title: string;
    image: string;
}

interface ApiResponse<T> {
    success: boolean;
    data: T;
}

export function Categories() {
    const t = useTranslations("home.categories");
    const locale = useLocale();
    const {
        data: categories,
        isLoading,
        isError,
        refetch,
    } = useQuery({
        queryKey: ["categories", locale],
        queryFn: async () => {
            const response = await api.get<ApiResponse<Category[]>>("/user/categories");

            return response.data.data;
        },
    });

    return (
        <section className="container mx-auto px-4 py-12">
            <h2 className="text-2xl  tracking-tight text-foreground md:text-3xl font-bold">
                {t("title")}
            </h2>

            {isLoading ? (
                <CategorySkeleton />
            ) : isError ? (
                <div className="mt-8 text-center" role="alert">
                    <p className="text-sm text-muted-foreground">{t("loadError")}</p>
                    <button
                        type="button"
                        onClick={() => void refetch()}
                        className="mt-2 text-sm font-semibold text-foreground underline underline-offset-4"
                    >
                        {t("retry")}
                    </button>
                </div>
            ) : categories?.length ? (
                <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                    {categories.map((category) => (
                        <Link
                            key={category.id}
                            href={`user/category/${category.id}`}
                            className="group relative aspect-[3/4] overflow-hidden rounded-2xl border border-border/50 bg-muted/30 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)]"
                        >
                            <Image
                                src={category.image}
                                alt={category.title}
                                fill
                                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 17vw"
                                className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                            <span className="absolute inset-x-4 bottom-4 text-lg font-bold tracking-tight text-white">
                                {category.title}
                            </span>
                        </Link>
                    ))}
                </div>
            ) : (
                <p className="mt-8 text-center text-sm text-muted-foreground">
                    {t("empty")}
                </p>
            )}
        </section>
    );
}