// src/app/product/[id]/page.tsx
"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
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

  // Reviews
  const {
    reviews,
    loading: reviewsLoading,
    submitReview,
    canUserReview,
  } = useReviews(product?.id || "");

  useEffect(() => {
    setSelectedSize(product?.sizes[0] || "");
    setSelectedColor(product?.colors[0] || "");
  }, [product?.id]);

  if (!product) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-xl font-light uppercase tracking-widest">
          Product not found
        </p>
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

  let touchStartX = 0;
  let touchEndX = 0;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX = e.changedTouches[0].screenX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  };

  const handleSwipe = () => {
    const diff = touchStartX - touchEndX;

    if (diff > 50) {
      // swipe left → next image
      setActiveImage((prev) =>
        prev < availableImages.length - 1 ? prev + 1 : prev
      );
    }

    if (diff < -50) {
      // swipe right → previous image
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
              Free shipping on orders over ₹2000
            </p>
          </div>
        </AnimatedSection>
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