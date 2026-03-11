"use client";

import { useState, useTransition, useRef, useCallback } from "react";
import { UploadCloud, Loader2, X, ImageOff } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createProductAction, updateProductAction } from "@/app/actions/admin";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProductForDrawer {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  details: string | null;
  price: number;
  category_id: string | null;
  track_stock: boolean;
  stock_qty: number;
  is_active: boolean;
  primaryImageUrl: string | null;
}

export interface CategoryOption {
  id: string;
  name: string;
}

interface ProductDrawerProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  product?: ProductForDrawer | null; // null = create mode
  categories: CategoryOption[];
}

// ---------------------------------------------------------------------------
// Field label helper
// ---------------------------------------------------------------------------

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
      {children}
    </label>
  );
}

// ---------------------------------------------------------------------------
// Image upload stub
// ---------------------------------------------------------------------------

/**
 * Stub — actual Supabase Storage upload wired in Phase 5 image step.
 * Returns a placeholder URL for now.
 */
async function uploadProductImage(file: File): Promise<string> {
  console.log("[ProductDrawer] uploadProductImage stub — file:", file.name, file.size);
  // TODO: replace with actual Supabase Storage upload
  // const { data, error } = await supabase.storage.from("product-images").upload(...)
  return URL.createObjectURL(file); // temporary blob URL (not persisted)
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ProductDrawer({
  open,
  onClose,
  onSaved,
  product,
  categories,
}: ProductDrawerProps) {
  const isEdit = Boolean(product);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    product?.primaryImageUrl ?? null
  );
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset preview when drawer opens with a different product
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        setError(null);
        setPreviewUrl(product?.primaryImageUrl ?? null);
        setUploadedImageUrl(null);
        onClose();
      }
    },
    [onClose, product]
  );

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setIsUploading(true);
    try {
      const url = await uploadProductImage(file);
      setPreviewUrl(url);
      setUploadedImageUrl(url);
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    if (uploadedImageUrl) formData.set("image_url", uploadedImageUrl);

    startTransition(async () => {
      const result = isEdit
        ? await updateProductAction(formData)
        : await createProductAction(formData);

      if (result && "error" in result) {
        setError(result.error);
      } else {
        onSaved();
        onClose();
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="w-[400px] sm:w-[400px] p-0 flex flex-col gap-0"
      >
        <SheetHeader className="h-16 px-6 border-b border-slate-100 flex flex-row items-center justify-between space-y-0">
          <SheetTitle className="text-lg font-semibold text-slate-900">
            {isEdit ? "Edit Product" : "Add New Product"}
          </SheetTitle>
        </SheetHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 overflow-hidden"
        >
          {/* Hidden fields */}
          {isEdit && (
            <input type="hidden" name="id" value={product!.id} />
          )}

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Image upload */}
            <div className="space-y-2">
              <FieldLabel>Product Image</FieldLabel>
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors ${
                  isDragging
                    ? "border-slate-400 bg-slate-100"
                    : "border-slate-200 bg-slate-50/50 hover:bg-slate-50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                  }}
                />
                {isUploading ? (
                  <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
                ) : previewUrl ? (
                  <div className="relative w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl}
                      alt="Product preview"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewUrl(null);
                        setUploadedImageUrl(null);
                      }}
                      className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow border border-slate-200 hover:bg-slate-100"
                    >
                      <X className="w-3 h-3 text-slate-600" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                      <UploadCloud className="w-6 h-6 text-slate-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-slate-900">
                        Click to upload
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        or drag and drop PNG, JPG up to 10MB
                      </p>
                    </div>
                  </>
                )}
                {!previewUrl && !isUploading && (
                  <ImageOff className="hidden" />
                )}
              </div>
            </div>

            {/* SKU + Price */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <FieldLabel>SKU Code</FieldLabel>
                <input
                  type="text"
                  name="sku"
                  required
                  defaultValue={product?.sku ?? ""}
                  placeholder="e.g. PRD-123"
                  className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Base Price (R)</FieldLabel>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
                    R
                  </span>
                  <input
                    type="number"
                    name="price"
                    required
                    min={0}
                    step="0.01"
                    defaultValue={product?.price ?? ""}
                    placeholder="0.00"
                    className="w-full h-10 pl-7 pr-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Product name */}
            <div className="space-y-1.5">
              <FieldLabel>Product Name</FieldLabel>
              <input
                type="text"
                name="name"
                required
                defaultValue={product?.name ?? ""}
                placeholder="Full descriptive name"
                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <FieldLabel>Category</FieldLabel>
              <Select
                name="category_id"
                defaultValue={product?.category_id ?? "none"}
              >
                <SelectTrigger className="h-10 text-sm border-slate-200 focus:ring-slate-900/10 focus:border-slate-900">
                  <SelectValue placeholder="Select category…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <FieldLabel>Description</FieldLabel>
              <Textarea
                name="description"
                rows={3}
                defaultValue={product?.description ?? ""}
                placeholder="Add product specifications, materials, and usage details…"
                className="text-sm border-slate-200 focus:ring-slate-900/10 focus:border-slate-900 resize-none"
              />
            </div>

            {/* Details (additional technical info) */}
            <div className="space-y-1.5">
              <FieldLabel>Technical Details</FieldLabel>
              <Textarea
                name="details"
                rows={2}
                defaultValue={product?.details ?? ""}
                placeholder="Dimensions, grades, standards…"
                className="text-sm border-slate-200 focus:ring-slate-900/10 focus:border-slate-900 resize-none"
              />
            </div>

            {/* Stock tracking */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Track Stock
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Enable inventory quantity tracking
                  </p>
                </div>
                <input
                  type="hidden"
                  name="track_stock"
                  value={product?.track_stock ? "true" : "false"}
                />
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked={product?.track_stock ?? false}
                    onChange={(e) => {
                      const hidden = e.currentTarget
                        .closest("form")
                        ?.querySelector<HTMLInputElement>('input[name="track_stock"]');
                      if (hidden) hidden.value = e.currentTarget.checked ? "true" : "false";
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 rounded-full peer-checked:bg-slate-900 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                </label>
              </div>

              <div className="space-y-1.5">
                <FieldLabel>Stock Quantity</FieldLabel>
                <input
                  type="number"
                  name="stock_qty"
                  min={0}
                  step={1}
                  defaultValue={product?.stock_qty ?? 0}
                  className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
                />
              </div>
            </div>

            {/* Active toggle (edit mode only) */}
            {isEdit && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div>
                  <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Active
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Visible to buyers in the catalogue
                  </p>
                </div>
                <input
                  type="hidden"
                  name="is_active"
                  value={product?.is_active ? "true" : "false"}
                />
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked={product?.is_active ?? true}
                    onChange={(e) => {
                      const hidden = e.currentTarget
                        .closest("form")
                        ?.querySelector<HTMLInputElement>('input[name="is_active"]');
                      if (hidden) hidden.value = e.currentTarget.checked ? "true" : "false";
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 rounded-full peer-checked:bg-slate-900 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                </label>
              </div>
            )}
          </div>

          {/* Sticky footer */}
          <div className="p-6 border-t border-slate-100 bg-white">
            {error && (
              <p className="text-xs text-red-600 mb-3">{error}</p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-11 px-4 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex-[2] h-11 px-4 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving…
                  </>
                ) : isEdit ? (
                  "Save Changes"
                ) : (
                  "Save Product"
                )}
              </button>
            </div>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
