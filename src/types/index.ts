// src/types/index.ts
export interface Product {
  id: string;
  name: string;
  price: number;
  category: "men" | "women" | "accessories" | "others";
  colors: string[];
  sizes: string[];
  images: string[];
  imagesByColor?: Record<string, string[]>;
  description: string;
}

export interface CartItem {
  product: Product;
  size: string;
  color: string;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  size: string;
  color: string;
  quantity: number;
  image: string;
}

export interface Order {
  id: string;
  userId: string;
  phone: string;
  shipping: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zip: string;
  };
  items: OrderItem[];
  total: number;
  paymentMethod: "COD" | "Razorpay";
  paymentStatus: "pending" | "paid";
  paymentId?: string;
  createdAt: Date;
  deliveredAt?: Date;
  subtotal?: number;
  shippingCharge?: number;
  onlinePaymentDiscount?: number;
  firstOrderDiscount?: number;
  discountTotal?: number;
  status: "pending" | "shipped" | "delivered" | "cancelled";
  returnStatus?: "none" | "requested" | "approved" | "rejected" | "returned";
  returnReason?: string;
  returnRequestDate?: Date;
  returnApprovedDate?: Date;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number; // 1-5 stars
  title: string;
  comment: string;
  createdAt: Date;
  verified: boolean; // true if user has purchased the product
}

export interface UserProfile {
  uid: string;
  fullName: string;
  phone: string;
  email?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  role?: "user" | "admin";
}
