import { NextResponse } from "next/server";
import { apiClient } from "@/lib/apiClient";

export async function GET() {
  try {
    // This is a placeholder - replace with actual implementation
    // For now, return an empty array
    return NextResponse.json([]);
  } catch (error) {
    console.error("Error fetching owners:", error);
    return NextResponse.json(
      { error: "Failed to fetch owners" },
      { status: 500 },
    );
  }
}
