"use client";
import { useState, useEffect } from "react";
import { signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";
import { auth, googleProvider } from "@/utils/firebase";

export default function Auth({ onUserChange }: { onUserChange?: (user: User | null) => void }) {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (onUserChange) onUserChange(currentUser);
        });
        return () => unsubscribe();
    }, [onUserChange]);

    const handleLogin = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error("Login failed", error);
            alert("Login failed. Make sure you have configured Firebase in .env.local");
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    // Styled to fit in the game UI (top right corner)
    return (
        <div style={{ position: "absolute", top: 10, right: 10, zIndex: 100, display: "flex", alignItems: "center", gap: "10px" }}>
            {user ? (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", backgroundColor: "rgba(0, 0, 0, 0.5)", padding: "5px 10px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.2)" }}>
                    {user.photoURL && <img src={user.photoURL} alt="User" style={{ width: 24, height: 24, borderRadius: "50%" }} />}
                    <span style={{ color: "white", fontSize: "12px", fontFamily: "Arial, sans-serif" }}>{user.displayName?.split(" ")[0]}</span>
                    <button
                        onClick={handleLogout}
                        style={{
                            padding: "3px 8px",
                            background: "rgba(255, 50, 50, 0.8)",
                            border: "none",
                            color: "white",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "10px"
                        }}>
                        Logout
                    </button>
                </div>
            ) : (
                <button
                    onClick={handleLogin}
                    style={{
                        padding: "8px 12px",
                        background: "#4285f4",
                        border: "none",
                        color: "white",
                        borderRadius: "5px",
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.3)"
                    }}>
                    <span style={{ background: "white", color: "#4285f4", borderRadius: "2px", width: "16px", height: "16px", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "14px", fontWeight: "bold" }}>G</span>
                    Sign in
                </button>
            )}
        </div>
    );
}
