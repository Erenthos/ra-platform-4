"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState<"BUYER" | "SUPPLIER" | null>(null);

  // 🔄 Refresh navbar state when route changes
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split(".")[1]));
        if (decoded && decoded.role) {
          setIsLoggedIn(true);
          setRole(decoded.role);
        }
      } catch {
        setIsLoggedIn(false);
        setRole(null);
      }
    } else {
      setIsLoggedIn(false);
      setRole(null);
    }
  }, [pathname]); // ✅ re-run when route changes (fixes Supplier issue)

  const handleLogout = () => {
    localStorage.removeItem("token");
    alert("You have been logged out.");
    setIsLoggedIn(false);
    setRole(null);
    router.push("/");
  };

  return (
    <nav className="bg-[#112240] shadow-md py-3 px-6 flex items-center justify-between">
      <h1
        className="text-2xl font-bold text-[#2EE59D] cursor-pointer hover:text-[#FFD700] transition"
        onClick={() => router.push("/")}
      >
        RA Platform
      </h1>

      <div className="flex gap-4 items-center">
        {!isLoggedIn ? (
          <>
            <button
              onClick={() => router.push("/auth/login")}
              className="text-[#EAEAEA] hover:text-[#FFD700] transition"
            >
              Login
            </button>
            <button
              onClick={() => router.push("/auth/signup")}
              className="text-[#EAEAEA] hover:text-[#FFD700] transition"
            >
              Signup
            </button>
          </>
        ) : (
          <>
            {role === "BUYER" && (
              <button
                onClick={() => router.push("/buyer")}
                className="text-[#EAEAEA] hover:text-[#FFD700] transition"
              >
                Buyer
              </button>
            )}
            {role === "SUPPLIER" && (
              <button
                onClick={() => router.push("/supplier")}
                className="text-[#EAEAEA] hover:text-[#FFD700] transition"
              >
                Supplier
              </button>
            )}
            <button
              onClick={handleLogout}
              className="bg-[#2EE59D] text-[#0A192F] px-4 py-1 rounded-lg font-semibold hover:bg-[#24c68a] transition"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
