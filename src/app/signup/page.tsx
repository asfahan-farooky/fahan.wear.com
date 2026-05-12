"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AnimatedSection from "@/components/AnimatedSection";
import Button from "@/components/Button";

export default function SignupPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return (
    <div className="mx-auto max-w-2xl px-6 py-16 text-center">
      <AnimatedSection>
        <h1 className="mb-4 text-3xl font-light uppercase tracking-[0.3em] text-brand-900">
          Sign In or Create Account
        </h1>
        <p className="text-brand-500">
          You can now sign in with your mobile number. If you don’t have an account yet,
          one will be created automatically.
        </p>
        <div className="mt-8 flex justify-center">
          <Button href="/login">Continue with Mobile</Button>
        </div>
      </AnimatedSection>
    </div>
  );
}

