"use client";

import { useEffect, useState } from "react";
import io from "socket.io-client";

const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000";
let socket: any;

type Theme = "neon" | "dark" | "light";

export default function BuyerDashboard() {
  const [auctions, setAuctions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAuction, setSelectedAuction] = useState<any | null>(null);
  const [rankings, setRankings] = useState<any[]>([]);
  const [showRankings, setShowRankings] = useState(false);
  const [theme, setTheme] = useState<Theme>(
    (typeof window !== "undefined" && (localStorage.getItem("theme") as Theme)) || "neon"
  );

  const [newAuction, setNewAuction] = useState({
    title: "",
    description: "",
    duration: 10,
    items: [{ name: "", quantity: "", uom: "" }],
  });

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // Apply theme dynamically to body
  useEffect(() => {
    document.body.classList.remove("theme-neon", "theme-dark", "theme-light");
    document.body.classList.add(`theme-${theme}`);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Socket connection
  useEffect(() => {
    socket = io(socketUrl, { transports: ["websocket"] });

    socket.on("connect", () => console.log("🟢 Socket Connected"));
    socket.on("disconnect", () => console.log("🔴 Socket Disconnected"));

    // Receive ranking updates in real time
    socket.on("ranking_update", (data: any) => {
      if (selectedAuction && data.auctionId === selectedAuction.id) {
        setRankings(data.rankings || []);
      }
    });

    return () => socket.disconnect();
  }, [selectedAuction]);

  // Fetch auctions
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

  useEffect(() => {
    fetchAuctions();
  }, []);

  // Create auction
  const handleCreateAuction = async () => {
    if (!newAuction.title || newAuction.items.some((i) => !i.name)) {
      alert("Please fill in title and item details");
      return;
    }

    const res = await fetch("/api/auctions/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(newAuction),
    });

    const data = await res.json();

    if (res.ok) {
      alert("Auction created successfully!");
      setAuctions((prev) => [data.auction, ...prev]);
      socket.emit("new_auction", data.auction);
      setNewAuction({
        title: "",
        description: "",
        duration: 10,
        items: [{ name: "", quantity: "", uom: "" }],
      });
    } else {
      alert(data.error || "Failed to create auction");
    }
  };

  // Add item
  const addItemRow = () =>
    setNewAuction({
      ...newAuction,
      items: [...newAuction.items, { name: "", quantity: "", uom: "" }],
    });

  const handleItemChange = (
    i: number,
    key: "name" | "quantity" | "uom",
    value: string
  ) => {
    const updated = [...newAuction.items];
    updated[i][key] = value;
    setNewAuction({ ...newAuction, items: updated });
  };

  // View rankings
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
    if (data.rankings && data.rankings.length > 0) {
      setRankings(data.rankings);
    } else {
      setRankings([]);
    }
  };

  // Download summary
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
    a.click();
  };

  // Toggle between 3 themes
  const cycleTheme = () => {
    setTheme((prev) =>
      prev === "neon" ? "dark" : prev === "dark" ? "light" : "neon"
    );
  };

  return (
    <div className="min-h-screen transition-all duration-300">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-primary">Buyer Dashboard</h2>

        <button
          onClick={cycleTheme}
          className="bg-primary text-bg px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition"
        >
          Switch Theme ({theme.toUpperCase()})
        </button>
      </div>

      {/* =============== Create New Auction =============== */}
      <div className="bg-card p-6 rounded-2xl mb-8 border border-primary shadow-lg">
        <h3 className="text-xl font-bold text-accent mb-3">Create New Auction</h3>

        <div className="grid gap-3 mb-3">
          <input
            type="text"
            placeholder="Auction Title"
            value={newAuction.title}
            onChange={(e) =>
              setNewAuction({ ...newAuction, title: e.target.value })
            }
            className="p-2 rounded bg-input border border-primary text-text"
          />

          <textarea
            placeholder="Description"
            value={newAuction.description}
            onChange={(e) =>
              setNewAuction({ ...newAuction, description: e.target.value })
            }
            className="p-2 rounded bg-input border border-primary text-text"
          />

          <div className="flex gap-4 items-center">
            <label className="text-text">Duration (minutes):</label>
            <input
              type="number"
              min="1"
              value={newAuction.duration}
              onChange={(e) =>
                setNewAuction({
                  ...newAuction,
                  duration: parseInt(e.target.value),
                })
              }
              className="p-1 w-24 rounded bg-input border border-primary text-text"
            />
          </div>

          <h4 className="text-accent mt-3 font-semibold">Auction Items</h4>
          {newAuction.items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Item Name"
                value={item.name}
                onChange={(e) => handleItemChange(idx, "name", e.target.value)}
                className="p-2 rounded bg-input border border-primary text-text"
              />
              <input
                type="number"
                placeholder="Qty"
                value={item.quantity}
                onChange={(e) =>
                  handleItemChange(idx, "quantity", e.target.value)
                }
                className="p-2 rounded bg-input border border-primary text-text"
              />
              <input
                type="text"
                placeholder="UOM"
                value={item.uom}
                onChange={(e) => handleItemChange(idx, "uom", e.target.value)}
                className="p-2 rounded bg-input border border-primary text-text"
              />
            </div>
          ))}

          <button
            onClick={addItemRow}
            className="mt-2 w-fit bg-primary text-bg px-4 py-1 rounded font-semibold hover:opacity-80 transition"
          >
            + Add Item
          </button>

          <button
            onClick={handleCreateAuction}
            className="mt-4 bg-accent text-bg px-6 py-2 rounded-xl font-semibold hover:opacity-90 transition"
          >
            Create Auction
          </button>
        </div>
      </div>

      {/* =============== Auction List =============== */}
      <h3 className="text-xl font-bold text-accent mb-3">Your Auctions</h3>
      {loading ? (
        <p className="text-text">Loading auctions...</p>
      ) : auctions.length === 0 ? (
        <p className="text-text">No auctions found.</p>
      ) : (
        <div className="grid gap-4">
          {auctions.map((auction) => (
            <div
              key={auction.id}
              className="bg-card p-4 rounded-xl border border-primary"
            >
              <h4 className="text-lg font-bold text-primary">
                {auction.title}
              </h4>
              <p className="text-text/80">{auction.description}</p>
              <p className="text-sm text-accent mt-2">
                Ends: {new Date(auction.endsAt).toLocaleString()}
              </p>

              {new Date(auction.endsAt) > new Date() ? (
                <button
                  onClick={() => viewRankings(auction)}
                  className="mt-3 bg-primary text-bg px-4 py-1 rounded-lg font-semibold hover:opacity-80 transition"
                >
                  View Live Rankings
                </button>
              ) : (
                <button
                  onClick={() => downloadSummary(auction.id)}
                  className="mt-3 bg-accent text-bg px-4 py-1 rounded-lg font-semibold hover:opacity-90 transition"
                >
                  Download Summary
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* =============== Rankings =============== */}
      {showRankings && selectedAuction && (
        <div className="mt-8 bg-card p-6 rounded-2xl border border-primary shadow-lg">
          <h3 className="text-2xl font-bold text-accent mb-4">
            Live Rankings for {selectedAuction.title}
          </h3>

          {rankings.length === 0 ? (
            <p className="text-text">Waiting for bids...</p>
          ) : (
            <table className="w-full border border-primary text-left rounded-lg">
              <thead>
                <tr className="bg-bg text-primary">
                  <th className="p-2">Rank</th>
                  <th className="p-2">Supplier</th>
                  <th className="p-2">Total Bid (₹)</th>
                </tr>
              </thead>
              <tbody>
                {rankings.map((r) => (
                  <tr key={r.supplierId} className="border-t border-primary/30">
                    <td className="p-2 text-accent font-semibold">
                      {r.rank === 1 ? "L1" : `L${r.rank}`}
                    </td>
                    <td className="p-2 text-text">{r.supplierId}</td>
                    <td className="p-2 text-text">
                      {r.totalValue.toFixed(2)}
                    </td>
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
