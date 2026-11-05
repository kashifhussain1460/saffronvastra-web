'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { api, formatDateTime } from '@/lib/adminApi';
import { StatusPill } from '../../components/StatusPill';
import { VariantForm } from '../../components/VariantForm';

// --- types ---

interface Job {
  id: string;
  status: string;
  attemptCount: number;
  lastErrorCode: string | null;
}

interface Variant {
  id: string;
  platform: string;
  contentType: string;
  caption: string | null;
  hashtags: string[];
  settings: Record<string, unknown> | null;
  jobs: Job[];
}

interface Product {
  id: string;
  productId: string;
  title: string;
  variants: Variant[];
}

interface Campaign {
  id: string;
  status: string;
  createdAt: string;
  products: Product[];
}

// --- helpers ---

const TERMINAL_STATUSES = new Set(['published', 'failed', 'dead']);

function allJobsTerminal(campaign: Campaign): boolean {
  for (const product of campaign.products) {
    for (const variant of product.variants) {
      for (const job of variant.jobs) {
        if (!TERMINAL_STATUSES.has(job.status)) return false;
      }
    }
  }
  return true;
}

function derivePlatforms(products: Product[]): string[] {
  const seen = new Set<string>();
  for (const product of products) {
    for (const variant of product.variants) {
      seen.add(variant.platform);
    }
  }
  return Array.from(seen).sort();
}

/** Returns the first job for the given product+platform (may be undefined). */
function findJob(product: Product, platform: string): Job | undefined {
  const variant = product.variants.find((v) => v.platform === platform);
  return variant?.jobs?.[0];
}

/** Returns all variants across all products (deduplicated by variant id). */
function allVariants(products: Product[]): Variant[] {
  const seen = new Set<string>();
  const result: Variant[] = [];
  for (const product of products) {
    for (const variant of product.variants) {
      if (!seen.has(variant.id)) {
        seen.add(variant.id);
        result.push(variant);
      }
    }
  }
  return result;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// --- main component ---

export default function CampaignDetailPage() {
  const params = useParams<{ id: string }>();
  const campaignId = params.id;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [retryingJobId, setRetryingJobId] = useState<string | null>(null);
  const [openVariantId, setOpenVariantId] = useState<string | null>(null);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingElapsedRef = useRef(0);

  async function fetchCampaign(): Promise<Campaign | null> {
    const res = await api<{ data: Campaign }>(`/api/v1/admin/social/campaigns/${campaignId}`);
    if (res.ok && res.body?.data) {
      setCampaign(res.body.data);
      setLoadError(null);
      return res.body.data;
    }
    setLoadError(res.message || 'Could not load campaign.');
    return null;
  }

  function stopPolling() {
    if (pollingRef.current !== null) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }

  function startPolling() {
    pollingElapsedRef.current = 0;
    stopPolling();
    pollingRef.current = setInterval(async () => {
      pollingElapsedRef.current += 3;
      const updated = await fetchCampaign();
      if (!updated) { stopPolling(); return; }
      if (allJobsTerminal(updated) || pollingElapsedRef.current >= 60) {
        stopPolling();
        setPublishing(false);
      }
    }, 3000);
  }

  useEffect(() => {
    fetchCampaign();
    return () => stopPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  async function handlePublish() {
    setPublishing(true);
    setPublishError(null);
    const res = await api(`/api/v1/admin/social/campaigns/${campaignId}/publish`, { method: 'POST' });
    if (!res.ok) {
      setPublishing(false);
      setPublishError(res.message || 'Publish failed.');
      return;
    }
    startPolling();
  }

  async function handleRetry(jobId: string) {
    setRetryingJobId(jobId);
    await api(`/api/v1/admin/social/campaigns/${campaignId}/jobs/${jobId}/retry`, { method: 'POST' });
    await fetchCampaign();
    setRetryingJobId(null);
  }

  // onSave is a no-op until the backend PATCH endpoint is added.
  async function handleVariantSave(_variantId: string, _data: Partial<Variant>) {
    // TODO: add PATCH variant endpoint on the backend to enable saving.
  }

  if (loadError) {
    return (
      <div className="p-6 lg:p-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{loadError}</div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-6 lg:p-8 text-sm text-ink-muted">Loading…</div>
    );
  }

  const platforms = derivePlatforms(campaign.products);
  const variants = allVariants(campaign.products);

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-serif text-2xl text-ink">
            Campaign #{campaign.id.slice(0, 8)}
          </h1>
          <div className="flex items-center gap-2 text-sm text-ink-muted">
            <StatusPill status={campaign.status} />
            <span>Created {formatDateTime(campaign.createdAt)}</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <button
            type="button"
            onClick={handlePublish}
            disabled={publishing}
            className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {publishing ? 'Publishing…' : 'Publish'}
          </button>
          {publishError && (
            <p className="text-xs text-red-600">{publishError}</p>
          )}
          {publishing && (
            <p className="text-xs text-ink-muted">Polling for updates…</p>
          )}
        </div>
      </div>

      {/* Product × Platform matrix */}
      {campaign.products.length > 0 && platforms.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface text-ink-muted uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                {platforms.map((p) => (
                  <th key={p} className="px-4 py-3 font-medium">{capitalize(p)}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {campaign.products.map((product) => (
                <tr key={product.id}>
                  <td className="px-4 py-3 text-ink font-medium max-w-[200px]">
                    <span className="line-clamp-2">{product.title}</span>
                  </td>
                  {platforms.map((platform) => {
                    const job = findJob(product, platform);
                    return (
                      <td key={platform} className="px-4 py-3">
                        {job ? (
                          <div className="flex flex-col gap-1.5">
                            <StatusPill status={job.status} />
                            {(job.status === 'failed' || job.status === 'dead') && (
                              <button
                                type="button"
                                onClick={() => handleRetry(job.id)}
                                disabled={retryingJobId === job.id}
                                className="text-[11px] text-blue-600 hover:underline disabled:opacity-50 text-left"
                              >
                                {retryingJobId === job.id ? 'Retrying…' : 'Retry'}
                              </button>
                            )}
                            {job.lastErrorCode && (
                              <span className="text-[11px] text-ink-muted">{job.lastErrorCode}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-ink-muted">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-lg border border-line p-8 text-center text-sm text-ink-muted">
          No products in this campaign.
        </div>
      )}

      {/* Variant accordion */}
      {variants.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-serif text-lg text-ink">Variant Details</h2>
          <div className="space-y-2">
            {variants.map((variant) => {
              const isOpen = openVariantId === variant.id;
              return (
                <div key={variant.id} className="rounded-lg border border-line overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenVariantId(isOpen ? null : variant.id)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-ink bg-surface hover:bg-surface/80 transition-colors"
                  >
                    <span>
                      {capitalize(variant.platform)} · {variant.contentType}
                    </span>
                    <span className="text-ink-muted text-xs">{isOpen ? '▲' : '▼'}</span>
                  </button>
                  {isOpen && (
                    <div className="border-t border-line">
                      <VariantForm variant={variant} onSave={handleVariantSave} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
