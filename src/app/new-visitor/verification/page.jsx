'use client';

import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { useCallback, useState } from "react";

export default function VerificationPage() {
  const router = useRouter();
  const [isReturning, setIsReturning] = useState(false);

  const handleReturn = useCallback(() => {
    if (isReturning) return; // Prevent double clicks
    
    setIsReturning(true);
    
    // Get company code before clearing
    const companyCode = localStorage.getItem("company_code");

    // Clear all stored data
    localStorage.removeItem("visitorData");
    localStorage.removeItem("company_code");
    sessionStorage.removeItem("visitorId");
    sessionStorage.removeItem("confidence");

    // Navigate based on company code
    if (companyCode) {
      router.push(`/${companyCode}`);
    } else {
      router.push("/");
    }
  }, [isReturning, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 sm:p-12">
          <div className="text-center">
            {/* Success Icon with pulse effect */}
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 relative">
              <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20"></div>
              <Check className="w-12 h-12 text-white stroke-[3] relative z-10" />
            </div>
            
            <h1 className="text-3xl font-bold text-slate-900 mb-4">
              Registration Submitted!
            </h1>
            
            <div className="space-y-3 mb-8 max-w-md mx-auto">
              <p className="text-slate-600">
                Your registration has been completed and is now pending approval.
              </p>
              <p className="text-slate-600 font-medium">
                Please proceed to the reception desk to collect your visitor badge once approved.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                <p className="text-amber-800 text-sm">
                  ⏳ Approval typically takes 5-10 minutes. You&apos;ll be notified when your badge is ready.
                </p>
              </div>
            </div>
            
            <button
              onClick={handleReturn}
              disabled={isReturning}
              className={`
                px-8 py-3 bg-blue-600 text-white rounded-lg font-medium
                transition-all duration-200
                ${isReturning 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-blue-700 hover:scale-105 active:scale-100'
                }
              `}
              aria-label="Return to check-in page"
            >
              {isReturning ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Redirecting...
                </span>
              ) : (
                "Return to Check-in"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}