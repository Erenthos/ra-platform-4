"use client";

import { useEffect, useState } from "react";

export default function BuyerDashboard() {
  const [auctions, setAuctions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newAuction, setNewAuction] = useState({
    title: "",
    description: "",
    durationMinutes: "",
    items: [{ name: "", quantity: "", uom: "", basePrice: "" }],
  });

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

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

  const createAuction = async () => {
    if (!token) return alert("Not authorized");

    if (!newAuction.title || !newAuction.durationMinutes || newAuction.items.length === 0) {
      alert("Please fill all required fields");
      return;
    }

    const res = await fetch("/api/auctions/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: newAuction.title,
        description: newAuction.description,
        durationMinutes: parseInt(newAuction.durationMinutes),
        items: newAuction.items,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      alert("Auction created successfully!");
      setShowForm(false);
      setNewAuction({
        title: "",
        description: "",
        durationMinutes: "",
        items: [{ name: "", quantity: "", uom: "", basePrice: "" }],
      });
      fetchAuctions();
    } else {
      alert(data.error || "Failed to create auction");
    }
  };

  const closeAuction = async (auctionId: string) => {
    if (!token) return alert("Not authorized");
    const confirmClose = confirm("Are you sure you want to close this auction?");
    if (!confirmClose) return;

    const res = await fetch("/api/auctions/close", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ auctionId }),
    });

    const data = await res.json();
    if (res.ok) {
      alert("Auction closed successfully!");
      fetchAuctions();
    } else {
      alert(data.error || "Failed to close auction");
    }
  };

  useEffect(() => {
    fetchAuctions();
  }, []);

  return (
    <div className="min-h-screen">
      <h2 className="text-3xl font-bold text-[#2EE59D] mb-6">Buyer Dashboard</h2>

      <button
        onClick={() => setShowForm(!showForm)}
        className="bg-[#2EE59D] text-[#0A192F] px-6 py-2 rounded-xl font-semibold hover:bg-[#24c68a] transition"
      >
        {showForm ? "Cancel" : "Create New Auction"}
      </button>

      {showForm && (
        <div className="bg-[#112240] p-6 rounded-2xl shadow-lg mt-6 text-left">
          <h3 className="text-xl mb-4 font-semibold text-[#FFD700]">
            New Auction Details
          </h3>

          <input
            type="text"
            placeholder="Auction Title"
            className="block w-full mb-3 p-2 rounded bg-[#0A192F] border border-[#2EE59D] text-[#EAEAEA]"
            onChange={(e) =>
              setNewAuction({ ...newAuction, title: e.target.value })
            }
          />

          <textarea
            placeholder="Description"
            className="block w-full mb-3 p-2 rounded bg-[#0A192F] border border-[#2EE59D] text-[#EAEAEA]"
            onChange={(e) =>
              setNewAuction({ ...newAuction, description: e.target.value })
            }
          />

          <input
            type="number"
            placeholder="Auction Duration (in minutes)"
            className="block w-full mb-3 p-2 rounded bg-[#0A192F] border border-[#2EE59D] text-[#EAEAEA]"
            onChange={(e) =>
              setNewAuction({
                ...newAuction,
                durationMinutes: e.target.value,
              })
            }
          />

          <h4 className="mt-4 mb-2 font-semibold text-[#EAEAEA]">
            Auction Items
          </h4>

          {newAuction.items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-4 gap-2 mb-2">
              <input
                placeholder="Item"
                className="p-2 rounded bg-[#0A192F] border border-[#2EE59D]"
                onChange={(e) => {
                  const updated = [...newAuction.items];
                  updated[idx].name = e.target.value;
                  setNewAuction({ ...newAuction, items: updated });
                }}
              />
              <input
                placeholder="Qty"
                type="number"
                className="p-2 rounded bg-[#0A192F] border border-[#2EE59D]"
                onChange={(e) => {
                  const updated = [...newAuction.items];
                  updated[idx].quantity = e.target.value;
                  setNewAuction({ ...newAuction, items: updated });
                }}
              />
              <input
                placeholder="UOM"
                className="p-2 rounded bg-[#0A192F] border border-[#2EE59D]"
                onChange={(e) => {
                  const updated = [...newAuction.items];
                  updated[idx].uom = e.target.value;
                  setNewAuction({ ...newAuction, items: updated });
                }}
              />
              <input
                placeholder="Base Price"
                type="number"
                className="p-2 rounded bg-[#0A192F] border border-[#2EE59D]"
                onChange={(e) => {
                  const updated = [...newAuction.items];
                  updated[idx].basePrice = e.target.value;
                  setNewAuction({ ...newAuction, items: updated });
                }}
              />
            </div>
          ))}

          <button
            onClick={() =>
              setNewAuction({
                ...newAuction,
                items: [
                  ...newAuction.items,
                  { name: "", quantity: "", uom: "", basePrice: "" },
                ],
              })
            }
            className="mt-2 text-sm text-[#2EE59D] hover:text-[#24c68a]"
          >
            + Add Another Item
          </button>

          <div className="mt-6">
            <button
              onClick={createAuction}
              className="bg-[#FFD700] text-[#0A192F] px-6 py-2 rounded-xl font-semibold hover:bg-[#e6c200] transition"
            >
              Save Auction
            </button>
          </div>
        </div>
      )}

      <div className="mt-8">
        <h3 className="text-2xl font-semibold text-[#FFD700] mb-4">
          Your Auctions
        </h3>

        {loading ? (
          <p className="text-[#EAEAEA]">Loading auctions...</p>
        ) : auctions.length === 0 ? (
          <p className="text-[#EAEAEA]">No auctions created yet.</p>
        ) : (
          <div className="grid gap-4">
            {auctions.map((auction) => (
              <div
                key={auction.id}
                className="bg-[#112240] p-4 rounded-xl border border-[#2EE59D]"
              >
                <h4 className="text-lg font-bold text-[#2EE59D]">
                  {auction.title}
                </h4>
                <p className="text-sm text-[#EAEAEA]">
                  Ends: {new Date(auction.endsAt).toLocaleString()}
                </p>
                <p className="mt-2 text-[#EAEAEA]/80">{auction.description}</p>
                <p className="mt-3 text-sm text-[#FFD700]">
                  Items: {auction.items.length}
                </p>

                {new Date(auction.endsAt) > new Date() ? (
                  <button
                    onClick={() => closeAuction(auction.id)}
                    className="mt-3 px-4 py-2 bg-[#FF6B6B] text-white rounded-lg hover:bg-[#e85b5b] transition"
                  >
                    Close Auction
                  </button>
                ) : (
                  <p className="mt-3 text-sm text-[#FF6B6B]/80">
                    Auction Closed
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
