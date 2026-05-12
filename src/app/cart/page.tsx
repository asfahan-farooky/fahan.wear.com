// src/app/cart/page.tsx
"use client";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import Button from "@/components/Button";
import AnimatedSection from "@/components/AnimatedSection";
import { getPrimaryImage } from "@/lib/productUtils";
import { Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { getImagesForColor } from "@/lib/productUtils";

export default function CartPage() {
  const { state, dispatch } = useCart();

  const total = state.items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const [mounted, setMounted] = useState(false);

    useEffect(() => {
      setMounted(true);
    }, []);

    if (!mounted) {
     return null; // ya loader dikha sakte ho
    }

    if (state.items.length === 0) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <AnimatedSection>
            <h2 className="text-2xl font-light uppercase tracking-widest">
              Your cart is empty
            </h2>
            <Link href="/shop" className="mt-6 inline-block text-sm uppercase tracking-wider underline underline-offset-4 hover:text-brand-500">
              Continue Shopping
            </Link>
          </AnimatedSection>
        </div>
      );
   }

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <AnimatedSection>
        <h1 className="mb-12 text-center text-3xl font-light uppercase tracking-[0.3em]">
          Your Cart
        </h1>
      </AnimatedSection>

      <div className="space-y-8">
        {state.items.map((item) => (
          <AnimatedSection key={`${item.product.id}-${item.size}-${item.color}`}>
            <div className="flex gap-6 border-b border-brand-grey-100 pb-6">
              <div className="relative h-32 w-24 flex-shrink-0 overflow-hidden bg-brand-grey-100">
                {(() => {
                  const images = getImagesForColor(item.product, item.color);
                  const image = images?.[0] || "/placeholder.png";

                  return (
                    <Image
                      src={image}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                  );
                })()}
              </div>
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <h3 className="text-sm font-medium uppercase tracking-wider">
                    {item.product.name}
                  </h3>
                  <p className="mt-1 text-sm text-brand-500">Size: {item.size} • Color: {item.color}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center border border-brand-200">
                    <button
                      onClick={() =>
                        dispatch({
                          type: "UPDATE_QUANTITY",
                          payload: {
                            productId: item.product.id,
                            size: item.size,
                            color: item.color,
                            quantity: item.quantity - 1,
                          },
                        })
                      }
                      className="px-3 py-1 text-lg font-light hover:bg-brand-grey-50"
                    >
                      –
                    </button>
                    <span className="min-w-[2rem] text-center text-sm">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        dispatch({
                          type: "UPDATE_QUANTITY",
                          payload: {
                            productId: item.product.id,
                            size: item.size,
                            color: item.color,
                            quantity: item.quantity + 1,
                          },
                        })
                      }
                      className="px-3 py-1 text-lg font-light hover:bg-brand-grey-50"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-sm font-medium">
                    ₹{item.product.price * item.quantity}
                  </p>
                  <button
                    onClick={() =>
                      dispatch({
                        type: "REMOVE_ITEM",
                        payload: { productId: item.product.id, size: item.size, color: item.color },
                      })
                    }
                    className="text-brand-400 hover:text-brand-900"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </AnimatedSection>
        ))}
      </div>

      <AnimatedSection className="mt-10 border-t border-brand-900 pt-8">
        <div className="flex justify-between text-lg font-light uppercase tracking-wider">
          <span>Total</span>
          <span>₹{total}</span>
        </div>
        <div className="mt-8 flex justify-end">
          <Button href="/checkout">Proceed to Checkout</Button>
        </div>
      </AnimatedSection>
    </div>
  );
}