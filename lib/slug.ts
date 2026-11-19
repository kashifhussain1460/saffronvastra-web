// URL slugs for new products and categories. The backend makes the same slug when none is sent
// (backend/src/modules/catalogue/catalogue.service.ts slugFromText); keep the two in step.
export const SLUG_MAX_LENGTH = 75;

// Lower-case, hyphenated slug of at most `max` characters, cut at a word boundary so it never ends mid-word
// (Etsy-length titles used to give 120-character slugs ending in "…statement-laye").
export function slugify(value: string, max = SLUG_MAX_LENGTH): string {
  const full = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (full.length <= max) return full;
  const head = full.slice(0, max + 1);
  const lastBreak = head.lastIndexOf("-");
  return (lastBreak > 0 ? head.slice(0, lastBreak) : full.slice(0, max)).replace(/-+$/g, "");
}
