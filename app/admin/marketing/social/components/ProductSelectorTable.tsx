'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/lib/adminApi';

interface SocialProduct {
  id: string;
  title: string;
  slug: string;
  basePriceMinor: number;
  coverImageUrl: string | null;
  mimeType: string | null;
  categoryName: string | null;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Props {
  selectedIds: string[];
  onToggle: (id: string) => void;
}

export default function ProductSelectorTable({ selectedIds, onToggle }: Props) {
  const [products, setProducts] = useState<SocialProduct[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 20, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);

  // Load categories once
  useEffect(() => {
    api('/api/v1/categories').then((r) => {
      if (r.ok && Array.isArray(r.body?.data)) {
        setCategories(r.body.data);
      }
    });
  }, []);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    const params = new URLSearchParams();
    params.set('page', currentPage.toString());
    if (search.trim()) params.set('search', search.trim());
    if (category) params.set('category', category);

    const result = await api(`/api/v1/admin/social/products?${params.toString()}`);
    if (result.ok && result.body?.items) {
      setProducts(result.body.items);
      setPagination(result.body.pagination ?? { page: 1, pageSize: 20, total: 0, totalPages: 1 });
    } else {
      setProducts([]);
    }
    setIsLoading(false);
  }, [currentPage, search, category]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(fetchProducts, 350);
    return () => clearTimeout(t);
  }, [fetchProducts]);

  const allOnPageSelected =
    products.length > 0 && products.every((p) => selectedIds.includes(p.id));

  const toggleAll = () => {
    if (allOnPageSelected) {
      products.forEach((p) => {
        if (selectedIds.includes(p.id)) onToggle(p.id);
      });
    } else {
      products.forEach((p) => {
        if (!selectedIds.includes(p.id)) onToggle(p.id);
      });
    }
  };

  return (
    <div className="bg-surface rounded-xl border border-line shadow-2xs overflow-hidden">
      {/* Filters */}
      <div className="p-3 border-b border-line flex flex-col sm:flex-row gap-2 items-start sm:items-center">
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search products…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-3 py-2 bg-canvas border border-line rounded-md text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:border-primary"
            aria-label="Search products"
          />
        </div>
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setCurrentPage(1); }}
          className="px-3 py-2 bg-canvas border border-line rounded-md text-xs text-ink focus:outline-none focus:border-primary"
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>
        {selectedIds.length > 0 && (
          <span className="text-xs text-primary font-semibold ml-auto">
            {selectedIds.length} selected
          </span>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-canvas border-b border-line text-ink-muted font-semibold uppercase tracking-wider text-[11px]">
              <th className="p-3 w-10 text-center">
                <input
                  type="checkbox"
                  checked={allOnPageSelected}
                  onChange={toggleAll}
                  disabled={products.length === 0}
                  className="accent-primary w-3.5 h-3.5 cursor-pointer"
                  aria-label="Select all on page"
                />
              </th>
              <th className="p-3">Product</th>
              <th className="p-3">Category</th>
              <th className="p-3">Price</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="p-3 text-center">
                    <div className="w-3.5 h-3.5 bg-line rounded mx-auto" />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-line shrink-0" />
                      <div className="h-3 bg-line rounded w-32" />
                    </div>
                  </td>
                  <td className="p-3"><div className="h-3 bg-line rounded w-20" /></td>
                  <td className="p-3"><div className="h-3 bg-line rounded w-14" /></td>
                </tr>
              ))
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-10 text-center text-ink-muted">
                  No products found
                </td>
              </tr>
            ) : (
              products.map((p) => {
                const isSelected = selectedIds.includes(p.id);
                const price = `₹${Math.round(p.basePriceMinor / 100).toLocaleString('en-IN')}`;
                return (
                  <tr
                    key={p.id}
                    className={`hover:bg-canvas/60 transition-colors cursor-pointer ${isSelected ? 'bg-surface-muted/30' : ''}`}
                    onClick={() => onToggle(p.id)}
                  >
                    <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggle(p.id)}
                        className="accent-primary w-3.5 h-3.5 cursor-pointer"
                        aria-label={`Select ${p.title}`}
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md overflow-hidden relative border border-line shrink-0 bg-canvas">
                          {p.coverImageUrl ? (
                            <Image src={p.coverImageUrl} alt={p.title} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full bg-line" />
                          )}
                        </div>
                        <span className="font-serif font-medium text-ink line-clamp-2">{p.title}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-canvas border border-line rounded-full text-[11px] text-ink-secondary">
                        {p.categoryName ?? '—'}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-ink whitespace-nowrap">{price}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-3 border-t border-line bg-canvas flex items-center justify-between gap-3 text-xs text-ink-muted">
        <span>Page {pagination.page} of {Math.max(1, pagination.totalPages)}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            aria-label="Previous page"
            className="p-1.5 rounded-md border border-line text-ink hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={currentPage >= pagination.totalPages}
            aria-label="Next page"
            className="p-1.5 rounded-md border border-line text-ink hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
