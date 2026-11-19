import { exitPreviewHref } from "@/lib/preview";

// Shown on product and collection pages while an administrator is in preview mode (app/api/preview), so it is clear
// the page is rendered live with the admin session (Draft items included) rather than the cached public copy.
export default function PreviewBanner({ path, status }: { path: string; status?: string | null }) {
  return (
    <div role="status" className="border-b border-line bg-surface-muted">
      <p className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-center gap-x-3 gap-y-1 px-[15px] py-2 text-center text-xs text-ink-secondary">
        <span>
          <strong className="font-semibold text-ink">Preview mode</strong>: you see this page live with your admin session
          {status && status !== "Active" ? ` (status: ${status}, hidden from shoppers and search engines)` : ""}.
        </span>
        <a href={exitPreviewHref(path)} className="font-semibold text-ink underline underline-offset-2 hover:text-primary-hover">
          Exit preview
        </a>
      </p>
    </div>
  );
}
