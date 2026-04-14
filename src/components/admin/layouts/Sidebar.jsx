'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Home, Truck, Users, Shield, Key, Eye, ChevronDown, LogOut, AlertTriangle, DoorOpen, Clock, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useSidebar } from '@/app/admin-portal/layout';
import { usePathname, useRouter } from 'next/navigation';
import { adminLogout, userLogout } from '@/utils/api';
import { hasPermission } from '@/utils/permissions';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [activeItem, setActiveItem] = useState('');
  const [expandedMenus, setExpandedMenus] = useState(['Main', 'Management', 'Reports']);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { isSidebarCollapsed } = useSidebar();

  // Memoize menu items to prevent unnecessary re-renders
  const menuItems = useMemo(() => [
    { 
      type: 'header',
      label: 'Main',
      subItems: [
        { icon: Home, label: 'Dashboard', href: '/admin-portal/dashboard' },
      ]
    },
    { 
      type: 'header',
      label: 'Management',
      subItems: [
        { icon: Users, label: 'Users', href: '/admin-portal/users', permission: 'User - Read' },
        { icon: Shield, label: 'Roles', href: '/admin-portal/roles', permission: 'Role - Read' },
        { icon: Key, label: 'Permissions', href: '/admin-portal/permissions', permission: 'Permission - Read' },
        { icon: Clock, label: 'Shifts', href: '/admin-portal/shifts', permission: 'Shift - Read' },
        { icon: DoorOpen, label: 'Gates', href: '/admin-portal/gates', permission: 'Gate - Read' },  
      ]
    },
    { 
      type: 'header',
      label: 'Reports',
      subItems: [
        { icon: RefreshCw, label: 'Guard Shifts', href: '/admin-portal/guard-shifts', permission: 'Guard Shift - Read' },       
        { icon: Eye, label: 'Visitors', href: '/admin-portal/visitors', permission: 'Visitor - Read' },
        { icon: Eye, label: 'Visits', href: '/admin-portal/visits', permission: 'Visit - Read' },
        { icon: Truck, label: "Delivery Reports", href: "/admin-portal/delivery-reports", permission: 'Delivery - Read' },
      ]
    },
  ], []);

  // Function to update active state based on pathname
  const updateActiveState = useCallback(() => {
    // Function to find active item based on current path
    const findActiveItem = () => {
      // Check all menu items to find which one matches the current path
      for (const section of menuItems) {
        for (const subItem of section.subItems) {
          if (pathname === subItem.href || pathname.startsWith(subItem.href + '/')) {
            return subItem.label;
          }
        }
      }
      
      // If no match found, check for edit pages
      if (pathname === '/admin-portal/new-role' || pathname.includes('/admin-portal/new-role')) {
        return 'Roles';
      } else if (pathname === '/admin-portal/new-permission' || pathname.includes('/admin-portal/new-permission')) {
        return 'Permissions';
      } else if (pathname === '/admin-portal/new-user' || pathname.includes('/admin-portal/new-user')) {
        return 'Users';
      } else if (pathname === '/admin-portal/new-gate' || pathname.includes('/admin-portal/new-gate')) {
        return 'Gates';
      } else if (pathname === '/admin-portal/new-shift' || pathname.includes('/admin-portal/new-shift')) {
        return 'Shifts';
      }
      
      return 'Dashboard'; // Default fallback
    };

    const newActiveItem = findActiveItem();
    
    // Find which menu section contains the active item
    let sectionToExpand = null;
    for (const section of menuItems) {
      for (const subItem of section.subItems) {
        if (subItem.label === newActiveItem) {
          sectionToExpand = section.label;
          break;
        }
      }
      if (sectionToExpand) break;
    }

    // Update states separately
    setActiveItem(newActiveItem);
    
    if (sectionToExpand) {
      setExpandedMenus(prev => {
        if (!prev.includes(sectionToExpand)) {
          return [...prev, sectionToExpand];
        }
        return prev;
      });
    }
  }, [pathname, menuItems]);

  // Effect to update active state when pathname changes
  useEffect(() => {
    // Use setTimeout to avoid synchronous state updates in effect
    const timer = setTimeout(() => {
      updateActiveState();
    }, 0);
    
    return () => clearTimeout(timer);
  }, [updateActiveState]);

  const toggleMenu = (label) => {
    if (isSidebarCollapsed) return;
    
    setExpandedMenus(prev => 
      prev.includes(label) 
        ? prev.filter(item => item !== label)
        : [...prev, label]
    );
  };

 const handleLogout = async () => {
  try {
    setIsLoggingOut(true);

    const adminSession = JSON.parse(
      localStorage.getItem("adminSession") || "{}"
    );
    const userSession = JSON.parse(
      localStorage.getItem("userSession") || "{}"
    );

    // 🔐 Call correct logout API
    if (adminSession?.token) {
      await adminLogout();
    }

    if (userSession?.token || userSession?.access_token) {
      await userLogout();
    }

    // 🧹 Clear all sessions
    localStorage.removeItem("adminSession");
    localStorage.removeItem("userSession");

    setShowConfirmModal(false);

    // 🔁 Redirect once
    router.push("/login");
  } catch (error) {
    console.error("Logout error:", error);
    setShowConfirmModal(false);
  } finally {
    setIsLoggingOut(false);
  }
};


  const handleLogoutClick = () => {
    setShowConfirmModal(true);
  };

  return (
    <>
      {/* Desktop Sidebar - Hidden on mobile */}
      <aside className={`hidden lg:flex fixed left-0 top-0 bottom-0 bg-white border-r border-gray-200 overflow-y-auto z-50 transition-all duration-300 flex-col ${
        isSidebarCollapsed ? 'w-20' : 'w-64'
      }`}>
        {/* Logo Section */}
        <div className="h-16 flex items-center justify-center px-3 border-b border-gray-200 shrink-0">
          {isSidebarCollapsed ? (
            <div className="relative w-14 h-14">
              <Image 
                src="/bluaccess_logo_dark.png" 
                alt="BluAccess Logo" 
                fill
                className="object-contain"
                priority
              />
            </div>
          ) : (
            <div className="relative w-50 h-14">
              <Image 
                src="/bluaccess_logo_dark.png" 
                alt="BluAccess Logo" 
                fill
                className="object-contain"
                priority
              />
            </div>
          )}
        </div>

        {/* Menu Items - Takes available space */}
        <nav className="p-3 flex-1 overflow-y-auto">
          {menuItems.map((section, index) => {
            const visibleSubItems = section.subItems.filter(item => 
              !item.permission || hasPermission(item.permission)
            );

            if (visibleSubItems.length === 0) return null;

            return (
              <div key={index} className="mb-4">
                {/* Main Header */}
                {!isSidebarCollapsed && (
                  <button
                    onClick={() => toggleMenu(section.label)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
                  >
                    <span>{section.label}</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${
                      expandedMenus.includes(section.label) ? 'rotate-180' : ''
                    }`} />
                  </button>
                )}

                {/* Collapsed state - show all icons without headers */}
                {isSidebarCollapsed && (
                  <div className="space-y-1">
                    {visibleSubItems.map((subItem, subIndex) => {
                      const isActive = subItem.label === activeItem;
                      return (
                        <Link
                          key={subIndex}
                          href={subItem.href}
                          className={`w-full flex items-center justify-center px-3 py-2.5 rounded-lg transition-all ${
                            isActive
                              ? 'bg-blue-50 text-blue-600'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                          title={subItem.label}
                        >
                          <subItem.icon className="w-4 h-4" strokeWidth={2} />
                        </Link>
                      );
                    })}
                  </div>
                )}

                {/* Sub-items (shown when expanded) */}
                {!isSidebarCollapsed && expandedMenus.includes(section.label) && (
                  <div className="mt-1 space-y-1">
                    {visibleSubItems.map((subItem, subIndex) => {
                      const isActive = subItem.label === activeItem;
                      return (
                        <Link
                          key={subIndex}
                          href={subItem.href}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                            isActive
                              ? 'bg-blue-50 text-blue-600'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <subItem.icon className="w-4 h-4" strokeWidth={2} />
                          <span className="text-sm font-normal">{subItem.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Logout Button Section - Fixed at bottom */}
        <div className="border-t border-gray-200 p-3 shrink-0">
          <button
            onClick={handleLogoutClick}
            className={`w-full flex items-center justify-center gap-3 px-3 py-2.5 rounded-lg transition-all text-gray-700 hover:bg-red-50 hover:text-red-600 cursor-pointer ${
              isSidebarCollapsed ? 'justify-center' : ''
            }`}
            title={isSidebarCollapsed ? "Logout" : ""}
          >
            <LogOut className="w-4 h-4" strokeWidth={2} />
            {!isSidebarCollapsed && (
              <span className="text-sm font-normal">Logout</span>
            )}
          </button>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-1000 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-md transition-opacity duration-300"
            onClick={() => !isLoggingOut && setShowConfirmModal(false)}
          />
          <div className="relative w-full max-w-md max-h-[80vh] overflow-y-auto transform transition-all duration-300 ease-out animate-fade-in-up">
            <div className="bg-linear-to-br from-white to-gray-50 rounded-xl shadow-2xl overflow-hidden border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-2xl font-semibold text-gray-800">
                  Confirm Log Out
                </h2>
                <p className="mt-1 text-gray-500">
                  This action cannot be undone
                </p>
              </div>
              <div className="p-6">
                <div className="flex items-start">
                  <div className="shrink-0 p-2 bg-red-100 rounded-full">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="mt-1 text-gray-600">
                      You are about to log out. Make sure all activities are
                      properly documented before proceeding.
                    </p>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-5 py-2.5 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 cursor-pointer"
                  disabled={isLoggingOut}
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="px-5 py-2.5 text-sm font-medium rounded-lg bg-linear-to-r from-red-500 to-red-600 text-white shadow-sm hover:from-red-600 hover:to-red-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-70 cursor-pointer"
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    "Logout"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}