import { NextRequest, NextResponse } from "next/server";
import { saveTransactionsByMonth } from "../route";

export async function POST(request: NextRequest) {
  try {
    const { transactions, platform, owner } = await request.json();

    if (!transactions || !platform || !owner) {
      return NextResponse.json(
        { error: "缺少必要的参数: transactions, platform 或 owner" },
        { status: 400 },
      );
    }

    // 保存交易记录
    const saveResult = saveTransactionsByMonth(transactions, platform, owner);

    return NextResponse.json({
      success: true,
      message: "交易记录保存成功",
      ...saveResult,
    });
  } catch (error) {
    console.error("保存交易记录时出错:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "保存交易记录时出错" },
      { status: 500 },
    );
  }
}
