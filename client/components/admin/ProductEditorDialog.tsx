"use client";

import Image from "next/image";
import { Dialog } from "radix-ui";
import {
  AlertCircle,
  Check,
  ImagePlus,
  LoaderCircle,
  Receipt,
  Tag,
  Trash2,
  X,
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { MAX_PRODUCT_IMAGES, productFormSchema } from "@/lib/validations/admin-product";
import { AdminFieldInput } from "./AdminFieldInput";
import { SharedSelect } from "@/components/shared/SharedSelect";
import {
  getCloudinaryPublicId,
  type AdminCategory,
  type AdminProduct,
  type ProductFormData,
} from "./types";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface ProductEditorDialogProps {
  open: boolean;
  isCreate: boolean;
  product: AdminProduct | null;
  categories: AdminCategory[];
  isSaving: boolean;
  labels: {
    title: string;
    description: string;
    submit: string;
    removeImage: string;
    close: string;
    titleEn: string;
    titleAr: string;
    descriptionEn: string;
    descriptionAr: string;
    baseSalary: string;
    profit: string;
    discount: string;
    counts: string;
    category: string;
    images: string;
    addImages: string;
    cancel: string;
    save: string;
    saving: string;
    invalidForm: string;
    saveError: string;
    invalidImageType: string;
    fileTooLarge: string;
    selectCategory: string;
    noCategories: string;
    tooManyImages: string;
    sectionDetails: string;
    sectionPricing: string;
    sectionImages: string;
    finalPrice: string;
    mainImage: string;
    dropImages: string;
  };
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
  const fileInputId = useId();
  const [fields, setFields] = useState<FormFields>(() => getInitialFields(product));
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [newFiles, setNewFiles] = useState<Array<{ file: File; preview: string }>>([]);
  const [error, setError] = useState("");
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

  const pricePreview = useMemo(() => {
    if (fields.baseSalary === "" || fields.profit === "") return null;
    const base = Number(fields.baseSalary);
    const profit = Number(fields.profit);
    const discount = Number(fields.discount || 0);
    if (![base, profit, discount].every(Number.isFinite)) return null;
    if (base <= 0 || profit < 0 || discount < 0 || discount > 100) return null;
    const original = base + profit;
    return { original, final: original * (1 - discount / 100), discount };
  }, [fields.baseSalary, fields.profit, fields.discount]);

  const selectedCategory = categories.find((c) => c.id === fields.categoryId);

  const updateField = (field: keyof FormFields, value: string) => {
    setFields((current) => ({ ...current, [field]: value }));
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
      setError(labels.invalidForm);
      return;
    }
    if (isCreate && parsed.data.counts < 1) {
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

  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => !isSaving && onOpenChange(nextOpen)}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[92vh] w-[min(56rem,calc(100vw-1.5rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
          {/* Header — right aligned, with live summary */}
          <div className="border-b border-border bg-muted/30 px-5 py-4 sm:px-7 sm:py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 space-y-1 text-start">
                <Dialog.Title className="truncate text-xl font-bold leading-tight">
                  {labels.title}
                </Dialog.Title>
                <Dialog.Description className="text-sm text-muted-foreground">
                  {labels.description}
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={isSaving}
                  aria-label={labels.close}
                  className="-me-2 shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </Dialog.Close>
            </div>

            {/* Live summary chips */}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-start">
              {selectedCategory ? (
                <Badge variant="outline" className="gap-1">
                  <Tag className="h-3 w-3" />
                  {selectedCategory.title}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground">
                  {labels.selectCategory}
                </Badge>
              )}
              {pricePreview && (
                <Badge variant="secondary" className="tabular-nums" dir="ltr">
                  {pricePreview.final.toFixed(2)}
                </Badge>
              )}
              <Badge variant="secondary" className="tabular-nums" dir="ltr">
                {totalImages}/{MAX_PRODUCT_IMAGES}
              </Badge>
            </div>
          </div>

          <form className="flex min-h-0 flex-1 flex-col" onSubmit={submit}>
            <div className="flex-1 space-y-8 overflow-y-auto px-5 py-6 sm:px-7">
              {/* Details */}
              <section className="space-y-4 text-start">
                <SectionHeading index={1}>{labels.sectionDetails}</SectionHeading>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    label={labels.titleEn}
                    required
                    counter={{ current: fields.titleEn.length, max: 100 }}
                  >
                    {(id) => (
                      <TitleInput
                        id={id}
                        dir="ltr"
                        value={fields.titleEn}
                        onChange={(value) => updateField("titleEn", value)}
                      />
                    )}
                  </Field>
                  <Field
                    label={labels.titleAr}
                    required
                    counter={{ current: fields.titleAr.length, max: 100 }}
                  >
                    {(id) => (
                      <TitleInput
                        id={id}
                        dir="rtl"
                        value={fields.titleAr}
                        onChange={(value) => updateField("titleAr", value)}
                      />
                    )}
                  </Field>
                  <Field
                    label={labels.descriptionEn}
                    required
                    counter={{ current: fields.descriptionEn.length, max: 5000 }}
                  >
                    {(id) => (
                      <DescriptionInput
                        id={id}
                        dir="ltr"
                        value={fields.descriptionEn}
                        onChange={(value) => updateField("descriptionEn", value)}
                      />
                    )}
                  </Field>
                  <Field
                    label={labels.descriptionAr}
                    required
                    counter={{ current: fields.descriptionAr.length, max: 5000 }}
                  >
                    {(id) => (
                      <DescriptionInput
                        id={id}
                        dir="rtl"
                        value={fields.descriptionAr}
                        onChange={(value) => updateField("descriptionAr", value)}
                      />
                    )}
                  </Field>
                  <div className="sm:col-span-2">
                    <Field
                      label={labels.category}
                      required
                      description={labels.selectCategory}
                      error={!categories.length ? labels.noCategories : undefined}
                    >
                      {(id) => (
                        <SharedSelect
                          value={fields.categoryId}
                          onValueChange={(value) => updateField("categoryId", value)}
                          options={categories.map((category) => ({
                            value: category.id,
                            label: category.title,
                          }))}
                          placeholder={labels.selectCategory}
                          id={id}
                          className={cn(
                            "w-full bg-background text-start sm:max-w-sm",
                            "focus:ring-2 focus:ring-primary/30 focus:ring-offset-0"
                          )}
                        />
                      )}
                    </Field>
                  </div>
                </div>
              </section>

              {/* Pricing & stock */}
              <section className="space-y-4 text-start">
                <SectionHeading index={2}>{labels.sectionPricing}</SectionHeading>
                <div className="rounded-xl border border-border bg-muted/30 p-4 sm:p-5">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Field label={labels.baseSalary} required>
                      {(id) => (
                        <MoneyInput
                          id={id}
                          min="0.01"
                          value={fields.baseSalary}
                          onChange={(value) => updateField("baseSalary", value)}
                        />
                      )}
                    </Field>
                    <Field label={labels.profit} required description="Added to base salary">
                      {(id) => (
                        <MoneyInput
                          id={id}
                          min="0"
                          value={fields.profit}
                          onChange={(value) => updateField("profit", value)}
                        />
                      )}
                    </Field>
                    <Field label={labels.discount} required>
                      {(id) => (
                        <PercentInput
                          id={id}
                          value={fields.discount}
                          onChange={(value) => updateField("discount", value)}
                        />
                      )}
                    </Field>
                    <Field label={labels.counts} required>
                      {(id) => (
                        <CountInput
                          id={id}
                          value={fields.counts}
                          onChange={(value) => updateField("counts", value)}
                        />
                      )}
                    </Field>
                  </div>

                  {pricePreview && (
                    <div
                      className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-4 py-3"
                      aria-live="polite"
                    >
                      <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Receipt className="h-4 w-4" aria-hidden="true" />
                        {labels.finalPrice}
                      </span>
                      <div className="flex items-baseline gap-3">
                        {pricePreview.discount > 0 && (
                          <span className="text-sm tabular-nums text-muted-foreground line-through">
                            {pricePreview.original.toFixed(2)}
                          </span>
                        )}
                        <span className="text-lg font-bold tabular-nums text-foreground">
                          {pricePreview.final.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Images */}
              <section className="space-y-4 text-start">
                <SectionHeading
                  index={3}
                  trailing={
                    <Badge
                      variant={imagesFull ? "destructive" : "secondary"}
                      className="tabular-nums"
                      dir="ltr"
                    >
                      {totalImages}/{MAX_PRODUCT_IMAGES}
                    </Badge>
                  }
                >
                  {labels.sectionImages}
                </SectionHeading>

                <label
                  htmlFor={fileInputId}
                  onDragOver={(event) => {
                    event.preventDefault();
                    if (!imagesFull && !isSaving) setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setIsDragging(false);
                    if (!imagesFull && !isSaving) addFiles(event.dataTransfer.files);
                  }}
                  className={cn(
                    "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-7 text-center transition-all focus-within:ring-2 focus-within:ring-ring/50",
                    isDragging
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border hover:border-primary/50 hover:bg-muted/40",
                    (imagesFull || isSaving) && "pointer-events-none opacity-50"
                  )}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <ImagePlus className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="text-sm font-medium text-foreground">{labels.dropImages}</span>
                  <span className="text-xs text-muted-foreground">{labels.addImages}</span>
                  <input
                    id={fileInputId}
                    type="file"
                    accept={ACCEPTED_TYPES.join(",")}
                    multiple
                    disabled={imagesFull || isSaving}
                    className="sr-only"
                    onChange={(event) => {
                      addFiles(event.target.files);
                      event.target.value = "";
                    }}
                  />
                </label>

                {totalImages > 0 && (
                  <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                    {images.map((url, index) => (
                      <li key={`${url}-${index}`}>
                        <ImageTile
                          src={url}
                          alt=""
                          isMain={index === 0}
                          mainLabel={labels.mainImage}
                          removeLabel={`${labels.removeImage}: ${index + 1}`}
                          disabled={isSaving}
                          onRemove={() =>
                            setImages((current) =>
                              current.filter((_, itemIndex) => itemIndex !== index)
                            )
                          }
                        />
                      </li>
                    ))}
                    {newFiles.map(({ file, preview }, index) => (
                      <li key={preview}>
                        <ImageTile
                          src={preview}
                          alt={file.name}
                          unoptimized
                          isMain={images.length === 0 && index === 0}
                          mainLabel={labels.mainImage}
                          removeLabel={`${labels.removeImage}: ${file.name}`}
                          disabled={isSaving}
                          onRemove={() => removeNewFile(preview)}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {error && (
                <Alert variant="destructive" role="alert" className="text-start">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>

            {/* Sticky footer — right aligned */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/30 px-5 py-4 sm:px-7">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {!error && totalImages > 0 && fields.categoryId ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                    <span>{labels.sectionDetails}</span>
                  </>
                ) : null}
              </div>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSaving}
                  onClick={() => onOpenChange(false)}
                >
                  {labels.cancel}
                </Button>
                <Button
                  type="submit"
                  className="min-w-28 gap-2"
                  disabled={isSaving || !categories.length}
                >
                  {isSaving && (
                    <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                  )}
                  {isSaving ? labels.saving : isCreate ? labels.submit : labels.save}
                </Button>
              </div>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/* ---------- Sub-components ---------- */

function SectionHeading({
  index,
  children,
  trailing,
}: {
  index: number;
  children: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary tabular-nums">
        {index}
      </span>
      <h3 className="text-sm font-semibold text-foreground">{children}</h3>
      <Separator className="flex-1" />
      {trailing}
    </div>
  );
}

function Field({
  label,
  description,
  hint,
  error,
  required,
  counter,
  children,
}: {
  label: string;
  description?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  counter?: { current: number; max: number };
  children: (id: string) => ReactNode;
}) {
  const id = useId();
  return (
    <div className="space-y-1.5 text-start">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={id} className="text-start text-sm font-medium">
          {label}
          {required && (
            <span className="ms-0.5 text-destructive" aria-hidden="true">
              *
            </span>
          )}
        </Label>
        {counter && (
          <span
            className={cn(
              "shrink-0 text-[11px] tabular-nums",
              counter.current > counter.max
                ? "text-destructive"
                : "text-muted-foreground"
            )}
            dir="ltr"
          >
            {counter.current}/{counter.max}
          </span>
        )}
      </div>
      {children(id)}
      {error ? (
        <p className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : description ? (
        <p className="text-xs text-muted-foreground">{description}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function MoneyInput({
  id,
  min,
  value,
  onChange,
  invalid,
}: {
  id: string;
  min: string;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
}) {
  return (
    <AdminFieldInput
      id={id}
      required
      type="number"
      inputMode="decimal"
      min={min}
      step="0.01"
      dir="ltr"
      className="text-start tabular-nums"
      invalid={invalid}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function PercentInput({
  id,
  value,
  onChange,
  invalid,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
}) {
  return (
    <AdminFieldInput
      id={id}
      required
      type="number"
      inputMode="decimal"
      min="0"
      max="100"
      step="0.01"
      dir="ltr"
      className="text-start tabular-nums"
      suffix="%"
      invalid={invalid}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function CountInput({
  id,
  value,
  onChange,
  invalid,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
}) {
  return (
    <AdminFieldInput
      id={id}
      required
      type="number"
      inputMode="numeric"
      min="0"
      step="1"
      dir="ltr"
      className="text-start tabular-nums"
      invalid={invalid}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function TitleInput({
  id,
  dir,
  value,
  onChange,
  invalid,
}: {
  id: string;
  dir: "ltr" | "rtl";
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
}) {
  return (
    <AdminFieldInput
      id={id}
      required
      maxLength={100}
      dir={dir}
      value={value}
      invalid={invalid}
      className="bg-background font-medium"
      placeholder={dir === "rtl" ? "مثال: قميص قطني" : "e.g. Cotton shirt"}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function DescriptionInput({
  id,
  dir,
  value,
  onChange,
  invalid,
}: {
  id: string;
  dir: "ltr" | "rtl";
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
}) {
  return (
    <Textarea
      id={id}
      required
      maxLength={5000}
      rows={4}
      dir={dir}
      value={value}
      aria-invalid={invalid || undefined}
      className={cn(
        "resize-y bg-background transition-shadow",
        "focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-0",
        "aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive/30"
      )}
      onChange={(event) => onChange(event.target.value)}
    />
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
  unoptimized?: boolean;
  isMain: boolean;
  mainLabel: string;
  removeLabel: string;
  disabled: boolean;
  onRemove: () => void;
}) {
  return (
    <div
      className={cn(
        "group relative aspect-square overflow-hidden rounded-xl border bg-muted transition-shadow",
        isMain
          ? "border-primary ring-2 ring-primary/25"
          : "border-border hover:border-primary/40"
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="160px"
        unoptimized={unoptimized}
        className="object-cover transition-transform group-hover:scale-105"
      />
      {isMain && (
        <Badge className="absolute bottom-2 start-2 px-2 py-0.5 text-[11px] shadow-sm">
          {mainLabel}
        </Badge>
      )}
      <Button
        type="button"
        variant="destructive"
        size="icon-sm"
        aria-label={removeLabel}
        className="absolute end-2 top-2 rounded-full opacity-0 shadow-sm transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
        disabled={disabled}
        onClick={onRemove}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}