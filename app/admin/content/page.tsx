"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Plus, Search, ExternalLink } from "lucide-react";
import { api, formatDateTime } from "@/lib/adminApi";

interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  coverImage: string | null;
  category: string | null;
  status: "Draft" | "Published" | "Archived";
  publishedAt: string | null;
  updatedAt: string;
}

interface FormState {
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  coverImage: string;
  body: string;
  status: Article["status"];
}

const EMPTY_FORM: FormState = { title: "", slug: "", category: "", excerpt: "", coverImage: "", body: "", status: "Draft" };
const TABS = ["All", "Draft", "Published", "Archived"] as const;

const badge = (status: Article["status"]) =>
  status === "Published"
    ? "bg-success-bg border-success-line text-success"
    : status === "Archived"
    ? "bg-surface-muted border-line text-ink-secondary"
    : "bg-warning-bg border-warning-line text-warning";

export default function AdminContentPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("All");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Article[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");

  // null = form closed, "new" = creating, otherwise the id being edited
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: "15" });
    if (tab !== "All") params.set("status", tab);
    if (query) params.set("search", query);
    const res = await api(`/api/v1/admin/articles?${params}`);
    if (!res.ok) {
      setLoadState("error");
      return;
    }
    setItems(res.body.items);
    setCounts(res.body.counts || {});
    setTotal(res.body.pagination.total);
    setTotalPages(res.body.pagination.totalPages || 1);
    setLoadState("ready");
  }, [page, tab, query]);

  useEffect(() => {
    setLoadState("loading");
    void load();
  }, [load]);

  const openNew = () => {
    setEditing("new");
    setForm(EMPTY_FORM);
    setFieldErrors({});
    setError("");
    setNotice("");
  };

  const openEdit = (a: Article) => {
    setEditing(a.id);
    setForm({
      title: a.title,
      slug: a.slug,
      category: a.category || "",
      excerpt: a.excerpt || "",
      coverImage: a.coverImage || "",
      body: a.body,
      status: a.status,
    });
    setFieldErrors({});
    setError("");
    setNotice("");
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    setFieldErrors({});
    const isNew = editing === "new";
    const res = await api(isNew ? "/api/v1/admin/articles" : `/api/v1/admin/articles/${editing}`, {
      method: isNew ? "POST" : "PATCH",
      json: form,
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.message);
      setFieldErrors(res.body?.errors || {});
      return;
    }
    setNotice(isNew ? "Story created." : "Story saved.");
    setEditing(res.body.data.id);
    setForm((f) => ({ ...f, slug: res.body.data.slug, status: res.body.data.status }));
    await load();
  };

  const act = async (a: Article, action: "publish" | "unpublish" | "archive") => {
    setError("");
    setNotice("");
    const res = await api(`/api/v1/admin/articles/${a.id}/${action}`, { method: "POST" });
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setNotice(action === "publish" ? `"${a.title}" is now live.` : action === "unpublish" ? `"${a.title}" was moved back to drafts.` : `"${a.title}" was archived.`);
    if (editing === a.id) setForm((f) => ({ ...f, status: res.body.data.status }));
    await load();
  };

  const fieldError = (name: string) =>
    fieldErrors[name]?.[0] ? (
      <p role="alert" className="text-[11px] text-error mt-1">
        {fieldErrors[name][0]}
      </p>
    ) : null;

  const input = "w-full px-3 py-2 border border-line rounded-md text-sm bg-surface focus:outline-none focus:border-primary";
  const editingArticle = items.find((a) => a.id === editing) || null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans text-ink">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif tracking-tight">Journal</h1>
          <p className="text-xs text-ink-muted mt-0.5">Stories shown on the storefront journal. Only published stories are visible to visitors.</p>
        </div>
        <button type="button" onClick={openNew} className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary text-xs font-semibold rounded-md hover:bg-primary-hover">
          <Plus className="w-3.5 h-3.5" /> New story
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={tab === t}
            onClick={() => {
              setTab(t);
              setPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border ${
              tab === t ? "bg-primary text-on-primary border-primary" : "bg-surface text-ink border-line hover:bg-ink/5"
            }`}
          >
            {t}
            {t !== "All" && counts[t] !== undefined ? ` (${counts[t]})` : ""}
          </button>
        ))}
        <form
          className="ml-auto relative"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(search.trim());
            setPage(1);
          }}
        >
          <Search className="w-3.5 h-3.5 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            aria-label="Search stories"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, slug, category..."
            className="pl-8 pr-3 py-2 bg-surface border border-line rounded-md text-xs w-64 focus:outline-none focus:border-primary"
          />
        </form>
      </div>

      {loadState === "error" && (
        <div role="alert" className="p-3 bg-error-bg border border-error-line text-error rounded-md text-xs flex justify-between">
          <span>The stories could not be loaded.</span>
          <button type="button" className="underline font-semibold" onClick={() => void load()}>
            Try again
          </button>
        </div>
      )}
      {!editing && error && (
        <p role="alert" className="text-xs text-error">
          {error}
        </p>
      )}
      {!editing && notice && (
        <p role="status" className="text-xs text-success">
          {notice}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className={`${editing ? "lg:col-span-5" : "lg:col-span-12"} bg-surface rounded-xl border border-line shadow-2xs overflow-hidden`}>
          {loadState === "loading" && (
            <p role="status" className="p-6 text-xs text-ink-muted">
              Loading stories...
            </p>
          )}
          {loadState === "ready" && items.length === 0 && (
            <p className="p-8 text-center text-sm text-ink-muted">{query || tab !== "All" ? "No stories match." : "No stories yet. Write the first one with New story."}</p>
          )}
          <ul className="divide-y divide-line">
            {items.map((a) => (
              <li key={a.id} data-testid="article-row" className={`p-4 ${editing === a.id ? "bg-surface-muted" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <button type="button" onClick={() => openEdit(a)} className="text-sm font-semibold text-left hover:text-primary-hover truncate max-w-full">
                      {a.title}
                    </button>
                    <p className="text-[11px] text-ink-muted mt-0.5">
                      {a.category || "No category"} · /journal/{a.slug} · updated {formatDateTime(a.updatedAt)}
                    </p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold shrink-0 ${badge(a.status)}`}>{a.status}</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-3 text-[11px] font-semibold">
                  <button type="button" onClick={() => openEdit(a)} className="px-2.5 py-1 border border-line rounded hover:bg-ink/5">
                    Edit
                  </button>
                  {a.status !== "Published" ? (
                    <button type="button" onClick={() => void act(a, "publish")} className="px-2.5 py-1 border border-success-line bg-success-bg text-success rounded hover:bg-success-bg">
                      Publish
                    </button>
                  ) : (
                    <button type="button" onClick={() => void act(a, "unpublish")} className="px-2.5 py-1 border border-line rounded hover:bg-ink/5">
                      Unpublish
                    </button>
                  )}
                  {a.status !== "Archived" && (
                    <button type="button" onClick={() => void act(a, "archive")} className="px-2.5 py-1 border border-line rounded hover:bg-ink/5">
                      Archive
                    </button>
                  )}
                  {a.status === "Published" && (
                    <a href={`/journal/${a.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1 text-primary hover:underline">
                      View live <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <div className="p-3 border-t border-line flex items-center justify-between text-[11px] text-ink-muted">
            <span>
              {total} {total === 1 ? "story" : "stories"}
            </span>
            <span className="flex items-center gap-2">
              <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-2 py-1 border border-line rounded disabled:opacity-40">
                Previous
              </button>
              <span>
                {page} / {totalPages}
              </span>
              <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-2 py-1 border border-line rounded disabled:opacity-40">
                Next
              </button>
            </span>
          </div>
        </div>

        {editing && (
          <form onSubmit={save} noValidate aria-label="Story form" className="lg:col-span-7 bg-surface rounded-xl border border-line shadow-2xs p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl">{editing === "new" ? "New story" : "Edit story"}</h2>
              <button type="button" onClick={() => setEditing(null)} className="text-xs text-ink-muted hover:underline">
                Close
              </button>
            </div>

            <div>
              <label htmlFor="a-title" className="text-xs font-semibold block mb-1">
                Title
              </label>
              <input id="a-title" className={input} maxLength={150} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              {fieldError("title")}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="a-slug" className="text-xs font-semibold block mb-1">
                  Slug
                </label>
                <input id="a-slug" className={input} placeholder="Made from the title if left empty" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
                {fieldError("slug")}
              </div>
              <div>
                <label htmlFor="a-category" className="text-xs font-semibold block mb-1">
                  Category
                </label>
                <input id="a-category" className={input} maxLength={60} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                {fieldError("category")}
              </div>
            </div>

            <div>
              <label htmlFor="a-excerpt" className="text-xs font-semibold block mb-1">
                Excerpt
              </label>
              <textarea id="a-excerpt" rows={2} maxLength={300} className={input} value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
              {fieldError("excerpt")}
            </div>

            <div>
              <label htmlFor="a-cover" className="text-xs font-semibold block mb-1">
                Cover image URL
              </label>
              <input id="a-cover" className={input} placeholder="/uploads/... or /images/... (copy it from the media library)" value={form.coverImage} onChange={(e) => setForm({ ...form, coverImage: e.target.value })} />
              {fieldError("coverImage")}
              {form.coverImage.trim() && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.coverImage.trim()} alt="Cover preview" className="mt-2 h-24 rounded border border-line object-cover" />
              )}
            </div>

            <div>
              <label htmlFor="a-body" className="text-xs font-semibold block mb-1">
                Story
              </label>
              <textarea id="a-body" rows={12} className={input} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
              <p className="text-[11px] text-ink-muted mt-1">Plain text. Leave a blank line between paragraphs. Markup is shown as typed, never run.</p>
              {fieldError("body")}
            </div>

            <div>
              <label htmlFor="a-status" className="text-xs font-semibold block mb-1">
                Status
              </label>
              <select id="a-status" className={input} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Article["status"] })}>
                <option value="Draft">Draft (hidden)</option>
                <option value="Published">Published (live)</option>
                <option value="Archived">Archived (hidden)</option>
              </select>
              {fieldError("status")}
            </div>

            {error && Object.keys(fieldErrors).length === 0 && (
              <p role="alert" className="text-xs text-error">
                {error}
              </p>
            )}
            {notice && (
              <p role="status" className="text-xs text-success">
                {notice}
              </p>
            )}

            <div className="flex items-center gap-3">
              <button type="submit" disabled={busy} className="px-4 py-2 bg-primary text-on-primary text-xs font-semibold rounded-md hover:bg-primary-hover disabled:opacity-50">
                {busy ? "Saving..." : editing === "new" ? "Create story" : "Save changes"}
              </button>
              {editingArticle && form.status === "Published" && (
                <a href={`/journal/${form.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                  View live <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {editingArticle && form.status !== "Published" && <span className="text-[11px] text-ink-muted">Not visible to visitors until published.</span>}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
