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
  Phone,
  Mail,
  MapPin,
  Building2,
  Users,
  Activity,
  UserCircle,
  Tag,
  AlertCircle,
  LogIn,
  LogOut,
} from "lucide-react";

import { getAdminAllVisits } from "@/utils/api";

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
  active: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  completed: "bg-slate-100 text-slate-600 border border-slate-200",
  pending: "bg-amber-50 text-amber-700 border border-amber-200",
  cancelled: "bg-red-50 text-red-700 border border-red-200",
};

const PURPOSE_LABELS = {
  "visiting-patient": "Visiting Patient",
  "delivery": "Delivery",
  "pickup": "Pickup",
  "meeting": "Meeting",
  "other": "Other",
};

const RELATIONSHIP_LABELS = {
  parent: "Parent",
  spouse: "Spouse",
  child: "Child",
  sibling: "Sibling",
  friend: "Friend",
  other: "Other",
};

const DURATION_LABELS = {
  "1-hour": "1 Hour",
  "2-hours": "2 Hours",
  "3-hours": "3 Hours",
  "full-day": "Full Day",
  "overnight": "Overnight",
};

/* ─────────────────── component ─────────────────── */
export default function VisitsReportTable() {
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
  const [selectedVisit, setSelectedVisit] = useState(null);

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
        const res = await getAdminAllVisits({
          page: pagination.pageIndex + 1,
          limit: pagination.pageSize,
        });
        setData(Array.isArray(res.data?.data) ? res.data.data : []);
        setTotal(res.data?.meta?.total ?? 0);
      } catch (err) {
        const msg = err.response?.data?.message || "Failed to fetch visits";
        setError(msg);
        showNotification(msg, "error");
        setData([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };

    fetchVisits();
  }, [pagination.pageIndex, pagination.pageSize]);

  /* ===== open modal ===== */
  const openDetails = (visit) => {
    setSelectedVisit(visit);
    setShowModal(true);
  };

  /* ===== columns ===== */
  const columns = useMemo(
    () => [
      {
        id: "col-srno",
        header: "Sr No",
        size: 80,
        cell: ({ row }) => (
          <div className="font-medium text-gray-700 text-sm">
            {pagination.pageIndex * pagination.pageSize + row.index + 1}
          </div>
        ),
      },
      {
        id: "col-visitor",
        header: "Visitor",
        size: 220,
        cell: ({ row }) => {
          const v = row.original.visitor;
          return (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="min-w-0">
                <div className="font-medium text-gray-900 text-sm truncate">
                  {v ? `${v.first_name} ${v.last_name}` : "—"}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {v?.phone || "—"}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        id: "col-purpose",
        header: "Purpose",
        size: 150,
        cell: ({ row }) => {
          const p = row.original.purpose;
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
              <Activity className="w-3.5 h-3.5" />
              {PURPOSE_LABELS[p] || p || "—"}
            </span>
          );
        },
      },
      {
        id: "col-patient",
        header: "Patient",
        size: 150,
        cell: ({ row }) => {
          const patientName = row.original.patient_name;
          return (
            <div className="flex items-center gap-2">
              <UserCircle className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-900">
                {patientName || "—"}
              </span>
            </div>
          );
        },
      },
      {
        id: "col-relationship",
        header: "Relationship",
        size: 120,
        cell: ({ row }) => {
          const rel = row.original.relationship;
          return (
            <span className="text-sm text-gray-900 capitalize">
              {RELATIONSHIP_LABELS[rel] || rel || "—"}
            </span>
          );
        },
      },
      {
        id: "col-duration",
        header: "Duration",
        size: 100,
        cell: ({ row }) => {
          const dur = row.original.visit_duration;
          return (
            <span className="text-sm text-gray-900">
              {DURATION_LABELS[dur] || dur || "—"}
            </span>
          );
        },
      },
      {
        id: "col-checkin",
        header: "Check In",
        size: 180,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <LogIn className="w-4 h-4 text-green-500 shrink-0" />
            <span className="text-sm text-gray-900">{fmt(row.original.checkin_time)}</span>
          </div>
        ),
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
                  Visits Management
                </h1>
                <p className="text-gray-600 mt-1">
                  Track and monitor all visitor check-ins and visits
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-blue-50 px-4 py-2 rounded-lg">
                  <span className="text-sm font-medium text-blue-700">
                    Total Visits: {total}
                  </span>
                </div>
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
              <p className="mt-3 text-gray-600 font-medium">Loading visits...</p>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No visits found</h3>
              <p className="text-gray-600">Visit records will appear here once visitors check in.</p>
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
                          className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${
                            table.getState().pagination.pageIndex === pg
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

      {/* ═══════════════ VISIT DETAILS MODAL ═══════════════ */}
      {showModal && selectedVisit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full flex flex-col" style={{ maxHeight: "90vh" }}>

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-50 rounded-md">
                  <Activity className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Visit Details
                  </h3>
                  <p className="text-sm text-gray-600">
                    Visit #{selectedVisit.id} • {fmtDate(selectedVisit.checkin_time)}
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

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 px-6 py-6">

              {/* Status badge */}
              <div className="mb-6">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium capitalize ${
                  STATUS_STYLES[selectedVisit.status] ?? "bg-gray-100 text-gray-600 border border-gray-200"
                }`}>
                  {selectedVisit.status}
                </span>
              </div>

              {/* Visitor summary */}
              {selectedVisit.visitor && (
                <div className="mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                  <div className="flex items-center gap-3 mb-3">
                    <User className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">
                      Visitor Information
                    </span>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                      <User className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">
                        {selectedVisit.visitor.first_name} {selectedVisit.visitor.last_name}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                        <div className="flex items-center gap-1.5 text-sm">
                          <Phone className="w-3.5 h-3.5 text-gray-500" />
                          <span className="text-gray-600">{selectedVisit.visitor.phone}</span>
                        </div>
                        {selectedVisit.visitor.email && (
                          <div className="flex items-center gap-1.5 text-sm">
                            <Mail className="w-3.5 h-3.5 text-gray-500" />
                            <span className="text-gray-600">{selectedVisit.visitor.email}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-sm">
                          <MapPin className="w-3.5 h-3.5 text-gray-500" />
                          <span className="text-gray-600">{selectedVisit.visitor.address || "—"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Visit details grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
                    Visit Information
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Purpose</span>
                      <span className="text-sm font-medium text-gray-900">
                        {PURPOSE_LABELS[selectedVisit.purpose] || selectedVisit.purpose}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Patient Name</span>
                      <span className="text-sm font-medium text-gray-900">
                        {selectedVisit.patient_name || "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Relationship</span>
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {RELATIONSHIP_LABELS[selectedVisit.relationship] || selectedVisit.relationship || "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Duration</span>
                      <span className="text-sm font-medium text-gray-900">
                        {DURATION_LABELS[selectedVisit.visit_duration] || selectedVisit.visit_duration || "—"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
                    Timeline
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <LogIn className="w-4 h-4 text-green-500" />
                      <div>
                        <p className="text-xs text-gray-500">Check In</p>
                        <p className="text-sm font-medium text-gray-900">
                          {fmt(selectedVisit.checkin_time)}
                        </p>
                      </div>
                    </div>
                    {selectedVisit.checkout_time && (
                      <div className="flex items-center gap-2">
                        <LogOut className="w-4 h-4 text-red-400" />
                        <div>
                          <p className="text-xs text-gray-500">Check Out</p>
                          <p className="text-sm font-medium text-gray-900">
                            {fmt(selectedVisit.checkout_time)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Company info */}
              <div className="border-t border-gray-200 pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Company Code</span>
                    <p className="font-medium text-gray-900 flex items-center gap-1">
                      <Building2 className="w-4 h-4" />
                      {selectedVisit.company_code || "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Visitor ID</span>
                    <p className="font-medium text-gray-900 flex items-center gap-1">
                      <Tag className="w-4 h-4" />
                      {selectedVisit.visitor_id}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
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

      {/* Toast notification */}
      {notification && (
        <div className="fixed bottom-4 right-4 z-50 animate-slideUp">
          <div
            className={`flex items-center justify-between px-4 py-3 rounded-lg shadow-lg min-w-[320px] ${
              notification.type === "error" ? "bg-red-600" : "bg-gray-900"
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