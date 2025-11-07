import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { NextResponse } from "next/server";
import ExcelJS from "exceljs";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const auctionId = url.searchParams.get("auctionId");
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.replace("Bearer ", "");
    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== "BUYER")
      return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const auction = await prisma.auction.findUnique({
      where: { id: auctionId || "" },
      include: { items: true, bids: true },
    });

    if (!auction) return NextResponse.json({ error: "Auction not found" }, { status: 404 });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Auction Summary");

    sheet.columns = [
      { header: "Supplier ID", key: "supplierId", width: 40 },
      { header: "Total Bid Value (₹)", key: "totalValue", width: 25 },
      { header: "Rank", key: "rank", width: 10 },
    ];

    const sortedBids = auction.bids.sort((a, b) => a.totalValue - b.totalValue);
    sortedBids.forEach((b, i) => {
      sheet.addRow({
        supplierId: b.supplierId,
        totalValue: b.totalValue.toFixed(2),
        rank: `L${i + 1}`,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=Auction_Summary_${auctionId}.xlsx`,
      },
    });
  } catch (error: any) {
    console.error("Summary generation error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate summary" }, { status: 500 });
  }
}
