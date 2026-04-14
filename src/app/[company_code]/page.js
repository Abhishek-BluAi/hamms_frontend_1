"use client";

import { useState, useEffect, useRef } from "react";
import { Check, Eye, Lightbulb, Clock, Camera } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { validateCompanyCode, matchFace } from "@/utils/api";

export default function QuickCheckIn() {
  const router = useRouter();
  const params = useParams();
  const [checkingCompany, setCheckingCompany] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [progress, setProgress] = useState(0);
  const [cameraError, setCameraError] = useState(null);
  const [cameraInitialized, setCameraInitialized] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [capturedImage, setCapturedImage] = useState(null);
  const [matchError, setMatchError] = useState(null); // { message, icon }
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    let mounted = true;



    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });

        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          try {
            await videoRef.current.play();
            if (mounted) {
              setCameraInitialized(true);
              setCameraError(null);
            }
          } catch (playErr) {
            console.error("Play error:", playErr);
            if (mounted) setCameraError("Click to start camera");
          }
        }
      } catch (err) {
        console.error("Camera error:", err);
        if (mounted) {
          if (
            err.name === "NotAllowedError" ||
            err.name === "PermissionDeniedError"
          ) {
            setCameraError("Camera access denied. Please allow camera access.");
          } else if (
            err.name === "NotFoundError" ||
            err.name === "DevicesNotFoundError"
          ) {
            setCameraError("No camera found on this device.");
          } else {
            setCameraError("Could not access camera.");
          }
        }
      }
    };

    const init = async () => {
      try {
        if (params?.company_code) {
          await validateCompanyCode(params.company_code);
          localStorage.setItem("company_code", params.company_code);
        }
        if (mounted) {
          setCheckingCompany(false);
          startCamera();
        }
      } catch (err) {
        if (mounted) router.push("/invalid-company");
      }
    };

    init();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [params?.company_code, router]);

  const startRecognition = () => {
    setShowOverlay(false);
    setScanning(true);
    setProgress(0);
    setMatchError(null);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + 10;
      });
    }, 200);

    setTimeout(() => {
      captureAndMatch(progressInterval);
    }, 500);
  };

  const captureAndMatch = async (progressInterval) => {
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas) throw new Error("Camera not ready");

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageDataUrl = canvas.toDataURL("image/jpeg", 0.9);
      setCapturedImage(imageDataUrl);

      const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, "image/jpeg", 0.9);
      });

      if (!blob) throw new Error("Failed to capture image");

      const formData = new FormData();
      formData.append("image", blob, "face.jpg");

      const response = await matchFace(formData);

      clearInterval(progressInterval);
      setProgress(100);
      setScanning(false);
      setFaceDetected(true);

      if (response.data.visitor_id) {
        sessionStorage.setItem("visitorId", response.data.visitor_id);
        sessionStorage.setItem("confidence", response.data.confidence);

        router.push("/new-visitor/visit-details");
      }

    } catch (error) {
      console.error("Face match error:", error);
      clearInterval(progressInterval);
      setProgress(0);
      setScanning(false);

      // Parse error message from API response if available
      let errorMessage = "Recognition failed. Please try again.";
      let errorIcon = "error";

      const apiError = error?.response?.data?.error || error?.message || "";

      if (
        apiError.includes("NoMatch") ||
        apiError.includes("No match") ||
        apiError.includes("not found") ||
        apiError.includes("404")
      ) {
        setMatchError({
          message: "Face not recognized. Redirecting to Registeration...",
          icon: "nomatch",
        });
        setTimeout(() => {
          router.push("/new-visitor");
        }, 2000);
        return;
      }

      if (apiError.includes("Multiple faces")) {
        errorMessage =
          "Multiple faces detected. Please ensure only one face is visible.";
        errorIcon = "multiple";
      } else if (apiError.includes("blurry") || apiError.includes("Blurry")) {
        errorMessage =
          "Image is blurry. Please hold still and ensure good lighting.";
        errorIcon = "blurry";
      } else if (apiError.includes("No face")) {
        errorMessage =
          "No face detected. Please position your face in the circle.";
        errorIcon = "noface";
      } else if (apiError.includes("No registered faces")) {
        errorMessage =
          "No registered faces in the system. Please register first.";
        errorIcon = "empty";
      } else if (
        apiError.includes("NoMatch") ||
        apiError.includes("No match") ||
        apiError.toLowerCase().includes("not found")
      ) {
        errorMessage = "Face not recognized. Redirecting to manual entry...";
        errorIcon = "nomatch";
      } else if (apiError) {
        errorMessage = apiError;
      }

      setMatchError({ message: errorMessage, icon: errorIcon });

      // NoMatch → redirect to /new-visitor after showing message
      if (errorIcon === "empty") {
        setTimeout(() => {
          router.push("/new-visitor");
        }, 2500);
      } else {
        // Other errors → reset and let user try again
        setTimeout(() => {
          setMatchError(null);
          setShowOverlay(true);
          setCapturedImage(null);
        }, 2500);
      }
    }
  };

  const retryCamera = () => {
    setCameraError(null);
    setCameraInitialized(false);
    setShowOverlay(true);
    setFaceDetected(false);
    setCapturedImage(null);

    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current
            .play()
            .then(() => {
              setCameraInitialized(true);
              setCameraError(null);
            })
            .catch(() => {
              setCameraError("Click to start camera");
            });
        }
      })
      .catch(() => {
        setCameraError("Camera access denied");
      });
  };

  if (checkingCompany) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Checking company...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-3xl bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="text-center pt-6 sm:pt-8 pb-4 sm:pb-6 px-4 sm:px-6">
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 mb-2">
            Quick Check-in
          </h1>
          <p className="text-sm sm:text-base text-slate-600">
            Position your face in the circle for instant recognition
          </p>
        </div>

        {/* Camera View */}
        <div className="relative bg-slate-900 mx-4 sm:mx-6 rounded-xl flex items-center justify-center py-4 sm:py-6 px-0">
          {/* Scanning Badge */}
          {scanning && (
            <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-emerald-500 text-white px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium flex items-center gap-2 z-20">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
              Scanning...
            </div>
          )}

          {/* Face Detection Circle */}
          <div className="relative aspect-square w-full max-w-[320px] sm:max-w-[400px] md:max-w-[450px]">
            {/* Percentage Badge */}
            {(scanning || faceDetected) && (
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold shadow-lg z-10">
                {progress}%
              </div>
            )}

            {/* Progress Circle */}
            <svg
              className="absolute inset-0 w-full h-full -rotate-90"
              viewBox="0 0 400 400"
            >
              <circle
                cx="200"
                cy="200"
                r="198"
                fill="none"
                stroke="rgb(52 211 153 / 0.2)"
                strokeWidth="4"
              />
              <circle
                cx="200"
                cy="200"
                r="198"
                fill="none"
                stroke={
                  faceDetected ? "rgb(16 185 129)" : "rgb(52 211 153 / 0.6)"
                }
                strokeWidth="4"
                strokeDasharray={`${(progress / 100) * 1243.5} 1243.5`}
                className="transition-all duration-300"
                strokeLinecap="round"
              />
            </svg>

            {/* Camera Container */}
            <div className="relative w-full h-full rounded-full overflow-hidden bg-slate-800">
              {/* Live video — always rendered, visible when not face detected */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                  faceDetected ? "opacity-0" : "opacity-100"
                }`}
                style={{ transform: "scaleX(-1)" }}
              />

              {/* Captured image shown on face detected — full visible, blurred overlay on top */}
              {faceDetected && capturedImage && (
                <img
                  src={capturedImage}
                  alt="Captured face"
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ transform: "scaleX(-1)" }}
                />
              )}

              <canvas ref={canvasRef} className="hidden" />

              {/* Camera Initializing */}
              {!cameraInitialized && !cameraError && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-white/90 text-sm">
                      Initializing camera...
                    </p>
                  </div>
                </div>
              )}

              {/* Camera Error */}
              {cameraError && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-800 p-4">
                  <div className="text-center">
                    <p className="text-red-400 text-sm mb-3">{cameraError}</p>
                    <button
                      onClick={retryCamera}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              )}

              {/* Slight overlay with click to register text */}
              {cameraInitialized &&
                showOverlay &&
                !scanning &&
                !faceDetected &&
                !cameraError && (
                  <div
                    onClick={startRecognition}
                    className="absolute inset-0 flex items-center justify-center cursor-pointer group bg-black/30 hover:bg-black/20 transition-all duration-300"
                  >
                    <div className="text-center">
                      <p className="text-white font-semibold text-lg drop-shadow-lg group-hover:text-emerald-300 transition-colors duration-200">
                        Click to Register
                      </p>
                      <p className="text-white/60 text-sm mt-1 drop-shadow">
                        Position your face in the circle
                      </p>
                    </div>
                  </div>
                )}

              {/* Scanning animation */}
              {scanning && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-14 h-14 border-4 border-emerald-400/40 border-t-emerald-400 rounded-full animate-spin mx-auto mb-3 drop-shadow-lg"></div>
                    <p className="text-emerald-300 font-medium drop-shadow-lg">
                      Analyzing...
                    </p>
                  </div>
                </div>
              )}

              {/* API Error Messages */}
              {matchError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 px-4">
                  <div className="text-center">
                    {/* Icon based on error type */}
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg ${
                        matchError.icon === "nomatch"
                          ? "bg-rose-500"
                          : matchError.icon === "multiple"
                            ? "bg-orange-500"
                            : matchError.icon === "blurry"
                              ? "bg-yellow-500"
                              : matchError.icon === "noface"
                                ? "bg-blue-500"
                                : matchError.icon === "empty"
                                  ? "bg-purple-500"
                                  : "bg-red-500"
                      }`}
                    >
                      {matchError.icon === "nomatch" && (
                        <svg
                          className="w-8 h-8 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      )}
                      {matchError.icon === "multiple" && (
                        <svg
                          className="w-8 h-8 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      )}
                      {matchError.icon === "blurry" && (
                        <svg
                          className="w-8 h-8 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      )}
                      {matchError.icon === "noface" && (
                        <svg
                          className="w-8 h-8 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      )}
                      {matchError.icon === "empty" && (
                        <svg
                          className="w-8 h-8 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                      )}
                      {matchError.icon === "error" && (
                        <svg
                          className="w-8 h-8 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      )}
                    </div>
                    <p className="text-white font-semibold text-sm drop-shadow-lg leading-snug px-2">
                      {matchError.message}
                    </p>
                    <p className="text-white/50 text-xs mt-2">
                      {matchError.icon === "nomatch"
                        ? "Redirecting to manual entry..."
                        : "Retrying in a moment..."}
                    </p>
                  </div>
                </div>
              )}

              {/* Face Detected — clear overlay on top of captured photo, no blur */}
              {faceDetected && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                      <Check className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-white font-semibold text-lg drop-shadow-lg">
                      Face Matched!
                    </p>
                    <p className="text-white/80 text-sm mt-1 drop-shadow">
                      Redirecting...
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 px-4 sm:px-6 py-4 border-t border-slate-100">
          <div className="text-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-1.5 sm:mb-2">
              <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            </div>
            <p className="text-[10px] sm:text-xs text-slate-600 leading-tight">
              Look directly at camera
            </p>
          </div>
          <div className="text-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-1.5 sm:mb-2">
              <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
            </div>
            <p className="text-[10px] sm:text-xs text-slate-600 leading-tight">
              Good lighting helps
            </p>
          </div>
          <div className="text-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-1.5 sm:mb-2">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
            </div>
            <p className="text-[10px] sm:text-xs text-slate-600 leading-tight">
              Takes 2-3 seconds
            </p>
          </div>
        </div>

        {/* Manual Entry Button */}
        <div className="px-4 sm:px-6 pb-4 sm:pb-6">
          <button
            onClick={() => router.push("/new-visitor")}
            className="w-full py-2.5 sm:py-3 px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition-colors text-sm sm:text-base"
          >
            Continue with Manual Entry
          </button>
        </div>
      </div>
    </div>
  );
}
