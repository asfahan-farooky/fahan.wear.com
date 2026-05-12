// src/components/ReviewsSection.tsx
"use client";
import { useState, useEffect } from "react";
import { Review as ReviewType } from "@/types";
import { FaStar } from "react-icons/fa";
import Review from "./Review";
import ReviewForm from "./ReviewForm";
import Button from "./Button";

interface ReviewsSectionProps {
  productId: string;
  userId?: string;
  userName?: string;
  reviews: ReviewType[];
  onSubmitReview: (review: {
    productId: string;
    userId: string;
    userName: string;
    rating: number;
    title: string;
    comment: string;
  }) => Promise<void>;
  canReview?: boolean;
}

export default function ReviewsSection({
  productId,
  userId,
  userName,
  reviews,
  onSubmitReview,
  canReview = false,
}: ReviewsSectionProps) {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "highest" | "lowest">("newest");

  // Calculate average rating
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;

  // Sort reviews
  const sortedReviews = [...reviews].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "oldest":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "highest":
        return b.rating - a.rating;
      case "lowest":
        return a.rating - b.rating;
      default:
        return 0;
    }
  });

  // Rating distribution
  const ratingCounts = [1, 2, 3, 4, 5].map(rating =>
    reviews.filter(review => review.rating === rating).length
  );

  return (
    <div className="mt-16 space-y-8">
      {/* Header */}
      <div className="border-t border-brand-grey-200 pt-8">
        <h2 className="text-2xl font-light uppercase tracking-widest mb-6">
          Customer Reviews
        </h2>

        {/* Rating Summary */}
        {reviews.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FaStar
                        key={star}
                        className={`w-5 h-5 ${
                          star <= Math.round(averageRating)
                            ? "text-yellow-400 fill-current"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-lg font-medium">
                    {averageRating.toFixed(1)}
                  </span>
                </div>
                <span className="text-brand-500">
                  ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
                </span>
              </div>

              {/* Rating Bars */}
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <div key={rating} className="flex items-center gap-2 text-sm">
                    <span className="w-3">{rating}</span>
                    <FaStar className="w-3 h-3 text-yellow-400 fill-current" />
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full"
                        style={{
                          width: `${reviews.length > 0 ? (ratingCounts[rating - 1] / reviews.length) * 100 : 0}%`
                        }}
                      />
                    </div>
                    <span className="w-8 text-right">{ratingCounts[rating - 1]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Write Review Button */}
            <div className="flex items-center justify-center md:justify-end">
              {canReview && userId && userName && (
                <Button
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  variant={showReviewForm ? "secondary" : "primary"}
                >
                  {showReviewForm ? "Cancel Review" : "Write a Review"}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Review Form */}
        {showReviewForm && userId && userName && (
          <div className="mb-8">
            <ReviewForm
              productId={productId}
              userId={userId}
              userName={userName}
              onSubmit={onSubmitReview}
              onCancel={() => setShowReviewForm(false)}
            />
          </div>
        )}

        {/* Reviews List */}
        {reviews.length > 0 ? (
          <div className="space-y-6">
            {/* Sort Options */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">
                Reviews ({reviews.length})
              </h3>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="px-3 py-1 border border-brand-grey-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Rated</option>
                <option value="lowest">Lowest Rated</option>
              </select>
            </div>

            {/* Reviews */}
            <div className="space-y-6">
              {sortedReviews.map((review) => (
                <Review key={review.id} review={review} />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-brand-500 mb-4">No reviews yet</p>
            {canReview && userId && userName && (
              <Button onClick={() => setShowReviewForm(true)}>
                Be the first to review this product
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}