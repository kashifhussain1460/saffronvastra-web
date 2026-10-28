"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useStore } from "@/context/StoreContext";

// Second line of defence behind the edge check: if the session is gone (or ends while the page is open),
// the account area is never shown, only a redirect to sign-in.
export default function RequireSession({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, authLoading } = useStore();
  const router = useRouter();
  const pathname = usePathname();
  const signedOut = !authLoading && !isAuthenticated;

  useEffect(() => {
    if (signedOut) router.replace(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
  }, [signedOut, router, pathname]);

  if (authLoading || signedOut) {
    return (
      <div role="status" className="min-h-[50vh] flex items-center justify-center text-base text-ink-secondary">
        Checking your session...
      </div>
    );
  }
  return <>{children}</>;
}
