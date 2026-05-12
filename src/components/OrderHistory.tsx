// src/components/OrderHistory.tsx
"use client";

import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, addDoc, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase/client";
import { useAuth } from "@/context/AuthContext";
import { Order } from "@/types";
import AnimatedSection from "./AnimatedSection";
import OrderStatusProgress from "./OrderStatusProgress";
import Link from "next/link";
import ReturnRequestModal from "./ReturnRequestModal";
import ReviewForm from "./ReviewForm";

export default function OrderHistory() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderForReturn, setSelectedOrderForReturn] = useState<Order | null>(null);
  const [selectedOrderForReview, setSelectedOrderForReview] = useState<{ order: Order; productId: string } | null>(null);

  const isReturnEligible = (order: Order): boolean => {
    if (order.status !== "delivered") return false;
    const deliveredAt = order.deliveredAt
      ? order.deliveredAt instanceof Date
        ? order.deliveredAt
        : new Date(order.deliveredAt)
      : order.createdAt;
    const today = new Date();
    const daysDifference = Math.floor((today.getTime() - deliveredAt.getTime()) / (1000 * 60 * 60 * 24));
    return daysDifference <= 7;
  };

  const getDaysRemainingForReturn = (order: Order): number => {
    const deliveredAt = order.deliveredAt
      ? order.deliveredAt instanceof Date
        ? order.deliveredAt
        : new Date(order.deliveredAt)
      : order.createdAt;
    const today = new Date();
    const daysDifference = Math.floor((today.getTime() - deliveredAt.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, 7 - daysDifference);
  };

  const handleReviewSubmit = async (reviewData: {
    productId: string;
    userId: string;
    userName: string;
    rating: number;
    title: string;
    comment: string;
  }) => {
    try {
      if (!db) throw new Error("Firebase not initialized");

      const reviewQuery = query(
        collection(db, "reviews"),
        where("productId", "==", reviewData.productId),
        where("userId", "==", reviewData.userId)
      );

      const existingReviewSnapshot = await getDocs(reviewQuery);
      if (existingReviewSnapshot.size > 0) {
        throw new Error("You have already reviewed this product.");
      }

      const purchaseQuery = query(
        collection(db, "orders"),
        where("userId", "==", reviewData.userId),
        where("status", "==", "delivered")
      );
      const purchaseSnapshot = await getDocs(purchaseQuery);
      const hasPurchased = purchaseSnapshot.docs.some((orderDoc) => {
        const order = orderDoc.data();
        return order.items?.some((item: any) => item.productId === reviewData.productId);
      });

      if (!hasPurchased) {
        throw new Error("You can only review products you have received.");
      }

      await addDoc(collection(db, "reviews"), {
        ...reviewData,
        verified: hasPurchased,
        createdAt: serverTimestamp(),
      });

      setSelectedOrderForReview(null);
      alert("Review submitted successfully!");
    } catch (error) {
      console.error("Error submitting review:", error);
      alert(error instanceof Error ? error.message : "Failed to submit review. Please try again.");
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    if (!db) return;
    try {
      await updateDoc(doc(db, "orders", orderId), { status: "cancelled" });
    } catch (error) {
      console.error("Error cancelling order:", error);
      alert("Failed to cancel order. Please try again.");
    }
  };

  useEffect(() => {
    if (!user || !db) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "orders"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const ordersData: Order[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
            deliveredAt: data.deliveredAt?.toDate ? data.deliveredAt.toDate() : data.deliveredAt ? new Date(data.deliveredAt) : undefined,
            returnRequestDate: data.returnRequestDate?.toDate ? data.returnRequestDate.toDate() : data.returnRequestDate ? new Date(data.returnRequestDate) : undefined,
            returnApprovedDate: data.returnApprovedDate?.toDate ? data.returnApprovedDate.toDate() : data.returnApprovedDate ? new Date(data.returnApprovedDate) : undefined,
          } as Order;
        });
        setOrders(ordersData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching orders:", error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-sm text-brand-500">Loading order history...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-brand-500">No orders found.</p>
      </div>
    );
  }

  return (
    <div id="orders" className="space-y-6">
      <h2 className="text-xl font-light uppercase tracking-widest">Order History</h2>
      {orders.map((order) => (
        <AnimatedSection key={order.id}>
          <div className="rounded-3xl border border-brand-grey-100 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-brand-500">
                  Order #{order.id.slice(-8).toUpperCase()}
                </p>
                <p className="text-xs text-brand-400">
                  {order.createdAt.toLocaleDateString()} • {order.status}
                </p>
                <p className="text-xs text-brand-400">
                  Payment: {order.paymentMethod} • {order.paymentStatus}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-medium">₹{order.total.toFixed(2)}</p>
                <p className="text-xs text-brand-500">
                  {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <OrderStatusProgress status={order.status} />
            </div>
            <div className="mt-4 space-y-2">
              {order.items.map((item, index) => (
                <Link
                  key={index}
                  href={`/product/${item.productId}`}
                  className="flex items-center gap-3 text-sm hover:bg-gray-50 p-2 rounded-lg transition"
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center text-xs">
                      No Image
                    </div>
                  )}

                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-brand-500">
                      Size: {item.size} • Color: {item.color} • Qty: {item.quantity}
                    </p>
                  </div>

                  <p className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</p>
                </Link>
              ))}
            </div>
            <div className="mt-4 border-t border-brand-grey-100 pt-4">
              <h3 className="text-sm font-medium mb-2">Shipping Address</h3>
              <p className="text-sm text-brand-700">
                {order.shipping.fullName}<br />
                {order.shipping.address}<br />
                {order.shipping.city}, {order.shipping.state} {order.shipping.zip}<br />
                {order.shipping.phone}
              </p>
            </div>
            {order.status === "delivered" && (
              <div className="mt-4 space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row">
                  {order.returnStatus && order.returnStatus !== "none" ? (
                    <div className="flex-1 rounded-lg bg-blue-50 p-3">
                      <p className="text-sm font-medium text-blue-900">Return Status: {order.returnStatus}</p>
                      {order.returnRequestDate && (
                        <p className="text-xs text-blue-700 mt-1">
                          Requested on {order.returnRequestDate instanceof Date ? order.returnRequestDate.toLocaleDateString() : new Date(order.returnRequestDate).toLocaleDateString()}
                        </p>
                      )}
                      {order.returnReason && (
                        <p className="text-xs text-blue-700 mt-1">Reason: {order.returnReason}</p>
                      )}
                    </div>
                  ) : isReturnEligible(order) ? (
                    <button
                      type="button"
                      onClick={() => setSelectedOrderForReturn(order)}
                      className="flex-1 rounded-lg border border-brand-800 px-4 py-2 text-sm font-medium text-brand-800 hover:bg-brand-50 transition bg-black text-white"
                    >
                      Request Return ({getDaysRemainingForReturn(order)} days left)
                    </button>
                  ) : (
                    <div className="flex-1 rounded-lg bg-gray-50 p-3">
                      <p className="text-sm font-medium text-gray-600">Return period expired (7 days)</p>
                    </div>
                  )}
                </div>
                <div className="border-t border-brand-grey-100 pt-3 space-y-2">
                  <p className="text-sm font-medium text-brand-900">Rate these products</p>
                  <div className="grid grid-cols-1 gap-2">
                    {order.items.map((item) => (
                      <button
                        key={item.productId}
                        type="button"
                        onClick={() => setSelectedOrderForReview({ order, productId: item.productId })}
                        className="text-left rounded-lg border border-brand-300 px-3 py-2 text-sm hover:bg-brand-50 transition"
                      >
                        <p className="font-medium text-brand-900">{item.name}</p>
                        <p className="text-xs text-brand-500">Size: {item.size} • Color: {item.color}</p>
                        <p className="text-xs text-brand-600 mt-1">✍️ Write a review</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {order.status === "pending" && (
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <button
                  onClick={() => handleCancelOrder(order.id)}
                  className="flex-1 rounded-lg border border-red-600 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition"
                >
                  Cancel Order
                </button>
              </div>
            )}
          </div>
        </AnimatedSection>
      ))}
      {selectedOrderForReturn && (
        <ReturnRequestModal
          order={selectedOrderForReturn}
          onClose={() => setSelectedOrderForReturn(null)}
          isEligible={isReturnEligible(selectedOrderForReturn)}
          daysRemaining={getDaysRemainingForReturn(selectedOrderForReturn)}
        />
      )}
      {selectedOrderForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-lg font-semibold">Rate Product</h2>
              <button
                type="button"
                onClick={() => setSelectedOrderForReview(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-5">
              <ReviewForm
                productId={selectedOrderForReview.productId}
                userId={user!.uid}
                userName={user?.displayName || selectedOrderForReview.order.shipping.fullName || user?.email?.split("@")[0] || "Anonymous"}
                onSubmit={handleReviewSubmit}
                onCancel={() => setSelectedOrderForReview(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}