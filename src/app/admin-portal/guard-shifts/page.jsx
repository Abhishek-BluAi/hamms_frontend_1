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
  DoorOpen,
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  Shield,
  ChevronUp,
  ChevronDown,
  CheckCircle,
  XCircle,
} from "lucide-react";

import { getGuardShiftHistory, getGuardShiftSessions } from "@/utils/api";

export default function GuardShiftTable() {
  /* ================= STATE ================= */
  const [data, setData] = useState([]); // summary rows
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const [sorting, setSorting] = useState([]);

  // modal
  const [showModal, setShowModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [sessions, setSessions] = useState([]); // ALWAYS ARRAY
  const [sessionsLoading, setSessionsLoading] = useState(false);

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  /* ================= FETCH SUMMARY ================= */
  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getGuardShiftHistory({
          page: pagination.pageIndex + 1,
          limit: pagination.pageSize,
        });

        setData(Array.isArray(res.data?.data) ? res.data.data : []);
        setTotal(res.data?.meta?.total ?? 0);
      } catch (err) {
        const errorMsg =
          err.response?.data?.message || "Failed to fetch guard shifts";
        setError(errorMsg);
        showNotification(errorMsg, "error");
        setData([]);
        setTotal(0);
        console.error("Fetch guard shifts error:", err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => fetchSummary(), 300);
    return () => clearTimeout(timer);
  }, [pagination.pageIndex, pagination.pageSize]);

  /* ================= OPEN MODAL ================= */
  const openDetails = async (row) => {
    setSelectedRow(row);
    setShowModal(true);
    setSessions([]);
    setSessionsLoading(true);

    try {
      const res = await getGuardShiftSessions({
        user_id: row.user_id,
        shift_date: row.shift_date,
      });

      setSessions(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      setSessions([]);
      showNotification("Failed to load session details", "error");
      console.error("Fetch sessions error:", err);
    } finally {
      setSessionsLoading(false);
    }
  };

  /* ================= COLUMNS ================= */
  const columns = useMemo(
    () => [
      {
        id: "col-srno",
        header: "Sr No",
        size: 80,
        cell: ({ row }) => {
          const srNo =
            pagination.pageIndex * pagination.pageSize + row.index + 1;
          return (
            <div className="font-medium text-gray-700 text-sm">{srNo}</div>
          );
        },
      },
      {
        id: "col-guard",
        header: "Guard Details",
        size: 280,
        cell: ({ row }) => {
          const u = row.original.User ?? {};
          return (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <div className="font-medium text-gray-900 text-sm">
                  {u.first_name || "—"} {u.last_name || ""}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {u.email || "—"}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        id: "col-gate",
        header: "Gate",
        size: 150,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gray-100 rounded-md">
              <DoorOpen className="w-4 h-4 text-gray-600" />
            </div>
            <span className="text-sm text-gray-900 font-medium">
              {row.original.Gate?.name || "—"}
            </span>
          </div>
        ),
      },
      {
        id: "col-date",
        header: "Shift Date",
        size: 150,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-700">
              {row.original.shift_date}
            </span>
          </div>
        ),
      },
      {
        id: "col-checkin",
        header: "First Check-In",
        size: 180,
        cell: ({ row }) => (
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-green-500" />
              <span className="text-sm text-gray-900 font-medium">
                {row.original.first_checkin_time || "—"}
              </span>
            </div>
            {row.original.session_count > 1 && (
              <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                +{row.original.session_count - 1} more sessions
              </span>
            )}
          </div>
        ),
      },
      {
        id: "col-checkout",
        header: "Last Check-Out",
        size: 150,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-red-500" />
            <span className="text-sm text-gray-900 font-medium">
              {row.original.last_checkout_time || "—"}
            </span>
          </div>
        ),
      },
      {
        id: "col-status",
        header: "Status",
        size: 120,
        cell: ({ row }) => {
          const completed = !!row.original.last_checkout;
          return (
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                completed
                  ? "bg-green-100 text-green-700 border border-green-200"
                  : "bg-blue-100 text-blue-700 border border-blue-200"
              }`}
            >
              {completed ? "Completed" : "Active"}
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

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const currentPage = table.getState().pagination.pageIndex;
    const totalPages = table.getPageCount();

    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i);
    }

    if (currentPage < 3) {
      return [0, 1, 2, 3, 4];
    }

    if (currentPage > totalPages - 4) {
      return [
        totalPages - 5,
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
      ];
    }

    return [
      currentPage - 2,
      currentPage - 1,
      currentPage,
      currentPage + 1,
      currentPage + 2,
    ];
  };

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-8xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-xs">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Guard Shift History
                </h1>
                <p className="text-gray-600 mt-1">
                  View and manage guard shift records and sessions
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <XCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-gray-900">{error}</p>
                <p className="text-sm text-gray-600 mt-1">
                  Please check your permissions and try again
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Table Container */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
              <p className="mt-3 text-gray-600 font-medium">
                Loading guard shifts...
              </p>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Shield className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No shift records found
              </h3>
              <p className="text-gray-600 mb-6">
                Guard shift history will appear here once shifts are recorded
              </p>
            </div>
          ) : (
            <>
              {/* Table Stats */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600"></p>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600">
                      Rows per page:
                    </span>
                    <select
                      value={table.getState().pagination.pageSize}
                      onChange={(e) =>
                        table.setPageSize(Number(e.target.value))
                      }
                      className="px-3 py-1.5 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    >
                      {[5, 10, 20, 50].map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
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
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
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
                  {/* Left text */}
                  <p className="text-sm text-gray-600">
                    Showing{" "}
                    <span className="font-semibold text-gray-900">{start}</span>{" "}
                    to{" "}
                    <span className="font-semibold text-gray-900">{end}</span>{" "}
                    of{" "}
                    <span className="font-semibold text-gray-900">{total}</span>{" "}
                    shifts
                  </p>

                  {/* Right pagination controls */}
                  <div className="flex items-center space-x-2">
                    {/* Prev Button */}
                    <button
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                      className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {/* Page Numbers */}
                    <div className="flex items-center space-x-1">
                      {getPageNumbers().map((pageNumber) => (
                        <button
                          key={pageNumber}
                          onClick={() => table.setPageIndex(pageNumber)}
                          className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${
                            table.getState().pagination.pageIndex === pageNumber
                              ? "bg-blue-600 text-white"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          {pageNumber + 1}
                        </button>
                      ))}
                    </div>

                    {/* Next Button */}
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

      {/* ================= SESSION DETAILS MODAL ================= */}
      {showModal && selectedRow && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-50 rounded-md">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Session Details
                  </h3>
                  <p className="text-sm text-gray-600">
                    {selectedRow.shift_date} • {selectedRow.Gate?.name || "—"}
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

            {/* Guard Info */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-base">
                    {selectedRow.User?.first_name || "—"}{" "}
                    {selectedRow.User?.last_name || ""}
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedRow.User?.email || "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Sessions Table */}
            {sessionsLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                <p className="mt-3 text-gray-600 font-medium">
                  Loading sessions...
                </p>
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <Clock className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No sessions found
                </h3>
                <p className="text-gray-600">
                  No check-in/check-out sessions recorded for this shift
                </p>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Session
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Check-In Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Check-Out Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Duration
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sessions.map((s, i) => (
                      <tr key={s.id} className="hover:bg-gray-50/50">
                        {/* Session # */}
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm">
                            {i + 1}
                          </span>
                        </td>

                        {/* Check-In */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-green-500" />
                            <span className="text-sm font-medium text-gray-900">
                              {s.actual_start_time}
                            </span>
                          </div>
                        </td>

                        {/* Check-Out */}
                        <td className="px-6 py-4">
                          {s.actual_end_time ? (
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-red-500" />
                              <span className="text-sm font-medium text-gray-900">
                                {s.actual_end_time}
                              </span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                              Active
                            </span>
                          )}
                        </td>

                        {/* Duration */}
                        <td className="px-6 py-4">
                          {s.duration_minutes !== null ? (
                            <span className="text-sm text-gray-700">
                              {Math.floor(s.duration_minutes / 60)}h{" "}
                              {s.duration_minutes % 60}m
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Close Button */}
            <div className="flex justify-end mt-6">
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

      {/* Notification Toast */}
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
