import { cookies } from 'next/headers';
import { api } from '@/lib/adminApi';
import { SITE_URL } from '@/lib/site';

export const dynamic = 'force-dynamic';

type SocialAccount = {
  id: string;
  platform: string;
  accountName: string | null;
  connectionStatus: string | null;
  appReviewStatus: string | null;
  credentialSource: string;
  lastVerifiedAt: string | null;
};

function deriveAccountStatus(account: SocialAccount): string {
  if (account.connectionStatus === 'connected' && account.appReviewStatus === 'approved') return 'ready';
  if (account.appReviewStatus === 'pending' || account.appReviewStatus === 'under_review') return 'approval_pending';
  return 'manual';
}

function StatusPill({ status }: { status: string }) {
  if (status === 'ready') {
    return (
      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
        Ready
      </span>
    );
  }
  if (status === 'approval_pending') {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
        Pending
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
      Manual
    </span>
  );
}

function formatPlatform(platform: string) {
  return platform.charAt(0).toUpperCase() + platform.slice(1);
}

function formatVerified(value: string | null) {
  if (!value) return 'Never';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Never';
  return date.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default async function AccountsPage() {
  // Server-side fetch needs an absolute URL and the caller's session cookie;
  // the relative /api/v1 rewrite only works for same-origin browser requests.
  const cookieHeader = (await cookies()).toString();
  const res = await api<{ data: SocialAccount[] }>(`${SITE_URL}/api/v1/admin/social/accounts`, {
    cache: 'no-store',
    headers: { cookie: cookieHeader },
  });
  const accounts: SocialAccount[] = res.ok ? res.body?.data ?? [] : [];
  const loadError = res.ok ? null : res.message || 'Could not load connected accounts.';

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <h1 className="font-serif text-2xl text-ink">Connected Accounts</h1>

      {loadError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{loadError}</div>
      ) : accounts.length === 0 ? (
        <div className="rounded-lg border border-line p-8 text-center text-sm text-ink-muted">
          No accounts connected. Add Instagram credentials to your environment variables.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface text-ink-muted uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 font-medium">Platform</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Credential Source</th>
                <th className="px-4 py-3 font-medium">Last Verified</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {accounts.map((account) => (
                <tr key={account.id}>
                  <td className="px-4 py-3">
                    <div className="text-sm text-ink">{formatPlatform(account.platform)}</div>
                    {account.accountName ? <div className="text-ink-muted">{account.accountName}</div> : null}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={deriveAccountStatus(account)} />
                  </td>
                  <td className="px-4 py-3 text-ink">
                    {account.credentialSource === 'env'
                      ? 'Environment Variable'
                      : account.credentialSource === 'oauth'
                        ? 'OAuth'
                        : account.credentialSource}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{formatVerified(account.lastVerifiedAt)}</td>
                  <td className="px-4 py-3">
                    {account.credentialSource === 'oauth' ? (
                      <button
                        type="button"
                        disabled
                        className="rounded-lg border border-line px-3 py-1.5 text-xs text-ink-muted opacity-50 cursor-not-allowed"
                      >
                        Disconnect
                      </button>
                    ) : (
                      <span className="text-ink-muted">Read-only</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
