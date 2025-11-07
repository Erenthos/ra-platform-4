"use client";

interface AuctionCardProps {
  title: string;
  description?: string;
  endsAt: string;
  itemsCount: number;
  onClick?: () => void;
  isSelected?: boolean;
}

export default function AuctionCard({
  title,
  description,
  endsAt,
  itemsCount,
  onClick,
  isSelected = false,
}: AuctionCardProps) {
  return (
    <div
      onClick={onClick}
      className={`cursor-pointer p-4 rounded-xl border transition-all ${
        isSelected
          ? "border-[#FFD700] bg-[#112240]"
          : "border-[#2EE59D] bg-[#0A192F] hover:border-[#FFD700]"
      }`}
    >
      <h4 className="text-lg font-bold text-[#2EE59D]">{title}</h4>
      {description && (
        <p className="text-sm text-[#EAEAEA]/80 mt-1 line-clamp-2">
          {description}
        </p>
      )}
      <p className="text-sm text-[#EAEAEA]/70 mt-2">
        Ends at: {new Date(endsAt).toLocaleString()}
      </p>
      <p className="text-sm text-[#FFD700] mt-1">Items: {itemsCount}</p>
    </div>
  );
}

