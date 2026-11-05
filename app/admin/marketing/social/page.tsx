import { cookies } from 'next/headers';
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
      <div>
        <h1 className="font-serif text-2xl text-ink">Social Media Publishing</h1>
        <p className="text-sm text-ink-muted mt-1">Select products and platforms to create a campaign.</p>
      </div>
      <ProductSelectorClient initialPlatforms={platforms} />
    </div>
  );
}
