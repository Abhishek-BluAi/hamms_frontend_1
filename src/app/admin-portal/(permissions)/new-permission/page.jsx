'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Loader2, X, AlertCircle, CheckCircle } from 'lucide-react';
import { createPermission, getPermissionById, updatePermission } from "@/utils/api";

export default function CreatePermission() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('editId');
  const isEdit = !!editId;

  const [formData, setFormData] = useState({
    name: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = 'success') => {
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
        'Authentication required. Please log in to manage permissions.',
        'error'
      );
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);

        // If edit mode → load permission
        if (isEdit && editId) {
          const response = await getPermissionById(editId);
          const permission = response.data?.data;

          if (!permission) {
            throw new Error('Invalid permission data received');
          }

          setFormData({
            name: permission.name || '',
          });
        }
      } catch (err) {
        console.error('Error fetching permission data:', err);
        showNotification('Failed to fetch permission data', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isEdit, editId]);

  useEffect(() => {
    console.log('Current formData:', formData);
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

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
    
    if (!formData.name.trim()) {
      newErrors.name = 'Permission name is required';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Name must be less than 100 characters';
    }
    
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
      showNotification('Session expired. Please log in again.', 'error');
      router.push('/');
      setIsSubmitting(false);
      return;
    }

    try {
      console.log('Submitting data:', formData);

      if (isEdit) {
        await updatePermission(editId, formData);
        showNotification('Permission updated successfully!', 'success');
      } else {
        await createPermission(formData);
        showNotification('Permission created successfully!', 'success');
      }

      setTimeout(() => router.push('/admin-portal/permissions?refresh=1'), 500);
    } catch (err) {
      console.error('Submission error:', err);
      showNotification(
        isEdit
          ? 'Failed to update permission. Please try again.'
          : 'Failed to create permission. Please try again.',
        'error'
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
              <Lock className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                {isEdit ? 'Edit Permission' : 'Create New Permission'}
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                {isEdit ? 'Update permission details' : 'Add a new permission'}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-5">
            {/* Permission Name */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Permission Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-3 py-2 text-sm border rounded-md text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  errors.name ? 'border-red-300 bg-red-50' : 'border-slate-300'
                }`}
                placeholder="e.g., create, update"
                disabled={loading || isEdit}
                autoComplete="off"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-600 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {errors.name}
                </p>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-2.5 pt-5 mt-5 border-t border-slate-200">
            <button
              type="button"
              onClick={() => router.push('/admin-portal/permissions')}
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
                  ? 'bg-indigo-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-3.5 w-3.5" />
                  Processing...
                </>
              ) : isEdit ? (
                'Update Permission'
              ) : (
                'Create Permission'
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
              notification.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-green-50 border-green-200 text-green-800'
            }`}
          >
            {notification.type === 'error' ? (
              <AlertCircle className="w-4 h-4 mr-2" />
            ) : (
              <CheckCircle className="w-4 h-4 mr-2" />
            )}
            <span className="font-medium mr-2">{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className={`p-0.5 rounded transition-colors ${
                notification.type === 'error'
                  ? 'hover:bg-red-100'
                  : 'hover:bg-green-100'
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