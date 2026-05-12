// src/components/ReviewForm.tsx
"use client";
import { useState } from "react";
import { FaStar } from "react-icons/fa";
import Button from "./Button";

interface ReviewFormProps {
  productId: string;
  userId: string;
  userName: string;
  onSubmit: (review: {
    productId: string;
    userId: string;
    userName: string;
    rating: number;
    title: string;
    comment: string;
  }) => Promise<void>;
  onCancel?: () => void;
}

export default function ReviewForm({
  productId,
  userId,
  userName,
  onSubmit,
  onCancel
}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      alert("Please select a rating");
      return;
    }

    if (!title.trim() || !comment.trim()) {
      alert("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        productId,
        userId,
        userName,
        rating,
        title: title.trim(),
        comment: comment.trim(),
      });

      // Reset form
      setRating(0);
      setTitle("");
      setComment("");
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to submit review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="border border-brand-grey-200 rounded-lg p-6 bg-white">
      <h3 className="text-lg font-medium text-brand-900 mb-4">
        Write a Review
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-brand-700 mb-2">
            Rating *
          </label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="focus:outline-none"
              >
                <FaStar
                  className={`w-6 h-6 ${
                    star <= (hoverRating || rating)
                      ? "text-yellow-400 fill-current"
                      : "text-gray-300"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label
            htmlFor="review-title"
            className="block text-sm font-medium text-brand-700 mb-2"
          >
            Review Title *
          </label>
          <input
            id="review-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Summarize your experience"
            className="w-full px-3 py-2 border border-brand-grey-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            maxLength={100}
            required
          />
        </div>

        {/* Comment */}
        <div>
          <label
            htmlFor="review-comment"
            className="block text-sm font-medium text-brand-700 mb-2"
          >
            Your Review *
          </label>
          <textarea
            id="review-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your thoughts about this product..."
            rows={4}
            className="w-full px-3 py-2 border border-brand-grey-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
            maxLength={500}
            required
          />
          <div className="text-xs text-brand-400 mt-1">
            {comment.length}/500 characters
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}