import { NextRequest, NextResponse } from "next/server";
import {
  loadMaps,
  processAlipay,
  processWechat,
  saveTransactionsByMonth,
} from "../route";
export const dynamic = "force-dynamic"; // Prevent static generation

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const platform = formData.get("platform") as string;
    const owner = (formData.get("owner") as string) || "爸爸";
    const smartCategory = formData.get("smartCategory") === "true";

    console.log("Upload request received:", {
      fileName: file.name,
      fileSize: file.size,
      platform,
    });

    if (!file || !platform) {
      return NextResponse.json(
        { error: "缺少文件或平台参数" },
        { status: 400 },
      );
    }

    if (!["alipay", "wechat"].includes(platform)) {
      return NextResponse.json({ error: "不支持的平台" }, { status: 400 });
    }

    // 加载映射文件
    const { accountMap, categoryMap } = loadMaps();

    let transactions: Record<string, string>[] = [];
    if (platform === "alipay") {
      // 处理支付宝 CSV 文件
      console.log("Processing Alipay CSV file...");
      const content = await file.text();
      console.log("File content length:", content.length);
      const { transactions: alipayTransactions } = await processAlipay(
        file,
        accountMap,
        categoryMap,
        owner,
        smartCategory,
      );
      transactions = [...transactions, ...alipayTransactions];
    } else if (platform === "wechat") {
      // 处理微信 XLSX 文件
      console.log("Processing Wechat XLSX file...");
      const buffer = Buffer.from(await file.arrayBuffer());
      console.log("File buffer length:", buffer.length);
      const { transactions: wechatTransactions } = await processWechat(
        buffer,
        accountMap,
        categoryMap,
        owner,
        smartCategory,
      );
      transactions = [...transactions, ...wechatTransactions];
    }

    if (transactions.length === 0) {
      return NextResponse.json(
        { error: "未找到有效的交易记录" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      transactions: transactions,
      preview: true,
      total: transactions.length,
      platform,
      owner,
    });
  } catch (error) {
    console.error("Upload preview error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "处理文件时出错" },
      { status: 500 },
    );
  }
}
