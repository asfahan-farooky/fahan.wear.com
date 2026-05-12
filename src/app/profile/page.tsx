"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/Button";
import AnimatedSection from "@/components/AnimatedSection";
import OrderHistory from "@/components/OrderHistory";
import type { UserProfile } from "@/types";

// ---- Zod schema ----
const profileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "Full name is required"),

  phone: z
    .string()
    .trim()
    .min(1, "Mobile number is required")
    .regex(/^\d{10}$/, "Enter a valid 10-digit mobile number"),

  address: z
    .string()
    .trim()
    .min(3, "Address must be at least 3 characters"),

  city: z
    .string()
    .trim()
    .min(2, "City must be at least 2 characters"),

  state: z
    .string()
    .trim()
    .min(1, "State is required")
    .regex(/^[a-zA-Z\s]+$/, "State must contain only letters and spaces"),  // adjust as needed

  zip: z
    .string()
    .trim()
    .min(1, "ZIP code is required")
    .regex(/^\d{5,6}$/, "Enter a 5- or 6-digit ZIP code"),
});

type ProfileFormData = z.infer<typeof profileSchema>;

// ---- Component ----
export default function ProfilePage() {
  const { user, userProfile, loading, saveUserProfile } = useAuth();

  // Form state
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateValue, setStateValue] = useState("");
  const [zip, setZip] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState<string>("");

  // Validation error state – keys match the form fields
  const [errors, setErrors] = useState<
    Partial<Record<keyof ProfileFormData, string>>
  >({});

  // Prefill from loaded profile
  useEffect(() => {
    if (userProfile) {
      setFullName(userProfile.fullName);
      if (userProfile.address) {
        setAddress(userProfile.address.street);
        setCity(userProfile.address.city);
        setStateValue(userProfile.address.state);
        setZip(userProfile.address.zip);
      }
      setPhone(userProfile.phone || "");
    }
  }, [userProfile]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  setMessage("");

  if (!user) return;

  const data = {
    fullName,
    phone,
    address,
    city,
    state: stateValue,
    zip,
  };

  const result = profileSchema.safeParse(data);

  if (!result.success) {
    const fieldErrors: Partial<Record<keyof ProfileFormData, string>> = {};
    result.error.issues.forEach((issue) => {
      const field = issue.path[0] as keyof ProfileFormData;
      if (!fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    });
    setErrors(fieldErrors);
    return;
  }

  setErrors({});
  const profileData = {
    fullName: result.data.fullName,
    phone: result.data.phone,
    address: {
      street: result.data.address,
      city: result.data.city,
      state: result.data.state,
      zip: result.data.zip,
    },
  };
  await saveUserProfile(profileData); // now data is trimmed and safe
  setMessage("Profile and shipping details saved.");
};

  // Helper to clear error when user starts typing in a field
  const clearError = (field: keyof ProfileFormData) => {
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Loading & not-authenticated states...
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-base text-brand-500">Loading your profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <AnimatedSection>
          <h1 className="mb-4 text-3xl font-light uppercase tracking-[0.3em] text-brand-900">
            Profile
          </h1>
          <p className="text-brand-500">
            Please sign in to view and update your shipping details.
          </p>
          <div className="mt-8 flex justify-center">
            <Button href="/login">Sign In</Button>
          </div>
        </AnimatedSection>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <AnimatedSection>
        <h1 className="mb-6 text-3xl font-light uppercase tracking-[0.3em] text-brand-900">
          Account
        </h1>
      </AnimatedSection>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-3xl border border-brand-grey-100 bg-white p-8 shadow-sm"
        noValidate
      >
        {/* Read‑only email */}
        <div>
          <p className="text-sm uppercase tracking-widest text-brand-500">
            Email
          </p>
          <p className="mt-2 text-base text-brand-700">{user.email}</p>
        </div>

        {/* Full Name */}
        <div>
          <label className="block text-sm text-brand-700">
            Full name
            <input
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                clearError("fullName");
              }}
              required
              className={`mt-3 w-full rounded-2xl border px-4 py-3 text-sm text-brand-900 focus:outline-none ${
                errors.fullName
                  ? "border-red-400 bg-red-50"
                  : "border-brand-grey-200 bg-brand-grey-50 focus:border-brand-900"
              }`}
            />
          </label>
          {errors.fullName && (
            <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>
          )}
        </div>

        {/* Mobile Number */}
        <div>
          <label className="block text-sm text-brand-700">
            Mobile Number
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                clearError("phone");
              }}
              required
              className={`mt-3 w-full rounded-2xl border px-4 py-3 text-sm text-brand-900 focus:outline-none ${
                errors.phone
                  ? "border-red-400 bg-red-50"
                  : "border-brand-grey-200 bg-brand-grey-50 focus:border-brand-900"
              }`}
              placeholder="Enter mobile number"
            />
          </label>
          {errors.phone && (
            <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
          )}
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm text-brand-700">
            Address
            <input
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                clearError("address");
              }}
              required
              className={`mt-3 w-full rounded-2xl border px-4 py-3 text-sm text-brand-900 focus:outline-none ${
                errors.address
                  ? "border-red-400 bg-red-50"
                  : "border-brand-grey-200 bg-brand-grey-50 focus:border-brand-900"
              }`}
            />
          </label>
          {errors.address && (
            <p className="mt-1 text-xs text-red-500">{errors.address}</p>
          )}
        </div>

        {/* City / State / ZIP row */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm text-brand-700">
              City
              <input
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  clearError("city");
                }}
                required
                className={`mt-3 w-full rounded-2xl border px-4 py-3 text-sm text-brand-900 focus:outline-none ${
                  errors.city
                    ? "border-red-400 bg-red-50"
                    : "border-brand-grey-200 bg-brand-grey-50 focus:border-brand-900"
                }`}
              />
            </label>
            {errors.city && (
              <p className="mt-1 text-xs text-red-500">{errors.city}</p>
            )}
          </div>
          <div>
            <label className="block text-sm text-brand-700">
              State
              <input
                value={stateValue}
                onChange={(e) => {
                  setStateValue(e.target.value);
                  clearError("state");
                }}
                required
                className={`mt-3 w-full rounded-2xl border px-4 py-3 text-sm text-brand-900 focus:outline-none ${
                  errors.state
                    ? "border-red-400 bg-red-50"
                    : "border-brand-grey-200 bg-brand-grey-50 focus:border-brand-900"
                }`}
              />
            </label>
            {errors.state && (
              <p className="mt-1 text-xs text-red-500">{errors.state}</p>
            )}
          </div>
          <div>
            <label className="block text-sm text-brand-700">
              ZIP
              <input
                value={zip}
                onChange={(e) => {
                  setZip(e.target.value);
                  clearError("zip");
                }}
                required
                className={`mt-3 w-full rounded-2xl border px-4 py-3 text-sm text-brand-900 focus:outline-none ${
                  errors.zip
                    ? "border-red-400 bg-red-50"
                    : "border-brand-grey-200 bg-brand-grey-50 focus:border-brand-900"
                }`}
              />
            </label>
            {errors.zip && (
              <p className="mt-1 text-xs text-red-500">{errors.zip}</p>
            )}
          </div>
        </div>

        {/* Submit & feedback */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button type="submit" className="w-full sm:w-auto">
            Save Details
          </Button>
          {message && <p className="text-sm text-brand-700">{message}</p>}
        </div>
      </form>

      {/* Order History */}
      <div className="mt-12">
        <OrderHistory />
      </div>
    </div>
  );
}