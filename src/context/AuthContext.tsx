"use client";
import { setDoc } from "firebase/firestore";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  signOut,
  onAuthStateChanged,
  signInWithPhoneNumber,
  type User as FirebaseUser,
  type ConfirmationResult,
} from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";
import { auth, db } from "@/firebase/client";
import type { UserProfile } from "@/types";

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  sendOTP: (phone: string, verifier: any) => Promise<ConfirmationResult>;
  verifyOTPAndSignup: (confirmationResult: ConfirmationResult, code: string, fullName: string, phone: string) => Promise<void>;
  verifyOTPAndLogin: (confirmationResult: ConfirmationResult, code: string, phone: string) => Promise<void>;
  checkUserExists: (phone: string) => Promise<boolean>;
  logout: () => Promise<void>;
  saveUserProfile: (profile: Partial<UserProfile>) => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Send OTP to user's phone using Firebase
  const sendOTP = async (phone: string, verifier: any): Promise<ConfirmationResult> => {
    if (!auth) throw new Error("Firebase auth not initialized");

    const phoneNumber = `+91${phone}`;
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, verifier);
    return confirmationResult;
  };

  // Check if user exists by phone using a secure server-side API
  const checkUserExists = async (phone: string): Promise<boolean> => {
    const response = await fetch("/api/auth/check-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });

    if (!response.ok) {
      throw new Error("Unable to check user existence");
    }

    const data = await response.json();
    return data.exists === true;
  };

  // Verify OTP and create account (signup)
  const verifyOTPAndSignup = async (
    confirmationResult: ConfirmationResult,
    code: string,
    fullName: string,
    phone: string
  ) => {
    // Confirm the code with Firebase
    let userCredential;
    try {
      userCredential = await confirmationResult.confirm(code);
    } catch (err: any) {
      throw new Error("Invalid OTP. Please try again.");
    }

    const firebaseUser = userCredential.user;
    console.log("Firebase auth successful. UID:", firebaseUser.uid);

    // Create user profile in Firestore via API
    let response;
    try {
      response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: firebaseUser.uid,
          phone,
          fullName,
          isSignup: true,
        }),
      });
    } catch (err: any) {
      console.error("Network error:", err);
      throw new Error("Network error while creating account. Check your connection.");
    }

    if (!response.ok) {
      let errorMsg = "Account creation failed";
      try {
        const error = await response.json();
        errorMsg = error.error || errorMsg;
      } catch {
        errorMsg = `Server error (${response.status}): Unable to create account`;
      }
      console.error("API error:", response.status, errorMsg);
      throw new Error(errorMsg);
    }

    let data;
    try {
      data = await response.json();
    } catch (err) {
      console.error("Invalid response:", err);
      throw new Error("Server returned invalid data");
    }

    if (!data.userId) {
      console.error("Missing userId in response:", data);
      throw new Error("Account created but data missing. Please sign in again.");
    }

    // Store auth session in localStorage
    localStorage.setItem("authSession", JSON.stringify({
      userId: data.userId,
      phone: data.user.phone,
      fullName: data.user.fullName,
      role: data.user.role,
    }));

    // Set user (userProfile will be set by onSnapshot)
    setUser(firebaseUser);
  };

  // Verify OTP and login
  const verifyOTPAndLogin = async (
    confirmationResult: ConfirmationResult,
    code: string,
    phone: string
  ) => {
    // Confirm the code with Firebase
    const userCredential = await confirmationResult.confirm(code);
    const firebaseUser = userCredential.user;

    // Fetch user profile from Firestore via API
    const response = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid: firebaseUser.uid,
        phone,
        isSignup: false,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Login failed");
    }

    const data = await response.json();

    // Store auth session in localStorage
    localStorage.setItem("authSession", JSON.stringify({
      userId: data.userId,
      phone: data.user.phone,
      fullName: data.user.fullName,
      role: data.user.role,
    }));

    // Set user (userProfile will be set by onSnapshot)
    setUser(firebaseUser);
  };

  // Logout
  const logout = async () => {
    if (!auth) return;
    localStorage.removeItem("authSession");
    localStorage.removeItem("cart"); // Clear cart on logout
    setUserProfile(null);
    setUser(null);
    await signOut(auth);
  };

  // Save user profile
  const saveUserProfile = async (profile: Partial<UserProfile>) => {
    if (!db || !userProfile) return;
    const userRef = doc(db, "users", userProfile.uid);
    await setDoc(userRef, {
      fullName: profile.fullName ?? userProfile.fullName,
      phone: profile.phone ?? userProfile.phone,
      address: profile.address ?? userProfile.address,
      role: profile.role ?? userProfile.role,
    }, { merge: true });

    // Update local state
    setUserProfile(prev => prev ? { ...prev, ...profile } : null);
  };

  // Listen to auth state changes and set up real-time profile listener
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser && db) {
        try {
          // Set up real-time listener for user profile
          const userRef = doc(db, "users", firebaseUser.uid);
          const unsubscribeProfile = onSnapshot(userRef, (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.data();
              let address;
              if (data.address && typeof data.address === 'object' && data.address.street) {
                address = data.address;
              } else if (data.address || data.city || data.state || data.zip) {
                address = {
                  street: data.address || '',
                  city: data.city || '',
                  state: data.state || '',
                  zip: data.zip || '',
                };
              } else {
                address = undefined;
              }
              setUserProfile({
                uid: firebaseUser.uid,
                phone: data.phone ?? "",
                fullName: data.fullName ?? "",
                address,
                role: data.role === "admin" ? "admin" : "user",
              });
            } else {
              setUserProfile(null);
            }
            setLoading(false);
          });

          // Store unsubscribe function to clean up later
          return () => unsubscribeProfile();
        } catch (error) {
          console.error("Failed to set up profile listener:", error);
          setUserProfile(null);
          setLoading(false);
        }
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const isAdmin = userProfile?.role === "admin";

  const value = useMemo(
    () => ({
      user,
      userProfile,
      loading,
      sendOTP,
      verifyOTPAndSignup,
      verifyOTPAndLogin,
      checkUserExists,
      logout,
      saveUserProfile,
      isAdmin,
    }),
    [user, userProfile, loading, isAdmin]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

