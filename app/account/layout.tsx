import React from "react";
import type { Metadata } from "next";
import RequireSession from "@/components/account/RequireSession";
import VerifyEmailBanner from "@/components/account/VerifyEmailBanner";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireSession>
      <VerifyEmailBanner />
      {children}
    </RequireSession>
  );
}
