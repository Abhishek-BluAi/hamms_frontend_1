"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table";
import {
  Edit2,
  Trash2,
  Plus,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Shield,
  X,
  AlertCircle,
  Loader2,
  CheckCircle,
  XCircle,
  Key,
} from "lucide-react";
import { getAllRoles, deleteRole } from "@/utils/api";
import { hasPermission } from "@/utils/permissions";

export default function RoleManagement() {
  const [roles, setRoles] = useState([]);
  const [totalRoles, setTotalRoles] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [sorting, setSorting] = useState([]);
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);
  const searchParams = useSearchParams();

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

    useEffect(() => {
      if (searchParams.get("refresh")) {
        setRefreshKey(prev => prev + 1);
      }
    }, [searchParams]);

  useEffect(() => {
    const fetchRoles = async () => {
      setLoading(true);
      try {
        const response = await getAllRoles({
          page: pagination.pageIndex + 1,
          limit: pagination.pageSize,
        });

        const rolesData = response.data.data.map((role) => ({
          ...role,
          permissions: role.Permissions || [],
        }));

        setRoles(rolesData);
        setTotalRoles(response.data.meta.total);
      } catch (err) {
        const errorMsg = err.response?.data?.message || "Failed to fetch roles";
        setError(errorMsg);
        showNotification(errorMsg, "error");
        console.error("Fetch roles error:", err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => fetchRoles(), 300);
    return () => clearTimeout(timer);
  }, [pagination.pageIndex, pagination.pageSize, refreshKey]);

  const handleDelete = (id, role) => {
    setSelectedRoleId(id);
    setSelectedRole(role);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedRoleId) return;

    try {
      await deleteRole(selectedRoleId);
      showNotification("Role deleted successfully", "success");

      // If last item on page was deleted, go to previous page
      if (roles.length === 1 && pagination.pageIndex > 0) {
        setPagination((prev) => ({
          ...prev,
          pageIndex: prev.pageIndex - 1,
        }));
      } else {
        // Force refetch of current page
        setRefreshKey(prev => prev + 1);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to delete role";
      showNotification(errorMsg, "error");
      console.error("Delete role error:", err);
    } finally {
      setShowDeleteModal(false);
      setSelectedRoleId(null);
      setSelectedRole(null);
    }
  };

  const columns = useMemo(
    () => [
      // Changed from "ID" to "Sr No" column
      {
        id: "col-srno",
        header: "Sr No",
        size: 80,
        cell: ({ row }) => {
          // Calculate sequential number based on current page and row index
          const srNo = pagination.pageIndex * pagination.pageSize + row.index + 1;
          return (
            <div className="font-medium text-gray-700 text-sm">
              {srNo}
            </div>
          );
        },
      },
      {
        id: "col-name",
        header: "Role Details",
        size: 280,
        cell: ({ row }) => {
          const role = row.original;
          return (
            <div className="min-w-0">
              <div className="font-medium text-gray-900 text-sm">
                {role.name}
                <span className="ml-2 text-xs font-normal text-gray-500">
                  (ID: {role.id})
                </span>
              </div>
              {role.description && (
                <div className="text-xs text-gray-500 mt-0.5 max-w-xs">
                  {role.description}
                </div>
              )}
            </div>
          );
        },
      },
      {
        id: "col-permissions",
        header: "Permissions",
        size: 400,
        cell: ({ row }) => {
          const permissions = row.original.permissions || [];

          if (permissions.length === 0) {
            return (
              <span className="text-gray-400 text-sm italic">
                No permissions
              </span>
            );
          }

          return (
            <div className="flex flex-wrap gap-1.5">
              {permissions.slice(0, 5).map((perm) => (
                <span
                  key={`perm-${perm.id}`}
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200"
                  title={perm.description || perm.name}
                >
                  <span>{perm.name}</span>
                </span> 
              ))}
              {permissions.length > 5 && (
                <span className="text-xs text-gray-500 self-center ml-1 font-medium">
                  +{permissions.length - 5}
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: "col-actions",
        header: "Actions",
        size: 100,
        cell: ({ row }) => (
          <div className="flex items-center space-x-1.5">
            {hasPermission("Role - Update") && (
              <button
                onClick={() =>
                  router.push(`/admin-portal/new-role?editId=${row.original.id}`)
                }
                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all duration-150 cursor-pointer"
                title="Edit Role"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            {hasPermission("Role - Delete") && (
              <button
                onClick={() => handleDelete(row.original.id, row.original)}
                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-all duration-150 cursor-pointer"
                title="Delete Role"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            {!hasPermission("Role - Update") && !hasPermission("Role - Delete") && (
              <span className="text-xs text-gray-400 italic">No access</span>
            )}
          </div>
        ),
      },
    ],
    [router, pagination.pageIndex, pagination.pageSize],
  );

  const table = useReactTable({
    data: roles,
    columns,

    state: {
      pagination,
      sorting,
    },

    onPaginationChange: setPagination,
    onSortingChange: setSorting,

    manualPagination: true, // ⭐ SERVER SIDE
    pageCount: Math.ceil(totalRoles / pagination.pageSize),

    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),

    autoResetPageIndex: false,
  });

  const start = pagination.pageIndex * pagination.pageSize + 1;
  const end = Math.min(start + roles.length - 1, totalRoles);

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
                  Role Management
                </h1>
                <p className="text-gray-600 mt-1">
                  Manage system roles and their permissions
                </p>
              </div>

              {hasPermission("Role - Create") && (
                <button
                  onClick={() => router.push("/admin-portal/new-role")}
                  className="inline-flex items-center px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Role
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
              <p className="mt-3 text-gray-600 font-medium">Loading roles...</p>
            </div>
          ) : roles.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Shield className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No roles found
              </h3>
              <p className="text-gray-600 mb-6">
                Get started by creating your first role
              </p>
              <button
                onClick={() => router.push("/admin-portal/new-role")}
                className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Role
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
                        className="hover:bg-gray-50/50 transition-colors"
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
                    <span className="font-semibold text-gray-900">
                      {totalRoles}
                    </span>{" "}
                    roles
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
      {showDeleteModal && selectedRole && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-50 rounded-md">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Delete Role
                  </h3>
                  <p className="text-sm text-gray-600">
                    This action cannot be undone
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedRole(null);
                }}
                className="p-1 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete the following role?
              </p>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="mb-3">
                  <p className="font-semibold text-gray-900 text-lg">
                    {selectedRole.name}
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      (ID: {selectedRole.id})
                    </span>
                  </p>
                  {selectedRole.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedRole.description}
                    </p>
                  )}
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>
                    • Permissions:{" "}
                    <span className="font-medium">
                      {selectedRole.permissions?.length || 0}
                    </span>
                  </p>
                  <p>
                    • All users assigned this role will lose these permissions
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedRole(null);
                }}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium cursor-pointer"
              >
                Delete Role
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