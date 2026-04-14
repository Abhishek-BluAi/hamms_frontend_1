"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { validateCompanyCode } from "@/utils/api";
import toast, { Toaster } from "react-hot-toast";

export default function Home() {
  const router = useRouter();
  const [companyCode, setCompanyCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    if (!companyCode.trim()) {
      toast.error("Please enter a company code");
      return;
    }

    const loadingToast = toast.loading("Validating company code...");

    try {
      setLoading(true);
      await validateCompanyCode(companyCode);
      
      toast.dismiss(loadingToast);
      toast.success("Company code verified! Redirecting...");
      
      // Small delay to show success message
      setTimeout(() => {
        router.push(`/${companyCode}`);
      }, 500);

    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error("Invalid company code. Please try again.");
      setCompanyCode("");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !loading) {
      handleSubmit();
    }
  };

  return (
    <>
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#363636",
            color: "#fff",
          },
          success: {
            style: {
              background: "#10b981",
            },
          },
          error: {
            style: {
              background: "#ef4444",
            },
          },
        }}
      />
      
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome Back
              </h1>
              <p className="text-gray-600">
                Enter your company code to continue
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label 
                  htmlFor="companyCode" 
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Company Code
                </label>
                <input
                  id="companyCode"
                  type="text"
                  value={companyCode}
                  onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
                  onKeyPress={handleKeyPress}
                  placeholder="e.g., ACME123"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 placeholder-gray-400"
                  disabled={loading}
                  autoFocus
                  maxLength={20}
                />
                <p className="mt-2 text-xs text-gray-500">
                  Enter the unique code provided by your company
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`
                  w-full py-3 px-4 rounded-lg font-medium text-white
                  transition-all duration-200 transform
                  ${loading 
                    ? "bg-gray-400 cursor-not-allowed" 
                    : "bg-blue-600 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg"
                  }
                `}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Validating...
                  </span>
                ) : (
                  "Continue"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}