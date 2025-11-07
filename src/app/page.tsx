"use client";

import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
      <h1 className="text-4xl md:text-5xl font-bold text-[#2EE59D] mb-4">
        Welcome to Reverse Auction Platform
      </h1>
      <p className="text-[#EAEAEA] text-lg mb-8 max-w-2xl">
        Empowering buyers and suppliers with real-time, transparent reverse
        auctions. Compete smartly — rank instantly — and win efficiently.
      </p>

      <div className="flex gap-6">
        <button
          onClick={() => router.push("/buyer")}
          className="px-8 py-3 rounded-2xl bg-[#2EE59D] text-[#0A192F] font-semibold text-lg hover:bg-[#24c68a] transition-all"
        >
          Buyer Dashboard
        </button>

        <button
          onClick={() => router.push("/supplier")}
          className="px-8 py-3 rounded-2xl bg-[#FFD700] text-[#0A192F] font-semibold text-lg hover:bg-[#e6c200] transition-all"
        >
          Supplier Dashboard
        </button>
      </div>

      <p className="mt-10 text-sm opacity-70">
        © 2025 Reverse Auction Platform | Built with ❤️ for real-time trade
      </p>
    </div>
  );
}

