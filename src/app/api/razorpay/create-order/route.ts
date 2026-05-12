// src/app/api/razorpay/create-order/route.ts
import { NextResponse } from "next/server";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: Request) {
  try {
    const { amount, receipt } = await request.json();
    if (!amount || typeof amount !== "number" || amount < 100) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: receipt || `rcpt_${Date.now()}`,
    });

    return NextResponse.json(order);
  } catch (error: any) {
    console.error("Create order error:", error);
    return NextResponse.json(
      { error: "Unable to create order" },
      { status: 500 }
    );
  }
}