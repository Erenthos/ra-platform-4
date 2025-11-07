"use client";

import { useState } from "react";

interface BidFormProps {
  auctionId: string;
  onBidSubmit: (totalValue: number) => Promise<void>;
  currentRank: number | null;
}

export default function BidForm({
  auctionId,
  onBidSubmit,
  currentRank,
}: BidFormProps) {
  const [bidValue, setBidValue] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!bidValue) return alert("Please enter your total bid value");
    setLoading(true);
    await onBidSubmit(parseFloat(bidValue));
    setLoading(false);
    setBidValue("");
  };

  return (
    <div className="bg-[#112240] p-6 rounded-2xl shadow-lg w-full md:w-2/3 mx-auto text-left">
      <h3 className="text-xl font-semibold text-[#FFD700] mb-3">
        Submit Your Bid
      </h3>

      <input
        type="number"
        placeholder="Enter total bid value"
        value={bidValue}
        onChange={(e) => setBidValue(e.target.value)}
        className="w-full p-2 mb-4 rounded bg-[#0A192F] border border-[#2EE59D] text-[#EAEAEA]"
      />

      <button
        disabled={loading}
        onClick={handleSubmit}
        className={`w-full py-2 rounded-xl font-semibold ${
          loading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-[#2EE59D] text-[#0A192F] hover:bg-[#24c68a] transition"
        }`}
      >
        {loading ? "Submitting..." : "Submit Bid"}
      </button>

      {currentRank && (
        <div className="mt-6 text-center text-xl font-semibold">
          <span className="text-[#EAEAEA]">Your Current Rank: </span>
          <span className="text-[#FFD700]">
            {currentRank === 1 ? "L1 (Lowest)" : `L${currentRank}`}
          </span>
        </div>
      )}
    </div>
  );
}

