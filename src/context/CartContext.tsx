// src/context/CartContext.tsx
"use client";
import React, { createContext, useContext, useReducer, useEffect, ReactNode } from "react";
import { CartItem, Product } from "@/types";

type Action =
  | { type: "ADD_ITEM"; payload: { product: Product; size: string; color: string; quantity: number } }
  | { type: "REMOVE_ITEM"; payload: { productId: string; size: string; color: string } }
  | { type: "UPDATE_QUANTITY"; payload: { productId: string; size: string; color: string; quantity: number } }
  | { type: "CLEAR_CART" };

interface CartState {
  items: CartItem[];
}

const CartContext = createContext<{
  state: CartState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

function cartReducer(state: CartState, action: Action): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.items.find(
        (item) =>
          item.product.id === action.payload.product.id &&
          item.size === action.payload.size &&
          item.color === action.payload.color
      );
      if (existing) {
        return {
          ...state,
          items: state.items.map((item) =>
            item.product.id === action.payload.product.id &&
            item.size === action.payload.size &&
            item.color === action.payload.color
              ? { ...item, quantity: item.quantity + action.payload.quantity }
              : item
          ),
        };
      }
      return {
        ...state,
        items: [
          ...state.items,
          {
            product: action.payload.product,
            size: action.payload.size,
            color: action.payload.color,
            quantity: action.payload.quantity,
          },
        ],
      };
    }
    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter(
          (item) =>
            !(item.product.id === action.payload.productId && 
              item.size === action.payload.size && 
              item.color === action.payload.color)
        ),
      };
    case "UPDATE_QUANTITY":
      if (action.payload.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(
            (item) =>
              !(item.product.id === action.payload.productId && 
                item.size === action.payload.size && 
                item.color === action.payload.color)
          ),
        };
      }
      return {
        ...state,
        items: state.items.map((item) =>
          item.product.id === action.payload.productId &&
          item.size === action.payload.size &&
          item.color === action.payload.color
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
      };
    case "CLEAR_CART":
      return { items: [] };
    default:
      return state;
  }
}

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(
      cartReducer,
      { items: [] },
      (initialState) => {
        if (typeof window !== "undefined") {
          const stored = localStorage.getItem("cart");
          return stored ? JSON.parse(stored) : initialState;
        }
        return initialState;
      }
  );
    useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(state));
  }, [state]);
  return (
    <CartContext.Provider value={{ state, dispatch }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
};