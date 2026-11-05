'use client';

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  pending:    { label: 'Pending',    className: 'bg-zinc-100 text-zinc-600' },
  processing: { label: 'Processing', className: 'bg-blue-100 text-blue-700' },
  published:  { label: 'Published',  className: 'bg-green-100 text-green-700' },
  failed:     { label: 'Failed',     className: 'bg-amber-100 text-amber-700' },
  dead:       { label: 'Dead',       className: 'bg-red-100 text-red-700' },
};

export function StatusPill({ status }: { status: string }) {
  const { label, className } = STATUS_MAP[status] ?? { label: status, className: 'bg-zinc-100 text-zinc-500' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${className}`}>
      {label}
    </span>
  );
}
