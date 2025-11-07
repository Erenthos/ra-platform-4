import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const initSocket = (url?: string) => {
  if (!socket) {
    const socketUrl = url || process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000";
    socket = io(socketUrl, {
      transports: ["websocket"],
      reconnection: true,
    });

    socket.on("connect", () => {
      console.log("🟢 Connected to Socket.io:", socket?.id);
    });

    socket.on("disconnect", () => {
      console.log("🔴 Disconnected from Socket.io");
    });
  }
  return socket;
};

export const getSocket = (): Socket | null => socket;

export const joinAuctionRoom = (auctionId: string) => {
  if (socket && auctionId) {
    socket.emit("join_auction", auctionId);
    console.log(`👥 Joined auction room: ${auctionId}`);
  }
};

export const emitRankingUpdate = (auctionId: string, rankings: any[]) => {
  if (socket && auctionId) {
    socket.emit("update_ranking", auctionId, rankings);
  }
};

