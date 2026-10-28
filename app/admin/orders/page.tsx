"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { paymentBadgeClass } from "@/components/admin/payments-shared";
import {
  ShoppingBag,
  IndianRupee,
  Truck,
  Package,
  ShieldCheck,
  Download,
  Plus,
  Calendar,
  Search,
  Filter,
  RotateCcw,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  Eye,
  X,
} from "lucide-react";

interface AdminOrder {
  id: string;
  orderId: string;
  customer: {
    name: string;
    email: string;
    avatar?: string;
    initials?: string;
  };
  items: {
    image: string;
    title: string;
  }[];
  extraItemsCount?: number;
  totalAmount: number;
  itemsCount: number;
  paymentStatus: "Paid" | "Pending" | "Failed" | "Partially Refunded" | "Refunded";
  /** COD or CASHFREE when the API tells us (empty when it does not) */
  paymentProvider: string;
  orderStatus: "Processing" | "Shipped" | "Delivered" | "Ready to Ship" | "Pending" | "Cancelled";
  date: string;
  time: string;
}

export default function AdminOrdersPage() {
  const [activeTab, setActiveTab] = useState<string>("All Orders");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>("all");
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [exportNotice, setExportNotice] = useState(false);

  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [reloadKey, setReloadKey] = useState(0);
  const [stats, setStats] = useState<{
    totalOrders: number;
    processingCount: number;
    readyToShipCount: number;
    shippedCount: number;
    deliveredCount: number;
    totalRevenue: number;
    refunded: number;
  } | null>(null);

  // Every order comes from the API (all pages); nothing is merged in from the browser or invented.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadState("loading");
      try {
        const all: AdminOrder[] = [];
        for (let page = 1; page <= 50; page++) {
          const res = await fetch(`/api/v1/admin/orders?limit=100&page=${page}`, { credentials: "include" });
          if (!res.ok) throw new Error("orders");
          const body = await res.json();
          if (page === 1 && body.stats) {
            setStats({
              totalOrders: body.stats.totalOrders,
              processingCount: body.stats.processingCount,
              readyToShipCount: body.stats.readyToShipCount,
              shippedCount: body.stats.shippedCount,
              deliveredCount: body.stats.deliveredCount,
              totalRevenue: (body.stats.totalRevenueMinor || 0) / 100,
              refunded: (body.stats.refundedMinor || 0) / 100,
            });
          }
          for (const o of body.items || []) {
            all.push({
              id: o.id,
              orderId: o.orderNumber?.startsWith("#") ? o.orderNumber : `#${o.orderNumber}`,
              customer: {
                name: o.customer?.name || "",
                email: o.customer?.email || "",
                avatar: "/images/brand/saffronvastra-mark.png",
              },
              items: (o.items || []).map((it: any) => ({
                image: it.image || "/images/brand/saffronvastra-mark.png",
                title: it.title || "",
              })),
              totalAmount: (o.totalMinor || 0) / 100,
              itemsCount: o.itemsCount ?? o.items?.length ?? 0,
              paymentStatus: o.paymentStatus || "Pending",
              paymentProvider: String(o.paymentProvider || o.paymentMethod?.provider || "").toUpperCase(),
              orderStatus: o.orderStatus || "",
              date: o.date ? new Date(o.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "",
              time: o.date ? new Date(o.date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "",
            } as AdminOrder);
          }
          if (!body.pagination || page >= body.pagination.totalPages) break;
        }
        if (!cancelled) {
          setOrders(all);
          setLoadState("ready");
        }
      } catch {
        if (!cancelled) setLoadState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Tab matching
      if (activeTab === "Pending" && order.orderStatus !== "Pending") return false;
      if (activeTab === "Processing" && order.orderStatus !== "Processing") return false;
      if (activeTab === "Ready to Ship" && order.orderStatus !== "Ready to Ship") return false;
      if (activeTab === "Shipped" && order.orderStatus !== "Shipped") return false;
      if (activeTab === "Delivered" && order.orderStatus !== "Delivered") return false;
      if (activeTab === "Cancelled" && order.orderStatus !== "Cancelled") return false;

      // Status dropdown
      if (selectedStatus !== "all" && order.orderStatus.toLowerCase() !== selectedStatus.toLowerCase()) return false;

      // Payment Status dropdown
      if (selectedPaymentStatus !== "all" && order.paymentStatus.toLowerCase() !== selectedPaymentStatus.toLowerCase()) return false;

      // Search Query
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const matchesId = order.orderId.toLowerCase().includes(query);
        const matchesName = order.customer.name.toLowerCase().includes(query);
        const matchesEmail = order.customer.email.toLowerCase().includes(query);
        if (!matchesId && !matchesName && !matchesEmail) return false;
      }

      return true;
    });
  }, [orders, activeTab, selectedStatus, selectedPaymentStatus, searchQuery]);

  const toggleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map((o) => o.orderId));
    }
  };

  const toggleSelectOrder = (id: string) => {
    if (selectedOrders.includes(id)) {
      setSelectedOrders(selectedOrders.filter((item) => item !== id));
    } else {
      setSelectedOrders([...selectedOrders, id]);
    }
  };

  // Downloads the orders currently listed (after filters) as a CSV file.
  const exportOrdersCsv = () => {
    const quote = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
    const header = ["Order", "Customer", "Email", "Items", "Total (INR)", "Payment", "Status", "Date"];
    const rows = filteredOrders.map((o) => [
      o.orderId,
      o.customer.name,
      o.customer.email,
      o.itemsCount,
      o.totalAmount,
      o.paymentStatus,
      o.orderStatus,
      `${o.date} ${o.time}`.trim(),
    ]);
    const csv = [header, ...rows].map((row) => row.map(quote).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setExportNotice(true);
    setTimeout(() => setExportNotice(false), 2500);
  };

  const resetFilters = () => {
    setActiveTab("All Orders");
    setSearchQuery("");
    setSelectedStatus("all");
    setSelectedPaymentStatus("all");
  };

  const tabs = [
    { label: "All Orders", count: orders.length },
    { label: "Pending", count: orders.filter((o) => o.orderStatus === "Pending").length },
    { label: "Processing", count: orders.filter((o) => o.orderStatus === "Processing").length },
    { label: "Ready to Ship", count: orders.filter((o) => o.orderStatus === "Ready to Ship").length },
    { label: "Shipped", count: orders.filter((o) => o.orderStatus === "Shipped").length },
    { label: "Delivered", count: orders.filter((o) => o.orderStatus === "Delivered").length },
    { label: "Cancelled", count: orders.filter((o) => o.orderStatus === "Cancelled").length },
  ];

  const totalRevenueCalculated = useMemo(() => {
    return orders.reduce((sum, o) => sum + (o.paymentStatus === "Paid" ? o.totalAmount : 0), 0);
  }, [orders]);

  return (
    <div className="space-y-6">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif text-ink tracking-tight">
            Orders ({orders.length})
          </h1>
          <p className="text-xs text-ink-muted mt-0.5">
            Manage and track all customer orders from purchase to delivery.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportOrdersCsv}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-surface border border-line rounded-md text-xs font-semibold text-ink hover:bg-ink/5 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-ink-secondary" />
            <span>Export</span>
          </button>

        </div>
      </div>

      {exportNotice && (
        <div className="p-3 bg-success-bg border border-success-line text-success rounded-md text-xs flex items-center justify-between">
          <span>Orders exported as CSV ({filteredOrders.length} records).</span>
          <button onClick={() => setExportNotice(false)} className="text-success font-bold">×</button>
        </div>
      )}

      {loadState === "loading" && (
        <p role="status" className="text-xs text-ink-muted">Loading orders...</p>
      )}
      {loadState === "error" && (
        <div role="alert" className="p-3 bg-error-bg border border-error-line text-error rounded-md text-xs flex items-center justify-between gap-3">
          <span>Could not load orders. The list below may be incomplete.</span>
          <button type="button" onClick={() => setReloadKey((k) => k + 1)} className="font-semibold underline">
            Try again
          </button>
        </div>
      )}

      {/* 2. KPI SUMMARY STAT CARDS (5 Cards Matching Mockup) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Orders */}
        <div className="bg-surface p-4 rounded-xl border border-line shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-muted">Total Orders</span>
            <div className="w-8 h-8 rounded-full bg-warning-bg text-warning flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-serif font-semibold text-ink">{stats ? stats.totalOrders : orders.length}</div>
            <div className="flex items-center gap-1 text-[11px] text-success font-medium mt-1">
              <span className="text-ink-muted font-normal">All orders to date</span>
            </div>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-surface p-4 rounded-xl border border-line shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-muted">Total Revenue</span>
            <div className="w-8 h-8 rounded-full bg-warning-bg text-warning flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-serif font-semibold text-ink" data-testid="stat-revenue" data-minor={Math.round((stats ? stats.totalRevenue : totalRevenueCalculated) * 100)}>
              ₹{(stats ? stats.totalRevenue : totalRevenueCalculated).toLocaleString("en-IN")}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-success font-medium mt-1">
              <span className="text-ink-muted font-normal">Received, net of refunds</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] mt-0.5" data-testid="stat-refunded" data-minor={Math.round((stats?.refunded || 0) * 100)}>
              <span className="text-ink-muted font-normal">Refunded</span>
              <span className="text-ink font-medium">₹{(stats?.refunded || 0).toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        {/* Processing / Crafting Orders */}
        <div className="bg-surface p-4 rounded-xl border border-line shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-muted">Processing / Crafting</span>
            <div className="w-8 h-8 rounded-full bg-warning-bg text-warning flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-serif font-semibold text-ink">{stats ? stats.processingCount : orders.filter(o => o.orderStatus === "Processing").length}</div>
            <div className="flex items-center gap-1 text-[11px] text-warning font-medium mt-1">
              <span>Jaipur Atelier</span>
              <span className="text-ink-muted font-normal">in production</span>
            </div>
          </div>
        </div>

        {/* Shipped Orders */}
        <div className="bg-surface p-4 rounded-xl border border-line shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-muted">Shipped Orders</span>
            <div className="w-8 h-8 rounded-full bg-info-bg text-info flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-serif font-semibold text-ink">{stats ? stats.shippedCount : orders.filter(o => o.orderStatus === "Shipped").length}</div>
            <div className="flex items-center gap-1 text-[11px] text-success font-medium mt-1">
              <span className="text-ink-muted font-normal">With the courier</span>
            </div>
          </div>
        </div>

        {/* Delivered Orders */}
        <div className="bg-surface p-4 rounded-xl border border-line shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-muted">Delivered Orders</span>
            <div className="w-8 h-8 rounded-full bg-success-bg text-success flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-serif font-semibold text-ink">{stats ? stats.deliveredCount : orders.filter(o => o.orderStatus === "Delivered").length}</div>
            <div className="flex items-center gap-1 text-[11px] text-success font-medium mt-1">
              <span className="text-ink-muted font-normal">Completed to date</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. TABS BAR & DATE RANGE PICKER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-line gap-4">
        {/* Tab Buttons */}
        <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.label;
            return (
              <button
                key={tab.label}
                onClick={() => setActiveTab(tab.label)}
                className={`pb-3 text-xs whitespace-nowrap transition-all border-b-2 font-medium ${
                  isActive
                    ? "border-primary text-primary font-semibold"
                    : "border-transparent text-ink-muted hover:text-ink"
                }`}
              >
                <span>{tab.label}</span>{" "}
                <span className={`text-[11px] ${isActive ? "text-primary" : "text-ink-muted"}`}>
                  ({tab.count})
                </span>
              </button>
            );
          })}
        </div>

      </div>

      {/* 4. FILTERS BAR */}
      <div className="bg-surface p-3.5 rounded-xl border border-line shadow-2xs flex flex-col lg:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full lg:w-80">
          <Search className="w-3.5 h-3.5 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by Order ID, customer name, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-canvas border border-line rounded-md text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:border-primary"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Status */}
          <select
            aria-label="Order status"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 bg-surface border border-line rounded-md text-xs text-ink focus:outline-none focus:border-primary"
          >
            <option value="all">Status: All</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="ready to ship">Ready to Ship</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Payment Status */}
          <select
            aria-label="Payment status"
            value={selectedPaymentStatus}
            onChange={(e) => setSelectedPaymentStatus(e.target.value)}
            className="px-3 py-1.5 bg-surface border border-line rounded-md text-xs text-ink focus:outline-none focus:border-primary"
          >
            <option value="all">Payment: All</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="partially refunded">Partially Refunded</option>
            <option value="refunded">Refunded</option>
          </select>

          {/* Amount Range */}
          <select className="px-3 py-1.5 bg-surface border border-line rounded-md text-xs text-ink focus:outline-none focus:border-primary">
            <option value="all">Amount: All</option>
            <option value="under15k">Under ₹15,000</option>
            <option value="15k-25k">₹15,000 – ₹25,000</option>
            <option value="above25k">Above ₹25,000</option>
          </select>

          {/* Reset */}
          <button
            onClick={resetFilters}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-primary hover:text-primary-hover font-medium"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* 5. ORDERS DATA TABLE */}
      <div className="bg-surface rounded-xl border border-line shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-canvas text-ink-muted border-b border-line font-medium">
              <tr>
                <th className="p-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedOrders.length > 0 && selectedOrders.length === filteredOrders.length}
                    onChange={toggleSelectAll}
                    className="accent-primary rounded-xs cursor-pointer"
                  />
                </th>
                <th className="p-3.5 font-semibold text-ink">Order ID</th>
                <th className="p-3.5 font-semibold text-ink">Customer</th>
                <th className="p-3.5 font-semibold text-ink">Items</th>
                <th className="p-3.5 font-semibold text-ink">Total Amount</th>
                <th className="p-3.5 font-semibold text-ink">Payment Status</th>
                <th className="p-3.5 font-semibold text-ink">Order Status</th>
                <th className="p-3.5 font-semibold text-ink">Order Date</th>
                <th className="p-3.5 font-semibold text-ink text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredOrders.map((order) => {
                const isSelected = selectedOrders.includes(order.orderId);

                // Status Pill styling
                let orderBadgeClass = "bg-warning-bg text-warning border-warning-line";
                if (order.orderStatus === "Shipped") orderBadgeClass = "bg-info-bg text-info border-info-line";
                if (order.orderStatus === "Delivered") orderBadgeClass = "bg-success-bg text-success border-success-line";
                if (order.orderStatus === "Ready to Ship") orderBadgeClass = "bg-purple-50 text-purple-700 border-purple-200";
                if (order.orderStatus === "Cancelled") orderBadgeClass = "bg-error-bg text-error border-error-line";
                if (order.orderStatus === "Pending") orderBadgeClass = "bg-warning-bg text-warning border-warning-line";

                let payBadgeClass = "bg-success-bg text-success border-success-line";
                if (order.paymentStatus === "Pending") payBadgeClass = "bg-warning-bg text-warning border-warning-line";
                if (order.paymentStatus === "Failed") payBadgeClass = "bg-error-bg text-error border-error-line";
                if (order.paymentStatus === "Partially Refunded" || order.paymentStatus === "Refunded") payBadgeClass = paymentBadgeClass(order.paymentStatus);
                // an online order waiting for its payment is not "Pending" fulfilment: say what it is waiting for
                const awaitingPayment = order.paymentProvider === "CASHFREE" && order.orderStatus === "Pending";

                // Clean Order ID for URL routing
                const cleanId = order.orderId.replace("#", "");

                return (
                  <tr
                    key={order.orderId}
                    className={`hover:bg-canvas/60 transition-colors ${
                      isSelected ? "bg-warning-bg/30" : ""
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="p-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOrder(order.orderId)}
                        className="accent-primary rounded-xs cursor-pointer"
                      />
                    </td>

                    {/* Order ID */}
                    <td className="p-3.5 font-semibold text-primary">
                      <Link href={`/admin/orders/${cleanId}`} className="hover:underline">
                        {order.orderId}
                      </Link>
                    </td>

                    {/* Customer */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-2.5">
                        {order.customer.avatar ? (
                          <div className="w-7 h-7 rounded-full overflow-hidden relative border border-line shrink-0">
                            <Image
                              src={order.customer.avatar}
                              alt={order.customer.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-surface-muted border border-line text-primary font-semibold text-[10px] flex items-center justify-center shrink-0">
                            {order.customer.initials || "CU"}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-ink leading-tight">
                            {order.customer.name}
                          </p>
                          <p className="text-[11px] text-ink-muted mt-0.5">
                            {order.customer.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Items */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5">
                        {order.items.slice(0, 2).map((item, idx) => (
                          <div
                            key={idx}
                            className="w-7 h-9 rounded-xs overflow-hidden relative border border-line bg-canvas"
                            title={item.title}
                          >
                            <Image
                              src={item.image}
                              alt={item.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ))}
                        {order.extraItemsCount && (
                          <span className="w-6 h-6 rounded-full bg-surface-muted text-ink-muted text-[10px] font-semibold flex items-center justify-center border border-line">
                            +{order.extraItemsCount}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Total Amount */}
                    <td className="p-3.5">
                      <p className="font-semibold text-ink">
                        ₹{order.totalAmount.toLocaleString("en-IN")}
                      </p>
                      <p className="text-[10px] text-ink-muted">{order.itemsCount} items</p>
                    </td>

                    {/* Payment Status */}
                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${payBadgeClass}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        <span>{order.paymentStatus}</span>
                      </span>
                      {order.paymentProvider && (
                        <p className="text-[10px] text-ink-muted mt-1" data-testid="payment-method">
                          {order.paymentProvider === "CASHFREE" ? "Online payment" : "Cash on Delivery"}
                        </p>
                      )}
                    </td>

                    {/* Order Status */}
                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${orderBadgeClass}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        <span>{awaitingPayment ? "Awaiting payment" : order.orderStatus}</span>
                      </span>
                    </td>

                    {/* Order Date */}
                    <td className="p-3.5">
                      <p className="font-medium text-ink">{order.date}</p>
                      <p className="text-[10px] text-ink-muted">{order.time}</p>
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Link
                          href={`/admin/orders/${cleanId}`}
                          className="px-2.5 py-1 bg-surface border border-primary text-primary hover:bg-primary-hover hover:text-on-primary transition-colors rounded-xs text-[11px] font-medium"
                        >
                          View
                        </Link>
                        <button
                          className="p-1 hover:bg-ink/5 rounded-xs text-ink-muted"
                          aria-label="More actions"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 6. PAGINATION FOOTER */}
        <div className="p-4 bg-surface border-t border-line flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-ink-muted">
          <p>
            Showing 1 to {Math.min(10, filteredOrders.length)} of {orders.length} orders
          </p>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                aria-label="Previous page"
                className="w-7 h-7 rounded-sm border border-line flex items-center justify-center text-ink-secondary hover:bg-ink/5 disabled:opacity-40"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button className="w-7 h-7 rounded-sm bg-primary text-on-primary font-semibold flex items-center justify-center">
                1
              </button>
              <button className="w-7 h-7 rounded-sm border border-line text-ink-secondary hover:bg-ink/5 flex items-center justify-center">
                2
              </button>
              <button className="w-7 h-7 rounded-sm border border-line text-ink-secondary hover:bg-ink/5 flex items-center justify-center">
                3
              </button>
              <button className="w-7 h-7 rounded-sm border border-line text-ink-secondary hover:bg-ink/5 flex items-center justify-center">
                4
              </button>
              <button className="w-7 h-7 rounded-sm border border-line text-ink-secondary hover:bg-ink/5 flex items-center justify-center">
                5
              </button>
              <button
                disabled={currentPage === 5}
                onClick={() => setCurrentPage((p) => Math.min(5, p + 1))}
                aria-label="Next page"
                className="w-7 h-7 rounded-sm border border-line flex items-center justify-center text-ink-secondary hover:bg-ink/5"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <select className="px-2.5 py-1 bg-surface border border-line rounded-sm text-xs text-ink">
              <option>10 per page</option>
              <option>25 per page</option>
              <option>50 per page</option>
            </select>
          </div>
        </div>
      </div>

    </div>
  );
}
