/**
 * Utility to check user permissions from localStorage
 */

export const getSession = () => {
  if (typeof window === "undefined") return null;
  
  // Try admin session first, then user session
  // adminSession is usually for SuperAdmins/GlobalAdmins
  const adminSession = JSON.parse(localStorage.getItem("adminSession") || "{}");
  if (adminSession.token) return { ...adminSession, type: 'admin' };
  
  // userSession is for company-specific users (Admins, Managers, Employees, Guards)
  const userSession = JSON.parse(localStorage.getItem("userSession") || "{}");
  if (userSession.access_token) {
    if (!userSession.permissions || userSession.permissions.length === 0) {
      console.warn("🔐 RBAC: User has no permissions in session!", userSession);
    } else {
      console.log("🔐 RBAC: Active permissions:", userSession.permissions);
    }
    return { ...userSession, type: 'user' };
  }
  
  return null;
};

/**
 * Checks if the current user has a specific permission.
 * Case-insensitive. Supports both module-specific and global permissions.
 */
export const hasPermission = (permissionName) => {
  const session = getSession();
  if (!session) return false;
  
  // Type 'admin' (AdminSession) has all privileges
  if (session.type === 'admin') return true;
  
  const permissions = (session.permissions || []).map(p => p.toLowerCase());
  const search = permissionName.toLowerCase();
  
  // 1. Check for exact match (e.g., "User - Create")
  if (permissions.includes(search)) return true;

  // 2. Check for varied separators (e.g., "User Create", "user_create", "user-create")
  const normalized = search.replace(/ - /g, '_').replace(/ /g, '_').replace(/-/g, '_');
  if (permissions.includes(normalized)) return true;
  
  const spaceNormalized = search.replace(/ - /g, ' ');
  if (permissions.includes(spaceNormalized)) return true;

  // 3. Check for global action match (e.g., "create")
  // We check if the search string ends with the action word
  const actions = ['create', 'read', 'update', 'delete', 'view'];
  const foundAction = actions.find(action => search.endsWith(action));
  
  if (foundAction && permissions.includes(foundAction)) return true;

  // 4. Special case: if looking for "Read", also check "view"
  if (search.includes('read') && permissions.includes('view')) return true;
  if (search.includes('view') && permissions.includes('read')) return true;

  return false;
};

/**
 * Checks if the current user has any of the given permissions.
 */
export const hasAnyPermission = (permissionNames = []) => {
  const session = getSession();
  if (!session) return false;
  if (session.type === 'admin') return true;
  
  return permissionNames.some(p => hasPermission(p));
};
