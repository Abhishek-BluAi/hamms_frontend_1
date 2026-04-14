'use client';

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Camera, Check, ChevronRight, ArrowLeft, AlertCircle, 
  Shield, RotateCw, Scan, X, Sun, User, CheckCircle 
} from "lucide-react";
import { saveFaceEncoding } from "@/utils/api";

export default function FaceCapturePage() {
  const router = useRouter();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [captureStep, setCaptureStep] = useState('capture');
  const [cameraError, setCameraError] = useState(false);

  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      setCameraError(false);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraReady(true);
      }
    } catch (err) {
      setCameraError(true);
      console.error(err);
    }
  };

  const handleCapture = async () => {
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const ctx = canvas.getContext("2d");
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      const imageDataUrl = canvas.toDataURL("image/jpeg", 0.9);
      setCapturedImage(imageDataUrl);
      setCaptureStep('preview');
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    } catch (err) {
      console.error(err);
      alert("Failed to capture image");
    }
  };

  const handleRetry = async () => {
    setCapturedImage(null);
    setCaptureStep('capture');
    setCameraReady(false);
    await startCamera();
  };

  const handleUpload = async () => {
    try {
      setUploading(true);
      setCaptureStep('processing');

      const canvas = canvasRef.current;
      const blob = await new Promise((resolve) => 
        canvas.toBlob(resolve, "image/jpeg", 0.9)
      );

      if (!blob) throw new Error("Failed to process image");

      const visitorData = JSON.parse(localStorage.getItem("visitorData"));
      const company_code = localStorage.getItem("company_code");

      if (!visitorData || !company_code) {
        alert("Missing visitor data");
        return;
      }

      const formData = new FormData();
      formData.append("image", blob);
      formData.append("first_name", visitorData.firstName);
      formData.append("last_name", visitorData.lastName);
      formData.append("phone", visitorData.phone);
      formData.append("email", visitorData.email);        
      formData.append("address", visitorData.address); 
      formData.append("gender", visitorData.gender);
      formData.append("dob", visitorData.dob);
      formData.append("company_code", company_code);

      const res = await saveFaceEncoding(formData);
      sessionStorage.setItem("visitorId", res.data.visitor_id);
      
      setTimeout(() => {
        router.push("/new-visitor/visit-details");
      }, 1000);

    } catch (err) {
      console.error(err);
      alert("Face registration failed");
      setUploading(false);
      setCaptureStep('preview');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Biometric Face Capture
            </h1>
            <p className="text-slate-600 mt-1">
              {captureStep === 'capture' && "Position your face within the frame"}
              {captureStep === 'preview' && "Review your captured image"}
              {captureStep === 'processing' && "Processing your facial biometrics"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium text-sm">
              Step 2 of 4
            </span>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="grid grid-cols-4 gap-2">
            {['Personal Info', 'Face Capture', 'Visit Details', 'Verification'].map((step, index) => (
              <div key={step} className="relative">
                <div className={`h-2 rounded-full mb-2 ${
                  index < 1 ? 'bg-green-600' : 
                  index === 1 ? 'bg-blue-600' : 
                  'bg-slate-200'
                }`} />
                <p className={`text-sm font-medium flex items-center gap-1 ${
                  index < 1 ? 'text-green-600' :
                  index === 1 ? 'text-blue-600' :
                  'text-slate-500'
                }`}>
                  {index < 1 && <CheckCircle className="w-4 h-4" />}
                  {step}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
            <h2 className="text-xl font-semibold text-white">Face Capture</h2>
            <p className="text-blue-100 text-sm mt-1">
              Please capture a clear image of your face
            </p>
          </div>

          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Camera Section */}
              <div className="space-y-4">
                <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800">
                  {/* Status Bar */}
                  <div className="bg-slate-800 px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${cameraReady ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                      <span className="text-xs text-slate-300">
                        {cameraReady ? 'Camera Ready' : 'Initializing...'}
                      </span>
                    </div>
                    {captureStep === 'capture' && (
                      <Scan className="h-4 w-4 text-blue-400" />
                    )}
                  </div>

                  {/* Video/Capture Area */}
                  <div className="relative aspect-[4/3] bg-black">
                    {cameraError ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6">
                        <AlertCircle className="h-12 w-12 text-red-400 mb-3" />
                        <p className="text-sm text-center">Camera access denied</p>
                        <button 
                          onClick={startCamera}
                          className="mt-4 px-4 py-2 bg-blue-600 rounded-lg text-sm"
                        >
                          Retry Camera
                        </button>
                      </div>
                    ) : (
                      <>
                        {captureStep === 'capture' && (
                          <>
                            <video
                              ref={videoRef}
                              autoPlay
                              playsInline
                              muted
                              className="w-full h-full object-cover"
                              style={{ transform: "scaleX(-1)" }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-48 h-48 border-2 border-blue-400 rounded-full opacity-50 border-dashed" />
                            </div>
                            <div className="absolute bottom-4 left-0 right-0 text-center">
                              <p className="text-white text-sm bg-black/50 py-1 px-3 inline-block rounded-full">
                                Center your face
                              </p>
                            </div>
                          </>
                        )}

                        {captureStep !== 'capture' && capturedImage && (
                          <img 
                            src={capturedImage} 
                            alt="Captured" 
                            className="w-full h-full object-cover"
                          />
                        )}

                        {captureStep === 'processing' && (
                          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
                            <div className="h-12 w-12 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
                            <p className="text-white font-medium">Processing...</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Controls */}
                <div className="flex gap-3">
                  {captureStep === 'capture' && (
                    <button
                      disabled={!cameraReady || uploading}
                      onClick={handleCapture}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Camera className="h-5 w-5" />
                      Capture Photo
                    </button>
                  )}

                  {captureStep === 'preview' && (
                    <>
                      <button
                        onClick={handleRetry}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
                      >
                        <RotateCw className="h-5 w-5" />
                        Retake
                      </button>
                      
                      <button
                        onClick={handleUpload}
                        disabled={uploading}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                      >
                        <Check className="h-5 w-5" />
                        Confirm
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Guidelines */}
              <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Capture Guidelines
                </h3>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Check className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Face centered</p>
                      <p className="text-xs text-slate-600">Keep your face within the circle</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Sun className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Good lighting</p>
                      <p className="text-xs text-slate-600">Avoid harsh shadows</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <X className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">No accessories</p>
                      <p className="text-xs text-slate-600">Remove sunglasses, masks, hats</p>
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Shield className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-blue-700">
                        Your facial data is encrypted and used only for verification
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t border-slate-200">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 px-6 py-3 text-slate-600 font-medium hover:text-slate-800 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                Back
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-center gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            End-to-end encrypted
          </div>
          <div className="flex items-center gap-1">
            <Check className="h-3 w-3" />
            ISO/IEC 19794-5 compliant
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}