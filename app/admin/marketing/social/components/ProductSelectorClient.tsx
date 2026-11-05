'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/adminApi';
import ProductSelectorTable from './ProductSelectorTable';
import PlatformCard from './PlatformCard';

interface Platform {
  key: string;
  displayName: string;
  color: string;
  status: 'ready' | 'approval_pending' | 'manual_required';
  contentTypes: string[];
  manual: boolean;
}

interface Props {
  initialPlatforms: Platform[];
}

export default function ProductSelectorClient({ initialPlatforms }: Props) {
  const router = useRouter();
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Record<string, string | null>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleProduct = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const togglePlatform = (key: string) => {
    setSelectedPlatforms((prev) => {
      if (key in prev) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: null };
    });
  };

  const setContentType = (key: string, ct: string) => {
    setSelectedPlatforms((prev) => ({ ...prev, [key]: ct }));
  };

  // Can create campaign: at least 1 product AND at least 1 non-manual platform selected with a contentType
  const validVariants = Object.entries(selectedPlatforms).filter(([key, ct]) => {
    const platform = initialPlatforms.find((p) => p.key === key);
    return ct !== null && ct !== '' && platform && !platform.manual && platform.status !== 'manual_required';
  });

  const canCreate = selectedProductIds.length >= 1 && validVariants.length >= 1;

  const handleCreateCampaign = async () => {
    if (!canCreate) return;
    setSubmitting(true);
    setError(null);

    const result = await api('/api/v1/admin/social/campaigns', {
      method: 'POST',
      json: {
        productIds: selectedProductIds,
        variants: validVariants.map(([platform, contentType]) => ({ platform, contentType })),
      },
    });

    setSubmitting(false);

    if (result.ok && result.body?.data?.id) {
      router.push(`/admin/marketing/social/campaigns/${result.body.data.id}`);
    } else {
      setError(result.message || 'Failed to create campaign. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Error toast */}
      {error && (
        <div
          role="alert"
          className="p-3 bg-error-bg border border-error-line text-error rounded-md text-xs flex items-center justify-between gap-3"
        >
          <span>{error}</span>
          <button
            type="button"
            aria-label="Dismiss error"
            onClick={() => setError(null)}
            className="font-bold"
          >
            ✕
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Product selector — takes 2/3 width on xl */}
        <div className="xl:col-span-2">
          <h2 className="font-serif text-lg text-ink mb-3">Select Products</h2>
          <ProductSelectorTable selectedIds={selectedProductIds} onToggle={toggleProduct} />
        </div>

        {/* Platform cards — takes 1/3 width on xl */}
        <div>
          <h2 className="font-serif text-lg text-ink mb-3">Select Platforms</h2>
          {initialPlatforms.length === 0 ? (
            <p className="text-xs text-ink-muted">No platforms configured.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {initialPlatforms.map((platform) => (
                <PlatformCard
                  key={platform.key}
                  platform={platform}
                  selected={platform.key in selectedPlatforms}
                  selectedContentType={selectedPlatforms[platform.key] ?? null}
                  onToggle={() => togglePlatform(platform.key)}
                  onContentTypeChange={(ct) => setContentType(platform.key, ct)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Campaign button */}
      <div className="flex items-center justify-end pt-2 border-t border-line">
        <button
          onClick={handleCreateCampaign}
          disabled={!canCreate || submitting}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-md text-sm font-semibold hover:bg-primary-hover transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting && (
            <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
          )}
          {submitting ? 'Creating…' : 'Create Campaign'}
        </button>
      </div>
    </div>
  );
}
