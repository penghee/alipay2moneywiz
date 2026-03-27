import { NextRequest, NextResponse } from "next/server";
import {
  loadSnapshot,
  deleteSnapshot,
  compareSnapshots,
} from "@/lib/snapshotUtils";
import { loadAllSnapshots } from "@/lib/snapshotUtils";

/**
 * 获取指定日期的快照
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> },
) {
  try {
    const { date } = await params;
    const snapshot = loadSnapshot(date);

    if (!snapshot) {
      return NextResponse.json(
        { error: "Snapshot not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(snapshot);
  } catch (error) {
    console.error("Error loading snapshot:", error);
    return NextResponse.json(
      { error: "Failed to load snapshot" },
      { status: 500 },
    );
  }
}

/**
 * 删除指定日期的快照
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> },
) {
  try {
    const { date } = await params;
    const success = deleteSnapshot(date);

    if (!success) {
      return NextResponse.json(
        { error: "Snapshot not found or could not be deleted" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting snapshot:", error);
    return NextResponse.json(
      { error: "Failed to delete snapshot" },
      { status: 500 },
    );
  }
}
