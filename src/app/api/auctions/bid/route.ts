import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.replace("Bearer ", "");
    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== "SUPPLIER")
      return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const { auctionId, itemBids } = await req.json(); // itemBids = [{ itemId, rate }, ...]

    if (!auctionId || !Array.isArray(itemBids) || itemBids.length === 0)
      return NextResponse.json({ error: "Missing bid data" }, { status: 400 });

    // ✅ Fetch auction items
    const items = await prisma.auctionItem.findMany({
      where: { auctionId },
    });
    if (items.length === 0)
      return NextResponse.json({ error: "No items found for auction" }, { status: 404 });

    // ✅ Calculate total bid value = sum of (rate * quantity)
    let totalValue = 0;
    for (const bid of itemBids) {
      const item = items.find((i) => i.id === bid.itemId);
      if (!item) continue;
      totalValue += (item.quantity || 0) * (parseFloat(bid.rate) || 0);
    }

    // ✅ Create or update supplier's total bid
    const bid = await prisma.bid.upsert({
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

    // ✅ Recalculate live rankings
    const allBids = await prisma.bid.findMany({
      where: { auctionId },
      orderBy: { totalValue: "asc" },
    });

    const rankings = allBids.map((b, i) => ({
      supplierId: b.supplierId,
      rank: i + 1,
      totalValue: b.totalValue,
    }));

    const currentSupplierRank = rankings.find(
      (r) => r.supplierId === decoded.userId
    );

    return NextResponse.json({
      message: "Bid submitted successfully",
      bid,
      rank: currentSupplierRank?.rank || null,
    });
  } catch (error: any) {
    console.error("Bid submission error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit bid" },
      { status: 500 }
    );
  }
}
