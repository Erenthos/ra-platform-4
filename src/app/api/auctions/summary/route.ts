import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { NextResponse } from "next/server";
import ExcelJS from "exceljs";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const auctionId = url.searchParams.get("auctionId");
    const authHeader = req.headers.get("authorization");

    if (!authHeader)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.replace("Bearer ", "");
    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== "BUYER")
      return NextResponse.json({ error: "Access denied" }, { status: 403 });

    if (!auctionId)
      return NextResponse.json({ error: "Missing auctionId" }, { status: 400 });

    // 🔹 Fetch auction with buyer, items, bids, and suppliers
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        buyer: true,
        items: true,
        bids: {
          include: { supplier: true },
          orderBy: { totalValue: "asc" },
        },
      },
    });

    if (!auction)
      return NextResponse.json({ error: "Auction not found" }, { status: 404 });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Auction Summary");

    // ========== HEADER SECTION ==========
    sheet.mergeCells("A1", "E1");
    sheet.getCell("A1").value = "AUCTION SUMMARY REPORT";
    sheet.getCell("A1").font = { bold: true, size: 16 };
    sheet.getCell("A1").alignment = { horizontal: "center" };

    sheet.addRow([]);
    sheet.addRow(["Auction Title", auction.title]);
    sheet.addRow(["Description", auction.description || "N/A"]);
    sheet.addRow(["Buyer", `${auction.buyer.name} (${auction.buyer.email})`]);
    sheet.addRow(["Ends At", auction.endsAt.toLocaleString()]);
    sheet.addRow([]);

    // ========== TABLE HEADER ==========
    const headerRow = sheet.addRow([
      "Supplier ID",
      "Supplier Name",
      "Supplier Email",
      "Item Name(s)",
      "Qty (UOM)",
      "Rate (₹)",
      "Amount (₹)",
      "Total Bid Value (₹)",
      "Rank",
      "Winner",
    ]);

    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1E3A5F" },
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });

    // ========== DATA SECTION ==========
    const sortedBids = auction.bids.sort((a, b) => a.totalValue - b.totalValue);
    const winner = sortedBids[0];

    for (let i = 0; i < sortedBids.length; i++) {
      const bid = sortedBids[i];
      const rank = `L${i + 1}`;
      const supplier = bid.supplier;

      // 🔹 Simulated item-wise breakdown (if future itemRates table exists, map them here)
      const itemRows = auction.items.map((it) => ({
        name: it.name,
        qty: `${it.quantity} (${it.uom})`,
        rate: "-", // placeholder, future extension if itemRates table added
        amount: "-",
      }));

      // Create one summary row per supplier
      const row = sheet.addRow([
        supplier.id,
        supplier.name,
        supplier.email,
        itemRows.map((it) => it.name).join(", "),
        itemRows.map((it) => it.qty).join(", "),
        itemRows.map((it) => it.rate).join(", "),
        itemRows.map((it) => it.amount).join(", "),
        bid.totalValue.toFixed(2),
        rank,
        rank === "L1" ? "🏆 WINNER" : "",
      ]);

      // Winner row style
      if (rank === "L1") {
        row.eachCell((c) => {
          c.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF2EE59D" },
          };
          c.font = { bold: true };
        });
      }
    }

    sheet.columns.forEach((col) => (col.width = 20));
    sheet.addRow([]);

    // Summary footer
    const lastRow = sheet.addRow([
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      `Winner: ${winner?.supplier?.name} (${winner?.supplier?.email})`,
    ]);
    lastRow.font = { bold: true };
    lastRow.alignment = { horizontal: "right" };

    // ========== RETURN AS FILE ==========
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
    return NextResponse.json(
      { error: error.message || "Failed to generate summary" },
      { status: 500 }
    );
  }
}
