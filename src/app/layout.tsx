// File: src/app/layout.tsx
import "@/styles/globals.css";
import Navbar from "@/app/components/Navbar";
import { ReactNode } from "react";

export const metadata = {
  title: "Reverse Auction Platform",
  description:
    "Real-time Reverse Auction Platform for Buyers and Suppliers — powered by Next.js, Prisma, and NeonDB.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0A192F] text-[#EAEAEA] min-h-screen font-sans flex flex-col">
        {/* 🧭 Global Navigation */}
        <Navbar />

        {/* 🌐 Page Content */}
        <main className="flex-1 p-6 max-w-6xl mx-auto w-full">{children}</main>

        {/* ⚙️ Footer */}
        <footer className="text-center py-4 text-sm opacity-75 border-t border-[#1D3557] mt-8">
          © 2025 Reverse Auction Platform — Built with 💚 using Next.js & Prisma
        </footer>
      </body>
    </html>
  );
}
