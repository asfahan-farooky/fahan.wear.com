// src/components/Review.tsx
"use client";
import { Review as ReviewType } from "@/types";
import { FaStar, FaCheckCircle } from "react-icons/fa";

interface ReviewProps {
  review: ReviewType;
}

export default function Review({ review }: ReviewProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  return (
    <div className="border-b border-brand-grey-200 pb-6 last:border-b-0">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <FaStar
                key={star}
                className={`w-4 h-4 ${
                  star <= review.rating
                    ? "text-yellow-400 fill-current"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>
          {review.verified && (
            <div className="flex items-center gap-1 text-xs text-green-600">
              <FaCheckCircle className="w-3 h-3" />
              <span>Verified Purchase</span>
            </div>
          )}
        </div>
        <span className="text-xs text-brand-400">
          {formatDate(review.createdAt)}
        </span>
      </div>

      <div className="mb-2">
        <h4 className="font-medium text-brand-900">{review.title}</h4>
      </div>

      <p className="text-sm text-brand-600 leading-relaxed mb-2">
        {review.comment}
      </p>

      <div className="text-xs text-brand-500">
        By {review.userName}
      </div>
    </div>
  );
}