"use client";

import { useState, useEffect, useRef } from "react";
import {
  Camera,
  Trash2,
  Upload,
  X,
  User,
  Building,
  Truck,
  Package,
  MapPin,
  FileText,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Save,
  Send,
  Phone,
  Mail,
  Calendar,
  Clock,
  UserCircle,
  CreditCard,
  FileCheck,
  Shield,
  ArrowRight,
  Download,
  Printer,
  Edit3,
  Hash,
  Briefcase,
  Users,
  ClipboardList,
  MapPinned,
  FileUp,
  CircleCheck,
  CircleDashed,
} from "lucide-react";
import { createVisitWithDelivery } from "@/utils/api";

export default function DeliveryRegistrationForm() {
  const getGateIdFromStorage = () => {
    if (typeof window === "undefined") return "";

    const userSession = JSON.parse(localStorage.getItem("userSession") || "{}");

    return userSession.gate_id || "";
  };

  const [formData, setFormData] = useState({
    visit: {
      purpose: "delivery",
      entry_gate_id: getGateIdFromStorage(),
      notes: "",
    },
    company: {
      name: "",
      phone: "",
      email: "",
      is_regular: false,
    },
    vehicle: {
      vehicle_type: "",
      registration_number: "",
    },
    visitors: [
      {
        first_name: "",
        last_name: "",
        phone: "",
        email: "",
      },
    ],
    delivery: {
      delivery_type: "",
      invoice_number: "",
      destination_department: "",
      contact_person: "",
    },
    delivery_items: [
      {
        description: "",
        quantity: "",
      },
    ],
  });

  const [files, setFiles] = useState({
    visitor_photos: [],
    vehicle_photos: [],
    delivery_item_photos: [],
    documents: [],
  });

  const [previews, setPreviews] = useState({
    visitor_photos: [],
    vehicle_photos: [],
    delivery_item_photos: [],
    documents: [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showHelper, setShowHelper] = useState(false);
  const [activeSection, setActiveSection] = useState("driver");
  const [completedSections, setCompletedSections] = useState(new Set());
  const [hoveredSection, setHoveredSection] = useState(null);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraTarget, setCameraTarget] = useState(null); // {type,index}
  const [cameraReady, setCameraReady] = useState(false);

  const videoRef = useRef(null);

  const startCamera = async (type, index = 0) => {
    try {
      stopCamera();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });

      setCameraStream(stream);
      setCameraTarget({ type, index });
      setCameraReady(false);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            setCameraReady(true);
          };
        }
      }, 100);
    } catch (err) {
      alert("Camera not available or permission denied");
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !cameraTarget) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    canvas.getContext("2d").drawImage(videoRef.current, 0, 0);

    canvas.toBlob((blob) => {
      const file = new File([blob], "camera.jpg", { type: "image/jpeg" });
      const previewUrl = URL.createObjectURL(file);

      setFiles((prev) => {
        const newFiles = { ...prev };
        const arr = [...(prev[cameraTarget.type] || [])];
        arr[cameraTarget.index] = file;
        newFiles[cameraTarget.type] = arr;
        return newFiles;
      });

      setPreviews((prev) => {
        const newPreviews = { ...prev };
        const arr = [...(prev[cameraTarget.type] || [])];
        arr[cameraTarget.index] = previewUrl;
        newPreviews[cameraTarget.type] = arr;
        return newPreviews;
      });
    });

    stopCamera();
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
    }
    setCameraStream(null);
    setCameraTarget(null);
    setCameraReady(false);
  };

  const renderCameraBox = (type, index, preview) => {
    // camera active for this box
    if (cameraTarget?.type === type && cameraTarget?.index === index) {
      return (
        <div className="relative w-full h-full">
          {!cameraReady && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
              Loading camera...
            </div>
          )}

          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
            <button
              type="button"
              onClick={capturePhoto}
              className="px-3 py-1 bg-white rounded shadow"
            >
              Capture
            </button>

            <button
              type="button"
              onClick={stopCamera}
              className="px-3 py-1 bg-red-500 text-white rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

    // preview exists → show photo + retake
    if (preview) {
      return (
        <div className="relative w-full h-full">
          <img src={preview} className="w-full h-full object-cover" />

          <button
            type="button"
            onClick={() => startCamera(type, index)}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-white rounded shadow"
          >
            Retake
          </button>
        </div>
      );
    }

    return null;
  };

  // Refs for each section
  const sectionRefs = useRef({
    driver: null,
    company: null,
    vehicle: null,
    delivery: null,
    destination: null,
    documents: null,
  });

  // Refs for file inputs
  const fileInputs = useRef({
    driverUpload: null,
    driverCamera: null,
    vehicleUpload: null,
    vehicleCamera: null,
    plateUpload: null,
    plateCamera: null,
    deliveryItemInputs: {},
  });

  useEffect(() => {
    const gateId = getGateIdFromStorage();
    if (gateId) {
      setFormData((prev) => ({
        ...prev,
        visit: {
          ...prev.visit,
          entry_gate_id: gateId,
        },
      }));
    }
  }, []);

  // Track completed sections
  useEffect(() => {
    const completed = new Set();

    if (
      formData.visitors[0]?.first_name &&
      formData.visitors[0]?.last_name &&
      formData.visitors[0]?.phone
    ) {
      completed.add("driver");
    }

    if (formData.company.name) {
      completed.add("company");
    }

    if (formData.vehicle.vehicle_type && formData.vehicle.registration_number) {
      completed.add("vehicle");
    }

    if (
      formData.delivery.delivery_type &&
      formData.delivery.destination_department
    ) {
      completed.add("destination");
    }

    if (
      formData.delivery_items[0]?.description &&
      formData.delivery_items[0]?.quantity
    ) {
      completed.add("delivery");
    }

    setCompletedSections(completed);
  }, [formData]);

  const scrollToSection = (sectionId) => {
    const element = sectionRefs.current[sectionId];

    if (!element) return;

    element.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    setActiveSection(sectionId);
  };

  const handleNestedChange = (section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleVisitorChange = (index, field, value) => {
    setFormData((prev) => {
      const newVisitors = [...prev.visitors];
      newVisitors[index] = {
        ...newVisitors[index],
        [field]: value,
      };
      return {
        ...prev,
        visitors: newVisitors,
      };
    });
  };

  const handleItemChange = (index, field, value) => {
    setFormData((prev) => {
      const newItems = [...prev.delivery_items];
      newItems[index] = {
        ...newItems[index],
        [field]: value,
      };
      return {
        ...prev,
        delivery_items: newItems,
      };
    });
  };

  const addHelper = () => {
    setFormData((prev) => ({
      ...prev,
      visitors: [
        ...prev.visitors,
        {
          first_name: "",
          last_name: "",
          phone: "",
          email: "",
        },
      ],
    }));
    setShowHelper(true);
  };

  const removeHelper = () => {
    setFormData((prev) => ({
      ...prev,
      visitors: prev.visitors.slice(0, 1),
    }));
    setFiles((prev) => ({
      ...prev,
      visitor_photos: prev.visitor_photos.slice(0, 1),
    }));
    setPreviews((prev) => ({
      ...prev,
      visitor_photos: prev.visitor_photos.slice(0, 1),
    }));
    setShowHelper(false);
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      delivery_items: [
        ...prev.delivery_items,
        { description: "", quantity: "" },
      ],
    }));
  };

  const removeItem = (index) => {
    if (formData.delivery_items.length > 1) {
      setFormData((prev) => ({
        ...prev,
        delivery_items: prev.delivery_items.filter((_, i) => i !== index),
      }));

      setFiles((prev) => {
        const newFiles = { ...prev };
        newFiles.delivery_item_photos = prev.delivery_item_photos.filter(
          (_, i) => i !== index,
        );
        return newFiles;
      });

      setPreviews((prev) => {
        const newPreviews = { ...prev };
        newPreviews.delivery_item_photos = prev.delivery_item_photos.filter(
          (_, i) => i !== index,
        );
        return newPreviews;
      });
    }
  };

  // Enhanced file selection handler with proper input triggering
  const handleFileSelect = async (type, index = null, useCamera = false) => {
    // fallback upload
    const input = document.createElement("input");
    input.type = "file";
    input.accept = type.includes("photo")
      ? "image/*"
      : ".pdf,.doc,.docx,image/*";

    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const previewUrl = URL.createObjectURL(file);

      setFiles((prev) => {
        const newFiles = { ...prev };
        const arr = [...(prev[type] || [])];
        arr[index] = file;
        newFiles[type] = arr;
        return newFiles;
      });

      setPreviews((prev) => {
        const newPreviews = { ...prev };
        const arr = [...(prev[type] || [])];
        arr[index] = previewUrl;
        newPreviews[type] = arr;
        return newPreviews;
      });
    };

    input.click();
  };

  const removeDocument = (index) => {
    setFiles((prev) => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index),
    }));
    setPreviews((prev) => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index),
    }));
  };

  const validateForm = () => {
    const gateId = getGateIdFromStorage();
    if (!gateId || !formData.visit.purpose) {
      setError("Gate ID not found. Please ensure you are logged in properly.");
      return false;
    }

    if (!formData.company.name) {
      setError("Company name is required");
      return false;
    }

    if (
      !formData.vehicle.vehicle_type ||
      !formData.vehicle.registration_number
    ) {
      setError("Vehicle type and registration number are required");
      return false;
    }

    const driver = formData.visitors[0];
    if (!driver.first_name || !driver.last_name || !driver.phone) {
      setError("Driver information (first name, last name, phone) is required");
      return false;
    }

    if (
      !formData.delivery.delivery_type ||
      !formData.delivery.destination_department
    ) {
      setError("Delivery type and destination department are required");
      return false;
    }

    if (formData.delivery_items.length === 0) {
      setError("At least one delivery item is required");
      return false;
    }

    for (let item of formData.delivery_items) {
      if (!item.description || !item.quantity) {
        setError("All delivery items must have description and quantity");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    if (!validateForm()) {
      const sections = [
        "driver",
        "company",
        "vehicle",
        "destination",
        "delivery",
      ];
      for (const section of sections) {
        if (!completedSections.has(section)) {
          scrollToSection(section);
          break;
        }
      }
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("visit", JSON.stringify(formData.visit));
      formDataToSend.append("company", JSON.stringify(formData.company));
      formDataToSend.append("vehicle", JSON.stringify(formData.vehicle));
      formDataToSend.append("visitors", JSON.stringify(formData.visitors));
      formDataToSend.append("delivery", JSON.stringify(formData.delivery));
      formDataToSend.append(
        "delivery_items",
        JSON.stringify(formData.delivery_items),
      );

      files.visitor_photos.forEach((file) => {
        if (file) formDataToSend.append("visitor_photos", file);
      });

      files.vehicle_photos.forEach((file) => {
        if (file) formDataToSend.append("vehicle_photos", file);
      });

      files.delivery_item_photos.forEach((file) => {
        if (file) formDataToSend.append("delivery_item_photos", file);
      });

      files.documents.forEach((file) => {
        if (file) formDataToSend.append("documents", file);
      });

      const response = await createVisitWithDelivery(formDataToSend);

      if (response.data.success) {
        setSuccess("Delivery registered successfully!");
        resetForm();
      }
    } catch (err) {
      console.error("Submission error:", err);
      setError(err.response?.data?.message || "Failed to register delivery");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    const gateId = getGateIdFromStorage();

    setFormData({
      visit: {
        purpose: "delivery",
        entry_gate_id: gateId,
        notes: "",
      },
      company: {
        name: "",
        phone: "",
        email: "",
        is_regular: false,
      },
      vehicle: {
        vehicle_type: "",
        registration_number: "",
      },
      visitors: [
        {
          first_name: "",
          last_name: "",
          phone: "",
          email: "",
        },
      ],
      delivery: {
        delivery_type: "",
        invoice_number: "",
        destination_department: "",
        contact_person: "",
      },
      delivery_items: [
        {
          description: "",
          quantity: "",
        },
      ],
    });

    setFiles({
      visitor_photos: [],
      vehicle_photos: [],
      delivery_item_photos: [],
      documents: [],
    });

    setPreviews({
      visitor_photos: [],
      vehicle_photos: [],
      delivery_item_photos: [],
      documents: [],
    });

    setShowHelper(false);
    setError("");
    setSuccess("");
    setActiveSection("driver");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const sections = [
    {
      id: "driver",
      label: "Driver Information",
      icon: User,
      color: "blue",
      description: "Driver and helper details",
    },
    {
      id: "company",
      label: "Company Details",
      icon: Building,
      color: "purple",
      description: "Supplier information",
    },
    {
      id: "vehicle",
      label: "Vehicle Details",
      icon: Truck,
      color: "green",
      description: "Vehicle and registration",
    },
    {
      id: "delivery",
      label: "Delivery Items",
      icon: Package,
      color: "orange",
      description: "Items being delivered",
    },
    {
      id: "destination",
      label: "Destination",
      icon: MapPin,
      color: "indigo",
      description: "Delivery location",
    },
    {
      id: "documents",
      label: "Documents",
      icon: FileText,
      color: "emerald",
      description: "Supporting documents",
    },
  ];

  const getStatusIcon = (sectionId) => {
    if (completedSections.has(sectionId)) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    if (activeSection === sectionId) {
      return <CircleDashed className="w-5 h-5 text-blue-500" />;
    }
    return <CircleDashed className="w-5 h-5 text-gray-300" />;
  };

  // ✅ ADD HERE
  const userSession =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("userSession") || "{}")
      : {};

  const gateName = userSession.gate_name;

  const capitalizeFirst = (text = "") =>
    text.charAt(0).toUpperCase() + text.slice(1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Simple Header - Not Fixed */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-8xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div
              className="flex items-center gap-4 cursor-pointer"
              onClick={() => scrollToSection("driver")}
            >
              <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg shadow-orange-500/20">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Delivery Registration
                </h1>
                <p className="text-sm text-gray-500">
                  Register incoming deliveries
                </p>
              </div>
            </div>

            {/* Gate Status */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl border border-gray-200">
                <Shield className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  Gate:{" "}
                  <span className="font-semibold text-gray-900">
                    {gateName ? capitalizeFirst(gateName) : "Not set"}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Tracker - Now clickable on icons */}
      <div className="bg-white/70 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-8xl mx-auto px-6 lg:px-8">
          <div className="py-4">
            <div className="flex items-center justify-between">
              {sections.map((section, index) => (
                <div
                  key={section.id}
                  className="flex-1 cursor-pointer"
                  onClick={() => scrollToSection(section.id)}
                  onMouseEnter={() => setHoveredSection(section.id)}
                  onMouseLeave={() => setHoveredSection(null)}
                >
                  <div className="flex items-center">
                    <div className="relative flex-1">
                      <div className="flex items-center">
                        {/* Progress Line */}
                        {index > 0 && (
                          <div className="absolute -left-1/2 top-4 w-full h-0.5">
                            <div
                              className={`
                              h-full transition-all duration-500
                              ${
                                completedSections.has(sections[index - 1].id) &&
                                completedSections.has(section.id)
                                  ? "bg-gradient-to-r from-green-500 to-green-400"
                                  : completedSections.has(
                                        sections[index - 1].id,
                                      )
                                    ? "bg-gradient-to-r from-green-500 to-gray-200"
                                    : "bg-gray-200"
                              }
                            `}
                              style={{ width: "100%" }}
                            ></div>
                          </div>
                        )}

                        {/* Step Circle - Now clickable */}
                        <div className="relative z-10">
                          <div
                            className={`
                            flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 cursor-pointer
                            ${
                              activeSection === section.id
                                ? `bg-${section.color}-500 text-white shadow-lg shadow-${section.color}-500/30 scale-110`
                                : completedSections.has(section.id)
                                  ? "bg-green-500 text-white shadow-lg shadow-green-500/30"
                                  : "bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                            }
                          `}
                          >
                            {completedSections.has(section.id) ? (
                              <CheckCircle className="w-5 h-5" />
                            ) : (
                              <section.icon className="w-5 h-5" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Labels */}
                      <div className="hidden sm:block mt-2 text-left">
                        <div
                          className={`
                          text-sm font-medium transition-colors cursor-pointer
                          ${
                            activeSection === section.id
                              ? `text-${section.color}-600`
                              : completedSections.has(section.id)
                                ? "text-green-600"
                                : "text-gray-500 hover:text-gray-900"
                          }
                        `}
                        >
                          {section.label}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5 cursor-pointer hover:text-gray-600">
                          {section.description}
                        </div>
                      </div>
                    </div>

                    {/* Connector Arrow */}
                    {index < sections.length - 1 && (
                      <div className="hidden sm:block mx-4">
                        <ChevronRight
                          className={`
                          w-4 h-4 transition-colors
                          ${completedSections.has(section.id) ? "text-green-400" : "text-gray-300"}
                        `}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - 8xl container */}
      <div className="max-w-8xl mx-auto px-6 lg:px-8 py-8">
        {/* Status Messages */}
        {error && (
          <div className="mb-6">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-xl">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <p className="text-red-700 text-sm flex-1 font-medium">
                  {error}
                </p>
                <button
                  onClick={() => setError("")}
                  className="p-2 hover:bg-red-100 rounded-xl transition-all"
                >
                  <X className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6">
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-xl">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-green-700 text-sm flex-1 font-medium">
                  {success}
                </p>
                <button
                  onClick={() => setSuccess("")}
                  className="p-2 hover:bg-green-100 rounded-xl transition-all"
                >
                  <X className="w-4 h-4 text-green-500" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Form Sections - All sections now have clickable headers */}
        <div className="space-y-6">
          {/* Driver Information */}
          <div
            ref={(el) => (sectionRefs.current.driver = el)}
            id="driver"
            className="group relative"
          >
            <div
              className={`
              absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity duration-500
              ${activeSection === "driver" ? "opacity-10" : ""}
            `}
            ></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200/80 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              {/* Clickable Section Header */}
              <div
                className="px-8 py-5 bg-gradient-to-r from-blue-50/50 to-transparent border-b border-gray-200/80 cursor-pointer hover:bg-blue-50/30 transition-colors"
                onClick={() => scrollToSection("driver")}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`
                      p-2.5 rounded-xl transition-all duration-300 cursor-pointer
                      ${activeSection === "driver" ? "bg-blue-500 shadow-lg shadow-blue-500/30 scale-110" : "bg-blue-100"}
                    `}
                    >
                      <User
                        className={`w-5 h-5 ${activeSection === "driver" ? "text-white" : "text-blue-600"}`}
                      />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        Driver Information
                        {completedSections.has("driver") && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                            Completed
                          </span>
                        )}
                      </h2>
                      <p className="text-sm text-gray-500">
                        Primary driver and assistant details
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full">
                      Required *
                    </span>
                    {getStatusIcon("driver")}
                  </div>
                </div>
              </div>

              <div className="p-8">
                <div className="flex flex-col lg:flex-row gap-8">
                  {/* Photo Section */}
                  <div className="lg:w-56">
                    <div className="relative group/photo">
                      <div className="aspect-square rounded-xl border-2 border-gray-200/80 overflow-hidden bg-gray-50 shadow-inner">
                        {renderCameraBox(
                          "visitor_photos",
                          0,
                          previews.visitor_photos[0],
                        ) || (
                          <div className="w-full h-full flex flex-col items-center justify-center">
                            <UserCircle className="w-20 h-20 text-gray-300" />
                            <span className="text-sm text-gray-400 mt-2 font-medium">
                              Driver Photo
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleFileSelect("visitor_photos", 0, false)
                        }
                        className="flex-1 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-sm flex items-center justify-center gap-2 border border-blue-200"
                      >
                        <Upload className="w-4 h-4" />
                        Upload
                      </button>

                      <button
                        type="button"
                        onClick={() => startCamera("visitor_photos", 0)}
                        className="flex-1 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-sm flex items-center justify-center gap-2 border border-gray-200"
                      >
                        <Camera className="w-4 h-4" />
                        Camera
                      </button>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                          First Name <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            value={formData.visitors[0].first_name}
                            onChange={(e) =>
                              handleVisitorChange(
                                0,
                                "first_name",
                                e.target.value,
                              )
                            }
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white/50"
                            placeholder="John"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                          Last Name <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            value={formData.visitors[0].last_name}
                            onChange={(e) =>
                              handleVisitorChange(
                                0,
                                "last_name",
                                e.target.value,
                              )
                            }
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white/50"
                            placeholder="Doe"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                          Phone <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="tel"
                            value={formData.visitors[0].phone}
                            onChange={(e) =>
                              handleVisitorChange(0, "phone", e.target.value)
                            }
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white/50"
                            placeholder="+1 234 567 8900"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Email
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="email"
                            value={formData.visitors[0].email}
                            onChange={(e) =>
                              handleVisitorChange(0, "email", e.target.value)
                            }
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white/50"
                            placeholder="john@company.com"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Helper Section */}
                    {!showHelper ? (
                      <button
                        type="button"
                        onClick={addHelper}
                        className="mt-6 w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-600 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50/50 transition-all flex items-center justify-center gap-2"
                      >
                        <Users className="w-4 h-4" />
                        Add Helper/Assistant
                      </button>
                    ) : (
                      <div className="mt-6 p-5 bg-gray-50/80 rounded-xl border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-600" />
                            Helper Information
                          </h3>
                          <button
                            type="button"
                            onClick={removeHelper}
                            className="text-xs text-red-600 hover:text-red-700 font-medium px-3 py-1.5 bg-red-50 rounded-lg hover:bg-red-100 transition-all"
                          >
                            Remove Helper
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <input
                              type="text"
                              value={formData.visitors[1]?.first_name || ""}
                              onChange={(e) =>
                                handleVisitorChange(
                                  1,
                                  "first_name",
                                  e.target.value,
                                )
                              }
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 bg-white"
                              placeholder="First name"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              value={formData.visitors[1]?.last_name || ""}
                              onChange={(e) =>
                                handleVisitorChange(
                                  1,
                                  "last_name",
                                  e.target.value,
                                )
                              }
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 bg-white"
                              placeholder="Last name"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Company Information */}
          <div
            ref={(el) => (sectionRefs.current.company = el)}
            id="company"
            className="group relative"
          >
            <div
              className={`
              absolute inset-0 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity duration-500
              ${activeSection === "company" ? "opacity-10" : ""}
            `}
            ></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200/80 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              {/* Clickable Section Header */}
              <div
                className="px-8 py-5 bg-gradient-to-r from-purple-50/50 to-transparent border-b border-gray-200/80 cursor-pointer hover:bg-purple-50/30 transition-colors"
                onClick={() => scrollToSection("company")}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`
                      p-2.5 rounded-xl transition-all duration-300 cursor-pointer
                      ${activeSection === "company" ? "bg-purple-500 shadow-lg shadow-purple-500/30 scale-110" : "bg-purple-100"}
                    `}
                    >
                      <Building
                        className={`w-5 h-5 ${activeSection === "company" ? "text-white" : "text-purple-600"}`}
                      />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        Company Information
                        {completedSections.has("company") && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                            Completed
                          </span>
                        )}
                      </h2>
                      <p className="text-sm text-gray-500">
                        Supplier and billing details
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full">
                      Required *
                    </span>
                    {getStatusIcon("company")}
                  </div>
                </div>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={formData.company.name}
                        onChange={(e) =>
                          handleNestedChange("company", "name", e.target.value)
                        }
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white/50"
                        placeholder="Enter company name"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Company Phone
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="tel"
                        value={formData.company.phone}
                        onChange={(e) =>
                          handleNestedChange("company", "phone", e.target.value)
                        }
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white/50"
                        placeholder="+1 234 567 8900"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Company Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        value={formData.company.email}
                        onChange={(e) =>
                          handleNestedChange("company", "email", e.target.value)
                        }
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white/50"
                        placeholder="contact@company.com"
                      />
                    </div>
                  </div>

                  <div className="flex items-center">
                    <label className="flex items-center gap-3 cursor-pointer p-2.5 hover:bg-purple-50 rounded-xl transition-all">
                      <input
                        type="checkbox"
                        checked={formData.company.is_regular}
                        onChange={(e) =>
                          handleNestedChange(
                            "company",
                            "is_regular",
                            e.target.checked,
                          )
                        }
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700 font-medium">
                        Regular Supplier
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle Information */}
          <div
            ref={(el) => (sectionRefs.current.vehicle = el)}
            id="vehicle"
            className="group relative"
          >
            <div
              className={`
              absolute inset-0 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity duration-500
              ${activeSection === "vehicle" ? "opacity-10" : ""}
            `}
            ></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200/80 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              {/* Clickable Section Header */}
              <div
                className="px-8 py-5 bg-gradient-to-r from-green-50/50 to-transparent border-b border-gray-200/80 cursor-pointer hover:bg-green-50/30 transition-colors"
                onClick={() => scrollToSection("vehicle")}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`
                      p-2.5 rounded-xl transition-all duration-300 cursor-pointer
                      ${activeSection === "vehicle" ? "bg-green-500 shadow-lg shadow-green-500/30 scale-110" : "bg-green-100"}
                    `}
                    >
                      <Truck
                        className={`w-5 h-5 ${activeSection === "vehicle" ? "text-white" : "text-green-600"}`}
                      />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        Vehicle Information
                        {completedSections.has("vehicle") && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                            Completed
                          </span>
                        )}
                      </h2>
                      <p className="text-sm text-gray-500">
                        Vehicle type and registration
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full">
                      Required *
                    </span>
                    {getStatusIcon("vehicle")}
                  </div>
                </div>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      Vehicle Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.vehicle.vehicle_type}
                      onChange={(e) =>
                        handleNestedChange(
                          "vehicle",
                          "vehicle_type",
                          e.target.value,
                        )
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white"
                    >
                      <option value="">Select vehicle type</option>
                      <option value="motorcycle">Motorcycle</option>
                      <option value="car">Car</option>
                      <option value="van">Van</option>
                      <option value="truck">Truck</option>
                      <option value="semi_truck">Semi-Truck</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      Registration Number{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={formData.vehicle.registration_number}
                        onChange={(e) =>
                          handleNestedChange(
                            "vehicle",
                            "registration_number",
                            e.target.value.toUpperCase(),
                          )
                        }
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white/50 uppercase"
                        placeholder="MH01AB1234"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Vehicle Photo */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Vehicle Photo
                    </label>

                    <div className="relative group/vehicle">
                      <div className="aspect-video rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 overflow-hidden shadow-inner">
                        {renderCameraBox(
                          "vehicle_photos",
                          0,
                          previews.vehicle_photos[0],
                        ) || (
                          <div className="w-full h-full flex flex-col items-center justify-center">
                            <Truck className="w-10 h-10 text-gray-400 mb-2" />
                            <span className="text-sm text-gray-400 font-medium">
                              Vehicle Photo
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleFileSelect("vehicle_photos", 0, false)
                        }
                        className="flex-1 px-3 py-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg text-sm flex items-center justify-center gap-2 border border-green-200"
                      >
                        <Upload className="w-4 h-4" />
                        Upload
                      </button>

                      <button
                        type="button"
                        onClick={() => startCamera("vehicle_photos", 0)}
                        className="flex-1 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-sm flex items-center justify-center gap-2 border border-gray-200"
                      >
                        <Camera className="w-4 h-4" />
                        Camera
                      </button>
                    </div>

                    {previews.vehicle_photos[0] && (
                      <p className="text-xs text-green-600 text-center mt-1">
                        <CheckCircle className="w-3 h-3 inline mr-1" />
                        Vehicle photo uploaded
                      </p>
                    )}
                  </div>

                  {/* Number Plate Photo */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Number Plate Photo
                    </label>

                    <div className="relative group/plate">
                      <div className="aspect-video rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 overflow-hidden shadow-inner">
                        {renderCameraBox(
                          "vehicle_photos",
                          1,
                          previews.vehicle_photos[1],
                        ) || (
                          <div className="w-full h-full flex flex-col items-center justify-center">
                            <CreditCard className="w-10 h-10 text-gray-400 mb-2" />
                            <span className="text-sm text-gray-400 font-medium">
                              Number Plate
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleFileSelect("vehicle_photos", 1, false)
                        }
                        className="flex-1 px-3 py-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg text-sm flex items-center justify-center gap-2 border border-green-200"
                      >
                        <Upload className="w-4 h-4" />
                        Upload
                      </button>

                      <button
                        type="button"
                        onClick={() => startCamera("vehicle_photos", 1)}
                        className="flex-1 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-sm flex items-center justify-center gap-2 border border-gray-200"
                      >
                        <Camera className="w-4 h-4" />
                        Camera
                      </button>
                    </div>

                    {previews.vehicle_photos[1] && (
                      <p className="text-xs text-green-600 text-center mt-1">
                        <CheckCircle className="w-3 h-3 inline mr-1" />
                        Plate photo uploaded
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Details */}
          <div
            ref={(el) => (sectionRefs.current.delivery = el)}
            id="delivery"
            className="group relative"
          >
            <div
              className={`
              absolute inset-0 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity duration-500
              ${activeSection === "delivery" ? "opacity-10" : ""}
            `}
            ></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200/80 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              {/* Clickable Section Header */}
              <div
                className="px-8 py-5 bg-gradient-to-r from-orange-50/50 to-transparent border-b border-gray-200/80 cursor-pointer hover:bg-orange-50/30 transition-colors"
                onClick={() => scrollToSection("delivery")}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`
                      p-2.5 rounded-xl transition-all duration-300 cursor-pointer
                      ${activeSection === "delivery" ? "bg-orange-500 shadow-lg shadow-orange-500/30 scale-110" : "bg-orange-100"}
                    `}
                    >
                      <Package
                        className={`w-5 h-5 ${activeSection === "delivery" ? "text-white" : "text-orange-600"}`}
                      />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        Delivery Items
                        {completedSections.has("delivery") && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                            Completed
                          </span>
                        )}
                      </h2>
                      <p className="text-sm text-gray-500">
                        Items being delivered
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full">
                      Required *
                    </span>
                    {getStatusIcon("delivery")}
                  </div>
                </div>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      Delivery Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.delivery.delivery_type}
                      onChange={(e) =>
                        handleNestedChange(
                          "delivery",
                          "delivery_type",
                          e.target.value,
                        )
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all bg-white"
                    >
                      <option value="">Select delivery type</option>
                      <option value="delivery">Delivery</option>
                      <option value="pickup">Pickup</option>
                      <option value="return">Return</option>
                      <option value="exchange">Exchange</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Invoice Number
                    </label>
                    <div className="relative">
                      <FileCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={formData.delivery.invoice_number}
                        onChange={(e) =>
                          handleNestedChange(
                            "delivery",
                            "invoice_number",
                            e.target.value,
                          )
                        }
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all bg-white/50"
                        placeholder="INV-2025-001"
                      />
                    </div>
                  </div>
                </div>

                {/* Delivery Items List */}
                <div className="space-y-4 mb-6">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                    Items <span className="text-red-500">*</span>
                  </label>

                  {formData.delivery_items.map((item, index) => (
                    <div
                      key={index}
                      className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition"
                    >
                      <div className="flex flex-col md:flex-row gap-6">
                        {/* LEFT — ITEM DETAILS */}
                        <div className="flex-1 space-y-4">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "description",
                                e.target.value,
                              )
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 bg-white"
                            placeholder="Item description"
                          />

                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "quantity",
                                e.target.value,
                              )
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 bg-white"
                            placeholder="Quantity"
                            min="1"
                          />

                          {formData.delivery_items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg border border-gray-200 text-sm"
                            >
                              Remove Item
                            </button>
                          )}
                        </div>

                        {/* RIGHT — PHOTO AREA */}
                        <div className="w-full md:w-72 lg:w-80">
                          <div className="aspect-[4/3] rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 overflow-hidden shadow-inner">
                            {renderCameraBox(
                              "delivery_item_photos",
                              index,
                              previews.delivery_item_photos[index],
                            ) || (
                              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                <Camera className="w-8 h-8 mb-2" />
                                <span className="text-sm">Item Photo</span>
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2 mt-3">
                            <button
                              type="button"
                              onClick={() =>
                                handleFileSelect(
                                  "delivery_item_photos",
                                  index,
                                  false,
                                )
                              }
                              className="flex-1 px-3 py-2 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-lg text-sm flex items-center justify-center gap-2 border border-orange-200"
                            >
                              <Upload className="w-4 h-4" />
                              Upload
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                startCamera("delivery_item_photos", index)
                              }
                              className="flex-1 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-sm flex items-center justify-center gap-2 border border-gray-200"
                            >
                              <Camera className="w-4 h-4" />
                              Camera
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addItem}
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-600 hover:border-orange-500 hover:text-orange-600 hover:bg-orange-50/50 transition-all flex items-center justify-center gap-2"
                >
                  <Package className="w-4 h-4" />
                  Add Another Item
                </button>

                <div className="mt-6 space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Additional Notes
                  </label>
                  <textarea
                    value={formData.visit.notes}
                    onChange={(e) =>
                      handleNestedChange("visit", "notes", e.target.value)
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none bg-white/50"
                    rows="3"
                    placeholder="Any special instructions or handling requirements..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Destination */}
          <div
            ref={(el) => (sectionRefs.current.destination = el)}
            id="destination"
            className="group relative"
          >
            <div
              className={`
              absolute inset-0 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity duration-500
              ${activeSection === "destination" ? "opacity-10" : ""}
            `}
            ></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200/80 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              {/* Clickable Section Header */}
              <div
                className="px-8 py-5 bg-gradient-to-r from-indigo-50/50 to-transparent border-b border-gray-200/80 cursor-pointer hover:bg-indigo-50/30 transition-colors"
                onClick={() => scrollToSection("destination")}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`
                      p-2.5 rounded-xl transition-all duration-300 cursor-pointer
                      ${activeSection === "destination" ? "bg-indigo-500 shadow-lg shadow-indigo-500/30 scale-110" : "bg-indigo-100"}
                    `}
                    >
                      <MapPin
                        className={`w-5 h-5 ${activeSection === "destination" ? "text-white" : "text-indigo-600"}`}
                      />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        Destination
                        {completedSections.has("destination") && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                            Completed
                          </span>
                        )}
                      </h2>
                      <p className="text-sm text-gray-500">
                        Delivery location details
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full">
                      Required *
                    </span>
                    {getStatusIcon("destination")}
                  </div>
                </div>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      Department <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.delivery.destination_department}
                      onChange={(e) =>
                        handleNestedChange(
                          "delivery",
                          "destination_department",
                          e.target.value,
                        )
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white"
                    >
                      <option value="">Select department</option>
                      <option value="icu">ICU</option>
                      <option value="central_pharmacy">Central Pharmacy</option>
                      <option value="surgery">Surgery Department</option>
                      <option value="emergency">Emergency Department</option>
                      <option value="central_stores">Central Stores</option>
                      <option value="radiology">Radiology</option>
                      <option value="laboratory">Laboratory</option>
                      <option value="opd">OPD</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Contact Person
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={formData.delivery.contact_person}
                        onChange={(e) =>
                          handleNestedChange(
                            "delivery",
                            "contact_person",
                            e.target.value,
                          )
                        }
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white/50"
                        placeholder="Contact name"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div
            ref={(el) => (sectionRefs.current.documents = el)}
            id="documents"
            className="group relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-gray-500 to-gray-600 rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity duration-500"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200/80 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              {/* Clickable Section Header */}
              <div
                className="px-8 py-5 bg-gradient-to-r from-gray-50/50 to-transparent border-b border-gray-200/80 cursor-pointer hover:bg-gray-50/30 transition-colors"
                onClick={() => scrollToSection("documents")}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-gray-100 rounded-xl cursor-pointer">
                      <FileText className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        Additional Documents
                      </h2>
                      <p className="text-sm text-gray-500">
                        Supporting documents and files
                      </p>
                    </div>
                  </div>
                  {getStatusIcon("documents")}
                </div>
              </div>

              <div className="p-8">
                {/* Upload + Camera Buttons */}
                <div className="flex gap-3 mb-6">
                  <button
                    type="button"
                    onClick={() =>
                      handleFileSelect(
                        "documents",
                        files.documents.length,
                        false,
                      )
                    }
                    className="flex-1 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Document
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      startCamera("documents", files.documents.length)
                    }
                    className="flex-1 px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl border border-gray-200 flex items-center justify-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    Scan with Camera
                  </button>
                </div>

                {/* CAMERA — show ONLY when active */}
                {cameraTarget?.type === "documents" && (
                  <div className="mb-6 flex justify-center">
                    <div className="w-full max-w-md aspect-[4/3] rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 overflow-hidden shadow-inner">
                      {renderCameraBox("documents", cameraTarget.index)}
                    </div>
                  </div>
                )}

                {/* Uploaded Documents List — FILE NAME ONLY */}
                {files.documents.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-700">
                      Uploaded Files ({files.documents.length})
                    </h3>

                    {files.documents.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 bg-white rounded-lg border">
                            <FileText className="w-4 h-4 text-yellow-500" />
                          </div>

                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {file.name}
                            </p>

                            <p className="text-xs text-gray-500">
                              {(file.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeDocument(index)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-10 flex items-center gap-4 justify-end">
          <button
            type="button"
            onClick={resetForm}
            disabled={loading}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Clear All
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/25 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 min-w-[200px] justify-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Submit Registration</span>
                <ArrowRight className="w-4 h-4 opacity-70" />
              </>
            )}
          </button>
        </div>

        {/* Footer Note */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            All marked fields (*) are required. Please ensure all information is
            accurate before submission.
          </p>
        </div>
      </div>
    </div>
  );
}
