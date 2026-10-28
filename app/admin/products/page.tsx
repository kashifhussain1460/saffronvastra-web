"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Package,
  Plus,
  Search,
  Filter,
  RotateCcw,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Archive,
  Eye,
  Layers,
  Sparkles,
  Download,
  IndianRupee,
  Check,
  X,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

interface ProductVariantItem {
  id: string;
  sku: string;
  size: string;
  colourName: string;
  colourHex: string;
}

interface ProductImageItem {
  id?: string;
  url: string;
  altText?: string;
  isCover?: boolean;
}

interface ProductItem {
  id: string;
  title: string;
  slug: string;
  description?: string;
  material?: string;
  embroidery?: string;
  basePriceMinor: number;
  comparePriceMinor?: number | null;
  availabilityMode: string;
  leadTimeDays?: number;
  status: "Active" | "Draft" | "Archived";
  isFeatured?: boolean;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  variants?: ProductVariantItem[];
  images?: ProductImageItem[];
  createdAt?: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedCollection, setSelectedCollection] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [categoriesList, setCategoriesList] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [collectionsList, setCollectionsList] = useState<{ id: string; title: string; slug: string }[]>([]);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");

  const showNotification = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3000);
  };

  // Fetch Categories & Collections for filter dropdowns
  useEffect(() => {
    fetch("/api/v1/categories", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.data && Array.isArray(d.data)) {
          setCategoriesList(d.data);
        }
      })
      .catch((err) => console.warn("Failed to load categories filter list:", err));

    fetch("/api/v1/collections", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.data && Array.isArray(d.data)) {
          setCollectionsList(d.data);
        }
      })
      .catch((err) => console.warn("Failed to load collections filter list:", err));
  }, []);

  // Fetch Products with pagination and filters
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", currentPage.toString());
      params.set("limit", "10");
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      if (selectedCategory !== "all") params.set("category", selectedCategory);
      if (selectedCollection !== "all") params.set("collection", selectedCollection);
      if (selectedStatus === "deleted") {
        params.set("status", "all");
        params.set("deleted", "only");
      } else if (selectedStatus !== "all") params.set("status", selectedStatus);
      else params.set("status", "all");

      const res = await fetch(`/api/v1/products?${params.toString()}`, {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        if (data.items && Array.isArray(data.items)) {
          setProducts(data.items);
          setTotalCount(data.pagination?.total || data.items.length);
          setTotalPages(data.pagination?.totalPages || 1);
          setLoadError("");
        }
      } else {
        setProducts([]);
        setTotalCount(0);
        setTotalPages(1);
        setLoadError(`Could not load products (HTTP ${res.status}).`);
      }
    } catch (err) {
      console.warn("Product catalog fetch failed:", err);
      setProducts([]);
      setTotalCount(0);
      setTotalPages(1);
      setLoadError("Could not load products. Check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [currentPage, selectedCategory, selectedCollection, selectedStatus]);

  // Handle Search Debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchProducts();
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Deleting is a soft delete: the product disappears from the shop but nothing is removed from the database.
  const handleDeleteProduct = async (id: string, title: string) => {
    if (!window.confirm(`Delete "${title}"? It will disappear from the shop. You can restore it later from the Deleted view.`)) return;
    setTogglingId(id);
    setActionError("");
    try {
      const res = await fetch(`/api/v1/admin/products/${id}`, { method: "DELETE", credentials: "include" });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setActionError(body?.message || `The product could not be deleted (HTTP ${res.status}).`);
        return;
      }
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setTotalCount((n) => Math.max(0, n - 1));
      showNotification(`"${title}" was deleted`);
    } catch {
      setActionError("Network error: the product was not deleted.");
    } finally {
      setTogglingId(null);
    }
  };

  const handleRestoreProduct = async (id: string, title: string) => {
    setTogglingId(id);
    setActionError("");
    try {
      const res = await fetch(`/api/v1/admin/products/${id}/restore`, { method: "POST", credentials: "include" });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setActionError(body?.message || `The product could not be restored (HTTP ${res.status}).`);
        return;
      }
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setTotalCount((n) => Math.max(0, n - 1));
      showNotification(`"${title}" was restored as a Draft`);
    } catch {
      setActionError("Network error: the product was not restored.");
    } finally {
      setTogglingId(null);
    }
  };

  // Toggle Publish / Draft Status. The row only changes after the server confirms,
  // and it takes the status the server reports.
  const handleToggleStatus = async (id: string, currentStatus: string) => {
    setTogglingId(id);
    setActionError("");
    try {
      const res = await fetch(`/api/v1/admin/products/${id}/publish`, {
        method: "POST",
        credentials: "include",
      });
      const body = await res.json().catch(() => null);

      if (res.ok && body?.data?.status) {
        const nextStatus: string = body.data.status;
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: nextStatus as ProductItem["status"] } : p))
        );
        showNotification(`Product status updated to ${nextStatus}`);
      } else {
        setActionError(body?.message || `The status could not be changed (HTTP ${res.status}).`);
      }
    } catch (err) {
      console.warn("Toggle status API failed:", err);
      setActionError("Network error: the status was not changed. Check your connection and try again.");
    } finally {
      setTogglingId(null);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === products.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map((p) => p.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // KPI Calculations
  const activeCount = useMemo(
    () => products.filter((p) => p.status === "Active").length,
    [products]
  );
  const draftCount = useMemo(
    () => products.filter((p) => p.status === "Draft").length,
    [products]
  );
  const madeToOrderCount = useMemo(
    () => products.filter((p) => p.availabilityMode === "Made to Order").length,
    [products]
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans text-ink">
      {/* 1. TOP HEADER & ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif text-ink tracking-tight">
            Product Catalog Management
          </h1>
          <p className="text-xs text-ink-muted mt-0.5">
            Curate, publish, and orchestrate handcrafted atelier creations across categories and bespoke collections.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => showNotification("Product CSV catalog exported")}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-surface border border-line rounded-md text-xs font-semibold text-ink hover:bg-ink/5 transition-colors shadow-2xs"
            aria-label="Export Catalog CSV"
          >
            <Download className="w-3.5 h-3.5 text-ink-secondary" />
            <span>Export CSV</span>
          </button>

          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-md text-xs font-semibold hover:bg-primary-hover transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </Link>
        </div>
      </div>

      {(loadError || actionError) && (
        <div role="alert" className="p-3 bg-error-bg border border-error-line text-error rounded-md text-xs flex items-center justify-between gap-3">
          <span>{actionError || loadError}</span>
          <span className="flex items-center gap-3">
            {loadError && !actionError && (
              <button type="button" onClick={() => fetchProducts()} className="font-semibold underline">
                Retry
              </button>
            )}
            <button
              type="button"
              aria-label="Dismiss error"
              onClick={() => {
                setActionError("");
                setLoadError("");
              }}
              className="font-bold"
            >
              ✕
            </button>
          </span>
        </div>
      )}

      {actionNotice && (
        <div className="p-3 bg-success-bg border border-success-line text-success rounded-md text-xs flex items-center justify-between animate-in fade-in">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-success" />
            {actionNotice}
          </span>
          <button
            onClick={() => setActionNotice(null)}
            className="text-success font-bold p-1 hover:text-success"
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. STATS KPI OVERVIEW CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface p-4 rounded-xl border border-line shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-muted">Total Catalogue</span>
            <div className="w-8 h-8 rounded-full bg-warning-bg text-primary flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-serif font-semibold text-ink">{totalCount}</div>
            <span className="text-[10px] text-success font-semibold">Live in inventory database</span>
          </div>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-line shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-muted">Active & Published</span>
            <div className="w-8 h-8 rounded-full bg-success-bg text-success flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-serif font-semibold text-success">{activeCount}</div>
            <span className="text-[10px] text-ink-muted">Visible on luxury storefront</span>
          </div>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-line shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-muted">Drafts & Staging</span>
            <div className="w-8 h-8 rounded-full bg-warning-bg text-warning flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-serif font-semibold text-warning">{draftCount}</div>
            <span className="text-[10px] text-ink-muted">Pending artisan photography</span>
          </div>
        </div>

        <div className="bg-surface p-4 rounded-xl border border-line shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-muted">Made to Order</span>
            <div className="w-8 h-8 rounded-full bg-warning-bg text-warning flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-serif font-semibold text-ink">{madeToOrderCount}</div>
            <span className="text-[10px] text-ink-muted">Jaipur handcrafted queue</span>
          </div>
        </div>
      </div>

      {/* 3. FILTERS & SEARCH CONTROLS */}
      <div className="bg-surface p-4 rounded-xl border border-line shadow-2xs flex flex-col lg:flex-row items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative w-full lg:w-72">
          <Search className="w-3.5 h-3.5 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by title, fabric, or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-canvas border border-line rounded-md text-ink placeholder:text-ink-muted focus:outline-none focus:border-primary"
            aria-label="Search product catalog"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filter by Category"
            className="px-3 py-2 bg-surface border border-line rounded-md text-ink focus:outline-none focus:border-primary"
          >
            <option value="all">Category: All</option>
            {categoriesList.map((cat) => (
              <option key={cat.id} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Collection Filter */}
          <select
            value={selectedCollection}
            onChange={(e) => {
              setSelectedCollection(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filter by Collection"
            className="px-3 py-2 bg-surface border border-line rounded-md text-ink focus:outline-none focus:border-primary"
          >
            <option value="all">Collection: All</option>
            {collectionsList.map((col) => (
              <option key={col.id} value={col.slug}>
                {col.title}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filter by Status"
            className="px-3 py-2 bg-surface border border-line rounded-md text-ink focus:outline-none focus:border-primary"
          >
            <option value="all">Status: All</option>
            <option value="Active">Active</option>
            <option value="Draft">Draft</option>
            <option value="Archived">Archived</option>
            <option value="deleted">Deleted</option>
          </select>

          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
              setSelectedCollection("all");
              setSelectedStatus("all");
              setCurrentPage(1);
              showNotification("Catalog filters reset");
            }}
            className="px-3 py-2 text-primary hover:text-primary-hover font-semibold transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* 4. PRODUCTS DATA TABLE */}
      <div className="bg-surface rounded-xl border border-line shadow-2xs overflow-hidden">
        {selectedIds.length > 0 && (
          <div className="bg-surface-muted px-4 py-2.5 border-b border-line flex items-center justify-between text-xs">
            <span className="font-semibold text-primary">
              {selectedIds.length} product(s) selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  showNotification(`Bulk published ${selectedIds.length} items`);
                  setSelectedIds([]);
                }}
                className="px-2.5 py-1 bg-surface border border-line rounded text-ink hover:bg-ink/5"
              >
                Publish Selected
              </button>
              <button
                onClick={() => {
                  showNotification(`Bulk drafted ${selectedIds.length} items`);
                  setSelectedIds([]);
                }}
                className="px-2.5 py-1 bg-surface border border-line rounded text-ink hover:bg-ink/5"
              >
                Draft Selected
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-canvas border-b border-line text-ink-muted font-semibold uppercase tracking-wider text-[11px]">
                <th className="p-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={products.length > 0 && selectedIds.length === products.length}
                    onChange={toggleSelectAll}
                    className="accent-primary rounded-xs cursor-pointer w-3.5 h-3.5"
                    aria-label="Select all products"
                  />
                </th>
                <th className="p-3.5">Product Title & Fabric</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Price</th>
                <th className="p-3.5">Variants</th>
                <th className="p-3.5">Availability</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-line">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-ink-muted">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="font-serif">Retrieving luxury catalog items...</p>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-ink-muted">
                    <Package className="w-8 h-8 mx-auto text-primary mb-2" />
                    <p className="font-serif text-base text-ink">No products found</p>
                    <p className="text-xs mt-1">Try refining your search terms or filters.</p>
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const isSelected = selectedIds.includes(p.id);
                  const coverImage =
                    p.images?.find((img) => img.isCover)?.url ||
                    p.images?.[0]?.url ||
                    "/images/products/maroon_jacket.jpg";
                  const priceInr = Math.round(p.basePriceMinor / 100);

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-canvas/60 transition-colors ${
                        isSelected ? "bg-surface-muted/30" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(p.id)}
                          className="accent-primary rounded-xs cursor-pointer w-3.5 h-3.5"
                          aria-label={`Select product ${p.title}`}
                        />
                      </td>

                      {/* Product Thumbnail & Title */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-14 rounded-md overflow-hidden relative border border-line shrink-0 bg-canvas">
                            <Image
                              src={coverImage}
                              alt={p.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/products/${p.slug}`}
                              className="font-serif font-medium text-sm text-ink hover:text-primary-hover transition-colors line-clamp-1"
                            >
                              {p.title}
                            </Link>
                            <p className="text-[11px] text-ink-muted mt-0.5 line-clamp-1">
                              {p.material || "Handcrafted Jaipur Silk & Velvet"}
                            </p>
                            <span className="text-[10px] text-primary font-mono">
                              slug: {p.slug}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-3.5">
                        <span className="px-2.5 py-1 bg-canvas border border-line rounded-full text-[11px] font-medium text-ink-secondary">
                          {p.category?.name || "General"}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="font-semibold text-sm text-ink">
                          ₹{priceInr.toLocaleString("en-IN")}
                        </div>
                        {p.comparePriceMinor && p.comparePriceMinor > p.basePriceMinor && (
                          <div className="text-[10px] text-ink-muted line-through">
                            ₹{Math.round(p.comparePriceMinor / 100).toLocaleString("en-IN")}
                          </div>
                        )}
                      </td>

                      {/* Variants */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-warning-bg text-primary rounded-md text-[11px] font-medium">
                          <Layers className="w-3 h-3" />
                          {p.variants?.length || 1} variants
                        </span>
                      </td>

                      {/* Availability Mode */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                            p.availabilityMode === "Available to Order"
                              ? "bg-success-bg text-success border border-success-line"
                              : p.availabilityMode === "Made to Order"
                              ? "bg-warning-bg text-warning border border-warning-line"
                              : "bg-surface-muted text-ink-secondary border border-line"
                          }`}
                        >
                          {p.availabilityMode}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                            p.status === "Active"
                              ? "bg-success-bg/70 text-success"
                              : p.status === "Draft"
                              ? "bg-warning-bg/70 text-warning"
                              : "bg-line text-ink-secondary"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              p.status === "Active"
                                ? "bg-success"
                                : p.status === "Draft"
                                ? "bg-warning"
                                : "bg-line-strong"
                            }`}
                          />
                          {p.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          {selectedStatus === "deleted" ? (
                            <button
                              onClick={() => handleRestoreProduct(p.id, p.title)}
                              disabled={togglingId === p.id}
                              className="px-2.5 py-1 rounded-md text-[11px] font-semibold border border-success-line bg-success-bg text-success hover:bg-success-bg"
                              aria-label={`Restore ${p.title}`}
                            >
                              {togglingId === p.id ? "Restoring..." : "Restore"}
                            </button>
                          ) : (
                            <>
                              {/* Toggle Status Button */}
                              <button
                                onClick={() => handleToggleStatus(p.id, p.status)}
                                disabled={togglingId === p.id}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all border ${
                                  p.status === "Active"
                                    ? "border-warning-line bg-warning-bg text-warning hover:bg-warning-bg"
                                    : "border-success-line bg-success-bg text-success hover:bg-success-bg"
                                }`}
                                aria-label={`Toggle ${p.title} status`}
                                title={`Click to set status to ${p.status === "Active" ? "Draft" : "Active"}`}
                              >
                                {togglingId === p.id ? "Updating..." : p.status === "Active" ? "Set Draft" : "Publish"}
                              </button>

                              {/* Edit Action */}
                              <Link
                                href={`/admin/products/new?edit=${p.id}`}
                                className="p-1.5 rounded-md hover:bg-ink/5 text-ink-secondary transition-colors"
                                aria-label={`Edit ${p.title}`}
                                title="Edit Product"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Link>

                              {/* Delete (soft) */}
                              <button
                                onClick={() => handleDeleteProduct(p.id, p.title)}
                                disabled={togglingId === p.id}
                                className="p-1.5 rounded-md hover:bg-error-bg text-ink-secondary hover:text-error transition-colors"
                                aria-label={`Delete ${p.title}`}
                                title="Delete Product"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {/* View on Storefront */}
                          {selectedStatus !== "deleted" && (
                          <Link
                            href={`/products/${p.slug}`}
                            target="_blank"
                            className="p-1.5 rounded-md hover:bg-ink/5 text-ink-secondary transition-colors"
                            aria-label={`View ${p.title} on storefront`}
                            title="View PDP"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 5. TABLE PAGINATION */}
        <div className="p-4 bg-canvas border-t border-line flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-ink-muted">
          <p>
            Showing {products.length > 0 ? (currentPage - 1) * 10 + 1 : 0} to{" "}
            {Math.min(currentPage * 10, totalCount)} of {totalCount} products
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage <= 1}
              aria-label="Previous Page"
              className="p-1.5 rounded-md border border-line text-ink hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="font-semibold text-ink px-2">
              Page {currentPage} of {Math.max(1, totalPages)}
            </span>

            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage >= totalPages}
              aria-label="Next Page"
              className="p-1.5 rounded-md border border-line text-ink hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
