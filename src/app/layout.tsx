// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { ProductProvider } from "@/context/ProductContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Fahan Wear — Premium Men’s Essentials",
  description: "Refined basics for the modern man.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="flex min-h-screen flex-col">
        <AuthProvider>
          <CartProvider>
            <ProductProvider>
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </ProductProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}