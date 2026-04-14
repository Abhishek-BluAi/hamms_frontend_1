'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, Phone, Mail, Calendar, MapPin, Users, 
  ChevronRight, Shield, CheckCircle, AlertCircle 
} from 'lucide-react';

export default function NewVisitorPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    gender: '',
    dob: '',
    address: ''
  });

  const [focusedField, setFocusedField] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = async () => {
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    localStorage.setItem("visitorData", JSON.stringify(formData));
    router.push("/new-visitor/face-capture");
  };

  const isFormValid = () => {
    return formData.firstName && formData.lastName && formData.phone && formData.gender;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Visitor Registration
            </h1>
            <p className="text-slate-600 mt-1">
              Enter your personal information to begin the check-in process
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium text-sm">
              Step 1 of 4
            </span>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="grid grid-cols-4 gap-2">
            {['Personal Info', 'Face Capture', 'Visit Details', 'Verification'].map((step, index) => (
              <div key={step} className="relative">
                <div className={`h-2 rounded-full mb-2 ${
                  index === 0 ? 'bg-blue-600' : 
                  index < 1 ? 'bg-green-600' : 
                  'bg-slate-200'
                }`} />
                <p className={`text-sm font-medium flex items-center gap-1 ${
                  index === 0 ? 'text-blue-600' :
                  index < 1 ? 'text-green-600' :
                  'text-slate-500'
                }`}>
                  {index < 1 && <CheckCircle className="w-4 h-4" />}
                  {step}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
            <h2 className="text-xl font-semibold text-white">Personal Information</h2>
            <p className="text-blue-100 text-sm mt-1">Please fill in your details accurately</p>
          </div>

          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* First Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-600" />
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  onFocus={() => setFocusedField('firstName')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="John"
                  className={`
                    w-full px-4 py-3 rounded-lg border transition-all duration-200
                    ${focusedField === 'firstName' 
                      ? 'border-blue-500 ring-2 ring-blue-100' 
                      : 'border-slate-200 hover:border-slate-300'
                    }
                    focus:outline-none
                  `}
                />
              </div>

              {/* Last Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-600" />
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  onFocus={() => setFocusedField('lastName')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Doe"
                  className={`
                    w-full px-4 py-3 rounded-lg border transition-all duration-200
                    ${focusedField === 'lastName' 
                      ? 'border-blue-500 ring-2 ring-blue-100' 
                      : 'border-slate-200 hover:border-slate-300'
                    }
                    focus:outline-none
                  `}
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-blue-600" />
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-3">
                  <div className="w-20 px-3 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 font-medium text-sm flex items-center justify-center">
                    +91
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    onFocus={() => setFocusedField('phone')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="98765 43210"
                    maxLength={10}
                    className={`
                      flex-1 px-4 py-3 rounded-lg border transition-all duration-200
                      ${focusedField === 'phone' 
                        ? 'border-blue-500 ring-2 ring-blue-100' 
                        : 'border-slate-200 hover:border-slate-300'
                      }
                      focus:outline-none
                    `}
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-600" />
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="john.doe@company.com"
                  className={`
                    w-full px-4 py-3 rounded-lg border transition-all duration-200
                    ${focusedField === 'email' 
                      ? 'border-blue-500 ring-2 ring-blue-100' 
                      : 'border-slate-200 hover:border-slate-300'
                    }
                    focus:outline-none
                  `}
                />
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  onFocus={() => setFocusedField('gender')}
                  onBlur={() => setFocusedField(null)}
                  className={`
                    w-full px-4 py-3 rounded-lg border transition-all duration-200 bg-white
                    ${focusedField === 'gender' 
                      ? 'border-blue-500 ring-2 ring-blue-100' 
                      : 'border-slate-200 hover:border-slate-300'
                    }
                    focus:outline-none appearance-none
                  `}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Date of Birth */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleInputChange}
                  onFocus={() => setFocusedField('dob')}
                  onBlur={() => setFocusedField(null)}
                  className={`
                    w-full px-4 py-3 rounded-lg border transition-all duration-200
                    ${focusedField === 'dob' 
                      ? 'border-blue-500 ring-2 ring-blue-100' 
                      : 'border-slate-200 hover:border-slate-300'
                    }
                    focus:outline-none
                  `}
                />
              </div>

              {/* Address */}
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  Residential Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  onFocus={() => setFocusedField('address')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Enter your complete address"
                  rows="3"
                  className={`
                    w-full px-4 py-3 rounded-lg border transition-all duration-200 resize-none
                    ${focusedField === 'address' 
                      ? 'border-blue-500 ring-2 ring-blue-100' 
                      : 'border-slate-200 hover:border-slate-300'
                    }
                    focus:outline-none
                  `}
                />
              </div>
            </div>

            {/* Form Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-slate-200">
              <button
                onClick={() => router.push('/')}
                className="px-6 py-3 text-slate-600 font-medium hover:text-slate-800 transition-colors"
              >
                Cancel
              </button>
              
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-500 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-red-500">*</span> Required fields
                </span>
                <button
                  onClick={handleNext}
                  disabled={!isFormValid() || isSubmitting}
                  className={`
                    px-8 py-3 rounded-lg font-semibold flex items-center gap-2
                    transition-all duration-200
                    ${isFormValid() && !isSubmitting
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }
                  `}
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Continue
                      <ChevronRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
          <Shield className="h-3 w-3" />
          <span>Your information is encrypted and securely stored</span>
        </div>
      </div>
    </div>
  );
}