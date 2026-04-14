"use client";

import { useState, createContext, useContext } from "react";
import Navbar from "@/components/user/layouts/Navbar";
import Sidebar from "@/components/user/layouts/Sidebar";

const SidebarContext = createContext(null);

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within AdminLayout");
  }
  return context;
}

export default function UserLayout({ children }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => setIsSidebarCollapsed((prev) => !prev);

  return (
    <SidebarContext.Provider value={{ isSidebarCollapsed, toggleSidebar }}>
      <div className="flex h-screen w-full overflow-hidden bg-gray-50">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <Navbar />

          <main
            className={`
              relative flex-1 overflow-y-auto mt-16
              px-4 sm:px-6 lg:px-8
              py-6 md:py-8 lg:py-10
              transition-all duration-300 ease-in-out
              ${isSidebarCollapsed ? "lg:ml-20" : "lg:ml-64"}
            `}
          >
            {children}
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}
