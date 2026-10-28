"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  BookOpen,
  Plus,
  Search,
  LayoutGrid,
  List as ListIcon,
  Edit2,
  Trash2,
  Archive,
  ArchiveRestore,
  ExternalLink,
  Layers,
  CheckCircle2,
  X,
} from "lucide-react";
import { api } from "@/lib/adminApi";

type CollectionStatus = "Active" | "Draft" | "Archived";

interface CollectionItem {
  id: string;
  title: string;
  slug: string;
  tagline?: string | null;
  description?: string | null;
  bannerImage?: string | null;
  sortOrder: number;
  status: CollectionStatus;
  productsCount: number;
}

interface FormState {
  title: string;
  slug: string;
  tagline: string;
  description: string;
  bannerImage: string;
  sortOrder: string;
  status: CollectionStatus;
}

const EMPTY_FORM: FormState = { title: "", slug: "", tagline: "", description: "", bannerImage: "", sortOrder: "0", status: "Active" };

const slugify = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);

const statusBadge = (status: CollectionStatus) =>
  status === "Active" ? "bg-success-bg text-success" : status === "Draft" ? "bg-warning-bg text-warning" : "bg-line text-ink-secondary";

export default function AdminCollectionsPage() {
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [displayType, setDisplayType] = useState<"grid" | "table">("grid");
  const [notice, setNotice] = useState("");
  const [pageError, setPageError] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [slugError, setSlugError] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const load = useCallback(async () => {
    const res = await api("/api/v1/admin/collections?includeDrafts=true");
    if (!res.ok || !Array.isArray(res.body?.data)) {
      setLoadState("error");
      return;
    }
    setCollections(res.body.data);
    setLoadState("ready");
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setSlugError("");
    setSlugTouched(false);
    setIsDrawerOpen(true);
  };

  const openEdit = (col: CollectionItem) => {
    setEditingId(col.id);
    setForm({
      title: col.title,
      slug: col.slug,
      tagline: col.tagline || "",
      description: col.description || "",
      bannerImage: col.bannerImage || "",
      sortOrder: String(col.sortOrder),
      status: col.status,
    });
    setFormError("");
    setSlugError("");
    setSlugTouched(true);
    setIsDrawerOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setFormError("");
    setSlugError("");
    setIsSubmitting(true);
    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim() || slugify(form.title),
      tagline: form.tagline.trim() || null,
      description: form.description.trim() || null,
      bannerImage: form.bannerImage.trim() || null,
      sortOrder: form.sortOrder.trim() === "" ? 0 : Number(form.sortOrder),
      status: form.status,
    };
    const res = editingId
      ? await api(`/api/v1/admin/collections/${editingId}`, { method: "PATCH", json: payload })
      : await api("/api/v1/admin/collections", { method: "POST", json: payload });
    setIsSubmitting(false);
    if (!res.ok) {
      // Nothing is added to the list unless the server accepted it.
      if (res.status === 409 || /slug/i.test(res.message)) setSlugError(res.message);
      else setFormError(res.message);
      return;
    }
    setIsDrawerOpen(false);
    setNotice(editingId ? `Collection "${payload.title}" updated.` : `Collection "${payload.title}" created.`);
    setPageError("");
    await load();
  };

  const setStatus = async (col: CollectionItem, status: CollectionStatus) => {
    setBusyId(col.id);
    setPageError("");
    setNotice("");
    const res = await api(`/api/v1/admin/collections/${col.id}`, { method: "PATCH", json: { status } });
    setBusyId(null);
    if (!res.ok) {
      setPageError(res.message);
      return;
    }
    setNotice(status === "Archived" ? `"${col.title}" archived. It is hidden from the storefront.` : `"${col.title}" is now ${status}.`);
    await load();
  };

  const deleteCollection = async (col: CollectionItem) => {
    setBusyId(col.id);
    setPageError("");
    setNotice("");
    const res = await api(`/api/v1/admin/collections/${col.id}`, { method: "DELETE" });
    setBusyId(null);
    setConfirmDeleteId(null);
    if (!res.ok) {
      setPageError(res.message);
      return;
    }
    setNotice(res.message || `Collection "${col.title}" deleted.`);
    await load();
  };

  const filteredCollections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return collections.filter((col) => {
      const matchesSearch =
        !q || col.title.toLowerCase().includes(q) || col.slug.toLowerCase().includes(q) || (col.tagline || "").toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || col.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [collections, searchQuery, statusFilter]);

  const totalLinkedProducts = useMemo(() => collections.reduce((acc, c) => acc + (c.productsCount || 0), 0), [collections]);
  const publishedCount = collections.filter((c) => c.status === "Active").length;
  const draftCount = collections.filter((c) => c.status === "Draft").length;

  const renderActions = (col: CollectionItem) => {
    if (confirmDeleteId === col.id) {
      return (
        <div role="alertdialog" aria-label={`Confirm delete ${col.title}`} className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="text-error">
            Delete? {col.productsCount} product link{col.productsCount === 1 ? "" : "s"} will be removed; the products stay.
          </span>
          <button
            type="button"
            disabled={busyId === col.id}
            onClick={() => void deleteCollection(col)}
            className="px-2 py-1 bg-error text-on-primary rounded-md font-semibold disabled:opacity-60"
          >
            Yes, delete
          </button>
          <button type="button" onClick={() => setConfirmDeleteId(null)} className="px-2 py-1 border border-line rounded-md">
            Cancel
          </button>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1">
        <Link
          href={`/collections/${col.slug}`}
          target="_blank"
          className="p-1.5 rounded-md hover:bg-ink/5 text-ink-secondary transition-colors"
          title="View on Storefront"
          aria-label={`View ${col.title} on storefront`}
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
        <button type="button" onClick={() => openEdit(col)} className="p-1.5 rounded-md hover:bg-ink/5 text-ink-secondary" title="Edit Collection" aria-label={`Edit ${col.title}`}>
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        {col.status === "Archived" ? (
          <button
            type="button"
            disabled={busyId === col.id}
            onClick={() => void setStatus(col, "Draft")}
            className="p-1.5 rounded-md hover:bg-ink/5 text-ink-secondary"
            title="Restore as Draft"
            aria-label={`Restore ${col.title}`}
          >
            <ArchiveRestore className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            type="button"
            disabled={busyId === col.id}
            onClick={() => void setStatus(col, "Archived")}
            className="p-1.5 rounded-md hover:bg-ink/5 text-ink-secondary"
            title="Archive Collection"
            aria-label={`Archive ${col.title}`}
          >
            <Archive className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          type="button"
          onClick={() => setConfirmDeleteId(col.id)}
          className="p-1.5 rounded-md hover:bg-error-bg text-error"
          title="Delete Collection"
          aria-label={`Delete ${col.title}`}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  };

  const banner = (col: CollectionItem, className: string) =>
    col.bannerImage ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={col.bannerImage} alt={col.title} className={className} />
    ) : (
      <div className={`${className} bg-canvas flex items-center justify-center text-[10px] text-ink-muted`}>No banner</div>
    );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans text-ink">
      {/* 1. TOP HEADER & ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif text-ink tracking-tight">Collections Management</h1>
          <p className="text-xs text-ink-muted mt-0.5">Curate seasonal edits, heritage capsules and thematic wardrobes.</p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center border border-line rounded-md bg-surface p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setDisplayType("grid")}
              aria-label="Grid view"
              aria-pressed={displayType === "grid"}
              className={`p-1.5 rounded-xs transition-colors ${displayType === "grid" ? "bg-primary text-on-primary" : "text-ink-muted hover:text-ink"}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setDisplayType("table")}
              aria-label="Table view"
              aria-pressed={displayType === "table"}
              className={`p-1.5 rounded-xs transition-colors ${displayType === "table" ? "bg-primary text-on-primary" : "text-ink-muted hover:text-ink"}`}
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-md text-xs font-semibold hover:bg-primary-hover transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Collection</span>
          </button>
        </div>
      </div>

      {notice && (
        <div role="status" className="p-3 bg-success-bg border border-success-line text-success rounded-md text-xs flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-success" />
            {notice}
          </span>
          <button type="button" onClick={() => setNotice("")} className="text-success font-bold p-1" aria-label="Dismiss notification">
            &#10005;
          </button>
        </div>
      )}
      {pageError && (
        <div role="alert" className="p-3 bg-error-bg border border-error-line text-error rounded-md text-xs flex items-center justify-between">
          <span>{pageError}</span>
          <button type="button" onClick={() => setPageError("")} className="font-bold p-1" aria-label="Dismiss error">
            &#10005;
          </button>
        </div>
      )}

      {loadState === "error" && (
        <div role="alert" className="p-3 bg-error-bg border border-error-line text-error rounded-md text-xs flex justify-between">
          <span>The collections could not be loaded.</span>
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
          Loading collections...
        </div>
      )}

      {loadState === "ready" && (
        <>
          {/* 2. KPI CARDS (all from the loaded collections) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface p-4 rounded-xl border border-line shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-muted">Total Collections</span>
                <div className="w-8 h-8 rounded-full bg-warning-bg text-primary flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-serif font-semibold" data-testid="kpi-total">{collections.length}</div>
            </div>
            <div className="bg-surface p-4 rounded-xl border border-line shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-muted">Published</span>
                <div className="w-8 h-8 rounded-full bg-success-bg text-success flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-serif font-semibold text-success">{publishedCount}</div>
            </div>
            <div className="bg-surface p-4 rounded-xl border border-line shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-muted">Drafts</span>
                <div className="w-8 h-8 rounded-full bg-warning-bg text-warning flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-serif font-semibold">{draftCount}</div>
            </div>
            <div className="bg-surface p-4 rounded-xl border border-line shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-muted">Product Links</span>
                <div className="w-8 h-8 rounded-full bg-warning-bg text-warning flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-serif font-semibold">{totalLinkedProducts}</div>
              <span className="text-[10px] text-ink-muted">Live products only, counted per collection</span>
            </div>
          </div>

          {/* 3. FILTERS & SEARCH */}
          <div className="bg-surface p-4 rounded-xl border border-line shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search collections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-canvas border border-line rounded-md text-ink placeholder:text-ink-muted focus:outline-none focus:border-primary"
                aria-label="Search collections"
              />
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by Status"
                className="px-3 py-2 bg-surface border border-line rounded-md text-ink focus:outline-none focus:border-primary"
              >
                <option value="all">Status: All</option>
                <option value="Active">Active</option>
                <option value="Draft">Draft</option>
                <option value="Archived">Archived</option>
              </select>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                }}
                className="px-3 py-2 text-primary hover:text-primary-hover font-semibold transition-colors"
              >
                Reset
              </button>
            </div>
          </div>

          {/* 4. COLLECTIONS CONTENT */}
          {filteredCollections.length === 0 ? (
            <div className="py-12 text-center text-xs text-ink-muted bg-surface rounded-xl border border-line" data-testid="collections-empty">
              {collections.length === 0 ? "No collections yet. Create your first collection." : "No collections match this search."}
            </div>
          ) : displayType === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCollections.map((col) => (
                <div key={col.id} data-testid="collection-card" className="bg-surface rounded-xl border border-line shadow-2xs overflow-hidden flex flex-col hover:border-primary-hover/60 transition-all">
                  <div className="relative aspect-16/9 bg-canvas overflow-hidden">
                    {banner(col, "absolute inset-0 w-full h-full object-cover")}
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/20 to-transparent" />
                    <div className="absolute top-3 right-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase ${statusBadge(col.status)}`}>{col.status}</span>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 text-on-primary">
                      <span className="text-[10px] tracking-widest uppercase font-serif text-highlight">Order {col.sortOrder}</span>
                      <h3 className="font-serif text-lg font-medium leading-tight">{col.title}</h3>
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      {col.tagline && <p className="text-xs font-serif italic text-secondary">{col.tagline}</p>}
                      <p className="text-[11px] font-mono text-ink-muted mt-1">/{col.slug}</p>
                      {col.description && <p className="text-xs text-ink-muted mt-1.5 line-clamp-2 leading-relaxed">{col.description}</p>}
                    </div>

                    <div className="pt-3 border-t border-line flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="inline-flex items-center gap-1 text-ink-secondary font-semibold">
                        <Layers className="w-3.5 h-3.5 text-primary" />
                        {col.productsCount} product{col.productsCount === 1 ? "" : "s"}
                      </span>
                      {renderActions(col)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-surface rounded-xl border border-line shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-canvas border-b border-line text-ink-muted font-semibold uppercase tracking-wider text-[11px]">
                      <th className="p-3.5">Collection</th>
                      <th className="p-3.5">Tagline</th>
                      <th className="p-3.5">Slug</th>
                      <th className="p-3.5">Products</th>
                      <th className="p-3.5">Order</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {filteredCollections.map((col) => (
                      <tr key={col.id} data-testid="collection-row" className="hover:bg-canvas/60 transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-10 rounded-md overflow-hidden relative border border-line shrink-0 bg-canvas">
                              {banner(col, "absolute inset-0 w-full h-full object-cover")}
                            </div>
                            <span className="font-serif font-medium text-sm text-ink">{col.title}</span>
                          </div>
                        </td>
                        <td className="p-3.5 italic text-ink-secondary max-w-xs truncate">{col.tagline}</td>
                        <td className="p-3.5 font-mono text-[11px] text-primary">/{col.slug}</td>
                        <td className="p-3.5 font-semibold text-ink">{col.productsCount}</td>
                        <td className="p-3.5 text-ink-muted">{col.sortOrder}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusBadge(col.status)}`}>{col.status}</span>
                        </td>
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <div className="inline-block">{renderActions(col)}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* 5. CREATE / EDIT DRAWER */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-ink/40 backdrop-blur-xs transition-opacity" onClick={() => setIsDrawerOpen(false)} />

          <div role="dialog" aria-modal="true" aria-label={editingId ? "Edit collection" : "Create collection"} className="relative w-full max-w-md bg-surface h-full shadow-2xl z-10 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="p-6 border-b border-line flex items-center justify-between bg-canvas">
                <div>
                  <h2 className="font-serif text-lg font-medium text-ink">{editingId ? "Edit Collection" : "Create Collection"}</h2>
                  <p className="text-xs text-ink-muted mt-0.5">Curate an edit with a title, banner and status.</p>
                </div>
                <button type="button" onClick={() => setIsDrawerOpen(false)} className="p-1.5 rounded-md text-ink-muted hover:text-ink hover:bg-ink/5" aria-label="Close drawer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form id="collection-form" onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
                {formError && (
                  <div role="alert" className="p-2.5 bg-error-bg border border-error-line text-error rounded-md">
                    {formError}
                  </div>
                )}

                <div>
                  <label htmlFor="col-title" className="font-semibold text-ink block mb-1">
                    Collection Title *
                  </label>
                  <input
                    id="col-title"
                    type="text"
                    required
                    maxLength={120}
                    placeholder="e.g. Royal Wedding Trousseau"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value, slug: slugTouched ? form.slug : slugify(e.target.value) })}
                    className="w-full px-3 py-2 bg-canvas border border-line rounded-md focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label htmlFor="col-slug" className="font-semibold text-ink block mb-1">
                    URL Slug
                  </label>
                  <input
                    id="col-slug"
                    type="text"
                    placeholder="e.g. royal-wedding-trousseau"
                    value={form.slug}
                    aria-invalid={slugError ? true : undefined}
                    aria-describedby={slugError ? "col-slug-error" : undefined}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setSlugError("");
                      setForm({ ...form, slug: e.target.value });
                    }}
                    className={`w-full px-3 py-2 bg-canvas border rounded-md font-mono text-[11px] focus:outline-none focus:border-primary ${slugError ? "border-error-line" : "border-line"}`}
                  />
                  {slugError && (
                    <p id="col-slug-error" role="alert" className="text-[11px] text-error mt-1">
                      {slugError}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="col-tagline" className="font-semibold text-ink block mb-1">
                    Tagline / Subheading
                  </label>
                  <input
                    id="col-tagline"
                    type="text"
                    maxLength={200}
                    value={form.tagline}
                    onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                    className="w-full px-3 py-2 bg-canvas border border-line rounded-md focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label htmlFor="col-description" className="font-semibold text-ink block mb-1">
                    Description
                  </label>
                  <textarea
                    id="col-description"
                    rows={3}
                    maxLength={2000}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full px-3 py-2 bg-canvas border border-line rounded-md focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label htmlFor="col-banner" className="font-semibold text-ink block mb-1">
                    Banner Image URL
                  </label>
                  <input
                    id="col-banner"
                    type="text"
                    placeholder="/uploads/... or https://..."
                    value={form.bannerImage}
                    onChange={(e) => setForm({ ...form, bannerImage: e.target.value })}
                    className="w-full px-3 py-2 bg-canvas border border-line rounded-md focus:outline-none focus:border-primary"
                  />
                  <p className="text-[10px] text-ink-muted mt-1">
                    Optional. Upload an image in the <Link href="/admin/media" className="underline">Media Library</Link> and paste its URL.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="col-order" className="font-semibold text-ink block mb-1">
                      Sort Order
                    </label>
                    <input
                      id="col-order"
                      type="number"
                      min={0}
                      value={form.sortOrder}
                      onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                      className="w-full px-3 py-2 bg-canvas border border-line rounded-md focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label htmlFor="col-status" className="font-semibold text-ink block mb-1">
                      Status
                    </label>
                    <select
                      id="col-status"
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value as CollectionStatus })}
                      className="w-full px-3 py-2 bg-surface border border-line rounded-md focus:outline-none focus:border-primary"
                    >
                      <option value="Active">Active</option>
                      <option value="Draft">Draft</option>
                      <option value="Archived">Archived</option>
                    </select>
                  </div>
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-line bg-canvas flex items-center justify-end gap-3">
              <button type="button" onClick={() => setIsDrawerOpen(false)} className="px-4 py-2 border border-line rounded-md text-xs font-semibold hover:bg-ink/5">
                Cancel
              </button>
              <button
                type="submit"
                form="collection-form"
                disabled={isSubmitting}
                className="px-4 py-2 bg-primary text-on-primary rounded-md text-xs font-semibold hover:bg-primary-hover disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Save Collection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
