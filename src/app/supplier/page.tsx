"use client";

import { useEffect, useState } from "react";
import io from "socket.io-client";

const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000";
let socket: any;

export default function SupplierDashboard() {
  const [auctions, setAuctions] = useState<any[]>([]);
  const [selectedAuction, setSelectedAuction] = useState<any>(null);
  const [itemBids, setItemBids] = useState<any[]>([]);
  const [rank, setRank] = useState<number | null>(null);
  const [totalValue, setTotalValue] = useState(0);
  const [loading, setLoading] = useState(true);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

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
    return () => socket.disconnect();
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

  const selectAuction = (auction: any) => {
    setSelectedAuction(auction);
    socket.emit("join_auction", auction.id);
    setItemBids(
      auction.items.map((item: any) => ({
        itemId: item.id,
        name: item.name,
        quantity: item.quantity,
        uom: item.uom,
        rate: "",
      }))
    );
    setRank(null);
    setTotalValue(0);
  };

  const handleRateChange = (index: number, rate: string) => {
    const updated = [...itemBids];
    updated[index].rate = rate;
    setItemBids(updated);

    // auto-calc total
    const total = updated.reduce((sum, item) => {
      const q = parseFloat(item.quantity) || 0;
      const r = parseFloat(item.rate) || 0;
      return sum + q * r;
    }, 0);
    setTotalValue(total);
  };

  const submitBid = async () => {
    if (!selectedAuction) return alert("Select an auction first!");
    const res = await fetch("/api/auctions/bid", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        auctionId: selectedAuction.id,
        itemBids: itemBids.map((i) => ({
          itemId: i.itemId,
          rate: parseFloat(i.rate || 0),
        })),
      }),
    });

    const data = await res.json();

    if (res.ok) {
      alert("Bid submitted successfully!");
      setRank(data.rank);
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
              onClick={() => selectAuction(auction)}
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
            {selectedAuction.title}
          </h3>
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
                      onChange={(e) =>
                        handleRateChange(i, e.target.value)
                      }
                      className="w-24 p-1 rounded bg-[#0A192F] border border-[#2EE59D] text-[#EAEAEA]"
                    />
                  </td>
                  <td className="p-2 text-[#FFD700]">
                    {(
                      (parseFloat(item.quantity) || 0) *
                      (parseFloat(item.rate) || 0)
                    ).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="text-right text-[#FFD700] font-semibold mb-4">
            Total Bid Value: ₹{totalValue.toFixed(2)}
          </div>

          <button
            onClick={submitBid}
            className="bg-[#2EE59D] text-[#0A192F] px-6 py-2 rounded-xl font-semibold hover:bg-[#24c68a] transition"
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
