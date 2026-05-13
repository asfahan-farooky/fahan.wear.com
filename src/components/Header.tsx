"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/firebase/client";
import { Order } from "@/types";
import { ShoppingBag, Menu, X, ChevronDown, Search } from "lucide-react";
import Image from "next/image";

export default function Header() {
  const { state } = useCart();
  const itemCount = state.items.reduce((sum, i) => sum + i.quantity, 0);

  const { user, logout } = useAuth();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!user || !db) return;

    const q = query(
      collection(db, "orders"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData: Order[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Order[];
      setRecentOrders(ordersData);
    });

    return unsubscribe;
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ordersOpen && !(event.target as Element).closest('.orders-dropdown')) {
        setOrdersOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [ordersOpen]);

  return (
    <>
    <header className="sticky top-0 z-50 bg-transparent backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

        {/* LEFT: LOGO */}
        <Link href="/" className="flex items-center h-12 overflow-hidden">
  <Image
    src="/logo2.png"
    alt="Logo"
    width={200}
    height={80}
    className="h-full w-auto object-cover scale-110"
    priority
  />
</Link>

        {/* RIGHT: MOBILE + DESKTOP */}
        <div className="flex items-center gap-4">

          {/* 🛒 CART (ALWAYS VISIBLE) */}
          <Link href="/cart" className="relative">
            <ShoppingBag size={20} />
            {mounted && state.items.length > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-black text-white text-xs">
                {state.items.length}
              </span>
            )}
          </Link>

          {/* 🔍 SEARCH */}
          <button onClick={() => setSearchOpen(!searchOpen)} className="relative">
            <Search size={20} />
          </button>

          {/* 🍔 HAMBURGER (MOBILE ONLY) */}
          <button
            onClick={() => setIsOpen(true)}
            className="lg:hidden"
          >
            <Menu size={24} />
          </button>

          {/* 🖥️ DESKTOP NAV */}
          <nav className="hidden lg:flex items-center gap-8 text-[13px] uppercase tracking-[0.2em] text-neutral-600">
            <Link href="/shop" className="hover:text-black transition">
              Shop
            </Link>

            {user ? (
              <>
                {/* Orders Dropdown */}
                <div className="relative orders-dropdown">
                  <button
                    onClick={() => setOrdersOpen(!ordersOpen)}
                    className="flex items-center gap-1 hover:text-black transition"
                  >
                    Orders
                    <ChevronDown size={12} />
                  </button>
                  {ordersOpen && (
                    <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-neutral-200 rounded-lg shadow-lg z-50">
                      <div className="p-4">
                        <h3 className="text-sm font-medium mb-3">Recent Orders</h3>
                        {recentOrders.length === 0 ? (
                          <p className="text-xs text-neutral-500">No orders yet</p>
                        ) : (
                          <div className="space-y-3 max-h-60 overflow-y-auto">
                            {recentOrders.map((order) => (
                              <div key={order.id} className="border-b border-neutral-100 pb-2 last:border-b-0">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="text-xs font-medium">
                                      #{order.id.slice(-8).toUpperCase()}
                                    </p>
                                    <p className="text-xs text-neutral-500">
                                      {order.createdAt.toLocaleDateString()}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-medium">₹{order.total.toFixed(2)}</p>
                                    <p className="text-xs text-neutral-500">{order.status}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <Link
                          href="/profile"
                          className="block text-center text-xs text-blue-600 hover:text-blue-800 mt-3"
                          onClick={() => setOrdersOpen(false)}
                        >
                          View all orders
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                <Link href="/profile" className="hover:text-black transition">
                  Account
                </Link>

                <button onClick={logout} className="hover:text-black transition">
                  Sign Out
                </button>
              </>
            ) : (
              <Link href="/login" className="hover:text-black transition">
                Login
              </Link>
            )}
          </nav>
        </div>
      </div>

      {/* 📱 MOBILE DRAWER */}
        {isOpen && (
          <div className="fixed inset-0 z-[9999]">

            {/* 🔲 OVERLAY */}
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setIsOpen(false)}
            />

            {/* 📦 SIDEBAR */}
            <div className="absolute right-0 top-0 h-screen w-64 bg-white p-6 shadow-2xl flex flex-col">

              {/* TOP CONTENT */}
              <div>

                {/* ❌ CLOSE BUTTON */}
                <div className="flex justify-end mb-8">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-black"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* 📑 MENU */}
                <nav className="flex flex-col gap-6 text-sm uppercase tracking-wider">

                  <Link href="/shop" onClick={() => setIsOpen(false)}>
                    Shop
                  </Link>

                  {user ? (
                    <>
                      <Link href="/profile" onClick={() => setIsOpen(false)}>
                        Account
                      </Link>

                      <Link href="/profile#orders" onClick={() => setIsOpen(false)}>
                        Order History
                      </Link>
                    </>
                  ) : (
                    <Link href="/login" onClick={() => setIsOpen(false)}>
                      Login
                    </Link>
                  )}

                </nav>
              </div>

              {/* 🚪 SIGN OUT */}
              {user && (
                <button
                  onClick={() => {
                    logout();
                    setIsOpen(false);
                  }}
                  className="mt-auto border-t pt-4 text-left text-sm uppercase tracking-wider text-red-500 hover:text-red-700"
                >
                  Sign Out
                </button>
              )}

            </div>
          </div>
        )}
    </header>

    {/* 🔍 SEARCH BAR */}
    {searchOpen && (
  <div className="border-b border-neutral-200 bg-white/95 backdrop-blur-md shadow-sm">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
      
      <div className="flex items-center gap-2 sm:gap-3">
        
        {/* Search Input */}
        <div className="relative flex-1">
          
          {/* Search Icon Inside Input */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>

          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                router.push(`/shop?search=${encodeURIComponent(searchTerm)}`);
                setSearchOpen(false);
                setSearchTerm("");
              }
            }}
            className="w-full h-12 pl-12 pr-4 rounded-2xl border border-neutral-300 bg-neutral-50 focus:bg-white focus:border-black focus:ring-4 focus:ring-black/10 outline-none transition-all duration-200"
          />
        </div>

        {/* Search Button */}
        <button
          onClick={() => {
            router.push(`/shop?search=${encodeURIComponent(searchTerm)}`);
            setSearchOpen(false);
            setSearchTerm("");
          }}
          className="h-12 w-12 rounded-2xl bg-black text-white flex items-center justify-center hover:bg-neutral-800 active:scale-95 transition-all duration-200 shadow-md"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>

        {/* Cancel Button */}
        <button
          onClick={() => {
            setSearchOpen(false);
            setSearchTerm("");
          }}
          className="h-12 w-12 rounded-2xl border border-neutral-300 flex items-center justify-center text-neutral-500 hover:text-black hover:border-black hover:bg-neutral-100 transition-all duration-200"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

      </div>
    </div>
  </div>
)}
    </>
  );
}