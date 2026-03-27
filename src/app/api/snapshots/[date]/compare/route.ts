import { NextResponse } from "next/server";
import {
  loadSnapshot,
  compareSnapshots,
  loadAllSnapshots,
} from "@/lib/snapshotUtils";

/**
 * 比较指定日期的快照与上一个快照
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ date: string }> },
) {
  try {
    const { date } = await params;
    const currentSnapshot = loadSnapshot(date);

    if (!currentSnapshot) {
      return NextResponse.json(
        { error: "Snapshot not found" },
        { status: 404 },
      );
    }

    // 获取所有快照，找到当前快照的前一个快照
    const allSnapshots = loadAllSnapshots();
    const currentIndex = allSnapshots.findIndex((s) => s.date === date);

    let previousSnapshot: ReturnType<typeof loadSnapshot> | undefined;
    if (currentIndex > 0 && currentIndex < allSnapshots.length - 1) {
      previousSnapshot = allSnapshots[currentIndex + 1];
    }

    const comparison = compareSnapshots(currentSnapshot, previousSnapshot!);

    return NextResponse.json(comparison);
  } catch (error) {
    console.error("Error comparing snapshots:", error);
    return NextResponse.json(
      { error: "Failed to compare snapshots" },
      { status: 500 },
    );
  }
}
