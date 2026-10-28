"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from "@/lib/uploadLimits";
import {
  Plus,
  Search,
  RotateCcw,
  LayoutGrid,
  List as ListIcon,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Upload,
  Link2,
  Lightbulb,
  CheckCircle2,
  Layers,
  Tag,
  Network,
  FolderTree,
} from "lucide-react";
import { api } from "@/lib/adminApi";

type CategoryStatus = "Active" | "Draft" | "Archived";

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  bannerImage: string | null;
  productsCount: number;
  childrenCount: number;
  parentId: string | null;
  status: CategoryStatus;
  sortOrder: number;
  shortDescription: string | null;
  detailedDescription: string | null;
}

const PAGE_SIZE = 10;

const slugify = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);

const statusClass = (status: CategoryStatus) =>
  status === "Active"
    ? "bg-success-bg text-success border-success-line"
    : status === "Draft"
    ? "bg-warning-bg text-warning border-warning-line"
    : "bg-surface-muted text-ink-muted border-line";

export default function AdminCategoriesPage() {
  const [viewMode, setViewMode] = useState<"list" | "form">("list");
  const [displayType, setDisplayType] = useState<"table" | "grid">("table");
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [parentFilter, setParentFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [notice, setNotice] = useState("");
  const [pageError, setPageError] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Form
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [formShortDesc, setFormShortDesc] = useState("");
  const [formDetailedDesc, setFormDetailedDesc] = useState("");
  const [formParentId, setFormParentId] = useState("");
  const [formSortOrder, setFormSortOrder] = useState("0");
  const [formStatus, setFormStatus] = useState<CategoryStatus>("Active");
  const [formImage, setFormImage] = useState("");
  const [formError, setFormError] = useState("");
  const [slugError, setSlugError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const load = useCallback(async () => {
    const res = await api("/api/v1/admin/categories?includeDrafts=true");
    if (!res.ok || !Array.isArray(res.body?.data)) {
      setLoadState("error");
      return;
    }
    setCategories(res.body.data);
    setLoadState("ready");
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const nameById = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);
  const parentOptions = useMemo(
    () => categories.filter((c) => !c.parentId),
    [categories]
  );

  // KPIs (all from the loaded categories)
  const totalCount = categories.length;
  const activeCount = categories.filter((c) => c.status === "Active").length;
  const parentCount = categories.filter((c) => !c.parentId).length;
  const subCount = categories.filter((c) => c.parentId).length;

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return categories.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (parentFilter === "none" && item.parentId) return false;
      if (parentFilter !== "all" && parentFilter !== "none" && item.parentId !== parentFilter) return false;
      if (q && !item.name.toLowerCase().includes(q) && !item.slug.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [categories, statusFilter, parentFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setParentFilter("all");
    setCurrentPage(1);
  };

  const openForm = (cat?: CategoryItem) => {
    setEditingId(cat?.id ?? null);
    setFormName(cat?.name ?? "");
    setFormSlug(cat?.slug ?? "");
    setSlugTouched(Boolean(cat));
    setFormShortDesc(cat?.shortDescription ?? "");
    setFormDetailedDesc(cat?.detailedDescription ?? "");
    setFormParentId(cat?.parentId ?? "");
    setFormSortOrder(String(cat?.sortOrder ?? 0));
    setFormStatus(cat?.status ?? "Active");
    setFormImage(cat?.image ?? "");
    setFormError("");
    setSlugError("");
    setViewMode("form");
  };

  const uploadImage = async (file: File) => {
    if (file.size > MAX_UPLOAD_BYTES) {
      setFormError(`The image is too large. The maximum size is ${MAX_UPLOAD_LABEL}.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setUploading(true);
    setFormError("");
    const form = new FormData();
    form.append("file", file);
    form.append("folder", "Category Images");
    const res = await api("/api/v1/admin/media/upload", { method: "POST", body: form });
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!res.ok || !res.body?.data?.url) {
      setFormError(res.message || "The image could not be uploaded.");
      return;
    }
    setFormImage(res.body.data.url);
  };

  const handleDeleteCategory = async (cat: CategoryItem) => {
    setBusyId(cat.id);
    setPageError("");
    setNotice("");
    const res = await api(`/api/v1/admin/categories/${cat.id}`, { method: "DELETE" });
    setBusyId(null);
    setConfirmDeleteId(null);
    if (!res.ok) {
      setPageError(res.message);
      return;
    }
    setNotice(`Category "${cat.name}" deleted.`);
    await load();
  };

  const setStatus = async (cat: CategoryItem, status: CategoryStatus) => {
    setBusyId(cat.id);
    setPageError("");
    setNotice("");
    const res = await api(`/api/v1/admin/categories/${cat.id}`, { method: "PATCH", json: { status } });
    setBusyId(null);
    if (!res.ok) {
      setPageError(res.message);
      return;
    }
    setNotice(`Category "${cat.name}" is now ${status}.`);
    await load();
  };

  // Moves a category one place among its siblings and saves the whole sibling order in one request.
  const siblingsOf = (cat: CategoryItem) =>
    categories
      .filter((c) => (c.parentId || null) === (cat.parentId || null))
      .sort((x, y) => x.sortOrder - y.sortOrder || x.name.localeCompare(y.name));

  const move = async (cat: CategoryItem, direction: -1 | 1) => {
    const siblings = siblingsOf(cat);
    const index = siblings.findIndex((c) => c.id === cat.id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= siblings.length) return;
    const ordered = [...siblings];
    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
    setBusyId(cat.id);
    setPageError("");
    setNotice("");
    const res = await api("/api/v1/admin/categories/reorder", { method: "POST", json: { parentId: cat.parentId || null, orderedIds: ordered.map((c) => c.id) } });
    setBusyId(null);
    if (!res.ok) {
      setPageError(res.message);
      await load();
      return;
    }
    setNotice(`"${cat.name}" moved ${direction < 0 ? "up" : "down"}.`);
    await load();
  };

  const handleSaveCategory = async () => {
    if (saving) return;
    setFormError("");
    setSlugError("");
    setSaving(true);
    const payload = {
      name: formName,
      slug: formSlug.trim() || slugify(formName),
      shortDescription: formShortDesc.trim() || null,
      detailedDescription: formDetailedDesc.trim() || null,
      image: formImage.trim() || null,
      parentId: formParentId || null,
      sortOrder: formSortOrder.trim() === "" ? 0 : Number(formSortOrder),
      status: formStatus,
    };
    const res = editingId
      ? await api(`/api/v1/admin/categories/${editingId}`, { method: "PATCH", json: payload })
      : await api("/api/v1/admin/categories", { method: "POST", json: payload });
    setSaving(false);
    if (!res.ok) {
      // A failed save adds nothing to the list; the server's reason is shown on the form.
      if (res.status === 409 || /slug/i.test(res.message)) setSlugError(res.message);
      else setFormError(res.message);
      return;
    }
    setNotice(`Category "${payload.name}" ${editingId ? "updated" : "created"}.`);
    setPageError("");
    setViewMode("list");
    await load();
  };

  const thumb = (cat: CategoryItem, className: string) =>
    cat.image ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={cat.image} alt={cat.name} className={className} />
    ) : (
      <div className={`${className} flex items-center justify-center text-[9px] text-ink-muted`}>No image</div>
    );

  const deleteControls = (cat: CategoryItem) =>
    confirmDeleteId === cat.id ? (
      <span role="alertdialog" aria-label={`Confirm delete ${cat.name}`} className="inline-flex items-center gap-1.5 text-[11px]">
        <span className="text-error">Delete &quot;{cat.name}&quot;?</span>
        <button type="button" disabled={busyId === cat.id} onClick={() => void handleDeleteCategory(cat)} className="px-2 py-0.5 bg-error text-on-primary rounded-md font-semibold disabled:opacity-60">
          Yes, delete
        </button>
        <button type="button" onClick={() => setConfirmDeleteId(null)} className="px-2 py-0.5 border border-line rounded-md">
          Cancel
        </button>
      </span>
    ) : (
      <>
        <button type="button" onClick={() => openForm(cat)} className="p-1 hover:text-primary-hover rounded-xs" title="Edit Category" aria-label={`Edit ${cat.name}`}>
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        {cat.status !== "Archived" && (
          <button type="button" disabled={busyId === cat.id} onClick={() => void setStatus(cat, "Archived")} className="px-1.5 py-0.5 text-[10px] border border-line rounded-md hover:bg-ink/5" aria-label={`Archive ${cat.name}`}>
            Archive
          </button>
        )}
        <button type="button" onClick={() => setConfirmDeleteId(cat.id)} className="p-1 hover:text-error rounded-xs" title="Delete Category" aria-label={`Delete ${cat.name}`}>
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </>
    );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans text-ink">
      {viewMode === "list" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif text-ink tracking-tight">Categories ({totalCount})</h1>
              <p className="text-xs text-ink-muted mt-0.5">Organise your products into categories for better navigation and display.</p>
            </div>
            <button
              type="button"
              onClick={() => openForm()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-md text-xs font-semibold hover:bg-primary-hover transition-colors shadow-sm self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Category</span>
            </button>
          </div>

          {notice && (
            <div role="status" className="p-3 bg-success-bg border border-success-line text-success rounded-md text-xs flex items-center justify-between">
              <span>{notice}</span>
              <button type="button" aria-label="Dismiss message" onClick={() => setNotice("")} className="text-success font-bold">
                &#10005;
              </button>
            </div>
          )}
          {pageError && (
            <div role="alert" className="p-3 bg-error-bg border border-error-line text-error rounded-md text-xs flex items-center justify-between">
              <span>{pageError}</span>
              <button type="button" aria-label="Dismiss error" onClick={() => setPageError("")} className="font-bold">
                &#10005;
              </button>
            </div>
          )}

          {loadState === "error" && (
            <div role="alert" className="p-3 bg-error-bg border border-error-line text-error rounded-md text-xs flex justify-between">
              <span>The categories could not be loaded.</span>
              <button
                type="button"
                className="underline font-semibold"
                onClick={() => {
                  setLoadState("loading");
                  void load();
                }}
              >
                Try again
              </button>
            </div>
          )}
          {loadState === "loading" && (
            <div role="status" className="py-12 text-center text-xs text-ink-muted">
              Loading categories...
            </div>
          )}

          {loadState === "ready" && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Total Categories", value: totalCount, icon: Layers, tone: "bg-error-bg text-error" },
                  { label: "Active Categories", value: activeCount, icon: Tag, tone: "bg-warning-bg text-warning" },
                  { label: "Parent Categories", value: parentCount, icon: Network, tone: "bg-warning-bg text-warning" },
                  { label: "Sub Categories", value: subCount, icon: FolderTree, tone: "bg-success-bg text-success" },
                ].map((k) => (
                  <div key={k.label} className="bg-surface p-4 rounded-xl border border-line shadow-2xs flex items-center gap-3.5">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${k.tone}`}>
                      <k.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-serif font-semibold text-ink">{k.value}</p>
                      <p className="text-[11px] text-ink-muted">{k.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-surface p-3.5 rounded-xl border border-line shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
                <div className="relative w-full md:w-80">
                  <Search className="w-3.5 h-3.5 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    aria-label="Search categories"
                    placeholder="Search categories..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-9 pr-3 py-1.5 bg-canvas border border-line rounded-md text-ink placeholder:text-ink-muted focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
                  <div className="flex items-center gap-2">
                    <select
                      value={statusFilter}
                      aria-label="Filter by status"
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="px-3 py-1.5 bg-surface border border-line rounded-md text-ink focus:outline-none focus:border-primary"
                    >
                      <option value="all">Status: All</option>
                      <option value="Active">Active</option>
                      <option value="Draft">Draft</option>
                      <option value="Archived">Archived</option>
                    </select>

                    <select
                      value={parentFilter}
                      aria-label="Filter by parent category"
                      onChange={(e) => {
                        setParentFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="px-3 py-1.5 bg-surface border border-line rounded-md text-ink focus:outline-none focus:border-primary"
                    >
                      <option value="all">Parent Category: All</option>
                      <option value="none">Main Categories (no parent)</option>
                      {parentOptions.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>

                    <button type="button" onClick={resetFilters} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-primary hover:text-primary-hover font-medium">
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset</span>
                    </button>
                  </div>

                  <div className="flex items-center border border-line rounded-md overflow-hidden bg-surface">
                    <button
                      type="button"
                      onClick={() => setDisplayType("grid")}
                      aria-label="Grid view"
                      aria-pressed={displayType === "grid"}
                      className={`p-1.5 ${displayType === "grid" ? "bg-primary text-on-primary" : "text-ink-muted hover:bg-ink/5"}`}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDisplayType("table")}
                      aria-label="List view"
                      aria-pressed={displayType === "table"}
                      className={`p-1.5 ${displayType === "table" ? "bg-primary text-on-primary" : "text-ink-muted hover:bg-ink/5"}`}
                    >
                      <ListIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {filtered.length === 0 ? (
                <div className="py-12 text-center text-xs text-ink-muted bg-surface rounded-xl border border-line" data-testid="categories-empty">
                  {categories.length === 0 ? "No categories yet. Add your first category." : "No categories match these filters."}
                </div>
              ) : displayType === "table" ? (
                <div className="bg-surface rounded-xl border border-line shadow-2xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-canvas text-ink-muted border-b border-line font-medium">
                        <tr>
                          <th className="p-3.5 font-semibold text-ink">Category</th>
                          <th className="p-3.5 font-semibold text-ink">Image</th>
                          <th className="p-3.5 font-semibold text-ink">Products</th>
                          <th className="p-3.5 font-semibold text-ink">Parent Category</th>
                          <th className="p-3.5 font-semibold text-ink">Status</th>
                          <th className="p-3.5 font-semibold text-ink">Sort Order</th>
                          <th className="p-3.5 font-semibold text-ink text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {pageItems.map((cat) => (
                          <tr key={cat.id} data-testid="category-row" className="hover:bg-canvas/50 transition-colors">
                            <td className="p-3.5">
                              <p className="font-semibold text-ink">{cat.name}</p>
                              <p className="text-[11px] text-ink-muted mt-0.5 font-mono">/{cat.slug}</p>
                            </td>
                            <td className="p-3.5">
                              <div className="w-10 h-12 rounded-md overflow-hidden relative border border-line bg-canvas">
                                {thumb(cat, "absolute inset-0 w-full h-full object-cover")}
                              </div>
                            </td>
                            <td className="p-3.5 font-medium text-ink">{cat.productsCount}</td>
                            <td className="p-3.5 text-ink-muted">{cat.parentId ? nameById.get(cat.parentId) || "Unknown" : "—"}</td>
                            <td className="p-3.5">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${statusClass(cat.status)}`}>{cat.status}</span>
                            </td>
                            <td className="p-3.5 font-medium text-ink">
                              <span className="inline-flex items-center gap-1">
                                <span className="w-8">{cat.sortOrder}</span>
                                <button type="button" disabled={busyId === cat.id || siblingsOf(cat)[0]?.id === cat.id} onClick={() => void move(cat, -1)} aria-label={`Move ${cat.name} up`} className="px-1.5 py-0.5 border border-line rounded disabled:opacity-30">&uarr;</button>
                                <button type="button" disabled={busyId === cat.id || siblingsOf(cat).at(-1)?.id === cat.id} onClick={() => void move(cat, 1)} aria-label={`Move ${cat.name} down`} className="px-1.5 py-0.5 border border-line rounded disabled:opacity-30">&darr;</button>
                              </span>
                            </td>
                            <td className="p-3.5 text-right">
                              <div className="inline-flex items-center gap-2 text-ink-muted">{deleteControls(cat)}</div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-4 bg-surface border-t border-line flex items-center justify-between gap-4 text-xs text-ink-muted">
                    <p>
                      Showing {(currentPage - 1) * PAGE_SIZE + 1} to {Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} categories
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={currentPage <= 1}
                        onClick={() => setCurrentPage((p) => p - 1)}
                        aria-label="Previous page"
                        className="w-7 h-7 rounded-sm border border-line flex items-center justify-center text-ink-secondary disabled:opacity-40"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <span>
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        type="button"
                        disabled={currentPage >= totalPages}
                        onClick={() => setCurrentPage((p) => p + 1)}
                        aria-label="Next page"
                        className="w-7 h-7 rounded-sm border border-line flex items-center justify-center text-ink-secondary disabled:opacity-40"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filtered.map((cat) => (
                    <div key={cat.id} data-testid="category-card" className="bg-surface rounded-xl border border-line overflow-hidden shadow-2xs flex flex-col">
                      <div className="relative aspect-4/3 bg-canvas">
                        {thumb(cat, "absolute inset-0 w-full h-full object-cover")}
                        <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusClass(cat.status)}`}>{cat.status}</span>
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-semibold text-sm text-ink">{cat.name}</h3>
                          <p className="text-[11px] text-ink-muted font-mono mt-0.5">/{cat.slug}</p>
                        </div>
                        <div className="pt-3 mt-3 border-t border-line flex flex-wrap items-center justify-between gap-2 text-xs text-ink-muted">
                          <span>{cat.productsCount} Products</span>
                          <div className="flex items-center gap-2">{deleteControls(cat)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {viewMode === "form" && (
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-ink-muted">
              <button type="button" onClick={() => setViewMode("list")} className="hover:text-primary-hover transition-colors">
                Categories
              </button>
              <ChevronRight className="w-3 h-3 text-ink-muted" />
              <span className="text-ink font-medium">{editingId ? "Edit Category" : "Add New Category"}</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
              <div>
                <h1 className="text-2xl sm:text-3xl font-serif text-ink tracking-tight">{editingId ? "Edit Category" : "Add New Category"}</h1>
                <p className="text-xs text-ink-muted mt-0.5">{editingId ? "Update the details of this category." : "Create a new category to organise your products."}</p>
              </div>

              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setViewMode("list")} className="px-4 py-2 bg-surface border border-line rounded-md text-xs font-semibold text-ink hover:bg-ink/5">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleSaveCategory()}
                  disabled={saving}
                  className="px-5 py-2 bg-primary text-on-primary rounded-md text-xs font-semibold hover:bg-primary-hover shadow-sm disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Category"}
                </button>
              </div>
            </div>
          </div>

          {formError && (
            <div role="alert" className="p-3 bg-error-bg border border-error-line text-error rounded-md text-xs">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-xs">
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-surface p-6 rounded-xl border border-line shadow-2xs space-y-5">
                <div className="border-b border-line pb-3">
                  <h2 className="font-serif text-lg text-ink">Basic Information</h2>
                  <p className="text-xs text-ink-muted mt-0.5">
                    Fields marked with <span className="text-primary font-bold">*</span> are required.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="cat-name" className="font-semibold text-ink block mb-1">
                      Category Name <span className="text-primary">*</span>
                    </label>
                    <input
                      id="cat-name"
                      type="text"
                      maxLength={80}
                      value={formName}
                      onChange={(e) => {
                        setFormName(e.target.value);
                        if (!slugTouched) setFormSlug(slugify(e.target.value));
                      }}
                      className="w-full px-3 py-2 bg-canvas border border-line rounded-md focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="cat-slug" className="font-semibold text-ink">
                        Slug <span className="text-primary">*</span>
                      </label>
                      <Link2 className="w-3.5 h-3.5 text-ink-muted" />
                    </div>
                    <input
                      id="cat-slug"
                      type="text"
                      value={formSlug}
                      aria-invalid={slugError ? true : undefined}
                      aria-describedby={slugError ? "cat-slug-error" : undefined}
                      onChange={(e) => {
                        setSlugTouched(true);
                        setSlugError("");
                        setFormSlug(e.target.value);
                      }}
                      className={`w-full px-3 py-2 bg-canvas border rounded-md focus:outline-none focus:border-primary ${slugError ? "border-error-line" : "border-line"}`}
                    />
                    {slugError ? (
                      <p id="cat-slug-error" role="alert" className="text-[11px] text-error mt-1">
                        {slugError}
                      </p>
                    ) : (
                      <p className="text-[10px] text-ink-muted mt-1 font-mono truncate">/collections?category={formSlug}</p>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="cat-short" className="font-semibold text-ink">
                      Short Description
                    </label>
                    <span className="text-[10px] text-ink-muted">{formShortDesc.length}/300</span>
                  </div>
                  <textarea
                    id="cat-short"
                    rows={3}
                    maxLength={300}
                    value={formShortDesc}
                    onChange={(e) => setFormShortDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-canvas border border-line rounded-md focus:outline-none focus:border-primary leading-relaxed"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="cat-detail" className="font-semibold text-ink">
                      Detailed Description
                    </label>
                    <span className="text-[10px] text-ink-muted">{formDetailedDesc.length}/2000</span>
                  </div>
                  <textarea
                    id="cat-detail"
                    rows={5}
                    maxLength={2000}
                    value={formDetailedDesc}
                    onChange={(e) => setFormDetailedDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-canvas border border-line rounded-md focus:outline-none focus:border-primary leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="cat-parent" className="font-semibold text-ink block mb-1">
                      Parent Category
                    </label>
                    <select
                      id="cat-parent"
                      value={formParentId}
                      onChange={(e) => setFormParentId(e.target.value)}
                      className="w-full px-3 py-2 bg-canvas border border-line rounded-md focus:outline-none focus:border-primary"
                    >
                      <option value="">None (Main Category)</option>
                      {categories
                        .filter((c) => c.id !== editingId)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                    </select>
                    <p className="text-[10px] text-ink-muted mt-1">Leave empty to create a main category</p>
                  </div>

                  <div>
                    <label htmlFor="cat-order" className="font-semibold text-ink block mb-1">
                      Sort Order
                    </label>
                    <input
                      id="cat-order"
                      type="number"
                      min={0}
                      value={formSortOrder}
                      onChange={(e) => setFormSortOrder(e.target.value)}
                      className="w-full px-3 py-2 bg-canvas border border-line rounded-md focus:outline-none focus:border-primary"
                    />
                    <p className="text-[10px] text-ink-muted mt-1">Lower number appears first</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-6">
              <div className="bg-surface p-5 rounded-xl border border-line shadow-2xs space-y-4">
                <div>
                  <h3 className="font-serif text-base text-ink">Category Image</h3>
                  <p className="text-[11px] text-ink-muted">Optional. Recommended size: 1200x600 px or higher.</p>
                </div>

                <div className="relative aspect-16/9 rounded-lg overflow-hidden border border-line bg-canvas flex items-center justify-center">
                  {formImage ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={formImage} alt="Category" className="absolute inset-0 w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setFormImage("")}
                        className="absolute top-2 right-2 w-6 h-6 rounded-md bg-ink/60 text-on-primary flex items-center justify-center hover:bg-ink/80"
                        aria-label="Remove image"
                        title="Remove image"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <span className="text-[11px] text-ink-muted">No image selected</span>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                  aria-label="Upload category image"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && void uploadImage(e.target.files[0])}
                />
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-3 border-2 border-dashed border-line rounded-lg text-center bg-canvas flex flex-col items-center justify-center gap-1 hover:border-primary-hover transition-colors disabled:opacity-60"
                >
                  <Upload className="w-5 h-5 text-primary" />
                  <span className="text-xs font-semibold text-ink">{uploading ? "Uploading..." : "Click to upload an image"}</span>
                  <span className="text-[10px] text-ink-muted">JPEG, PNG, WebP, GIF or AVIF (max {MAX_UPLOAD_LABEL})</span>
                </button>

                <div>
                  <label htmlFor="cat-image-url" className="font-semibold text-ink block mb-1">
                    Or image URL
                  </label>
                  <input
                    id="cat-image-url"
                    type="text"
                    placeholder="/uploads/... or https://..."
                    value={formImage}
                    onChange={(e) => setFormImage(e.target.value)}
                    className="w-full px-3 py-2 bg-canvas border border-line rounded-md focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="bg-surface p-5 rounded-xl border border-line shadow-2xs space-y-3">
                <h3 className="font-serif text-base text-ink">Category Status</h3>
                <div className="space-y-3">
                  {(
                    [
                      ["Active", "Visible on the website."],
                      ["Draft", "Hidden from the website while you prepare it."],
                      ["Archived", "Hidden from the website; kept for reference."],
                    ] as Array<[CategoryStatus, string]>
                  ).map(([value, help]) => (
                    <label key={value} className="flex items-center gap-2.5 cursor-pointer">
                      <input type="radio" name="catStatus" checked={formStatus === value} onChange={() => setFormStatus(value)} className="accent-primary" />
                      <div>
                        <span className="font-semibold text-ink">{value}</span>
                        <p className="text-[11px] text-ink-muted">{help}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-canvas p-5 rounded-xl border border-line space-y-3">
                <div className="flex items-center gap-2 text-warning">
                  <Lightbulb className="w-4 h-4 text-warning" />
                  <h3 className="font-semibold text-xs text-ink">Quick Tips</h3>
                </div>
                <div className="space-y-2 text-ink-secondary">
                  {[
                    "Use a clear and descriptive category name.",
                    "Keep the URL slug simple and SEO friendly.",
                    "A category with products or sub-categories cannot be deleted. Archive it instead.",
                  ].map((tip) => (
                    <div key={tip} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
