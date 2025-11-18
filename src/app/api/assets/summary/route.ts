import { NextResponse } from "next/server";
import { apiClient } from "@/lib/apiClient";
import type { AssetSummary } from "@/types/asset";

export async function GET() {
  try {
    const data = await apiClient.getAssetsSummary();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching assets summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch assets summary" },
      { status: 500 },
    );
  }
}
