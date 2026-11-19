// Links into preview mode (app/api/preview). Used by the admin "View on storefront" buttons.
export const previewHref = (path: string) => `/api/preview?path=${encodeURIComponent(path)}`;
export const exitPreviewHref = (path: string) => `/api/preview/exit?path=${encodeURIComponent(path)}`;
