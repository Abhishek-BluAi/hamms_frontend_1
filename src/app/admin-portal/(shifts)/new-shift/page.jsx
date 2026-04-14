"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Clock, Loader2, AlertCircle, CheckCircle, X } from "lucide-react";
import { createShift, updateShift, getShiftById } from "@/utils/api";

export default function CreateShift() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("editId");
  const isEdit = !!editId;

  const [formData, setFormData] = useState({
    name: "",
    start_time: "",
    end_time: "",
    timezone: "Asia/Kolkata",
    is_active: true,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

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
        "Authentication required. Please log in to manage shifts.",
        "error",
      );
      return;
    }

    const fetchData = async () => {
      if (isEdit && editId) {
        try {
          setLoading(true);
          const response = await getShiftById(editId);
          const shift = response.data?.data;

          if (!shift) {
            throw new Error("Invalid shift data received");
          }

          setFormData({
            name: shift.name || "",
            start_time: shift.start_time || "",
            end_time: shift.end_time || "",
            timezone: shift.timezone || "Asia/Kolkata",
            is_active: shift.is_active ?? true,
          });
        } catch (err) {
          console.error("Error fetching shift data:", err);
          showNotification("Failed to fetch shift data", "error");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [isEdit, editId]);

  useEffect(() => {
    console.log("Current formData:", formData);
  }, [formData]);

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error when user starts typing
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
    if (!formData.name.trim()) newErrors.name = "Shift name is required";
    if (!formData.start_time) newErrors.start_time = "Start time is required";
    if (!formData.end_time) newErrors.end_time = "End time is required";
    if (!formData.timezone.trim()) newErrors.timezone = "Timezone is required";

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
      console.log("Submitting data:", formData);

      if (isEdit) {
        await updateShift(editId, formData);
        showNotification("Shift updated successfully!", "success");
      } else {
        await createShift(formData);
        showNotification("Shift created successfully!", "success");
      }

      setTimeout(() => router.push("/admin-portal/shifts?refresh=1"), 500);
    } catch (err) {
      console.error("Submission error:", err);
      showNotification(
        isEdit
          ? "Failed to update shift. Please try again."
          : "Failed to create shift. Please try again.",
        "error",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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
              <Clock className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                {isEdit ? "Edit Shift" : "Create New Shift"}
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                {isEdit ? "Update shift details" : "Add a new shift"}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-5">
            {/* Shift Name */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Shift Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-3 py-2 text-sm border rounded-md text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  errors.name ? "border-red-300 bg-red-50" : "border-slate-300"
                }`}
                placeholder="Morning Shift"
                disabled={loading}
                autoComplete="off"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-600 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Time Range */}
            <div className="grid grid-cols-2 gap-4">
              {/* Start Time */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Start Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 text-sm border rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    errors.start_time
                      ? "border-red-300 bg-red-50"
                      : "border-slate-300"
                  }`}
                  disabled={loading}
                />
                {errors.start_time && (
                  <p className="mt-1 text-xs text-red-600 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {errors.start_time}
                  </p>
                )}
              </div>

              {/* End Time */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  End Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 text-sm border rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    errors.end_time
                      ? "border-red-300 bg-red-50"
                      : "border-slate-300"
                  }`}
                  disabled={loading}
                />
                {errors.end_time && (
                  <p className="mt-1 text-xs text-red-600 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {errors.end_time}
                  </p>
                )}
              </div>
            </div>

            {/* Timezone */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Timezone <span className="text-red-500">*</span>
              </label>
              <select
                name="timezone"
                value={formData.timezone}
                onChange={handleChange}
                className={`w-full px-3 py-2 text-sm border rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  errors.timezone
                    ? "border-red-300 bg-red-50"
                    : "border-slate-300"
                }`}
                disabled={loading}
              >
                <option value="Asia/Kolkata">Asia/Kolkata (India)</option>
                <option value="America/New_York">America/New_York (US – Eastern)</option>
                <option value="America/Chicago">America/Chicago (US – Central)</option>
                <option value="America/Denver">America/Denver (US – Mountain)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (US – Pacific)</option>
                <option value="America/Anchorage">America/Anchorage (US – Alaska)</option>
                <option value="Pacific/Honolulu">Pacific/Honolulu (US – Hawaii)</option>
                <option value="Europe/London">Europe/London (UK)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (Japan)</option>
                <option value="Australia/Sydney">Australia/Sydney (Australia)</option>
              </select>

              {errors.timezone && (
                <p className="mt-1 text-xs text-red-600 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {errors.timezone}
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
                  className="h-4 w-4 text-indigo-600 focus:ring-2 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                  disabled={loading}
                />
                <span className="ml-2 text-xs font-medium text-slate-700">
                  Active Shift
                </span>
              </label>
              <p className="mt-1 text-xs text-slate-500 ml-6">
                {formData.is_active
                  ? "This shift is currently active and can be assigned"
                  : "This shift is currently inactive"}
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-2.5 pt-5 mt-5 border-t border-slate-200">
            <button
              type="button"
              onClick={() => router.push("/admin-portal/shifts")}
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
                "Update Shift"
              ) : (
                "Create Shift"
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
