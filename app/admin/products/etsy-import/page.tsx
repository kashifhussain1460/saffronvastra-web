"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  ChevronRight,
  ChevronLeft,
  Search,
  Filter,
  Download,
  Info,
  ExternalLink,
  RefreshCw,
  Eye,
  X,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Package,
  Sliders,
  Tag,
  Check,
} from "lucide-react";

interface VariationGroup {
  type: string;
  name: string;
  rawValues: string;
  values: string[];
}

interface ImageItem {
  url: string;
  order: number;
  isCover: boolean;
  accessible?: boolean;
}

interface ProductPreviewItem {
  rowIndex: number;
  title: string;
  slug: string;
  description: string;
  price: number;
  basePriceMinor: number;
  currency: string;
  quantity: number;
  sku: string;
  tags: string[];
  materials: string[];
  images: ImageItem[];
  variations: VariationGroup[];
  hasVariations: boolean;
  validation: {
    isValid: boolean;
    status: "valid" | "warning" | "error";
    errors: string[];
    warnings: string[];
    isDuplicate: boolean;
    duplicateReason?: string;
    existingProductId?: string;
  };
  rawRow: Record<string, string>;
}

interface PreviewStats {
  totalRows: number;
  validProducts: number;
  invalidRows: number;
  warningsCount: number;
  duplicateRecords: number;
  missingTitles: number;
  missingPrices: number;
  missingImages: number;
  productsWithVariations: number;
  productsWithSku: number;
}

interface PreviewData {
  importSessionId: string;
  filename: string;
  fileSizeBytes: number;
  stats: PreviewStats;
  products: ProductPreviewItem[];
}

interface ImportItemResult {
  rowIndex: number;
  title: string;
  sku: string;
  slug: string;
  productId?: string;
  status: "created" | "updated" | "skipped" | "failed";
  reason?: string;
  imageCount: number;
  variantCount: number;
}

interface ImportSummary {
  importId: string;
  filename: string;
  importedAt: string;
  importedByName: string;
  duplicatePolicy: string;
  totalRecords: number;
  successfulImports: number;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  failedCount: number;
  status: "completed" | "partial" | "failed";
  results: ImportItemResult[];
  failedRows: Array<{
    rowIndex: number;
    title: string;
    sku: string;
    reason: string;
  }>;
}

interface HistoryItem {
  importId: string;
  filename: string;
  importedAt: string;
  importedByName?: string;
  totalRecords: number;
  successfulImports: number;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  failedCount: number;
  duplicatePolicy: string;
  status: string;
}

export default function EtsyImportPage() {
  const [activeTab, setActiveTab] = useState<"import" | "history">("import");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);

  // Filters for preview table
  const [statusFilter, setStatusFilter] = useState<"all" | "valid" | "warning" | "error" | "duplicates">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Selected product detail modal
  const [selectedProduct, setSelectedProduct] = useState<ProductPreviewItem | null>(null);

  // Import options & execution state
  const [duplicatePolicy, setDuplicatePolicy] = useState<"skip" | "update" | "create_new">("skip");
  const [importStatusValue, setImportStatusValue] = useState<"Active" | "Draft">("Active");
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);

  // History tab state
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch history when history tab is opened
  useEffect(() => {
    if (activeTab === "history") {
      fetchHistory();
    }
  }, [activeTab]);

  const fetchHistory = async () => {
    setIsHistoryLoading(true);
    try {
      const res = await fetch("/api/v1/admin/products/etsy-import/history", {
        credentials: "include",
      });
      if (res.ok) {
        const json = await res.json();
        setHistoryList(json.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch import history:", err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    setPreviewError("");
    setImportError("");
    setImportSummary(null);
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setPreviewError("Please select a valid .csv file.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setPreviewError("File size exceeds maximum allowed limit (15 MB).");
      return;
    }
    setSelectedFile(file);
  };

  const handleResetFile = () => {
    setSelectedFile(null);
    setPreviewData(null);
    setPreviewError("");
    setImportError("");
    setImportSummary(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleGeneratePreview = async () => {
    if (!selectedFile) return;

    setIsPreviewLoading(true);
    setPreviewError("");
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/v1/admin/products/etsy-import/preview", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || "Failed to parse CSV preview");
      }

      setPreviewData(json.data);
      setCurrentPage(1);
    } catch (err: any) {
      setPreviewError(err.message || "An unexpected error occurred while parsing the CSV file.");
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!previewData) return;

    setIsImporting(true);
    setImportError("");
    try {
      const res = await fetch("/api/v1/admin/products/etsy-import/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          importSessionId: previewData.importSessionId,
          duplicatePolicy,
          status: importStatusValue,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || "Import execution failed");
      }

      setImportSummary(json.data);
      // Refresh history in background
      fetchHistory();
    } catch (err: any) {
      setImportError(err.message || "Failed to execute product import.");
    } finally {
      setIsImporting(false);
    }
  };

  // Filtered products list for preview table
  const filteredProducts = (previewData?.products || []).filter((p) => {
    // Status filter
    if (statusFilter === "valid" && p.validation.status !== "valid") return false;
    if (statusFilter === "warning" && p.validation.status !== "warning") return false;
    if (statusFilter === "error" && p.validation.status !== "error") return false;
    if (statusFilter === "duplicates" && !p.validation.isDuplicate) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchSku = p.sku.toLowerCase().includes(q);
      const matchTags = p.tags.some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchSku && !matchTags) return false;
    }

    return true;
  });

  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans text-ink">
      {/* 1. HEADER & BREADCRUMB */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-ink-muted mb-1.5">
            <Link href="/admin" className="hover:text-ink transition-colors">
              Admin
            </Link>
            <ChevronRight className="w-3 h-3 text-line" />
            <Link href="/admin/products" className="hover:text-ink transition-colors">
              Products
            </Link>
            <ChevronRight className="w-3 h-3 text-line" />
            <span className="text-highlight font-medium">Etsy CSV Import</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-serif text-ink tracking-tight flex items-center gap-2.5">
            <span>Etsy Product CSV Import</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-accent/15 text-accent font-sans font-semibold">
              Atelier Migration
            </span>
          </h1>
          <p className="text-xs text-ink-muted mt-1 max-w-2xl">
            Import products with full descriptions, pricing, tags, materials, all 10 images, and variations.
            Imported products remain completely independent of categories and subcategories.
          </p>
        </div>

        {/* Tab switch buttons */}
        <div className="flex items-center gap-2 p-1 bg-surface border border-line rounded-lg self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("import")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === "import"
                ? "bg-primary text-on-primary shadow-xs"
                : "text-ink-secondary hover:text-ink hover:bg-canvas"
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>New Import</span>
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === "history"
                ? "bg-primary text-on-primary shadow-xs"
                : "text-ink-secondary hover:text-ink hover:bg-canvas"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Import History</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN CONTENT AREA */}
      {activeTab === "import" && (
        <div className="space-y-6">
          {/* ========================================================================= */}
          {/* SECTION A: UPLOAD SECTION                                                */}
          {/* ========================================================================= */}
          {!previewData && (
            <div className="bg-surface border border-line rounded-xl p-6 shadow-2xs space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold text-ink flex items-center gap-2">
                    <FileText className="w-4 h-4 text-accent" />
                    <span>Upload Etsy Product CSV Export</span>
                  </h2>
                  <p className="text-xs text-ink-muted mt-0.5">
                    Select your Etsy product catalog download file (e.g. <code className="text-highlight bg-canvas px-1.5 py-0.5 rounded">EtsyListingsDownload.csv</code>).
                  </p>
                </div>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all flex flex-col items-center justify-center gap-3 cursor-pointer ${
                  isDragging
                    ? "border-accent bg-accent/5 scale-[1.005]"
                    : selectedFile
                    ? "border-primary/50 bg-primary/5"
                    : "border-line hover:border-accent/40 bg-canvas/50 hover:bg-canvas"
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileChange}
                />

                <div className="w-14 h-14 rounded-full bg-surface border border-line flex items-center justify-center text-accent shadow-xs">
                  <Upload className="w-6 h-6 animate-pulse" />
                </div>

                {selectedFile ? (
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-ink">{selectedFile.name}</p>
                    <p className="text-xs text-ink-muted">
                      {(selectedFile.size / 1024).toFixed(1)} KB • CSV Document
                    </p>
                    <p className="text-xs text-highlight font-medium pt-1">
                      File verified and ready for server-side preview
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-ink">
                      Drag & drop your Etsy CSV file here, or{" "}
                      <span className="text-accent underline font-bold">browse from your computer</span>
                    </p>
                    <p className="text-xs text-ink-muted">
                      Supports RFC-4180 standard CSV, UTF-8 BOM, multiline descriptions, and up to 15 MB.
                    </p>
                  </div>
                )}
              </div>

              {/* Actions and Error Banner */}
              {previewError && (
                <div role="alert" className="p-3.5 bg-error-bg border border-error-line text-error rounded-lg text-xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{previewError}</span>
                  </div>
                  <button onClick={() => setPreviewError("")} className="font-bold">✕</button>
                </div>
              )}

              {selectedFile && (
                <div className="flex items-center justify-between pt-2 border-t border-line">
                  <button
                    type="button"
                    onClick={handleResetFile}
                    className="text-xs text-ink-muted hover:text-error transition-colors flex items-center gap-1.5"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Clear and choose another file</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleGeneratePreview}
                    disabled={isPreviewLoading}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-lg text-xs font-semibold hover:bg-primary-hover transition-colors shadow-sm disabled:opacity-50"
                  >
                    {isPreviewLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Parsing & Validating CSV...</span>
                      </>
                    ) : (
                      <>
                        <span>Generate Product Preview</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Supported Columns Informational Grid */}
              <div className="bg-canvas border border-line rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-ink">
                  <Info className="w-4 h-4 text-accent" />
                  <span>Supported Etsy Catalog Columns (27 Headers Detected)</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-ink-secondary">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-ink block">Product Details</span>
                    <span className="block text-ink-muted">TITLE, DESCRIPTION</span>
                    <span className="block text-ink-muted">PRICE, CURRENCY_CODE</span>
                    <span className="block text-ink-muted">QUANTITY, SKU</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-semibold text-ink block">Taxonomy & Materials</span>
                    <span className="block text-ink-muted">TAGS (Focus keywords)</span>
                    <span className="block text-ink-muted">MATERIALS (Fabric & trims)</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-semibold text-ink block">Image Gallery</span>
                    <span className="block text-ink-muted">IMAGE1 through IMAGE10</span>
                    <span className="block text-ink-muted">Preserves order & primary cover</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-semibold text-ink block">Variations (1, 2, 3)</span>
                    <span className="block text-ink-muted">VARIATION 1 TYPE, NAME, VALUES</span>
                    <span className="block text-ink-muted">VARIATION 2 TYPE, NAME, VALUES</span>
                    <span className="block text-ink-muted">VARIATION 3 TYPE, NAME, VALUES</span>
                  </div>
                </div>
                <div className="p-2.5 bg-accent/10 border border-accent/20 rounded-md text-[11px] text-accent font-medium flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>
                    Strict Requirement: No category or subcategory is linked, assigned, or inferred. Products are imported as category-independent atelier listings.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION B: CSV PREVIEW & METRICS                                         */}
          {/* ========================================================================= */}
          {previewData && !importSummary && (
            <div className="space-y-6">
              {/* File Pill Banner & Re-upload button */}
              <div className="bg-surface border border-line rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-ink">{previewData.filename}</p>
                    <p className="text-[11px] text-ink-muted">
                      {(previewData.fileSizeBytes / 1024).toFixed(1)} KB • {previewData.stats.totalRows} Products Parsed • Ready for Import
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleResetFile}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-canvas border border-line text-xs font-semibold text-ink hover:bg-ink/5 transition-colors self-start sm:self-auto"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Upload Different CSV</span>
                </button>
              </div>

              {/* Statistics Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                <div className="p-4 bg-surface border border-line rounded-xl space-y-1 shadow-2xs">
                  <span className="text-[11px] text-ink-muted uppercase tracking-wider block">Total Rows</span>
                  <span className="text-xl font-bold text-ink">{previewData.stats.totalRows}</span>
                </div>

                <div className="p-4 bg-surface border border-success-line/60 rounded-xl space-y-1 shadow-2xs bg-success-bg/10">
                  <span className="text-[11px] text-success uppercase tracking-wider block font-medium">Valid Products</span>
                  <span className="text-xl font-bold text-success">{previewData.stats.validProducts}</span>
                </div>

                <div className="p-4 bg-surface border border-warning-line/60 rounded-xl space-y-1 shadow-2xs bg-warning-bg/10">
                  <span className="text-[11px] text-warning uppercase tracking-wider block font-medium">Warnings</span>
                  <span className="text-xl font-bold text-warning">{previewData.stats.warningsCount}</span>
                </div>

                <div className="p-4 bg-surface border border-line rounded-xl space-y-1 shadow-2xs">
                  <span className="text-[11px] text-ink-muted uppercase tracking-wider block">Duplicates</span>
                  <span className="text-xl font-bold text-ink">{previewData.stats.duplicateRecords}</span>
                </div>

                <div className="p-4 bg-surface border border-line rounded-xl space-y-1 shadow-2xs">
                  <span className="text-[11px] text-ink-muted uppercase tracking-wider block">With Variations</span>
                  <span className="text-xl font-bold text-accent">{previewData.stats.productsWithVariations}</span>
                </div>

                <div className="p-4 bg-surface border border-line rounded-xl space-y-1 shadow-2xs">
                  <span className="text-[11px] text-ink-muted uppercase tracking-wider block">Invalid Rows</span>
                  <span className={`text-xl font-bold ${previewData.stats.invalidRows > 0 ? "text-error" : "text-ink"}`}>
                    {previewData.stats.invalidRows}
                  </span>
                </div>
              </div>

              {/* Preview Table Container */}
              <div className="bg-surface border border-line rounded-xl shadow-2xs overflow-hidden space-y-4 p-5">
                {/* Search & Filter Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-line">
                  {/* Status Filter Tabs */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => { setStatusFilter("all"); setCurrentPage(1); }}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                        statusFilter === "all" ? "bg-primary text-on-primary" : "bg-canvas text-ink-secondary hover:text-ink"
                      }`}
                    >
                      All ({previewData.products.length})
                    </button>
                    <button
                      onClick={() => { setStatusFilter("valid"); setCurrentPage(1); }}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                        statusFilter === "valid" ? "bg-success text-on-primary" : "bg-canvas text-ink-secondary hover:text-ink"
                      }`}
                    >
                      Valid ({previewData.stats.validProducts})
                    </button>
                    <button
                      onClick={() => { setStatusFilter("warning"); setCurrentPage(1); }}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                        statusFilter === "warning" ? "bg-warning text-on-primary" : "bg-canvas text-ink-secondary hover:text-ink"
                      }`}
                    >
                      Warnings ({previewData.stats.warningsCount})
                    </button>
                    {previewData.stats.duplicateRecords > 0 && (
                      <button
                        onClick={() => { setStatusFilter("duplicates"); setCurrentPage(1); }}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                          statusFilter === "duplicates" ? "bg-accent text-on-primary" : "bg-canvas text-ink-secondary hover:text-ink"
                        }`}
                      >
                        Duplicates ({previewData.stats.duplicateRecords})
                      </button>
                    )}
                    {previewData.stats.invalidRows > 0 && (
                      <button
                        onClick={() => { setStatusFilter("error"); setCurrentPage(1); }}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                          statusFilter === "error" ? "bg-error text-on-primary" : "bg-canvas text-ink-secondary hover:text-ink"
                        }`}
                      >
                        Invalid ({previewData.stats.invalidRows})
                      </button>
                    )}
                  </div>

                  {/* Search Bar */}
                  <div className="relative min-w-[220px]">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                    <input
                      type="text"
                      placeholder="Search title, SKU or tag..."
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                      className="w-full pl-8 pr-3 py-1.5 bg-canvas border border-line rounded-lg text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-line text-[11px] uppercase tracking-wider text-ink-muted bg-canvas/40">
                        <th className="py-2.5 px-3 w-12 font-semibold">#</th>
                        <th className="py-2.5 px-3 font-semibold">Product Title</th>
                        <th className="py-2.5 px-3 font-semibold">Price</th>
                        <th className="py-2.5 px-3 font-semibold">SKU</th>
                        <th className="py-2.5 px-3 font-semibold">Qty</th>
                        <th className="py-2.5 px-3 font-semibold">Images</th>
                        <th className="py-2.5 px-3 font-semibold">Variations</th>
                        <th className="py-2.5 px-3 font-semibold">Validation</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line/60">
                      {paginatedProducts.map((p) => (
                        <tr key={p.rowIndex} className="hover:bg-canvas/50 transition-colors">
                          <td className="py-3 px-3 text-ink-muted font-mono">{p.rowIndex}</td>
                          <td className="py-3 px-3">
                            <div className="font-semibold text-ink line-clamp-1 max-w-[280px]" title={p.title}>
                              {p.title || <span className="text-error italic">Untitled Listing</span>}
                            </div>
                            <div className="text-[10px] text-ink-muted flex items-center gap-1 mt-0.5">
                              <span>Slug: {p.slug}</span>
                              <span>•</span>
                              <span className="text-highlight">Category: None (Unassigned)</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-mono font-medium text-ink">
                            {p.currency} {p.price.toLocaleString("en-IN")}
                          </td>
                          <td className="py-3 px-3 font-mono text-ink-secondary text-[11px]">
                            {p.sku || <span className="text-ink-muted italic">auto-generate</span>}
                          </td>
                          <td className="py-3 px-3 font-mono text-ink">{p.quantity}</td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 bg-canvas border border-line rounded-md text-[11px] font-medium text-ink">
                              {p.images.length} images
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            {p.hasVariations ? (
                              <span className="px-2 py-0.5 bg-accent/10 border border-accent/20 rounded-md text-[11px] font-semibold text-accent">
                                {p.variations.map((v) => v.name).join(", ")}
                              </span>
                            ) : (
                              <span className="text-ink-muted text-[11px]">Standard</span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            {p.validation.status === "valid" && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-success font-semibold px-2 py-0.5 bg-success-bg border border-success-line rounded-full">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Valid</span>
                              </span>
                            )}
                            {p.validation.status === "warning" && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-warning font-semibold px-2 py-0.5 bg-warning-bg border border-warning-line rounded-full">
                                <AlertTriangle className="w-3 h-3" />
                                <span>
                                  {p.validation.isDuplicate ? "Duplicate" : "Warning"}
                                </span>
                              </span>
                            )}
                            {p.validation.status === "error" && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-error font-semibold px-2 py-0.5 bg-error-bg border border-error-line rounded-full">
                                <XCircle className="w-3 h-3" />
                                <span>Error</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedProduct(p)}
                              className="px-2.5 py-1 bg-canvas hover:bg-surface border border-line rounded-md text-[11px] font-semibold text-ink transition-colors shadow-2xs inline-flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3 text-accent" />
                              <span>Inspect</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between pt-3 border-t border-line text-xs text-ink-muted">
                  <span>
                    Showing {Math.min((currentPage - 1) * pageSize + 1, filteredProducts.length)} to{" "}
                    {Math.min(currentPage * pageSize, filteredProducts.length)} of {filteredProducts.length} items
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="p-1.5 bg-canvas border border-line rounded-md disabled:opacity-30 hover:bg-surface transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4 text-ink" />
                    </button>
                    <span className="px-2 py-1 font-mono text-ink font-semibold">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="p-1.5 bg-canvas border border-line rounded-md disabled:opacity-30 hover:bg-surface transition-colors"
                    >
                      <ChevronRight className="w-4 h-4 text-ink" />
                    </button>
                  </div>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* SECTION D: IMPORT CONFIRMATION & POLICY                                  */}
              {/* ========================================================================= */}
              <div className="bg-surface border border-line rounded-xl p-6 shadow-2xs space-y-6">
                <div>
                  <h3 className="text-base font-semibold text-ink flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-accent" />
                    <span>Import Settings & Confirmation</span>
                  </h3>
                  <p className="text-xs text-ink-muted mt-0.5">
                    Configure duplicate handling policy and publish options before initiating catalogue insertion.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Duplicate Policy Radio Options */}
                  <div className="space-y-3 bg-canvas p-4 rounded-xl border border-line">
                    <label className="text-xs font-semibold text-ink block">
                      Duplicate Handling Policy
                    </label>
                    <div className="space-y-2 text-xs">
                      <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-surface transition-colors cursor-pointer">
                        <input
                          type="radio"
                          name="duplicatePolicy"
                          value="skip"
                          checked={duplicatePolicy === "skip"}
                          onChange={() => setDuplicatePolicy("skip")}
                          className="mt-0.5 text-accent focus:ring-accent"
                        />
                        <div>
                          <span className="font-semibold text-ink block">Skip existing products (Recommended)</span>
                          <span className="text-[11px] text-ink-muted">
                            Preserves existing products untouched. Any matching SKU, slug or primary image is safely skipped.
                          </span>
                        </div>
                      </label>

                      <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-surface transition-colors cursor-pointer">
                        <input
                          type="radio"
                          name="duplicatePolicy"
                          value="update"
                          checked={duplicatePolicy === "update"}
                          onChange={() => setDuplicatePolicy("update")}
                          className="mt-0.5 text-accent focus:ring-accent"
                        />
                        <div>
                          <span className="font-semibold text-ink block">Update existing products</span>
                          <span className="text-[11px] text-ink-muted">
                            Refreshes matching existing products with newest pricing, description, images, and variation options.
                          </span>
                        </div>
                      </label>

                      <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-surface transition-colors cursor-pointer">
                        <input
                          type="radio"
                          name="duplicatePolicy"
                          value="create_new"
                          checked={duplicatePolicy === "create_new"}
                          onChange={() => setDuplicatePolicy("create_new")}
                          className="mt-0.5 text-accent focus:ring-accent"
                        />
                        <div>
                          <span className="font-semibold text-ink block">Import all as new products</span>
                          <span className="text-[11px] text-ink-muted">
                            Always inserts fresh product records, automatically assigning unique non-colliding slugs and SKUs.
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Initial Status & Confirmation Notice */}
                  <div className="space-y-3 bg-canvas p-4 rounded-xl border border-line flex flex-col justify-between">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-ink block">
                        Initial Catalogue Status
                      </label>
                      <div className="flex items-center gap-4 text-xs">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="initialStatus"
                            value="Active"
                            checked={importStatusValue === "Active"}
                            onChange={() => setImportStatusValue("Active")}
                            className="text-accent focus:ring-accent"
                          />
                          <span className="text-ink font-medium">Publish as Active (Storefront Ready)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="initialStatus"
                            value="Draft"
                            checked={importStatusValue === "Draft"}
                            onChange={() => setImportStatusValue("Draft")}
                            className="text-accent focus:ring-accent"
                          />
                          <span className="text-ink font-medium">Save as Draft (Atelier Review)</span>
                        </label>
                      </div>
                    </div>

                    <div className="p-3 bg-highlight/10 border border-highlight/20 rounded-lg text-xs space-y-1">
                      <span className="font-semibold text-highlight block">
                        Strict Independence Guarantee:
                      </span>
                      <p className="text-[11px] text-ink-secondary">
                        Zero categories or subcategories will be linked or assigned. Products will appear cleanly in Product Management with category shown as Unassigned/General.
                      </p>
                    </div>
                  </div>
                </div>

                {importError && (
                  <div role="alert" className="p-3.5 bg-error-bg border border-error-line text-error rounded-lg text-xs flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{importError}</span>
                    </div>
                    <button onClick={() => setImportError("")} className="font-bold">✕</button>
                  </div>
                )}

                {/* Import Confirmation CTA */}
                <div className="flex items-center justify-between pt-4 border-t border-line">
                  <div className="text-xs text-ink-muted">
                    Ready to process: <strong className="text-ink">{previewData.stats.validProducts} products</strong> will be imported into PostgreSQL.
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleResetFile}
                      disabled={isImporting}
                      className="px-4 py-2 border border-line rounded-lg text-xs font-semibold text-ink-secondary hover:text-ink hover:bg-canvas transition-colors"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={handleConfirmImport}
                      disabled={isImporting || previewData.stats.validProducts === 0}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-on-primary rounded-lg text-xs font-semibold hover:bg-primary-hover transition-colors shadow-sm disabled:opacity-50"
                    >
                      {isImporting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Importing Products into Database...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Confirm & Import Products</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION E: IMPORT RESULTS SUMMARY                                        */}
          {/* ========================================================================= */}
          {importSummary && (
            <div className="bg-surface border border-line rounded-xl p-6 shadow-2xs space-y-6 animate-in fade-in">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-success" />
                    <h2 className="text-lg font-serif text-ink font-bold">
                      Etsy Product Import Complete!
                    </h2>
                  </div>
                  <p className="text-xs text-ink-muted">
                    Batch <code className="font-mono text-highlight bg-canvas px-1.5 py-0.5 rounded">{importSummary.importId.slice(0, 8)}</code> processed on {new Date(importSummary.importedAt).toLocaleString("en-IN")}.
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <Link
                    href="/admin/products"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary rounded-lg text-xs font-semibold hover:bg-primary-hover transition-colors shadow-sm"
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>View In Product Management</span>
                  </Link>

                  <button
                    type="button"
                    onClick={handleResetFile}
                    className="px-3.5 py-2 bg-canvas border border-line rounded-lg text-xs font-semibold text-ink hover:bg-surface transition-colors"
                  >
                    Import Another File
                  </button>
                </div>
              </div>

              {/* Outcome KPI Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-canvas rounded-xl border border-line space-y-1">
                  <span className="text-[11px] text-ink-muted uppercase tracking-wider block">Total Processed</span>
                  <span className="text-2xl font-bold text-ink">{importSummary.totalRecords}</span>
                </div>

                <div className="p-4 bg-success-bg/15 rounded-xl border border-success-line space-y-1">
                  <span className="text-[11px] text-success uppercase tracking-wider block font-semibold">Created New</span>
                  <span className="text-2xl font-bold text-success">{importSummary.createdCount}</span>
                </div>

                <div className="p-4 bg-canvas rounded-xl border border-line space-y-1">
                  <span className="text-[11px] text-ink-muted uppercase tracking-wider block">Skipped (Duplicates)</span>
                  <span className="text-2xl font-bold text-ink">{importSummary.skippedCount}</span>
                </div>

                <div className="p-4 bg-error-bg/15 rounded-xl border border-error-line space-y-1">
                  <span className="text-[11px] text-error uppercase tracking-wider block font-semibold">Failed</span>
                  <span className="text-2xl font-bold text-error">{importSummary.failedCount}</span>
                </div>
              </div>

              {/* Failed Rows Export Download Button (if any failures) */}
              {importSummary.failedCount > 0 && (
                <div className="p-4 bg-error-bg/20 border border-error-line rounded-xl flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-error">
                      {importSummary.failedCount} records could not be imported
                    </p>
                    <p className="text-[11px] text-ink-muted">
                      Download the error report CSV containing the exact row data with rejection reasons.
                    </p>
                  </div>

                  <a
                    href={`/api/v1/admin/products/etsy-import/history/${importSummary.importId}/failed-csv`}
                    download
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-error text-on-primary rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Failed Records CSV</span>
                  </a>
                </div>
              )}

              {/* Imported items preview table */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-semibold text-ink uppercase tracking-wider">
                  Imported Listing Results ({importSummary.results.length} items)
                </h4>
                <div className="max-h-72 overflow-y-auto border border-line rounded-lg divide-y divide-line/60">
                  {importSummary.results.map((res, i) => (
                    <div key={i} className="p-2.5 text-xs flex items-center justify-between gap-3 hover:bg-canvas/50">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-ink-muted text-[11px] w-6">#{res.rowIndex}</span>
                        <div>
                          <p className="font-semibold text-ink line-clamp-1">{res.title}</p>
                          <p className="text-[10px] text-ink-muted">
                            SKU: {res.sku || "auto-generated"} • {res.imageCount} images • {res.variantCount} variants
                          </p>
                        </div>
                      </div>

                      <div>
                        {res.status === "created" && (
                          <span className="text-[11px] text-success font-semibold px-2 py-0.5 bg-success-bg border border-success-line rounded-full">
                            Created
                          </span>
                        )}
                        {res.status === "updated" && (
                          <span className="text-[11px] text-accent font-semibold px-2 py-0.5 bg-accent/10 border border-accent/20 rounded-full">
                            Updated
                          </span>
                        )}
                        {res.status === "skipped" && (
                          <span className="text-[11px] text-ink-muted font-semibold px-2 py-0.5 bg-canvas border border-line rounded-full" title={res.reason}>
                            Skipped
                          </span>
                        )}
                        {res.status === "failed" && (
                          <span className="text-[11px] text-error font-semibold px-2 py-0.5 bg-error-bg border border-error-line rounded-full" title={res.reason}>
                            Failed
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION F: IMPORT HISTORY & ERROR REPORTS TAB                             */}
      {/* ========================================================================= */}
      {activeTab === "history" && (
        <div className="bg-surface border border-line rounded-xl p-6 shadow-2xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-ink">Etsy Import History</h2>
              <p className="text-xs text-ink-muted mt-0.5">
                Audit trail of previous product import batches executed by atelier administrators.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchHistory}
              disabled={isHistoryLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-canvas border border-line rounded-lg text-xs font-semibold text-ink hover:bg-surface transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isHistoryLoading ? "animate-spin" : ""}`} />
              <span>Refresh History</span>
            </button>
          </div>

          {isHistoryLoading ? (
            <div className="p-12 text-center text-xs text-ink-muted flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-accent" />
              <span>Loading past import batches...</span>
            </div>
          ) : historyList.length === 0 ? (
            <div className="p-12 text-center text-xs text-ink-muted bg-canvas rounded-xl border border-dashed border-line">
              <Clock className="w-6 h-6 mx-auto mb-2 text-ink-muted/50" />
              <p className="font-semibold text-ink">No import batches recorded yet</p>
              <p className="mt-1">When an administrator imports an Etsy CSV, audit records and summaries will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-line text-[11px] uppercase tracking-wider text-ink-muted bg-canvas/40">
                    <th className="py-2.5 px-3 font-semibold">Import ID</th>
                    <th className="py-2.5 px-3 font-semibold">File Name</th>
                    <th className="py-2.5 px-3 font-semibold">Date & Time</th>
                    <th className="py-2.5 px-3 font-semibold">Admin</th>
                    <th className="py-2.5 px-3 font-semibold">Total</th>
                    <th className="py-2.5 px-3 font-semibold">Created</th>
                    <th className="py-2.5 px-3 font-semibold">Skipped</th>
                    <th className="py-2.5 px-3 font-semibold">Failed</th>
                    <th className="py-2.5 px-3 font-semibold">Status</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Report</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {historyList.map((h) => (
                    <tr key={h.importId} className="hover:bg-canvas/50 transition-colors">
                      <td className="py-3 px-3 font-mono text-highlight text-[11px]">{h.importId.slice(0, 8)}</td>
                      <td className="py-3 px-3 font-semibold text-ink">{h.filename}</td>
                      <td className="py-3 px-3 text-ink-muted">{new Date(h.importedAt).toLocaleString("en-IN")}</td>
                      <td className="py-3 px-3 text-ink">{h.importedByName || "Administrator"}</td>
                      <td className="py-3 px-3 font-mono font-medium text-ink">{h.totalRecords}</td>
                      <td className="py-3 px-3 font-mono text-success font-semibold">{h.createdCount}</td>
                      <td className="py-3 px-3 font-mono text-ink-muted">{h.skippedCount}</td>
                      <td className="py-3 px-3 font-mono text-error font-semibold">{h.failedCount}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          h.status === "completed" || h.status === "success"
                            ? "bg-success-bg text-success border border-success-line"
                            : h.status === "partial"
                            ? "bg-warning-bg text-warning border border-warning-line"
                            : "bg-error-bg text-error border border-error-line"
                        }`}>
                          {h.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {h.failedCount > 0 ? (
                          <a
                            href={`/api/v1/admin/products/etsy-import/history/${h.importId}/failed-csv`}
                            download
                            className="inline-flex items-center gap-1 text-[11px] text-error hover:underline font-semibold"
                          >
                            <Download className="w-3 h-3" />
                            <span>Errors CSV</span>
                          </a>
                        ) : (
                          <span className="text-[11px] text-success font-medium">100% Success</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION C: PRODUCT DETAIL PREVIEW MODAL / DRAWER                          */}
      {/* ========================================================================= */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-surface border border-line rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-line flex items-center justify-between shrink-0 bg-canvas/40">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase tracking-wider text-highlight font-semibold block">
                  Row #{selectedProduct.rowIndex} • CSV Product Inspection
                </span>
                <h3 className="text-base font-serif font-bold text-ink line-clamp-1">
                  {selectedProduct.title}
                </h3>
              </div>

              <button
                onClick={() => setSelectedProduct(null)}
                className="p-1.5 rounded-lg hover:bg-ink/5 text-ink-muted hover:text-ink transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Category Independence Notice */}
              <div className="p-3 bg-accent/10 border border-accent/20 rounded-xl text-accent font-medium flex items-center gap-2.5">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>
                  <strong>Category Rule:</strong> This product will be created with no Category and no Subcategory assigned (<code className="bg-canvas px-1.5 py-0.5 rounded font-mono text-[11px]">categoryId: null</code>).
                </span>
              </div>

              {/* Price & Primary Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-canvas rounded-lg border border-line">
                  <span className="text-[10px] uppercase text-ink-muted block font-semibold">Price</span>
                  <span className="text-sm font-bold text-ink font-mono">
                    {selectedProduct.currency} {selectedProduct.price.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="p-3 bg-canvas rounded-lg border border-line">
                  <span className="text-[10px] uppercase text-ink-muted block font-semibold">Quantity</span>
                  <span className="text-sm font-bold text-ink font-mono">{selectedProduct.quantity}</span>
                </div>

                <div className="p-3 bg-canvas rounded-lg border border-line">
                  <span className="text-[10px] uppercase text-ink-muted block font-semibold">SKU</span>
                  <span className="text-sm font-bold text-ink font-mono">
                    {selectedProduct.sku || <span className="text-ink-muted italic text-xs">Generated</span>}
                  </span>
                </div>

                <div className="p-3 bg-canvas rounded-lg border border-line">
                  <span className="text-[10px] uppercase text-ink-muted block font-semibold">Slug</span>
                  <span className="text-xs font-semibold text-highlight truncate block">{selectedProduct.slug}</span>
                </div>
              </div>

              {/* Full Description with line breaks preserved */}
              <div className="space-y-1.5">
                <span className="font-semibold text-ink uppercase text-[11px] tracking-wider block">
                  Complete Description (Preserves Formatting)
                </span>
                <div className="p-4 bg-canvas rounded-xl border border-line whitespace-pre-line text-ink-secondary leading-relaxed max-h-48 overflow-y-auto font-sans">
                  {selectedProduct.description || <span className="italic text-ink-muted">No description provided</span>}
                </div>
              </div>

              {/* Variations Groups */}
              <div className="space-y-2">
                <span className="font-semibold text-ink uppercase text-[11px] tracking-wider block">
                  Product Variations ({selectedProduct.variations.length} Groups)
                </span>
                {selectedProduct.variations.length === 0 ? (
                  <p className="text-ink-muted text-xs italic">No variation groups specified in CSV (will create default "Free Size" variant).</p>
                ) : (
                  <div className="space-y-2">
                    {selectedProduct.variations.map((v, i) => (
                      <div key={i} className="p-3 bg-canvas rounded-lg border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="font-semibold text-ink">{v.name}</span>
                          <span className="text-ink-muted ml-2 text-[11px]">({v.type || "Custom Property"})</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {v.values.map((val, vi) => (
                            <span key={vi} className="px-2 py-0.5 bg-surface border border-line rounded-md text-[11px] font-semibold text-accent">
                              {val}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tags & Materials */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <span className="font-semibold text-ink uppercase text-[11px] tracking-wider block">
                    Product Tags ({selectedProduct.tags.length})
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap max-h-32 overflow-y-auto p-2 bg-canvas rounded-lg border border-line">
                    {selectedProduct.tags.length === 0 ? (
                      <span className="text-ink-muted italic">None</span>
                    ) : (
                      selectedProduct.tags.map((t, i) => (
                        <span key={i} className="px-2 py-0.5 bg-surface border border-line rounded-full text-[10px] text-ink font-medium">
                          #{t}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="font-semibold text-ink uppercase text-[11px] tracking-wider block">
                    Materials ({selectedProduct.materials.length})
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap max-h-32 overflow-y-auto p-2 bg-canvas rounded-lg border border-line">
                    {selectedProduct.materials.length === 0 ? (
                      <span className="text-ink-muted italic">None</span>
                    ) : (
                      selectedProduct.materials.map((m, i) => (
                        <span key={i} className="px-2 py-0.5 bg-accent/15 border border-accent/30 rounded-md text-[10px] text-accent font-semibold">
                          {m}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Product Images Gallery (IMAGE1 to IMAGE10) */}
              <div className="space-y-2">
                <span className="font-semibold text-ink uppercase text-[11px] tracking-wider block">
                  Product Image URLs & Gallery ({selectedProduct.images.length} Photos)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {selectedProduct.images.map((img) => (
                    <div
                      key={img.order}
                      className="group relative bg-canvas border border-line rounded-xl overflow-hidden aspect-square flex flex-col justify-end p-2"
                    >
                      {/* Image preview thumbnail */}
                      <img
                        src={img.url}
                        alt={`Image ${img.order}`}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                      <div className="relative z-10 bg-ink/75 backdrop-blur-xs text-on-primary px-2 py-1 rounded text-[10px] flex items-center justify-between">
                        <span>#{img.order} {img.isCover ? "(Cover)" : ""}</span>
                        <a
                          href={img.url}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-highlight"
                          title="Open full image"
                        >
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-line bg-canvas/40 flex items-center justify-end shrink-0">
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="px-4 py-2 bg-primary text-on-primary rounded-lg text-xs font-semibold hover:bg-primary-hover transition-colors shadow-xs"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

