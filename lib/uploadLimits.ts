// Largest image the admin screens accept. A normal server takes up to 15 MB; on Vercel a request body is limited to
// 4.5 MB, so the Vercel project sets NEXT_PUBLIC_MAX_UPLOAD_MB=4 (the API enforces the same limit).
const configured = Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_MB);
export const MAX_UPLOAD_MB = Number.isFinite(configured) && configured > 0 ? configured : 15;
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;
export const MAX_UPLOAD_LABEL = `${MAX_UPLOAD_MB} MB`;
