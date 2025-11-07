"use client";

import { useEffect, useState } from "react";
import io from "socket.io-client";

const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000";
let socket: any;

export default function SupplierDashboard() {
  const [auctions, setAuctions] = useState<any[]>([]);
  const [selectedAuction, setSelectedAuction] = useState<any>(null);
  const [bidValue, setBidValue] = useState("");
  const [rank, setRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // 🔌 Initialize Socket.io
  useEffect(() => {
    socket = io(socketUrl);
    socket.on("connect", () => console.log("🟢 Connected to Socket.io"));

    socket.on("ranking_update", (rankings: any[]) => {
      if (selectedAuction) {
        const myRank = rankings.find(
          (r) => r.supplierId === getDecodedUser()?.userId
        );
        setRank(myRank ? myRank.rank : null);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedAuction]);

  const getDecodedUser = () => {
    try {
      if (!token) return null;
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload;
    } catch {
      return null;
    }
  };

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

  const submitBid = async () => {
    if (!selectedAuction) return alert("Select an auction first!");
    if (!bidValue) return alert("Enter your total bid value!");

    const res = await fetch("/api/auctions/bid", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        auctionId: selectedAuction.id,
        totalValue: parseFloat(bidValue),
      }),
    });

    const data = await res.json();

    if (res.ok) {
      alert("Bid submitted successfully!");
      setRank(data.rank);
      // Notify all participants of updated rankings
      socket.emit("update_ranking", selectedAuction.id, data.rankings);
    } else {
      alert(data.error || "Bid submission failed");
    }
  };

  useEffect(() => {
    fetchAuctions();
  }, []);

  return (
    <div className="min-h-screen">
      <h2 className="text-3xl font-bold text-[#2EE59D] mb-6">
        Supplier Dashboard
      </h2>

      {loading ? (
        <p className="text-[#EAEAEA]">Loading live auctions...</p>
      ) : auctions.length === 0 ? (
        <p className="text-[#EAEAEA]">No live auctions available right now.</p>
      ) : (
        <div className="grid gap-4 mb-6">
          {auctions.map((auction) => (
            <div
              key={auction.id}
              onClick={() => {
                setSelectedAuction(auction);
                setRank(null);
                socket.emit("join_auction", auction.id);
              }}
              className={`cursor-pointer p-4 rounded-xl border ${
                selectedAuction?.id === auction.id
                  ? "border-[#FFD700] bg-[#112240]"
                  : "border-[#2EE59D] bg-[#0A192F]"
              } hover:shadow-lg transition`}
            >
              <h4 className="text-lg font-bold text-[#2EE59D]">
                {auction.title}
              </h4>
              <p className="text-sm text-[#EAEAEA]/80">
                Ends: {new Date(auction.endsAt).toLocaleString()}
              </p>
              <p className="text-sm text-[#FFD700] mt-2">
                Items: {auction.items.length}
              </p>
            </div>
          ))}
        </div>
      )}

      {selectedAuction && (
        <div className="bg-[#112240] p-6 rounded-2xl shadow-lg">
          <h3 className="text-2xl font-bold text-[#FFD700] mb-4">
            Place Your Bid
          </h3>
          <p className="text-[#EAEAEA] mb-4">
            Auction: <span className="text-[#2EE59D]">{selectedAuction.title}</span>
          </p>
          <input
            type="number"
            placeholder="Enter total bid value"
            value={bidValue}
            onChange={(e) => setBidValue(e.target.value)}
            className="w-full p-2 mb-4 rounded bg-[#0A192F] border border-[#2EE59D] text-[#EAEAEA]"
          />
          <button
            onClick={submitBid}
            className="bg-[#FFD700] text-[#0A192F] px-6 py-2 rounded-xl font-semibold hover:bg-[#e6c200] transition"
          >
            Submit Bid
          </button>

          {rank && (
            <div className="mt-6 text-xl font-semibold text-[#2EE59D]">
              🏅 Your Current Rank:{" "}
              <span className="text-[#FFD700]">
                {rank === 1 ? "L1 (Lowest)" : `L${rank}`}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

