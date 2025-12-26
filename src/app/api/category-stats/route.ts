import { NextResponse } from "next/server";
import { smartCategoryMatcher } from "@/lib/smartCategory";

export async function GET() {
  try {
    const stats = smartCategoryMatcher.getPatternStats();

    return NextResponse.json({
      success: true,
      data: {
        totalCategories: stats.length,
        patterns: stats.map((stat) => ({
          category: stat.category,
          sampleCount: stat.sampleCount,
          confidence: Math.round(stat.confidence * 100) / 100,
        })),
      },
    });
  } catch (error) {
    console.error("Error getting category stats:", error);
    return NextResponse.json(
      { error: "获取分类统计信息失败" },
      { status: 500 },
    );
  }
}
