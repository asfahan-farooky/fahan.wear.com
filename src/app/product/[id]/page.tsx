// src/app/product/[id]/page.tsx
"use client";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useProducts } from "@/context/ProductContext";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/Button";
import AnimatedSection from "@/components/AnimatedSection";
import ReviewsSection from "@/components/ReviewsSection";
import { motion } from "framer-motion";
import { getImagesForColor } from "@/lib/productUtils";
import { useReviews } from "@/hooks/useReviews";

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const { products } = useProducts();
  const product = products.find((p) => p.id === id);
  const { dispatch } = useCart();
  const { user, userProfile } = useAuth();
  const [activeImage, setActiveImage] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);

  const [selectedSize, setSelectedSize] = useState<string>(
    product?.sizes[0] || ""
  );
  const [selectedColor, setSelectedColor] = useState<string>(
    product?.colors[0] || ""
  );
  const [quantity, setQuantity] = useState(1);
  const [expandedDescription, setExpandedDescription] = useState(false);

  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Reviews
  const { reviews, submitReview, canUserReview } = useReviews(product?.id || "");

  useEffect(() => {
    // Sync selected size/color when a new product loads.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedSize(product?.sizes[0] || "");
    setSelectedColor(product?.colors[0] || "");
  }, [product?.colors, product?.sizes]);

  if (!product) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          {/* Spinner */}
          <svg
            className="h-8 w-8 animate-spin text-brand-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <p className="text-xl font-light uppercase tracking-widest">
            Loading Product...
          </p>
        </div>
      </div>
    );
  }

  const availableImages = getImagesForColor(product, selectedColor);

  const addToCart = () => {
    dispatch({
      type: "ADD_ITEM",
      payload: { product, size: selectedSize, color: selectedColor, quantity },
    });

    setAddedToCart(true);

    // optional: auto-hide after few seconds
    // setTimeout(() => {
    //   setAddedToCart(false);
    // }, 4000);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0].screenX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].screenX;
    handleSwipe();
  };

  const handleSwipe = () => {
    if (touchStartX.current == null || touchEndX.current == null) return;
    const diff = touchStartX.current - touchEndX.current;

    if (diff > 50) {
      setActiveImage((prev) =>
        prev < availableImages.length - 1 ? prev + 1 : prev
      );
    }

    if (diff < -50) {
      setActiveImage((prev) =>
        prev > 0 ? prev - 1 : prev
      );
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 md:py-16">
      <div className="grid grid-cols-1 gap-8 md:gap-12 md:grid-cols-2">
        {/* IMAGES */}
        <div className="flex flex-col gap-4">
            {/* MAIN IMAGE */}
            <motion.div
                key={activeImage}
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -50, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="relative aspect-[4/5] w-full overflow-hidden bg-brand-grey-100"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                <Image
                  src={availableImages[activeImage]}
                  alt="Main product"
                  fill
                  className="object-cover"
                  priority
                />
              </motion.div>

            {/* THUMBNAILS */}
            <div className="flex gap-3 overflow-x-auto">
              {availableImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`relative h-20 w-20 flex-shrink-0 overflow-hidden border ${
                    activeImage === idx ? "border-black" : "border-gray-300"
                  }`}
                >
                  <Image
                    src={img}
                    alt={`thumb ${idx}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

        {/* PRODUCT INFO */}
        <AnimatedSection className="flex flex-col justify-center">
          <div className="space-y-6 md:space-y-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-light uppercase tracking-[0.15em]">
                {product.name}
              </h1>
              <p className="mt-2 text-xl md:text-2xl font-light text-brand-500">
                ₹{product.price}
              </p>
            </div>

            <div>
              <p
                className={`text-sm md:text-base leading-relaxed text-brand-500 whitespace-pre-wrap ${
                  !expandedDescription ? 'line-clamp-[5]' : ''
                }`}
              >
                {product.description}
              </p>

              <button
                onClick={() => setExpandedDescription(!expandedDescription)}
                className="mt-3 text-xs md:text-sm uppercase tracking-widest text-green-600 hover:text-green-800 transition-colors font-medium"
              >
                {expandedDescription ? '— View Less' : '+ View More'}
              </button>
            </div>

            {product.colors.length > 0 && (
              <div>
                <h3 className="mb-3 text-xs md:text-sm uppercase tracking-widest">
                  Color
                </h3>
                <div className="flex flex-wrap gap-2 md:gap-3">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`min-w-[3.5rem] rounded-full border px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm uppercase tracking-widest transition-colors ${
                        selectedColor === color
                            ? "border-black bg-black text-white"
                            : "border-gray-300 bg-white text-black hover:border-black"
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* SIZE SELECTOR */}
            <div>
              <h3 className="mb-3 text-xs md:text-sm uppercase tracking-widest">
                Size
              </h3>
              <div className="flex flex-wrap gap-2 md:gap-3">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`min-w-[3rem] border px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm uppercase tracking-wider transition-colors ${
                      selectedSize === size
                        ? "border-black bg-black text-white"
                        : "border-gray-300 bg-white text-black hover:border-black"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* QUANTITY */}
            <div>
              <h3 className="mb-3 text-xs md:text-sm uppercase tracking-widest">
                Qty
              </h3>
              <div className="flex w-24 md:w-28 items-center border border-brand-200">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-2 md:px-3 py-1.5 md:py-2 text-lg md:text-xl font-light hover:bg-brand-grey-50"
                >
                  –
                </button>
                <span className="flex-1 text-center text-sm">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-2 md:px-3 py-1.5 md:py-2 text-lg md:text-xl font-light hover:bg-brand-grey-50"
                >
                  +
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <Button onClick={addToCart} className="w-full text-sm md:text-base">
                Add to Cart
              </Button>

              {addedToCart && (
                <Button
                  href="/cart"
                  variant="secondary"
                  className="w-full text-sm md:text-base"
                >
                  View Cart
                </Button>
              )}
            </div>

            <p className="text-[10px] md:text-xs uppercase tracking-widest text-brand-300">
              Free shipping on this order
            </p>
          </div>
        </AnimatedSection>
      </div>

      <div className="mt-6 grid gap-4 rounded-3xl border border-brand-200 bg-white/90 p-4 shadow-sm sm:grid-cols-3 sm:p-6">
  {/* Lowest Price */}
  <div className="group flex items-start gap-4 rounded-2xl border border-brand-100 bg-brand-grey-50 p-4 transition hover:shadow-md sm:p-5">
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-700 shadow-sm">
      {/* Tag icon – best price */}
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
    <div>
      <p className="text-sm font-bold uppercase tracking-[0.15em] text-brand-700">Lowest Price</p>
      <p className="mt-1 text-xs leading-relaxed text-brand-500">We match fair prices so you get the best deal.</p>
    </div>
  </div>

  {/* Cash on Delivery */}
  <div className="group flex items-start gap-4 rounded-2xl border border-brand-100 bg-brand-grey-50 p-4 transition hover:shadow-md sm:p-5">
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 shadow-sm">
      {/* Banknote icon – cash */}
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="6" width="20" height="12" rx="2" stroke="currentColor" />
        <path d="M6 6v12M18 6v12" stroke="currentColor" />
        <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
      </svg>
    </div>
    <div>
      <p className="text-sm font-bold uppercase tracking-[0.15em] text-brand-700">Cash on Delivery Avelable</p>
      <p className="mt-1 text-xs leading-relaxed text-brand-500">Pay when your order arrives at your doorstep.</p>
    </div>
  </div>

  {/* 7-day Returns */}
  <div className="group flex items-start gap-4 rounded-2xl border border-brand-100 bg-brand-grey-50 p-4 transition hover:shadow-md sm:p-5">
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700 shadow-sm">
      {/* Circular arrows – easy returns */}
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M1 4v6h6" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M23 20v-6h-6" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.49 9A9 9 0 005.64 5.64L1 10" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.51 15A9 9 0 0018.36 18.36L23 14" />
      </svg>
    </div>
    <div>
      <p className="text-sm font-bold uppercase tracking-[0.15em] text-brand-700">7-day Returns</p>
      <p className="mt-1 text-xs leading-relaxed text-brand-500">Not satisfied? Return your order within 7 days.</p>
    </div>
  </div>
</div>

      {/* REVIEWS SECTION */}
      {product && (
        <ReviewsSection
          productId={product.id}
          userId={user?.uid}
          userName={userProfile?.fullName}
          reviews={reviews}
          onSubmitReview={submitReview}
          canReview={canUserReview(user?.uid)}
        />
      )}
    </div>
  );
}