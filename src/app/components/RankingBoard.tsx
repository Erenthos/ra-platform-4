"use client";

interface RankingBoardProps {
  rankings: { supplierId: string; rank: number }[];
  currentUserId: string;
}

export default function RankingBoard({ rankings, currentUserId }: RankingBoardProps) {
  if (!rankings || rankings.length === 0) {
    return (
      <div className="bg-[#112240] p-4 rounded-xl text-center text-[#EAEAEA] opacity-80">
        No bids yet for this auction.
      </div>
    );
  }

  return (
    <div className="bg-[#112240] p-6 rounded-2xl shadow-lg text-left">
      <h3 className="text-xl font-semibold text-[#FFD700] mb-4">Live Rankings</h3>
      <ul className="space-y-2">
        {rankings.map((r) => (
          <li
            key={r.supplierId}
            className={`flex justify-between items-center p-2 rounded ${
              r.supplierId === currentUserId
                ? "bg-[#2EE59D]/30 border border-[#2EE59D]"
                : "bg-[#0A192F] border border-transparent"
            }`}
          >
            <span
              className={`font-semibold ${
                r.supplierId === currentUserId ? "text-[#2EE59D]" : "text-[#EAEAEA]"
              }`}
            >
              Supplier {r.rank}
            </span>
            <span
              className={`text-sm ${
                r.rank === 1 ? "text-[#FFD700]" : "text-[#EAEAEA]/70"
              }`}
            >
              {r.rank === 1 ? "L1" : `L${r.rank}`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

