import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    let auctions;

    if (decoded.role === "BUYER") {
      // Buyer: only see auctions they created
      auctions = await prisma.auction.findMany({
        where: { buyerId: decoded.userId },
        include: { items: true, bids: true },
        orderBy: { createdAt: "desc" },
      });
    } else {
      // Supplier: see all active auctions
      auctions = await prisma.auction.findMany({
        where: { endsAt: { gt: new Date() } },
        include: { items: true },
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json({ auctions });
  } catch (error: any) {
    console.error("Auction list error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch auctions" }, { status: 500 });
  }
}

