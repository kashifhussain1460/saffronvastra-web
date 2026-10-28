"use client";

import React, { createContext, useContext } from "react";
import { DEFAULT_SITE_SETTINGS, SiteSettings } from "@/lib/siteSettings";

const SettingsContext = createContext<SiteSettings>(DEFAULT_SITE_SETTINGS);

export function SettingsProvider({ settings, children }: { settings: SiteSettings; children: React.ReactNode }) {
  return <SettingsContext.Provider value={settings}>{children}</SettingsContext.Provider>;
}

export const useSiteSettings = () => useContext(SettingsContext);
