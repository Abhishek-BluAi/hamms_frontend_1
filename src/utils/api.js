import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "https://hammsapi.bluai.ai/api",
  headers: { "Content-Type": "application/json" },
});

/* ------------------------------------
   REQUEST INTERCEPTOR → Attach JWT
------------------------------------ */
api.interceptors.request.use((config) => {
  if (typeof window === "undefined") return config;

  const adminSession = JSON.parse(
    localStorage.getItem("adminSession") || "{}"
  );
  const userSession = JSON.parse(
    localStorage.getItem("userSession") || "{}"
  );

  const url = config.url || "";
  let token = null;

  // 🌐 PUBLIC APIs (no token)
  if (url.startsWith("/super-companies")) {
    return config;
  }


  // 🔐 ADMIN APIs
  if (url.startsWith("/admin") || url.startsWith("/guard-shifts/history") || url.startsWith("/guard-shifts/sessions")) {
    token = adminSession.token || userSession.access_token;
  }

  // 👥 USER MANAGEMENT (admin OR user-admin)
  else if (url.startsWith("/users")) {
    token =
      adminSession.token ||
      userSession.access_token ||
      userSession.token;
  }


  // 👮 GUARD APIs (gate + guard shift)
  else if (
    url.startsWith("/gates/user") ||
    url.startsWith("/guard-shifts")
  ) {
    token = userSession.access_token;
  }
  // 👤 VISITOR PATIENT APIs
  else if (url.startsWith("/visitor-patients")) {
    token = userSession.access_token || adminSession.token;
  }

  // 🔁 FALLBACK
  else {
    token = adminSession.token || userSession.access_token;
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});


/* ------------------------------------
   RESPONSE INTERCEPTOR → Handle Expiry
------------------------------------ */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || "";

    const authFreeRoutes = [
      "/admin/login",
      "/users/login",
      "/super-companies",
    ];

    const isAuthFree = authFreeRoutes.some((route) =>
      url.includes(route)
    );

    // 🔐 Logout ONLY when token is invalid/expired
    if (status === 401 && !isAuthFree) {
      localStorage.removeItem("adminSession");
      localStorage.removeItem("userSession");
      window.location.href = "/login";
    }

    // 🚫 403 = permission issue → stay logged in
    return Promise.reject(error);
  }
);

/* ====================================
   ADMIN AUTH APIs
==================================== */

export const adminLogin = (data) => api.post("/admin/login", data);
export const verifyAdmin2FA = (data) => api.post("/admin/login/verify-2fa", data);
export const getAdminDetails = () => api.get("/admin/details");
export const adminLogout = () => api.post("/admin/logout");

export const setupAdmin2FA = () => api.post("/admin/2fa/setup");
export const verifySetupAdmin2FA = (data) => api.post("/admin/2fa/verify-setup", data);
export const resetAdmin2FA = (adminId) => api.post(`/admin/2fa/reset/${adminId}`);

/* ====================================
   USER MANAGEMENT APIs
==================================== */

export const createUser = (data) => api.post("/users/create", data);
export const getAllUsers = (params) => api.get("/users/list", { params });
export const getUserById = (id) => api.get(`/users/view/${id}`);
export const updateUser = (id, data) => api.put(`/users/update/${id}`, data);
export const deleteUser = (id) => api.delete(`/users/delete/${id}`);

// User login
export const userLogin = (data) => api.post("/users/login", data);
export const verifyUser2FA = (data) => api.post("/users/login/verify-2fa", data);
export const getUserDetails = () => api.get("/users/details");
export const setupUser2FA = () => api.post("/users/2fa/setup");
export const verifySetupUser2FA = (data) => api.post("/users/2fa/verify-setup", data);
export const resetUser2FA = (id) => api.post(`/users/2fa/reset/${id}`);
export const switchUserRole = (data) => api.post("/users/switch-role", data);
export const userLogout = () => api.post("/users/logout");


/* ====================================
   ROLE MANAGEMENT APIs
==================================== */

export const createRole = (data) => api.post("/roles/create", data);
export const getAllRoles = (params) => api.get("/roles/list", { params });
export const getRoleById = (id) => api.get(`/roles/view/${id}`);
export const updateRole = (id, data) => api.put(`/roles/update/${id}`, data);
export const deleteRole = (id) => api.delete(`/roles/delete/${id}`);


/* ====================================
   PERMISSION MANAGEMENT APIs
==================================== */

export const createPermission = (data) => api.post("/permissions/create", data);
export const getAllPermissions = (params) => api.get("/permissions/list", { params });
export const getPermissionById = (id) => api.get(`/permissions/view/${id}`);
export const updatePermission = (id, data) => api.put(`/permissions/update/${id}`, data);
export const deletePermission = (id) => api.delete(`/permissions/delete/${id}`);

/* ====================================
   GATE MANAGEMENT APIs
==================================== */

export const createGate = (data) => api.post("/gates/create", data);
export const getAllGates = (params) => api.get("/gates/list", { params });
export const getGatesForUser = (params) => api.get("/gates/user/list", { params });
export const getGateById = (id) => api.get(`/gates/view/${id}`);
export const updateGate = (id, data) => api.put(`/gates/update/${id}`, data);
export const deleteGate = (id) => api.delete(`/gates/delete/${id}`);

/* ====================================
   SHIFT MANAGEMENT APIs
==================================== */

export const createShift = (data) => api.post("/shifts/create", data);
export const getAllShifts = (params) => api.get("/shifts/list", { params });
export const getShiftById = (id) => api.get(`/shifts/view/${id}`);
export const updateShift = (id, data) => api.put(`/shifts/update/${id}`, data);
export const deleteShift = (id) => api.delete(`/shifts/delete/${id}`);

/* ====================================
   GUARD SHIFT APIs (LOGIN / LOGOUT)
==================================== */

export const startGuardShift = (data) => api.post("/guard-shifts/start", data);
export const endGuardShift = () => api.post("/guard-shifts/end");
export const getGuardShiftHistory = (params) => api.get("/guard-shifts/history", { params });
export const getActiveGuardShift = () => api.get("/guard-shifts/active-shift");
export const getGuardShiftSessions = (params) => api.get("/guard-shifts/sessions", { params });

/* ====================================
   DELIVERY / VISIT MANAGEMENT APIs
==================================== */

// ➕ Create Visit + Delivery (Entry) - Accepts FormData
export const createVisitWithDelivery = (formData) => { return api.post("/deliveries/create", formData, { headers: { 'Content-Type': 'multipart/form-data', } }); };
export const exitVisitAndCompleteDelivery = (visitId, data) => api.put(`/deliveries/exit/${visitId}`, data);
export const getVisitDetails = (visitId) => api.get(`/deliveries/view/${visitId}`);
export const getAllVisitsWithDeliveries = (params) => api.get("/deliveries/list", { params });
export const getAdminAllVisitsWithDeliveries = (params) => api.get("/deliveries/admin-list", { params });
export const getDeliveryDashboardStats = () => api.get("/deliveries/dashboard/stats");


export const validateCompanyCode = (companyCode) => api.get(`/super-companies/${companyCode}`);

/*
|--------------------------------------------------------------------------
| REGISTER VISITOR (FIRST TIME USER)
|--------------------------------------------------------------------------
| Sends form data + face image
*/
export const saveFaceEncoding = (formData) => { return api.post("/visitor-patients/save-face", formData, { headers: { "Content-Type": "multipart/form-data", }, }); };

/*
|--------------------------------------------------------------------------
| SCAN FACE + AUTO CHECK-IN
|--------------------------------------------------------------------------
| Sends only face image
*/
export const matchFace = (formData) => { return api.post("/visitor-patients/match-face", formData, { headers: { "Content-Type": "multipart/form-data", }, }); };

export const createVisit = (data) => { return api.post("/visitor-patients/create-visit", data); };
/*
|--------------------------------------------------------------------------
| GET LAST VISIT
|--------------------------------------------------------------------------
*/
export const getLastVisit = (visitorId) => { return api.get(`/visitor-patients/${visitorId}/last-visit`); };

export const getAdminAllVisits = (params) => api.get("/visitor-patients/admin/visits", { params });
export const getAdminAllVisitors = (params) => api.get("/visitor-patients/admin/visitors", { params });

export const getAdminDashboardStats = () => api.get("/visitor-patients/admin/dashboard/stats");

export default api;
