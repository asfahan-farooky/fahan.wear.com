// src/app/shop/page.tsx
import { Suspense } from "react";
import ShopPage from "./ShopPage";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ShopPage />
    </Suspense>
  );
}