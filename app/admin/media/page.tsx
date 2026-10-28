"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from "@/lib/uploadLimits";
import {
  Upload,
  Folder,
  FolderOpen,
  Image as ImageIcon,
  Trash2,
  Search,
  Shirt,
  ChevronLeft,
  ChevronRight,
  X,
  Package,
  Layers,
  AlertCircle,
} from "lucide-react";
import { api, formatDateTime } from "@/lib/adminApi";

interface MediaUsage {
  productImages: number;
  collections: number;
  categories: number;
  total: number;
}

interface MediaItem {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  bytes: number;
  width: number | null;
  height: number | null;
  altText: string;
  folder: string;
  uploadedBy: string | null;
  createdAt: string;
  usage: MediaUsage;
}

interface MediaStats {
  total: number;
  unused: number;
  totalBytes: number;
  folders: Record<string, number>;
}

const BASE_FOLDERS = ["Product Images", "Category Images", "Collection Images", "Banner Images"];
const PAGE_SIZE = 12;
const ALT_MAX = 200;

const formatBytes = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

const usageText = (u: MediaUsage) => {
  if (u.total === 0) return "Not used anywhere";
  const parts: string[] = [];
  if (u.productImages) parts.push(`${u.productImages} product image${u.productImages === 1 ? "" : "s"}`);
  if (u.collections) parts.push(`${u.collections} collection${u.collections === 1 ? "" : "s"}`);
  if (u.categories) parts.push(`${u.categories} categor${u.categories === 1 ? "y" : "ies"}`);
  return `Used by ${parts.join(", ")}`;
};

export default function AdminMediaLibraryPage() {
  const [folder, setFolder] = useState("All Images");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [stats, setStats] = useState<MediaStats | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [loadError, setLoadError] = useState("");

  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Edit form for the active image
  const [replacing, setReplacing] = useState(false);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);
  const [editName, setEditName] = useState("");
  const [editAlt, setEditAlt] = useState("");
  const [editFolder, setEditFolder] = useState("");
  const [saving, setSaving] = useState(false);
  const [panelError, setPanelError] = useState("");
  const [panelNotice, setPanelNotice] = useState("");

  const [confirmDelete, setConfirmDelete] = useState<"one" | "bulk" | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
    if (folder !== "All Images") params.set("folder", folder);
    if (query) params.set("search", query);
    const res = await api(`/api/v1/admin/media?${params}`);
    if (!res.ok) {
      setLoadError(res.message);
      setLoadState("error");
      return;
    }
    setItems(res.body.items);
    setStats(res.body.stats);
    setTotal(res.body.pagination.total);
    setTotalPages(res.body.pagination.totalPages || 1);
    setLoadError("");
    setLoadState("ready");
  }, [page, folder, query]);

  useEffect(() => {
    setLoadState("loading");
    void load();
  }, [load]);

  // If the last item of a later page was removed, step back to a page that exists.
  useEffect(() => {
    if (loadState === "ready" && page > totalPages) setPage(totalPages);
  }, [loadState, page, totalPages]);

  const active = items.find((m) => m.id === activeId) || null;

  useEffect(() => {
    if (active) {
      setEditName(active.name);
      setEditAlt(active.altText);
      setEditFolder(active.folder);
    }
    setPanelError("");
    setPanelNotice("");
    setConfirmDelete((c) => (c === "bulk" ? c : null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, active?.id]);

  const folderNames = Array.from(new Set([...BASE_FOLDERS, ...Object.keys(stats?.folders || {})]));

  const uploadFiles = async (files: File[]) => {
    if (files.length === 0 || isUploading) return;
    setIsUploading(true);
    setError("");
    setNotice("");
    const problems: string[] = [];
    let done = 0;
    const duplicates: string[] = [];
    let lastId: string | null = null;
    for (const file of files) {
      if (file.size > MAX_UPLOAD_BYTES) {
        problems.push(`${file.name}: The image is too large. The maximum size is ${MAX_UPLOAD_LABEL}.`);
        continue;
      }
      const form = new FormData();
      form.append("file", file);
      form.append("folder", folder !== "All Images" ? folder : "Product Images");
      const res = await api("/api/v1/admin/media/upload", { method: "POST", body: form });
      if (res.ok && res.body?.duplicate) {
        duplicates.push(`${file.name}: ${res.message}`);
        lastId = res.body?.data?.id ?? lastId;
      } else if (res.ok) {
        done += 1;
        lastId = res.body?.data?.id ?? lastId;
      } else {
        problems.push(`${file.name}: ${res.message}`);
      }
    }
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (problems.length) setError(problems.join(" | "));
    if (done || duplicates.length)
      setNotice([done ? `Uploaded ${done} image${done === 1 ? "" : "s"}.` : "", duplicates.length ? `Not uploaded again (already in the library): ${duplicates.join(" | ")}` : ""].filter(Boolean).join(" "));
    if (done || duplicates.length) {
      if (page !== 1) setPage(1);
      await load();
      if (lastId) setActiveId(lastId);
    }
  };

  // Swaps the picture behind this asset; products, categories and collections using it keep pointing at it.
  const replaceActive = async (file: File | undefined) => {
    if (!active || !file || replacing) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      setPanelError(`The image is too large. The maximum size is ${MAX_UPLOAD_LABEL}.`);
      return;
    }
    setReplacing(true);
    setPanelError("");
    setPanelNotice("");
    const form = new FormData();
    form.append("file", file);
    const res = await api(`/api/v1/admin/media/${active.id}/replace`, { method: "POST", body: form });
    setReplacing(false);
    if (replaceInputRef.current) replaceInputRef.current.value = "";
    if (!res.ok) {
      setPanelError(res.message);
      return;
    }
    const refs = res.body?.references;
    setPanelNotice(
      res.body?.unchanged
        ? res.message
        : `Image replaced.${refs ? ` Updated ${refs.productImages} product image${refs.productImages === 1 ? "" : "s"}, ${refs.categoryImages} category image${refs.categoryImages === 1 ? "" : "s"} and ${refs.collectionBanners} collection banner${refs.collectionBanners === 1 ? "" : "s"}.` : ""}`
    );
    await load();
  };

  const saveActive = async () => {
    if (!active || saving) return;
    setSaving(true);
    setPanelError("");
    setPanelNotice("");
    const res = await api(`/api/v1/admin/media/${active.id}`, {
      method: "PATCH",
      json: { name: editName, altText: editAlt, folder: editFolder },
    });
    setSaving(false);
    if (!res.ok) {
      setPanelError(res.message);
      return;
    }
    setPanelNotice("Saved.");
    await load();
  };

  const deleteIds = async (ids: string[]) => {
    setDeleting(true);
    setError("");
    setNotice("");
    setPanelError("");
    const problems: string[] = [];
    const deletedIds: string[] = [];
    let removed = 0;
    for (const id of ids) {
      const res = await api(`/api/v1/admin/media/${id}`, { method: "DELETE" });
      if (res.ok) {
        removed += 1;
        deletedIds.push(id);
      } else {
        const name = items.find((m) => m.id === id)?.name || "Image";
        problems.push(`${name}: ${res.message}`);
      }
    }
    setDeleting(false);
    setConfirmDelete(null);
    if (problems.length) {
      if (ids.length === 1) setPanelError(problems[0]);
      setError(problems.join(" | "));
    }
    if (removed) {
      setNotice(`Deleted ${removed} image${removed === 1 ? "" : "s"}.`);
      setSelectedIds((prev) => prev.filter((id) => !deletedIds.includes(id)));
      if (ids.includes(activeId || "")) setActiveId(null);
      await load();
    }
  };

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const allSelected = items.length > 0 && items.every((m) => selectedIds.includes(m.id));

  const kpis = [
    { label: "Total Images", value: stats?.total, icon: ImageIcon, tone: "bg-warning-bg text-warning" },
    { label: "Product Images", value: stats?.folders["Product Images"] ?? 0, icon: Shirt, tone: "bg-warning-bg text-warning" },
    {
      label: "Category / Banner",
      value: (stats?.folders["Category Images"] ?? 0) + (stats?.folders["Banner Images"] ?? 0),
      icon: Layers,
      tone: "bg-warning-bg text-warning",
    },
    { label: "Collection Images", value: stats?.folders["Collection Images"] ?? 0, icon: Package, tone: "bg-error-bg text-error" },
    { label: "Unused Images", value: stats?.unused, icon: AlertCircle, tone: "bg-success-bg text-success" },
  ];

  const folderButton = (name: string, count: number | undefined, Icon: typeof Folder) => (
    <button
      key={name}
      type="button"
      onClick={() => {
        setFolder(name);
        setPage(1);
      }}
      aria-pressed={folder === name}
      className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors ${
        folder === name ? "bg-surface-muted text-primary font-semibold" : "text-ink-secondary hover:bg-canvas"
      }`}
    >
      <div className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 text-warning" />
        <span>{name}</span>
      </div>
      <span className="text-[11px] text-ink-muted">{count ?? ""}</span>
    </button>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans text-ink">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif text-ink tracking-tight">Global Image Manager</h1>
          <p className="text-xs text-ink-muted mt-0.5">
            Upload, organise and manage the images used across products, categories and collections.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            aria-label="Choose images to upload"
            data-testid="media-file-input"
            className="hidden"
            onChange={(e) => void uploadFiles(Array.from(e.target.files || []))}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-md text-xs font-semibold hover:bg-primary-hover transition-colors shadow-sm disabled:opacity-60"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{isUploading ? "Uploading..." : "Upload Images"}</span>
          </button>
        </div>
      </div>

      {notice && (
        <div role="status" className="p-3 bg-success-bg border border-success-line text-success rounded-md text-xs flex items-center justify-between">
          <span>{notice}</span>
          <button type="button" aria-label="Dismiss message" onClick={() => setNotice("")} className="font-bold">
            &#10005;
          </button>
        </div>
      )}
      {error && (
        <div role="alert" className="p-3 bg-error-bg border border-error-line text-error rounded-md text-xs flex items-center justify-between">
          <span>{error}</span>
          <button type="button" aria-label="Dismiss error" onClick={() => setError("")} className="font-bold">
            &#10005;
          </button>
        </div>
      )}

      {/* 2. KPI CARDS (from the library itself) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="bg-surface p-4 rounded-xl border border-line shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs text-ink-muted">{k.label}</span>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${k.tone}`}>
                <k.icon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5 text-2xl font-serif font-semibold text-ink" data-testid={`kpi-${k.label.toLowerCase().replace(/[^a-z]+/g, "-")}`}>
              {k.value === undefined ? "—" : k.value}
            </div>
          </div>
        ))}
      </div>

      {/* 3. SEARCH */}
      <form
        className="bg-surface p-3.5 rounded-xl border border-line shadow-2xs flex items-center gap-3 text-xs"
        onSubmit={(e) => {
          e.preventDefault();
          setQuery(search.trim());
          setPage(1);
        }}
      >
        <div className="relative flex-1 lg:max-w-sm">
          <Search className="w-3.5 h-3.5 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            aria-label="Search images"
            placeholder="Search by name or alt text..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-canvas border border-line rounded-md text-ink placeholder:text-ink-muted focus:outline-none focus:border-primary"
          />
        </div>
        <button type="submit" className="px-3 py-1.5 bg-inverse text-on-primary rounded-md font-semibold">
          Search
        </button>
        <button
          type="button"
          onClick={() => {
            setSearch("");
            setQuery("");
            setFolder("All Images");
            setPage(1);
          }}
          className="px-2.5 py-1.5 text-primary hover:text-primary-hover font-medium"
        >
          Reset
        </button>
      </form>

      {/* 4. WORKSPACE: FOLDERS | GRID | PREVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-3 bg-surface p-4 rounded-xl border border-line shadow-2xs space-y-4">
          <div className="border-b border-line pb-3">
            <span className="font-semibold text-xs text-ink">Folders</span>
          </div>
          <nav aria-label="Folders" className="space-y-1 text-xs">
            {folderButton("All Images", stats?.total, ImageIcon)}
            {folderNames.map((name) => folderButton(name, stats?.folders[name] ?? 0, folder === name ? FolderOpen : Folder))}
          </nav>
          <div className="pt-4 border-t border-line space-y-1 text-xs">
            <span className="font-semibold text-ink block">Storage used</span>
            <span className="text-[11px] text-ink-muted">{stats ? formatBytes(stats.totalBytes) : "—"} across {stats?.total ?? 0} images</span>
          </div>
        </div>

        <div className={`${active ? "lg:col-span-5 xl:col-span-6" : "lg:col-span-9"} space-y-4`}>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              void uploadFiles(Array.from(e.dataTransfer.files || []));
            }}
            className={`border-2 border-dashed rounded-xl p-4 text-center transition-all ${
              isDragging ? "border-primary bg-surface-muted/80" : "border-line bg-surface"
            }`}
          >
            <p className="text-xs font-semibold text-ink">
              {isUploading ? "Uploading..." : "Drag and drop images here, or use Upload Images"}
            </p>
            <p className="text-[10px] text-ink-muted mt-1">
              JPEG, PNG, WebP, GIF or AVIF up to {MAX_UPLOAD_LABEL}. Uploading into:{" "}
              <span className="font-semibold text-primary">{folder === "All Images" ? "Product Images" : folder}</span>
            </p>
          </div>

          {loadState === "error" && (
            <div role="alert" className="p-3 bg-error-bg border border-error-line text-error rounded-md text-xs flex justify-between">
              <span>The media library could not be loaded{loadError ? ` (${loadError})` : ""}.</span>
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
              Loading images...
            </div>
          )}

          {loadState === "ready" && (
            <>
              {items.length > 0 && (
                <div className="bg-surface p-2.5 rounded-xl border border-line shadow-2xs flex items-center justify-between flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      aria-label="Select all images on this page"
                      checked={allSelected}
                      onChange={() => setSelectedIds(allSelected ? [] : items.map((m) => m.id))}
                      className="accent-primary cursor-pointer ml-1"
                    />
                    <span className="px-2 py-0.5 bg-warning-bg text-primary font-semibold rounded-full text-[11px]">
                      {selectedIds.length} selected
                    </span>
                  </div>
                  {confirmDelete === "bulk" ? (
                    <div role="alertdialog" aria-label="Confirm delete" className="flex items-center gap-2">
                      <span className="text-error">Delete {selectedIds.length} selected image(s)? Images in use are skipped.</span>
                      <button
                        type="button"
                        disabled={deleting}
                        onClick={() => void deleteIds(selectedIds)}
                        className="px-2.5 py-1 bg-error text-on-primary rounded-md text-[11px] font-semibold disabled:opacity-60"
                      >
                        {deleting ? "Deleting..." : "Yes, delete"}
                      </button>
                      <button type="button" onClick={() => setConfirmDelete(null)} className="px-2.5 py-1 border border-line rounded-md text-[11px]">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={selectedIds.length === 0}
                      onClick={() => setConfirmDelete("bulk")}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-error-bg border border-error-line text-error rounded-md text-[11px] hover:bg-error-bg disabled:opacity-40"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete selected</span>
                    </button>
                  )}
                </div>
              )}

              {items.length === 0 ? (
                <div className="py-12 text-center text-xs text-ink-muted bg-surface rounded-xl border border-line" data-testid="media-empty">
                  {query || folder !== "All Images" ? "No images match this search or folder." : "The library is empty. Upload your first image."}
                </div>
              ) : (
                <ul className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3" data-testid="media-grid">
                  {items.map((item) => {
                    const isSelected = selectedIds.includes(item.id);
                    const isActive = activeId === item.id;
                    return (
                      <li
                        key={item.id}
                        className={`bg-surface rounded-lg border overflow-hidden shadow-2xs transition-all ${
                          isActive ? "border-primary ring-2 ring-warning-line" : isSelected ? "border-primary" : "border-line hover:border-primary-hover/60"
                        }`}
                      >
                        <div className="relative aspect-square bg-canvas">
                          <button type="button" onClick={() => setActiveId(item.id)} aria-label={`Open ${item.name}`} className="absolute inset-0 w-full h-full">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={item.url} alt={item.altText || item.name} className="w-full h-full object-cover" />
                          </button>
                          <input
                            type="checkbox"
                            aria-label={`Select ${item.name}`}
                            checked={isSelected}
                            onChange={() => toggleSelect(item.id)}
                            className="absolute top-2 left-2 z-10 accent-primary cursor-pointer w-4 h-4"
                          />
                          {item.usage.total > 0 && (
                            <span className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-primary text-on-primary text-[9px] font-bold rounded-xs tracking-wider uppercase">
                              In use
                            </span>
                          )}
                        </div>
                        <div className="p-2.5 text-[11px] min-w-0">
                          <p className="font-semibold text-ink truncate">{item.name}</p>
                          <p className="text-[10px] text-ink-muted">{formatBytes(item.bytes)}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

              <div className="p-4 bg-surface rounded-xl border border-line flex items-center justify-between gap-4 text-xs text-ink-muted shadow-2xs">
                <p data-testid="media-count">
                  {total === 0 ? "No images" : `Showing ${(page - 1) * PAGE_SIZE + 1} to ${Math.min(page * PAGE_SIZE, total)} of ${total} images`}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Previous page"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="w-7 h-7 rounded-sm border border-line flex items-center justify-center text-ink-secondary disabled:opacity-40"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span>
                    Page {page} of {totalPages}
                  </span>
                  <button
                    type="button"
                    aria-label="Next page"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="w-7 h-7 rounded-sm border border-line flex items-center justify-center text-ink-secondary disabled:opacity-40"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* PREVIEW & METADATA */}
        {active && (
          <div className="lg:col-span-4 xl:col-span-3 bg-surface p-5 rounded-xl border border-line shadow-2xs space-y-4 text-xs" aria-label="Image details">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="font-serif text-base text-ink">Image Details</h3>
              <button type="button" onClick={() => setActiveId(null)} aria-label="Close details panel" className="text-ink-muted hover:text-ink">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative aspect-4/3 rounded-lg overflow-hidden border border-line bg-canvas">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={active.url} alt={active.altText || active.name} className="w-full h-full object-contain" />
            </div>

            <p className="text-[11px] text-ink-muted">
              {formatBytes(active.bytes)}
              {active.width && active.height ? ` • ${active.width} × ${active.height}` : ""} &bull; {active.mimeType}
              <br />
              Uploaded {formatDateTime(active.createdAt)}
              {active.uploadedBy ? ` by ${active.uploadedBy}` : ""}
            </p>

            <div className="space-y-1">
              <label htmlFor="media-name" className="font-semibold text-ink">
                Name
              </label>
              <input
                id="media-name"
                type="text"
                maxLength={200}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-canvas border border-line rounded-md text-xs focus:outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label htmlFor="media-alt" className="font-semibold text-ink">
                  Alt Text
                </label>
                <span className="text-[10px] text-ink-muted">
                  {editAlt.length}/{ALT_MAX}
                </span>
              </div>
              <input
                id="media-alt"
                type="text"
                maxLength={ALT_MAX}
                value={editAlt}
                onChange={(e) => setEditAlt(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-canvas border border-line rounded-md text-xs focus:outline-none focus:border-primary"
              />
              <p className="text-[10px] text-ink-muted">Used for SEO and accessibility.</p>
            </div>

            <div className="space-y-1">
              <label htmlFor="media-folder" className="font-semibold text-ink">
                Folder
              </label>
              <select
                id="media-folder"
                value={editFolder}
                onChange={(e) => setEditFolder(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-surface border border-line rounded-md text-xs focus:outline-none focus:border-primary"
              >
                {folderNames.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2 border-t border-line">
              <span className="font-semibold text-ink block">Usage</span>
              <p className="text-[11px] text-ink-secondary mt-1" data-testid="media-usage">
                {usageText(active.usage)}
              </p>
            </div>

            {panelError && (
              <div role="alert" className="p-2.5 bg-error-bg border border-error-line text-error rounded-md">
                {panelError}
              </div>
            )}
            {panelNotice && (
              <div role="status" className="p-2.5 bg-success-bg border border-success-line text-success rounded-md">
                {panelNotice}
              </div>
            )}

            <div className="pt-3 border-t border-line flex items-center justify-between gap-2">
              <input
                ref={replaceInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                aria-label="Choose a replacement image"
                className="hidden"
                onChange={(e) => void replaceActive(e.target.files?.[0])}
              />
              <button
                type="button"
                onClick={() => replaceInputRef.current?.click()}
                disabled={replacing}
                className="px-3 py-1.5 border border-line rounded-md font-semibold text-[11px] disabled:opacity-60"
              >
                {replacing ? "Replacing..." : "Replace image"}
              </button>
              <button
                type="button"
                onClick={() => void saveActive()}
                disabled={saving}
                className="px-3 py-1.5 bg-primary text-on-primary rounded-md font-semibold text-[11px] disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>

              {confirmDelete === "one" ? (
                <div role="alertdialog" aria-label="Confirm delete" className="flex items-center gap-1.5">
                  <span className="text-error">Delete this image?</span>
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={() => void deleteIds([active.id])}
                    className="px-2 py-1 bg-error text-on-primary rounded-md text-[11px] font-semibold disabled:opacity-60"
                  >
                    {deleting ? "Deleting..." : "Yes, delete"}
                  </button>
                  <button type="button" onClick={() => setConfirmDelete(null)} className="px-2 py-1 border border-line rounded-md text-[11px]">
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete("one")}
                  aria-label="Delete image"
                  className="px-2 py-1.5 border border-error-line text-error rounded-md hover:bg-error-bg inline-flex items-center gap-1 text-[11px]"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
