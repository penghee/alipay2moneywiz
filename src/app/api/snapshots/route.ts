import { NextRequest, NextResponse } from "next/server";
import { loadAllSnapshots } from "@/lib/snapshotUtils";

/**
 * 获取所有快照列表
 */
export async function GET() {
  try {
    const snapshots = loadAllSnapshots();
    return NextResponse.json(snapshots);
  } catch (error) {
    console.error("Error loading snapshots:", error);
    return NextResponse.json(
      { error: "Failed to load snapshots" },
      { status: 500 },
    );
  }
}

/**
 * 创建新快照
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, note } = body;

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    // 导入创建快照相关的函数
    const { createSnapshot, saveSnapshot } =
      await import("@/lib/snapshotUtils");
    const { loadAssets } = await import("@/lib/assetUtils");

    const assets = loadAssets();
    const snapshot = createSnapshot(date, assets, note);
    saveSnapshot(snapshot);

    return NextResponse.json(snapshot);
  } catch (error) {
    console.error("Error creating snapshot:", error);
    return NextResponse.json(
      { error: "Failed to create snapshot" },
      { status: 500 },
    );
  }
}
