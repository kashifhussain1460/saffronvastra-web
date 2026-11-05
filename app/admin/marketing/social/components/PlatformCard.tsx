'use client';

interface Platform {
  key: string;
  displayName: string;
  color: string;
  status: 'ready' | 'approval_pending' | 'manual_required';
  contentTypes: string[];
  manual: boolean;
}

interface Props {
  platform: Platform;
  selected: boolean;
  selectedContentType: string | null;
  onToggle: () => void;
  onContentTypeChange: (ct: string) => void;
}

const statusConfig = {
  ready: { label: 'Connected', className: 'bg-success-bg text-success border border-success-line' },
  approval_pending: { label: 'Pending Approval', className: 'bg-warning-bg text-warning border border-warning-line' },
  manual_required: { label: 'Manual Only', className: 'bg-surface-muted text-ink-secondary border border-line' },
} as const;

export default function PlatformCard({
  platform,
  selected,
  selectedContentType,
  onToggle,
  onContentTypeChange,
}: Props) {
  const isManual = platform.manual || platform.status === 'manual_required';
  const statusInfo = statusConfig[platform.status] ?? statusConfig.manual_required;

  return (
    <div
      className={`relative bg-surface border border-line rounded-xl p-4 flex flex-col gap-3 shadow-2xs transition-opacity ${
        isManual ? 'opacity-60' : ''
      }`}
      style={{ borderLeftColor: platform.color, borderLeftWidth: 4 }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-sm text-ink">{platform.displayName}</span>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider w-fit ${statusInfo.className}`}
          >
            {statusInfo.label}
          </span>
        </div>

        {/* Toggle checkbox */}
        <label className={`flex items-center gap-2 cursor-pointer ${isManual ? 'pointer-events-none' : ''}`}>
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggle}
            disabled={isManual}
            className="accent-primary w-4 h-4 rounded cursor-pointer"
            aria-label={`Select ${platform.displayName}`}
          />
        </label>
      </div>

      {/* Content type selector */}
      <div>
        <label className="block text-xs text-ink-muted mb-1" htmlFor={`ct-${platform.key}`}>
          Content type
        </label>
        <select
          id={`ct-${platform.key}`}
          value={selectedContentType ?? ''}
          onChange={(e) => onContentTypeChange(e.target.value)}
          disabled={!selected || isManual}
          className="w-full px-3 py-2 bg-canvas border border-line rounded-md text-xs text-ink focus:outline-none focus:border-primary disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label={`Content type for ${platform.displayName}`}
        >
          <option value="">Select content type…</option>
          {platform.contentTypes.map((ct) => (
            <option key={ct} value={ct}>
              {ct}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
