// File: src/app/api/auctions/bid/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

type ItemBid = { itemId: string; rate: number };

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.replace("Bearer ", "");
    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== "SUPPLIER") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { auctionId, itemBids } = body as { auctionId?: string; itemBids?: ItemBid[] };

    if (!auctionId) return NextResponse.json({ error: "Missing auctionId" }, { status: 400 });

    // Fetch auction and items
    const auction = await prisma.auction.findUnique({ where: { id: auctionId }, include: { items: true } });
    if (!auction) return NextResponse.json({ error: "Auction not found" }, { status: 404 });

    // If no itemBids provided or empty -> return current rankings (used to fetch persistent rank)
    if (!itemBids || !Array.isArray(itemBids) || itemBids.length === 0) {
      const allBids = await prisma.bid.findMany({
        where: { auctionId },
        orderBy: { totalValue: "asc" },
      });

      const rankings = allBids.map((b, i) => ({
        supplierId: b.supplierId,
        rank: i + 1,
        totalValue: b.totalValue,
      }));

      return NextResponse.json({ message: "Rankings fetched", rankings });
    }

    // Calculate total bid value = sum(rate * quantity) for each item bid
    const items = auction.items;
    let totalValue = 0;
    for (const bid of itemBids) {
      const item = items.find((it) => it.id === bid.itemId);
      if (!item) continue;
      totalValue += (item.quantity || 0) * (parseFloat(String(bid.rate)) || 0);
    }

    // Upsert the supplier's bid (requires composite unique in schema)
    const bidRecord = await prisma.bid.upsert({
      where: {
        supplierId_auctionId: {
          supplierId: decoded.userId,
          auctionId,
        },
      },
      update: { totalValue, submittedAt: new Date() },
      create: {
        supplierId: decoded.userId,
        auctionId,
        totalValue,
      },
    });

    // Recalculate rankings (lowest totalValue = rank 1)
    const allBids = await prisma.bid.findMany({
      where: { auctionId },
      orderBy: { totalValue: "asc" },
    });

    const rankings = allBids.map((b, i) => ({
      supplierId: b.supplierId,
      rank: i + 1,
      totalValue: b.totalValue,
    }));

    // Emit ranking update to room if Socket.io server exists
    try {
      const globalAny: any = global as any;
      if (globalAny.io) {
        // Emit object with auctionId and rankings
        globalAny.io.to(auctionId).emit("ranking_update", { auctionId, rankings });
      }
    } catch (e) {
      console.warn("Socket emit failed:", e);
    }

    // Return bid and rankings
    const currentRank = rankings.find((r) => r.supplierId === decoded.userId);
    return NextResponse.json({
      message: "Bid submitted successfully",
      bid: bidRecord,
      rank: currentRank?.rank ?? null,
      rankings,
    });
  } catch (error: any) {
    console.error("Bid submission error:", error);
    return NextResponse.json({ error: error.message || "Failed to submit bid" }, { status: 500 });
  }
}
