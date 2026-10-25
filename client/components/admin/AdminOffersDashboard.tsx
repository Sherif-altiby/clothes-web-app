"use client";

import Image from "next/image";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Archive, Edit3, ImagePlus, Pause, Play, Plus, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { authUserSchema } from "@/lib/validations/login";
import { getCloudinaryPublicId } from "@/components/admin/types";

interface ApiResponse<T> {
    success: boolean;
    data: T;
}

interface OfferRecord {
    id: string;
    titleAr: string;
    titleEn: string;
    descriptionAr: string;
    descriptionEn: string;
    image: string;
    discount: number;
    startsAt: string;
    endsAt: string;
    status: "PAUSED" | "ACTIVE" | "ARCHIVED";
    effectiveStatus: "PAUSED" | "ACTIVE" | "ARCHIVED" | "UPCOMING" | "EXPIRED";
    products: Array<{ productId: string; product: { titleAr: string; titleEn: string } }>;
    categories: Array<{ categoryId: string; category: { titleAr: string; titleEn: string } }>;
}

interface Category {
    id: string;
    title: string;
}

interface Product {
    id: string;
    titleAr: string;
    titleEn: string;
}

interface ProductPage {
    products: Product[];
}

interface OfferFields {
    titleAr: string;
    titleEn: string;
    descriptionAr: string;
    descriptionEn: string;
    discount: string;
    startsAt: string;
    endsAt: string;
    categoryIds: string[];
    productIds: string[];
}

const OFFER_QUERY_KEY = ["admin-offers"] as const;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const emptyFields = (): OfferFields => {
    const start = new Date();
    const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
    return {
        titleAr: "",
        titleEn: "",
        descriptionAr: "",
        descriptionEn: "",
        discount: "",
        startsAt: toDateTimeInput(start),
        endsAt: toDateTimeInput(end),
        categoryIds: [],
        productIds: [],
    };
};

function toDateTimeInput(date: Date) {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
    return local.toISOString().slice(0, 16);
}

function getApiErrorMessage(error: unknown, fallback: string) {
    return axios.isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message || fallback
        : fallback;
}

export function AdminOffersDashboard() {
    const locale = useLocale();
    const t = useTranslations("admin.offers");
    const queryClient = useQueryClient();
    const [formOpen, setFormOpen] = useState(false);
    const [editingOffer, setEditingOffer] = useState<OfferRecord | null>(null);
    const [fields, setFields] = useState<OfferFields>(emptyFields);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState("");
    const [formError, setFormError] = useState("");
    const [pendingStatus, setPendingStatus] = useState<{ offer: OfferRecord; status: OfferRecord["status"] } | null>(null);

    useEffect(() => {
        if (!previewUrl) return;
        return () => URL.revokeObjectURL(previewUrl);
    }, [previewUrl]);

    const authQuery = useQuery({
        queryKey: ["auth", "me"],
        queryFn: async () => {
            const response = await api.get<ApiResponse<unknown>>("/auth/me");
            const parsed = authUserSchema.safeParse(response.data.data);
            if (!parsed.success) throw new Error("Invalid account response");
            return parsed.data;
        },
        retry: false,
    });
    const isAdmin = authQuery.data?.role === "ADMIN";

    const offersQuery = useQuery({
        queryKey: OFFER_QUERY_KEY,
        queryFn: async () => {
            const response = await api.get<ApiResponse<OfferRecord[]>>("/admin/offers");
            return response.data.data;
        },
        enabled: isAdmin,
    });
    const categoriesQuery = useQuery({
        queryKey: ["categories", locale],
        queryFn: async () => {
            const response = await api.get<ApiResponse<Category[]>>("/user/categories", {
                headers: { "Accept-Language": locale },
            });
            return response.data.data;
        },
        enabled: isAdmin,
        staleTime: 5 * 60_000,
    });
    const productsQuery = useQuery({
        queryKey: ["admin-products", "offer-selection"],
        queryFn: async () => {
            const response = await api.get<ApiResponse<ProductPage>>("/admin/product", {
                params: { page: 1, limit: 100 },
            });
            return response.data.data.products;
        },
        enabled: isAdmin,
        staleTime: 60_000,
    });

    const resetForm = () => {
        setFormOpen(false);
        setEditingOffer(null);
        setFields(emptyFields());
        setImageFile(null);
        setPreviewUrl("");
        setFormError("");
    };

    const openCreateForm = () => {
        setEditingOffer(null);
        setFields(emptyFields());
        setImageFile(null);
        setPreviewUrl("");
        setFormError("");
        setFormOpen(true);
    };

    const openEditForm = (offer: OfferRecord) => {
        setEditingOffer(offer);
        setFields({
            titleAr: offer.titleAr,
            titleEn: offer.titleEn,
            descriptionAr: offer.descriptionAr,
            descriptionEn: offer.descriptionEn,
            discount: String(offer.discount),
            startsAt: toDateTimeInput(new Date(offer.startsAt)),
            endsAt: toDateTimeInput(new Date(offer.endsAt)),
            categoryIds: offer.categories.map((entry) => entry.categoryId),
            productIds: offer.products.map((entry) => entry.productId),
        });
        setImageFile(null);
        setPreviewUrl("");
        setFormError("");
        setFormOpen(true);
    };

    const saveMutation = useMutation({
        mutationFn: async () => {
            if (!fields.titleAr.trim() || !fields.titleEn.trim() ||
                !fields.descriptionAr.trim() || !fields.descriptionEn.trim() ||
                !fields.startsAt || !fields.endsAt ||
                (!editingOffer && !imageFile) ||
                (!fields.categoryIds.length && !fields.productIds.length)) {
                throw new Error(t("requiredFields"));
            }
            const discount = Number(fields.discount);
            if (!Number.isFinite(discount) || discount <= 0 || discount > 100) {
                throw new Error(t("invalidDiscount"));
            }
            const startsAt = new Date(fields.startsAt);
            const endsAt = new Date(fields.endsAt);
            if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
                throw new Error(t("invalidDates"));
            }

            let uploaded: { url: string; publicId: string } | null = null;
            if (imageFile) {
                const form = new FormData();
                form.append("image", imageFile);
                const response = await api.post<ApiResponse<{ url: string; publicId: string }>>(
                    "/upload/single",
                    form,
                    { headers: { "Content-Type": "multipart/form-data" } },
                );
                uploaded = response.data.data;
            }

            const payload = {
                titleAr: fields.titleAr.trim(),
                titleEn: fields.titleEn.trim(),
                descriptionAr: fields.descriptionAr.trim(),
                descriptionEn: fields.descriptionEn.trim(),
                image: uploaded?.url ?? editingOffer?.image,
                discount,
                startsAt: startsAt.toISOString(),
                endsAt: endsAt.toISOString(),
                categoryIds: fields.categoryIds,
                productIds: fields.productIds,
            };

            try {
                if (editingOffer) {
                    await api.patch(`/admin/offers/${encodeURIComponent(editingOffer.id)}`, payload);
                } else {
                    await api.post("/admin/offers", payload);
                }
            } catch (error) {
                if (uploaded) {
                    try {
                        await api.delete("/upload", { data: { publicId: uploaded.publicId } });
                    } catch {
                        toast.error(t("uploadCleanupError"));
                    }
                }
                throw error;
            }

            let cleanupFailed = false;
            if (uploaded && editingOffer) {
                const oldPublicId = getCloudinaryPublicId(editingOffer.image);
                if (oldPublicId) {
                    try {
                        await api.delete("/upload", { data: { publicId: oldPublicId } });
                    } catch {
                        cleanupFailed = true;
                    }
                }
            }
            return { isCreate: !editingOffer, cleanupFailed };
        },
        onSuccess: ({ isCreate, cleanupFailed }) => {
            void queryClient.invalidateQueries({ queryKey: OFFER_QUERY_KEY });
            void queryClient.invalidateQueries({ queryKey: ["offers"] });
            void queryClient.invalidateQueries({ queryKey: ["offer"] });
            void queryClient.invalidateQueries({ queryKey: ["user-cart"] });
            resetForm();
            toast.success(t(isCreate ? "createSuccess" : "updateSuccess"));
            if (cleanupFailed) toast.warning(t("imageCleanupError"));
        },
        onError: (error) => setFormError(getApiErrorMessage(error, t("saveError"))),
    });

    const statusMutation = useMutation({
        mutationFn: async ({ offer, status }: { offer: OfferRecord; status: OfferRecord["status"] }) => {
            await api.patch(`/admin/offers/${encodeURIComponent(offer.id)}/status`, { status });
            return status;
        },
        onSuccess: (status) => {
            void queryClient.invalidateQueries({ queryKey: OFFER_QUERY_KEY });
            void queryClient.invalidateQueries({ queryKey: ["offers"] });
            void queryClient.invalidateQueries({ queryKey: ["offer"] });
            void queryClient.invalidateQueries({ queryKey: ["user-cart"] });
            setPendingStatus(null);
            toast.success(t(status === "ARCHIVED" ? "archiveSuccess" : status === "ACTIVE" ? "activateSuccess" : "pauseSuccess"));
        },
        onError: (error) => toast.error(getApiErrorMessage(error, t("statusError"))),
    });

    const categories = categoriesQuery.data ?? [];
    const products = productsQuery.data ?? [];
    const offers = offersQuery.data ?? [];
    const formatter = useMemo(
        () => new Intl.DateTimeFormat(locale, { dateStyle: "medium" }),
        [locale],
    );
    const currency = useMemo(
        () => new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 }),
        [locale],
    );

    const updateField = <K extends keyof OfferFields>(key: K, value: OfferFields[K]) => {
        setFields((current) => ({ ...current, [key]: value }));
        setFormError("");
    };
    const toggleSelection = (key: "categoryIds" | "productIds", id: string) => {
        updateField(
            key,
            fields[key].includes(id) ? fields[key].filter((item) => item !== id) : [...fields[key], id],
        );
    };
    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        saveMutation.mutate();
    };
    const handleImageChange = (file: File | undefined) => {
        if (!file) return;
        if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
            setFormError(t("invalidImageType"));
            return;
        }
        if (file.size > MAX_IMAGE_SIZE) {
            setFormError(t("fileTooLarge"));
            return;
        }
        setImageFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setFormError("");
    };

    if (authQuery.isLoading) {
        return <main className="mx-auto max-w-6xl px-4 py-12"><Skeleton className="h-64 w-full rounded-3xl" /></main>;
    }
    if (authQuery.isError || !isAdmin) {
        return (
            <main className="mx-auto max-w-3xl px-4 py-12">
                <Alert variant="destructive">
                    <AlertTitle>{t("accessRequired")}</AlertTitle>
                    <AlertDescription>{t("accessDescription")}</AlertDescription>
                </Alert>
            </main>
        );
    }

    return (
        <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:py-14" dir="rtl">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-sm font-semibold tracking-wide text-primary">{t("eyebrow")}</p>
                    <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground">{t("title")}</h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{t("description")}</p>
                </div>
                <Button type="button" onClick={openCreateForm} className="gap-2">
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    {t("create")}
                </Button>
            </div>

            {formOpen && (
                <Card className="mt-8 rounded-3xl border-border/70">
                    <CardHeader className="flex-row items-start justify-between gap-4">
                        <div>
                            <CardTitle>{editingOffer ? t("editTitle") : t("createTitle")}</CardTitle>
                            <CardDescription className="mt-2">{t("formDescription")}</CardDescription>
                        </div>
                        <Button type="button" variant="ghost" size="icon" onClick={resetForm} aria-label={t("cancel")}>
                            <X className="h-4 w-4" />
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <form className="space-y-7" onSubmit={handleSubmit}>
                            <div className="grid gap-4 md:grid-cols-2">
                                <label className="space-y-2 text-sm font-semibold">
                                    <span>{t("titleEn")}</span>
                                    <input dir="ltr" required maxLength={100} value={fields.titleEn} onChange={(event) => updateField("titleEn", event.target.value)} className="w-full rounded-xl border border-input bg-background px-3 py-2.5 font-normal" />
                                </label>
                                <label className="space-y-2 text-sm font-semibold">
                                    <span>{t("titleAr")}</span>
                                    <input required maxLength={100} value={fields.titleAr} onChange={(event) => updateField("titleAr", event.target.value)} className="w-full rounded-xl border border-input bg-background px-3 py-2.5 font-normal" />
                                </label>
                                <label className="space-y-2 text-sm font-semibold">
                                    <span>{t("descriptionEn")}</span>
                                    <textarea dir="ltr" required maxLength={5000} rows={3} value={fields.descriptionEn} onChange={(event) => updateField("descriptionEn", event.target.value)} className="w-full resize-y rounded-xl border border-input bg-background px-3 py-2.5 font-normal" />
                                </label>
                                <label className="space-y-2 text-sm font-semibold">
                                    <span>{t("descriptionAr")}</span>
                                    <textarea required maxLength={5000} rows={3} value={fields.descriptionAr} onChange={(event) => updateField("descriptionAr", event.target.value)} className="w-full resize-y rounded-xl border border-input bg-background px-3 py-2.5 font-normal" />
                                </label>
                                <label className="space-y-2 text-sm font-semibold">
                                    <span>{t("discount")}</span>
                                    <input type="number" min="0.01" max="100" step="0.01" required value={fields.discount} onChange={(event) => updateField("discount", event.target.value)} className="w-full rounded-xl border border-input bg-background px-3 py-2.5 font-normal" />
                                </label>
                                <label className="space-y-2 text-sm font-semibold">
                                    <span>{t("image")}</span>
                                    <span className="flex items-center gap-3 rounded-xl border border-dashed border-border p-3">
                                        <ImagePlus className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                                        <span className="min-w-0 flex-1 truncate text-xs font-normal text-muted-foreground">{imageFile?.name ?? (editingOffer ? t("replaceImage") : t("chooseImage"))}</span>
                                        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => handleImageChange(event.target.files?.[0])} className="max-w-36 text-xs" />
                                    </span>
                                </label>
                                <label className="space-y-2 text-sm font-semibold">
                                    <span>{t("startsAt")}</span>
                                    <input type="datetime-local" required value={fields.startsAt} onChange={(event) => updateField("startsAt", event.target.value)} className="w-full rounded-xl border border-input bg-background px-3 py-2.5 font-normal" />
                                </label>
                                <label className="space-y-2 text-sm font-semibold">
                                    <span>{t("endsAt")}</span>
                                    <input type="datetime-local" required value={fields.endsAt} onChange={(event) => updateField("endsAt", event.target.value)} className="w-full rounded-xl border border-input bg-background px-3 py-2.5 font-normal" />
                                </label>
                            </div>

                            {(previewUrl || editingOffer?.image) && (
                                <div className="relative h-44 w-full overflow-hidden rounded-2xl bg-muted sm:w-72">
                                    <Image src={previewUrl || editingOffer?.image || ""} alt="" fill sizes="288px" className="object-cover" />
                                </div>
                            )}

                            <div className="grid gap-5 md:grid-cols-2">
                                <fieldset className="rounded-2xl border border-border p-4">
                                    <legend className="px-2 text-sm font-bold">{t("categories")}</legend>
                                    <div className="max-h-52 space-y-2 overflow-y-auto">
                                        {categoriesQuery.isLoading ? <Skeleton className="h-20 w-full" /> : categories.map((category) => (
                                            <label key={category.id} className="flex items-center gap-2 text-sm">
                                                <input type="checkbox" checked={fields.categoryIds.includes(category.id)} onChange={() => toggleSelection("categoryIds", category.id)} />
                                                {category.title}
                                            </label>
                                        ))}
                                    </div>
                                </fieldset>
                                <fieldset className="rounded-2xl border border-border p-4">
                                    <legend className="px-2 text-sm font-bold">{t("products")}</legend>
                                    <div className="max-h-52 space-y-2 overflow-y-auto">
                                        {productsQuery.isLoading ? <Skeleton className="h-20 w-full" /> : products.map((product) => (
                                            <label key={product.id} className="flex items-center gap-2 text-sm">
                                                <input type="checkbox" checked={fields.productIds.includes(product.id)} onChange={() => toggleSelection("productIds", product.id)} />
                                                {locale === "ar" ? product.titleAr : product.titleEn}
                                            </label>
                                        ))}
                                    </div>
                                    {productsQuery.data && productsQuery.data.length === 100 && (
                                        <p className="mt-2 text-xs text-muted-foreground">{t("productSelectionLimit")}</p>
                                    )}
                                </fieldset>
                            </div>

                            {formError && (
                                <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
                                    {formError}
                                </p>
                            )}
                            <div className="flex flex-wrap justify-end gap-3">
                                <Button type="button" variant="outline" onClick={resetForm} disabled={saveMutation.isPending}>{t("cancel")}</Button>
                                <Button type="submit" disabled={saveMutation.isPending || categoriesQuery.isLoading || productsQuery.isLoading}>
                                    {saveMutation.isPending ? t("saving") : editingOffer ? t("save") : t("create")}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <section className="mt-8 space-y-4" aria-label={t("offersList")}>
                {offersQuery.isLoading ? (
                    [0, 1, 2].map((item) => <Skeleton key={item} className="h-36 w-full rounded-2xl" />)
                ) : offersQuery.isError ? (
                    <Alert variant="destructive">
                        <AlertTitle>{t("loadError")}</AlertTitle>
                        <AlertDescription className="flex items-center justify-between gap-4">
                            {t("loadErrorDescription")}
                            <Button type="button" variant="outline" onClick={() => void offersQuery.refetch()}>{t("retry")}</Button>
                        </AlertDescription>
                    </Alert>
                ) : offers.length ? offers.map((offer) => (
                    <Card key={offer.id} className="overflow-hidden rounded-2xl border-border/70">
                        <div className="flex flex-col sm:flex-row">
                            <div className="relative h-40 shrink-0 bg-muted sm:h-auto sm:w-48">
                                <Image src={offer.image} alt="" fill sizes="192px" className="object-cover" />
                            </div>
                            <div className="flex min-w-0 flex-1 flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
                                <div className="min-w-0 space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h2 className="text-lg font-bold text-foreground">{locale === "ar" ? offer.titleAr : offer.titleEn}</h2>
                                        <Badge variant={offer.effectiveStatus === "ACTIVE" ? "default" : "secondary"}>
                                            {t(`statuses.${offer.effectiveStatus}`)}
                                        </Badge>
                                        <Badge variant="outline">{currency.format(offer.discount / 100)}</Badge>
                                    </div>
                                    <p className="line-clamp-2 text-sm text-muted-foreground">{locale === "ar" ? offer.descriptionAr : offer.descriptionEn}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {t("dateRange", { start: formatter.format(new Date(offer.startsAt)), end: formatter.format(new Date(offer.endsAt)) })}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {t("targetCount", { categories: offer.categories.length, products: offer.products.length })}
                                    </p>
                                </div>
                                {offer.status !== "ARCHIVED" && (
                                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                                        <Button type="button" variant="outline" size="sm" onClick={() => openEditForm(offer)} className="gap-2">
                                            <Edit3 className="h-4 w-4" aria-hidden="true" />{t("edit")}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={statusMutation.isPending}
                                            onClick={() => statusMutation.mutate({ offer, status: offer.status === "ACTIVE" ? "PAUSED" : "ACTIVE" })}
                                            className="gap-2"
                                        >
                                            {offer.status === "ACTIVE" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                            {t(offer.status === "ACTIVE" ? "pause" : "activate")}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            disabled={statusMutation.isPending}
                                            onClick={() => setPendingStatus({ offer, status: "ARCHIVED" })}
                                            className="gap-2 text-destructive hover:text-destructive"
                                        >
                                            <Archive className="h-4 w-4" aria-hidden="true" />{t("archive")}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                )) : (
                    <Card className="rounded-2xl border-dashed">
                        <CardContent className="py-12 text-center text-sm text-muted-foreground">{t("empty")}</CardContent>
                    </Card>
                )}
            </section>

            {pendingStatus && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="presentation">
                    <Card className="w-full max-w-md rounded-2xl">
                        <CardHeader>
                            <CardTitle>{t("archiveConfirmTitle")}</CardTitle>
                            <CardDescription>{t("archiveConfirmDescription", { name: locale === "ar" ? pendingStatus.offer.titleAr : pendingStatus.offer.titleEn })}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex justify-end gap-3">
                            <Button type="button" variant="outline" onClick={() => setPendingStatus(null)}>{t("cancel")}</Button>
                            <Button type="button" variant="destructive" disabled={statusMutation.isPending} onClick={() => statusMutation.mutate(pendingStatus)}>{t("archive")}</Button>
                        </CardContent>
                    </Card>
                </div>
            )}
        </main>
    );
}
