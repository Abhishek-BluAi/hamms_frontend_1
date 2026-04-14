"use client";

import { useState, useEffect, useRef } from "react";
import {
  Package,
  Shield,
  Search,
  Truck,
  User,
  Building,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  ChevronRight,
  LogOut,
  Hash,
  Phone,
  Mail,
  Calendar,
  FileText,
  ArrowRight,
  RefreshCw,
  Filter,
  Eye,
  CircleDot,
  Loader2,
  ClipboardCheck,
  DoorOpen,
  ScanLine,
  ClipboardList,
} from "lucide-react";

import {
  getAllVisitsWithDeliveries,
  exitVisitAndCompleteDelivery,
} from "@/utils/api";


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
  delivery: "bg-orange-100 text-orange-700",
  pickup: "bg-blue-100 text-blue-700",
  return: "bg-purple-100 text-purple-700",
  exchange: "bg-teal-100 text-teal-700",
};

function formatDuration(isoString) {
  const diff = Math.floor((Date.now() - new Date(isoString)) / 60000);
  if (diff < 60) return `${diff}m ago`;
  return `${Math.floor(diff / 60)}h ${diff % 60}m ago`;
}

function formatTime(isoString) {
  return new Date(isoString).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Checkout Confirmation Modal ──────────────────────────────────────────────
function CheckoutModal({ visit, gateName, onConfirm, onCancel, loading }) {
  if (!visit) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-orange-50 to-transparent border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-orange-500 rounded-xl shadow-lg shadow-orange-500/25">
                <DoorOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Confirm Exit</h3>
                <p className="text-sm text-gray-500">Review details before processing</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Visit Summary */}
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <ClipboardCheck className="w-4 h-4" />
              Exit Summary
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-400 text-xs uppercase tracking-wide">Driver</span>
                <p className="font-medium text-gray-900 mt-0.5">
                  {visit.visitor.first_name} {visit.visitor.last_name}
                </p>
              </div>
              <div>
                <span className="text-gray-400 text-xs uppercase tracking-wide">Company</span>
                <p className="font-medium text-gray-900 mt-0.5">{visit.company.name}</p>
              </div>
              <div>
                <span className="text-gray-400 text-xs uppercase tracking-wide">Vehicle</span>
                <p className="font-medium text-gray-900 mt-0.5">{visit.vehicle.registration_number}</p>
              </div>
              <div>
                <span className="text-gray-400 text-xs uppercase tracking-wide">Entry Time</span>
                <p className="font-medium text-gray-900 mt-0.5">{formatTime(visit.entry_time)}</p>
              </div>
              <div>
                <span className="text-gray-400 text-xs uppercase tracking-wide">Department</span>
                <p className="font-medium text-gray-900 mt-0.5">
                  {visit.delivery.destination_department
                    ? visit.delivery.destination_department.charAt(0).toUpperCase() +
                      visit.delivery.destination_department.slice(1).replace(/_/g, " ")
                    : "—"}
                </p>
              </div>
              <div>
                <span className="text-gray-400 text-xs uppercase tracking-wide">Invoice</span>
                <p className="font-medium text-gray-900 mt-0.5 font-mono text-xs">
                  {visit.delivery.invoice_number || "—"}
                </p>
              </div>
            </div>

            {/* Items */}
            <div className="pt-2 border-t border-gray-200">
              <span className="text-gray-400 text-xs uppercase tracking-wide">
                Items ({visit.delivery_items.length})
              </span>
              <ul className="mt-1.5 space-y-1">
                {visit.delivery_items.map((item, i) => (
                  <li key={item.id || i} className="text-sm text-gray-700 flex justify-between">
                    <span>{item.description}</span>
                    <span className="font-semibold text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200">
                      ×{item.quantity}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Exit Gate — read-only, from session */}
          <div className="flex items-center gap-3 px-4 py-3 bg-orange-50 rounded-xl border border-orange-200">
            <Shield className="w-4 h-4 text-orange-500 flex-shrink-0" />
            <div>
              <p className="text-xs text-orange-600 font-medium uppercase tracking-wide">Exit Gate</p>
              <p className="text-sm font-semibold text-orange-900">{gateName || "Not set"}</p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-white transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl text-sm font-semibold hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4" />
                Confirm Exit
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Detail Drawer ────────────────────────────────────────────────────────────
function DetailDrawer({ visit, onClose, onCheckout }) {
  if (!visit) return null;
  const s = statusColors[visit.status] || statusColors.active;
  const capitalize = (t = "") => t.charAt(0).toUpperCase() + t.slice(1).replace(/_/g, " ");

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-md bg-white h-full shadow-2xl flex flex-col overflow-hidden">

        {/* Drawer Header */}
        <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-orange-50/60 to-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-xl">
                <Package className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Delivery Details</h3>
                <p className="text-xs text-gray-400 font-mono">Visit #{visit.visit_id}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto">
          {/* Status Strip */}
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${s.bg} ${s.text} ${s.border}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${s.dot} ${visit.status === "active" ? "animate-pulse" : ""}`} />
              {s.badge}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${deliveryTypeBg[visit.delivery.delivery_type] || "bg-gray-100 text-gray-600"}`}>
              {deliveryTypeLabel[visit.delivery.delivery_type] || capitalize(visit.delivery.delivery_type)}
            </span>
          </div>

          <div className="p-6 space-y-5">

            {/* ── DRIVER ─────────────────────────────────────── */}
            <div className="rounded-xl border border-blue-100 bg-blue-50/40 overflow-hidden">
              <div className="px-4 py-3 bg-blue-50 border-b border-blue-100 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-800">Driver</span>
              </div>
              <div className="p-4 flex items-start gap-4">
                {/* Photo */}
                <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-white shadow bg-gray-100 flex-shrink-0">
                  {visit.visitor.photo_url ? (
                    <img src={visit.visitor.photo_url} alt="Driver" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-7 h-7 text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-1.5">
                  <p className="font-semibold text-gray-900">
                    {visit.visitor.first_name} {visit.visitor.last_name}
                  </p>
                  <p className="text-sm text-gray-500 flex items-center gap-1.5">
                    <Phone className="w-3 h-3" />{visit.visitor.phone || "—"}
                  </p>
                  {visit.visitor.email && (
                    <p className="text-sm text-gray-500 flex items-center gap-1.5">
                      <Mail className="w-3 h-3" />{visit.visitor.email}
                    </p>
                  )}
                </div>
              </div>

              {/* Helper if present */}
              {visit.helper && (
                <div className="px-4 pb-4 pt-0">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-white shadow bg-gray-100 flex-shrink-0">
                      {visit.helper.photo_url ? (
                        <img src={visit.helper.photo_url} alt="Helper" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-0.5">Helper</p>
                      <p className="text-sm font-medium text-gray-900">{visit.helper.first_name} {visit.helper.last_name}</p>
                      {visit.helper.phone && <p className="text-xs text-gray-500">{visit.helper.phone}</p>}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── COMPANY ────────────────────────────────────── */}
            <div className="rounded-xl border border-purple-100 bg-purple-50/40 overflow-hidden">
              <div className="px-4 py-3 bg-purple-50 border-b border-purple-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-semibold text-purple-800">Company</span>
                </div>
                {visit.company.is_regular && (
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full border border-purple-200">
                    Regular Supplier
                  </span>
                )}
              </div>
              <div className="p-4 space-y-2">
                <p className="font-semibold text-gray-900">{visit.company.name || "—"}</p>
                {visit.company.phone && (
                  <p className="text-sm text-gray-500 flex items-center gap-1.5">
                    <Phone className="w-3 h-3" />{visit.company.phone}
                  </p>
                )}
                {visit.company.email && (
                  <p className="text-sm text-gray-500 flex items-center gap-1.5">
                    <Mail className="w-3 h-3" />{visit.company.email}
                  </p>
                )}
              </div>
            </div>

            {/* ── VEHICLE ────────────────────────────────────── */}
            <div className="rounded-xl border border-green-100 bg-green-50/40 overflow-hidden">
              <div className="px-4 py-3 bg-green-50 border-b border-green-100 flex items-center gap-2">
                <Truck className="w-4 h-4 text-green-600" />
                <span className="text-sm font-semibold text-green-800">Vehicle</span>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Type</span>
                  <span className="text-sm font-semibold text-gray-900">{capitalize(visit.vehicle.vehicle_type) || "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Reg. No.</span>
                  <span className="text-sm font-semibold text-gray-900 font-mono bg-gray-100 px-2 py-0.5 rounded-lg">
                    {visit.vehicle.registration_number || "—"}
                  </span>
                </div>
                {/* Vehicle Photos */}
                {(visit.vehicle.vehicle_photo_url || visit.vehicle.number_plate_photo_url) && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {visit.vehicle.vehicle_photo_url && (
                      <div className="space-y-1">
                        <p className="text-xs text-gray-400">Vehicle</p>
                        <div className="aspect-video rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                          <img src={visit.vehicle.vehicle_photo_url} alt="Vehicle" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    )}
                    {visit.vehicle.number_plate_photo_url && (
                      <div className="space-y-1">
                        <p className="text-xs text-gray-400">Number Plate</p>
                        <div className="aspect-video rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                          <img src={visit.vehicle.number_plate_photo_url} alt="Plate" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── DELIVERY INFO ───────────────────────────────── */}
            <div className="rounded-xl border border-orange-100 bg-orange-50/40 overflow-hidden">
              <div className="px-4 py-3 bg-orange-50 border-b border-orange-100 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-semibold text-orange-800">Delivery Info</span>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Department</span>
                  <span className="text-sm font-semibold text-gray-900">{capitalize(visit.delivery.destination_department) || "—"}</span>
                </div>
                {visit.delivery.contact_person && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Contact</span>
                    <span className="text-sm font-medium text-gray-900">{visit.delivery.contact_person}</span>
                  </div>
                )}
                {visit.delivery.invoice_number && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Invoice</span>
                    <span className="text-sm font-medium text-gray-900 font-mono bg-gray-100 px-2 py-0.5 rounded-lg">
                      {visit.delivery.invoice_number}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Status</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200">
                    {capitalize(visit.delivery.status)}
                  </span>
                </div>
              </div>
            </div>

            {/* ── DELIVERY ITEMS ──────────────────────────────── */}
            <div className="rounded-xl border border-orange-200 overflow-hidden">
              <div className="px-4 py-3 bg-orange-50 border-b border-orange-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-semibold text-orange-800">
                    Items ({visit.delivery_items.length})
                  </span>
                </div>
                <span className="text-xs text-orange-600 font-medium">
                  {visit.delivery_items.reduce((a, i) => a + Number(i.quantity), 0)} units total
                </span>
              </div>
              <div className="divide-y divide-gray-100">
                {visit.delivery_items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3">
                    {/* Item photo */}
                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex-shrink-0">
                      {item.photo_url ? (
                        <img src={item.photo_url} alt={item.description} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-5 h-5 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.description}</p>
                    </div>
                    <span className="text-sm font-bold text-gray-900 bg-orange-50 border border-orange-100 px-2.5 py-1 rounded-lg flex-shrink-0">
                      ×{item.quantity}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── DOCUMENTS ───────────────────────────────────── */}
            {visit.documents.length > 0 && (
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-semibold text-gray-700">
                    Documents ({visit.documents.length})
                  </span>
                </div>
                <div className="p-3 grid grid-cols-4 gap-2">
                  {visit.documents.map((doc) => {
                    const isPdf = doc.file_url?.toLowerCase().endsWith(".pdf");
                    return (
                      <a
                        key={doc.id}
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50 hover:border-orange-400 transition-colors"
                      >
                        {isPdf ? (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                            <FileText className="w-6 h-6 text-red-400" />
                            <span className="text-xs text-gray-400 font-medium">PDF</span>
                          </div>
                        ) : (
                          <img
                            src={doc.file_url}
                            alt="Document"
                            className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                          />
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg" />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── TIMING ──────────────────────────────────────── */}
            <div className="rounded-xl border border-gray-100 bg-gray-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-semibold text-gray-600">Timing</span>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Entry Gate</span>
                  <span className="text-sm font-medium text-gray-900">Gate #{visit.entry_gate_id || "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Entry Time</span>
                  <span className="text-sm font-medium text-gray-900">{formatTime(visit.entry_time)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Duration</span>
                  <span className="text-sm font-semibold text-gray-900">{formatDuration(visit.entry_time)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {visit.notes && (
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1.5">Notes</p>
                <p className="text-sm text-amber-900">{visit.notes}</p>
              </div>
            )}

          </div>
        </div>

        {/* Drawer Footer */}
        {visit.status === "active" && (
          <div className="p-5 border-t border-gray-200 bg-white flex-shrink-0">
            <button
              onClick={() => onCheckout(visit)}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Process Exit
              <ArrowRight className="w-4 h-4 opacity-70" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, color, children }) {
  const colors = {
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    purple: "text-purple-600 bg-purple-50 border-purple-100",
    green: "text-green-600 bg-green-50 border-green-100",
    orange: "text-orange-600 bg-orange-50 border-orange-100",
    gray: "text-gray-600 bg-gray-50 border-gray-100",
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color] || colors.gray}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4" />
        <span className="text-sm font-semibold">{title}</span>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ label, value, icon: Icon, mono }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className={`font-medium text-gray-900 ${mono ? "font-mono text-xs" : ""} flex items-center gap-1`}>
        {Icon && <Icon className="w-3 h-3 opacity-60" />}
        {value || "—"}
      </span>
    </div>
  );
}

// ─── Delivery Card ────────────────────────────────────────────────────────────
function DeliveryCard({ visit, onView, onCheckout }) {
  const s = statusColors[visit.status] || statusColors.active;
  const dur = formatDuration(visit.entry_time);
  const longWait = (Date.now() - new Date(visit.entry_time)) > 90 * 60 * 1000;

  return (
    <div className={`
      group relative bg-white rounded-2xl border shadow-sm hover:shadow-lg transition-all duration-300
      ${longWait ? "border-amber-200 ring-1 ring-amber-200/50" : "border-gray-200/80"}
    `}>
      {longWait && (
        <div className="absolute -top-2 right-4 px-2.5 py-0.5 bg-amber-500 text-white text-xs font-semibold rounded-full shadow">
          Long Wait
        </div>
      )}

      <div className="p-5">
        {/* Card Top — driver photo + name */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-gray-100 bg-gray-100 flex-shrink-0">
              {visit.visitor.photo_url ? (
                <img src={visit.visitor.photo_url} alt="Driver" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-6 h-6 text-gray-300" />
                </div>
              )}
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {visit.visitor.first_name} {visit.visitor.last_name}
              </p>
              <p className="text-sm text-gray-500">{visit.company.name}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${s.bg} ${s.text} ${s.border}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${s.dot} ${visit.status === "active" ? "animate-pulse" : ""}`} />
              {s.badge}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${deliveryTypeBg[visit.delivery.delivery_type] || "bg-gray-100 text-gray-600"}`}>
              {deliveryTypeLabel[visit.delivery.delivery_type] || visit.delivery.delivery_type}
            </span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <InfoChip icon={Hash} label="Reg No." value={visit.vehicle.registration_number} mono />
          <InfoChip
            icon={MapPin}
            label="Department"
            value={visit.delivery.destination_department
              ? visit.delivery.destination_department.charAt(0).toUpperCase() +
                visit.delivery.destination_department.slice(1).replace(/_/g, " ")
              : "—"}
          />
          <InfoChip icon={Clock} label="Entry" value={formatTime(visit.entry_time)} />
          <InfoChip icon={Clock} label="Duration" value={dur} highlight={longWait} />
        </div>

        {/* Items Count */}
        <div className="flex items-center gap-2 mb-4 p-2.5 bg-orange-50/60 rounded-xl border border-orange-100">
          <Package className="w-4 h-4 text-orange-500 flex-shrink-0" />
          <span className="text-sm text-orange-700 font-medium">
            {visit.delivery_items.length} item type{visit.delivery_items.length !== 1 ? "s" : ""}
            {" — "}
            {visit.delivery_items.reduce((a, i) => a + Number(i.quantity), 0)} units total
          </span>
        </div>

        {/* Invoice */}
        {visit.delivery.invoice_number && (
          <p className="text-xs text-gray-400 font-mono mb-4">
            Invoice: {visit.delivery.invoice_number}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onView(visit)}
            className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-1.5"
          >
            <Eye className="w-4 h-4" />
            View Details
          </button>
          {visit.status === "active" && (
            <button
              onClick={() => onCheckout(visit)}
              className="flex-1 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl text-sm font-semibold hover:from-orange-600 hover:to-orange-700 transition-all shadow-md shadow-orange-500/20 flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              Checkout
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoChip({ icon: Icon, label, value, mono, highlight }) {
  return (
    <div className={`p-2.5 rounded-lg border ${highlight ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-gray-100"}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={`w-3 h-3 ${highlight ? "text-amber-500" : "text-gray-400"}`} />
        <span className={`text-xs ${highlight ? "text-amber-600" : "text-gray-400"}`}>{label}</span>
      </div>
      <p className={`text-sm font-semibold truncate ${highlight ? "text-amber-800" : "text-gray-900"} ${mono ? "font-mono text-xs" : ""}`}>
        {value || "—"}
      </p>
    </div>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────
function StatsBar({ deliveries }) {
  const active = deliveries.filter((d) => d.status === "active").length;
  const completed = deliveries.filter((d) => d.status === "completed").length;
  const longWait = deliveries.filter((d) => d.status === "active" && (Date.now() - new Date(d.entry_time)) > 90 * 60 * 1000).length;

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {[
        { label: "Active Deliveries", value: active, icon: CircleDot, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
        { label: "Awaiting >90 min", value: longWait, icon: Clock, color: "text-amber-600 bg-amber-50 border-amber-200" },
        { label: "Completed Today", value: completed, icon: CheckCircle, color: "text-blue-600 bg-blue-50 border-blue-200" },
      ].map((stat) => (
        <div key={stat.label} className={`rounded-2xl border p-4 flex items-center gap-3 ${stat.color.split(" ").slice(1).join(" ")}`}>
          <div className={`p-2.5 rounded-xl ${stat.color.split(" ")[0] === "text-emerald-600" ? "bg-emerald-100" : stat.color.split(" ")[0] === "text-amber-600" ? "bg-amber-100" : "bg-blue-100"}`}>
            <stat.icon className={`w-5 h-5 ${stat.color.split(" ")[0]}`} />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DeliveryCheckoutPage() {
  const [deliveries, setDeliveries] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [loadingList, setLoadingList] = useState(true);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [checkoutVisit, setCheckoutVisit] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const getGateIdFromStorage = () => {
    if (typeof window === "undefined") return "";
    const s = JSON.parse(localStorage.getItem("userSession") || "{}");
    return s.gate_id || "";
  };

  const userSession = typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("userSession") || "{}")
    : {};
  const gateName = userSession.gate_name || "Not set";

  const capitalizeFirst = (t = "") => t.charAt(0).toUpperCase() + t.slice(1);

  // Normalize API response to a flat, consistent shape.
  // Real API: visit has Deliveries[0] which contains Company, Vehicle,
  // DriverVisitor, DeliveryItems, Documents — all PascalCase.
  const normalizeVisit = (raw) => {
    const del  = Array.isArray(raw.Deliveries) && raw.Deliveries.length > 0
      ? raw.Deliveries[0]
      : (raw.delivery || raw.Delivery || {});

    const driver    = del.DriverVisitor || {};
    const helper    = del.HelperVisitor || null;
    const company   = del.Company       || {};
    const vehicle   = del.Vehicle       || {};
    const items     = Array.isArray(del.DeliveryItems)  ? del.DeliveryItems  : [];
    const documents = Array.isArray(del.Documents)      ? del.Documents      : [];

    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "";

    return {
      id:         raw.id,
      visit_id:   raw.id,          // used for the EXIT api call
      delivery_id: del.id || null,
      status:     raw.status || "active",
      entry_time: raw.entry_time  || raw.createdAt || new Date().toISOString(),
      exit_time:  raw.exit_time   || null,
      notes:      raw.notes       || "",
      entry_gate_id: raw.entry_gate_id,

      visitor: {
        first_name: driver.first_name || "",
        last_name:  driver.last_name  || "",
        phone:      driver.phone      || "",
        email:      driver.email      || "",
        photo_url:  driver.photo_url  ? `${baseUrl}${driver.photo_url}` : null,
      },
      helper: helper ? {
        first_name: helper.first_name || "",
        last_name:  helper.last_name  || "",
        phone:      helper.phone      || "",
        photo_url:  helper.photo_url  ? `${baseUrl}${helper.photo_url}` : null,
      } : null,
      company: {
        name:       company.name       || "",
        phone:      company.phone      || "",
        email:      company.email      || "",
        is_regular: company.is_regular || false,
      },
      vehicle: {
        vehicle_type:          vehicle.vehicle_type        || "",
        registration_number:   vehicle.registration_number || "",
        vehicle_photo_url:     vehicle.vehicle_photo_url     ? `${baseUrl}${vehicle.vehicle_photo_url}`     : null,
        number_plate_photo_url: vehicle.number_plate_photo_url ? `${baseUrl}${vehicle.number_plate_photo_url}` : null,
      },
      delivery: {
        delivery_type:          del.delivery_type          || "",
        invoice_number:         del.invoice_number         || "",
        destination_department: del.destination_department || "",
        contact_person:         del.contact_person         || "",
        status:                 del.status                 || "pending",
      },
      delivery_items: items.map((item) => ({
        id:          item.id,
        description: item.description || "",
        quantity:    item.quantity    || 0,
        photo_url:   item.photo_url   ? `${baseUrl}${item.photo_url}` : null,
      })),
      documents: documents.map((doc) => ({
        id:        doc.id,
        file_url:  doc.file_url ? `${baseUrl}${doc.file_url}` : null,
        type:      doc.document_type || "uploaded",
      })),
    };
  };

  const loadDeliveries = async () => {
    setLoadingList(true);
    setError("");
    try {
      const res = await getAllVisitsWithDeliveries({ purpose: "delivery" });
      const raw = res.data?.data || res.data?.visits || res.data || [];
      const data = Array.isArray(raw) ? raw : [];
      setDeliveries(data.map(normalizeVisit));
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to load deliveries. Please try again."
      );
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => { loadDeliveries(); }, []);

  // Filter + Search
  useEffect(() => {
    let result = [...deliveries];
    if (filterType !== "all") result = result.filter((d) => d.delivery.delivery_type === filterType);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((d) =>
        (d.visitor?.first_name || "").toLowerCase().includes(q) ||
        (d.visitor?.last_name  || "").toLowerCase().includes(q) ||
        (d.company?.name       || "").toLowerCase().includes(q) ||
        (d.vehicle?.registration_number || "").toLowerCase().includes(q) ||
        (d.delivery?.invoice_number     || "").toLowerCase().includes(q) ||
        (d.delivery?.destination_department || "").toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [deliveries, search, filterType]);

  const handleConfirmCheckout = async () => {
    if (!checkoutVisit) return;

    const gateId = getGateIdFromStorage();
    if (!gateId) {
      setError("Gate ID not found in session. Please re-login.");
      return;
    }

    setCheckoutLoading(true);
    setError("");
    try {
      const res = await exitVisitAndCompleteDelivery(checkoutVisit.visit_id, {
        exit_gate_id: gateId,
      });
      if (res.data?.success) {
        setSuccess(
          `Delivery checked out successfully! (${checkoutVisit.vehicle?.registration_number || checkoutVisit.visit_id})`
        );
        // Mark as completed locally so the UI updates instantly
        setDeliveries((prev) =>
          prev.map((d) =>
            d.id === checkoutVisit.id
              ? { ...d, status: "completed" }
              : d
          )
        );
        setCheckoutVisit(null);
        setSelectedVisit(null);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg shadow-orange-500/20">
                <ScanLine className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Delivery Checkout</h1>
                <p className="text-sm text-gray-500">Process exit & complete deliveries</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={loadDeliveries}
                disabled={loadingList}
                className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 text-gray-500 ${loadingList ? "animate-spin" : ""}`} />
              </button>
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl border border-gray-200">
                <Shield className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  Gate:{" "}
                  <span className="font-semibold text-gray-900">{capitalizeFirst(gateName)}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Alerts */}
        {error && (
          <div className="mb-5 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-xl">
              <AlertCircle className="h-4 w-4 text-red-600" />
            </div>
            <p className="text-red-700 text-sm flex-1 font-medium">{error}</p>
            <button onClick={() => setError("")} className="p-1.5 hover:bg-red-100 rounded-lg">
              <X className="w-4 h-4 text-red-400" />
            </button>
          </div>
        )}
        {success && (
          <div className="mb-5 bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-xl">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-green-700 text-sm flex-1 font-medium">{success}</p>
            <button onClick={() => setSuccess("")} className="p-1.5 hover:bg-green-100 rounded-lg">
              <X className="w-4 h-4 text-green-400" />
            </button>
          </div>
        )}

        {/* Stats */}
        {!loadingList && <StatsBar deliveries={deliveries} />}

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search driver, company, reg. no., department…"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all bg-white text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-3.5 h-3.5 text-gray-400" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
            {["all", "delivery", "pickup", "return", "exchange"].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                  filterType === t
                    ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                {t === "all" ? "All" : deliveryTypeLabel[t]}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loadingList ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-orange-400" />
            <p className="text-sm font-medium">Loading deliveries…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <Package className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-lg font-medium text-gray-500">No deliveries found</p>
            <p className="text-sm text-gray-400 mt-1">
              {search ? "Try a different search term" : "No active deliveries at this time"}
            </p>
            {search && (
              <button
                onClick={() => { setSearch(""); setFilterType("all"); }}
                className="mt-4 px-4 py-2 bg-orange-50 text-orange-600 rounded-xl text-sm font-medium border border-orange-200 hover:bg-orange-100 transition"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-400 mb-4">
              Showing {filtered.length} of {deliveries.length} deliveries
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map((v) => (
                <DeliveryCard
                  key={v.id}
                  visit={v}
                  onView={setSelectedVisit}
                  onCheckout={setCheckoutVisit}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Detail Drawer */}
      {selectedVisit && (
        <DetailDrawer
          visit={selectedVisit}
          onClose={() => setSelectedVisit(null)}
          onCheckout={(v) => { setSelectedVisit(null); setCheckoutVisit(v); }}
        />
      )}

      {/* Checkout Modal */}
      {checkoutVisit && (
        <CheckoutModal
          visit={checkoutVisit}
          gateName={gateName}
          onConfirm={handleConfirmCheckout}
          onCancel={() => setCheckoutVisit(null)}
          loading={checkoutLoading}
        />
      )}
    </div>
  );
}