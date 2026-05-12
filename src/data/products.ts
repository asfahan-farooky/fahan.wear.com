// src/data/products.ts
import { Product } from "@/types";

export const products: Product[] = [
  {
    id: "os-1",
    name: "Boxy Oversized Tee — Washed Black",
    price: 7387,
    category: "men",
    colors: ["Black", "Washed Grey"],
    sizes: ["S", "M", "L", "XL"],
    images: [
      "/products/os-black-1.jpg",
      "/products/os-black-2.jpg",
    ],
    imagesByColor: {
      Black: ["/products/os-black-1.jpg", "/products/os-black-2.jpg"],
      "Washed Grey": ["/products/os-grey-1.jpg", "/products/os-grey-2.jpg"],
    },
    description:
      "Heavyweight 280GSM organic cotton, dropped shoulders, raw hem. The perfect oversized silhouette.",
  },
  {
    id: "bs-1",
    name: "Essential Crew — White",
    price: 5727,
    category: "men",
    colors: ["White", "Beige", "Black"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    images: ["/products/bs-white-1.jpg", "/products/bs-white-2.jpg"],
    imagesByColor: {
      White: ["/products/bs-white-1.jpg", "/products/bs-white-2.jpg"],
      Beige: ["/products/bs-beige-1.jpg", "/products/bs-beige-2.jpg"],
      Black: ["/products/bs-black-1.jpg", "/products/bs-black-2.jpg"],
    },
    description:
      "Midweight 220GSM combed cotton. Clean, timeless, and cut for everyday layering.",
  },
  {
    id: "na-1",
    name: "Relaxed Fit T-Shirt — Sage",
    price: 6557,
    category: "women",
    colors: ["Sage", "Sand"],
    sizes: ["M", "L", "XL"],
    images: ["/products/na-sage-1.jpg", "/products/na-sage-2.jpg"],
    imagesByColor: {
      Sage: ["/products/na-sage-1.jpg", "/products/na-sage-2.jpg"],
      Sand: ["/products/na-sand-1.jpg", "/products/na-sand-2.jpg"],
    },
    description:
      "New season relaxed fit in garment‑dyed organic cotton. Pre‑shrunk and ultra‑soft.",
  },
  {
    id: "os-2",
    name: "Heavy Slub Tee — Bone",
    price: 7885,
    category: "men",
    colors: ["Bone", "Charcoal"],
    sizes: ["S", "M", "L", "XL"],
    images: ["/products/os-bone-1.jpg"],
    imagesByColor: {
      Bone: ["/products/os-bone-1.jpg"],
      Charcoal: ["/products/os-charcoal-1.jpg"],
    },
    description: "Slub cotton with a dry hand feel. Boxy fit, ribbed collar.",
  },
  // Accessories
  {
    id: "acc-1",
    name: "Wireless Earbuds — Black",
    price: 12999,
    category: "accessories",
    colors: ["Black", "White", "Silver"],
    sizes: ["Free Size"],
    images: ["/products/earbuds-black-1.jpg", "/products/earbuds-black-2.jpg"],
    imagesByColor: {
      Black: ["/products/earbuds-black-1.jpg", "/products/earbuds-black-2.jpg"],
      White: ["/products/earbuds-white-1.jpg", "/products/earbuds-white-2.jpg"],
      Silver: ["/products/earbuds-silver-1.jpg", "/products/earbuds-silver-2.jpg"],
    },
    description: "Premium wireless earbuds with active noise cancellation. 30-hour battery life, touch controls, and premium sound quality.",
  },
  {
    id: "acc-2",
    name: "Designer Sunglasses — Aviator",
    price: 8999,
    category: "accessories",
    colors: ["Gold", "Silver", "Black"],
    sizes: ["Free Size"],
    images: ["/products/glasses-aviator-1.jpg", "/products/glasses-aviator-2.jpg"],
    imagesByColor: {
      Gold: ["/products/glasses-aviator-gold-1.jpg", "/products/glasses-aviator-gold-2.jpg"],
      Silver: ["/products/glasses-aviator-silver-1.jpg", "/products/glasses-aviator-silver-2.jpg"],
      Black: ["/products/glasses-aviator-black-1.jpg", "/products/glasses-aviator-black-2.jpg"],
    },
    description: "Classic aviator sunglasses with UV400 protection. Polarized lenses, lightweight titanium frame.",
  },
  {
    id: "acc-3",
    name: "Leather Wallet — Brown",
    price: 4599,
    category: "accessories",
    colors: ["Brown", "Black", "Tan"],
    sizes: ["Free Size"],
    images: ["/products/wallet-brown-1.jpg", "/products/wallet-brown-2.jpg"],
    imagesByColor: {
      Brown: ["/products/wallet-brown-1.jpg", "/products/wallet-brown-2.jpg"],
      Black: ["/products/wallet-black-1.jpg", "/products/wallet-black-2.jpg"],
      Tan: ["/products/wallet-tan-1.jpg", "/products/wallet-tan-2.jpg"],
    },
    description: "Genuine leather bifold wallet. RFID blocking technology, multiple card slots, and coin pocket.",
  },
  // Others
  {
    id: "oth-1",
    name: "Silver Necklace — Minimalist",
    price: 6799,
    category: "others",
    colors: ["Silver", "Gold", "Rose Gold"],
    sizes: ["Free Size"],
    images: ["/products/necklace-silver-1.jpg", "/products/necklace-silver-2.jpg"],
    imagesByColor: {
      Silver: ["/products/necklace-silver-1.jpg", "/products/necklace-silver-2.jpg"],
      Gold: ["/products/necklace-gold-1.jpg", "/products/necklace-gold-2.jpg"],
      "Rose Gold": ["/products/necklace-rosegold-1.jpg", "/products/necklace-rosegold-2.jpg"],
    },
    description: "925 sterling silver necklace with minimalist design. Adjustable chain length, hypoallergenic.",
  },
  {
    id: "oth-2",
    name: "Ceramic Mug — White",
    price: 2499,
    category: "others",
    colors: ["White", "Black", "Blue"],
    sizes: ["Free Size"],
    images: ["/products/mug-white-1.jpg", "/products/mug-white-2.jpg"],
    imagesByColor: {
      White: ["/products/mug-white-1.jpg", "/products/mug-white-2.jpg"],
      Black: ["/products/mug-black-1.jpg", "/products/mug-black-2.jpg"],
      Blue: ["/products/mug-blue-1.jpg", "/products/mug-blue-2.jpg"],
    },
    description: "High-quality ceramic mug with comfortable handle. Microwave and dishwasher safe. 12oz capacity.",
  },
  {
    id: "oth-3",
    name: "Beaded Bracelet — Boho Style",
    price: 3499,
    category: "others",
    colors: ["Multi", "Blue", "Earth Tones"],
    sizes: ["Free Size"],
    images: ["/products/bracelet-multi-1.jpg", "/products/bracelet-multi-2.jpg"],
    imagesByColor: {
      Multi: ["/products/bracelet-multi-1.jpg", "/products/bracelet-multi-2.jpg"],
      Blue: ["/products/bracelet-blue-1.jpg", "/products/bracelet-blue-2.jpg"],
      "Earth Tones": ["/products/bracelet-earth-1.jpg", "/products/bracelet-earth-2.jpg"],
    },
    description: "Handcrafted beaded bracelet with natural stones. Adjustable size, perfect for layering.",
  },
  // … add more as needed
];

export const categories = [
  { name: "Men", slug: "men", image: "/c11.jpg" },
  { name: "Women", slug: "women", image: "/c22.jpg" },
  { name: "Accessories", slug: "accessories", image: "/c33.jpg" },
  { name: "Others", slug: "others", image: "/c44.jpg" },
];