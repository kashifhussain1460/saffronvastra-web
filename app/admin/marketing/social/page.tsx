import { api } from '@/lib/adminApi';
import ProductSelectorClient from './components/ProductSelectorClient';

export const dynamic = 'force-dynamic';

export default async function SocialPage() {
  const platforms = await api('/api/v1/admin/social/platforms').then(r => r.body?.data ?? []);
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
