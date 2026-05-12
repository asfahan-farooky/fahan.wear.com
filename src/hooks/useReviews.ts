// src/hooks/useReviews.ts
import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/firebase/client";
import { Review } from "@/types";

export function useReviews(productId: string) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId || !db) return;

    const q = query(
      collection(db, "reviews"),
      where("productId", "==", productId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const reviewsData: Review[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          reviewsData.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
          } as Review);
        });
        setReviews(reviewsData);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching reviews:", err);
        setError("Failed to load reviews");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [productId]);

  const submitReview = async (reviewData: {
    productId: string;
    userId: string;
    userName: string;
    rating: number;
    title: string;
    comment: string;
  }) => {
    if (!db) throw new Error("Database not available");

    // Check if user has already reviewed this product
    const existingReview = reviews.find(review => review.userId === reviewData.userId);
    if (existingReview) {
      throw new Error("You have already reviewed this product");
    }

    // Check if user has purchased this product (for verification)
    let verified = false;
    try {
      const ordersQuery = query(
        collection(db, "orders"),
        where("userId", "==", reviewData.userId),
        where("status", "in", ["delivered", "shipped"])
      );
      const ordersSnapshot = await getDocs(ordersQuery);
      // Check if user has purchased this specific product
      verified = ordersSnapshot.docs.some(doc => {
        const order = doc.data();
        return order.items?.some((item: any) => item.productId === reviewData.productId);
      });
    } catch (err) {
      console.log("Could not verify purchase:", err);
    }

    await addDoc(collection(db, "reviews"), {
      ...reviewData,
      verified,
      createdAt: serverTimestamp(),
    });
  };

  const canUserReview = (userId?: string): boolean => {
    if (!userId) return false;
    return !reviews.some(review => review.userId === userId);
  };

  return {
    reviews,
    loading,
    error,
    submitReview,
    canUserReview,
  };
}