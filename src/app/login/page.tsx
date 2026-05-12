"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RecaptchaVerifier } from "firebase/auth";
import type { ConfirmationResult } from "firebase/auth";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/Button";
import AnimatedSection from "@/components/AnimatedSection";

export default function LoginPage() {
  const router = useRouter();
  const { sendOTP, verifyOTPAndLogin } = useAuth();

  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  const verifierRef = useRef<RecaptchaVerifier | null>(null);

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  useEffect(() => {
    return () => {
      if (verifierRef.current) {
        verifierRef.current.clear();
      }
    };
  }, []);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!verifierRef.current && recaptchaContainerRef.current) {
        const { auth } = await import("@/firebase/client");
        if (!auth) throw new Error("Firebase auth not initialized");
        verifierRef.current = new RecaptchaVerifier(auth, recaptchaContainerRef.current, {
          size: "invisible",
        });
      }

      if (!verifierRef.current) {
        throw new Error("Recaptcha verifier failed to initialize.");
      }

      const result = await sendOTP(phone, verifierRef.current);
      setConfirmationResult(result);
      setStep("otp");
    } catch (err: any) {
      setError(err.message || "Failed to send OTP");
      if (verifierRef.current) {
        verifierRef.current.clear();
        verifierRef.current = null;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!confirmationResult) {
        throw new Error("Please request a new OTP.");
      }

      await verifyOTPAndLogin(confirmationResult, otp, phone);
      router.push("/profile");
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <AnimatedSection>
        <h1 className="mb-6 text-3xl font-light uppercase tracking-[0.3em] text-brand-900">
          Continue with Mobile
        </h1>
        <p className="text-sm text-brand-500">
          Enter your mobile number to open your account or create a new one.
        </p>
      </AnimatedSection>

      {step === "phone" ? (
        <form
          onSubmit={handleSendOTP}
          className="space-y-6 rounded-3xl border border-brand-grey-100 bg-white p-8 shadow-sm"
        >
          <label className="block text-sm text-brand-700">
            Mobile Number
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              required
              maxLength={10}
              className="mt-3 w-full rounded-2xl border border-brand-grey-200 bg-brand-grey-50 px-4 py-3 text-sm text-brand-900 focus:border-brand-900 focus:outline-none"
              placeholder="9876543210"
            />
          </label>

          <div id="recaptcha-container" ref={recaptchaContainerRef} />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading || phone.length !== 10}>
            {loading ? "Sending OTP..." : "Send OTP"}
          </Button>

          <p className="text-center text-sm text-brand-500">
            Enter your mobile number and we'll open your existing account or create a new one automatically.
          </p>
        </form>
      ) : (
        <form
          onSubmit={handleVerifyOTP}
          className="space-y-6 rounded-3xl border border-brand-grey-100 bg-white p-8 shadow-sm"
        >
          <div className="rounded-3xl border border-brand-grey-200 bg-brand-grey-50 p-4 text-sm text-brand-600">
            OTP sent to +91{phone}
          </div>

          <label className="block text-sm text-brand-700">
            Enter OTP
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              required
              maxLength={6}
              className="mt-3 w-full rounded-2xl border border-brand-grey-200 bg-brand-grey-50 px-4 py-3 text-sm text-brand-900 focus:border-brand-900 focus:outline-none"
              placeholder="000000"
            />
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
            {loading ? "Verifying..." : "Verify OTP"}
          </Button>

          <button
            type="button"
            onClick={() => {
              setStep("phone");
              setOtp("");
              setError("");
              setConfirmationResult(null);
              if (verifierRef.current) {
                verifierRef.current.clear();
                verifierRef.current = null;
              }
            }}
            className="w-full text-sm text-brand-500 hover:text-brand-900"
          >
            Change number
          </button>
        </form>
      )}
    </div>
  );
}
