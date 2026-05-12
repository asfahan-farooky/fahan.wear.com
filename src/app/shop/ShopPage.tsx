"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useProducts } from "@/context/ProductContext";
import ProductCard from "@/components/ProductCard";
import AnimatedSection from "@/components/AnimatedSection";
import FilterContent from "@/components/FilterContent";

export default function ShopPage() {
  const { products } = useProducts();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSize, setSelectedSize] = useState<string>("all");
  const [selectedColor, setSelectedColor] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000]);
  const [isOpen, setIsOpen] = useState(false);
  const searchTerm = searchParams.get("search") || "";

  // Set selectedCategory from URL parameter
  useEffect(() => {
    const category = searchParams.get("category");
    if (category && category !== selectedCategory) {
      setSelectedCategory(category);
    }
  }, [searchParams]);

  // Update URL when selectedCategory changes
  useEffect(() => {
    const currentCategory = searchParams.get("category");
    if (selectedCategory !== "all" && selectedCategory !== currentCategory) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("category", selectedCategory);
      router.replace(`/shop?${params.toString()}`, { scroll: false });
    } else if (selectedCategory === "all" && currentCategory) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("category");
      router.replace(`/shop?${params.toString()}`, { scroll: false });
    }
  }, [selectedCategory, searchParams, router]);

  // 🔍 Filtering logic
  const filtered = products.filter((p) => {
    if (selectedCategory !== "all" && p.category !== selectedCategory)
      return false;

    if (selectedSize !== "all" && !p.sizes.includes(selectedSize))
      return false;

    if (selectedColor !== "all" && !p.colors.includes(selectedColor))
      return false;

    if (p.price < priceRange[0] || p.price > priceRange[1])
      return false;

    if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase()))
      return false;

    return true;
  });

  // 🎯 Unique values
  const allSizes = Array.from(
    new Set(products.flatMap((p) => p.sizes))
  ).sort();

  const allColors = Array.from(
    new Set(products.flatMap((p) => p.colors))
  ).sort();

  // Category-specific colors
  const getCategoryColors = (category: string) => {
    if (category === "all") return allColors;
    const categoryProducts = products.filter(p => p.category === category);
    return Array.from(
      new Set(categoryProducts.flatMap((p) => p.colors))
    ).sort();
  };

  // Category-specific sizes
  const getCategorySizes = (category: string) => {
    if (category === "all") return allSizes;
    const categoryProducts = products.filter(p => p.category === category);
    return Array.from(
      new Set(categoryProducts.flatMap((p) => p.sizes))
    ).sort();
  };

  const categoryColors = getCategoryColors(selectedCategory);
  const categorySizes = getCategorySizes(selectedCategory);

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">

      {/* HEADER */}
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light uppercase tracking-[0.3em]">
            {searchTerm ? `Search: ${searchTerm}` : "Shop All"}
          </h1>
          {searchTerm && (
            <p className="text-sm text-neutral-600 mt-2">
              {filtered.length} product{filtered.length !== 1 ? "s" : ""} found
            </p>
          )}
        </div>

        {/* 📱 MOBILE FILTER BUTTON */}
        <button
          onClick={() => setIsOpen(true)}
          className="lg:hidden rounded-full border px-4 py-2 text-sm uppercase tracking-wider"
        >
          Filters
        </button>
      </div>

      <div className="flex gap-10">

        {/* 🖥️ DESKTOP SIDEBAR */}
        <aside className="hidden w-64 lg:block">
          <FilterContent
            {...{
              selectedCategory,
              setSelectedCategory,
              selectedSize,
              setSelectedSize,
              selectedColor,
              setSelectedColor,
              priceRange,
              setPriceRange,
              allSizes: categorySizes,
              allColors: categoryColors,
            }}
          />
        </aside>

        {/* 🛍️ PRODUCTS */}
        <div className="flex-1">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.length > 0 ? (
              filtered.map((product) => (
                <AnimatedSection key={product.id}>
                  <ProductCard product={product} />
                </AnimatedSection>
              ))
            ) : (
              <p className="col-span-full text-center text-brand-grey-400">
                No products found.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 📱 MOBILE DRAWER */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/40">
          <div className="absolute right-0 top-0 h-full w-80 bg-white p-6 shadow-xl">

            {/* CLOSE BUTTON */}
            <div className="mb-6 flex justify-between">
              <h2 className="text-lg font-medium">Filters</h2>
              <button onClick={() => setIsOpen(false)}>✕</button>
            </div>

            <FilterContent
              {...{
                selectedCategory,
                setSelectedCategory,
                selectedSize,
                setSelectedSize,
                selectedColor,
                setSelectedColor,
                priceRange,
                setPriceRange,
                allSizes: categorySizes,
                allColors: categoryColors,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}