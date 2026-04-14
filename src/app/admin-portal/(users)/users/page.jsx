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
  Users,
  X,
  AlertCircle,
  Search,
  UserCog,
  SlidersHorizontal,
  Loader2,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
  User,
  Calendar,
  Shield,
  MoreHorizontal,
} from "lucide-react";
import { getAllUsers, deleteUser } from "@/utils/api";
import { hasPermission } from "@/utils/permissions";

export default function UserTable() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [notification, setNotification] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    role: "",
    status: "",
  });
  const [sorting, setSorting] = useState([]);
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
   const adminSession = JSON.parse(localStorage.getItem("adminSession") || "{}");
   const userSession = JSON.parse(localStorage.getItem("userSession") || "{}");
   
   const hasAdminAccess =
     !!adminSession.token ||
     (userSession.access_token && userSession.active_role !== "guard");
   
   if (!hasAdminAccess) {
     setError("Unauthorized access. Please log in as an administrator.");
     setLoading(false);
     return;
   }


    const fetchUsers = async () => {
      setLoading(true);
      try {
        const params = {
          page: pagination.pageIndex + 1,
          limit: pagination.pageSize,
        };

        // Add search parameter (use 'search' instead of 'email' for broader search)
        if (globalFilter) {
          params.search = globalFilter;
        }

        // Add role filter if active
        if (activeFilters.role) {
          params.role = activeFilters.role;
        }

        // Add status filter if active
        if (activeFilters.status) {
          params.is_active = activeFilters.status === "active";
        }

        const response = await getAllUsers(params);

        setUsers(response.data.data);
        setTotalUsers(response.data.meta.total);
        setError(null); // Clear any previous errors
      } catch (err) {
        const errorMsg = err.response?.data?.message || "Failed to fetch users";
        setError(errorMsg);
        showNotification(errorMsg, "error");
        console.error("Fetch users error:", err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => fetchUsers(), 300);
    return () => clearTimeout(timer);
  }, [
    pagination.pageIndex,
    pagination.pageSize,
    refreshKey,
    globalFilter,
    activeFilters,
  ]);

  useEffect(() => {
    // Reset to first page when filters or search change
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [globalFilter, activeFilters.role, activeFilters.status]);

  const handleDelete = (id, user) => {
    setSelectedUserId(id);
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedUserId) return;

    try {
      await deleteUser(selectedUserId);
      showNotification("User has been deleted successfully", "success");

      // If last item on page is deleted, move back a page
      if (users.length === 1 && pagination.pageIndex > 0) {
        setPagination((prev) => ({
          ...prev,
          pageIndex: prev.pageIndex - 1,
        }));
      } else {
        // Otherwise just refetch current page
        setRefreshKey((prev) => prev + 1);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to delete user"; 
      showNotification(errorMsg, "error");
      console.error("Delete user error:", err);
    } finally {
      setShowDeleteModal(false);
      setSelectedUserId(null);
      setSelectedUser(null);
    }
  };

  const columns = useMemo(
    () => [
      // New Sr No column (1, 2, 3...)
      {
        id: "col-srno",
        header: "Sr No",
        size: 80,
        cell: ({ row }) => {
          // Calculate sequential number based on current page and row index
          const srNo =
            pagination.pageIndex * pagination.pageSize + row.index + 1;
          return (
            <div className="font-medium text-gray-700 text-sm">{srNo}</div>
          );
        },
      },
      {
        id: "col-name",
        header: "User",
        accessorFn: (row) =>
          `${row.first_name ?? ""} ${row.last_name ?? ""} ${row.email ?? ""}`,
        cell: ({ row }) => {
          const user = row.original;
          const initials =
            `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase();

          return (
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 flex items-center justify-center">
                {initials ? (
                  <span className="text-blue-700 font-semibold text-sm">
                    {initials}
                  </span>
                ) : (
                  <User className="w-4 h-4 text-blue-600" />
                )}
              </div>
              <div className="min-w-0">
                <div className="font-medium text-gray-900 text-sm truncate">
                  {user.first_name} {user.last_name}
                  <span className="ml-2 text-xs font-normal text-gray-500">
                    (ID: {user.id})
                  </span>
                </div>
                <div className="text-xs text-gray-500 flex items-center mt-0.5 truncate">
                  <Mail className="w-3 h-3 mr-1.5" />
                  {user.email}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        id: "col-roles",
        header: "Roles",
        size: 240,
        cell: ({ row }) => {
          const roleNames = [
            ...new Set(row.original.Roles?.map((role) => role.name) || []),
          ];

          if (roleNames.length === 0) {
            return (
              <span className="text-gray-400 text-sm italic">No roles</span>
            );
          }

          return (
            <div className="flex flex-wrap gap-1.5">
              {roleNames.map((roleName) => (
                <span
                  key={`role-${roleName}`}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                >
                  {roleName}
                </span>
              ))}
            </div>
          );
        },
      },
      {
        id: "col-permissions",
        header: "Permissions",
        size: 240,
        cell: ({ row }) => {
          const uniquePermissions = [
            ...new Set(
              row.original.Roles?.flatMap(
                (role) => role.Permissions?.map((perm) => perm.name) || [],
              ) || [],
            ),
          ];

          if (uniquePermissions.length === 0) {
            return (
              <span className="text-gray-400 text-sm italic">
                No permissions
              </span>
            );
          }

          return (
            <div className="flex flex-wrap gap-1.5">
              {uniquePermissions.slice(0, 3).map((perm) => (
                <span
                  key={`perm-${perm}`}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200"
                >
                  {perm}
                </span>
              ))}
              {uniquePermissions.length > 3 && (
                <span className="text-xs text-gray-500 self-center ml-1 font-medium">
                  +{uniquePermissions.length - 3}
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: "col-phone",
        header: "Contact",
        accessorKey: "phone_number",
        cell: ({ row }) => (
          <div className="flex items-center text-gray-700">
            <Phone className="w-4 h-4 mr-2.5 text-gray-400" />
            <span className="font-medium text-sm">
              {row.original.phone_number || "—"}
            </span>
          </div>
        ),
      },
      {
        id: "col-shift",
        header: "Shift",
        size: 220,
        cell: ({ row }) => {
          const shift = row.original.Shift;

          if (!shift) {
            return (
              <span className="text-xs text-gray-400 italic">
                No shift assigned
              </span>
            );
          }

          return (
            <div className="text-sm">
              <div className="font-medium text-gray-900">{shift.name}</div>
              <div className="text-xs text-gray-500">
                {shift.start_time} – {shift.end_time}
              </div>
              <div className="text-[11px] text-gray-400">{shift.timezone}</div>
            </div>
          );
        },
      },
      {
        id: "col-active",
        header: "Status",
        accessorKey: "is_active",
        size: 120,
        cell: ({ row }) => (
          <div className="flex items-center">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                row.original.is_active
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-gray-50 text-gray-600 border border-gray-200"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full mr-2 ${row.original.is_active ? "bg-green-500" : "bg-gray-400"}`}
              ></span>
              {row.original.is_active ? "Active" : "Inactive"}
            </span>
          </div>
        ),
      },
      {
        id: "col-actions",
        header: "Actions",
        size: 120,
        cell: ({ row }) => (
          <div className="flex items-center space-x-1.5">
            {hasPermission("User - Update") && (
              <button
                onClick={() =>
                  router.push(`/admin-portal/new-user?editId=${row.original.id}`)
                }
                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all duration-150 cursor-pointer"
                title="Edit User"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            {hasPermission("User - Delete") && (
              <button
                onClick={() => handleDelete(row.original.id, row.original)}
                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-all duration-150 cursor-pointer"
                title="Delete User"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            {!hasPermission("User - Update") && !hasPermission("User - Delete") && (
              <span className="text-xs text-gray-400 italic">No access</span>
            )}
          </div>
        ),
      },
    ],
    [router, pagination.pageIndex, pagination.pageSize], // Added dependencies for proper calculation
  );

  const table = useReactTable({
    data: users,
    columns,
    state: {
      pagination,
      globalFilter,
      sorting,
    },
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,

    // 👇 SERVER-SIDE MODE
    manualPagination: true,

    pageCount: Math.ceil(totalUsers / pagination.pageSize),

    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),

    autoResetPageIndex: false,
  });

  const start = pagination.pageIndex * pagination.pageSize + 1;
  const end = Math.min(start + users.length - 1, totalUsers);

  const clearFilters = () => {
    setGlobalFilter("");
    setActiveFilters({ role: "", status: "" });
  };

  // Get unique roles for filter dropdown
  const uniqueRoles = useMemo(() => {
    const roles = new Set();
    users.forEach((user) => {
      user.Roles?.forEach((role) => roles.add(role.name));
    });
    return Array.from(roles).sort();
  }, [users]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-8xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-xs">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  User Management
                </h1>
                <p className="text-gray-600 mt-1">
                  Manage system users, roles, and permissions
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {hasPermission("Role - Read") && (
                  <button
                    onClick={() => router.push("/admin-portal/roles")}
                    className="inline-flex items-center px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-colors text-sm font-medium shadow-xs cursor-pointer"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Manage Roles
                  </button>
                )}
                {hasPermission("User - Create") && (
                  <button
                    onClick={() => router.push("/admin-portal/new-user")}
                    className="inline-flex items-center px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add New User
                  </button>
                )}
              </div>
            </div>

            {/* Search and Filters */}
            <div className="mt-6 space-y-4">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search users by name, email, or phone..."
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-sm"
                  />
                </div>

                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`inline-flex items-center justify-center px-4 py-2.5 border rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    showFilters || activeFilters.role || activeFilters.status
                      ? "bg-blue-50 border-blue-200 text-blue-700"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  Filters
                  {(activeFilters.role || activeFilters.status) && (
                    <span className="ml-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      1
                    </span>
                  )}
                </button>
              </div>

              {/* Filter Panel */}
              {showFilters && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-900">Filters</h3>
                    <button
                      onClick={clearFilters}
                      className="text-sm text-gray-600 hover:text-gray-900 hover:underline cursor-pointer"
                    >
                      Clear all
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Role
                      </label>
                      <select
                        value={activeFilters.role}
                        onChange={(e) =>
                          setActiveFilters((prev) => ({
                            ...prev,
                            role: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm cursor-pointer"
                      >
                        <option value="">All Roles</option>
                        {uniqueRoles.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Status
                      </label>
                      <select
                        value={activeFilters.status}
                        onChange={(e) =>
                          setActiveFilters((prev) => ({
                            ...prev,
                            status: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm cursor-pointer"
                      >
                        <option value="">All Status</option>
                        <option value="active">Active Only</option>
                        <option value="inactive">Inactive Only</option>
                      </select>
                    </div>
                  </div>
                </div>
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
              <p className="mt-3 text-gray-600 font-medium">Loading users...</p>
            </div>
          ) : table.getRowModel().rows.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No users found
              </h3>
              <p className="text-gray-600 mb-6">
                {globalFilter || activeFilters.role || activeFilters.status
                  ? "Try adjusting your search or filters"
                  : "Get started by adding your first user"}
              </p>
              <button
                onClick={() => router.push("/admin-portal/new-user")}
                className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New User
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
                          <td
                            key={cell.id}
                            className="px-6 py-4 whitespace-nowrap"
                          >
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
                  <p className="text-sm text-gray-600">
                    Showing{" "}
                    <span className="font-semibold text-gray-900">{start}</span>{" "}
                    to{" "}
                    <span className="font-semibold text-gray-900">{end}</span>{" "}
                    of{" "}
                    <span className="font-semibold text-gray-900">
                      {totalUsers}
                    </span>{" "}
                    users
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
                      {Array.from(
                        { length: Math.min(5, table.getPageCount()) },
                        (_, i) => {
                          const pageIndex = i;
                          return (
                            <button
                              key={i}
                              onClick={() => table.setPageIndex(pageIndex)}
                              className={`w-8 h-8 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                                table.getState().pagination.pageIndex ===
                                pageIndex
                                  ? "bg-blue-600 text-white"
                                  : "text-gray-700 hover:bg-gray-100"
                              }`}
                            >
                              {pageIndex + 1}
                            </button>
                          );
                        },
                      )}
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-50 rounded-md">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Delete User
                  </h3>
                  <p className="text-sm text-gray-600">
                    This action cannot be undone
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedUser(null);
                }}
                className="p-1 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete the following user?
              </p>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {selectedUser.first_name} {selectedUser.last_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {selectedUser.email}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      User ID: {selectedUser.id}
                    </p>
                  </div>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>• All associated data will be permanently removed</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedUser(null);
                }}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium cursor-pointer"
              >
                Delete User
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
