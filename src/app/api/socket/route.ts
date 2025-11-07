import { Server } from "socket.io";
import { NextRequest } from "next/server";

const ioHandler = (req: NextRequest) => {
  if (!(global as any).io) {
    const io = new Server({
      cors: {
        origin: "*", // You can restrict this later for production
      },
    });

    // Store globally to prevent multiple Socket.io instances
    (global as any).io = io;

    io.on("connection", (socket) => {
      console.log("🔌 New client connected:", socket.id);

      // Join auction room
      socket.on("join_auction", (auctionId: string) => {
        socket.join(auctionId);
        console.log(`👥 Supplier joined auction room: ${auctionId}`);
      });

      // Broadcast updated rankings when a new bid comes in
      socket.on("update_ranking", (auctionId: string, rankings: any) => {
        io.to(auctionId).emit("ranking_update", rankings);
      });

      socket.on("disconnect", () => {
        console.log("❌ Client disconnected:", socket.id);
      });
    });

    console.log("✅ Socket.io server initialized");
  }

  return new Response("Socket.io server running");
};

export { ioHandler as GET, ioHandler as POST };

