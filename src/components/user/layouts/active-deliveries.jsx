'use client'

import { useState, useEffect } from 'react';
import { Truck, User, Search, RefreshCw, MapPin, Clock, Timer, Loader2, AlertCircle, CheckCircle, X, Package } from 'lucide-react';
import {
  getAllVisitsWithDeliveries,
  exitVisitAndCompleteDelivery,
} from "@/utils/api";

// Status colors and styles
const statusColors = {
  active: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    badge: "Active",
  },
  completed: {
    bg: "bg-gray-50",
    text: "text-gray-500",
    border: "border-gray-200",
    dot: "bg-gray-400",
    badge: "Completed",
  },
};

const deliveryTypeLabel = {
  delivery: "Delivery",
  pickup: "Pickup",
  return: "Return",
  exchange: "Exchange",
};

const deliveryTypeBg = {
  delivery: "bg-purple-100 text-purple-700",
  pickup: "bg-blue-100 text-blue-700",
  return: "bg-orange-100 text-orange-700",
  exchange: "bg-teal-100 text-teal-700",
};

// Helper functions
function formatDuration(isoString) {
  const diff = Math.floor((Date.now() - new Date(isoString)) / 60000);
  if (diff < 60) return `${diff}m`;
  const hours = Math.floor(diff / 60);
  const minutes = diff % 60;
  return `${hours}h ${minutes}m`;
}

function formatTime(isoString) {
  return new Date(isoString).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Normalize API response
const normalizeVisit = (raw) => {
  const del = Array.isArray(raw.Deliveries) && raw.Deliveries.length > 0
    ? raw.Deliveries[0]
    : (raw.delivery || raw.Delivery || {});

  const driver = del.DriverVisitor || {};
  const company = del.Company || {};
  const vehicle = del.Vehicle || {};
  const items = Array.isArray(del.DeliveryItems) ? del.DeliveryItems : [];

  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "";

  return {
    id: raw.id,
    visit_id: raw.id,
    delivery_id: del.id || null,
    status: raw.status || "active",
    entry_time: raw.entry_time || raw.createdAt || new Date().toISOString(),
    entry_gate_id: raw.entry_gate_id,

    visitor: {
      first_name: driver.first_name || "",
      last_name: driver.last_name || "",
      phone: driver.phone || "",
      photo_url: driver.photo_url ? `${baseUrl}${driver.photo_url}` : null,
    },
    company: {
      name: company.name || "",
      phone: company.phone || "",
    },
    vehicle: {
      registration_number: vehicle.registration_number || "",
    },
    delivery: {
      delivery_type: del.delivery_type || "",
      invoice_number: del.invoice_number || "",
      destination_department: del.destination_department || "",
    },
    delivery_items: items.map((item) => ({
      id: item.id,
      description: item.description || "",
      quantity: item.quantity || 0,
    })),
  };
};

export default function ActiveVisitors() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [exitGate, setExitGate] = useState('');
  const [notes, setNotes] = useState('');
  
  // API state
  const [visitors, setVisitors] = useState([]);
  const [filteredVisitors, setFilteredVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Get gate info from session
  const getGateIdFromStorage = () => {
    if (typeof window === "undefined") return "";
    const session = JSON.parse(localStorage.getItem("userSession") || "{}");
    return session.gate_id || "";
  };

  const getGateNameFromStorage = () => {
    if (typeof window === "undefined") return "Gate 1";
    const session = JSON.parse(localStorage.getItem("userSession") || "{}");
    return session.gate_name || "Gate 1";
  };

  // Load deliveries
  const loadDeliveries = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getAllVisitsWithDeliveries({ purpose: "delivery" });
      const raw = res.data?.data || res.data?.visits || res.data || [];
      const data = Array.isArray(raw) ? raw : [];
      const normalizedData = data.map(normalizeVisit);
      setVisitors(normalizedData);
      
      // Set initial exit gate from session
      if (!exitGate) {
        setExitGate(getGateNameFromStorage());
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to load deliveries. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeliveries();
  }, []);

  // Filter and search
  useEffect(() => {
    let result = [...visitors];
    
    // Filter by type
    if (filterType !== 'all') {
      result = result.filter(v => v.delivery.delivery_type === filterType);
    }
    
    // Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(v => 
        (v.visitor.first_name + ' ' + v.visitor.last_name).toLowerCase().includes(query) ||
        v.company.name.toLowerCase().includes(query) ||
        v.visitor.phone.includes(query) ||
        v.vehicle.registration_number.toLowerCase().includes(query)
      );
    }
    
    setFilteredVisitors(result);
  }, [visitors, searchQuery, filterType]);

  const handleCheckout = async (visitor) => {
    const gateId = getGateIdFromStorage();
    if (!gateId) {
      setError("Gate ID not found in session. Please re-login.");
      return;
    }

    setCheckoutLoading(true);
    setError('');
    
    try {
      const res = await exitVisitAndCompleteDelivery(visitor.visit_id, {
        exit_gate_id: gateId,
        notes: notes,
      });
      
      if (res.data?.success) {
        setSuccess(`Delivery checked out successfully!`);
        
        // Update local state
        setVisitors(prev => prev.map(v => 
          v.id === visitor.id ? { ...v, status: "completed" } : v
        ));
        
        // Reset form
        setSelectedVisitor(null);
        setNotes('');
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to process checkout. Please try again."
      );
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Active Deliveries</h2>
        
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search Deliveries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Filter Dropdown */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
          >
            <option value="all">All Deliveries</option>
            <option value="delivery">Delivery</option>
            <option value="pickup">Pickup</option>
            <option value="return">Return</option>
            <option value="exchange">Exchange</option>
          </select>

          {/* Refresh Button */}
          <button 
            onClick={loadDeliveries}
            disabled={loading}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-5 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
          <p className="text-red-700 text-sm flex-1">{error}</p>
          <button onClick={() => setError('')} className="p-1 hover:bg-red-100 rounded">
            <X className="w-4 h-4 text-red-400" />
          </button>
        </div>
      )}
      
      {success && (
        <div className="mb-5 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
          <p className="text-green-700 text-sm flex-1">{success}</p>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin mb-3 text-blue-500" />
          <p className="text-sm">Loading deliveries...</p>
        </div>
      ) : (
        <>
          {/* Results count */}
          {filteredVisitors.length > 0 && (
            <p className="text-xs text-gray-400 mb-4">
              Showing {filteredVisitors.length} of {visitors.length} deliveries
            </p>
          )}

          {/* Visitors List */}
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {filteredVisitors.map((visitor) => (
              <div key={visitor.id}>
                {/* Visitor Card */}
                <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    {/* Left: Icon and Details */}
                    <div className="flex gap-4 flex-1">
                      {/* Icon with status-based color */}
                      <div className={`p-3 rounded-lg ${
                        visitor.delivery.delivery_type === 'delivery' 
                          ? 'bg-purple-100' 
                          : 'bg-blue-100'
                      }`}>
                        <Truck className={`w-5 h-5 ${
                          visitor.delivery.delivery_type === 'delivery' 
                            ? 'text-purple-600' 
                            : 'text-blue-600'
                        }`} />
                      </div>

                      {/* Visitor Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">
                            {visitor.visitor.first_name} {visitor.visitor.last_name}
                          </h3>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            deliveryTypeBg[visitor.delivery.delivery_type] || 'bg-gray-100 text-gray-600'
                          }`}>
                            {deliveryTypeLabel[visitor.delivery.delivery_type] || visitor.delivery.delivery_type}
                          </span>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${statusColors[visitor.status]?.bg} ${statusColors[visitor.status]?.text}`}>
                            {statusColors[visitor.status]?.badge}
                          </span>
                        </div>
                        
                        <div className="space-y-1 text-sm text-gray-600">
                          <p><span className="font-medium">Company:</span> {visitor.company.name}</p>
                          <p><span className="font-medium">Phone no.:</span> {visitor.visitor.phone}</p>
                          <p><span className="font-medium">Purpose:</span> {visitor.delivery.destination_department || 'Material Delivery'}</p>
                          {visitor.vehicle?.registration_number && (
                            <p><span className="font-medium">Vehicle:</span> {visitor.vehicle.registration_number}</p>
                          )}
                          {visitor.delivery.invoice_number && (
                            <p><span className="font-medium">Invoice:</span> {visitor.delivery.invoice_number}</p>
                          )}
                        </div>

                        {/* Items summary */}
                        {visitor.delivery_items.length > 0 && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                              {visitor.delivery_items.length} item{visitor.delivery_items.length !== 1 ? 's' : ''}
                            </span>
                            <span className="text-xs text-gray-500">
                              Total: {visitor.delivery_items.reduce((sum, item) => sum + item.quantity, 0)} units
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Gate, Entry Time, Duration */}
                    <div className="text-right text-sm space-y-1">
                      <p className="text-gray-600">
                        <span className="font-medium">Gate:</span> {visitor.entry_gate_id || 'Gate 1'}
                      </p>
                      <div className="flex items-center justify-end gap-1 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span className="font-medium">Entry:</span> {formatTime(visitor.entry_time)}
                      </div>
                      <div className="flex items-center justify-end gap-1 text-gray-600">
                        <Timer className="w-4 h-4" />
                        <span className="font-medium">Duration:</span> {formatDuration(visitor.entry_time)}
                      </div>
                    </div>
                  </div>

                  {/* Checkout Section - Only for active visits */}
                  {visitor.status === 'active' && (
                    <>
                      {selectedVisitor === visitor.id ? (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          {/* Exit Gate */}
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Exit Gate
                            </label>
                            <div className="relative">
                              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                type="text"
                                value={exitGate}
                                onChange={(e) => setExitGate(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                disabled={checkoutLoading}
                              />
                            </div>
                          </div>

                          {/* Notes */}
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Notes
                            </label>
                            <textarea
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              placeholder="Any additional notes about the checkout..."
                              rows={3}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                              disabled={checkoutLoading}
                            />
                          </div>

                          {/* Checkout Button */}
                          <button
                            onClick={() => handleCheckout(visitor)}
                            disabled={checkoutLoading}
                            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {checkoutLoading ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              'Checkout Delivery'
                            )}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedVisitor(visitor.id)}
                          className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
                        >
                          Checkout Delivery
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}

            {filteredVisitors.length === 0 && !loading && (
              <div className="text-center py-12 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No active deliveries found</p>
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setFilterType('all');
                    }}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}