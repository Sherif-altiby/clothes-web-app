"use client";

import Image from "next/image";
import { Dialog } from "radix-ui";
import { 
  AlertCircle, 
  ImagePlus, 
  LoaderCircle, 
  Plus, 
  X, 
  Sparkles, 
  Layers,
} from "lucide-react";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { MAX_PRODUCT_IMAGES, productFormSchema } from "@/lib/validations/admin-product";
import {
  CountInput,
  DescriptionInput,
  MoneyInput,
  PercentInput,
  TitleInput,
} from "@/components/shared/AdminFormInputs";
import { SharedSelect } from "@/components/shared/SharedSelect";
import {
  getCloudinaryPublicId,
  type AdminCategory,
  type AdminProduct,
  type ProductFormData,
} from "./types";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const TITLE_MAX = 100;
const DESCRIPTION_MAX = 5000;

interface ProductEditorDialogProps {
  open: boolean;
  isCreate: boolean;
  product: AdminProduct | null;
  categories: AdminCategory[];
  isSaving: boolean;
  labels: Record<string, string>;
  onOpenChange: (open: boolean) => void;
  onSave: (
    data: ProductFormData,
    newFiles: File[],
    removedPublicIds: string[]
  ) => Promise<void>;
}

interface FormFields {
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  baseSalary: string;
  profit: string;
  discount: string;
  counts: string;
  categoryId: string;
}

const getInitialFields = (product: AdminProduct | null): FormFields => ({
  titleEn: product?.titleEn ?? "",
  titleAr: product?.titleAr ?? "",
  descriptionEn: product?.descriptionEn ?? "",
  descriptionAr: product?.descriptionAr ?? "",
  baseSalary: String(product?.baseSalary ?? ""),
  profit: String(product?.profit ?? ""),
  discount: String(product?.discount ?? 0),
  counts: String(product?.counts ?? (product ? 0 : 1)),
  categoryId: product?.categoryId ?? "",
});

const money = (value: number) => value.toFixed(2);

export function ProductEditorDialog({
  open,
  isCreate,
  product,
  categories,
  isSaving,
  labels,
  onOpenChange,
  onSave,
}: ProductEditorDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fields, setFields] = useState<FormFields>(() => getInitialFields(product));
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [newFiles, setNewFiles] = useState<Array<{ file: File; preview: string }>>([]);
  const [error, setError] = useState("");
  const [invalidKeys, setInvalidKeys] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const previewUrls = useRef(new Set<string>());

  useEffect(
    () => () => {
      previewUrls.current.forEach((url) => URL.revokeObjectURL(url));
      previewUrls.current.clear();
    },
    []
  );

  const totalImages = images.length + newFiles.length;
  const imagesFull = totalImages >= MAX_PRODUCT_IMAGES;
  const dropDisabled = imagesFull || isSaving;

  const pricePreview = useMemo(() => {
    if (fields.baseSalary === "" || fields.profit === "") return null;
    const base = Number(fields.baseSalary);
    const profit = Number(fields.profit);
    const discount = Number(fields.discount || 0);
    if (![base, profit, discount].every(Number.isFinite)) return null;
    if (base <= 0 || profit < 0 || discount < 0 || discount > 100) return null;
    const original = base + profit;
    const final = original * (1 - discount / 100);
    return { base, profit, discount, original, final, saved: original - final };
  }, [fields.baseSalary, fields.profit, fields.discount]);

  const isInvalid = (key: string) => invalidKeys.has(key);

  const clearInvalid = (key: string) =>
    setInvalidKeys((current) => {
      if (!current.has(key)) return current;
      const next = new Set(current);
      next.delete(key);
      return next;
    });

  const updateField = (field: keyof FormFields, value: string) => {
    setFields((current) => ({ ...current, [field]: value }));
    clearInvalid(field);
    setError("");
  };

  const addFiles = (fileList: FileList | null) => {
    if (!fileList?.length) return;
    const selectedFiles = Array.from(fileList);
    const remainingSlots = MAX_PRODUCT_IMAGES - images.length - newFiles.length;
    if (selectedFiles.length > remainingSlots) {
      setError(labels.tooManyImages);
      return;
    }

    const imageFiles = selectedFiles.filter((file) => ACCEPTED_TYPES.includes(file.type));
    if (imageFiles.length !== selectedFiles.length) {
      setError(labels.invalidImageType);
      return;
    }
    if (imageFiles.some((file) => file.size > MAX_FILE_SIZE)) {
      setError(labels.fileTooLarge);
      return;
    }

    const additions = imageFiles.map((file) => {
      const preview = URL.createObjectURL(file);
      previewUrls.current.add(preview);
      return { file, preview };
    });
    setNewFiles((current) => [...current, ...additions]);
    clearInvalid("imageCount");
    setError("");
  };

  const removeNewFile = (preview: string) => {
    URL.revokeObjectURL(preview);
    previewUrls.current.delete(preview);
    setNewFiles((current) => current.filter((item) => item.preview !== preview));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!product && !isCreate) return;

    const parsed = productFormSchema.safeParse({
      ...fields,
      baseSalary: Number(fields.baseSalary),
      profit: Number(fields.profit),
      discount: Number(fields.discount),
      counts: Number(fields.counts),
      imageCount: images.length + newFiles.length,
    });

    if (!parsed.success) {
      setInvalidKeys(new Set(parsed.error.issues.map((issue) => String(issue.path[0]))));
      setError(labels.invalidForm);
      return;
    }
    if (isCreate && parsed.data.counts < 1) {
      setInvalidKeys(new Set(["counts"]));
      setError(labels.invalidForm);
      return;
    }

    const data: ProductFormData = {
      titleEn: parsed.data.titleEn,
      titleAr: parsed.data.titleAr,
      descriptionEn: parsed.data.descriptionEn,
      descriptionAr: parsed.data.descriptionAr,
      baseSalary: parsed.data.baseSalary,
      profit: parsed.data.profit,
      discount: parsed.data.discount,
      counts: parsed.data.counts,
      categoryId: parsed.data.categoryId,
      images,
    };
    const removedUrls = product?.images.filter((url) => !images.includes(url)) ?? [];
    const removedPublicIds = removedUrls.flatMap((url) => {
      const publicId = getCloudinaryPublicId(url);
      return publicId ? [publicId] : [];
    });

    try {
      await onSave(data, newFiles.map(({ file }) => file), removedPublicIds);
      onOpenChange(false);
    } catch {
      setError(labels.saveError);
    }
  };

  if (!open || (!product && !isCreate)) return null;

  const tiles = [
    ...images.map((url, index) => ({
      key: `${url}-${index}`,
      src: url,
      alt: "",
      unoptimized: false,
      removeLabel: `${labels.removeImage}: ${index + 1}`,
      onRemove: () => setImages((current) => current.filter((_, itemIndex) => itemIndex !== index)),
    })),
    ...newFiles.map(({ file, preview }) => ({
      key: preview,
      src: preview,
      alt: file.name,
      unoptimized: true,
      removeLabel: `${labels.removeImage}: ${file.name}`,
      onRemove: () => removeNewFile(preview),
    })),
  ];

  const dropHandlers = {
    onDragOver: (event: React.DragEvent) => {
      event.preventDefault();
      if (!dropDisabled) setIsDragging(true);
    },
    onDragLeave: () => setIsDragging(false),
    onDrop: (event: React.DragEvent) => {
      event.preventDefault();
      setIsDragging(false);
      if (!dropDisabled) addFiles(event.dataTransfer.files);
    },
  };

  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => !isSaving && onOpenChange(nextOpen)}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        
        <Dialog.Content 
          dir="rtl" // <-- Forces RTL at the dialog level
          className="fixed left-1/2 top-1/2 z-50 flex h-[90vh] max-h-[850px] w-[min(48rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[24px] border border-border/50 bg-background shadow-2xl outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
          
          <div className="relative flex h-full flex-col">
            {/* --- Premium Header --- */}
            <div className="flex shrink-0 items-center justify-between border-b border-border/40 bg-background/60 px-6 py-5 backdrop-blur-xl">
              <div className="flex flex-col gap-1 text-right">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {isCreate ? <Sparkles className="h-5 w-5" /> : <Layers className="h-5 w-5" />}
                  </div>
                  <Dialog.Title className="text-xl font-bold tracking-tight">
                    {labels.title}
                  </Dialog.Title>
                </div>
                <Dialog.Description className="text-sm text-muted-foreground mr-11">
                  {labels.description}
                </Dialog.Description>
              </div>
              
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:bg-muted" disabled={isSaving}>
                  <X className="h-4 w-4" />
                </Button>
              </Dialog.Close>
            </div>

            {/* --- Body: Single Column Rows --- */}
            <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col overflow-hidden">
              
              <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain p-6 scrollbar-thin scrollbar-thumb-border">
                <div className="space-y-8 pb-10">
                  
                  {/* Section 1: Details */}
                  <section className="space-y-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        {labels.sectionDetails}
                      </h3>
                      <Separator className="flex-1" />
                    </div>

                    <div className="space-y-4">
                      <LanguagePanel code="EN" dir="ltr">
                        <Field label={labels.titleEn} required counter={{ current: fields.titleEn.length, max: TITLE_MAX }}>
                          {(id) => <TitleInput id={id} dir="ltr" maxLength={TITLE_MAX} value={fields.titleEn} invalid={isInvalid("titleEn")} onChange={(value) => updateField("titleEn", value)} />}
                        </Field>
                        <Field label={labels.descriptionEn} required counter={{ current: fields.descriptionEn.length, max: DESCRIPTION_MAX }}>
                          {(id) => <DescriptionInput id={id} dir="ltr" maxLength={DESCRIPTION_MAX} value={fields.descriptionEn} invalid={isInvalid("descriptionEn")} onChange={(value) => updateField("descriptionEn", value)} />}
                        </Field>
                      </LanguagePanel>

                      <LanguagePanel code="AR" dir="rtl">
                        <Field label={labels.titleAr} required counter={{ current: fields.titleAr.length, max: TITLE_MAX }}>
                          {(id) => <TitleInput id={id} dir="rtl" maxLength={TITLE_MAX} value={fields.titleAr} invalid={isInvalid("titleAr")} onChange={(value) => updateField("titleAr", value)} />}
                        </Field>
                        <Field label={labels.descriptionAr} required counter={{ current: fields.descriptionAr.length, max: DESCRIPTION_MAX }}>
                          {(id) => <DescriptionInput id={id} dir="rtl" maxLength={DESCRIPTION_MAX} value={fields.descriptionAr} invalid={isInvalid("descriptionAr")} onChange={(value) => updateField("descriptionAr", value)} />}
                        </Field>
                      </LanguagePanel>
                    </div>

                    <Field label={labels.category} required error={!categories.length ? labels.noCategories : undefined}>
                      {(id) => (
                        <SharedSelect
                          value={fields.categoryId}
                          onValueChange={(value) => updateField("categoryId", value)}
                          options={categories.map((category) => ({ value: category.id, label: category.title }))}
                          placeholder={labels.selectCategory}
                          id={id}
                          className={cn(
                            "w-full bg-background text-right",
                            isInvalid("categoryId") && "border-destructive ring-destructive/20"
                          )}
                        />
                      )}
                    </Field>
                  </section>

                  {/* Section 2: Pricing */}
                  <section className="space-y-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        {labels.sectionPricing}
                      </h3>
                      <Separator className="flex-1" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <Field label={labels.baseSalary} required>
                        {(id) => <MoneyInput id={id} min="0.01" value={fields.baseSalary} invalid={isInvalid("baseSalary")} onChange={(v) => updateField("baseSalary", v)} />}
                      </Field>
                      <Field label={labels.profit} required>
                        {(id) => <MoneyInput id={id} min="0" value={fields.profit} invalid={isInvalid("profit")} onChange={(v) => updateField("profit", v)} />}
                      </Field>
                      <Field label={labels.discount} required>
                        {(id) => <PercentInput id={id} value={fields.discount} invalid={isInvalid("discount")} onChange={(v) => updateField("discount", v)} />}
                      </Field>
                      <Field label={labels.counts} required>
                        {(id) => <CountInput id={id} value={fields.counts} invalid={isInvalid("counts")} onChange={(v) => updateField("counts", v)} />}
                      </Field>
                    </div>

                    {/* Horizontal Price Ledger */}
                    <div className="rounded-2xl border border-border/50 bg-muted/30 p-4" aria-live="polite">
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-base text-muted-foreground tabular-nums">
                        <div className="flex items-center gap-1.5">
                          <span>{labels.baseSalary}:</span>
                          <span className="font-medium text-foreground">{pricePreview ? money(pricePreview.base) : "—"}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span>{labels.profit}:</span>
                          <span className="font-medium text-foreground">{pricePreview ? `+ ${money(pricePreview.profit)}` : "—"}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span>{labels.discount}:</span>
                          <span className="font-medium text-foreground">{pricePreview && pricePreview.discount > 0 ? `− ${money(pricePreview.saved)} (${pricePreview.discount}%)` : "—"}</span>
                        </div>
                      </div>
                      
                      <Separator className="my-3" />
                      
                      <div className="flex items-center justify-between">
                        <span className="text-base font-semibold text-foreground">{labels.finalPrice}</span>
                        <span className="flex items-baseline gap-2 tabular-nums">
                          {pricePreview && pricePreview.discount > 0 && (
                            <span className="text-sm text-muted-foreground line-through decoration-destructive/50">{money(pricePreview.original)}</span>
                          )}
                          <span className={cn("text-2xl font-bold tracking-tight", pricePreview ? "text-primary" : "text-muted-foreground/50")}>
                            {pricePreview ? money(pricePreview.final) : "—"}
                          </span>
                        </span>
                      </div>
                    </div>
                  </section>

                  {/* Section 3: Images */}
                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                          {labels.sectionImages}
                        </h3>
                        <Separator className="flex-1" />
                      </div>
                      <Badge variant={imagesFull ? "destructive" : "secondary"} className="ms-4">
                        {totalImages} / {MAX_PRODUCT_IMAGES}
                      </Badge>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={ACCEPTED_TYPES.join(",")}
                      multiple
                      disabled={dropDisabled}
                      aria-label={labels.addImages}
                      tabIndex={-1}
                      className="hidden"
                      onChange={(event) => {
                        addFiles(event.target.files);
                        event.target.value = "";
                      }}
                    />

                    {tiles.length === 0 ? (
                      <button
                        type="button"
                        {...dropHandlers}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={dropDisabled}
                        className={cn(
                          "group relative flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors duration-200",
                          isDragging ? "border-primary bg-primary/5" : "border-border/60 bg-muted/20 hover:border-primary/50 hover:bg-muted/40",
                          "disabled:cursor-not-allowed disabled:opacity-50"
                        )}
                      >
                        <div className={cn("flex h-12 w-12 items-center justify-center rounded-full bg-background shadow-sm transition-colors duration-200", isDragging ? "text-primary ring-4 ring-primary/20" : "text-muted-foreground")}>
                          <ImagePlus className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">{labels.dropImages}</p>
                          <p className="text-xs text-muted-foreground">{labels.addImages}</p>
                        </div>
                      </button>
                    ) : (
                      <div className="grid grid-cols-3 gap-4 sm:grid-cols-5 mt-4" {...dropHandlers}>
                        {tiles.map(({ key, ...tile }, index) => (
                          <div key={key} className={cn(index === 0 && "col-span-3 sm:col-span-5")}>
                            <ImageTile {...tile} isMain={index === 0} mainLabel={labels.mainImage} disabled={isSaving} />
                          </div>
                        ))}
                        {!imagesFull && (
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={dropDisabled}
                            aria-label={labels.addImages}
                            className={cn(
                              "flex aspect-square cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-border/60 bg-muted/20 text-muted-foreground transition-colors duration-200 hover:border-primary/50 hover:bg-muted/40 hover:text-foreground",
                              isDragging && "border-primary bg-primary/5",
                              "disabled:cursor-not-allowed disabled:opacity-50"
                            )}
                          >
                            <Plus className="h-5 w-5" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    )}
                  </section>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/40 bg-background/80 p-4 px-6 backdrop-blur-xl">
                <div className="min-w-0 flex-1 text-start">
                  {error && (
                    <div role="alert" className="flex items-center gap-1.5 text-sm text-destructive animate-in slide-in-from-right-2">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span className="font-medium">{error}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSaving} className="rounded-xl text-base">
                    {labels.cancel}
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSaving || !categories.length}
                    className="min-w-[120px] rounded-xl text-base bg-gradient-to-b from-primary to-primary/90 text-primary-foreground shadow-md shadow-primary/20 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/30 transition-all duration-300"
                  >
                    {isSaving && <LoaderCircle className="h-4 w-4 animate-spin me-2" />}
                    {isSaving ? labels.saving : isCreate ? labels.submit : labels.save}
                  </Button>
                </div>
              </div>

            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/* ---------- Helper Components ---------- */

function LanguagePanel({ code, dir, children }: { code: string; dir: "ltr" | "rtl"; children: ReactNode }) {
  return (
    <div className="space-y-4 rounded-xl border border-border/60 bg-muted/10 p-4 transition-all duration-300 focus-within:border-border/80 focus-within:bg-background focus-within:shadow-sm">
      <Badge variant="outline" dir={dir} className="font-semibold bg-background text-xs px-2.5 py-1">
        {code}
      </Badge>
      {children}
    </div>
  );
}

function Field({
  label,
  description,
  error,
  required,
  counter,
  children,
}: {
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  counter?: { current: number; max: number };
  children: (id: string) => ReactNode;
}) {
  const id = useId();
  const showCounter = counter && counter.current >= counter.max * 0.8;
  return (
    <div className="space-y-2 group text-right">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={id} className="text-sm font-semibold text-muted-foreground group-focus-within:text-primary transition-colors">
          {label}
          {required && <span className="ms-0.5 text-destructive" aria-hidden="true">*</span>}
        </Label>
        {showCounter && counter && (
          <span className={cn("shrink-0 text-xs tabular-nums", counter.current > counter.max ? "text-destructive" : "text-muted-foreground")} dir="ltr">
            {counter.current}/{counter.max}
          </span>
        )}
      </div>
      {children(id)}
      {error ? (
        <p className="flex items-center justify-end gap-1 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : description ? (
        <p className="text-xs text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}

function ImageTile({
  src,
  alt,
  unoptimized,
  isMain,
  mainLabel,
  removeLabel,
  disabled,
  onRemove,
}: {
  src: string;
  alt: string;
  unoptimized: boolean;
  isMain: boolean;
  mainLabel: string;
  removeLabel: string;
  disabled: boolean;
  onRemove: () => void;
}) {
  return (
    <div className={cn("group relative overflow-hidden rounded-xl border bg-muted transition-all duration-300", isMain ? "aspect-[21/9] border-primary ring-2 ring-primary/20 shadow-md" : "aspect-square border-border/50 hover:border-primary/40 hover:shadow-sm")}>
      <Image src={src} alt={alt} fill sizes={isMain ? "500px" : "80px"} unoptimized={unoptimized} className="object-cover transition-transform duration-500 group-hover:scale-105" />
      {isMain && <Badge className="absolute bottom-2 right-2 px-2.5 py-1 text-[10px] uppercase tracking-wider shadow-sm bg-primary/90 text-primary-foreground backdrop-blur-md">{mainLabel}</Badge>}
      <Button type="button" variant="destructive" size="icon" aria-label={removeLabel} disabled={disabled} onClick={onRemove} className={cn("absolute left-1.5 top-1.5 h-8 w-8 rounded-full opacity-0 shadow-lg transition-all duration-300 group-hover:opacity-100 focus-visible:opacity-100 hover:scale-110", !isMain && "h-7 w-7 left-1 top-1")}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}