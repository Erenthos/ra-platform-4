"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Please fill all fields.");
      return;
    }
    setLoading(true);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      localStorage.setItem("token", data.token);
      alert("Login successful!");
      router.push(data.user.role === "BUYER" ? "/buyer" : "/supplier");
    } else {
      alert(data.error || "Login failed");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
      <h1 className="text-3xl md:text-4xl font-bold text-[#2EE59D] mb-4">
        Login to Your Account
      </h1>
      <div className="bg-[#112240] p-6 rounded-2xl shadow-lg w-full max-w-md">
        <input
          type="email"
          placeholder="Email"
          className="w-full mb-3 p-2 rounded bg-[#0A192F] border border-[#2EE59D] text-[#EAEAEA]"
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full mb-4 p-2 rounded bg-[#0A192F] border border-[#2EE59D] text-[#EAEAEA]"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          className={`w-full py-2 rounded-xl font-semibold ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-[#2EE59D] text-[#0A192F] hover:bg-[#24c68a]"
          }`}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="mt-4 text-sm text-[#EAEAEA]/80">
          Don’t have an account?{" "}
          <span
            onClick={() => router.push("/auth/signup")}
            className="text-[#FFD700] cursor-pointer hover:underline"
          >
            Sign up
          </span>
        </p>
      </div>
    </div>
  );
}
