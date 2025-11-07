import { NextResponse } from "next/server";

export async function POST() {
  try {
    // In JWT-based auth, logout simply means removing the token client-side.
    // Here, we return a success response so the frontend can clear local storage or cookies.
    return NextResponse.json({ message: "Logout successful" }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}

