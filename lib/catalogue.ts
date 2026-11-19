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

// Document title of a category landing page: the plain category name plus how the pieces are made, which is what
// shoppers search for ("hand embroidered suzani jacket"). Names that already say it are used as they are.
export function categoryPageTitle(name: string): string {
  return /embroider/i.test(name) ? name : `Hand Embroidered ${name}`;
}
