'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Shield, Loader2, X, AlertCircle, CheckCircle } from 'lucide-react';
import { getAllPermissions, getRoleById, createRole, updateRole } from "@/utils/api";

export default function CreateRole() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('editId');
  const isEdit = !!editId;

  const [formData, setFormData] = useState({
    name: '',
    permissionIds: [],
  });
  const [permissions, setPermissions] = useState([]);
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
        'Authentication required. Please log in to manage roles.',
        'error'
      );
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);

        // Load permissions
        const permResponse = await getAllPermissions();
        setPermissions(permResponse.data?.data || permResponse.data || []);

        // If edit mode → load role
        if (isEdit && editId) {
          const roleResponse = await getRoleById(editId);
          const role = roleResponse.data?.data;

          if (!role) {
            throw new Error('Invalid role data received');
          }

          const rolePermissions = role.Permissions || role.permissions || [];
          const permissionIds = rolePermissions
            .map((permission) => permission.id)
            .filter((id) => id != null)
            .map((id) => Number(id));

          setFormData({
            name: role.name || '',
            permissionIds: permissionIds,
          });
        }
      } catch (err) {
        console.error('Error fetching role data:', err);
        showNotification('Failed to fetch role data', 'error');
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
    const { name, value, checked, type } = e.target;
    
    if (name === 'permissionIds') {
      const id = parseInt(value);
      setFormData((prev) => ({
        ...prev,
        permissionIds: checked
          ? [...prev.permissionIds, id]
          : prev.permissionIds.filter((pid) => pid !== id),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

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
    if (!formData.name.trim()) newErrors.name = 'Role name is required';
    if (formData.permissionIds.length === 0)
      newErrors.permissionIds = 'At least one permission is required';
    
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
        await updateRole(editId, formData);
        showNotification('Role updated successfully!', 'success');
      } else {
        await createRole(formData);
        showNotification('Role created successfully!', 'success');
      }

      setTimeout(() => router.push('/admin-portal/roles?refresh=1'), 500);
    } catch (err) {
      console.error('Submission error:', err);
      showNotification(
        isEdit
          ? 'Failed to update role. Please try again.'
          : 'Failed to create role. Please try again.',
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
              <Shield className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                {isEdit ? 'Edit Role' : 'Create New Role'}
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                {isEdit ? 'Update role details' : 'Add a new role'}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-5">
            {/* Role Name */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Role Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-3 py-2 text-sm border rounded-md text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  errors.name ? 'border-red-300 bg-red-50' : 'border-slate-300'
                }`}
                placeholder="Admin"
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

            {/* Permissions */}
            <div className="pt-4 border-t border-slate-200">
              <label className="block text-xs font-medium text-slate-700 mb-2">
                Permissions <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {permissions.map((permission) => {
                  const permissionIdNum = Number(permission.id);
                  const isChecked = formData.permissionIds.some(
                    (id) => Number(id) === permissionIdNum
                  );

                  return (
                    <label
                      key={`permission-${permission.id}`}
                      className={`flex items-center p-2 border rounded-md cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-indigo-50 border-indigo-500'
                          : 'bg-white border-slate-300 hover:border-slate-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        name="permissionIds"
                        value={permission.id}
                        checked={isChecked}
                        onChange={handleChange}
                        className="h-3.5 w-3.5 text-indigo-600 focus:ring-2 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                        disabled={loading}
                      />
                      <span
                        className={`ml-2 text-xs font-medium ${
                          isChecked ? 'text-indigo-900' : 'text-slate-700'
                        }`}
                      >
                        {permission.name}
                      </span>
                    </label>
                  );
                })}
              </div>
              {errors.permissionIds && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {errors.permissionIds}
                </p>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-2.5 pt-5 mt-5 border-t border-slate-200">
            <button
              type="button"
              onClick={() => router.push('/admin-portal/roles')}
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
                'Update Role'
              ) : (
                'Create Role'
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