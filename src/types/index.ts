// 🧍 User
export interface User {
  id: string;
  name: string;
  email: string;
  role: "BUYER" | "SUPPLIER";
}

// 📦 Auction Item
export interface AuctionItem {
  id: string;
  name: string;
  quantity: number;
  uom: string;
  basePrice: number;
}

// 🏷️ Auction
export interface Auction {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  endsAt: string;
  buyerId: string;
  items: AuctionItem[];
  bids?: Bid[];
}

// 💰 Bid
export interface Bid {
  id: string;
  supplierId: string;
  auctionId: string;
  totalValue: number;
  submittedAt: string;
}

// 🏆 Ranking Entry
export interface Ranking {
  supplierId: string;
  rank: number;
  totalValue: number;
}

// 🔐 Auth Response
export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

