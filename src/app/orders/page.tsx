"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Search,
  ShieldAlert,
} from "lucide-react";
import { useTenant } from "@/context/TenantContext";
import { cn } from "@/lib/utils";

const statusFilters = [
  "all",
  "new",
  "preparing",
  "ready",
  "completed",
  "cancelled",
] as const;

export default function OrdersPage() {
  const { activeTenant, loading: tenantLoading } = useTenant();
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<(typeof statusFilters)[number]>("all");
  const [dateFilter, setDateFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    if (!activeTenant?._id) {
      setOrders([]);
      setLoadingOrders(false);
      return;
    }

    const fetchOrders = async () => {
      setLoadingOrders(true);
      try {
        const res = await fetch(`/api/orders?tenantId=${activeTenant._id}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setOrders(data.data);
        } else {
          setOrders([]);
        }
      } catch {
        setOrders([]);
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchOrders();
  }, [activeTenant?._id]);

  const filteredOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return orders.filter((order) => {
      const orderCode = String(
        order.orderNumber || order._id || "",
      ).toLowerCase();
      const barcode = String(order.barcode || "").toLowerCase();
      const type = String(order.type || "").toLowerCase();
      const status = String(order.status || "").toLowerCase();
      const createdDate = order.createdAt
        ? new Date(order.createdAt).toISOString().slice(0, 10)
        : "";

      const matchesStatus = statusFilter === "all" || status === statusFilter;
      const matchesDate = !dateFilter || createdDate === dateFilter;
      const matchesQuery =
        !query ||
        orderCode.includes(query) ||
        barcode.includes(query) ||
        type.includes(query) ||
        status.includes(query);

      return matchesStatus && matchesDate && matchesQuery;
    });
  }, [orders, searchQuery, statusFilter, dateFilter]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, dateFilter, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const paginatedOrders = filteredOrders.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  if (tenantLoading || (activeTenant && loadingOrders)) {
    return (
      <div className="flex items-center justify-center h-full bg-surface">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-on-surface-variant text-sm font-black tracking-widest">
            Loading Orders...
          </p>
        </div>
      </div>
    );
  }

  if (!activeTenant) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-surface text-center p-8">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
          <ClipboardList size={36} />
        </div>
        <h1 className="text-2xl font-black text-on-surface">
          No Shop Selected
        </h1>
        <p className="text-on-surface-variant text-sm mt-2 max-w-md">
          Please select or provision a shop environment first.
        </p>
        <Link
          href="/super-admin"
          className="mt-6 px-5 py-2.5 bg-primary text-on-primary rounded-lg text-xs font-bold active:scale-95 transition-all"
        >
          Super Admin Console
        </Link>
      </div>
    );
  }

  if (!activeTenant.enabledModules.includes("pos")) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-surface text-center p-8">
        <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center text-error mb-4">
          <ShieldAlert size={36} />
        </div>
        <h1 className="text-2xl font-black text-on-surface">
          Orders Unavailable
        </h1>
        <p className="text-on-surface-variant text-sm mt-2 max-w-md">
          The POS module is not enabled for{" "}
          <span className="font-bold text-on-surface">{activeTenant.name}</span>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-surface overflow-y-auto scrollbar-hide">
      <div className="p-4 lg:p-8 mx-auto w-full space-y-4 lg:space-y-6">
        <section>
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-col gap-3 w-full">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative min-w-[240px]">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
                    size={18}
                  />
                  <input
                    type="text"
                    placeholder="Search order no, barcode, type..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-10 w-full lg:w-100 rounded-lg border border-outline-variant bg-surface pl-10 text-sm text-on-surface placeholder:text-on-surface-variant focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex items-center gap-2 text-xs font-bold text-on-surface-variant">
                    Date
                    <input
                      type="date"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="rounded-lg border border-outline-variant bg-surface px-3 py-2 text-xs text-on-surface outline-none"
                    />
                  </label>
                  {dateFilter && (
                    <button
                      type="button"
                      onClick={() => setDateFilter("")}
                      className="rounded-lg border border-outline-variant bg-surface px-3 py-2 text-xs font-bold text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                    >
                      Clear Date
                    </button>
                  )}
                </div>
                </div>

                <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar whitespace-nowrap">
                  {statusFilters.map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setStatusFilter(filter)}
                      className={cn(
                        "rounded-full px-3 py-2 text-xs font-bold tracking-wider transition-colors",
                        statusFilter === filter
                          ? "bg-primary text-on-primary"
                          : "bg-surface text-on-surface-variant border border-outline-variant hover:text-on-surface hover:bg-surface-container-high",
                      )}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
                  <div className="flex justify-end md:ml-auto md:justify-start xl:hidden">
                  <label className="inline-flex items-center gap-2 text-xs font-bold text-on-surface-variant">
                    Rows
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      className="rounded-lg border border-outline-variant bg-surface px-3 py-2 text-xs text-on-surface outline-none"
                    >
                      {[10, 20, 30, 50].map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </label>
                  </div>
                </div>
              </div>
              <label className="hidden xl:inline-flex items-center gap-2 text-xs font-bold text-on-surface-variant xl:justify-end">
                Rows
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="rounded-lg border border-outline-variant bg-surface px-3 py-2 text-xs text-on-surface outline-none"
                >
                  {[10, 20, 30, 50].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>
          </div>
        </section>

        <section className="rounded-xl border border-outline-variant bg-surface-container overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[940px] text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-high/50 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">
                  <th className="px-4 lg:px-6 py-4">Order</th>
                  <th className="px-4 lg:px-6 py-4">Type</th>
                  <th className="px-4 lg:px-6 py-4">Items</th>
                  <th className="px-4 lg:px-6 py-4">Barcode</th>
                  <th className="px-4 lg:px-6 py-4">Amount</th>
                  <th className="px-4 lg:px-6 py-4">Status</th>
                  <th className="px-4 lg:px-6 py-4">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                {paginatedOrders.map((order) => (
                  <tr
                    key={order._id}
                    className="hover:bg-surface-container-high/40 transition-colors"
                  >
                    <td className="px-4 lg:px-6 py-4">
                      <p className="text-sm font-bold text-on-surface">
                        {order.orderNumber || order._id}
                      </p>
                      <p className="text-[10px] font-mono text-on-surface-variant">
                        {order._id}
                      </p>
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-xs font-bold uppercase text-on-surface">
                      {String(order.type || "").replace("-", " ")}
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-xs text-on-surface-variant">
                      {order.items?.length || 0} item
                      {order.items?.length === 1 ? "" : "s"}
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <p className="text-[10px] font-mono text-on-surface-variant break-all">
                        {order.barcode || "N/A"}
                      </p>
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-sm font-black text-primary">
                      Rs. {Number(order.total || 0).toFixed(2)}
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <span className="rounded-full border border-outline-variant bg-surface px-3 py-1 text-[10px] font-black uppercase tracking-wider text-on-surface">
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-[11px] text-on-surface-variant">
                      {new Date(order.createdAt).toLocaleDateString()}{" "}
                      {new Date(order.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}

                {paginatedOrders.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-12 text-center text-xs text-on-surface-variant"
                    >
                      No orders matched your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {filteredOrders.length > 0 && (
          <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
            <p className="shrink-0 whitespace-nowrap text-xs text-on-surface-variant">
              Showing {(page - 1) * pageSize + 1}-
              {Math.min(page * pageSize, filteredOrders.length)} of{" "}
              {filteredOrders.length}
            </p>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="inline-flex items-center gap-1 rounded-lg border border-outline-variant bg-surface px-3 py-2 text-xs font-bold text-on-surface hover:bg-surface-container-high disabled:opacity-40"
              >
                <ChevronLeft size={14} />
                Prev
              </button>
              <span className="rounded-lg bg-surface-container px-3 py-2 text-xs font-bold text-on-surface">
                Page {page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() =>
                  setPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={page === totalPages}
                className="inline-flex items-center gap-1 rounded-lg border border-outline-variant bg-surface px-3 py-2 text-xs font-bold text-on-surface hover:bg-surface-container-high disabled:opacity-40"
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
