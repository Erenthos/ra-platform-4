"use client";

import { useEffect, useState } from "react";
import io from "socket.io-client";

const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000";
let socket: any;

export default function BuyerDashboard() {
  const [auctions, setAuctions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAuction, setSelectedAuction] = useState<any | null>(null);
  const [rankings, setRankings] = useState<any[]>([]);
  const [showRankings, setShowRankings] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    socket = io(socketUrl, { transports: ["websocket"] });
    socket.on("connect", () => console.log("🟢 Connected to Socket.io"));
    socket.on("disconnect", () => console.log("🔴 Disconnected"));

    socket.on("ranking_update", (data: any) => {
      if (selectedAuction && data.auctionId === selectedAuction.id) {
        setRankings(data.rankings || []);
      }
    });

    return () => socket.disconnect();
  }, [selectedAuction]);

  const fetchAuctions = async () => {
    if (!token) return;
    setLoading(true);
    const res = await fetch("/api/auctions/list", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setAuctions(data.auctions || []);
    setLoading(false);
  };

  const viewRankings = async (auction: any) => {
    setSelectedAuction(auction);
    setShowRankings(true);
    socket.emit("join_auction", auction.id);

    const res = await fetch("/api/auctions/bid", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ auctionId: auction.id, itemBids: [] }),
    });
    const data = await res.json();
    if (data.rankings) setRankings(data.rankings);
  };

  const downloadSummary = async (auctionId: string) => {
    const res = await fetch(`/api/auctions/summary?auctionId=${auctionId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      alert("Failed to generate summary");
      return;
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Auction_Summary_${auctionId}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  useEffect(() => {
    fetchAuctions();
  }, []);

  return (
    <div className="min-h-screen">
      <h2 className="text-3xl font-bold text-[#2EE59D] mb-6">Buyer Dashboard</h2>

      {loading ? (
        <p className="text-[#EAEAEA]">Loading auctions...</p>
      ) : auctions.length === 0 ? (
        <p className="text-[#EAEAEA]">No auctions found.</p>
      ) : (
        <div className="grid gap-4">
          {auctions.map((auction) => (
            <div key={auction.id} className="bg-[#112240] p-4 rounded-xl border border-[#2EE59D]">
              <h4 className="text-lg font-bold text-[#2EE59D]">{auction.title}</h4>
              <p className="text-[#EAEAEA]/80">{auction.description}</p>
              <p className="text-sm text-[#FFD700] mt-2">
                Ends: {new Date(auction.endsAt).toLocaleString()}
              </p>

              {new Date(auction.endsAt) > new Date() ? (
                <button
                  onClick={() => viewRankings(auction)}
                  className="mt-3 bg-[#2EE59D] text-[#0A192F] px-4 py-1 rounded-lg font-semibold hover:bg-[#24c68a] transition"
                >
                  View Live Rankings
                </button>
              ) : (
                <button
                  onClick={() => downloadSummary(auction.id)}
                  className="mt-3 bg-[#FFD700] text-[#0A192F] px-4 py-1 rounded-lg font-semibold hover:bg-[#e6c200] transition"
                >
                  Download Summary
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {showRankings && selectedAuction && (
        <div className="mt-8 bg-[#0A192F] p-6 rounded-2xl border border-[#2EE59D]">
          <h3 className="text-2xl font-bold text-[#FFD700] mb-4">
            Live Rankings for {selectedAuction.title}
          </h3>

          {rankings.length === 0 ? (
            <p className="text-[#EAEAEA]">Waiting for bids...</p>
          ) : (
            <table className="w-full border border-[#2EE59D] text-left rounded-lg">
              <thead>
                <tr className="bg-[#112240] text-[#2EE59D]">
                  <th className="p-2">Rank</th>
                  <th className="p-2">Supplier ID</th>
                  <th className="p-2">Total Bid (₹)</th>
                </tr>
              </thead>
              <tbody>
                {rankings.map((r) => (
                  <tr key={r.supplierId} className="border-t border-[#2EE59D]/30">
                    <td className="p-2 text-[#FFD700] font-semibold">
                      {r.rank === 1 ? "L1" : `L${r.rank}`}
                    </td>
                    <td className="p-2 text-[#EAEAEA]">{r.supplierId}</td>
                    <td className="p-2 text-[#EAEAEA]">{r.totalValue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
