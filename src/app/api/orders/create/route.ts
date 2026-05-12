import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import * as admin from "firebase-admin";
import { db, auth } from "@/firebase/server";

const getAdminEmail = () =>
  process.env.ORDER_NOTIFICATION_EMAIL ||
  process.env.ADMIN_EMAIL ||
  process.env.EMAIL_TO;

const getEmailTransporter = () => {
  const host = process.env.EMAIL_SMTP_HOST;
  const port = Number(process.env.EMAIL_SMTP_PORT || "587");
  const user = process.env.EMAIL_SMTP_USER;
  const pass = process.env.EMAIL_SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error(
      "Missing email SMTP configuration. Set EMAIL_SMTP_HOST, EMAIL_SMTP_USER, and EMAIL_SMTP_PASS."
    );
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: process.env.EMAIL_SMTP_SECURE === "true",
    auth: { user, pass },
  });
};

const buildOrderEmailContent = (
  order: any,
  userClaims: any,
  orderId: string
) => {
  const customerName = order.shipping?.fullName || "Unknown";
  const customerPhone = order.shipping?.phone || "Unknown";
  const customerAddress = [
    order.shipping?.address,
    order.shipping?.city,
    order.shipping?.state,
    order.shipping?.zip,
  ]
    .filter(Boolean)
    .join(", ");

  const itemsText = order.items
    .map(
      (item: any, index: number) =>
        `${index + 1}. ${item.name} (${item.productId})\n   Size: ${item.size}, Color: ${item.color}, Quantity: ${item.quantity}, Unit Price: ₹${item.price}, Line Total: ₹${item.price * item.quantity}`
    )
    .join("\n\n");

  const lines: string[] = [
    `Order ID: ${orderId}`,
    `User ID: ${order.userId}`,
    `User Email: ${order.email || "(not available)"}`,
    `Firebase Auth UID: ${userClaims.uid}`,
    `Auth Phone: ${userClaims.phone_number || "(not available)"}`,
    "", 
    "Shipping details:",
    `  Name: ${customerName}`,
    `  Phone: ${customerPhone}`,
    `  Address: ${customerAddress}`,
    "",
    "Payment details:",
    `  Method: ${order.paymentMethod}`,
    `  Status: ${order.paymentStatus}`,
    `  Payment ID: ${order.paymentId || "(none)"}`,
    `  Razorpay Order ID: ${order.razorpayOrderId || "(none)"}`,
    "",
    "Order totals:",
    `  Subtotal: ₹${order.subtotal ?? 0}`,
    `  Shipping charge: ₹${order.shippingCharge ?? 0}`,
    `  Online payment discount: ₹${order.onlinePaymentDiscount ?? 0}`,
    `  First order discount: ₹${order.firstOrderDiscount ?? 0}`,
    `  Discount total: ₹${order.discountTotal ?? 0}`,
    `  Total payable: ₹${order.total ?? 0}`,
    "",
    "Items ordered:",
    itemsText,
    "",
    "Full payload:",
    JSON.stringify(order, null, 2),
  ];

  const subject = `New order received: ${customerName} (${orderId})`;
  const text = lines.join("\n");

  const htmlItems = order.items
    .map(
      (item: any, index: number) =>
        `<li><strong>${index + 1}. ${item.name}</strong><br/>Product ID: ${item.productId}<br/>Size: ${item.size}<br/>Color: ${item.color}<br/>Quantity: ${item.quantity}<br/>Unit Price: ₹${item.price}<br/>Line Total: ₹${item.price * item.quantity}</li>`
    )
    .join("\n");

  const html = `
    <h2>New order received</h2>
    <p><strong>Order ID:</strong> ${orderId}</p>
    <p><strong>User ID:</strong> ${order.userId}</p>
    <p><strong>User Email:</strong> ${order.email || "(not available)"}</p>
    <p><strong>Firebase Auth UID:</strong> ${userClaims.uid}</p>
    <p><strong>Auth Phone:</strong> ${userClaims.phone_number || "(not available)"}</p>
    <h3>Shipping details</h3>
    <p>${customerName}<br/>${customerPhone}<br/>${customerAddress}</p>
    <h3>Payment details</h3>
    <p>Method: ${order.paymentMethod}<br/>Status: ${order.paymentStatus}<br/>Payment ID: ${order.paymentId || "(none)"}<br/>Razorpay Order ID: ${order.razorpayOrderId || "(none)"}</p>
    <h3>Order totals</h3>
    <p>Subtotal: ₹${order.subtotal ?? 0}<br/>Shipping charge: ₹${order.shippingCharge ?? 0}<br/>Online payment discount: ₹${order.onlinePaymentDiscount ?? 0}<br/>First order discount: ₹${order.firstOrderDiscount ?? 0}<br/>Discount total: ₹${order.discountTotal ?? 0}<br/>Total payable: ₹${order.total ?? 0}</p>
    <h3>Items ordered</h3>
    <ul>${htmlItems}</ul>
    <h3>Full payload</h3>
    <pre>${JSON.stringify(order, null, 2)}</pre>
  `;

  return { subject, text, html };
};

const sendOrderNotificationEmail = async (order: any, userClaims: any, orderId: string) => {
  const adminEmail = getAdminEmail();
  if (!adminEmail) {
    throw new Error(
      "Missing notification recipient. Set ORDER_NOTIFICATION_EMAIL, ADMIN_EMAIL, or EMAIL_TO."
    );

  }
  const transporter = getEmailTransporter();
  const emailFrom = process.env.EMAIL_FROM || adminEmail;
  const { subject, text, html } = buildOrderEmailContent(order, userClaims, orderId);

  await transporter.sendMail({
    from: emailFrom,
    to: adminEmail,
    subject,
    text,
    html,
  });
};

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decodedToken = await auth.verifyIdToken(token);
    if (!decodedToken.uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await request.json();
    if (!payload?.shipping || !Array.isArray(payload.items) || payload.items.length === 0) {
      return NextResponse.json(
        { error: "Invalid order payload" },
        { status: 400 }
      );
    }

    const orderData = {
      userId: decodedToken.uid,
      email: decodedToken.email || null,
      shipping: payload.shipping,
      items: payload.items,
      subtotal: Number(payload.subtotal ?? 0),
      shippingCharge: Number(payload.shippingCharge ?? 0),
      onlinePaymentDiscount: Number(payload.onlinePaymentDiscount ?? 0),
      firstOrderDiscount: Number(payload.firstOrderDiscount ?? 0),
      discountTotal: Number(payload.discountTotal ?? 0),
      total: Number(payload.total ?? 0),
      paymentMethod: payload.paymentMethod === "Razorpay" ? "Razorpay" : "COD",
      paymentStatus: payload.paymentStatus === "paid" ? "paid" : "pending",
      paymentId: payload.paymentId || null,
      razorpayOrderId: payload.razorpayOrderId || null,
      status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const orderRef = await db.collection("orders").add(orderData);
    const orderId = orderRef.id;
    await sendOrderNotificationEmail(orderData, decodedToken, orderId);

    return NextResponse.json({ success: true, orderId });
  } catch (error: any) {
    console.error("Order create error:", error);
    return NextResponse.json(
      { error: error.message || "Unable to place order" },
      { status: 500 }
    );
  }
}
