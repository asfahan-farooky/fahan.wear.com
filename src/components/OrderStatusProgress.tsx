"use client";

import type { Order } from "@/types";

type OrderStatusProgressProps = {
  status: Order["status"];
};

const statusSteps = [
  { key: "pending", label: "Order Placed" },
  { key: "shipped", label: "Order Packed" },
  { key: "delivered", label: "Order Received" },
] as const;

const statusStepCount = (status: Order["status"]) => {
  switch (status) {
    case "pending":
      return 1;
    case "shipped":
      return 2;
    case "delivered":
      return 3;
    default:
      return 0;
  }
};

export default function OrderStatusProgress({ status }: OrderStatusProgressProps) {
  const completed = statusStepCount(status);
  const progressWidth = `${(completed / statusSteps.length) * 100}%`;

  return (
    <div className="space-y-4 rounded-3xl border border-brand-grey-100 bg-brand-grey-50 p-5">
      <div className="flex items-center justify-between gap-4 text-sm font-medium uppercase tracking-[0.18em] text-brand-700">
        {statusSteps.map((step, index) => {
          const active = index < completed;
          return (
            <div key={step.key} className="flex-1 text-center">
              <div
                className={`mx-auto mb-2 h-3 w-3 rounded-full ${
                  active ? "bg-green-500" : "bg-brand-grey-200"
                }`}
              />
              <p className={`text-xs ${active ? "text-brand-900" : "text-brand-400"}`}>
                {step.label}
              </p>
            </div>
          );
        })}
      </div>

      <div className="relative h-3 overflow-hidden rounded-full bg-brand-grey-200">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-green-500 transition-all duration-300"
          style={{ width: progressWidth }}
        />
      </div>

      <p className="text-sm text-brand-500">
      {status === "delivered"
        ? "Your order has been received."
        : status === "shipped"
        ? "Your order is packed and on its way."
        : status === "pending"
        ? "Your order has been placed and is being prepared."
        : "Your order has been cancelled."}
    </p>
    </div>
  );
}
