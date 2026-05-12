// src/components/Button.tsx
import Link from "next/link";
import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  href?: string;
  variant?: "primary" | "secondary" | "outline";
}

export default function Button({
  href,
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center px-8 py-3 text-sm uppercase tracking-widest transition-colors duration-200 focus:outline-none";

  const variants = {
    primary:
      "bg-brand-grey-900 text-brand-white hover:bg-brand-grey-700",

    secondary:
      "bg-brand-beige text-brand-grey-900 hover:bg-brand-grey-200",

    outline:
      "border border-brand-grey-900 text-brand-grey-900 hover:bg-brand-grey-900 hover:text-brand-white",
  };

  if (href) {
    return (
      <Link href={href} className={`${base} ${variants[variant]} ${className}`}>
        {children}
      </Link>
    );
  }

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}