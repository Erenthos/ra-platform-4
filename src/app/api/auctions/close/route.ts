import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.replace("Bearer ", "");
    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== "BUYER")
      return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const { auctionId } = await req.json();
    if (!auctionId)
      return NextResponse.json({ error: "Auction ID is required" }, { status: 400 });

    const auction = await prisma.auction.findUnique({ where: { id: auctionId } });
    if (!auction)
      return NextResponse.json({ error: "Auction not found" }, { status: 404 });

    const now = new Date();
    await prisma.auction.update({
      where: { id: auctionId },
      data: { endsAt: now },
    });

    return NextResponse.json({
      message: "Auction closed successfully",
      closedAt: now,
    });
  } catch (error: any) {
    console.error("Auction close error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to close auction" },
      { status: 500 }
    );
  }
}
