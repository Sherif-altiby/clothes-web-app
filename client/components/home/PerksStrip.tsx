import { Truck, RotateCcw, Shield, Headset } from "lucide-react";
import { useTranslations } from "next-intl";

const PERKS = [
    { key: "shipping", icon: Truck },
    { key: "returns", icon: RotateCcw },
    { key: "secure", icon: Shield },
    { key: "support", icon: Headset },
] as const;

export function PerksStrip() {
    const t = useTranslations("home.perks");

    return (
        <section className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {PERKS.map(({ key, icon: Icon }) => (
                    <div
                        key={key}
                        className="flex items-center gap-3 rounded-xl border border-border/40 bg-muted/20 p-3"
                    >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Icon className="h-4 w-4" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-foreground">{t(`${key}.title`)}</p>
                            <p className="text-xs text-muted-foreground">{t(`${key}.sub`)}</p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}