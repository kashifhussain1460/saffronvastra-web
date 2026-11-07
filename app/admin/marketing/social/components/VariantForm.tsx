'use client';

import { useState } from 'react';
import { api } from '@/lib/adminApi';

interface Variant {
  id: string;
  platform: string;
  contentType: string;
  caption: string | null;
  hashtags: string[];
  settings: Record<string, unknown> | null;
}

interface Props {
  variant: Variant;
  campaignId: string;
  onSave: (variantId: string, data: Partial<Variant>) => Promise<void>;
}

export function VariantForm({ variant, campaignId, onSave }: Props) {
  const [caption, setCaption] = useState(variant.caption ?? '');
  const [hashtagsRaw, setHashtagsRaw] = useState(variant.hashtags.join(', '));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggesting, setSuggesting] = useState(false);

  const isInstagramStory = variant.platform === 'instagram' && variant.contentType.toLowerCase() === 'story';
  const isPinterestPin   = variant.platform === 'pinterest'  && variant.contentType.toLowerCase() === 'pin';

  const [altText,   setAltText]   = useState((variant.settings?.altText   as string | undefined) ?? '');
  const [boardName, setBoardName] = useState((variant.settings?.boardName as string | undefined) ?? '');

  async function handleSuggest() {
    setSuggesting(true);
    setError(null);
    const res = await api(`/api/v1/admin/social/campaigns/${campaignId}/variants/${variant.id}/suggest`, {
      method: 'POST',
    });
    setSuggesting(false);
    if (res.ok && res.body?.data) {
      const { caption: c, hashtags: h } = res.body.data as { caption: string; hashtags: string[] };
      setCaption(c ?? '');
      setHashtagsRaw(Array.isArray(h) ? h.join(', ') : '');
    } else {
      setError(res.message || 'AI suggestion failed.');
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);

    const hashtags = hashtagsRaw
      .split(',')
      .map((h) => h.trim().replace(/^#+/, ''))
      .filter(Boolean);

    const settings: Record<string, unknown> = { ...(variant.settings ?? {}) };
    if (isInstagramStory) settings.altText   = altText;
    if (isPinterestPin)   settings.boardName = boardName;

    const res = await api(`/api/v1/admin/social/campaigns/${campaignId}/variants/${variant.id}`, {
      method: 'PATCH',
      json: { caption: caption || null, hashtags, settings },
    });

    setSaving(false);
    if (res.ok) {
      setSaved(true);
      await onSave(variant.id, { caption: caption || null, hashtags, settings });
      setTimeout(() => setSaved(false), 2000);
    } else {
      setError(res.message || 'Save failed.');
    }
  }

  return (
    <div className="p-4 space-y-4">
      {/* AI suggest button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSuggest}
          disabled={suggesting}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-purple-300 bg-purple-50 text-purple-700 text-xs font-semibold hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {suggesting ? (
            <>
              <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Generating…
            </>
          ) : (
            <>✨ Generate with AI</>
          )}
        </button>
      </div>

      {/* Caption */}
      <div>
        <label className="block text-[11px] font-medium text-ink-muted uppercase tracking-wide mb-1">
          Caption
        </label>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={4}
          maxLength={2200}
          placeholder="Write a caption…"
          className="w-full px-3 py-2 bg-canvas border border-line rounded-md text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-primary resize-y"
        />
        <p className="text-[11px] text-ink-muted mt-0.5">{caption.length}/2200</p>
      </div>

      {/* Hashtags */}
      <div>
        <label className="block text-[11px] font-medium text-ink-muted uppercase tracking-wide mb-1">
          Hashtags <span className="normal-case font-normal">(comma-separated)</span>
        </label>
        <input
          type="text"
          value={hashtagsRaw}
          onChange={(e) => setHashtagsRaw(e.target.value)}
          placeholder="boho, embroidery, handmade"
          className="w-full px-3 py-2 bg-canvas border border-line rounded-md text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-primary"
        />
        <p className="text-[11px] text-ink-muted mt-0.5">
          {hashtagsRaw.split(',').filter((h) => h.trim()).length}/30 hashtags
        </p>
      </div>

      {/* Platform-specific extras */}
      {isInstagramStory && (
        <div>
          <label className="block text-[11px] font-medium text-ink-muted uppercase tracking-wide mb-1">Alt Text</label>
          <input
            type="text"
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            placeholder="Describe this image…"
            className="w-full px-3 py-2 bg-canvas border border-line rounded-md text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-primary"
          />
        </div>
      )}
      {isPinterestPin && (
        <div>
          <label className="block text-[11px] font-medium text-ink-muted uppercase tracking-wide mb-1">Board Name</label>
          <input
            type="text"
            value={boardName}
            onChange={(e) => setBoardName(e.target.value)}
            placeholder="e.g. Saffron Collection"
            className="w-full px-3 py-2 bg-canvas border border-line rounded-md text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-primary"
          />
        </div>
      )}

      {/* Save row */}
      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-1.5 rounded-md bg-ink text-white text-sm font-medium hover:bg-ink/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        {saved  && <span className="text-xs text-green-600">Saved!</span>}
        {error  && <span className="text-xs text-red-600">{error}</span>}
      </div>
    </div>
  );
}
