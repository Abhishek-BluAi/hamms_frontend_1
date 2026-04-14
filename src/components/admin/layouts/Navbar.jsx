"use client";
import { useState, useEffect, useRef } from "react";
import {
  Bell,
  ChevronDown,
  Menu,
  User,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useSidebar } from "@/app/admin-portal/layout";
import { getAdminDetails, adminLogout, getUserDetails, userLogout } from "@/utils/api";
import { useRouter } from "next/navigation";
import MobileSidebar from "./MobileSidebar"; // Add this import

export default function Navbar() {
  const { toggleSidebar, isSidebarCollapsed } = useSidebar();
  const router = useRouter();
  const [adminData, setAdminData] = useState(null);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false); // Add this state
  const userDropdownRef = useRef(null);

  // Fetch admin details on component mount
useEffect(() => {
  const fetchProfile = async () => {
    try {
      const adminSession = JSON.parse(
        localStorage.getItem("adminSession") || "{}"
      );
      const userSession = JSON.parse(
        localStorage.getItem("userSession") || "{}"
      );

      let response;

      if (adminSession.token) {
        response = await getAdminDetails();
        setAdminData(response.data.admin);
      } else if (userSession.access_token) {
        response = await getUserDetails();
        setAdminData(response.data.user); // reuse same UI
      }
    } catch (err) {
      console.error("Navbar auth error:", err);
      router.push("/login");
    }
  };

  fetchProfile();
}, []);


  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target)
      ) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle logout
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


// Get initials for avatar (admin OR user)
const getInitials = (user) => {
  if (!user) return "U";

  // Admin object → username
  if (user.username) {
    return user.username.charAt(0).toUpperCase();
  }

  // User object → first + last name
  if (user.first_name && user.last_name) {
    return (
      user.first_name.charAt(0) + user.last_name.charAt(0)
    ).toUpperCase();
  }

  // Fallback → email
  if (user.email) {
    return user.email.charAt(0).toUpperCase();
  }

  return "U";
};

// Get display name (admin OR user)
const getFirstName = (user) => {
  if (!user) return "User";

  // Admin object
  if (user.username) {
    const parts = user.username.split("@")[0].split(".");
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  }

  // User object
  if (user.first_name) {
    return user.first_name;
  }

  // Fallback → email
  if (user.email) {
    const name = user.email.split("@")[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  return "User";
};


  return (
    <>
      <nav
        className={`fixed top-0 right-0 left-0 h-16 bg-white border-b border-gray-200 z-40
        flex items-center justify-between
        px-3 sm:px-4 lg:px-6
        transition-all duration-300
        ${isSidebarCollapsed ? "lg:left-20" : "lg:left-64"}`}
      >
        {/* Left Section - Campaign Title & Toggle Buttons */}
        <div className="flex items-center gap-3">
          {/* Mobile Menu Button (md / sm) */}
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Open mobile sidebar"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>

          {/* Desktop Sidebar Collapse / Expand (lg+) */}
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            aria-label={
              isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
            }
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="w-6 h-6 text-gray-500 transition-transform duration-200 cursor-pointer" />
            ) : (
              <PanelLeftClose className="w-6 h-6 text-gray-500 transition-transform duration-200 cursor-pointer" />
            )}
          </button>

          {/* App Title */}
          <div className="flex flex-col leading-tight">
            <span className="text-gray-900 font-semibold text-[12px] sm:text-base">
              HAMMS (Admin Panel)
            </span>
            <span className="text-[10px] sm:text-xs text-gray-500">
              Hospital Management & Monitoring System
            </span>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* User Profile Dropdown */}
          <div className="relative" ref={userDropdownRef}>
            <button
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              onMouseEnter={() => setIsUserDropdownOpen(true)}
              className="flex items-center gap-3 pl-4 border-l border-gray-200 hover:bg-gray-50 rounded-lg p-2 transition-colors cursor-pointer"
            >
              {/* Avatar with Initials */}
              <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-medium">
                {getInitials(adminData)}
              </div>

              {/* User Info */}
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-sm font-medium text-gray-900">
                  {getFirstName(adminData)}
                </span>
                <span className="text-xs text-gray-500">
                  {adminData?.username || adminData?.email || "Loading..."}
                </span>
              </div>

              <ChevronDown
                className={`w-4 h-4 hidden sm:flex text-gray-600 transition-transform duration-200 ${
                  isUserDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {isUserDropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 divide-y divide-gray-100"
                onMouseEnter={() => setIsUserDropdownOpen(true)}
                onMouseLeave={() => setIsUserDropdownOpen(false)}
              >
                {/* Profile Option */}
                <button
                  onClick={() => {
                    setIsUserDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <User className="w-4 h-4 text-gray-500" />
                  Profile
                </button>

                {/* Logout Option */}
                <button
                  onClick={() => {
                    setShowConfirmModal(true);
                    setIsUserDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar Component */}
      <MobileSidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Logout Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-md transition-opacity duration-300"
            onClick={() => !isLoggingOut && setShowConfirmModal(false)}
          />
          <div className="relative w-full max-w-md max-h-[80vh] overflow-y-auto transform transition-all duration-300 ease-out">
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-2xl overflow-hidden border border-gray-100">
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
                  <div className="flex-shrink-0 p-2 bg-red-100 rounded-full">
                    <svg
                      className="w-6 h-6 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
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
                  className="px-5 py-2.5 text-sm font-medium rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white shadow-sm hover:from-red-600 hover:to-red-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-70 cursor-pointer"
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
