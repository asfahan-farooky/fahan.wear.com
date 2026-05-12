import { NextRequest, NextResponse } from "next/server";
import { db } from "@/firebase/server";

export async function POST(request: NextRequest) {
  try {
    const { orderId, userId, reason } = await request.json();

    if (!orderId || !userId || !reason) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!db) {
      return NextResponse.json(
        { message: "Database not available" },
        { status: 500 }
      );
    }

    // Get the order
    const orderRef = db.collection("orders").doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return NextResponse.json(
        { message: "Order not found" },
        { status: 404 }
      );
    }

    const order = orderSnap.data();

    // Verify the order belongs to the user
    if (order?.userId !== userId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 403 }
      );
    }

    // Check if order is eligible for return (must be delivered)
    if (order?.status !== "delivered") {
      return NextResponse.json(
        { message: "This order is not eligible for return" },
        { status: 400 }
      );
    }

    // Determine the delivery date (use deliveredAt when available)
    const deliveredTimestamp = order?.deliveredAt || order?.createdAt;
    const deliveredDate = deliveredTimestamp?.toDate
      ? deliveredTimestamp.toDate()
      : new Date(deliveredTimestamp);
    if (Number.isNaN(deliveredDate.getTime())) {
      return NextResponse.json(
        { message: "Unable to determine delivery date for this order." },
        { status: 400 }
      );
    }

    const today = new Date();
    const daysDifference = Math.floor(
      (today.getTime() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDifference > 7) {
      return NextResponse.json(
        {
          message:
            "Return window has expired. Returns are only allowed within 7 days of delivery.",
        },
        { status: 400 }
      );
    }

    // Check if already has a pending or approved return request
    if (order?.returnStatus && order.returnStatus !== "none") {
      return NextResponse.json(
        { message: "This order already has a return request" },
        { status: 400 }
      );
    }

    // Update the order with return request
    await orderRef.update({
      returnStatus: "requested",
      returnReason: reason,
      returnRequestDate: new Date(),
    });

    return NextResponse.json(
      { message: "Return request submitted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing return request:", error);
    return NextResponse.json(
      { message: "An error occurred while processing your return request" },
      { status: 500 }
    );
  }
}
