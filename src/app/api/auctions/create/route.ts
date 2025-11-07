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
    if (!decoded || decoded.role !== "BUYER") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { title, description, endsAt, items } = await req.json();

    if (!title || !endsAt || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const auction = await prisma.auction.create({
      data: {
        title,
        description,
        endsAt: new Date(endsAt),
        buyerId: decoded.userId,
        items: {
          create: items.map((item: any) => ({
            name: item.name,
            quantity: parseFloat(item.quantity),
            uom: item.uom,
            basePrice: parseFloat(item.basePrice || 0),
          })),
        },
      },
      include: { items: true },
    });

    return NextResponse.json({ message: "Auction created successfully", auction });
  } catch (error: any) {
    console.error("Auction creation error:", error);
    return NextResponse.json({ error: error.message || "Failed to create auction" }, { status: 500 });
  }
}

