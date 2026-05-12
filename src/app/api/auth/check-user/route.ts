import { NextResponse } from "next/server";
import { db } from "../../../../firebase/server";

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    if (!phone || !/^\d{10}$/.test(phone)) {
      return NextResponse.json(
        { error: "Invalid phone number" },
        { status: 400 }
      );
    }

    // Check if user exists
    const usersSnapshot = await db
      .collection("users")
      .where("phone", "==", phone)
      .limit(1)
      .get();

    const exists = !usersSnapshot.empty;

    return NextResponse.json({ exists });
  } catch (error) {
    console.error("Check user error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
