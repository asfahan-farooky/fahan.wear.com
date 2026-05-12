import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    if (!phone || !/^\d{10}$/.test(phone)) {
      return NextResponse.json(
        { error: "Invalid phone number. Must be 10 digits." },
        { status: 400 }
      );
    }

    // Firebase handles OTP sending on the client side
    // This endpoint serves as a validation endpoint if needed
    return NextResponse.json({
      success: true,
      message: "OTP will be sent via Firebase",
      phone: `+91${phone}`,
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
