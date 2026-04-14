"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  User,
  Eye,
  EyeOff,
  Loader2,
  X,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { getAllRoles, getUserById, createUser, updateUser, getAllShifts } from "@/utils/api";

export default function CreateUser() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("editId");
  const isEdit = !!editId;

  const [formData, setFormData] = useState({
    email: "",
    first_name: "",
    last_name: "",
    roleIds: [],
    phone: "",
    shift_id: "",
    is_active: true,
    password: "",
  });
  const [roles, setRoles] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [notification, setNotification] = useState(null);
  const [shifts, setShifts] = useState([]);

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const getToken = () => {
  const adminSession = JSON.parse(
    localStorage.getItem("adminSession") || "{}"
  );

  const userSession = JSON.parse(
    localStorage.getItem("userSession") || "{}"
  );

  return (
    adminSession.token ||      // admin login
    userSession.access_token || // user → admin/manager
    null
  );
};


  useEffect(() => {
    const token = getToken();
    if (!token) {
      showNotification(
        "Authentication required. Please log in to manage users.",
        "error",
      );
      return;
    }

    const fetchRoles = async () => {
      try {
        const res = await getAllRoles();
        console.log("Roles API response:", res);
        setRoles(res.data?.data || res.data || []);
      } catch (err) {
        console.error("Error fetching roles:", err);
        showNotification("Failed to fetch roles", "error");
      }
    };

    const fetchUserData = async () => {
      if (isEdit && editId) {
        try {
          setLoading(true);
          const response = await getUserById(editId);
          console.log("User API response:", response);

          const user = response.data?.data;

          if (!user) {
            throw new Error("Invalid user data received");
          }

          const userRoles = user.Roles || user.roles || [];
          const roleIds = userRoles
            .map((role) => role.id)
            .filter((id) => id != null)
            .map((id) => Number(id));

          console.log("User roles:", userRoles);
          console.log("Extracted role IDs:", roleIds);

          setFormData({
            email: user.email || "",
            first_name: user.first_name || "",
            last_name: user.last_name || "",
            roleIds: roleIds,
            phone: user.phone_number || user.phone || "",
            shift_id: user.shift_id || "",
            is_active: user.is_active !== undefined ? user.is_active : true,
            password: "",
          });

          console.log("Form data set:", {
            email: user.email || "",
            first_name: user.first_name || "",
            last_name: user.last_name || "",
            roleIds: roleIds,
            phone: user.phone_number || user.phone || "",
            is_active: user.is_active !== undefined ? user.is_active : true,
          });
        } catch (err) {
          console.error("Error fetching user data:", err);
          showNotification("Failed to fetch user data", "error");
        } finally {
          setLoading(false);
        }
      }
    };

    const fetchShifts = async () => {
  try {
    const res = await getAllShifts({ is_active: true });
    setShifts(res.data?.data || []);
  } catch (err) {
    showNotification("Failed to fetch shifts", "error");
  }
};


    fetchRoles();
    fetchShifts();
    fetchUserData();
  }, [isEdit, editId]);

  useEffect(() => {
    console.log("Current formData:", formData);
  }, [formData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "roleIds") {
      const id = Number(value);

      setFormData((prev) => ({
        ...prev,
        roleIds: checked
          ? [...prev.roleIds, id]
          : prev.roleIds.filter((rid) => rid !== id),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "Invalid email";
    if (!formData.first_name) newErrors.first_name = "First name is required";
    if (!formData.last_name) newErrors.last_name = "Last name is required";
    if (!formData.phone) newErrors.phone = "Phone is required";
    if (!formData.shift_id) { newErrors.shift_id = "Shift is required";}

    else if (!/^[\d\s+\-()]{10,}$/.test(formData.phone))
      newErrors.phone = "Invalid phone number";
    if (!isEdit && !formData.password)
      newErrors.password = "Password is required";
    else if (formData.password && formData.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";
    if (formData.roleIds.length === 0)
      newErrors.roleIds = "At least one role is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }

    const token = getToken();
    if (!token) {
      showNotification("Session expired. Please log in again.", "error");
      setIsSubmitting(false);
      return;
    }

    try {
      const submitData = {
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        roleIds: formData.roleIds,
        phone_number: formData.phone,
        shift_id: Number(formData.shift_id),
        is_active: formData.is_active,
      };

      if (formData.password) {
        submitData.password = formData.password;
      }

      console.log("Submitting data:", submitData);

      if (isEdit) {
        await updateUser(editId, submitData);
        showNotification("User updated successfully!", "success");
      } else {
        await createUser(submitData);
        showNotification("User created successfully!", "success");
      }

      setTimeout(() => router.push("/admin-portal/users?refresh=1"), 500);
    } catch (err) {
      console.error("Submission error:", err);
      showNotification(
        isEdit
          ? "Failed to update user. Please try again."
          : "Failed to create user. Please try again.",
        "error",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-3xl w-full p-6 bg-white shadow-sm rounded-lg border border-slate-200 flex justify-center">
          <Loader2 className="animate-spin h-6 w-6 text-indigo-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-3xl w-full bg-white shadow-sm rounded-lg border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center mr-3">
              <User className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                {isEdit ? "Edit User" : "Create New User"}
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                {isEdit ? "Update user details" : "Add a new user"}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-5">
            {/* Name & Contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* First Name */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 text-sm border rounded-md text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    errors.first_name
                      ? "border-red-300 bg-red-50"
                      : "border-slate-300"
                  }`}
                  placeholder="John"
                  disabled={loading}
                />
                {errors.first_name && (
                  <p className="mt-1 text-xs text-red-600 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {errors.first_name}
                  </p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 text-sm border rounded-md text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    errors.last_name
                      ? "border-red-300 bg-red-50"
                      : "border-slate-300"
                  }`}
                  placeholder="Doe"
                  disabled={loading}
                />
                {errors.last_name && (
                  <p className="mt-1 text-xs text-red-600 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {errors.last_name}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 text-sm border rounded-md text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    errors.email
                      ? "border-red-300 bg-red-50"
                      : "border-slate-300"
                  }`}
                  placeholder="user@example.com"
                  disabled={loading}
                  autoComplete="off"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 text-sm border rounded-md text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    errors.phone
                      ? "border-red-300 bg-red-50"
                      : "border-slate-300"
                  }`}
                  placeholder="+1 (123) 456-7890"
                  disabled={loading}
                />
                {errors.phone && (
                  <p className="mt-1 text-xs text-red-600 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {errors.phone}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Password {!isEdit && <span className="text-red-500">*</span>}
                  {isEdit && (
                    <span className="text-xs text-slate-500 font-normal ml-1.5">
                      (Leave blank to keep unchanged)
                    </span>
                  )}
                </label>
                <div className="relative max-w-md">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 pr-10 text-sm border rounded-md text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.password
                        ? "border-red-300 bg-red-50"
                        : "border-slate-300"
                    }`}
                    placeholder="••••••••"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-600 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {errors.password}
                  </p>
                )}
              </div>
            </div>

            {/* Roles */}
            <div className="pt-4 border-t border-slate-200">
              <label className="block text-xs font-medium text-slate-700 mb-2">
                Roles <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {roles.map((role) => {
                  const roleIdNum = Number(role.id);
                  const isChecked = formData.roleIds.includes(roleIdNum);

                  return (
                    <label
                      key={`role-${role.id}`}
                      className={`flex items-center p-2 border rounded-md cursor-pointer transition-all ${
                        isChecked
                          ? "bg-indigo-50 border-indigo-500"
                          : "bg-white border-slate-300 hover:border-slate-400"
                      }`}
                    >
                      <input
                        type="checkbox"
                        name="roleIds"
                        value={role.id}
                        checked={isChecked}
                        onChange={handleChange}
                        className="h-3.5 w-3.5 text-indigo-600 focus:ring-2 focus:ring-indigo-500 border-slate-300 rounded"
                        disabled={loading}
                      />
                      <span
                        className={`ml-2 text-xs font-medium ${
                          isChecked ? "text-indigo-900" : "text-slate-700"
                        }`}
                      >
                        {role.name}
                      </span>
                    </label>
                  );
                })}
              </div>
              {errors.roleIds && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {errors.roleIds}
                </p>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200">
  <label className="block text-xs font-medium text-slate-700 mb-1.5">
    Shift <span className="text-red-500">*</span>
  </label>

  <select
    name="shift_id"
    value={formData.shift_id}
    onChange={handleChange}
    className="w-full px-3 py-2 text-sm border rounded-md border-slate-300 focus:ring-2 focus:ring-indigo-500"
  >
    <option value="">Select shift</option>
    {shifts.map((shift) => (
      <option key={shift.id} value={shift.id}>
        {shift.name} ({shift.start_time} – {shift.end_time})
      </option>
    ))}
  </select>

  {errors.shift_id && (
    <p className="mt-1 text-xs text-red-600 flex items-center">
      <AlertCircle className="w-3 h-3 mr-1" />
      {errors.shift_id}
    </p>
  )}
</div>


            {/* Active Status */}
            <div className="pt-4 border-t border-slate-200">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="h-3.5 w-3.5 text-indigo-600 focus:ring-2 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                  id="active-checkbox"
                  disabled={loading}
                />
                <span className="ml-2 text-xs font-medium text-slate-900">
                  Active User
                </span>
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-2.5 pt-5 mt-5 border-t border-slate-200">
            <button
              type="button"
              onClick={() => router.push("/admin-portal/users")}
              className="px-4 py-2 border border-slate-300 rounded-md text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || loading}
              className={`px-4 py-2 rounded-md text-xs font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 inline-flex items-center justify-center min-w-[120px] cursor-pointer ${
                isSubmitting || loading
                  ? "bg-indigo-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-3.5 w-3.5" />
                  Processing...
                </>
              ) : isEdit ? (
                "Update User"
              ) : (
                "Create User"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-50">
          <div
            className={`flex items-center px-3.5 py-2.5 rounded-lg shadow-lg border text-sm ${
              notification.type === "error"
                ? "bg-red-50 border-red-200 text-red-800"
                : "bg-green-50 border-green-200 text-green-800"
            }`}
          >
            {notification.type === "error" ? (
              <AlertCircle className="w-4 h-4 mr-2" />
            ) : (
              <CheckCircle className="w-4 h-4 mr-2" />
            )}
            <span className="font-medium mr-2">{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className={`p-0.5 rounded transition-colors ${
                notification.type === "error"
                  ? "hover:bg-red-100"
                  : "hover:bg-green-100"
              }`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
