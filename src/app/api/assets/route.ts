import { NextRequest, NextResponse } from "next/server";
import { saveAssets, loadAssets } from "@/lib/assetUtils";

export async function GET() {
  try {
    const assets = await loadAssets();
    return NextResponse.json(assets);
  } catch (error) {
    console.error("Error loading assets:", error);
    return NextResponse.json(
      { error: "Failed to load assets" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const assets = await request.json();
    saveAssets(assets);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving assets:", error);
    return NextResponse.json(
      { error: "Failed to save assets" },
      { status: 500 },
    );
  }
}
