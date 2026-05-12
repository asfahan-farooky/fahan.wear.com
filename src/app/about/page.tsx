import Image from "next/image";
import AnimatedSection from "@/components/AnimatedSection";
import Button from "@/components/Button";

export default function AboutPage() {
  return (
    <div>
      {/* HERO / HEADLINE */}
      <section className="relative h-[60vh] w-full overflow-hidden">
        <Image
          src="/ourstory.png"             // replace with your own image
          alt="Fahan Wear Studio"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
          <AnimatedSection>
            <h1 className="text-4xl font-light uppercase tracking-[0.3em] md:text-6xl">
              Our Story
            </h1>
          </AnimatedSection>
        </div>
      </section>

      {/* BRAND PHILOSOPHY */}
      <section className="mx-auto max-w-4xl px-6 py-24">
        <AnimatedSection>
          <h2 className="mb-12 text-center text-3xl font-light uppercase tracking-[0.2em] text-brand-900">
            Designed for the Quietly Confident
          </h2>
        </AnimatedSection>

        <div className="grid gap-12 md:grid-cols-2">
          <AnimatedSection>
            <p className="text-base leading-relaxed text-brand-500">
              𝔽𝕒𝕙𝕒𝕟 𝕎𝕖𝕒𝕣 was born from the belief that a man’s wardrobe should be built on
              a foundation of flawless basics. We obsess over fabric weight, stitch
              density, and silhouette — removing everything that doesn’t belong until
              only the essential remains.
            </p>
          </AnimatedSection>
          <AnimatedSection>
            <p className="text-base leading-relaxed text-brand-500">
              Every T‑shirt we make is cut from 100% organic cotton, pre‑shrunk, and
              garment‑dyed for a lived‑in feel from the first wear. No logos, no
              trends — just enduring quality that speaks through its fit and feel.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* VALUES */}
      <section className="bg-brand-beige py-24">
        <div className="mx-auto max-w-6xl px-6">
          <AnimatedSection>
            <h2 className="mb-16 text-center text-2xl font-light uppercase tracking-[0.25em] text-brand-800">
              What We Stand For
            </h2>
          </AnimatedSection>

          <div className="grid gap-12 sm:grid-cols-3">
            {[
              {
                title: "Quality",
                desc: "Heavyweight fabrics, reinforced seams, and fits perfected over dozens of samples. We build pieces that last years, not seasons.",
              },
              {
                title: "Simplicity",
                desc: "Our designs are intentionally free of distractions. Every detail serves a purpose — nothing is added for show.",
              },
              {
                title: "Responsibility",
                desc: "Organic cotton, ethical manufacturing, and plastic‑free packaging. Luxury should never come at the expense of the planet.",
              },
            ].map((value) => (
              <AnimatedSection key={value.title}>
                <div className="text-center">
                  <h3 className="text-lg font-medium uppercase tracking-widest text-brand-900">
                    {value.title}
                  </h3>
                  <p className="mt-4 text-sm leading-relaxed text-brand-500">
                    {value.desc}
                  </p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-2xl px-6 py-24 text-center">
        <AnimatedSection>
          <p className="text-xl font-light uppercase tracking-widest text-brand-700">
            Ready to experience the difference?
          </p>
          <div className="mt-8">
            <Button href="/shop" variant="primary">
              Explore the collection
            </Button>
          </div>
        </AnimatedSection>
      </section>
    </div>
  );
}