"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { collection, doc, deleteDoc, onSnapshot, setDoc, writeBatch } from "firebase/firestore";
import { db } from "@/firebase/client";
import { Product } from "@/types";
import { categories as productCategories, products as initialProducts } from "@/data/products";

interface ProductContextType {
  products: Product[];
  categories: { name: string; slug: string; image: string }[];
  loading: boolean;
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  removeProduct: (productId: string) => Promise<void>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) {
      setProducts(initialProducts);
      setLoading(false);
      return;
    }

    const firestore = db;
    const productsCollection = collection(firestore, "products");

    const unsubscribe = onSnapshot(
  productsCollection,
  (snapshot) => {
    if (snapshot.empty) {
      // ❌ NO AUTO SEED
      setProducts(initialProducts); // fallback only
      setLoading(false);
      return;
    }

    setProducts(
      snapshot.docs.map((docSnapshot) => docSnapshot.data() as Product)
    );
    setLoading(false);
  },
  (error) => {
    console.warn("Firebase products failed to load:", error);
    setProducts(initialProducts);
    setLoading(false);
  }
);

    return () => unsubscribe();
  }, []);

  const addProduct = async (product: Product) => {
    if (!db) throw new Error("Firestore is not initialized.");
    await setDoc(doc(db, "products", product.id), product);
  };

  const updateProduct = async (product: Product) => {
    if (!db) throw new Error("Firestore is not initialized.");
    await setDoc(doc(db, "products", product.id), product, { merge: true });
  };

  const removeProduct = async (productId: string) => {
    if (!db) throw new Error("Firestore is not initialized.");
    await deleteDoc(doc(db, "products", productId));
  };

  const value = useMemo(
    () => ({ products, categories: productCategories, loading, addProduct, updateProduct, removeProduct }),
    [products, loading]
  );

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error("useProducts must be used within ProductProvider");
  }
  return context;
};
