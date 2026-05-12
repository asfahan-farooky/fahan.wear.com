// src/app/checkout/page.tsx
"use client";
import { useEffect, useState } from "react";
import { z } from "zod";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/firebase/client";
import Button from "@/components/Button";
import AnimatedSection from "@/components/AnimatedSection";
import OrderStatusProgress from "@/components/OrderStatusProgress";
import { getImagesForColor } from "@/lib/productUtils";
import Link from "next/link";
import type { Order, UserProfile } from "@/types";

const checkoutSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required"),
  phone: z
    .string()
    .trim()
    .min(1, "Mobile number is required")
    .regex(/^\d{10}$/, "Enter a valid 10-digit mobile number"),
  address: z.string().trim().min(3, "Address must be at least 3 characters"),
  city: z.string().trim().min(2, "City must be at least 2 characters"),
  state: z
    .string()
    .trim()
    .min(1, "State is required")
    .regex(/^[a-zA-Z\s]+$/, "State can only contain letters and spaces"),
  zip: z
    .string()
    .trim()
    .min(1, "ZIP code is required")
    .regex(/^\d{5,6}$/, "Enter a 5- or 6-digit ZIP code"),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const { state, dispatch } = useCart();
  const { user, userProfile, loading, saveUserProfile } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [orderStatus, setOrderStatus] = useState<Order["status"]>("pending");
  const [isFirstOrder, setIsFirstOrder] = useState(false);

  // Shipping form fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateValue, setStateValue] = useState("");
  const [zip, setZip] = useState("");

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "Razorpay">("COD");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof CheckoutFormData, string>>
  >({});

  // Toggle: show form if no saved profile yet
  const [showShippingForm, setShowShippingForm] = useState(false);

  // Pre‑fill from saved profile (or show summary)
  useEffect(() => {
    if (!loading && userProfile) {
      // Check if profile has at least fullName and address
      if (userProfile.fullName && userProfile.address) {
        setFullName(userProfile.fullName);
        setPhone(userProfile.phone || "");
        setAddress(userProfile.address.street);
        setCity(userProfile.address.city);
        setStateValue(userProfile.address.state);
        setZip(userProfile.address.zip);
        setShowShippingForm(false); // show summary card
      } else {
        setShowShippingForm(true);
      }
    } else if (!loading && !userProfile) {
      setShowShippingForm(true);
    }
  }, [userProfile, loading]);

  useEffect(() => {
    if (!user || !db) {
      setIsFirstOrder(false);
      return;
    }

    const firestoreDb = db;
    const fetchOrderHistory = async () => {
      try {
        const previousOrdersQuery = query(
          collection(firestoreDb, "orders"),
          where("userId", "==", user.uid),
          limit(1)
        );
        const snapshot = await getDocs(previousOrdersQuery);
        setIsFirstOrder(snapshot.empty);
      } catch (err) {
        console.error("Error checking first order eligibility:", err);
        setIsFirstOrder(false);
      }
    };

    fetchOrderHistory();
  }, [user]);

  const clearFieldError = (field: keyof CheckoutFormData) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Cart items & price
  const orderItems = state.items.map((item) => {
    const images = getImagesForColor(item.product, item.color);
    return {
      productId: item.product.id,
      name: item.product.name,
      price: item.product.price,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
      image: images?.[0] || "",
    };
  });

  const subtotal = state.items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const shippingCharge = 0;
  const onlinePaymentDiscount = paymentMethod === "Razorpay" ? 50 : 0;
  const firstOrderDiscount = isFirstOrder ? 50 : 0;
  const discountTotal = onlinePaymentDiscount + firstOrderDiscount;
  const finalTotal = Math.max(0, subtotal + shippingCharge - discountTotal);

  // ---- Backend APIs ----
  const createRazorpayOrder = async (amount: number) => {
    const res = await fetch("/api/razorpay/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, receipt: `order_${Date.now()}` }),
    });
    if (!res.ok) throw new Error("Failed to create Razorpay order");
    return res.json();
  };

  const verifyRazorpayPayment = async (
    paymentId: string,
    orderId: string,
    signature: string
  ) => {
    const res = await fetch("/api/razorpay/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        razorpay_payment_id: paymentId,
        razorpay_order_id: orderId,
        razorpay_signature: signature,
      }),
    });
    if (!res.ok) throw new Error("Payment verification failed");
    return res.json();
  };

  const placeOrder = async (orderPayload: any) => {
    if (!db) throw new Error("Firebase not initialized");
    if (!user) throw new Error("Unauthorized");

    const token = await user.getIdToken();
    const response = await fetch("/api/orders/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(orderPayload),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error || "Unable to place order");
    }

    return data;
  };

  const loadRazorpayScript = () =>
    new Promise<boolean>((resolve) => {
      if (typeof window === "undefined") return resolve(false);
      if ((window as any).Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  // ---- Razorpay flow ----
  const handleRazorpayCheckout = async (formData: CheckoutFormData) => {
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) throw new Error("Unable to load Razorpay checkout.");

    const amountInPaise = finalTotal * 100;
    const { id: order_id, amount, currency } = await createRazorpayOrder(amountInPaise);

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      amount,
      currency,
      name: "Fahan Wear",
      description: "Order payment",
      order_id,
      prefill: {
        name: formData.fullName,
        email: user?.email,
        contact: formData.phone,
      },
      handler: async (response: any) => {
        try {
          await verifyRazorpayPayment(
            response.razorpay_payment_id,
            response.razorpay_order_id,
            response.razorpay_signature
          );
          await placeOrder({
            shipping: formData,
            items: orderItems,
            subtotal,
            shippingCharge,
            onlinePaymentDiscount,
            firstOrderDiscount,
            discountTotal,
            total: finalTotal,
            paymentMethod: "Razorpay",
            paymentStatus: "paid",
            paymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
          });
          setOrderStatus("pending");
          dispatch({ type: "CLEAR_CART" });
          setSubmitted(true);
        } catch (err: any) {
          setError(err.message || "Payment verification failed.");
          setIsProcessing(false);
        }
      },
      modal: { ondismiss: () => setIsProcessing(false) },
      theme: { color: "#1A1A1A" },
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  };

  // ---- Form submission ----
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    if (!user) {
      setError("Please sign in before placing an order.");
      return;
    }

    // If the form is hidden, we use the saved profile data
    const formData: CheckoutFormData = showShippingForm
      ? { fullName, phone, address, city, state: stateValue, zip }
      : {
          fullName: userProfile?.fullName || "",
          phone: userProfile?.phone || "",
          address: userProfile?.address
            ? `${userProfile.address.street}, ${userProfile.address.city}, ${userProfile.address.state} ${userProfile.address.zip}`
            : "",
          city: userProfile?.address?.city || "",
          state: userProfile?.address?.state || "",
          zip: userProfile?.address?.zip || "",
        };

    if (showShippingForm) {
      const result = checkoutSchema.safeParse(formData);
      if (!result.success) {
        const errorsMap: Partial<Record<keyof CheckoutFormData, string>> = {};
        result.error.issues.forEach((issue) => {
          const field = issue.path[0] as keyof CheckoutFormData;
          if (!errorsMap[field]) errorsMap[field] = issue.message;
        });
        setFieldErrors(errorsMap);
        return;
      }
    }

    if (orderItems.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    setIsProcessing(true);

    try {
      // Save/update profile only if the form was shown and valid
      if (showShippingForm) {
        const profileData: Partial<UserProfile> = {
          fullName: formData.fullName,
          phone: formData.phone,
          address: {
            street: formData.address,
            city: formData.city,
            state: formData.state,
            zip: formData.zip,
          },
        };
        await saveUserProfile(profileData);
      }

      if (paymentMethod === "Razorpay") {
        await handleRazorpayCheckout(formData);
        // Note: isProcessing will be reset only on failure or modal close
        return;
      }

      // COD
      await placeOrder({
        shipping: formData,
        items: orderItems,
        subtotal,
        shippingCharge,
        onlinePaymentDiscount,
        firstOrderDiscount,
        discountTotal,
        total: finalTotal,
        paymentMethod: "COD",
        paymentStatus: "pending",
      });
      setOrderStatus("pending");
      dispatch({ type: "CLEAR_CART" });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Unable to place order. Try again.");
      setIsProcessing(false);
    }
  };

  // ---- Render states ----
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-base text-brand-500">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <AnimatedSection>
          <h2 className="text-2xl font-light uppercase tracking-widest">
            Sign in to checkout
          </h2>
          <p className="mt-4 text-brand-500">
            Your shipping details and order history are saved in your account.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button href="/login">Sign In</Button>
            <Button href="/login" variant="secondary">
              Create Account
            </Button>
          </div>
        </AnimatedSection>
      </div>
    );
  }

  if (state.items.length === 0 && !submitted) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-xl uppercase tracking-widest">Nothing to checkout</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <AnimatedSection>
          <h2 className="text-2xl font-light uppercase tracking-widest">
            Order Placed
          </h2>
          <p className="mt-4 text-brand-500">Thank you for your purchase.</p>
          <div className="mt-8 w-full max-w-xl">
            <OrderStatusProgress status={orderStatus} />
          </div>
        </AnimatedSection>
      </div>
    );
  }

  // ---- Main checkout ----
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <AnimatedSection>
        <h1 className="mb-12 text-center text-3xl font-light uppercase tracking-[0.3em]">
          Checkout
        </h1>
      </AnimatedSection>

      {/* Order Summary */}
      <section className="mb-10 space-y-4 rounded-3xl border border-brand-grey-200 bg-white p-6">
        <h2 className="text-sm uppercase tracking-widest text-brand-700">
          Order Summary
        </h2>
        <ul className="divide-y divide-brand-grey-100">
          {orderItems.map((item, idx) => (
            <li key={idx} className="flex items-center gap-4 py-3">
              {item.image && (
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-14 w-14 rounded-xl object-cover"
                />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium">{item.name}</p>
                <p className="text-xs text-brand-500">
                  {item.size} / {item.color} × {item.quantity}
                </p>
              </div>
              <p className="text-sm font-medium">₹{item.price * item.quantity}</p>
            </li>
          ))}
        </ul>

        {/* Price breakdown */}
        <div className="border-t border-brand-grey-200 pt-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>₹{subtotal}</span>
          </div>
          <div className={`flex justify-between text-sm ${shippingCharge === 0 ? "text-green-600" : "text-red-500"}`}>
            <span>Free Shipping</span>
            <span>Free</span>
          </div>
          {onlinePaymentDiscount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>MRP discount for online payment</span>
              <span>-₹{onlinePaymentDiscount}</span>
            </div>
          )}
          {firstOrderDiscount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>MRP discount for first purchase</span>
              <span>-₹{firstOrderDiscount}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-base pt-2 border-t border-brand-grey-100">
            <span>Total</span>
            <span>₹{finalTotal}</span>
          </div>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="space-y-8" noValidate>
        {/* Contact (email display)
        <fieldset className="space-y-4">
          <legend className="text-sm uppercase tracking-widest">Contact</legend>
          <input
            type="email"
            value={user?.email ?? ""}
            disabled
            className="w-full rounded-2xl border border-brand-grey-200 bg-brand-grey-50 px-4 py-3 text-base text-brand-500"
          />
        </fieldset> */}

        {/* Shipping: either summary card or full form */}
        {!showShippingForm && userProfile ? (
          <fieldset className="space-y-4">
            <legend className="text-sm uppercase tracking-widest">Shipping Address</legend>
            <div className="rounded-3xl border border-brand-grey-200 bg-brand-grey-50 p-5 space-y-2">
              <p className="text-sm font-medium">{userProfile.fullName}</p>
              <p className="text-sm">{userProfile.address?.street}</p>
              <p className="text-sm">
                {[userProfile.address?.city, userProfile.address?.state, userProfile.address?.zip]
                  .filter(Boolean)
                  .join(", ")}
              </p>
              {userProfile.phone && <p className="text-sm">📞 {userProfile.phone}</p>}
              <Link
                href="/profile"
                className="mt-3 inline-flex items-center text-sm font-medium text-brand-900 underline hover:no-underline"
              >
                ✏️ Edit address
              </Link>
            </div>
          </fieldset>
        ) : (
          <fieldset className="space-y-4">
            <legend className="text-sm uppercase tracking-widest">Shipping</legend>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Full Name */}
              <div>
                <label className="block text-sm text-brand-700">Full name*</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    clearFieldError("fullName");
                  }}
                  className={`mt-2 w-full rounded-2xl border px-4 py-3 text-sm ${
                    fieldErrors.fullName
                      ? "border-red-400 bg-red-50"
                      : "border-brand-grey-200 bg-brand-grey-50 focus:border-brand-900"
                  }`}
                  placeholder="Enter Your Full Name"
                />
                {fieldErrors.fullName && (
                  <p className="mt-1 text-xs text-red-500">{fieldErrors.fullName}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm text-brand-700">Mobile Number*</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    clearFieldError("phone");
                  }}
                  className={`mt-2 w-full rounded-2xl border px-4 py-3 text-sm ${
                    fieldErrors.phone
                      ? "border-red-400 bg-red-50"
                      : "border-brand-grey-200 bg-brand-grey-50 focus:border-brand-900"
                  }`}
                  placeholder="Enter mobile number (Ex. 1234567890)"
                />
                {fieldErrors.phone && (
                  <p className="mt-1 text-xs text-red-500">{fieldErrors.phone}</p>
                )}
              </div>

              {/* Address (full width) */}
              <div className="sm:col-span-2">
                <label className="block text-sm text-brand-700">Address*</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    clearFieldError("address");
                  }}
                  className={`mt-2 w-full rounded-2xl border px-4 py-3 text-sm ${
                    fieldErrors.address
                      ? "border-red-400 bg-red-50"
                      : "border-brand-grey-200 bg-brand-grey-50 focus:border-brand-900"
                  }`}
                  placeholder="Enter Your Full Address"
                />
                {fieldErrors.address && (
                  <p className="mt-1 text-xs text-red-500">{fieldErrors.address}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {/* City */}
              <div>
                <label className="block text-sm text-brand-700">City*</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    clearFieldError("city");
                  }}
                  className={`mt-2 w-full rounded-2xl border px-4 py-3 text-sm ${
                    fieldErrors.city
                      ? "border-red-400 bg-red-50"
                      : "border-brand-grey-200 bg-brand-grey-50 focus:border-brand-900"
                  }`}
                  placeholder="Ex. Mumbai, Hydrabad..."
                />
                {fieldErrors.city && (
                  <p className="mt-1 text-xs text-red-500">{fieldErrors.city}</p>
                )}
              </div>

              {/* State */}
              <div>
                <label className="block text-sm text-brand-700">State*</label>
                <input
                  type="text"
                  value={stateValue}
                  onChange={(e) => {
                    setStateValue(e.target.value);
                    clearFieldError("state");
                  }}
                  className={`mt-2 w-full rounded-2xl border px-4 py-3 text-sm ${
                    fieldErrors.state
                      ? "border-red-400 bg-red-50"
                      : "border-brand-grey-200 bg-brand-grey-50 focus:border-brand-900"
                  }`}
                  placeholder="Ex. Dehli, Uttar Pradesh..."
                />
                {fieldErrors.state && (
                  <p className="mt-1 text-xs text-red-500">{fieldErrors.state}</p>
                )}
              </div>

              {/* ZIP */}
              <div>
                <label className="block text-sm text-brand-700">ZIP*</label>
                <input
                  type="text"
                  value={zip}
                  onChange={(e) => {
                    setZip(e.target.value);
                    clearFieldError("zip");
                  }}
                  className={`mt-2 w-full rounded-2xl border px-4 py-3 text-sm ${
                    fieldErrors.zip
                      ? "border-red-400 bg-red-50"
                      : "border-brand-grey-200 bg-brand-grey-50 focus:border-brand-900"
                  }`}
                  placeholder="Pin Code - (Ex. 123456)"
                />
                {fieldErrors.zip && (
                  <p className="mt-1 text-xs text-red-500">{fieldErrors.zip}</p>
                )}
              </div>
            </div>
          </fieldset>
        )}

        {/* Payment Method Selection */}
        <fieldset className="space-y-4">
          <legend className="text-sm uppercase tracking-widest">Payment Method</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* COD Card */}
            <label
              className={`relative rounded-3xl border-2 p-5 cursor-pointer transition-all ${
                paymentMethod === "COD"
                  ? "border-brand-900 bg-brand-grey-50 shadow-sm"
                  : "border-brand-grey-200 bg-white hover:border-brand-grey-400"
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="COD"
                  checked={paymentMethod === "COD"}
                  onChange={() => setPaymentMethod("COD")}
                  className="mt-0.5 h-5 w-5 text-brand-900 focus:ring-brand-900"
                />
                <div>
                  <span className="text-sm font-medium text-brand-900">
                    Cash on Delivery
                  </span>
                  <p className="mt-1 text-xs text-brand-500">
                    Pay when your order arrives
                  </p>
                </div>
              </div>
              {paymentMethod === "COD" && (
                <div className="absolute right-4 top-4 h-5 w-5 rounded-full bg-brand-900 text-white flex items-center justify-center text-xs">
                  ✓
                </div>
              )}
            </label>

            {/* Online Payment Card */}
            <label
              className={`relative rounded-3xl border-2 p-5 cursor-pointer transition-all ${
                paymentMethod === "Razorpay"
                  ? "border-brand-900 bg-brand-grey-50 shadow-sm"
                  : "border-brand-grey-200 bg-white hover:border-brand-grey-400"
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="Razorpay"
                  checked={paymentMethod === "Razorpay"}
                  onChange={() => setPaymentMethod("Razorpay")}
                  className="mt-0.5 h-5 w-5 text-brand-900 focus:ring-brand-900"
                />
                <div>
                  <span className="text-sm font-medium text-brand-900">
                    Online Payment
                  </span>
                  <p className="mt-1 text-xs text-brand-500">
                    UPI / Card / Netbanking Secure
                  </p>
                  <p className="mt-1 text-xs text-brand-500 text-green-600">
                    Save ₹50.
                  </p>
                  <p className="mt-2 text-[10px] text-brand-400 flex items-center gap-1">
                    🔒 Secure payment powered by Razorpay
                  </p>
                </div>
              </div>
              {paymentMethod === "Razorpay" && (
                <div className="absolute right-4 top-4 h-5 w-5 rounded-full bg-brand-900 text-white flex items-center justify-center text-xs">
                  ✓
                </div>
              )}
            </label>
          </div>
        </fieldset>

        {error && (
          <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isProcessing}>
          {isProcessing
            ? "Processing…"
            : paymentMethod === "Razorpay"
            ? "Pay ₹" + finalTotal
            : "Place Order"}
        </Button>
      </form>
    </div>
  );
}