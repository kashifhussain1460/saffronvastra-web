import { cookies } from 'next/headers';
import Link from 'next/link';
import { api } from '@/lib/adminApi';
import { SITE_URL } from '@/lib/site';
import ProductSelectorClient from './components/ProductSelectorClient';

interface PlatformMeta {
  key: string;
  displayName: string;
  color: string;
  status: 'ready' | 'approval_pending' | 'manual_required';
  contentTypes: string[];
  manual: boolean;
}

export const dynamic = 'force-dynamic';

export default async function SocialPage() {
  const cookieHeader = (await cookies()).toString();
  const platforms = await api<{ data: Record<string, PlatformMeta> }>(`${SITE_URL}/api/v1/admin/social/platforms`, {
    headers: { cookie: cookieHeader },
  }).then(r => Object.values(r.body?.data ?? {}));
  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Nav tabs */}
      <div className="flex items-center gap-1 border-b border-line pb-0">
        <Link href="/admin/marketing/social" className="px-4 py-2 text-sm font-medium text-primary border-b-2 border-primary -mb-px">
          New Campaign
        </Link>
        <Link href="/admin/marketing/social/campaigns" className="px-4 py-2 text-sm font-medium text-ink-muted hover:text-ink transition-colors">
          All Campaigns
        </Link>
        <Link href="/admin/marketing/social/accounts" className="px-4 py-2 text-sm font-medium text-ink-muted hover:text-ink transition-colors">
          Accounts
        </Link>
      </div>

      <div>
        <h1 className="font-serif text-2xl text-ink">New Campaign</h1>
        <p className="text-sm text-ink-muted mt-1">Select products and platforms to create a campaign.</p>
      </div>
      <ProductSelectorClient initialPlatforms={platforms} />
    </div>
  );
}
