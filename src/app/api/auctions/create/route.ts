import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.replace("Bearer ", "");
    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== "BUYER")
      return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const { title, description, duration, items } = await req.json();

    if (!title || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const now = new Date();
    const endsAt = new Date(now.getTime() + duration * 60 * 1000);

    const auction = await prisma.auction.create({
      data: {
        title,
        description,
        buyerId: decoded.userId,
        startsAt: now,
        endsAt,
        items: {
          create: items.map((i: any) => ({
            name: i.name,
            quantity: parseFloat(i.quantity) || 0,
            uom: i.uom || "",
          })),
        },
      },
      include: { items: true },
    });

    return NextResponse.json({ message: "Auction created", auction });
  } catch (error: any) {
    console.error("Create auction error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
