// src/components/ProductCard.tsx
"use client";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Product } from "@/types";
import { getPrimaryImage } from "@/lib/productUtils";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/product/${product.id}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden bg-brand-grey-100">
        <motion.div
          whileHover={{ scale: 1.03 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="h-full w-full"
        >
          <Image
            src={getPrimaryImage(product)}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
            priority={false}
          />
        </motion.div>
      </div>
      <div className="mt-4 space-y-1">
        <h3 className="text-sm font-medium uppercase tracking-wider text-brand-700">
          {product.name}
        </h3>
        <p className="text-sm text-brand-500">₹{product.price}</p>
      </div>
    </Link>
  );
}