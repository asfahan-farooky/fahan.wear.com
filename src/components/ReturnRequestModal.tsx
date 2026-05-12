"use client";

import { useState } from "react";
import { X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Order } from "@/types";
import { useAuth } from "@/context/AuthContext";

interface ReturnRequestModalProps {
  order: Order;
  onClose: () => void;
  isEligible?: boolean;
  daysRemaining?: number;
}

const RETURN_REASONS = [
  { value: "defective", label: "Defective or damaged", icon: "🛠️" },
  { value: "wrong_size", label: "Wrong size", icon: "📏" },
  { value: "wrong_color", label: "Wrong color", icon: "🎨" },
  { value: "not_as_described", label: "Not as described", icon: "📋" },
  { value: "changed_mind", label: "Changed mind", icon: "🤔" },
  { value: "arrived_late", label: "Arrived late", icon: "⏰" },
  { value: "other", label: "Other", icon: "💬" },
];

export default function ReturnRequestModal({
  order,
  onClose,
  isEligible = true,
  daysRemaining = 0,
}: ReturnRequestModalProps) {
  const { user } = useAuth();
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Combine reasons into a single submission string
  const submissionReason =
    selectedReason === "other" ? customReason.trim() : selectedReason;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isEligible) {
      setError("This order is no longer eligible for return.");
      return;
    }

    if (!submissionReason) {
      setError("Please select or provide a reason for return.");
      return;
    }
    if (!user) {
      setError("You must be logged in to request a return.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/orders/request-return", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          userId: user.uid,
          reason: submissionReason,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to submit return request.");
      }

      setSuccess(true);
      setTimeout(() => onClose(), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset custom reason when switching away from "other"
  const handleReasonSelect = (value: string) => {
    setSelectedReason(value);
    if (value !== "other") {
      setCustomReason("");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="return-title"
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-2">
          <div>
            <h2
              id="return-title"
              className="text-xl font-semibold text-gray-900 tracking-tight"
            >
              Request a Return
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Order #{order.id.slice(-8).toUpperCase()}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors disabled:opacity-50"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div className="p-5 pt-2">
            <div className="rounded-xl bg-green-50 border border-green-200 p-6 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-green-600 mb-2" />
              <p className="text-lg font-medium text-green-900">
                Return request submitted!
              </p>
              <p className="text-sm text-green-700 mt-1">
                We’ll review your request and get back to you within 24 hours.
              </p>
            </div>
          </div>
        ) : !isEligible ? (
          <div className="p-5 pt-2">
            <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-center">
              <AlertCircle className="mx-auto h-10 w-10 text-red-600 mb-2" />
              <p className="text-lg font-medium text-red-900">Return Window Expired</p>
              <p className="text-sm text-red-700 mt-1">
                Returns are only allowed within 7 days of delivery. This order is no longer eligible for return.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 pt-3 space-y-5">
            {/* Reason selection */}
            <fieldset>
              <legend className="block text-sm font-medium text-gray-700 mb-3">
                Reason for Return
              </legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {RETURN_REASONS.map(({ value, label, icon }) => {
                  const isSelected = selectedReason === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleReasonSelect(value)}
                      className={`flex items-center gap-2.5 rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition-all duration-150 ${
                        isSelected
                          ? "border-brand-800 bg-brand-800 text-white shadow-md scale-[1.02] bg-black"
                          : "border-gray-200 bg-white text-gray-700 hover:border-brand-300 hover:bg-brand-50"
                      }`}
                    >
                      <span className="text-lg" aria-hidden="true">
                        {icon}
                      </span>
                      <span>{label}</span>
                      {/* {isSelected && (
                        <span className="ml-auto text-xs bg-white/20 rounded-full px-2 py-0.5">
                          Selected
                        </span>
                      )} */}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {/* Custom reason input */}
            {selectedReason === "other" && (
              <div className="space-y-2 animate-in slide-in-from-top-2">
                <label
                  htmlFor="custom-reason"
                  className="block text-sm font-medium text-gray-700"
                >
                  Please describe your reason
                </label>
                <textarea
                  id="custom-reason"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Tell us why you'd like to return this order..."
                  rows={4}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm shadow-sm focus:border-brand-800 focus:ring-2 focus:ring-brand-100 placeholder:text-gray-400 transition-colors resize-none"
                />
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700 animate-in fade-in">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !submissionReason}
                className="flex-1 rounded-xl bg-brand-800 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-900 active:scale-[0.98] transition-all disabled:opacity-60 disabled:hover:bg-brand-800 disabled:active:scale-100 flex items-center justify-center gap-2 bg-black"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  "Submit Request"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}