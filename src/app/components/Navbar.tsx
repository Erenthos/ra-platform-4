"use client";

import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token");
    alert("You have been logged out.");
    router.push("/");
  };

  return (
    <nav className="bg-[#112240] shadow-md py-3 px-6 flex items-center justify-between">
      <h1
        className="text-2xl font-bold text-[#2EE59D] cursor-pointer"
        onClick={() => router.push("/")}
      >
        RA Platform
      </h1>

      <div className="flex gap-4">
        <button
          onClick={() => router.push("/buyer")}
          className="text-[#EAEAEA] hover:text-[#FFD700] transition-colors"
        >
          Buyer
        </button>

        <button
          onClick={() => router.push("/supplier")}
          className="text-[#EAEAEA] hover:text-[#FFD700] transition-colors"
        >
          Supplier
        </button>

        <button
          onClick={handleLogout}
          className="bg-[#2EE59D] text-[#0A192F] px-4 py-1 rounded-lg font-semibold hover:bg-[#24c68a] transition"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

