import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== "SUPPLIER") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { auctionId, totalValue } = await req.json();

    if (!auctionId || !totalValue) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if auction exists and is still live
    const auction = await prisma.auction.findUnique({ where: { id: auctionId } });
    if (!auction) {
      return NextResponse.json({ error: "Auction not found" }, { status: 404 });
    }

    if (new Date(auction.endsAt) < new Date()) {
      return NextResponse.json({ error: "Auction has ended" }, { status: 400 });
    }

    // Create or update supplier's bid
    const bid = await prisma.bid.upsert({
      where: {
        supplierId_auctionId: {
          supplierId: decoded.userId,
          auctionId,
        },
      },
      update: { totalValue: parseFloat(totalValue), submittedAt: new Date() },
      create: {
        supplierId: decoded.userId,
        auctionId,
        totalValue: parseFloat(totalValue),
      },
    });

    // Recalculate rankings (lowest totalValue = Rank 1)
    const allBids = await prisma.bid.findMany({
      where: { auctionId },
      orderBy: { totalValue: "asc" },
    });

    const rankings = allBids.map((b, i) => ({
      supplierId: b.supplierId,
      rank: i + 1,
      totalValue: b.totalValue,
    }));

    // Return updated rank for this supplier
    const currentSupplierRank = rankings.find(
      (r) => r.supplierId === decoded.userId
    );

    // TODO: Emit real-time update via Socket.io (handled later in socket route)

    return NextResponse.json({
      message: "Bid submitted successfully",
      bid,
      rank: currentSupplierRank?.rank || null,
    });
  } catch (error: any) {
    console.error("Bid submission error:", error);
    return NextResponse.json({ error: error.message || "Failed to submit bid" }, { status: 500 });
  }
}

