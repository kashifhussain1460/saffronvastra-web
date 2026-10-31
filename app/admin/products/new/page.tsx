"use client";

import { BRAND } from "@/lib/brand";
import React, { Suspense, useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from "@/lib/uploadLimits";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronRight,
  Upload,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  MoreVertical,
  HelpCircle,
  Eye,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Link2,
  Image as ImageIcon,
  Code,
  Sparkles,
  Search,
  Tag,
  SlidersHorizontal,
} from "lucide-react";

interface ApiCategory {
  id: string;
  name: string;
  slug: string;
}

interface ApiCollection {
  id: string;
  title: string;
  slug: string;
}

type FieldErrors = Record<string, string>;

const SIZE_KEYS = ["S", "M", "L", "XL", "Free Size"] as const;
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_IMAGE_BYTES = MAX_UPLOAD_BYTES;
const MAX_IMAGES = 20;
const MAX_PRICE = 5_000_000;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;

// Which wizard step shows each validated field.
const FIELD_STEP: Record<string, number> = {
  name: 1,
  slug: 1,
  description: 1,
  category: 2,
  price: 3,
  compare: 3,
  colours: 3,
  sizes: 3,
  prices: 3,
  images: 4,
  displayOrder: 2,
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);

const priceKey = (colourName: string, size: string) => `${colourName.trim().toLowerCase()}|${size}`;

const leadTimeLabelForDays = (days: number) => {
  if (days <= 5) return "5 - 7 business days";
  if (days <= 7) return "7 - 10 days";
  return "10 - 14 business days";
};

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-[11px] text-error mt-1">
      {message}
    </p>
  );
}

function AdminNewProductWizard() {
  const [currentStep, setStepRaw] = useState<number>(1);
  const [showDraftNotice, setShowDraftNotice] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditing = Boolean(editId);

  const [productId, setProductId] = useState<string | null>(editId);
  const [isLoadingProduct, setIsLoadingProduct] = useState(Boolean(editId));
  const [loadError, setLoadError] = useState("");
  const [resolvedCategoryId, setResolvedCategoryId] = useState("");
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [categoriesData, setCategoriesData] = useState<ApiCategory[]>([]);
  const [collectionsData, setCollectionsData] = useState<ApiCollection[]>([]);
  const [catalogueError, setCatalogueError] = useState("");

  // STEP 1 STATE: Basic Information
  const [productName, setProductName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [shortDescription, setShortDescription] = useState("");
  const [detailedDescription, setDetailedDescription] = useState("");
  const [brand, setBrand] = useState(`${BRAND.name}`);
  const [productType, setProductType] = useState("Jacket");
  const [material, setMaterial] = useState("Velvet");
  const [embroideryTechnique, setEmbroideryTechnique] = useState("Hand Embroidery");
  const [careInstructions, setCareInstructions] = useState("");
  const [productionLeadTime, setProductionLeadTime] = useState("7 - 10 days");

  // STEP 2 STATE: Categories & Collections (loaded from the catalogue API)
  const [primaryCategory, setPrimaryCategory] = useState("");
  const [newCategoryInput, setNewCategoryInput] = useState("");
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [collectionSearch, setCollectionSearch] = useState("");
  const [newCollectionInput, setNewCollectionInput] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBestseller, setIsBestseller] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(false);
  const [displayOrder, setDisplayOrder] = useState("1");

  const allCategoriesList = categoriesData.map((c) => c.name);
  const allCollectionsList = collectionsData.map((c) => c.title);

  // STEP 3 STATE: Variants & Pricing
  const [colourVariants, setColourVariants] = useState([{ id: "c1", name: "", hex: "#6B1F1F" }]);
  const [sizeOptions, setSizeOptions] = useState<Record<string, boolean>>({
    S: false,
    M: false,
    L: false,
    XL: false,
    "Free Size": false,
  });
  const [priceType, setPriceType] = useState<"same" | "different">("same");
  const [basePrice, setBasePrice] = useState("");
  const [compareAtPrice, setCompareAtPrice] = useState("");
  // Per-variant price overrides, keyed by priceKey(colour, size); blank means "use the base price".
  const [variantPrices, setVariantPrices] = useState<Record<string, string>>({});

  // STEP 4 STATE: Images (uploaded through the media API)
  const [uploadedImages, setUploadedImages] = useState<{ id: string; src: string }[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [imageError, setImageError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const savedSnapshot = useRef<string | null>(null);
  const loadedVersion = useRef<string | null>(null);
  const isSubmittingRef = useRef(false);

  // STEP 5 STATE: SEO & Publish (SEO fields are not stored by the backend yet)
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [focusKeywords, setFocusKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [productStatus, setProductStatus] = useState<"draft" | "published" | "archived">("draft");

  // Stepper Header Configuration
  const steps = [
    { number: 1, title: "Basic Information" },
    { number: 2, title: "Categories & Collections" },
    { number: 3, title: "Variants & Pricing" },
    { number: 4, title: "Images" },
    { number: 5, title: "SEO & Publish" },
  ];

  // Load categories and collections, then (when editing) the stored product.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [catRes, colRes] = await Promise.all([
          fetch("/api/v1/categories", { credentials: "include" }),
          fetch("/api/v1/collections", { credentials: "include" }),
        ]);
        if (!catRes.ok || !colRes.ok) throw new Error("catalogue");
        const cats: ApiCategory[] = (await catRes.json()).data || [];
        const cols: ApiCollection[] = (await colRes.json()).data || [];
        if (cancelled) return;
        setCategoriesData(cats);
        setCollectionsData(cols);

        if (editId) {
          const res = await fetch(`/api/v1/admin/products/${editId}`, { credentials: "include" });
          const body = await res.json().catch(() => null);
          if (!res.ok || !body?.data) throw new Error(body?.message || "Product not found");
          const p = body.data;
          if (cancelled) return;
          setProductName(p.title || "");
          setSlug(p.slug || "");
          setSlugTouched(true);
          setDetailedDescription(p.description || "");
          setMaterial(p.material || "Velvet");
          setEmbroideryTechnique(p.embroidery || "Hand Embroidery");
          setCareInstructions(p.careInstructions || "");
          setShortDescription(p.shortDescription || "");
          setBrand(p.brand || `${BRAND.name}`);
          setProductType(p.productType || "Jacket");
          setMetaTitle(p.seoTitle || "");
          setMetaDescription(p.seoDescription || "");
          setFocusKeywords(Array.isArray(p.focusKeywords) ? p.focusKeywords : []);
          setDisplayOrder(String(p.displayOrder ?? 0));
          setProductionLeadTime(
            p.availabilityMode === "Available to Order" ? "Available to Order" : leadTimeLabelForDays(p.leadTimeDays || 7)
          );
          setBasePrice(String(p.basePriceMinor / 100));
          setCompareAtPrice(p.comparePriceMinor ? String(p.comparePriceMinor / 100) : "");
          setIsFeatured(Boolean(p.isFeatured));
          setIsBestseller(Boolean(p.isBestseller));
          setIsNewArrival(Boolean(p.isNewArrival));
          const category = cats.find((c) => c.id === p.categoryId);
          if (category) {
            setResolvedCategoryId(category.id);
            setPrimaryCategory(category.name);
          }
          const linked: string[] = (p.collections || []).map((c: any) => c.collectionId);
          setSelectedCollections(cols.filter((c) => linked.includes(c.id)).map((c) => c.title));
          setUploadedImages((p.images || []).map((img: any) => ({ id: img.id, src: img.url })));
          const activeVariants = (p.variants || []).filter((v: any) => v.status === "Active");
          const colours = new Map<string, { id: string; name: string; hex: string }>();
          activeVariants.forEach((v: any) => {
            if (!colours.has(v.colourName)) colours.set(v.colourName, { id: `c${colours.size + 1}`, name: v.colourName, hex: v.colourHex });
          });
          if (colours.size > 0) setColourVariants(Array.from(colours.values()));
          const sizes: Record<string, boolean> = { S: false, M: false, L: false, XL: false, "Free Size": false };
          activeVariants.forEach((v: any) => {
            sizes[v.size] = true;
          });
          setSizeOptions(sizes);
          const overrides: Record<string, string> = {};
          activeVariants.forEach((v: any) => {
            if (v.priceOverrideMinor) overrides[priceKey(v.colourName, v.size)] = String(v.priceOverrideMinor / 100);
          });
          if (Object.keys(overrides).length > 0) {
            setVariantPrices(overrides);
            setPriceType("different");
          }
          setProductStatus(p.status === "Active" ? "published" : p.status === "Archived" ? "archived" : "draft");
          loadedVersion.current = p.updatedAt || null;
        }
      } catch (err: any) {
        if (cancelled) return;
        if (editId) setLoadError(err?.message === "catalogue" ? "Could not load categories and collections." : err?.message || "Could not load the product.");
        else setCatalogueError("Could not load categories and collections. Reload the page to try again.");
      } finally {
        if (!cancelled) setIsLoadingProduct(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editId]);

  // The slug follows the product name until the admin edits it by hand.
  const handleProductNameChange = (value: string) => {
    setProductName(value);
    if (!slugTouched) setSlug(slugify(value));
  };

  // ---------------------------------------------------------------------
  // Validation (mirrors the server rules; the server remains the authority)
  // ---------------------------------------------------------------------
  const validate = (mode: "draft" | "publish"): FieldErrors => {
    const e: FieldErrors = {};
    const name = productName.trim();
    if (!name) e.name = "Product name is required";
    else if (name.length > 200) e.name = "Product name must be 200 characters or fewer";

    const cleanSlug = slug.trim();
    if (!cleanSlug) e.slug = "Slug is required";
    else if (cleanSlug.length > 120 || !SLUG_PATTERN.test(cleanSlug)) {
      e.slug = "Slug may contain only lowercase letters, numbers and single hyphens";
    }

    if (!detailedDescription.trim()) e.description = "Detailed description is required";
    else if (detailedDescription.length > 2000) e.description = "Detailed description must be 2000 characters or fewer";

    if (!resolvedCategoryId) e.category = "Select a primary category";

    if (displayOrder.trim() !== "") {
      const order = Number(displayOrder);
      if (!Number.isInteger(order) || order < 0 || order > 10000) e.displayOrder = "Display order must be a whole number between 0 and 10000";
    }

    const price = Number(basePrice);
    if (basePrice.trim() === "" || !Number.isFinite(price) || price <= 0) e.price = "Price must be greater than zero";
    else if (price > MAX_PRICE) e.price = "Price cannot exceed 5,000,000";
    else if (Math.round(price * 100) / 100 !== price) e.price = "Price can have at most 2 decimal places";

    if (compareAtPrice.trim() !== "") {
      const compare = Number(compareAtPrice);
      if (!Number.isFinite(compare) || compare <= 0) e.compare = "Compare-at price must be a valid amount";
      else if (!e.price && compare <= price) e.compare = "Compare-at price must be greater than the regular price";
    }

    const names = colourVariants.map((c) => c.name.trim().toLowerCase());
    if (colourVariants.length === 0 || names.some((n) => !n)) e.colours = "Add at least one colour and give each colour a name";
    else if (new Set(names).size !== names.length) e.colours = "Colour names must be unique";
    else if (colourVariants.some((c) => !HEX_PATTERN.test(c.hex))) e.colours = "Colour hex must look like #6B1F1F";

    if (!SIZE_KEYS.some((s) => sizeOptions[s])) e.sizes = "Select at least one size";

    if (priceType === "different") {
      const bad = Object.values(variantPrices).some((v) => {
        if (v.trim() === "") return false;
        const n = Number(v);
        return !Number.isFinite(n) || n <= 0 || n > MAX_PRICE || Math.round(n * 100) / 100 !== n;
      });
      if (bad) e.prices = "Variant prices must be greater than zero, with at most 2 decimal places";
    }

    if (mode === "publish" && uploadedImages.length === 0) e.images = "Add at least one product image before publishing";
    return e;
  };

  const firstErrorStep = (errs: FieldErrors) =>
    Math.min(...Object.keys(errs).map((k) => FIELD_STEP[k] ?? 1));

  // Moving forward is gated by the steps being left; going back is always allowed.
  const setCurrentStep = (target: number) => {
    if (target <= currentStep) {
      setStepRaw(target);
      return;
    }
    const all = validate("draft");
    const blocking: FieldErrors = {};
    Object.entries(all).forEach(([key, msg]) => {
      if ((FIELD_STEP[key] ?? 1) < target) blocking[key] = msg;
    });
    setErrors(blocking);
    if (Object.keys(blocking).length > 0) {
      setStepRaw(Math.min(firstErrorStep(blocking), currentStep));
      return;
    }
    setStepRaw(target);
  };

  // ---------------------------------------------------------------------
  // Variants
  // ---------------------------------------------------------------------
  const selectedSizes = SIZE_KEYS.filter((s) => sizeOptions[s]);

  const handleAddColour = () => {
    setColourVariants([...colourVariants, { id: `c${Date.now()}`, name: "", hex: "#D4AF37" }]);
  };

  const handleRemoveColour = (id: string) => {
    if (colourVariants.length <= 1) return;
    setColourVariants(colourVariants.filter((c) => c.id !== id));
  };

  // ---------------------------------------------------------------------
  // Categories and collections
  // ---------------------------------------------------------------------
  const handleRemoveCollectionPill = (col: string) => {
    setSelectedCollections(selectedCollections.filter((c) => c !== col));
  };

  const handleSelectPrimaryCategory = (catName: string) => {
    setPrimaryCategory(catName);
    const match = categoriesData.find((c) => c.name === catName);
    if (match) setResolvedCategoryId(match.id);
  };

  // Custom categories and collections are created for real, so every chip maps to a stored record.
  const handleAddCustomCategory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newCategoryInput.trim();
    if (!trimmed) return;
    const existing = categoriesData.find((c) => c.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      handleSelectPrimaryCategory(existing.name);
      setNewCategoryInput("");
      return;
    }
    try {
      const res = await fetch("/api/v1/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: trimmed, slug: slugify(trimmed) }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.data) throw new Error(body?.message || "Could not create the category");
      setCategoriesData((prev) => [...prev, body.data]);
      setPrimaryCategory(body.data.name);
      setResolvedCategoryId(body.data.id);
      setErrors((prev) => {
        const { category: _removed, ...rest } = prev;
        return rest;
      });
      setNewCategoryInput("");
      setCatalogueError("");
    } catch (err: any) {
      setCatalogueError(err?.message || "Could not create the category");
    }
  };

  const toggleCollection = (col: string) => {
    if (selectedCollections.includes(col)) {
      setSelectedCollections(selectedCollections.filter((c) => c !== col));
    } else {
      setSelectedCollections([...selectedCollections, col]);
    }
  };

  const handleAddCustomCollection = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newCollectionInput.trim();
    if (!trimmed) return;
    const existing = collectionsData.find((c) => c.title.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      if (!selectedCollections.includes(existing.title)) setSelectedCollections([...selectedCollections, existing.title]);
      setNewCollectionInput("");
      return;
    }
    try {
      const res = await fetch("/api/v1/admin/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title: trimmed }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.data) throw new Error(body?.message || "Could not create the collection");
      setCollectionsData((prev) => [...prev, body.data]);
      setSelectedCollections((prev) => [...prev, body.data.title]);
      setNewCollectionInput("");
      setCatalogueError("");
    } catch (err: any) {
      setCatalogueError(err?.message || "Could not create the collection");
    }
  };

  const handleSelectAllCollections = () => {
    setSelectedCollections(Array.from(new Set([...selectedCollections, ...allCollectionsList])));
  };

  const handleClearCollections = () => {
    setSelectedCollections([]);
  };

  const filteredCollections = allCollectionsList.filter((c) =>
    c.toLowerCase().includes(collectionSearch.toLowerCase().trim())
  );

  const handleRemoveKeyword = (kw: string) => {
    setFocusKeywords(focusKeywords.filter((k) => k !== kw));
  };

  const addKeywordsFromString = (input: string) => {
    const rawTokens = input.split(",").map((t) => t.trim()).filter(Boolean);
    if (rawTokens.length === 0) return;
    const next = [...focusKeywords];
    for (const token of rawTokens) {
      if (!next.includes(token) && token.length <= 50) {
        next.push(token);
      }
    }
    setFocusKeywords(next);
  };

  const handleAddKeyword = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && keywordInput.trim()) {
      e.preventDefault();
      addKeywordsFromString(keywordInput);
      setKeywordInput("");
    }
  };

  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.includes(",")) {
      addKeywordsFromString(val);
      setKeywordInput("");
    } else {
      setKeywordInput(val);
    }
  };

  // ---------------------------------------------------------------------
  // Images
  // ---------------------------------------------------------------------
  const handleImageFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (list.length === 0) return;
    const problems: string[] = [];
    const accepted = list.filter((file) => {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        problems.push(`${file.name}: only PNG, JPG or WebP images are allowed`);
        return false;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        problems.push(`${file.name}: larger than ${MAX_UPLOAD_LABEL}`);
        return false;
      }
      return true;
    });
    const room = MAX_IMAGES - uploadedImages.length;
    const toUpload = accepted.slice(0, Math.max(room, 0));
    if (accepted.length > toUpload.length) problems.push(`A product can have at most ${MAX_IMAGES} images`);
    setImageError(problems.join("; "));
    if (toUpload.length === 0) return;

    setIsUploadingImages(true);
    for (const file of toUpload) {
      try {
        const form = new FormData();
        form.append("file", file);
        form.append("folder", "Product Images");
        form.append("altText", productName.trim() || file.name);
        const res = await fetch("/api/v1/admin/media/upload", { method: "POST", credentials: "include", body: form });
        const body = await res.json().catch(() => null);
        if (!res.ok || !body?.data?.url) throw new Error(body?.message || "Upload failed");
        setUploadedImages((prev) => [...prev, { id: body.data.id, src: body.data.url }]);
        setErrors((prev) => {
          const { images: _removed, ...rest } = prev;
          return rest;
        });
      } catch (err: any) {
        setImageError((prev) => [prev, `${file.name}: ${err?.message || "upload failed"}`].filter(Boolean).join("; "));
      }
    }
    setIsUploadingImages(false);
  };

  const handleRemoveImage = (id: string) => {
    setUploadedImages((prev) => prev.filter((img) => img.id !== id));
  };

  // The first image is the cover; "make cover" moves an image to the front.
  const handleMakeCover = (id: string) => {
    setUploadedImages((prev) => {
      const picked = prev.find((img) => img.id === id);
      return picked ? [picked, ...prev.filter((img) => img.id !== id)] : prev;
    });
  };

  // ---------------------------------------------------------------------
  // Save / publish
  // ---------------------------------------------------------------------
  const buildProductPayload = (status: "Draft" | "Active") => {
    const variants = colourVariants.flatMap((col) =>
      selectedSizes.map((size) => {
        const override = priceType === "different" ? variantPrices[priceKey(col.name, size)] : "";
        return {
          size,
          colourName: col.name.trim(),
          colourHex: col.hex,
          priceOverrideMinor: override && override.trim() !== "" ? Math.round(Number(override) * 100) : null,
        };
      })
    );
    const days = parseInt(productionLeadTime, 10);

    return {
      title: productName.trim(),
      slug: slug.trim(),
      description: detailedDescription.trim(),
      material,
      embroidery: embroideryTechnique,
      careInstructions: careInstructions.trim() || null,
      shortDescription: shortDescription.trim() || null,
      brand,
      productType,
      seoTitle: metaTitle.trim() || null,
      seoDescription: metaDescription.trim() || null,
      focusKeywords,
      displayOrder: displayOrder.trim() === "" ? 0 : Number(displayOrder),
      price: Number(basePrice),
      compareAtPrice: compareAtPrice.trim() ? Number(compareAtPrice) : null,
      leadTimeDays: Number.isFinite(days) ? days : 7,
      availabilityMode: productionLeadTime === "Available to Order" ? "Available to Order" : "Made to Order",
      status,
      isFeatured,
      isBestseller,
      isNewArrival,
      categoryId: resolvedCategoryId,
      collectionIds: collectionsData.filter((c) => selectedCollections.includes(c.title)).map((c) => c.id),
      images: uploadedImages.map((img) => ({ url: img.src, altText: productName.trim() })),
      variants,
    };
  };

  // Returns true only when the server confirmed the save.
  const persistProduct = async (status: "Draft" | "Active"): Promise<boolean> => {
    if (isSubmittingProduct) return false;
    setSubmitError("");
    const errs = validate(status === "Active" ? "publish" : "draft");
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      setStepRaw(firstErrorStep(errs));
      setSubmitError("Please fix the highlighted fields before saving.");
      return false;
    }

    setIsSubmittingProduct(true);
    isSubmittingRef.current = true;
    try {
      const res = await fetch(productId ? `/api/v1/admin/products/${productId}` : "/api/v1/admin/products", {
        method: productId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        // the version this form loaded, so a newer save by someone else is not overwritten
        body: JSON.stringify({ ...buildProductPayload(status), ...(productId && loadedVersion.current ? { expectedUpdatedAt: loadedVersion.current } : {}) }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.data?.id) {
        const message = body?.message || `The product could not be saved (HTTP ${res.status}).`;
        if (res.status === 409 && body?.code !== "STALE_PRODUCT") {
          setErrors({ slug: message });
          setStepRaw(1);
        }
        setSubmitError(message);
        return false;
      }
      setProductId(body.data.id);
      loadedVersion.current = body.data.updatedAt || null;
      setProductStatus(status === "Active" ? "published" : "draft");
      savedSnapshot.current = snapshotNow();
      return true;
    } catch {
      setSubmitError("Network error: the product was not saved. Check your connection and try again.");
      return false;
    } finally {
      setIsSubmittingProduct(false);
      isSubmittingRef.current = false;
    }
  };

  const handleSaveDraft = async () => {
    const saved = await persistProduct("Draft");
    if (saved) {
      setShowDraftNotice(true);
      setTimeout(() => setShowDraftNotice(false), 2500);
    }
  };

  const handlePublishProduct = async () => {
    const saved = await persistProduct("Active");
    setShowPublishModal(false);
    if (saved) router.push("/admin/products");
  };

  // The confirmation modal only opens once the product passes publish validation.
  const openPublishModal = () => {
    const errs = validate("publish");
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      setStepRaw(firstErrorStep(errs));
      setSubmitError("Please fix the highlighted fields before publishing.");
      return;
    }
    setSubmitError("");
    setShowPublishModal(true);
  };

  // ---- Unsaved-changes guard (PROD-001): compare the form with what was last loaded or saved ----
  const snapshotNow = () => {
    try {
      return JSON.stringify(buildProductPayload("Draft"));
    } catch {
      return null;
    }
  };
  useEffect(() => {
    if (!isLoadingProduct && savedSnapshot.current === null) savedSnapshot.current = snapshotNow();
  });
  useEffect(() => {
    const isDirty = () => savedSnapshot.current !== null && !isSubmittingRef.current && snapshotNow() !== savedSnapshot.current;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isDirty()) return;
      e.preventDefault();
      e.returnValue = "";
    };
    // In-app links (sidebar, breadcrumbs) navigate without unloading the page, so they are checked here.
    const onClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link || link.target === "_blank" || e.defaultPrevented) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      if (isDirty() && !window.confirm("You have unsaved changes to this product. Leave without saving?")) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      {/* 1. BREADCRUMBS & PAGE HEADER */}
      <div>
        <div className="flex items-center gap-1.5 text-xs text-ink-muted">
          <Link href="/admin/products" className="hover:text-primary-hover transition-colors">
            Products
          </Link>
          <ChevronRight className="w-3 h-3 text-ink-muted" />
          <span className="text-ink font-medium">{isEditing ? "Edit Product" : "Add New Product"}</span>
        </div>

        <div className="mt-1">
          <h1 className="text-2xl sm:text-3xl font-serif text-ink tracking-tight">
            {isEditing ? "Edit Product" : "Add New Product"}
          </h1>
          <p className="text-xs text-ink-muted mt-0.5">
            Create a new product and manage its details, variants, images and more.
          </p>
        </div>
      </div>

      {showDraftNotice && (
        <div className="p-3 bg-success-bg border border-success-line text-success rounded-md text-xs flex items-center justify-between animate-in fade-in">
          <span>Draft saved successfully. Product details preserved.</span>
          <button onClick={() => setShowDraftNotice(false)} className="text-success font-bold">✕</button>
        </div>
      )}

      {isLoadingProduct && (
        <div role="status" className="p-3 bg-canvas border border-line text-ink-secondary rounded-md text-xs">
          Loading product details…
        </div>
      )}

      {(loadError || catalogueError || submitError) && (
        <div role="alert" className="p-3 bg-error-bg border border-error-line text-error rounded-md text-xs flex items-start justify-between gap-3">
          <span>{loadError || submitError || catalogueError}</span>
          <button
            type="button"
            aria-label="Dismiss error"
            onClick={() => {
              setSubmitError("");
              setCatalogueError("");
              setLoadError("");
            }}
            className="text-error font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. 5-STEP HORIZONTAL STEPPER INDICATOR */}
      <div className="bg-surface p-5 rounded-xl border border-line shadow-2xs overflow-x-auto no-scrollbar">
        <div className="relative flex items-center justify-between min-w-[640px] max-w-4xl mx-auto px-4">
          {steps.map((step, idx) => {
            const isActive = currentStep === step.number;
            const isCompleted = currentStep > step.number;

            return (
              <div key={step.number} className="flex-1 flex flex-col items-center relative z-10">
                {/* Connecting Track to Next Step */}
                {idx < steps.length - 1 && (
                  <div
                    className={`absolute top-4 left-1/2 w-full h-[2px] -z-10 ${
                      currentStep > step.number ? "bg-primary" : "bg-line"
                    }`}
                  />
                )}

                {/* Step Circle Button */}
                <button
                  type="button"
                  aria-label={`Step ${step.number}: ${step.title}`}
                  aria-current={isActive ? "step" : undefined}
                  onClick={() => setCurrentStep(step.number)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs transition-all ${
                    isActive
                      ? "bg-primary text-on-primary shadow-sm ring-4 ring-warning-line"
                      : isCompleted
                      ? "bg-primary text-on-primary"
                      : "bg-canvas border border-line text-ink-muted hover:bg-surface-muted"
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : step.number}
                </button>

                {/* Step Label */}
                <span
                  className={`text-xs mt-2 font-medium text-center whitespace-nowrap ${
                    isActive ? "text-primary font-semibold" : "text-ink-muted"
                  }`}
                >
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. STEP CONTENT PANELS */}

      {/* STEP 1: BASIC INFORMATION */}
      {currentStep === 1 && (
        <div className="bg-surface p-6 sm:p-8 rounded-xl border border-line shadow-2xs space-y-6">
          <div className="border-b border-line pb-4">
            <h2 className="font-serif text-xl text-ink">Basic Information</h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Enter the main details about your product. Fields marked with{" "}
              <span className="text-primary font-bold">*</span> are required.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Form Fields Column */}
            <div className="lg:col-span-8 space-y-5 text-xs">
              {/* Product Name & Slug */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="product-name" className="font-semibold text-ink block mb-1">
                    Product Name <span className="text-primary">*</span>
                  </label>
                  <input
                    id="product-name"
                    type="text"
                    value={productName}
                    maxLength={200}
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? "product-name-error" : undefined}
                    onChange={(e) => handleProductNameChange(e.target.value)}
                    className="w-full px-3 py-2 bg-canvas border border-line rounded-md text-xs focus:outline-none focus:border-primary"
                  />
                  <FieldError id="product-name-error" message={errors.name} />
                </div>
                <div>
                  <label htmlFor="product-slug" className="font-semibold text-ink block mb-1">
                    Slug <span className="text-primary">*</span>
                  </label>
                  <input
                    id="product-slug"
                    type="text"
                    value={slug}
                    maxLength={120}
                    aria-invalid={Boolean(errors.slug)}
                    aria-describedby={errors.slug ? "product-slug-error" : undefined}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setSlug(e.target.value);
                    }}
                    className="w-full px-3 py-2 bg-canvas border border-line rounded-md text-xs focus:outline-none focus:border-primary"
                  />
                  <FieldError id="product-slug-error" message={errors.slug} />
                  <p className="text-[10px] text-ink-muted mt-1 font-mono truncate">
                    https://{BRAND.domain}/products/{slug}
                  </p>
                </div>
              </div>

              {/* Short Description */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="short-description" className="font-semibold text-ink">
                    Short Description
                  </label>
                  <span className="text-[10px] text-ink-muted">
                    {shortDescription.length}/500
                  </span>
                </div>
                <textarea
                  id="short-description"
                  rows={3}
                  maxLength={500}
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-canvas border border-line rounded-md text-xs focus:outline-none focus:border-primary leading-relaxed"
                />
              </div>

              {/* Detailed Description with WYSIWYG Header */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="detailed-description" className="font-semibold text-ink">
                    Detailed Description <span className="text-primary">*</span>
                  </label>
                  <span className="text-[10px] text-ink-muted">
                    {detailedDescription.length}/2000
                  </span>
                </div>

                <div className="border border-line rounded-md overflow-hidden bg-surface">
                  {/* Mock Toolbar */}
                  <div className="p-2 bg-canvas border-b border-line flex items-center gap-1.5 flex-wrap text-ink-secondary">
                    <select className="px-2 py-0.5 bg-surface border border-line rounded-xs text-[11px]">
                      <option>Paragraph</option>
                      <option>Heading 1</option>
                      <option>Heading 2</option>
                    </select>
                    <div className="w-[1px] h-4 bg-line mx-1" />
                    <button type="button" className="p-1 hover:bg-ink/5 rounded-xs" title="Bold">
                      <Bold className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" className="p-1 hover:bg-ink/5 rounded-xs" title="Italic">
                      <Italic className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" className="p-1 hover:bg-ink/5 rounded-xs" title="Strikethrough">
                      <Strikethrough className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-[1px] h-4 bg-line mx-1" />
                    <button type="button" className="p-1 hover:bg-ink/5 rounded-xs" title="Bullet List">
                      <List className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" className="p-1 hover:bg-ink/5 rounded-xs" title="Numbered List">
                      <ListOrdered className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-[1px] h-4 bg-line mx-1" />
                    <button type="button" className="p-1 hover:bg-ink/5 rounded-xs" title="Insert Link">
                      <Link2 className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" className="p-1 hover:bg-ink/5 rounded-xs" title="Insert Media">
                      <ImageIcon className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" className="p-1 hover:bg-ink/5 rounded-xs" title="Code View">
                      <Code className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <textarea
                    id="detailed-description"
                    rows={5}
                    maxLength={2000}
                    value={detailedDescription}
                    aria-invalid={Boolean(errors.description)}
                    aria-describedby={errors.description ? "detailed-description-error" : undefined}
                    onChange={(e) => setDetailedDescription(e.target.value)}
                    className="w-full p-3 text-xs leading-relaxed focus:outline-none bg-surface text-ink"
                  />
                </div>
                <FieldError id="detailed-description-error" message={errors.description} />
              </div>

              {/* Brand & Product Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="product-brand" className="font-semibold text-ink block mb-1">Brand</label>
                  <select
                    id="product-brand"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full px-3 py-2 bg-canvas border border-line rounded-md text-xs focus:outline-none focus:border-primary"
                  >
                    <option value={`${BRAND.name}`}>{BRAND.name}</option>
                    <option value="Saffron Atelier">Saffron Atelier</option>
                    <option value="Heritage Edit">Heritage Edit</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="product-type" className="font-semibold text-ink block mb-1">Product Type</label>
                  <select
                    id="product-type"
                    value={productType}
                    onChange={(e) => setProductType(e.target.value)}
                    className="w-full px-3 py-2 bg-canvas border border-line rounded-md text-xs focus:outline-none focus:border-primary"
                  >
                    <option value="Jacket">Jacket</option>
                    <option value="Kimono">Kimono</option>
                    <option value="Co-ord Set">Co-ord Set</option>
                    <option value="Kurta">Kurta</option>
                  </select>
                </div>
              </div>

              {/* Material & Embroidery Technique */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="product-material" className="font-semibold text-ink block mb-1">Material</label>
                  <select
                    id="product-material"
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    className="w-full px-3 py-2 bg-canvas border border-line rounded-md text-xs focus:outline-none focus:border-primary"
                  >
                    <option value="Velvet">Velvet</option>
                    <option value="Pure Silk">Pure Silk</option>
                    <option value="Chanderi">Chanderi</option>
                    <option value="Raw Silk">Raw Silk</option>
                    <option value="Cotton Silk">Cotton Silk</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="product-embroidery" className="font-semibold text-ink block mb-1">
                    Embroidery Technique
                  </label>
                  <select
                    id="product-embroidery"
                    value={embroideryTechnique}
                    onChange={(e) => setEmbroideryTechnique(e.target.value)}
                    className="w-full px-3 py-2 bg-canvas border border-line rounded-md text-xs focus:outline-none focus:border-primary"
                  >
                    <option value="Hand Embroidery">Hand Embroidery</option>
                    <option value="Zardozi">Zardozi</option>
                    <option value="Aari Work">Aari Work</option>
                    <option value="Marodi Work">Marodi Work</option>
                    <option value="Pita Work">Pita Work</option>
                  </select>
                </div>
              </div>

              {/* Care Instructions & Production Lead Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="care-instructions" className="font-semibold text-ink">Care Instructions</label>
                    <span className="text-[10px] text-ink-muted">
                      {careInstructions.length}/500
                    </span>
                  </div>
                  <input
                    id="care-instructions"
                    type="text"
                    maxLength={500}
                    value={careInstructions}
                    onChange={(e) => setCareInstructions(e.target.value)}
                    className="w-full px-3 py-2 bg-canvas border border-line rounded-md text-xs focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <label htmlFor="lead-time" className="font-semibold text-ink">
                      Production Lead Time (for customer)
                    </label>
                    <span title="Since each piece is made to order, specify the artisan crafting duration.">
                      <HelpCircle className="w-3.5 h-3.5 text-ink-muted" />
                    </span>
                  </div>
                  <select
                    id="lead-time"
                    value={productionLeadTime}
                    onChange={(e) => setProductionLeadTime(e.target.value)}
                    className="w-full px-3 py-2 bg-canvas border border-line rounded-md text-xs focus:outline-none focus:border-primary"
                  >
                    <option value="5 - 7 business days">5 - 7 business days</option>
                    <option value="7 - 10 days">7 - 10 days</option>
                    <option value="10 - 14 business days">10 - 14 business days</option>
                    <option value="Available to Order">Available to Order</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Cover Image Preview Column */}
            <div className="lg:col-span-4 bg-canvas p-5 rounded-xl border border-line space-y-4">
              <span className="text-xs font-semibold text-ink block">Cover Image Preview</span>
              <div className="relative w-full h-72 rounded-lg overflow-hidden border border-line bg-surface flex items-center justify-center">
                {uploadedImages[0] ? (
                  <Image
                    src={uploadedImages[0].src}
                    alt={productName.trim() || "Product cover"}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <p className="text-[11px] text-ink-muted px-6 text-center">
                    No image yet. Upload photos in the Images step; the first one becomes the cover.
                  </p>
                )}
              </div>

              {uploadedImages.length > 1 && (
                <div className="grid grid-cols-3 gap-2">
                  {uploadedImages.slice(0, 3).map((img, idx) => (
                    <div
                      key={img.id}
                      className={`relative h-20 rounded-md overflow-hidden ${
                        idx === 0 ? "border-2 border-primary" : "border border-line"
                      }`}
                    >
                      <Image src={img.src} alt={`Thumbnail ${idx + 1}`} fill unoptimized className="object-cover" />
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => setStepRaw(4)}
                className="w-full py-2 bg-surface border border-line rounded-md text-xs font-semibold text-ink hover:bg-ink/5 transition-colors shadow-2xs"
              >
                {uploadedImages.length > 0 ? "Change Cover Image" : "Add Images"}
              </button>
            </div>
          </div>

          {/* Step 1 Actions */}
          <div className="pt-6 border-t border-line flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="px-4 py-2 bg-surface border border-line rounded-md text-xs font-semibold text-ink hover:bg-ink/5 shadow-2xs"
            >
              Save as Draft
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-primary text-on-primary rounded-md text-xs font-semibold hover:bg-primary-hover shadow-sm"
            >
              <span>Next</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: CATEGORIES & COLLECTIONS */}
      {currentStep === 2 && (
        <div className="bg-surface p-6 sm:p-8 rounded-xl border border-line shadow-2xs space-y-8">
          {/* Section 1: Categories Assignment (Modern Atelier Multi-Select) */}
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-line">
              <div>
                <h2 className="font-serif text-xl text-ink">Categories Assignment</h2>
                <p className="text-xs text-ink-muted mt-0.5">
                  Choose the category this product is listed under for storefront browsing and filters.
                </p>
              </div>
            </div>

            {/* Primary Category Selector */}
            <div className="bg-canvas p-4 sm:p-5 rounded-xl border border-line space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-xs text-ink block">
                  Primary Category <span className="text-primary">*</span>
                </label>
                <span className="text-[11px] text-ink-muted">Primary breadcrumb & catalog anchor</span>
              </div>
              {allCategoriesList.length === 0 && (
                <p className="text-[11px] text-ink-muted italic">
                  No categories exist yet. Create one in the field below.
                </p>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5" role="group" aria-label="Primary category">
                {allCategoriesList.map((cat) => {
                  const isPrimary = primaryCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      aria-pressed={isPrimary}
                      onClick={() => handleSelectPrimaryCategory(cat)}
                      className={`px-3 py-2.5 rounded-lg text-xs font-semibold border text-center transition-all cursor-pointer ${
                        isPrimary
                          ? "bg-inverse text-on-primary border-ink shadow-xs ring-2 ring-focus/40"
                          : "bg-surface text-ink border-line hover:border-primary-hover hover:bg-surface"
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
              <FieldError id="category-error" message={errors.category} />
            </div>

            {/* Create a new category (saved immediately) */}
            <div className="bg-surface p-4 rounded-xl border border-line space-y-2 shadow-2xs">
              <label htmlFor="new-category" className="text-xs font-semibold text-ink block">
                Need another category?
              </label>
              <div className="flex gap-1.5">
                <input
                  id="new-category"
                  type="text"
                  value={newCategoryInput}
                  maxLength={80}
                  onChange={(e) => setNewCategoryInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void handleAddCustomCategory();
                    }
                  }}
                  placeholder="New category name"
                  className="flex-1 px-3 py-2 bg-canvas border border-line rounded-lg text-xs text-ink focus:outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => void handleAddCustomCategory()}
                  className="px-3 py-2 bg-inverse text-on-primary hover:bg-inverse-hover rounded-lg text-xs font-medium flex items-center gap-1 transition-colors shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add category</span>
                </button>
              </div>
              <p className="text-[11px] text-ink-muted">
                The category is created right away and then appears in the list above.
              </p>
            </div>
          </div>

          {/* Section 2: Collections (Modern Atelier Multi-Select) */}
          <div className="space-y-5 pt-6 border-t border-line">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-line">
              <div>
                <h2 className="font-serif text-xl text-ink">Curated Collections</h2>
                <p className="text-xs text-ink-muted mt-0.5">
                  Feature this luxury piece in seasonal campaigns, editorial edits, and thematic storefront showcases.
                </p>
              </div>
              <span className="self-start sm:self-auto px-3 py-1 rounded-full text-xs font-semibold bg-canvas text-ink border border-line">
                {selectedCollections.length} Collections Active
              </span>
            </div>

            {/* Modern Multi-Select Box for Collections */}
            <div className="bg-surface p-5 rounded-xl border border-line space-y-4 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-semibold text-ink">
                    Curated Edit Selection
                  </h3>
                  <p className="text-[11px] text-ink-muted">
                    Click chips to toggle or search and create custom campaign edits.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllCollections}
                    className="px-2.5 py-1 text-[11px] font-medium text-ink hover:text-primary-hover bg-canvas hover:bg-surface-muted rounded-md border border-line transition-colors"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={handleClearCollections}
                    className="px-2.5 py-1 text-[11px] font-medium text-ink-muted hover:text-error bg-canvas rounded-md border border-line transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Active Selected Collections Strip */}
              <div className="p-3 bg-canvas rounded-lg border border-line min-h-[46px] flex flex-wrap gap-2 items-center">
                {selectedCollections.length === 0 ? (
                  <span className="text-[11px] text-ink-muted italic">
                    No collections selected yet. Click any chip below to feature this piece.
                  </span>
                ) : (
                  selectedCollections.map((col) => (
                    <span
                      key={col}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-surface text-ink border border-line hover:border-primary-hover shadow-2xs transition-all"
                    >
                      <Tag className="w-3 h-3 text-primary" />
                      <span>{col}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCollectionPill(col)}
                        className="text-ink-muted hover:text-error transition-colors ml-0.5"
                        aria-label={`Remove ${col}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* Search & Add Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-7 relative">
                  <Search className="w-3.5 h-3.5 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={collectionSearch}
                    onChange={(e) => setCollectionSearch(e.target.value)}
                    placeholder="Search available collections..."
                    className="w-full pl-8 pr-3 py-2 bg-canvas border border-line rounded-lg text-xs text-ink focus:outline-none focus:border-primary"
                  />
                  {collectionSearch && (
                    <button
                      type="button"
                      onClick={() => setCollectionSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-ink-muted hover:text-ink"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="sm:col-span-5 flex gap-1.5">
                  <input
                    type="text"
                    value={newCollectionInput}
                    onChange={(e) => setNewCollectionInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCustomCollection();
                      }
                    }}
                    placeholder="Custom collection..."
                    className="flex-1 px-3 py-2 bg-canvas border border-line rounded-lg text-xs text-ink focus:outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddCustomCollection()}
                    className="px-3 py-2 bg-inverse text-on-primary hover:bg-inverse-hover rounded-lg text-xs font-medium flex items-center gap-1 transition-colors shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              {/* Interactive Luxury Chips Palette */}
              <div className="pt-2">
                <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block mb-2">
                  Available Collections & Edits ({filteredCollections.length})
                </span>
                <div className="flex flex-wrap gap-2">
                  {filteredCollections.map((col) => {
                    const isSelected = selectedCollections.includes(col);
                    return (
                      <button
                        key={col}
                        type="button"
                        onClick={() => toggleCollection(col)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-primary text-on-primary border-primary shadow-xs"
                            : "bg-surface text-ink border-line hover:border-primary-hover hover:bg-canvas"
                        }`}
                      >
                        {isSelected ? (
                          <Check className="w-3.5 h-3.5 text-on-primary" />
                        ) : (
                          <Plus className="w-3 h-3 text-ink-muted" />
                        )}
                        <span>{col}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Display Settings */}
          <div className="space-y-4 pt-6 border-t border-line text-xs">
            <div>
              <h2 className="font-serif text-xl text-ink">Display Settings</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="flex items-center justify-between p-4 bg-canvas rounded-md border border-line">
                <div>
                  <span className="font-semibold text-ink block">Featured Product</span>
                  <p className="text-[11px] text-ink-muted mt-0.5">
                    Show this product on the homepage or featured sections.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isFeatured}
                  aria-label="Featured Product"
                  onClick={() => setIsFeatured(!isFeatured)}
                  className={`w-11 h-6 rounded-full transition-colors p-0.5 ${
                    isFeatured ? "bg-primary" : "bg-line"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-surface transition-transform ${
                      isFeatured ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div>
                <label htmlFor="display-order" className="font-semibold text-ink block mb-1">Display Order</label>
                <input
                  id="display-order"
                  type="number"
                  min="0"
                  max="10000"
                  step="1"
                  value={displayOrder}
                  aria-invalid={Boolean(errors.displayOrder)}
                  aria-describedby={errors.displayOrder ? "display-order-error" : undefined}
                  onChange={(e) => setDisplayOrder(e.target.value)}
                  className="w-full px-3 py-2 bg-canvas border border-line rounded-md text-xs focus:outline-none focus:border-primary"
                />
                <FieldError id="display-order-error" message={errors.displayOrder} />
                <p className="text-[10px] text-ink-muted mt-1">Lower number appears first in listings.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="flex items-center justify-between p-4 bg-canvas rounded-md border border-line">
                <div>
                  <span className="font-semibold text-ink block">Best Seller</span>
                  <p className="text-[11px] text-ink-muted mt-0.5">List this product in the Best Sellers section on the homepage.</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isBestseller}
                  aria-label="Best Seller"
                  onClick={() => setIsBestseller(!isBestseller)}
                  className={`w-11 h-6 rounded-full transition-colors p-0.5 ${isBestseller ? "bg-primary" : "bg-line"}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-surface transition-transform ${isBestseller ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>
              <div className="flex items-center justify-between p-4 bg-canvas rounded-md border border-line">
                <div>
                  <span className="font-semibold text-ink block">New Arrival</span>
                  <p className="text-[11px] text-ink-muted mt-0.5">Mark this product as a new arrival.</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isNewArrival}
                  aria-label="New Arrival"
                  onClick={() => setIsNewArrival(!isNewArrival)}
                  className={`w-11 h-6 rounded-full transition-colors p-0.5 ${isNewArrival ? "bg-primary" : "bg-line"}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-surface transition-transform ${isNewArrival ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Step 2 Actions */}
          <div className="pt-6 border-t border-line flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-surface border border-line rounded-md text-xs font-semibold text-ink hover:bg-ink/5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="px-4 py-2 bg-surface border border-line rounded-md text-xs font-semibold text-ink hover:bg-ink/5 shadow-2xs"
              >
                Save as Draft
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-primary text-on-primary rounded-md text-xs font-semibold hover:bg-primary-hover shadow-sm"
              >
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: VARIANTS & PRICING */}
      {currentStep === 3 && (
        <div className="bg-surface p-6 sm:p-8 rounded-xl border border-line shadow-2xs space-y-8">
          {/* Section 1: Variants Setup */}
          <div className="space-y-4">
            <div>
              <h2 className="font-serif text-xl text-ink">Variants</h2>
              <p className="text-xs text-ink-muted mt-0.5">
                Define the different sizes, colours and pricing for this product.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-xs">
              {/* Colour Variants */}
              <div className="lg:col-span-8 space-y-3">
                <label className="font-semibold text-ink block">
                  Colour Variants <span className="text-primary">*</span>
                </label>
                <div className="space-y-2.5">
                  {colourVariants.map((c) => (
                    <div key={c.id} className="flex items-center gap-3">
                      <div
                        className="w-6 h-6 rounded-full border border-ink/10 shrink-0"
                        style={{ backgroundColor: c.hex }}
                      />
                      <input
                        type="text"
                        value={c.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setColourVariants(
                            colourVariants.map((item) =>
                              item.id === c.id ? { ...item, name: val } : item
                            )
                          );
                        }}
                        className="w-1/2 px-3 py-2 bg-canvas border border-line rounded-md"
                        aria-label="Colour name"
                        maxLength={60}
                        placeholder="Colour name"
                      />
                      <input
                        type="text"
                        value={c.hex}
                        onChange={(e) => {
                          const val = e.target.value;
                          setColourVariants(
                            colourVariants.map((item) =>
                              item.id === c.id ? { ...item, hex: val } : item
                            )
                          );
                        }}
                        className="w-32 px-3 py-2 bg-canvas border border-line rounded-md font-mono"
                        aria-label="Colour hex code"
                        maxLength={7}
                        placeholder="#6B1F1F"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveColour(c.id)}
                        aria-label={`Remove colour ${c.name || ""}`.trim()}
                        className="p-2 text-ink-muted hover:text-error rounded-md"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <FieldError id="colours-error" message={errors.colours} />
                <button
                  type="button"
                  onClick={handleAddColour}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-primary text-primary rounded-md text-xs font-semibold hover:bg-warning-bg/50 mt-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Colour</span>
                </button>
              </div>

              {/* Size Options (Modern Atelier Selection) */}
              <div className="lg:col-span-4 bg-canvas p-4 sm:p-5 rounded-xl border border-line space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-xs text-ink block">
                    Size Options <span className="text-primary">*</span>
                  </label>
                  <span className="text-[11px] font-semibold text-primary">
                    {Object.values(sizeOptions).filter(Boolean).length} Active
                  </span>
                </div>
                <p className="text-[11px] text-ink-muted">
                  Click chips to toggle available sizes for this garment.
                </p>
                <FieldError id="sizes-error" message={errors.sizes} />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                  {(["S", "M", "L", "XL", "Free Size"] as const).map((sz) => {
                    const isChecked = sizeOptions[sz];
                    return (
                      <button
                        key={sz}
                        type="button"
                        aria-pressed={isChecked}
                        onClick={() =>
                          setSizeOptions({ ...sizeOptions, [sz]: !sizeOptions[sz] })
                        }
                        className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          isChecked
                            ? "bg-primary text-on-primary border-primary shadow-xs"
                            : "bg-surface text-ink-secondary border-line hover:border-primary-hover hover:bg-surface"
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5" />}
                        <span>{sz}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Variant Price Settings */}
          <div className="space-y-4 pt-6 border-t border-line text-xs">
            <h2 className="font-serif text-xl text-ink">Variant Price Settings</h2>

            <div className="space-y-3">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="priceSetting"
                  checked={priceType === "same"}
                  onChange={() => setPriceType("same")}
                  className="accent-primary"
                />
                <div>
                  <span className="font-semibold text-ink">Same price for all variants</span>
                  <p className="text-[11px] text-ink-muted">
                    All colour and size variants will have the same price.
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="priceSetting"
                  checked={priceType === "different"}
                  onChange={() => setPriceType("different")}
                  className="accent-primary"
                />
                <div>
                  <span className="font-semibold text-ink">Different price for each variant</span>
                  <p className="text-[11px] text-ink-muted">
                    Set individual price for each variant.
                  </p>
                </div>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label htmlFor="base-price" className="font-semibold text-ink block mb-1">
                  Base Price (INR) <span className="text-primary">*</span>
                </label>
                <input
                  id="base-price"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={basePrice}
                  aria-invalid={Boolean(errors.price)}
                  aria-describedby={errors.price ? "base-price-error" : undefined}
                  onChange={(e) => setBasePrice(e.target.value)}
                  className="w-full px-3 py-2 bg-canvas border border-line rounded-md text-xs focus:outline-none focus:border-primary"
                />
                <FieldError id="base-price-error" message={errors.price} />
              </div>
              <div>
                <label htmlFor="compare-price" className="font-semibold text-ink block mb-1">
                  Compare at Price (Optional)
                </label>
                <input
                  id="compare-price"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={compareAtPrice}
                  aria-invalid={Boolean(errors.compare)}
                  aria-describedby={errors.compare ? "compare-price-error" : undefined}
                  onChange={(e) => setCompareAtPrice(e.target.value)}
                  className="w-full px-3 py-2 bg-canvas border border-line rounded-md text-xs focus:outline-none focus:border-primary"
                />
                <FieldError id="compare-price-error" message={errors.compare} />
              </div>
            </div>
          </div>

          {/* Section 3: Variant Preview Table */}
          <div className="space-y-4 pt-6 border-t border-line">
            <h2 className="font-serif text-xl text-ink">Variant Preview</h2>
            <FieldError id="prices-error" message={errors.prices} />

            <div className="border border-line rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-canvas text-ink-muted border-b border-line">
                  <tr>
                    <th className="p-3.5 font-semibold text-ink">SKU</th>
                    <th className="p-3.5 font-semibold text-ink">Colour</th>
                    <th className="p-3.5 font-semibold text-ink">Size</th>
                    <th className="p-3.5 font-semibold text-ink">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {colourVariants.filter((c) => c.name.trim()).flatMap((c) =>
                    selectedSizes.map((sz) => {
                      const key = priceKey(c.name, sz);
                      return (
                        <tr key={key} className="hover:bg-canvas/50 transition-colors">
                          <td className="p-3.5 font-mono text-ink-muted">Assigned on save</td>
                          <td className="p-3.5">
                            <div className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full border border-ink/10" style={{ backgroundColor: c.hex }} />
                              <span>{c.name.trim()}</span>
                            </div>
                          </td>
                          <td className="p-3.5 font-medium">{sz}</td>
                          <td className="p-3.5 font-semibold text-ink">
                            {priceType === "different" ? (
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                inputMode="decimal"
                                aria-label={`Price for ${c.name.trim()} ${sz}`}
                                placeholder={basePrice || "Base price"}
                                value={variantPrices[key] ?? ""}
                                onChange={(e) => setVariantPrices({ ...variantPrices, [key]: e.target.value })}
                                className="w-32 px-2 py-1 bg-canvas border border-line rounded-md"
                              />
                            ) : basePrice && Number(basePrice) > 0 ? (
                              `₹${Number(basePrice).toLocaleString("en-IN")}`
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              {(colourVariants.every((c) => !c.name.trim()) || selectedSizes.length === 0) && (
                <p className="p-4 text-[11px] text-ink-muted">
                  Name at least one colour and select at least one size to see the variants that will be created.
                </p>
              )}
            </div>
          </div>

          {/* Step 3 Actions */}
          <div className="pt-6 border-t border-line flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-surface border border-line rounded-md text-xs font-semibold text-ink hover:bg-ink/5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="px-4 py-2 bg-surface border border-line rounded-md text-xs font-semibold text-ink hover:bg-ink/5 shadow-2xs"
              >
                Save as Draft
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-primary text-on-primary rounded-md text-xs font-semibold hover:bg-primary-hover shadow-sm"
              >
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: IMAGES */}
      {currentStep === 4 && (
        <div className="bg-surface p-6 sm:p-8 rounded-xl border border-line shadow-2xs space-y-6">
          <div className="border-b border-line pb-4">
            <h2 className="font-serif text-xl text-ink">Product Images</h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Upload high-quality images for your product. Recommended size: 1200x1200 px or higher.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Upload Dropzone (4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  void handleImageFiles(e.dataTransfer.files);
                }}
                className="p-8 border-2 border-dashed border-line rounded-xl text-center bg-canvas flex flex-col items-center justify-center space-y-3 hover:border-primary-hover transition-colors cursor-pointer"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/webp"
                  aria-label="Upload product images"
                  className="hidden"
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    if (e.target.files) void handleImageFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
                <div className="w-12 h-12 rounded-full bg-warning-bg/60 text-primary flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-ink">
                    Click to upload <span className="text-ink-muted font-normal">or drag and drop</span>
                  </p>
                  <p className="text-[10px] text-ink-muted mt-0.5">
                    PNG, JPG or WebP (Max 10MB each, up to {MAX_IMAGES} images)
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isUploadingImages}
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="px-4 py-2 bg-primary text-on-primary rounded-md text-xs font-semibold hover:bg-primary-hover shadow-sm disabled:opacity-50"
                >
                  {isUploadingImages ? "Uploading…" : "Upload Images"}
                </button>
              </div>

              {imageError && (
                <p role="alert" className="text-[11px] text-error">
                  {imageError}
                </p>
              )}
              <FieldError id="images-error" message={errors.images} />

              <p className="text-[11px] text-ink-muted leading-relaxed">
                You can upload multiple images. First image will be used as the cover image.
              </p>
            </div>

            {/* Uploaded Images Grid (5 cols) */}
            <div className="lg:col-span-5 space-y-3">
              <span className="font-semibold text-xs text-ink block">
                Uploaded Images ({uploadedImages.length})
              </span>

              {uploadedImages.length === 0 && (
                <p className="text-[11px] text-ink-muted italic">No images uploaded yet.</p>
              )}

              <div className="grid grid-cols-3 gap-3">
                {uploadedImages.map((img, idx) => (
                  <div
                    key={img.id}
                    className="relative h-44 rounded-lg overflow-hidden border border-line bg-canvas"
                  >
                    <Image
                      src={img.src}
                      alt={`Product Photo ${idx + 1}`}
                      fill
                      unoptimized
                      className="object-cover"
                    />

                    {idx === 0 && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 bg-primary text-on-primary text-[9px] font-bold rounded-xs tracking-wider uppercase shadow-xs">
                        Cover
                      </span>
                    )}

                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-1">
                      {idx > 0 ? (
                        <button
                          type="button"
                          onClick={() => handleMakeCover(img.id)}
                          aria-label={`Make image ${idx + 1} the cover`}
                          className="px-2 py-1 rounded bg-surface/90 text-[10px] font-semibold text-ink hover:bg-surface shadow-xs"
                        >
                          Make cover
                        </button>
                      ) : (
                        <span />
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(img.id)}
                        aria-label={`Remove image ${idx + 1}`}
                        className="p-1 rounded bg-surface/90 text-ink hover:text-error hover:bg-surface shadow-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Image Guidelines (3 cols) */}
            <div className="lg:col-span-3 bg-canvas p-5 rounded-xl border border-line space-y-3.5 text-xs">
              <h3 className="font-serif text-base text-ink">Image Guidelines</h3>

              <div className="space-y-2.5 text-ink-secondary">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <span>Use clear, high-quality images</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <span>Show different angles (front, back, sides)</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <span>Include close-up of embroidery details</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <span>Use a consistent background</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <span>Recommended size: 1200x1200 px</span>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4 Actions */}
          <div className="pt-6 border-t border-line flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-surface border border-line rounded-md text-xs font-semibold text-ink hover:bg-ink/5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="px-4 py-2 bg-surface border border-line rounded-md text-xs font-semibold text-ink hover:bg-ink/5 shadow-2xs"
              >
                Save as Draft
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(5)}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-primary text-on-primary rounded-md text-xs font-semibold hover:bg-primary-hover shadow-sm"
              >
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: SEO & PUBLISH */}
      {currentStep === 5 && (
        <div className="bg-surface p-6 sm:p-8 rounded-xl border border-line shadow-2xs space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left SEO Column (7 cols) */}
            <div className="lg:col-span-7 space-y-6 text-xs">
              <div>
                <h2 className="font-serif text-xl text-ink">SEO Meta Information</h2>
                <p className="text-xs text-ink-muted mt-0.5">
                  Optimize your product for search engines. This information will help your product rank better.
                </p>
              </div>

              {/* Meta Title */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="meta-title" className="font-semibold text-ink">Meta Title</label>
                  <span className="text-[10px] text-ink-muted">{metaTitle.length}/60</span>
                </div>
                <input
                  id="meta-title"
                  type="text"
                  maxLength={60}
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-canvas border border-line rounded-md focus:outline-none focus:border-primary"
                />
              </div>

              {/* Meta Description */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="meta-description" className="font-semibold text-ink">Meta Description</label>
                  <span className="text-[10px] text-ink-muted">{metaDescription.length}/160</span>
                </div>
                <textarea
                  id="meta-description"
                  rows={4}
                  maxLength={160}
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-canvas border border-line rounded-md focus:outline-none focus:border-primary leading-relaxed"
                />
              </div>

              {/* Focus Keywords & Tags */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-ink block">
                    Product Tags & Focus Keywords (Optional)
                  </label>
                  <span className="text-[10px] text-ink-muted">
                    {focusKeywords.length} tags added
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 p-2 bg-canvas border border-line rounded-md min-h-[44px]">
                  {focusKeywords.map((kw) => (
                    <span
                      key={kw}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface border border-line rounded-full text-xs text-ink shadow-2xs"
                    >
                      <span>{kw}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveKeyword(kw)}
                        className="text-ink-muted hover:text-primary-hover"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={keywordInput}
                    onChange={handleKeywordChange}
                    onKeyDown={handleAddKeyword}
                    placeholder="Type tag and press Enter or comma..."
                    className="flex-1 bg-transparent border-none text-xs focus:outline-none min-w-[150px] px-2 py-0.5"
                  />
                </div>
                <p className="text-[10px] text-ink-muted mt-1">
                  Separate tags with commas or press Enter. You can add more than 15 tags.
                </p>
              </div>
            </div>

            {/* Right Publish & URL Column (5 cols) */}
            <div className="lg:col-span-5 space-y-6 text-xs">
              {/* URL Preview */}
              <div className="bg-canvas p-4 rounded-xl border border-line space-y-2">
                <span className="font-semibold text-ink block">URL Preview</span>
                <p className="text-info underline break-all font-mono text-[11px]">
                  https://{BRAND.domain}/products/{slug}
                </p>
              </div>

              {/* Product Status Radio */}
              <div className="bg-canvas p-5 rounded-xl border border-line space-y-3.5">
                <span className="font-semibold text-ink block">Product Status</span>
                <p className="text-[11px] text-ink-muted">
                  Shows the saved status. Use Save as Draft or Publish Product to change it.
                </p>

                <div className="space-y-3">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="prodStatus"
                      checked={productStatus === "draft"}
                      readOnly
                      disabled
                      className="accent-primary"
                    />
                    <div>
                      <span className="font-semibold text-ink">Draft</span>
                      <p className="text-[11px] text-ink-muted">Save as draft and publish later.</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="prodStatus"
                      checked={productStatus === "published"}
                      readOnly
                      disabled
                      className="accent-primary"
                    />
                    <div>
                      <span className="font-semibold text-ink">Published</span>
                      <p className="text-[11px] text-ink-muted">Visible on your website.</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="prodStatus"
                      checked={productStatus === "archived"}
                      readOnly
                      disabled
                      className="accent-primary"
                    />
                    <div>
                      <span className="font-semibold text-ink">Archived</span>
                      <p className="text-[11px] text-ink-muted">Hidden from your website.</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Step 5 Actions */}
          <div className="pt-6 border-t border-line flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-surface border border-line rounded-md text-xs font-semibold text-ink hover:bg-ink/5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="px-4 py-2 bg-surface border border-line rounded-md text-xs font-semibold text-ink hover:bg-ink/5 shadow-2xs"
              >
                Save as Draft
              </button>
              <button
                type="button"
                onClick={openPublishModal}
                className="inline-flex items-center gap-2 px-5 py-2 bg-primary text-on-primary rounded-md text-xs font-semibold hover:bg-primary-hover shadow-sm"
              >
                <span>Publish Product</span>
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION PUBLISH MODAL */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-ink/50 backdrop-blur-xs"
            onClick={() => setShowPublishModal(false)}
          />
          <div className="relative bg-surface rounded-xl border border-line shadow-2xl max-w-md w-full p-6 space-y-4 z-10 animate-in fade-in">
            <div className="w-12 h-12 rounded-full bg-success-bg text-success flex items-center justify-center mx-auto">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
            <div className="text-center">
              <h3 className="font-serif text-xl text-ink">Product Ready to Launch</h3>
              <p className="text-xs text-ink-muted mt-1">
                &quot;{productName}&quot; is ready to be published to {BRAND.name} storefront with{" "}
                {colourVariants.length} colour variants and lead time of {productionLeadTime}.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setShowPublishModal(false)}
                className="px-4 py-2 border border-line rounded-md text-xs font-semibold text-ink"
              >
                Review Details
              </button>
              <button
                type="button"
                onClick={handlePublishProduct}
                disabled={isSubmittingProduct}
                className="px-5 py-2 bg-primary text-on-primary rounded-md text-xs font-semibold hover:bg-primary-hover disabled:opacity-50"
              >
                {isSubmittingProduct ? "Publishing..." : "Confirm & Publish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminNewProductWizardPage() {
  return (
    <Suspense fallback={null}>
      <AdminNewProductWizard />
    </Suspense>
  );
}
