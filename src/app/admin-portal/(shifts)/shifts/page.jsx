"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
} from "@tanstack/react-table";
import {
  Edit2,
  Trash2,
  Plus,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  X,
  AlertCircle,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { getAllShifts, deleteShift } from "@/utils/api";
import { hasPermission } from "@/utils/permissions";

export default function ShiftManagement() {
  const [shifts, setShifts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  const [sorting, setSorting] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    if (searchParams.get("refresh")) {
      setRefreshKey((prev) => prev + 1);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchShifts = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getAllShifts({
          page: pagination.pageIndex + 1,
          limit: pagination.pageSize,
        });
        setShifts(res.data.data);
        setTotal(res.data.meta.total);
      } catch (err) {
        const errorMsg = err.response?.data?.message || "Failed to fetch shifts";
        setError(errorMsg);
        showNotification(errorMsg, "error");
        console.error("Fetch shifts error:", err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => fetchShifts(), 300);
    return () => clearTimeout(timer);
  }, [pagination.pageIndex, pagination.pageSize, refreshKey]);

  const handleDelete = (shift) => {
    setSelectedShift(shift);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedShift) return;

    try {
      await deleteShift(selectedShift.id);
      showNotification("Shift deleted successfully", "success");

      // If last item on page was deleted, go to previous page
      if (shifts.length === 1 && pagination.pageIndex > 0) {
        setPagination((prev) => ({
          ...prev,
          pageIndex: prev.pageIndex - 1,
        }));
      } else {
        // Force refetch of current page
        setRefreshKey((prev) => prev + 1);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to delete shift";
      showNotification(errorMsg, "error");
      console.error("Delete shift error:", err);
    } finally {
      setShowDeleteModal(false);
      setSelectedShift(null);
    }
  };

  const columns = useMemo(
  () => [
    {
      id: "col-srno",
      header: "Sr No",
      size: 80,
      cell: ({ row }) => {
        const srNo =
          pagination.pageIndex * pagination.pageSize + row.index + 1;
        return <div className="text-gray-900 font-medium">{srNo}</div>;
      },
    },
    {
      id: "col-details",
      header: "Shift Details",
      size: 250,
      cell: ({ row }) => {
        const shift = row.original;
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-1">
                <div className="font-medium text-gray-900 text-sm">
                  {shift.name}
                  <span className="ml-2 text-xs font-normal text-gray-500">
                    (ID: {shift.id})
                  </span>
                </div>
              </div>
          </div>
        );
      },
    },
    {
      id: "col-timing",
      header: "Shift Timing",
      size: 200,
      cell: ({ row }) => {
        const shift = row.original;
        return (
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <div className="text-sm text-gray-900">
              {shift.start_time} → {shift.end_time}
            </div>
          </div>
        );
      },
    },
    {
      id: "col-timezone",
      header: "Timezone",
      size: 200,
      cell: ({ row }) => (
        <div className="text-sm text-gray-700">
          {row.original.timezone || "Not set"}
        </div>
      ),
    },
    {
      id: "col-status",
      header: "Status",
      size: 120,
      cell: ({ row }) => (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
            row.original.is_active
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {row.original.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      id: "col-actions",
      header: "Actions",
      size: 100,
      cell: ({ row }) => (
        <div className="flex items-center space-x-1">
          {hasPermission("Shift - Update") && (
            <div
              onClick={() =>
                router.push(`/admin-portal/new-shift?editId=${row.original.id}`)
              }
              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all duration-150 cursor-pointer"
              title="Edit Shift"
            >
              <Edit2 className="w-4 h-4" />
            </div>
          )}
          {hasPermission("Shift - Delete") && (
            <div
              onClick={() => handleDelete(row.original)}
              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-all duration-150 cursor-pointer"
              title="Delete Shift"
            >
              <Trash2 className="w-4 h-4" />
            </div>
          )}
          {!hasPermission("Shift - Update") && !hasPermission("Shift - Delete") && (
            <span className="text-xs text-gray-400 italic">No access</span>
          )}
        </div>
      ),
    },
  ],
  [pagination.pageIndex, pagination.pageSize, router]
);
  const table = useReactTable({
    data: shifts,
    columns,
    state: {
      pagination,
      sorting,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    manualPagination: true,
    pageCount: Math.ceil(total / pagination.pageSize),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    autoResetPageIndex: false,
  });

  const start = pagination.pageIndex * pagination.pageSize + 1;
  const end = Math.min(start + shifts.length - 1, total);

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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-8xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-xs">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Shift Management
                </h1>
                <p className="text-gray-600 mt-1">
                  Manage work shifts and schedules
                </p>
              </div>

              {hasPermission("Shift - Create") && (
                <button
                  onClick={() => router.push("/admin-portal/new-shift")}
                  className="inline-flex items-center px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Shift
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5 shrink-0" />
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
              <p className="mt-3 text-gray-600 font-medium">Loading shifts...</p>
            </div>
          ) : shifts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Clock className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No shifts found
              </h3>
              <p className="text-gray-600 mb-6">
                Get started by creating your first shift
              </p>
              <button
                onClick={() => router.push("/admin-portal/new-shift")}
                className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Shift
              </button>
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
                                  header.getContext()
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
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="px-6 py-4">
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedShift && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-50 rounded-md">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Delete Shift
                  </h3>
                  <p className="text-sm text-gray-600">
                    This action cannot be undone
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedShift(null);
                }}
                className="p-1 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete the following shift?
              </p>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="mb-3">
                  <p className="font-semibold text-gray-900 text-lg">
                    {selectedShift.name}
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      (ID: {selectedShift.id})
                    </span>
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedShift.start_time} → {selectedShift.end_time}
                  </p>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>
                    • Timezone:{" "}
                    <span className="font-medium">
                      {selectedShift.timezone || "Not set"}
                    </span>
                  </p>
                  <p>
                    • Status:{" "}
                    <span className="font-medium">
                      {selectedShift.is_active ? "Active" : "Inactive"}
                    </span>
                  </p>
                  <p>• This will permanently remove the shift from the system</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedShift(null);
                }}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium cursor-pointer"
              >
                Delete Shift
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