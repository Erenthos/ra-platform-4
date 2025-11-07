// File: src/app/supplier/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";

const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000";

export default function SupplierDashboard() {
  const [auctions, setAuctions] = useState<any[]>([]);
  const [selectedAuction, setSelectedAuction] = useState<any | null>(null);
  const [itemBids, setItemBids] = useState<any[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [rank, setRank] = useState<number | null>(null);
  const [rankings, setRankings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const socketRef = useRef<Socket | null>(null);
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const getDecodedUser = () => {
    try {
      if (!token) return null;
      return JSON.parse(atob(token.split(".")[1]));
    } catch {
      return null;
    }
  };

  // initialize socket once
  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io(socketUrl, { transports: ["websocket"] });

      socketRef.current.on("connect", () => console.log("Socket connected:", socketRef.current?.id));
      socketRef.current.on("disconnect", () => console.log("Socket disconnected"));
      // receive ranking_update for any auction; we'll pick the right one if it matches selectedAuction
      socketRef.current.on("ranking_update", (payload: any) => {
        if (!payload || !payload.auctionId) return;
        // update local rankings if matches selected auction
        if (selectedAuction && payload.auctionId === selectedAuction.id) {
          setRankings(payload.rankings || []);
          const myRank = (payload.rankings || []).find((r: any) => r.supplierId === getDecodedUser()?.userId);
          setRank(myRank ? myRank.rank : null);
        }
      });
    }

    return () => {
      // don't disconnect on unmount to keep socket alive across navigations if you want;
      // but to avoid resource leaks on full page unload, disconnect:
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once

  // fetch auctions
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

  // select auction: join room, initialize item bids, fetch current rankings so rank persists after refresh
  const selectAuction = async (auction: any) => {
    setSelectedAuction(auction);
    setRank(null);
    setRankings([]);
    setTotalValue(0);

    // join room
    socketRef.current?.emit("join_auction", auction.id);

    // prepare itemBids scaffold
    const scaffold = auction.items.map((it: any) => ({
      itemId: it.id,
      name: it.name,
      quantity: it.quantity,
      uom: it.uom,
      rate: "",
    }));
    setItemBids(scaffold);

    // fetch current rankings from backend (call bid POST with empty itemBids to fetch rankings)
    const res = await fetch("/api/auctions/bid", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ auctionId: auction.id, itemBids: [] }),
    });
    const json = await res.json().catch(() => null);
    if (json?.rankings) {
      setRankings(json.rankings);
      const myRank = json.rankings.find((r: any) => r.supplierId === getDecodedUser()?.userId);
      setRank(myRank ? myRank.rank : null);
    } else {
      setRank(null);
    }
  };

  // handle per-item rate change
  const handleRateChange = (index: number, rate: string) => {
    const copy = [...itemBids];
    copy[index].rate = rate;
    setItemBids(copy);
    const total = copy.reduce((sum, it) => {
      const q = parseFloat(it.quantity) || 0;
      const r = parseFloat(it.rate) || 0;
      return sum + q * r;
    }, 0);
    setTotalValue(total);
  };

  // submit item-wise bids -> backend computes total, upserts and emits ranking update
  const submitBid = async () => {
    if (!selectedAuction) return alert("Select an auction first");
    if (!token) return alert("Not authorized");

    const payload = {
      auctionId: selectedAuction.id,
      itemBids: itemBids.map((i) => ({ itemId: i.itemId, rate: parseFloat(i.rate || 0) })),
    };

    const res = await fetch("/api/auctions/bid", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const json = await res.json().catch(() => null);
    if (res.ok && json) {
      // update local rank and rankings (server already emitted - but we also update local immediately)
      if (json.rankings) {
        setRankings(json.rankings);
        const myRank = json.rankings.find((r: any) => r.supplierId === getDecodedUser()?.userId);
        setRank(myRank ? myRank.rank : null);
      } else if (typeof json.rank === "number") {
        setRank(json.rank);
      }

      // server emits ranking_update to room; still safe to emit here to ensure propagation
      socketRef.current?.emit("update_ranking", selectedAuction.id, { auctionId: selectedAuction.id, rankings: json.rankings || [] });

      alert("Bid submitted");
    } else {
      alert(json?.error || "Bid failed");
    }
  };

  // fallback polling to refresh auctions list & rankings (every 10s)
  useEffect(() => {
    fetchAuctions();
    const iv = setInterval(fetchAuctions, 10000);
    return () => clearInterval(iv);
  }, []);

  // sticky rank bar UI (always at top of the supplier page)
  const RankBar = () => (
    <div className="fixed top-16 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div className="pointer-events-auto bg-[#112240] border border-[#2EE59D] text-[#EAEAEA] px-4 py-2 rounded-b-lg shadow-lg">
        <span className="font-semibold text-sm mr-3">Your Current Rank</span>
        {selectedAuction ? (
          rank ? (
            <span className="text-[#FFD700] font-bold text-lg">{rank === 1 ? "L1 (Lowest)" : `L${rank}`}</span>
          ) : (
            <span className="text-[#EAEAEA]/80">No bids yet</span>
          )
        ) : (
          <span className="text-[#EAEAEA]/80">Select an auction</span>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-20">
      {/* Sticky rank bar */}
      <RankBar />

      <div className="pt-28"> {/* push down content to make space for sticky bar */}
        <h2 className="text-3xl font-bold text-[#2EE59D] mb-6">Supplier Dashboard</h2>

        {loading ? (
          <p className="text-[#EAEAEA]">Loading live auctions...</p>
        ) : auctions.length === 0 ? (
          <p className="text-[#EAEAEA]">No live auctions available right now.</p>
        ) : (
          <div className="grid gap-4 mb-6">
            {auctions.map((auction) => (
              <div
                key={auction.id}
                onClick={() => selectAuction(auction)}
                className={`cursor-pointer p-4 rounded-xl border ${
                  selectedAuction?.id === auction.id ? "border-[#FFD700] bg-[#112240]" : "border-[#2EE59D] bg-[#0A192F]"
                } hover:shadow-lg transition`}
              >
                <h4 className="text-lg font-bold text-[#2EE59D]">{auction.title}</h4>
                <p className="text-sm text-[#EAEAEA]/80">Ends: {new Date(auction.endsAt).toLocaleString()}</p>
                <p className="text-sm text-[#FFD700] mt-2">Items: {auction.items.length}</p>
              </div>
            ))}
          </div>
        )}

        {selectedAuction && (
          <div className="bg-[#112240] p-6 rounded-2xl shadow-lg">
            <h3 className="text-2xl font-bold text-[#FFD700] mb-4">{selectedAuction.title}</h3>
            <p className="text-[#EAEAEA] mb-3">{selectedAuction.description}</p>

            <table className="w-full mb-4 border border-[#2EE59D] rounded-xl text-left">
              <thead>
                <tr className="bg-[#0A192F] text-[#2EE59D]">
                  <th className="p-2">Item</th>
                  <th className="p-2">Qty</th>
                  <th className="p-2">UOM</th>
                  <th className="p-2">Your Rate</th>
                  <th className="p-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                {itemBids.map((item, i) => (
                  <tr key={item.itemId} className="border-t border-[#2EE59D]/30">
                    <td className="p-2 text-[#EAEAEA]">{item.name}</td>
                    <td className="p-2 text-[#EAEAEA]/80">{item.quantity}</td>
                    <td className="p-2 text-[#EAEAEA]/80">{item.uom}</td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={item.rate}
                        placeholder="Rate"
                        onChange={(e) => handleRateChange(i, e.target.value)}
                        className="w-24 p-1 rounded bg-[#0A192F] border border-[#2EE59D] text-[#EAEAEA]"
                      />
                    </td>
                    <td className="p-2 text-[#FFD700]">
                      {((parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0)).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="text-right text-[#FFD700] font-semibold mb-4">Total Bid Value: ₹{totalValue.toFixed(2)}</div>

            <div className="flex gap-3">
              <button onClick={submitBid} className="bg-[#2EE59D] text-[#0A192F] px-6 py-2 rounded-xl font-semibold hover:bg-[#24c68a] transition">Submit Bid</button>
            </div>

            {/* Optionally show the full ranking list */}
            {rankings.length > 0 && (
              <div className="mt-6">
                <h4 className="text-lg font-semibold text-[#FFD700] mb-2">Live Rankings</h4>
                <ul className="space-y-2">
                  {rankings.map((r: any) => (
                    <li key={r.supplierId} className={`flex justify-between p-2 rounded ${r.supplierId === getDecodedUser()?.userId ? "bg-[#2EE59D]/20 border border-[#2EE59D]" : "bg-[#0A192F]"}`}>
                      <span className="text-[#EAEAEA]">Supplier {r.rank}</span>
                      <span className="text-[#FFD700]">{r.rank === 1 ? "L1" : `L${r.rank}`}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
