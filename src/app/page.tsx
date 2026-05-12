// src/app/page.tsx
"use client";
import Image from "next/image";
import Link from "next/link";
import AnimatedSection from "@/components/AnimatedSection";
import ProductCard from "@/components/ProductCard";
import Button from "@/components/Button";
import { useProducts } from "@/context/ProductContext";

export default function Home() {
  const { products, categories } = useProducts();
  const featured = products.slice(0, 3);

  return (
    <>
      {/* HERO */}
      <section className="relative h-screen w-full overflow-hidden">

  {/* Fallback image (ALWAYS visible first) */}
  <Image
    src="/hero1.jpg"
    alt="Hero"
    fill
    priority
    className="object-cover object-center"
  />

  {/* Video on top of image */}
  <video
    className="absolute inset-0 w-full h-full object-cover object-center"
    autoPlay
    loop
    muted
    playsInline
    preload="auto"
  >
    <source src="/hero1.mp4" type="video/mp4" />
  </video>

  {/* overlay */}
  <div className="absolute inset-0 bg-black/20" />

  {/* content */}
  <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white">
    <AnimatedSection>
      <h1 className="text-[4rem] font-semibold uppercase leading-none tracking-[0.2em] md:text-[7rem]">
        𝔽𝔸ℍ𝔸ℕ 𝕎𝔼𝔸ℝ
      </h1>
      <p className="mt-4 text-lg font-light tracking-[0.3em]">
        ESSENTIALS FOR THE MODERN MAN
      </p>
      <div className="mt-10">
        <Button
          href="/shop"
          variant="outline"
          className="text-white border-white hover:bg-black hover:border-black hover:text-brand-900"
        >
          Shop Now
        </Button>
      </div>
    </AnimatedSection>
  </div>

</section>

      {/* FEATURED PRODUCTS */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <AnimatedSection>
          <h2 className="mb-12 text-center text-3xl font-light uppercase tracking-[0.3em] text-brand-800">
            Featured
          </h2>
        </AnimatedSection>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((product) => (
            <AnimatedSection key={product.id}>
              <ProductCard product={product} />
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="bg-brand-beige py-24">
        <div className="mx-auto max-w-7xl px-6">
          <AnimatedSection>
            <h2 className="mb-12 text-center text-3xl font-light uppercase tracking-[0.3em] text-brand-800">
              Shop by Category
            </h2>
          </AnimatedSection>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((cat) => (
              <Link href={`/shop?category=${cat.slug}`} key={cat.slug}>
                <AnimatedSection className="group block overflow-hidden">
                  <div className="relative aspect-[4/5]">
                    <Image
                      src={cat.image}
                      alt={cat.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-black/30" />
                    <h3 className="absolute bottom-6 left-6 text-2xl font-light uppercase tracking-widest text-white">
                      {cat.name}
                    </h3>
                  </div>
                </AnimatedSection>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* BRAND STORY */}
      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <AnimatedSection>
          <h2 className="text-3xl font-light uppercase tracking-[0.3em] text-brand-800">
            The 𝔽𝕒𝕙𝕒𝕟 𝕎𝕖𝕒𝕣 Philosophy
          </h2>
          <div className="mx-auto mt-10 max-w-2xl space-y-6 text-base leading-relaxed text-brand-500">
            <p>
              We believe in clothing that works as hard as you do. Every piece is
              crafted from the finest organic cotton, cut to a perfect silhouette,
              and built to last beyond a single season.
            </p>
            <p>
              No logos. No noise. Just uncompromising quality and quiet confidence.
            </p>
          </div>
        </AnimatedSection>
      </section>
    </>
  );
}