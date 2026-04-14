"use client";

import { useEffect, useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
} from "@tanstack/react-table";
import {
  User,
  Truck,
  Package,
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  ChevronUp,
  ChevronDown,
  CheckCircle,
  XCircle,
  FileText,
  Tag,
  Hash,
  Building2,
  MapPin,
  Phone,
  Mail,
  Image,
  ExternalLink,
  Box,
  Download,
  Eye,
  ZoomIn,
} from "lucide-react";

import { getAdminAllVisitsWithDeliveries } from "@/utils/api";

/* ─────────────────── helpers ─────────────────── */
const fmt = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

const STATUS_STYLES = {
  active:
    "bg-emerald-50 text-emerald-700 border border-emerald-200",
  completed:
    "bg-slate-100 text-slate-600 border border-slate-200",
  pending:
    "bg-amber-50 text-amber-700 border border-amber-200",
};

const PURPOSE_ICON = {
  delivery: <Package className="w-3.5 h-3.5" />,
  pickup: <Truck className="w-3.5 h-3.5" />,
};

const DEPT_LABELS = {
  central_pharmacy: "Central Pharmacy",
  radiology: "Radiology",
};

/* ─────────────────── component ─────────────────── */
export default function DeliveriesReportTable() {
  /* ===== state ===== */
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState([]);

  // modal
  const [showModal, setShowModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  // preview modal (image / pdf viewer)
  const [preview, setPreview] = useState(null); // { url, label, isPdf }

  const openPreview = (url, label, isPdf) => {
    setPreview({ url: `https://hammsapi.bluai.ai${url}`, label, isPdf });
  };

  const handleDownload = async (url, filename) => {
    try {
      const response = await fetch(`https://hammsapi.bluai.ai${url}`);
      if (!response.ok) throw new Error("Network response was not ok");
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch {
      showNotification("Download failed", "error");
    }
  };

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  /* ===== fetch ===== */
  useEffect(() => {
    const fetchVisits = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getAdminAllVisitsWithDeliveries({
          page: pagination.pageIndex + 1,
          limit: pagination.pageSize,
        });
        setData(Array.isArray(res.data?.data) ? res.data.data : []);
        setTotal(res.data?.meta?.total ?? 0);
      } catch (err) {
        const msg = err.response?.data?.message || "Failed to fetch deliveries";
        setError(msg);
        showNotification(msg, "error");
        setData([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };

    const t = setTimeout(fetchVisits, 300);
    return () => clearTimeout(t);
  }, [pagination.pageIndex, pagination.pageSize]);

  /* ===== open modal ===== */
  const openDetails = (row) => {
    setSelectedRow(row);
    setShowModal(true);
  };

  /* ===== columns ===== */
  const columns = useMemo(
    () => [
      {
        id: "col-srno",
        header: "Sr No",
        size: 110,
        cell: ({ row }) => (
          <div className="font-medium text-gray-700 text-sm">
            {pagination.pageIndex * pagination.pageSize + row.index + 1}
          </div>
        ),
      },
      {
        id: "col-company",
        header: "Company",
        size: 220,
        cell: ({ row }) => {
          const d = row.original.Deliveries?.[0];
          const co = d?.Company;
          return (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="min-w-0">
                <div className="font-medium text-gray-900 text-sm truncate">
                  {co?.name || "—"}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {row.original.company_code || "—"}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        id: "col-driver",
        header: "Driver",
        size: 220,
        cell: ({ row }) => {
          const d = row.original.Deliveries?.[0];
          const dv = d?.DriverVisitor;
          return (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                {dv?.photo_url ? (
                  <img
                    src={`https://hammsapi.bluai.ai${dv.photo_url}`}
                    alt="driver"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-violet-600" />
                )}
              </div>
              <div className="min-w-0">
                <div className="font-medium text-gray-900 text-sm truncate">
                  {dv ? `${dv.first_name} ${dv.last_name}` : "—"}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {dv?.phone || "—"}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        id: "col-vehicle",
        header: "Vehicle",
        size: 160,
        cell: ({ row }) => {
          const v = row.original.Deliveries?.[0]?.Vehicle;
          return (
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gray-100 rounded-md">
                <Truck className="w-4 h-4 text-gray-600" />
              </div>
              <div>
                <div className="text-sm text-gray-900 font-medium capitalize">
                  {v?.vehicle_type || "—"}
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">
                  {v?.registration_number || "—"}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        id: "col-purpose",
        header: "Purpose",
        size: 100,
        cell: ({ row }) => {
          const p = row.original.purpose;
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 capitalize">
              {PURPOSE_ICON[p] || <Package className="w-3.5 h-3.5" />}
              {p || "—"}
            </span>
          );
        },
      },
      {
        id: "col-entry",
        header: "Entry Time",
        size: 210,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-green-500 shrink-0" />
            <span className="text-sm text-gray-900">{fmt(row.original.entry_time)}</span>
          </div>
        ),
      },
      {
        id: "col-exit",
        header: "Exit Time",
        size: 210,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-red-400 shrink-0" />
            <span className="text-sm text-gray-900">
              {row.original.exit_time ? fmt(row.original.exit_time) : "—"}
            </span>
          </div>
        ),
      },
      {
        id: "col-items",
        header: "Items",
        size: 50,
        cell: ({ row }) => {
          const count = row.original.Deliveries?.reduce(
            (acc, d) => acc + (d.DeliveryItems?.length || 0),
            0,
          );
          return (
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-700 font-semibold text-sm">
              {count ?? 0}
            </span>
          );
        },
      },
      {
        id: "col-status",
        header: "Status",
        size: 120,
        cell: ({ row }) => {
          const s = row.original.status;
          return (
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[s] ?? "bg-gray-100 text-gray-600 border border-gray-200"
                }`}
            >
              {s || "—"}
            </span>
          );
        },
      },
    ],
    [pagination.pageIndex, pagination.pageSize],
  );

  const table = useReactTable({
    data,
    columns,
    pageCount: Math.ceil(total / pagination.pageSize),
    state: { pagination, sorting },
    manualPagination: true,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    autoResetPageIndex: false,
  });

  const start = pagination.pageIndex * pagination.pageSize + 1;
  const end = Math.min(start + data.length - 1, total);

  const getPageNumbers = () => {
    const cur = table.getState().pagination.pageIndex;
    const tot = table.getPageCount();
    if (tot <= 5) return Array.from({ length: tot }, (_, i) => i);
    if (cur < 3) return [0, 1, 2, 3, 4];
    if (cur > tot - 4) return [tot - 5, tot - 4, tot - 3, tot - 2, tot - 1];
    return [cur - 2, cur - 1, cur, cur + 1, cur + 2];
  };

  /* ===== modal delivery data ===== */
  const modalDelivery = selectedRow?.Deliveries?.[0];

  /* ===== render ===== */
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-8xl mx-auto space-y-6">

        {/* Header */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-xs">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Deliveries Report
                </h1>
                <p className="text-gray-600 mt-1">
                  View all visit and delivery records with full details
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <XCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-gray-900">{error}</p>
                <p className="text-sm text-gray-600 mt-1">
                  Please check your permissions and try again.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Table container */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
              <p className="mt-3 text-gray-600 font-medium">Loading deliveries...</p>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No deliveries found</h3>
              <p className="text-gray-600">Delivery records will appear here once visits are recorded.</p>
            </div>
          ) : (
            <>
              {/* Rows-per-page */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600" />
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600">Rows per page:</span>
                    <select
                      value={table.getState().pagination.pageSize}
                      onChange={(e) => table.setPageSize(Number(e.target.value))}
                      className="px-3 py-1.5 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    >
                      {[5, 10, 20, 50].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    {table.getHeaderGroups().map((hg) => (
                      <tr key={hg.id}>
                        {hg.headers.map((header) => (
                          <th
                            key={header.id}
                            className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                            style={{ width: header.column.columnDef.size }}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            <div className="flex items-center justify-between">
                              <span>
                                {flexRender(
                                  header.column.columnDef.header,
                                  header.getContext(),
                                )}
                              </span>
                              {header.column.getIsSorted() && (
                                <span className="text-gray-400">
                                  {header.column.getIsSorted() === "asc" ? (
                                    <ChevronUp className="w-4 h-4" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4" />
                                  )}
                                </span>
                              )}
                            </div>
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        onClick={() => openDetails(row.original)}
                        className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="px-6 py-4">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <p className="text-sm text-gray-600">
                    Showing{" "}
                    <span className="font-semibold text-gray-900">{start}</span> to{" "}
                    <span className="font-semibold text-gray-900">{end}</span> of{" "}
                    <span className="font-semibold text-gray-900">{total}</span> visits
                  </p>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                      className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="flex items-center space-x-1">
                      {getPageNumbers().map((pg) => (
                        <button
                          key={pg}
                          onClick={() => table.setPageIndex(pg)}
                          className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${table.getState().pagination.pageIndex === pg
                              ? "bg-blue-600 text-white"
                              : "text-gray-700 hover:bg-gray-100"
                            }`}
                        >
                          {pg + 1}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                      className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ═══════════════ DETAILS MODAL ═══════════════ */}
      {showModal && selectedRow && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full flex flex-col" style={{ maxHeight: "90vh" }}>

            {/* ── Sticky Modal header ── */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-50 rounded-md">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Delivery Details
                  </h3>
                  <p className="text-sm text-gray-600">
                    Visit #{selectedRow.id} •{" "}
                    {fmtDate(selectedRow.entry_time)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* ── Scrollable body ── */}
            <div className="overflow-y-auto flex-1 px-6 py-6">

              {/* Visit summary row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {[
                  { label: "Company Code", value: selectedRow.company_code, icon: <Tag className="w-4 h-4 text-gray-500" /> },
                  { label: "Purpose", value: selectedRow.purpose, icon: <Box className="w-4 h-4 text-gray-500" />, capitalize: true },
                  { label: "Entry", value: fmt(selectedRow.entry_time), icon: <Clock className="w-4 h-4 text-green-500" /> },
                  { label: "Exit", value: selectedRow.exit_time ? fmt(selectedRow.exit_time) : "Still inside", icon: <Clock className="w-4 h-4 text-red-400" /> },
                ].map((item) => (
                  <div key={item.label} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-1.5 mb-1">
                      {item.icon}
                      <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                        {item.label}
                      </span>
                    </div>
                    <p className={`text-sm font-semibold text-gray-900 ${item.capitalize ? "capitalize" : ""}`}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Status badge */}
              <div className="mb-6 flex items-center gap-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[selectedRow.status] ?? "bg-gray-100 text-gray-600 border border-gray-200"
                  }`}>
                  {selectedRow.status}
                </span>
                {selectedRow.notes && (
                  <span className="text-sm text-gray-500 italic">&qout;{selectedRow.notes}&qout;</span>
                )}
              </div>

              {/* ── Company & Driver ── */}
              {modalDelivery && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {/* Company card */}
                    <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                      <div className="flex items-center gap-2 mb-3">
                        <Building2 className="w-4 h-4 text-indigo-600" />
                        <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">
                          Company
                        </span>
                      </div>
                      <p className="font-semibold text-gray-900">
                        {modalDelivery.Company?.name || "—"}
                      </p>
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Phone className="w-3.5 h-3.5" />
                          {modalDelivery.Company?.phone || "—"}
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Mail className="w-3.5 h-3.5" />
                          {modalDelivery.Company?.email || "—"}
                        </div>
                      </div>
                    </div>

                    {/* Driver card */}
                    <div className="p-4 bg-violet-50 rounded-lg border border-violet-100">
                      <div className="flex items-center gap-2 mb-3">
                        <User className="w-4 h-4 text-violet-600" />
                        <span className="text-xs font-semibold text-violet-700 uppercase tracking-wide">
                          Driver
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {modalDelivery.DriverVisitor?.photo_url ? (
                          <img
                            src={`https://hammsapi.bluai.ai${modalDelivery.DriverVisitor.photo_url}`}
                            alt="driver"
                            className="w-12 h-12 rounded-full object-cover border-2 border-violet-200"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-violet-200 flex items-center justify-center">
                            <User className="w-6 h-6 text-violet-600" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-900">
                            {modalDelivery.DriverVisitor
                              ? `${modalDelivery.DriverVisitor.first_name} ${modalDelivery.DriverVisitor.last_name}`
                              : "—"}
                          </p>
                          <div className="text-sm text-gray-600">
                            {modalDelivery.DriverVisitor?.phone || "—"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Vehicle & Delivery info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {/* Vehicle */}
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2 mb-3">
                        <Truck className="w-4 h-4 text-gray-600" />
                        <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                          Vehicle
                        </span>
                      </div>
                      <div className="flex gap-3">
                        {modalDelivery.Vehicle?.vehicle_photo_url && (
                          <img
                            src={`https://hammsapi.bluai.ai${modalDelivery.Vehicle.vehicle_photo_url}`}
                            alt="vehicle"
                            className="w-16 h-12 rounded object-cover border border-gray-200"
                          />
                        )}
                        <div>
                          <p className="font-semibold text-gray-900 capitalize">
                            {modalDelivery.Vehicle?.vehicle_type || "—"}
                          </p>
                          <p className="text-sm text-gray-500 uppercase tracking-wide font-mono">
                            {modalDelivery.Vehicle?.registration_number || "—"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Delivery meta */}
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2 mb-3">
                        <Hash className="w-4 h-4 text-gray-600" />
                        <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                          Delivery Info
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Invoice</span>
                          <span className="font-medium text-gray-900">
                            {modalDelivery.invoice_number || "—"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Department</span>
                          <span className="font-medium text-gray-900">
                            {DEPT_LABELS[modalDelivery.destination_department] ||
                              modalDelivery.destination_department ||
                              "—"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Contact</span>
                          <span className="font-medium text-gray-900">
                            {modalDelivery.contact_person || "—"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Type</span>
                          <span className="font-medium text-gray-900 capitalize">
                            {modalDelivery.delivery_type || "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Items table */}
                  {modalDelivery.DeliveryItems?.length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Box className="w-4 h-4 text-orange-500" />
                        <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                          Delivery Items ({modalDelivery.DeliveryItems.length})
                        </h4>
                      </div>
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">#</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Description</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Qty</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Photo</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {modalDelivery.DeliveryItems.map((item, i) => (
                              <tr key={item.id} className="hover:bg-gray-50/50">
                                <td className="px-4 py-3">
                                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-orange-100 text-orange-700 font-semibold text-xs">
                                    {i + 1}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {item.description || "—"}
                                </td>
                                <td className="px-4 py-3">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700">
                                    {item.quantity}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  {item.photo_url ? (
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={(e) => { e.stopPropagation(); openPreview(item.photo_url, `Item ${i + 1} — ${item.description || "Photo"}`, false); }}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                                      >
                                        <Eye className="w-3.5 h-3.5" /> View
                                      </button>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleDownload(item.photo_url, `item-${i + 1}-${item.description || "photo"}`); }}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 transition-colors"
                                      >
                                        <Download className="w-3.5 h-3.5" /> Download
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-gray-400 text-xs">—</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Documents */}
                  {modalDelivery.Documents?.length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="w-4 h-4 text-blue-500" />
                        <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                          Documents ({modalDelivery.Documents.length})
                        </h4>
                      </div>
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">#</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">File</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Type</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {modalDelivery.Documents.map((doc, i) => {
                              const ext = doc.file_url?.split(".").pop()?.toLowerCase();
                              const isPdf = ext === "pdf";
                              const isImg = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext);
                              const label = `Document ${i + 1}`;
                              return (
                                <tr key={doc.id} className="hover:bg-gray-50/50">
                                  <td className="px-4 py-3">
                                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-semibold text-xs">
                                      {i + 1}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                      {isPdf ? (
                                        <FileText className="w-4 h-4 text-red-500 shrink-0" />
                                      ) : (
                                        <Image className="w-4 h-4 text-green-500 shrink-0" />
                                      )}
                                      <span className="text-sm text-gray-700 font-medium">{label}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase ${isPdf ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
                                      }`}>
                                      {ext || "file"}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={(e) => { e.stopPropagation(); openPreview(doc.file_url, label, isPdf); }}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                                      >
                                        <Eye className="w-3.5 h-3.5" /> View
                                      </button>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleDownload(doc.file_url, `document-${i + 1}.${ext}`); }}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 transition-colors"
                                      >
                                        <Download className="w-3.5 h-3.5" /> Download
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}

            </div>{/* end scrollable body */}

            {/* ── Sticky footer ── */}
            <div className="flex justify-end px-6 py-4 border-t border-gray-200 bg-white rounded-b-lg shrink-0">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ═══════════════ PREVIEW MODAL ═══════════════ */}
      {preview && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[60]"
          onClick={() => setPreview(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl flex flex-col w-full max-w-3xl"
            style={{ maxHeight: "92vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Preview header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 shrink-0">
              <div className="flex items-center gap-2">
                {preview.isPdf ? (
                  <FileText className="w-4 h-4 text-red-500" />
                ) : (
                  <Image className="w-4 h-4 text-green-500" />
                )}
                <span className="text-sm font-semibold text-gray-900">{preview.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); handleDownload(preview.url.replace("https://hammsapi.bluai.ai", ""), preview.label); }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
                <button
                  onClick={() => setPreview(null)}
                  className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Preview body */}
            <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-4 min-h-0">
              {preview.isPdf ? (
                <iframe
                  src={preview.url}
                  className="w-full rounded border border-gray-200 bg-white"
                  style={{ height: "70vh" }}
                  title={preview.label}
                />
              ) : (
                <img
                  src={preview.url}
                  alt={preview.label}
                  className="max-w-full max-h-full object-contain rounded shadow"
                  style={{ maxHeight: "72vh" }}
                />
              )}
            </div>

            {/* Preview footer */}
            <div className="flex justify-end px-5 py-3 border-t border-gray-200 shrink-0">
              <button
                onClick={() => setPreview(null)}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {notification && (
        <div className="fixed bottom-4 right-4 z-50 animate-slideUp">
          <div
            className={`flex items-center justify-between px-4 py-3 rounded-lg shadow-lg min-w-[320px] ${notification.type === "error" ? "bg-red-600" : "bg-gray-900"
              }`}
          >
            <div className="flex items-center">
              {notification.type === "error" ? (
                <XCircle className="w-5 h-5 text-white mr-3" />
              ) : (
                <CheckCircle className="w-5 h-5 text-white mr-3" />
              )}
              <span className="text-white text-sm font-medium">
                {notification.message}
              </span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="ml-4 p-1 hover:bg-white/10 rounded-md transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}