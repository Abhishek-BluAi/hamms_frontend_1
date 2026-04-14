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
  Users,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  ChevronUp,
  ChevronDown,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Hash,
  Building2,
  VenusAndMars,
  Cake,
  Eye,
} from "lucide-react";

import { getAdminAllVisitors } from "@/utils/api";

/* ─────────────────── helpers ─────────────────── */
const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

const GENDER_STYLES = {
  male: "bg-blue-50 text-blue-700 border border-blue-200",
  female: "bg-pink-50 text-pink-700 border border-pink-200",
  other: "bg-purple-50 text-purple-700 border border-purple-200",
};

/* ─────────────────── component ─────────────────── */
export default function VisitorsReportTable() {
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
  const [selectedVisitor, setSelectedVisitor] = useState(null);

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  /* ===== fetch ===== */
  useEffect(() => {
    const fetchVisitors = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getAdminAllVisitors({
          page: pagination.pageIndex + 1,
          limit: pagination.pageSize,
        });
        setData(Array.isArray(res.data?.data) ? res.data.data : []);
        setTotal(res.data?.meta?.total ?? 0);
      } catch (err) {
        const msg = err.response?.data?.message || "Failed to fetch visitors";
        setError(msg);
        showNotification(msg, "error");
        setData([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };

    fetchVisitors();
  }, [pagination.pageIndex, pagination.pageSize]);

  /* ===== open modal ===== */
  const openDetails = (visitor) => {
    setSelectedVisitor(visitor);
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
        size: 250,
        cell: ({ row }) => {
          const v = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="min-w-0">
                <div className="font-medium text-gray-900 text-sm truncate">
                  {v.first_name} {v.last_name}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  ID: {v.id}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        id: "col-contact",
        header: "Contact",
        size: 200,
        cell: ({ row }) => {
          const v = row.original;
          return (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-sm">
                <Phone className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-gray-900">{v.phone || "—"}</span>
              </div>
              {v.email && (
                <div className="flex items-center gap-1.5 text-sm">
                  <Mail className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-gray-900 truncate">{v.email}</span>
                </div>
              )}
            </div>
          );
        },
      },
      {
        id: "col-gender",
        header: "Gender",
        size: 100,
        cell: ({ row }) => {
          const g = row.original.gender;
          return (
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                GENDER_STYLES[g] ?? "bg-gray-100 text-gray-600 border border-gray-200"
              }`}
            >
              <VenusAndMars className="w-3 h-3 mr-1" />
              {g || "—"}
            </span>
          );
        },
      },
      {
        id: "col-dob",
        header: "Date of Birth",
        size: 120,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Cake className="w-4 h-4 text-purple-500 shrink-0" />
            <span className="text-sm text-gray-900">{fmtDate(row.original.dob)}</span>
          </div>
        ),
      },
      {
        id: "col-address",
        header: "Address",
        size: 250,
        cell: ({ row }) => (
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
            <span className="text-sm text-gray-900 line-clamp-2">
              {row.original.address || "—"}
            </span>
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
                  Visitors Management
                </h1>
                <p className="text-gray-600 mt-1">
                  View and manage all registered visitors
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-blue-50 px-4 py-2 rounded-lg">
                  <span className="text-sm font-medium text-blue-700">
                    Total Visitors: {total}
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
              <p className="mt-3 text-gray-600 font-medium">Loading visitors...</p>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No visitors found</h3>
              <p className="text-gray-600">Visitors will appear here once they register.</p>
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
                    <span className="font-semibold text-gray-900">{total}</span> visitors
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

      {/* ═══════════════ VISITOR DETAILS MODAL ═══════════════ */}
      {showModal && selectedVisitor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full flex flex-col" style={{ maxHeight: "90vh" }}>

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-50 rounded-md">
                  <User className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Visitor Details
                  </h3>
                  <p className="text-sm text-gray-600">
                    ID: #{selectedVisitor.id}
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

              {/* Visitor basic info */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
                  <User className="w-8 h-8 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {selectedVisitor.first_name} {selectedVisitor.last_name}
                  </h2>
                  <p className="text-sm text-gray-600">
                    Visitor since {fmtDate(selectedVisitor.created_at) || "—"}
                  </p>
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Personal Information */}
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
                    Personal Information
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <VenusAndMars className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-900 capitalize">
                        {selectedVisitor.gender || "—"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Cake className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-900">
                        {fmtDate(selectedVisitor.dob)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
                    Contact Information
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-900">
                        {selectedVisitor.phone || "—"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-900">
                        {selectedVisitor.email || "—"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Company Information */}
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 md:col-span-2">
                  <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
                    Company & Address
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-900">
                        {selectedVisitor.company_code || "—"}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-900">
                        {selectedVisitor.address || "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional metadata */}
              <div className="border-t border-gray-200 pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Created At</span>
                    <p className="font-medium text-gray-900">
                      {fmtDate(selectedVisitor.created_at) || "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Last Updated</span>
                    <p className="font-medium text-gray-900">
                      {fmtDate(selectedVisitor.updated_at) || "—"}
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