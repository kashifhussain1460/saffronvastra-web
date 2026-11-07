'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { api, formatDateTime } from '@/lib/adminApi';
import { StatusPill } from '../components/StatusPill';

interface Campaign {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  _count?: { products: number };
}

interface Page {
  items: Campaign[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function CampaignsListPage() {
  const [data, setData] = useState<Page | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    api<Page>(`/api/v1/admin/social/campaigns?page=${currentPage}&limit=20`)
      .then((r) => {
        if (r.ok && r.body?.items) setData(r.body as unknown as Page);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [currentPage]);

  async function handleDelete(id: string, name: string) {
    const label = name || `Campaign #${id.slice(0, 8)}`;
    if (!window.confirm(`Delete "${label}"? This permanently removes its products, variants and publish jobs. This cannot be undone.`)) {
      return;
    }
    setError(null);
    setDeletingId(id);
    const res = await api(`/api/v1/admin/social/campaigns/${id}`, { method: 'DELETE' });
    setDeletingId(null);
    if (res.ok) {
      load();
    } else {
      setError(res.message || 'Failed to delete the campaign.');
    }
  }

  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Nav tabs */}
      <div className="flex items-center gap-1 border-b border-line pb-0">
        <Link href="/admin/marketing/social" className="px-4 py-2 text-sm font-medium text-ink-muted hover:text-ink transition-colors">
          New Campaign
        </Link>
        <Link href="/admin/marketing/social/campaigns" className="px-4 py-2 text-sm font-medium text-primary border-b-2 border-primary -mb-px">
          All Campaigns
        </Link>
        <Link href="/admin/marketing/social/accounts" className="px-4 py-2 text-sm font-medium text-ink-muted hover:text-ink transition-colors">
          Accounts
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-ink">Campaigns</h1>
          <p className="text-sm text-ink-muted mt-0.5">All social publishing campaigns</p>
        </div>
        <Link
          href="/admin/marketing/social"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-ink text-white text-sm font-medium hover:bg-ink/80 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Campaign
        </Link>
      </div>

      {error && (
        <div className="px-4 py-2.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-line overflow-hidden shadow-2xs">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface border-b border-line text-ink-muted text-[11px] font-semibold uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3">Campaign</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Products</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-4 py-3"><div className="h-3 bg-line rounded w-40" /></td>
                  <td className="px-4 py-3"><div className="h-3 bg-line rounded w-16" /></td>
                  <td className="px-4 py-3"><div className="h-3 bg-line rounded w-8" /></td>
                  <td className="px-4 py-3"><div className="h-3 bg-line rounded w-28" /></td>
                  <td className="px-4 py-3" />
                </tr>
              ))
            ) : !data || data.items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-ink-muted">
                  No campaigns yet.{' '}
                  <Link href="/admin/marketing/social" className="text-primary underline">
                    Create one
                  </Link>
                </td>
              </tr>
            ) : (
              data.items.map((c) => (
                <tr key={c.id} className="hover:bg-canvas/60 transition-colors">
                  <td className="px-4 py-3 font-medium text-ink">
                    {c.name || `Campaign #${c.id.slice(0, 8)}`}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={c.status} />
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {c._count?.products ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-ink-muted text-xs whitespace-nowrap">
                    {formatDateTime(c.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/admin/marketing/social/campaigns/${c.id}`}
                        className="text-xs text-primary font-medium hover:underline"
                      >
                        View →
                      </Link>
                      <button
                        onClick={() => handleDelete(c.id, c.name)}
                        disabled={deletingId === c.id}
                        title="Delete campaign"
                        className="p-1.5 rounded-md text-ink-muted hover:text-red-600 hover:bg-red-50 disabled:opacity-40 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {data && data.total > data.limit && (
          <div className="px-4 py-3 border-t border-line bg-canvas flex items-center justify-between text-xs text-ink-muted">
            <span>
              {data.total} campaign{data.total !== 1 ? 's' : ''} · Page {data.page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="p-1.5 rounded-md border border-line hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="p-1.5 rounded-md border border-line hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
