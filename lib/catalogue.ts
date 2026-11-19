// Pure helpers about the category tree, shared by /collections (app/collections/page.tsx) and the sitemap.

export interface CategoryNode {
  id: string;
  slug: string;
  name?: string;
  parentId?: string | null;
}

// The category whose listing is the whole catalogue: the only top-level category, when every other published category
// sits under it (today "Suzani Stitchwork", the parent of jackets, kimonos and waistcoats). Its page lists exactly what
// /collections lists, so it is folded into /collections (canonical there, left out of the sitemap) instead of
// competing with it as a duplicate. undefined when the shop has several top-level categories.
export function catalogueRoot<T extends CategoryNode>(categories: T[] | null | undefined): T | undefined {
  const list = categories || [];
  const roots = list.filter((c) => !c.parentId);
  if (roots.length !== 1) return undefined;
  const root = roots[0];
  const byId = new Map(list.map((c) => [c.id, c]));
  const underRoot = (c: T): boolean => {
    const seen = new Set<string>();
    let node: T | undefined = c;
    while (node && node.parentId && !seen.has(node.id)) {
      seen.add(node.id);
      if (node.parentId === root.id) return true;
      node = byId.get(node.parentId);
    }
    return false;
  };
  return list.every((c) => c.id === root.id || underRoot(c)) ? root : undefined;
}

// Document titles of the category landing pages, written around what people in India search for (Google Ads Keyword
// Planner, India, Nov 2025 – Oct 2026; Google autocomplete; the pages Google ranks for each term are category pages):
//   suzani jacket 1K–10K a month (+ "for men" / "for women"); kimono jacket for women / for men 100–1K each;
//   embroidered waistcoat for men 100–1K, for women 100–1K. The brand suffix is added by the root title template.
// Keyed by slug, so renaming a category in the admin does not change its search title.
const CATEGORY_PAGE_TITLES: Record<string, string> = {
  "suzani-jackets": "Suzani Jackets for Men & Women",
  "suzani-kimonos": "Embroidered Kimono Jackets for Women & Men",
  "suzani-waists": "Embroidered Waistcoats for Men & Women",
};

// Document title of a category landing page: the researched title above, otherwise the category name plus how the
// pieces are made ("Hand Embroidered …"). Names that already say "embroidered" are used as they are.
export function categoryPageTitle(name: string, slug?: string): string {
  const researched = slug ? CATEGORY_PAGE_TITLES[slug] : undefined;
  if (researched) return researched;
  return /embroider/i.test(name) ? name : `Hand Embroidered ${name}`;
}
