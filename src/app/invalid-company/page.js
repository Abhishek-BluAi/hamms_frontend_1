"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";

export default function InvalidCompany() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    // Show error toast only once with a unique ID
    toast.error("Invalid company code", {
      id: "invalid-code-toast", // Add unique ID to prevent duplicates
      duration: 3000,
    });

    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    // Redirect after 5 seconds
    const redirect = setTimeout(() => {
      router.push("/");
    }, 3000);

    return () => {
      clearInterval(timer);
      clearTimeout(redirect);
      toast.dismiss(); // Clean up toasts on unmount
    };
  }, [router]);

  return (
    <>
      <Toaster position="top-center" />
      
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Invalid Company Code
          </h1>
          
          <p className="text-gray-600 mb-6">
            Redirecting to home in {countdown} seconds...
          </p>

          <button
            onClick={() => router.push("/")}
            className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    </>
  );
}