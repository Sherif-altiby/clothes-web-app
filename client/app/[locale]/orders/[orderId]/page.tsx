import Link from "next/link";
import { CheckCircle2, CircleAlert } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";

export default async function OrderPaymentResultPage({
    params,
    searchParams,
}: {
    params: Promise<{ locale: string; orderId: string }>;
    searchParams: Promise<{ payment?: string }>;
}) {
    const [{ locale, orderId }, { payment }] = await Promise.all([params, searchParams]);
    const t = await getTranslations("paymentResult");
    const wasSuccessful = payment === "success";

    return (
        <main className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-16">
            <section className="w-full max-w-lg space-y-5 rounded-3xl border border-border/50 bg-card/40 p-8 text-center backdrop-blur-md">
                {wasSuccessful ? (
                    <CheckCircle2 className="mx-auto h-14 w-14 text-primary" aria-hidden="true" />
                ) : (
                    <CircleAlert className="mx-auto h-14 w-14 text-muted-foreground" aria-hidden="true" />
                )}
                <h1 className="text-3xl font-black tracking-tight text-foreground">
                    {wasSuccessful ? t("successTitle") : t("cancelledTitle")}
                </h1>
                <p className="text-muted-foreground">
                    {wasSuccessful ? t("successDescription") : t("cancelledDescription")}
                </p>
                <p className="text-sm text-muted-foreground">
                    {t("orderReference", { id: orderId })}
                </p>
                <Button asChild size="lg" className="h-12 rounded-xl px-6 font-bold">
                    <Link href={`/${locale}/user`}>{t("continueShopping")}</Link>
                </Button>
            </section>
        </main>
    );
}
