"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  RefreshCw,
  Check,
  X,
  Mail,
  Lock,
  ShieldCheck,
  Smartphone,
  Shield,
  Copy,
  QrCode,
  Cog,
  Building,
} from "lucide-react";
import {
  adminLogin,
  verifyAdmin2FA,
  setupAdmin2FA,
  verifySetupAdmin2FA,
  getAdminDetails,
  userLogin,
  verifyUser2FA,
  setupUser2FA,
  verifySetupUser2FA,
  switchUserRole,
  getGatesForUser,
  startGuardShift,
  getActiveGuardShift,
} from "@/utils/api";

export default function HospitalLogin() {
  const router = useRouter();

  // Login form states
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyCode, setCompanyCode] = useState("");
  const [captchaCode, setCaptchaCode] = useState("");
  const [userCaptchaInput, setUserCaptchaInput] = useState("");
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loginError, setLoginError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2FA Login states
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFACode, setTwoFACode] = useState("");
  const [isVerifying2FA, setIsVerifying2FA] = useState(false);
  const [twoFAError, setTwoFAError] = useState("");
  const [loginToken, setLoginToken] = useState("");

  // 2FA Setup states
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [isSettingUp2FA, setIsSettingUp2FA] = useState(false);
  const [setupData, setSetupData] = useState(null);
  const [setupVerificationCode, setSetupVerificationCode] = useState("");
  const [isVerifyingSetup, setIsVerifyingSetup] = useState(false);
  const [setupMessage, setSetupMessage] = useState("");
  const [setupError, setSetupError] = useState("");
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [copied, setCopied] = useState(false);
  const [autoShow2FASetup, setAutoShow2FASetup] = useState(false);
  const [loginType, setLoginType] = useState("admin");
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [availableRoles, setAvailableRoles] = useState([]);

  const [showGateModal, setShowGateModal] = useState(false);
  const [gates, setGates] = useState([]);
  const [selectedGate, setSelectedGate] = useState("");
  const [isLoadingGates, setIsLoadingGates] = useState(false);
  const [gateError, setGateError] = useState("");

  const hasUserTypedAfterError = useRef(false);
  const errorTimeoutRef = useRef(null);

  const updateUserSession = (updates = {}) => {
    const existing = JSON.parse(localStorage.getItem("userSession") || "{}");

    localStorage.setItem(
      "userSession",
      JSON.stringify({
        ...existing,
        ...updates,
      }),
    );
  };

  // Validation functions
  const validateEmail = useCallback((email) => {
    if (!email.trim()) return "Email address is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return !emailRegex.test(email) ? "Please enter a valid email address" : "";
  }, []);

  const validatePassword = useCallback((password) => {
    if (!password) return "Password is required";
    return password.length < 6
      ? "Password must be at least 6 characters long"
      : "";
  }, []);

  const validateCompanyCode = useCallback((companyCode) => {
    if (!companyCode.trim()) return "Company code is required";
    return companyCode.length < 3
      ? "Company code must be at least 3 characters"
      : "";
  }, []);

  const clearLoginError = useCallback(() => {
    setLoginError("");
    hasUserTypedAfterError.current = false;
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }
  }, []);

  const clear2FAError = useCallback(() => {
    setTwoFAError("");
  }, []);

  // Set up auto-dismiss for error message
  useEffect(() => {
    if (loginError) {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }

      errorTimeoutRef.current = setTimeout(() => {
        setLoginError("");
        hasUserTypedAfterError.current = false;
      }, 5000);
    }

    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, [loginError]);

  // Captcha generator
  const generateCaptcha = useCallback(() => {
    const newCaptcha = Array(6)
      .fill("")
      .map(() => Math.floor(Math.random() * 10))
      .join("");
    setCaptchaCode(newCaptcha);
    setUserCaptchaInput("");
  }, []);

  useEffect(() => {
    generateCaptcha();
  }, [generateCaptcha]);

  // Check if admin has 2FA enabled
  const check2FAStatus = useCallback(async (token) => {
    try {
      const response = await getAdminDetails();
      return response.data?.is_2fa_enabled || response.data?.has_2fa || false;
    } catch (error) {
      return false;
    }
  }, []);

  // Validate token
  const validateToken = async (token) => {
    try {
      const response = await getAdminDetails();
      return response.data ? true : false;
    } catch (error) {
      return false;
    }
  };

  const fetchGatesForUser = async () => {
    try {
      setIsLoadingGates(true);
      setGateError("");

      const res = await getGatesForUser();

      if (res.data.success) {
        setGates(res.data.data || []);
      } else {
        setGateError("Failed to load gates");
      }
    } catch (err) {
      setGateError("Unable to fetch gates");
    } finally {
      setIsLoadingGates(false);
    }
  };

  // Handlers
  const handleFieldChange = useCallback(
    (field, value, validator) => {
      if (loginError && !hasUserTypedAfterError.current) {
        clearLoginError();
        hasUserTypedAfterError.current = true;
      }

      if (field === "email") setEmail(value);
      if (field === "password") setPassword(value);
      if (field === "companyCode") setCompanyCode(value.toUpperCase()); // Convert to uppercase
      if (field === "captcha") setUserCaptchaInput(value.replace(/\D/g, ""));

      if (touched[field]) {
        setErrors((prev) => ({
          ...prev,
          [field]: validator ? validator(value) : "",
        }));
      }
    },
    [loginError, touched, clearLoginError],
  );

  const handleBlur = useCallback((field, value, validator) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: validator(value) }));
  }, []);

  const getFieldStatus = useCallback(
    (field, value, error) => {
      if (error && touched[field]) return "error";
      if (value && !error && touched[field]) return "valid";
      return "default";
    },
    [touched],
  );

  const getBorderClass = useCallback((status) => {
    const baseClasses =
      "w-full px-3 py-2 text-sm border rounded-lg transition-all duration-200 focus:ring-2 focus:outline-none";
    const statusClasses = {
      error: "border-red-500 focus:border-red-500 focus:ring-red-200",
      valid: "border-green-500 focus:border-green-500 focus:ring-green-200",
      default: "border-gray-300 focus:border-cyan-500 focus:ring-cyan-100",
    };
    return `${baseClasses} ${statusClasses[status]}`;
  }, []);

  const captchaStatus =
    userCaptchaInput.length === 6
      ? userCaptchaInput === captchaCode
        ? "valid"
        : "error"
      : "default";

  const isShiftError = (message = "") => {
    return (
      message.includes("shift") ||
      message.includes("Shift") ||
      message.includes("outside")
    );
  };

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setIsSubmitting(true);
      clearLoginError();
      clear2FAError();

      const emailError = validateEmail(email);
      const passwordError = validatePassword(password);
      const companyCodeError = validateCompanyCode(companyCode);

      setErrors({
        email: emailError,
        password: passwordError,
        companyCode: companyCodeError,
      });

      setTouched({
        email: true,
        password: true,
        companyCode: true,
        captcha: true,
      });

      if (
        emailError ||
        passwordError ||
        companyCodeError ||
        captchaStatus !== "valid"
      ) {
        setIsSubmitting(false);
        return;
      }

      try {
        let response;
        let detectedLoginType;

        // 🔐 TRY ADMIN LOGIN FIRST
        try {
          response = await adminLogin({
            username: email,
            password,
            company_code: companyCode,
          });
          detectedLoginType = "admin";
        } catch {
          // 🔁 FALLBACK TO USER LOGIN
          response = await userLogin({
            email,
            password,
            company_code: companyCode,
          });
          detectedLoginType = "user";
        }

        setLoginType(detectedLoginType);

        const sessionKey =
          detectedLoginType === "admin" ? "adminSession" : "userSession";

        // 🟡 2FA SETUP
        if (response.data.requires_2fa_setup && response.data.token) {
          localStorage.setItem(
            sessionKey,
            JSON.stringify({ token: response.data.token }),
          );
          setAutoShow2FASetup(true);
          setShow2FASetup(true);
          return;
        }

        // 🟡 2FA VERIFY
        if (response.data.requires_2fa && response.data.token) {
          localStorage.setItem(
            sessionKey,
            JSON.stringify({ token: response.data.token }),
          );
          setRequires2FA(true);
          return;
        }

        // 🟢 SUCCESS
        if (response.data.token || response.data.session_token) {
          localStorage.setItem(
            sessionKey,
            JSON.stringify({
              token: response.data.token || response.data.session_token,
            }),
          );

          router.push(
            detectedLoginType === "admin"
              ? "/admin-portal/dashboard"
              : "/security-portal/dashboard",
          );
          return;
        }

        setLoginError("Unexpected response from server");
      } catch (error) {
        const apiMessage =
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Login failed";

        // 🎯 SHIFT-RELATED ERROR (do not treat as auth failure)
        if (isShiftError(apiMessage)) {
          setLoginError(apiMessage);
        } else {
          setLoginError(apiMessage);
          generateCaptcha();
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      email,
      password,
      companyCode,
      captchaStatus,
      validateEmail,
      validatePassword,
      validateCompanyCode,
      clearLoginError,
      clear2FAError,
      generateCaptcha,
      router,
    ],
  );

  const handleGuardFlow = async () => {
    try {
      const res = await getActiveGuardShift();

      if (res.data?.active) {
        router.push("/security-portal/dashboard");
        return;
      }

      await fetchGatesForUser();
      setShowGateModal(true);
    } catch (err) {
      setGateError("Unable to verify shift status");
    }
  };

  // handle2FAVerification function:
  const handle2FAVerification = useCallback(
    async (e, codeToVerify = null) => {
      if (e) e.preventDefault();

      setTwoFAError("");
      setIsVerifying2FA(true);

      try {
        const code = (codeToVerify || twoFACode).replace(/\D/g, "").slice(0, 6);

        if (code.length !== 6) {
          setTwoFAError("Enter a valid 6-digit code");
          return;
        }

        const response =
          loginType === "admin"
            ? await verifyAdmin2FA({ code })
            : await verifyUser2FA({ code });

        /* ===========================
         ADMIN FLOW
      =========================== */
        if (loginType === "admin") {
          localStorage.setItem(
            "adminSession",
            JSON.stringify({
              token: response.data.session_token || response.data.token,
            }),
          );

          router.push("/admin-portal/dashboard");
          return;
        }

        /* ===========================
         USER FLOW (CRITICAL FIX)
      =========================== */
        if (!response.data.access_token) {
          setTwoFAError("Invalid verification response");
          return;
        }

        console.log("🔐 RBAC Debug (Frontend): Login response data:", response.data);

        updateUserSession({
          access_token: response.data.access_token,
          roles: response.data.roles || [],
          permissions: response.data.permissions || [],
          shift_id: response.data.shift_id,
        });

        // ❌ REMOVE any admin temp token
        localStorage.removeItem("adminSession");

        // Role handling
        if (response.data.roles?.length === 1) {
          const role = response.data.roles[0];

          if (role === "guard") {
            await handleGuardFlow();
          } else {
            redirectByRole(role);
          }
        } else {
          setAvailableRoles(response.data.roles);
          setShowRoleModal(true);
        }
      } catch (error) {
        setTwoFAError(
          error.response?.data?.message ||
          error.response?.data?.error ||
          "2FA verification failed",
        );
      } finally {
        setIsVerifying2FA(false);
      }
    },
    [twoFACode, loginType, router],
  );

  const redirectByRole = (role) => {
    if (role === "guard") {
      router.push("/security-portal/dashboard");
    } else {
      router.push("/admin-portal/dashboard");
    }
  };

  const start2FASetup = async () => {
    try {
      setIsSettingUp2FA(true);
      setSetupError("");
      setSetupMessage("");

      const response =
        loginType === "admin" ? await setupAdmin2FA() : await setupUser2FA();

      if (response.data.success) {
        setSetupData(response.data);
        setSetupMessage("Scan the QR code with Microsoft Authenticator");
      } else {
        setSetupError("Failed to setup 2FA");
      }
    } catch (error) {
      setSetupError(error.response?.data?.error || "Failed to setup 2FA");
    } finally {
      setIsSettingUp2FA(false);
    }
  };

  const verify2FASetup = useCallback(
    async (codeToVerify = null) => {
      setIsVerifyingSetup(true);
      setSetupError("");

      try {
        const code =
          codeToVerify || setupVerificationCode.replace(/\D/g, "").slice(0, 6);

        if (code.length !== 6) {
          setSetupError("Please enter a valid 6-digit code");
          return;
        }

        const response =
          loginType === "admin"
            ? await verifySetupAdmin2FA({ code })
            : await verifySetupUser2FA({ code });

        // ✅ SUCCESS
        if (response.data.success) {
          const sessionKey =
            loginType === "admin" ? "adminSession" : "userSession";

          localStorage.setItem(
            sessionKey,
            JSON.stringify({
              token: response.data.session_token,
              access_token: response.data.access_token,
              roles: response.data.roles,
              active_role: response.data.active_role,
              permissions: response.data.permissions || [],
            }),
          );

          setIs2FAEnabled(true);
          setSetupMessage("2FA enabled successfully!");
          setSetupError("");

          setTimeout(() => {
            setShow2FASetup(false);
            router.push(
              loginType === "admin"
                ? "/admin-portal/dashboard"
                : "/security-portal/dashboard",
            );
          }, 800);

          return;
        }

        setSetupError("Invalid verification code");
      } catch (error) {
        setSetupError(
          error.response?.data?.error ||
          error.response?.data?.message ||
          "Invalid verification code",
        );
      } finally {
        setIsVerifyingSetup(false);
      }
    },
    [setupVerificationCode, loginType, router],
  );

  const handleSetupBack = () => {
    setShow2FASetup(false);
    setSetupData(null);
    setSetupVerificationCode("");
    setSetupMessage("");
    setSetupError("");
    setAutoShow2FASetup(false);
  };

  // Handle 2FA input changes (for login)
  const handle2FACodeChange = useCallback(
    (index, value) => {
      const numericValue = value.replace(/\D/g, "");

      if (numericValue) {
        const newCode = twoFACode.split("");
        newCode[index] = numericValue;
        const updatedCode = newCode.join("").slice(0, 6);

        setTwoFACode(updatedCode);

        if (twoFAError) {
          setTwoFAError("");
        }

        if (updatedCode.length === 6) {
          setTimeout(() => {
            handle2FAVerification(null, updatedCode);
          }, 100);
        }

        if (index < 5 && numericValue) {
          setTimeout(() => {
            const nextInput = document.getElementById(`2fa-input-${index + 1}`);
            nextInput?.focus();
          }, 10);
        }
      } else {
        // Handle backspace/delete
        const newCode = twoFACode.split("");
        newCode[index] = "";
        setTwoFACode(newCode.join(""));
      }
    },
    [twoFACode, twoFAError, handle2FAVerification],
  );

  // Handle keydown for backspace navigation
  const handle2FAKeyDown = useCallback(
    (index, e) => {
      if (e.key === "Backspace") {
        const currentValue = twoFACode[index];

        if (!currentValue && index > 0) {
          // If current box is empty, move to previous box
          setTimeout(() => {
            const prevInput = document.getElementById(`2fa-input-${index - 1}`);
            prevInput?.focus();
          }, 10);
        }
      }
    },
    [twoFACode],
  );

  // Handle 2FA setup input changes
  const handleSetupCodeChange = useCallback(
    (index, value) => {
      const numericValue = value.replace(/\D/g, "");

      if (numericValue) {
        const newCode = setupVerificationCode.split("");
        newCode[index] = numericValue;
        const updatedCode = newCode.join("").slice(0, 6);

        setSetupVerificationCode(updatedCode);

        if (setupError) {
          setSetupError("");
        }

        if (updatedCode.length === 6) {
          setTimeout(() => {
            verify2FASetup(updatedCode);
          }, 100);
        }

        if (index < 5 && numericValue) {
          setTimeout(() => {
            const nextInput = document.getElementById(
              `setup-input-${index + 1}`,
            );
            nextInput?.focus();
          }, 10);
        }
      } else {
        const newCode = setupVerificationCode.split("");
        newCode[index] = "";
        setSetupVerificationCode(newCode.join(""));
      }
    },
    [setupVerificationCode, setupError, verify2FASetup],
  ); // Now verify2FASetup is memoized

  // Handle keydown for backspace navigation in setup
  const handleSetupKeyDown = useCallback(
    (index, e) => {
      if (e.key === "Backspace") {
        const currentValue = setupVerificationCode[index];

        if (!currentValue && index > 0) {
          // If current box is empty, move to previous box
          setTimeout(() => {
            const prevInput = document.getElementById(
              `setup-input-${index - 1}`,
            );
            prevInput?.focus();
          }, 10);
        }
      }
    },
    [setupVerificationCode],
  );

  // 2FA Verification Form (for login) - RESPONSIVE
  const render2FAForm = () => (
    <div className="space-y-3 sm:space-y-4 w-full max-w-xs px-2 sm:px-0">
      <div className="text-center mb-3 sm:mb-4">
        <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full mb-2 sm:mb-3">
          <Shield className="text-blue-600 hidden sm:block" size={24} />
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-gray-800">
          Two-Factor Authentication
        </h2>
        <p className="text-xs sm:text-sm text-gray-600 mt-1 px-2">
          Enter the 6-digit code from your authenticator app
        </p>
      </div>

      {twoFAError && (
        <div className="bg-red-50 border border-red-200 rounded-lg sm:rounded-xl p-2.5 sm:p-3 mb-3 relative">
          <p className="text-red-600 text-xs sm:text-sm font-medium flex items-center gap-1.5 pr-6">
            <X size={15} className="shrink-0 hidden sm:block" />
            <span className="line-clamp-2">{twoFAError}</span>
          </p>
          <button
            onClick={clear2FAError}
            className="absolute right-2 sm:right-2.5 top-2.5 sm:top-3 text-red-400 hover:text-red-600 cursor-pointer"
            aria-label="Dismiss error"
          >
            <X size={15} className="hidden sm:block" />
          </button>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg sm:rounded-xl p-3 sm:p-4">
        <div className="flex items-start gap-2 sm:gap-3">
          <Smartphone
            className="text-blue-500 mt-1 shrink-0 hidden sm:block"
            size={18}
          />
          <div>
            <p className="text-xs sm:text-sm font-medium text-blue-800">
              Microsoft Authenticator Required
            </p>
            <p className="text-[10px] sm:text-xs text-blue-600 mt-1">
              Open your Microsoft Authenticator app and enter the 6-digit code
              to complete your login.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2 sm:space-y-3">
        <label className="text-xs sm:text-sm font-medium text-gray-700">
          Verification Code
        </label>
        <div className="flex justify-center gap-1.5 sm:gap-2">
          {[...Array(6)].map((_, index) => (
            <input
              key={index}
              id={`2fa-input-${index}`}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={twoFACode[index] || ""}
              onChange={(e) => handle2FACodeChange(index, e.target.value)}
              onKeyDown={(e) => handle2FAKeyDown(index, e)}
              onFocus={(e) => e.target.select()}
              className="w-10 h-10 sm:w-12 sm:h-12 text-center text-base sm:text-lg font-semibold border-2 border-gray-300 rounded-lg sm:rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-200"
              autoFocus={index === 0 && !twoFACode}
            />
          ))}
        </div>

        {isVerifying2FA && (
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-blue-600 text-xs sm:text-sm">
              <RefreshCw size={16} className="animate-spin hidden sm:block" />
              Verifying...
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // 2FA Setup Modal - RESPONSIVE
  const render2FASetupModal = () => (
    <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white/95 backdrop-blur-md rounded-xl sm:rounded-2xl shadow-2xl border border-white/20 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-bold text-gray-800">
              {autoShow2FASetup
                ? "Setup Two-Factor Authentication"
                : "Two-Factor Authentication"}
            </h3>
            <button
              onClick={handleSetupBack}
              className="text-gray-500 hover:text-gray-700 transition-colors duration-200 cursor-pointer"
            >
              <X size={24} className="hidden sm:block" />
            </button>
          </div>

          {autoShow2FASetup && (
            <div className="bg-blue-50/80 border border-blue-200 text-blue-800 px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl mb-3 sm:mb-4 backdrop-blur-sm">
              <p className="text-xs sm:text-sm font-medium">
                🔒 Enhance your account security by setting up Two-Factor
                Authentication
              </p>
            </div>
          )}

          {setupMessage && (
            <div className="bg-green-50/80 border border-green-200 text-green-800 px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl mb-3 sm:mb-4 backdrop-blur-sm">
              <p className="text-xs sm:text-sm">{setupMessage}</p>
            </div>
          )}

          {setupError && (
            <div className="bg-red-50/80 border border-red-200 text-red-800 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl mb-3 sm:mb-4 backdrop-blur-sm">
              <p className="text-xs sm:text-sm">{setupError}</p>
            </div>
          )}

          {!is2FAEnabled ? (
            <div className="space-y-4 sm:space-y-6">
              {!setupData ? (
                <div className="text-center">
                  <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 border border-blue-100">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <Shield
                        className="text-blue-600 hidden sm:block"
                        size={24}
                      />
                    </div>
                    <h4 className="font-semibold text-blue-900 mb-2 text-base sm:text-lg">
                      Enhanced Security
                    </h4>
                    <p className="text-xs sm:text-sm text-blue-700 leading-relaxed px-2">
                      Protect your account with Microsoft Authenticator. You
                      will need to verify your identity using a 6-digit code
                      from the app each time you log in.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <button
                      onClick={start2FASetup}
                      disabled={isSettingUp2FA}
                      className="w-full bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-medium text-sm disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl cursor-pointer"
                    >
                      {isSettingUp2FA ? (
                        <div className="flex items-center justify-center">
                          <RefreshCw className="animate-spin -ml-1 mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white" />
                          Setting Up...
                        </div>
                      ) : (
                        "Enable 2FA"
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-blue-100">
                    <h4 className="font-semibold text-blue-900 mb-3 sm:mb-4 text-base sm:text-lg">
                      Setup Instructions:
                    </h4>

                    <div className="space-y-3 sm:space-y-4">
                      {/* QR Code - Responsive */}
                      <div className="text-center">
                        <p className="text-xs sm:text-sm text-blue-800 mb-2 sm:mb-3 font-medium">
                          1. Scan this QR code:
                        </p>
                        <div className="bg-white p-2 rounded-lg sm:rounded-xl shadow-lg inline-block">
                          {setupData?.qr_image ? (
                            <div className="relative w-40 h-40 sm:w-48 sm:h-48">
                              <Image
                                src={setupData.qr_image}
                                alt="QR Code for Microsoft Authenticator"
                                fill
                                className="rounded-lg object-contain"
                                sizes="(max-width: 640px) 160px, 192px"
                                priority
                              />
                            </div>
                          ) : setupData?.secret ? (
                            <div className="w-40 h-40 sm:w-48 sm:h-48 flex flex-col items-center justify-center bg-gray-100 rounded-lg">
                              <QrCode
                                size={48}
                                className="text-gray-400 mb-2 hidden sm:block"
                              />
                              <p className="text-xs sm:text-sm text-gray-600 text-center">
                                QR Code not available
                              </p>
                              <p className="text-[10px] sm:text-xs text-gray-500 mt-2">
                                Use manual secret instead
                              </p>
                            </div>
                          ) : (
                            <div className="w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center bg-gray-100 rounded-lg">
                              <RefreshCw
                                size={48}
                                className="text-gray-400 animate-spin hidden sm:block"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* OTP Input - Responsive */}
                      <div>
                        <p className="text-xs sm:text-sm text-blue-800 mb-2 sm:mb-3 font-medium">
                          3. Enter verification code:
                        </p>
                        <div className="flex justify-center gap-1.5 sm:gap-2 mb-3">
                          {[...Array(6)].map((_, index) => (
                            <input
                              key={index}
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              maxLength={1}
                              value={setupVerificationCode[index] || ""}
                              onChange={(e) =>
                                handleSetupCodeChange(index, e.target.value)
                              }
                              onKeyDown={(e) => handleSetupKeyDown(index, e)}
                              onFocus={(e) => e.target.select()}
                              id={`setup-input-${index}`}
                              className="w-10 h-10 sm:w-12 sm:h-12 text-center text-base sm:text-lg font-semibold bg-white border-2 border-gray-300 rounded-lg sm:rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-200 shadow-sm"
                              autoFocus={
                                index === 0 &&
                                setupVerificationCode.length === 0
                              }
                            />
                          ))}
                        </div>
                        <div className="text-center">
                          {isVerifyingSetup && (
                            <div className="flex items-center justify-center gap-2 text-blue-600 text-xs sm:text-sm">
                              <RefreshCw className="animate-spin h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              Verifying...
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center space-y-4 sm:space-y-6">
              <div className="bg-linear-to-br from-green-50 to-emerald-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-green-100">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Check className="text-green-600 hidden sm:block" size={32} />
                </div>
                <h4 className="font-semibold text-green-900 mb-2 text-base sm:text-lg">
                  2FA is Enabled
                </h4>
                <p className="text-xs sm:text-sm text-green-700">
                  Your account is protected with Microsoft Authenticator.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Original Login Form - OPTIMIZED & RESPONSIVE
  const renderLoginForm = () => (
    <form
      onSubmit={handleSubmit}
      className="space-y-2 sm:space-y-2.5 w-full max-w-xs px-2 sm:px-0"
      noValidate
    >
      {/* Company Code Field */}
      <div className="space-y-1">
        <label
          htmlFor="companyCode"
          className="text-[11px] sm:text-xs font-medium text-gray-700 ml-1"
        >
          Company Code
        </label>
        <div className="relative">
          <div className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Building size={16} className="hidden sm:block" />
          </div>
          <input
            id="companyCode"
            type="text"
            value={companyCode}
            onChange={(e) =>
              handleFieldChange(
                "companyCode",
                e.target.value.toUpperCase(),
                validateCompanyCode,
              )
            }
            onBlur={() =>
              handleBlur("companyCode", companyCode, validateCompanyCode)
            }
            placeholder="Enter company code"
            className={`pl-8 sm:pl-9 pr-7 sm:pr-8 text-xs sm:text-sm ${getBorderClass(
              getFieldStatus("companyCode", companyCode, errors.companyCode),
            )}`}
          />
          {getFieldStatus("companyCode", companyCode, errors.companyCode) ===
            "valid" && (
              <div className="absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2">
                <Check className="text-green-500" size={14} />
              </div>
            )}
        </div>
        {/* Error with smooth transition */}
        <div
          className="overflow-hidden transition-all duration-200 ease-in-out"
          style={{
            maxHeight:
              errors.companyCode && touched.companyCode ? "20px" : "0px",
          }}
        >
          {errors.companyCode && touched.companyCode && (
            <p className="text-red-600 text-[10px] sm:text-xs ml-1 flex items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-200">
              <X size={11} className="shrink-0" />
              <span className="line-clamp-1">{errors.companyCode}</span>
            </p>
          )}
        </div>
      </div>

      {/* Email Field */}
      <div className="space-y-1">
        <label
          htmlFor="email"
          className="text-[11px] sm:text-xs font-medium text-gray-700 ml-1"
        >
          Email Address
        </label>
        <div className="relative">
          <div className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Mail size={16} className="hidden sm:block" />
          </div>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) =>
              handleFieldChange("email", e.target.value, validateEmail)
            }
            onBlur={() => handleBlur("email", email, validateEmail)}
            placeholder="Enter your email"
            className={`pl-8 sm:pl-9 pr-7 sm:pr-8 text-xs sm:text-sm ${getBorderClass(
              getFieldStatus("email", email, errors.email),
            )}`}
          />
          {getFieldStatus("email", email, errors.email) === "valid" && (
            <div className="absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2">
              <Check className="text-green-500" size={14} />
            </div>
          )}
        </div>
        {/* Error with smooth transition */}
        <div
          className="overflow-hidden transition-all duration-200 ease-in-out"
          style={{
            maxHeight: errors.email && touched.email ? "20px" : "0px",
          }}
        >
          {errors.email && touched.email && (
            <p className="text-red-600 text-[10px] sm:text-xs ml-1 flex items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-200">
              <X size={11} className="shrink-0" />
              <span className="line-clamp-1">{errors.email}</span>
            </p>
          )}
        </div>
      </div>

      {/* Password Field */}
      <div className="space-y-1">
        <label
          htmlFor="password"
          className="text-[11px] sm:text-xs font-medium text-gray-700 ml-1"
        >
          Password
        </label>
        <div className="relative">
          <div className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Lock size={16} className="hidden sm:block" />
          </div>
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) =>
              handleFieldChange("password", e.target.value, validatePassword)
            }
            onBlur={() => handleBlur("password", password, validatePassword)}
            placeholder="Enter your password"
            className={`pl-8 sm:pl-9 pr-14 sm:pr-16 text-xs sm:text-sm ${getBorderClass(
              getFieldStatus("password", password, errors.password),
            )}`}
          />
          {getFieldStatus("password", password, errors.password) ===
            "valid" && (
              <div className="absolute right-8 sm:right-9 top-1/2 -translate-y-1/2">
                <Check className="text-green-500" size={14} />
              </div>
            )}
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff size={16} className="hidden sm:block" />
            ) : (
              <Eye size={16} className="hidden sm:block" />
            )}
          </button>
        </div>
        {/* Error with smooth transition */}
        <div
          className="overflow-hidden transition-all duration-200 ease-in-out"
          style={{
            maxHeight: errors.password && touched.password ? "20px" : "0px",
          }}
        >
          {errors.password && touched.password && (
            <p className="text-red-600 text-[10px] sm:text-xs ml-1 flex items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-200">
              <X size={11} className="shrink-0" />
              <span className="line-clamp-1">{errors.password}</span>
            </p>
          )}
        </div>
      </div>

      {/* Captcha Section - Responsive */}
      <div className="space-y-1 sm:space-y-1.5">
        <label className="text-[11px] sm:text-xs font-medium text-gray-700 ml-1">
          Security Verification
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 bg-linear-to-r from-gray-50 to-gray-100 px-2.5 sm:px-3 py-1.5 rounded-lg border border-gray-200 flex items-center justify-between shadow-sm">
            <span
              className="font-mono text-xs sm:text-sm font-bold tracking-wider select-none"
              style={{
                background: "linear-gradient(135deg, #003f88 0%, #006747 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {captchaCode}
            </span>
            <button
              type="button"
              onClick={generateCaptcha}
              className="text-gray-400 hover:text-cyan-600 transition-transform duration-300 hover:rotate-180 cursor-pointer"
              aria-label="Generate new CAPTCHA"
            >
              <RefreshCw size={16} className="hidden sm:block" />
            </button>
          </div>

          <div className="relative flex-1">
            <ShieldCheck
              className="hidden sm:block absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
            />
            <input
              type="text"
              value={userCaptchaInput}
              onChange={(e) => handleFieldChange("captcha", e.target.value)}
              placeholder="Enter code"
              maxLength={6}
              className={`pl-7 sm:pl-8 pr-7 sm:pr-8 text-xs sm:text-sm ${getBorderClass(captchaStatus)}`}
            />
            {captchaStatus === "valid" && (
              <div className="absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2">
                <Check className="text-green-500" size={14} />
              </div>
            )}
            {captchaStatus === "error" && userCaptchaInput.length === 6 && (
              <div className="absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2">
                <X className="text-red-500" size={14} />
              </div>
            )}
          </div>
        </div>
        <p className="text-[10px] sm:text-xs text-gray-500 ml-1">
          Enter the 6-digit code shown above
        </p>
      </div>

      {/* Submit Button - Responsive */}
      <div className="pt-1.5 sm:pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2 sm:py-2.5 text-white rounded-lg font-semibold text-xs sm:text-sm bg-linear-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98] cursor-pointer"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-1.5">
              <RefreshCw size={16} className="animate-spin hidden sm:block" />
              Signing in...
            </span>
          ) : (
            "Sign In"
          )}
        </button>
      </div>
    </form>
  );

  return (
    <>
      <div className="min-h-screen bg-linear-to-br from-teal-50 via-blue-50 to-purple-50 flex items-center justify-center p-2 sm:p-4">
        <div className="w-full max-w-4xl bg-white rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden">
          <div className="grid lg:grid-cols-2 min-h-[450px] sm:min-h-[500px]">
            {/* Left Section */}
            <div className="hidden lg:flex relative bg-linear-to-br from-teal-500/10 via-blue-500/10 to-purple-500/10 p-6 flex-col overflow-visible">
              {" "}
              {/* Changed from overflow-hidden to overflow-visible */}
              <div className="relative z-10 mb-3">
                <h1 className="text-2xl font-bold text-blue-900 mb-2">
                  {requires2FA ? "Secure Verification" : "Welcome Back....!"}
                </h1>
                <p className="text-gray-700 text-sm font-medium">
                  {requires2FA
                    ? "Two-Factor Authentication"
                    : "Secure Hospital Access Portal"}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  {requires2FA
                    ? "Enter code from your authenticator app"
                    : "Empowering healthcare through intelligent monitoring"}
                </p>
              </div>
              {/* Image container - adjusted to allow overflow */}
              <div className="hidden lg:block absolute bottom-0 left-1/2 transform -translate-x-7 w-[400px] h-[420px] z-20 overflow-visible">
                <div className="relative w-full h-full">
                  <Image
                    src="/doctor.png"
                    alt="Doctor"
                    fill
                    className="object-contain object-bottom"
                    priority
                    sizes="400px"
                  />
                </div>
              </div>
            </div>

            {/* Right Section - Responsive padding and spacing */}
            <div className="p-4 sm:p-6 md:p-8 flex flex-col justify-center items-center bg-gray-50">
              {/* Logo and Header - Responsive */}
              <div className="mb-3 sm:mb-4 flex flex-col items-center w-full">
                <div className="relative w-32 sm:w-40 h-10 sm:h-12 mb-1.5">
                  <Image
                    src="/bluaccess_logo_dark.png"
                    alt="BluAccess Logo"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
                <p className="text-gray-600 text-xs sm:text-sm font-medium">
                  For Hospitals
                </p>
                <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 text-center px-2">
                  Hospital Access Management & Monitoring System
                </p>
              </div>

              {/* Error Message - Responsive */}
              <div className="w-full max-w-xs mb-2">
                {loginError && !requires2FA && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-2 sm:p-2.5 relative animate-in fade-in slide-in-from-top-2 duration-300">
                    <p className="text-red-600 text-[11px] sm:text-xs font-medium flex items-center gap-1.5 pr-6">
                      <X size={14} className="shrink-0" />
                      <span className="line-clamp-2">{loginError}</span>
                    </p>
                    <button
                      onClick={clearLoginError}
                      className="absolute right-2 top-2 text-red-400 hover:text-red-600 cursor-pointer"
                      aria-label="Dismiss error"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Conditional Rendering */}
              {requires2FA ? render2FAForm() : renderLoginForm()}
            </div>
          </div>
        </div>
      </div>

      {showRoleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-80">
            <h3 className="text-lg font-semibold mb-4 text-center">
              Select Your Role
            </h3>

            <div className="space-y-2">
              {availableRoles.map((role) => (
                <button
                  key={role}
                  onClick={async () => {
                    const res = await switchUserRole({ role });

                    const userSession = JSON.parse(
                      localStorage.getItem("userSession") || "{}",
                    );

                    updateUserSession({
                      access_token: res.data.access_token,
                      active_role: role,
                      permissions: res.data.permissions || [],
                    });

                    if (role === "guard") {
                      try {
                        const userSession = JSON.parse(
                          localStorage.getItem("userSession") || "{}",
                        );

                        // 🔍 Ask backend: active shift?
                        const res = await getActiveGuardShift();

                        if (res.data.active) {
                          const gateRes = await getGatesForUser();

                          const gate = gateRes.data.data.find(
                            (g) => g.id === res.data.gate_id,
                          );

                          updateUserSession({
                            active_role: "guard",
                            gate_id: res.data.gate_id,
                            gate_name: gate?.name || "",
                          });

                          setShowRoleModal(false);
                          router.push("/security-portal/dashboard");
                          return;
                        }

                        // ❌ No active shift → ask for gate
                        setShowRoleModal(false);
                        await fetchGatesForUser();
                        setShowGateModal(true);
                      } catch (err) {
                        setGateError("Unable to verify shift status");
                      }
                    } else {
                      redirectByRole(role);
                    }
                  }}
                  className="w-full py-2 rounded-lg bg-gray-100 hover:bg-gray-200 font-medium"
                >
                  {role.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showGateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96">
            <h3 className="text-lg font-semibold mb-1 text-center">
              Gate Selection
            </h3>
            <p className="text-sm text-gray-500 text-center mb-4">
              Choose your assigned gate to begin shift
            </p>

            {gateError && (
              <p className="text-red-500 text-sm mb-2">{gateError}</p>
            )}

            <select
              value={selectedGate}
              onChange={(e) => setSelectedGate(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Choose a gate...</option>
              {gates.map((gate) => (
                <option key={gate.id} value={gate.id}>
                  {gate.name}
                </option>
              ))}
            </select>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  localStorage.removeItem("userSession");
                  window.location.reload();
                }}
                className="px-4 py-2 text-sm rounded-lg border"
              >
                Cancel
              </button>
              <button
                disabled={!selectedGate}
                onClick={async () => {
                  try {
                    setGateError("");

                    const userSession = JSON.parse(
                      localStorage.getItem("userSession") || "{}",
                    );

                    const selectedGateObj = gates.find(
                      (gate) => gate.id === Number(selectedGate),
                    );

                    await startGuardShift({
                      gate_id: selectedGateObj.id, // backend needs id
                      shift_id: userSession.shift_id,
                    });

                    updateUserSession({
                      gate_id: selectedGateObj.id,
                      gate_name: selectedGateObj.name,
                      active_role: "guard",
                    });

                    router.push("/security-portal/dashboard");
                  } catch (err) {
                    setGateError(
                      err.response?.data?.message || "Unable to start shift",
                    );
                  }
                }}
              >
                Start Shift
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2FA Setup Modal */}
      {show2FASetup && render2FASetupModal()}
    </>
  );
}
