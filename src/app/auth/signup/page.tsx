"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "BUYER",
  });
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!form.name || !form.email || !form.password) {
      alert("Please fill all fields.");
      return;
    }
    setLoading(true);

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      localStorage.setItem("token", data.token);
      alert("Signup successful!");
      router.push(form.role === "BUYER" ? "/buyer" : "/supplier");
    } else {
      alert(data.error || "Signup failed");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
      <h1 className="text-3xl md:text-4xl font-bold text-[#2EE59D] mb-4">
        Create Your Account
      </h1>
      <div className="bg-[#112240] p-6 rounded-2xl shadow-lg w-full max-w-md">
        <input
          type="text"
          placeholder="Full Name"
          className="w-full mb-3 p-2 rounded bg-[#0A192F] border border-[#2EE59D] text-[#EAEAEA]"
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          type="email"
          placeholder="Email"
          className="w-full mb-3 p-2 rounded bg-[#0A192F] border border-[#2EE59D] text-[#EAEAEA]"
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full mb-3 p-2 rounded bg-[#0A192F] border border-[#2EE59D] text-[#EAEAEA]"
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        <select
          className="w-full mb-4 p-2 rounded bg-[#0A192F] border border-[#2EE59D] text-[#EAEAEA]"
          onChange={(e) => setForm({ ...form, role: e.target.value })}
        >
          <option value="BUYER">Buyer</option>
          <option value="SUPPLIER">Supplier</option>
        </select>

        <button
          onClick={handleSignup}
          disabled={loading}
          className={`w-full py-2 rounded-xl font-semibold ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-[#2EE59D] text-[#0A192F] hover:bg-[#24c68a]"
          }`}
        >
          {loading ? "Creating account..." : "Sign Up"}
        </button>

        <p className="mt-4 text-sm text-[#EAEAEA]/80">
          Already have an account?{" "}
          <span
            onClick={() => router.push("/auth/login")}
            className="text-[#FFD700] cursor-pointer hover:underline"
          >
            Login here
          </span>
        </p>
      </div>
    </div>
  );
}
