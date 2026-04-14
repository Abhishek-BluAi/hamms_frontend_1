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
  DoorOpen,
  X,
  AlertCircle,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { getAllGates, deleteGate } from "@/utils/api";
import { hasPermission } from "@/utils/permissions";

export default function GateManagement() {
  const [gates, setGates] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedGate, setSelectedGate] = useState(null);
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
    const fetchGates = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getAllGates({
          page: pagination.pageIndex + 1,
          limit: pagination.pageSize,
        });
        setGates(res.data.data);
        setTotal(res.data.meta.total);
      } catch (err) {
        const errorMsg = err.response?.data?.message || "Failed to fetch gates";
        setError(errorMsg);
        showNotification(errorMsg, "error");
        console.error("Fetch gates error:", err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => fetchGates(), 300);
    return () => clearTimeout(timer);
  }, [pagination.pageIndex, pagination.pageSize, refreshKey]);

  const handleDelete = (gate) => {
    setSelectedGate(gate);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedGate) return;

    try {
      await deleteGate(selectedGate.id);
      showNotification("Gate deleted successfully", "success");

      // If last item on page was deleted, go to previous page
      if (gates.length === 1 && pagination.pageIndex > 0) {
        setPagination((prev) => ({
          ...prev,
          pageIndex: prev.pageIndex - 1,
        }));
      } else {
        // Force refetch of current page
        setRefreshKey((prev) => prev + 1);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to delete gate";
      showNotification(errorMsg, "error");
      console.error("Delete gate error:", err);
    } finally {
      setShowDeleteModal(false);
      setSelectedGate(null);
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
          return <div className="font-medium text-gray-700 text-sm">{srNo}</div>;
        },
      },
      {
        id: "col-details",
        header: "Gate Details",
        size: 350,
        cell: ({ row }) => {
          const gate = row.original;
          return (
            <div className="min-w-0">
              <div className="font-medium text-gray-900 text-sm">
                {gate.name}
                <span className="ml-2 text-xs font-normal text-gray-500">
                  (ID: {gate.id})
                </span>
              </div>
              {gate.description && (
                <div className="text-xs text-gray-500 mt-0.5 max-w-md">
                  {gate.description}
                </div>
              )}
            </div>
          );
        },
      },
      {
        id: "col-status",
        header: "Status",
        size: 120,
        cell: ({ row }) => (
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
              row.original.is_active
                ? "bg-green-100 text-green-700 border border-green-200"
                : "bg-gray-100 text-gray-500 border border-gray-200"
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
          <div className="flex items-center space-x-1.5">
            {hasPermission("Gate - Update") && (
              <button
                onClick={() =>
                  router.push(`/admin-portal/new-gate?editId=${row.original.id}`)
                }
                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all duration-150 cursor-pointer"
                title="Edit Gate"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            {hasPermission("Gate - Delete") && (
              <button
                onClick={() => handleDelete(row.original)}
                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-all duration-150 cursor-pointer"
                title="Delete Gate"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            {!hasPermission("Gate - Update") && !hasPermission("Gate - Delete") && (
              <span className="text-xs text-gray-400 italic">No access</span>
            )}
          </div>
        ),
      },
    ],
    [pagination.pageIndex, pagination.pageSize, router]
  );

  const table = useReactTable({
    data: gates,
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
  const end = Math.min(start + gates.length - 1, total);

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
                  Gate Management
                </h1>
                <p className="text-gray-600 mt-1">
                  Manage entry & exit gates
                </p>
              </div>

              {hasPermission("Gate - Create") && (
                <button
                  onClick={() => router.push("/admin-portal/new-gate")}
                  className="inline-flex items-center px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Gate
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
              <p className="mt-3 text-gray-600 font-medium">Loading gates...</p>
            </div>
          ) : gates.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <DoorOpen className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No gates found
              </h3>
              <p className="text-gray-600 mb-6">
                Get started by creating your first gate
              </p>
              <button
                onClick={() => router.push("/admin-portal/new-gate")}
                className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Gate
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
                    gates
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
      {showDeleteModal && selectedGate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-50 rounded-md">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Delete Gate
                  </h3>
                  <p className="text-sm text-gray-600">
                    This action cannot be undone
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedGate(null);
                }}
                className="p-1 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete the following gate?
              </p>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="mb-3">
                  <p className="font-semibold text-gray-900 text-lg">
                    {selectedGate.name}
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      (ID: {selectedGate.id})
                    </span>
                  </p>
                  {selectedGate.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedGate.description}
                    </p>
                  )}
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>
                    • Status:{" "}
                    <span className="font-medium">
                      {selectedGate.is_active ? "Active" : "Inactive"}
                    </span>
                  </p>
                  <p>• This will permanently remove the gate from the system</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedGate(null);
                }}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium cursor-pointer"
              >
                Delete Gate
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