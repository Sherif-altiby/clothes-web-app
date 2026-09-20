import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { CATEGORIES } from "@/lib/home-data";

export function Categories() {
    const t = useTranslations("home.categories");

    return (
        <section className="container mx-auto px-4 py-12">
            <h2 className="text-2xl font-black tracking-tight text-foreground md:text-3xl">
                {t("title")}
            </h2>

            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                {CATEGORIES.map((cat) => (
                    <Link
                        key={cat.key}
                        href={cat.href}
                        className="group relative aspect-[3/4] overflow-hidden rounded-2xl border border-border/50 bg-muted/30 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)]"
                    >
                        <Image
                            src={cat.image}
                            alt=""
                            fill
                            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 17vw"
                            className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                        <span className="absolute inset-x-4 bottom-4 text-lg font-bold tracking-tight text-white">
                            {t(cat.key)}
                        </span>
                    </Link>
                ))}
            </div>
        </section>
    );
}