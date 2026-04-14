'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, Building, MoreHorizontal, Search, ChevronRight, 
  Check, Clock, User, Calendar, AlertCircle, CheckCircle,
  ArrowLeft, X
} from 'lucide-react';
import { createVisit, getLastVisit } from "@/utils/api";

export default function VisitDetailsPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    purposeOfVisit: 'visiting-patient',
    patientName: '',
    relationship: 'family',
    visitDuration: '1-hour'
  });
  const [lastVisit, setLastVisit] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const mockPatients = [
    { 
      name: 'Rajesh Kumar', 
      ward: 'Ward 101', 
      bed: 'Bed 12', 
      id: 'PAT001',
      admittedDate: 'June 10, 2025'
    },
    { 
      name: 'Rajesh Kumar Singh', 
      ward: 'Ward 203', 
      bed: 'Bed 05', 
      id: 'PAT002',
      admittedDate: 'June 12, 2025'
    }
  ];

  const filteredPatients = mockPatients.filter(patient =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const visitorId = sessionStorage.getItem("visitorId");
    if (!visitorId) return;

    getLastVisit(visitorId)
      .then((res) => {
        const visit = res.data.data;
        setLastVisit(visit);
        setFormData({
          purposeOfVisit: visit.purpose || "visiting-patient",
          patientName: visit.patient_name || "",
          relationship: visit.relationship || "family",
          visitDuration: visit.visit_duration || "1-hour",
        });
      })
      .catch(() => {});
  }, []);

  const handleCreateVisit = async () => {
    if (!formData.patientName && formData.purposeOfVisit === 'visiting-patient') {
      alert("Please select a patient");
      return;
    }

    setIsLoading(true);
    try {
      const visitor_id = sessionStorage.getItem("visitorId");
      const company_code = localStorage.getItem("company_code");

      await createVisit({
        visitor_id,
        company_code,
        purpose: formData.purposeOfVisit,
        patient_name: formData.patientName,
        relationship: formData.relationship,
        visit_duration: formData.visitDuration,
      });

      router.push("/new-visitor/verification");
    } catch (err) {
      alert("Visit creation failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const PurposeButton = ({ value, icon: Icon, title, description }) => (
    <button
      onClick={() => setFormData({ ...formData, purposeOfVisit: value })}
      className={`p-4 border rounded-lg text-left transition-all ${
        formData.purposeOfVisit === value
          ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-100'
          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      <Icon className={`w-5 h-5 mb-2 ${
        formData.purposeOfVisit === value ? 'text-blue-600' : 'text-slate-500'
      }`} />
      <p className="font-medium text-slate-900">{title}</p>
      <p className="text-xs text-slate-600 mt-1">{description}</p>
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Visit Details
            </h1>
            <p className="text-slate-600 mt-1">
              Provide information about your visit
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium text-sm">
              Step 3 of 4
            </span>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="grid grid-cols-4 gap-2">
            {['Personal Info', 'Face Capture', 'Visit Details', 'Verification'].map((step, index) => (
              <div key={step} className="relative">
                <div className={`h-2 rounded-full mb-2 ${
                  index < 2 ? 'bg-green-600' : 
                  index === 2 ? 'bg-blue-600' : 
                  'bg-slate-200'
                }`} />
                <p className={`text-sm font-medium flex items-center gap-1 ${
                  index < 2 ? 'text-green-600' :
                  index === 2 ? 'text-blue-600' :
                  'text-slate-500'
                }`}>
                  {index < 2 && <CheckCircle className="w-4 h-4" />}
                  {step}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Last Visit Banner */}
        {lastVisit && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Clock className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-green-900 mb-2">Previous Visit</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <p className="text-green-700">Purpose</p>
                    <p className="font-medium text-green-900">{lastVisit.purpose}</p>
                  </div>
                  <div>
                    <p className="text-green-700">Patient</p>
                    <p className="font-medium text-green-900">{lastVisit.patient_name}</p>
                  </div>
                  <div>
                    <p className="text-green-700">Relationship</p>
                    <p className="font-medium text-green-900">{lastVisit.relationship}</p>
                  </div>
                  <div>
                    <p className="text-green-700">Duration</p>
                    <p className="font-medium text-green-900">{lastVisit.visit_duration}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
            <h2 className="text-xl font-semibold text-white">Visit Information</h2>
            <p className="text-blue-100 text-sm mt-1">Select purpose and provide details</p>
          </div>

          <div className="p-6 sm:p-8">
            {/* Purpose Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Purpose of Visit <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <PurposeButton
                  value="visiting-patient"
                  icon={Users}
                  title="Visit Patient"
                  description="Meeting admitted patient"
                />
                <PurposeButton
                  value="medical-appointment"
                  icon={Building}
                  title="Appointment"
                  description="OPD consultation"
                />
                <PurposeButton
                  value="official-work"
                  icon={Building}
                  title="Official"
                  description="Business visit"
                />
                <PurposeButton
                  value="other"
                  icon={MoreHorizontal}
                  title="Other"
                  description="Specify other"
                />
              </div>
            </div>

            {/* Patient Search */}
            {formData.purposeOfVisit === 'visiting-patient' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Search Patient <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Enter patient name or ID"
                      className="w-full pl-4 pr-10 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  </div>
                  
                  {searchQuery && filteredPatients.length > 0 && (
                    <div className="mt-2 border border-slate-200 rounded-lg divide-y bg-white shadow-lg max-h-48 overflow-auto">
                      {filteredPatients.map((patient) => (
                        <button
                          key={patient.id}
                          onClick={() => {
                            setSelectedPatient(patient);
                            setFormData({ ...formData, patientName: patient.name });
                            setSearchQuery('');
                          }}
                          className="w-full p-3 text-left hover:bg-slate-50 transition-colors"
                        >
                          <p className="font-medium text-slate-900">{patient.name}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-slate-600">
                            <span>{patient.ward}</span>
                            <span>{patient.bed}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected Patient */}
                {selectedPatient && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <User className="w-4 h-4 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-xs text-blue-700">Selected Patient</p>
                        <p className="font-medium text-blue-900">{selectedPatient.name}</p>
                        <div className="flex gap-3 mt-1 text-xs text-blue-700">
                          <span>{selectedPatient.ward}</span>
                          <span>{selectedPatient.bed}</span>
                          <span>ID: {selectedPatient.id}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Relationship */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Relationship <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.relationship}
                    onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="family">Family Member</option>
                    <option value="spouse">Spouse</option>
                    <option value="parent">Parent</option>
                    <option value="child">Child</option>
                    <option value="friend">Friend</option>
                  </select>
                </div>
              </div>
            )}

            {/* Visit Duration */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Expected Duration
              </label>
              <select
                value={formData.visitDuration}
                onChange={(e) => setFormData({ ...formData, visitDuration: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="30-min">30 minutes</option>
                <option value="1-hour">1 hour</option>
                <option value="2-hours">2 hours</option>
                <option value="3-hours">3 hours</option>
              </select>
            </div>

            {/* Notice */}
            <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                Please ensure all details are accurate. Visit duration subject to hospital policies.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-slate-200">
              <button
                onClick={() => router.back()}
                className="px-6 py-2 border border-slate-200 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={handleCreateVisit}
                disabled={isLoading || (formData.purposeOfVisit === 'visiting-patient' && !selectedPatient)}
                className="flex-1 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Continue
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 