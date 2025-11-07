import "./styles/globals.css";
import { ReactNode } from "react";

export const metadata = {
  title: "Reverse Auction Platform",
  description: "Real-time reverse auction system for buyers and suppliers",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0A192F] text-[#EAEAEA] min-h-screen font-sans">
        <header className="p-4 bg-[#112240] shadow-md flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#2EE59D]">
            Reverse Auction Platform
          </h1>
          <nav>
            <a
              href="/buyer"
              className="mx-2 hover:text-[#FFD700] transition-colors"
            >
              Buyer
            </a>
            <a
              href="/supplier"
              className="mx-2 hover:text-[#FFD700] transition-colors"
            >
              Supplier
            </a>
          </nav>
        </header>

        <main className="p-6 max-w-6xl mx-auto">{children}</main>

        <footer className="text-center py-4 text-sm opacity-75 border-t border-[#1D3557] mt-8">
          © 2025 Reverse Auction Platform. All rights reserved.
        </footer>
      </body>
    </html>
  );
}

