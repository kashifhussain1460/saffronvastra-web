'use client';

// TODO: add PATCH variant endpoint on the backend to enable editing.
// Until then, this component renders all fields as read-only display.

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
  // onSave is accepted in the interface for future use once the PATCH endpoint exists.
  onSave: (variantId: string, data: Partial<Variant>) => Promise<void>;
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-[11px] font-medium text-ink-muted uppercase tracking-wide mb-0.5">{label}</dt>
      <dd className="text-sm text-ink whitespace-pre-wrap">{value || <span className="text-ink-muted italic">—</span>}</dd>
    </div>
  );
}

export function VariantForm({ variant }: Props) {
  const isInstagramStory = variant.platform === 'instagram' && variant.contentType === 'story';
  const isPinterestPin  = variant.platform === 'pinterest'  && variant.contentType === 'pin';

  const altText   = isInstagramStory ? (variant.settings?.altText   as string | undefined) : undefined;
  const boardName = isPinterestPin   ? (variant.settings?.boardName as string | undefined) : undefined;

  return (
    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 p-4 bg-surface rounded-lg border border-line text-sm">
      <Field label="Caption" value={variant.caption} />
      <Field label="Hashtags" value={variant.hashtags.length > 0 ? variant.hashtags.join(', ') : null} />
      {isInstagramStory && <Field label="Alt Text" value={altText ?? null} />}
      {isPinterestPin   && <Field label="Board Name" value={boardName ?? null} />}
    </dl>
  );
}
