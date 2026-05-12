import { NextResponse } from "next/server";
import { db } from "../../../../firebase/server";

export async function POST(request: Request) {
  try {
    const { uid, phone, fullName, isSignup } = await request.json();

    // Validate input
    if (!uid || typeof uid !== "string") {
      console.error("Invalid UID:", uid);
      return NextResponse.json(
        { error: "Invalid user ID" },
        { status: 400 }
      );
    }

    if (!phone || !/^\d{10}$/.test(String(phone).trim())) {
      console.error("Invalid phone format:", phone, "Must be 10 digits");
      return NextResponse.json(
        { error: "Invalid phone number. Must be 10 digits." },
        { status: 400 }
      );
    }

    const normalizedPhone = String(phone).trim();
    const normalizedFullName =
      typeof fullName === "string" && fullName.trim().length >= 2
        ? fullName.trim()
        : null;

    if (isSignup && !normalizedFullName) {
      console.error("Invalid fullName:", fullName);
      return NextResponse.json(
        { error: "Full name is required (at least 2 characters)" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      const userData = userDoc.data();
      console.log("User exists (UID), login success");

      return NextResponse.json({
        success: true,
        message: "Login successful",
        userId: uid,
        user: {
          uid,
          phone: userData?.phone,
          fullName: userData?.fullName,
          role: userData?.role,
        },
      });
    }

    // If the UID doc does not exist, try to recover the user by phone.
    const phoneQuery = await db
      .collection("users")
      .where("phone", "==", normalizedPhone)
      .limit(1)
      .get();

    if (!phoneQuery.empty) {
      const existingDoc = phoneQuery.docs[0];
      const existingData = existingDoc.data();
      const existingUserId = existingDoc.id;

      console.log(
        `User profile found by phone under doc ${existingUserId}. ` +
          `Recovering account for UID ${uid}.
      `
      );

      const recoveredProfile = {
        ...existingData,
        uid,
        phone: normalizedPhone,
        updatedAt: new Date().toISOString(),
      };

      // Keep an accessible record under the current auth UID.
      await db.collection("users").doc(uid).set(recoveredProfile, { merge: true });

      return NextResponse.json({
        success: true,
        message: isSignup
          ? "Account already exists. Logged in successfully."
          : "Login successful",
        userId: uid,
        user: {
          uid,
          phone: normalizedPhone,
          fullName: existingData?.fullName,
          role: existingData?.role,
        },
      });
    }

    // New user, create profile in Firestore
    const newUserId = uid;
    const newUserFullName =
      normalizedFullName || `Customer ${normalizedPhone.slice(-4)}`;

    console.log("Creating new user with ID:", newUserId, "Phone:", normalizedPhone);

    const userData = {
      uid: newUserId,
      phone: normalizedPhone,
      fullName: newUserFullName,
      address: "",
      city: "",
      state: "",
      zip: "",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date().toISOString(),
    };

    // Create the user document
    await db.collection("users").doc(newUserId).set(userData);
    console.log("User created successfully:", newUserId);

    return NextResponse.json({
      success: true,
      message: "Account created successfully",
      userId: newUserId,
      user: {
        uid: newUserId,
        phone: normalizedPhone,
        fullName: newUserFullName,
        role: "user",
      },
    });
  } catch (error: any) {
    console.error("Verify OTP error:", error?.message || error);
    console.error("Stack:", error?.stack);
    return NextResponse.json(
      { error: error?.message || "Server error. Please try again." },
      { status: 500 }
    );
  }
}

