import { NextRequest, NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";
import { readFileSync, writeFileSync } from "fs";
import path from "path";
import * as XLSX from "xlsx";
import iconv from "iconv-lite";
import { DATA_PATHS } from "@/config/paths";
import * as fsp from "fs/promises";
import * as fs from "fs";
import readline from "readline";
export const dynamic = "force-dynamic"; // Prevent static generation
import platformMap from "@/config/platform.json";
import { smartCategoryMatcher } from "@/lib/smartCategory";
import { parseDate } from "@/lib/utils";

// 读取映射文件
export function loadMaps() {
  const accountMap = JSON.parse(
    readFileSync(DATA_PATHS.maps.account(), "utf8"),
  );
  const categoryMap = JSON.parse(
    readFileSync(DATA_PATHS.maps.category(), "utf8"),
  );

  return { accountMap, categoryMap };
}

// 映射分类
export async function mapCategory(
  transactionType: string,
  product: string,
  counterparty: string,
  amount: number,
  categoryMap: Record<string, string[]>,
  smartCategory: boolean = false,
): Promise<string> {
  const safeTransactionType = transactionType || "";
  const safeProduct = product || "";
  const safeCounterparty = counterparty || "";
  const searchText =
    `${safeTransactionType} ${safeProduct} ${safeCounterparty}`.toLowerCase();

  for (const category in categoryMap) {
    const keywords = categoryMap[category];
    for (const keyword of keywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        return category;
      }
    }
  }
  return safeTransactionType || "其他";
  // return await smartCategoryMatcher.smartMatchCategory(
  //   transactionType,
  //   product,
  //   counterparty,
  //   amount,
  //   categoryMap,
  //   smartCategory,
  // );
}

// 处理支付宝账单
export async function processAlipay(
  content: File,
  accountMap: Record<string, string>,
  categoryMap: Record<string, string[]>,
  owner: string,
  smartCategory: boolean,
) {
  // 支付宝 CSV 文件前面有元数据，需要提取真实的交易数据
  // transfer GBK to utf-8
  // Convert the File to an ArrayBuffer
  const arrayBuffer = await content.arrayBuffer();
  // Convert ArrayBuffer to Buffer
  const buffer = Buffer.from(arrayBuffer);
  // Try UTF-8 first, then fall back to GBK if it fails
  let str: string;
  try {
    str = iconv.decode(buffer, "utf-8");
    // Simple check if the decoded content makes sense
    if (!str.includes("支付宝") && !str.includes("交易号")) {
      throw new Error("UTF-8 decoding may be incorrect, trying GBK");
    }
  } catch (e) {
    console.log("Falling back to GBK encoding");
    str = iconv.decode(buffer, "GBK");
  }
  await fsp.writeFile("temp_res", str);
  // read line by line
  const fileStream = fs.createReadStream("temp_res");
  const rl = readline.createInterface({
    input: fileStream,
  });
  // remove unused line of csv
  let realContent = "";
  let belowAreRealContent = false;
  for await (let input of rl) {
    if (input.startsWith("--")) {
      belowAreRealContent = input.includes("支付宝");
    } else if (belowAreRealContent) {
      // remove the last ',' of the line
      if (input.endsWith(",")) {
        input = input.substring(0, input.length - 1);
      }
      realContent += input + "\n";
    }
  }
  await fsp.unlink("temp_res"); //delete the temp file
  const records = parse(realContent, {
    delimiter: ",",
    columns: true,
    trim: true,
    relax_column_count: true,
    skip_empty_lines: true,
  }) as Record<string, string>[];
  const transactions: Record<string, string>[] = [];
  for (const record of records) {
    const transaction: Record<string, string> = {};
    if (record["交易时间"] === "") {
      continue;
    }

    transaction["日期"] = parseDate(record["交易时间"] || "");
    transaction["描述"] = record["商品说明"] || "";
    transaction["账户"] = (record["收/付款方式"] || "/").split("(")[0];
    // 过滤描述包含亲情卡的记录
    if (
      transaction["描述"].includes("亲情卡") ||
      transaction["描述"].includes("亲属卡")
    ) {
      continue;
    }

    transaction["交易对方"] = record["交易对方"] || "";
    const amount = parseFloat(record["金额"] || "0");
    transaction["分类"] = await mapCategory(
      record["交易分类"] || "",
      record["商品说明"] || "",
      record["交易对方"] || "",
      amount,
      categoryMap,
      smartCategory,
    );
    transaction["转账"] = "";
    if (record["收/支"] === "支出") {
      const fee = -Math.abs(amount);
      transaction["金额"] = fee.toString();
    } else {
      // 退款， 收入 统一为正
      transaction["金额"] = Math.abs(amount).toString() || "0";
    }
    transaction["标签"] = "";
    transaction["备注"] = record["备注"] || "";
    transaction["账单人"] = owner;
    transaction["来源"] = "支付宝";
    transactions.push(transaction);
  }
  return { transactions };
}

// 处理微信账单
export async function processWechat(
  content: Buffer,
  accountMap: Record<string, string>,
  categoryMap: Record<string, string[]>,
  owner: string,
  smartCategory: boolean,
) {
  const workbook = XLSX.read(content, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  // 找到表头行
  let headerIndex = -1;
  for (let i = 0; i < jsonData.length; i++) {
    const row = jsonData[i] as string[];
    if (row && row.length > 0 && row.includes("交易时间")) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    throw new Error("无法找到数据表头，请检查xlsx文件格式");
  }

  const headers = jsonData[headerIndex] as string[];
  type ExcelRow = (string | number | boolean | Date | null)[];

  const dataRows = (jsonData as ExcelRow[])
    .slice(headerIndex + 1)
    .filter((row): row is ExcelRow => Array.isArray(row) && row.length > 0);

  const records = dataRows.map((row) => {
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      const value = row[index];
      record[header] =
        value !== null && value !== undefined ? String(value) : "";
    });
    return record;
  });

  const transactions: Record<string, string>[] = [];
  for (const record of records) {
    if (record["交易时间"] === "") {
      continue;
    }
    const transaction: Record<string, string> = {};
    transaction["日期"] = parseDate(record["交易时间"] || "");
    transaction["描述"] = record["商品"] || "";
    transaction["账户"] = (record["支付方式"] || "/").split("(")[0];
    // 过滤描述包含亲情卡的记录
    if (
      transaction["描述"].includes("亲情卡") ||
      transaction["描述"].includes("亲属卡")
    ) {
      continue;
    }

    transaction["交易对方"] = record["交易对方"] || "";
    const amount = parseFloat((record["金额(元)"] || "0").replace("¥", ""));
    transaction["分类"] = await mapCategory(
      record["交易类型"] || "",
      record["商品"] || "",
      record["交易对方"] || "",
      amount,
      categoryMap,
      smartCategory,
    );
    transaction["转账"] = "";
    if (record["收/支"] === "支出") {
      const fee = -Math.abs(amount);
      transaction["金额"] = fee.toString();
    } else {
      transaction["金额"] = (record["金额(元)"] || "0").replace("¥", "");
    }
    transaction["标签"] = "";
    transaction["备注"] = record["备注"] || "";
    transaction["账单人"] = owner;
    transaction["来源"] = "微信";
    transactions.push(transaction);
  }

  return { transactions };
}

// 按月份分组并保存交易数据
export function saveTransactionsByMonth(
  transactions: Record<string, string>[],
  platform: string,
  owner: string,
) {
  // 按年月分组交易
  const transactionsByMonth: Record<
    string,
    Record<string, Record<string, string>[]>
  > = {};

  // 遍历所有交易，按年月分组
  for (const transaction of transactions) {
    const date = new Date(transaction["日期"]);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");

    if (!transactionsByMonth[year]) {
      transactionsByMonth[year] = {};
    }
    if (!transactionsByMonth[year][month]) {
      transactionsByMonth[year][month] = [];
    }

    transactionsByMonth[year][month].push(transaction);
  }

  // 保存每个月的交易
  const savedFiles: Array<{ filepath: string; count: number }> = [];
  for (const [year, months] of Object.entries(transactionsByMonth)) {
    for (const [month, monthlyTransactions] of Object.entries(months)) {
      if (monthlyTransactions.length > 0) {
        const savedFile = saveData(
          monthlyTransactions,
          parseInt(year),
          parseInt(month),
          platform,
          owner,
        );
        savedFiles.push(savedFile);
      }
    }
  }

  return savedFiles;
}

// 保存数据到指定年月
export function saveData(
  transactions: Record<string, string>[],
  year: number,
  month: number,
  platform: string,
  owner: string,
) {
  // 确保年份目录存在
  const yearDir = DATA_PATHS.ensureYearDirectory(year);

  // 构建文件路径
  const monthStr = month.toString().padStart(2, "0");
  const filename = `${year}${monthStr}_${platform}_${Math.random().toString(36).substring(2, 8)}.csv`;

  // 确保每条记录都有账单人
  transactions = transactions.map((transaction) => {
    // 确保账单人字段存在且不为空
    const transactionOwner = transaction["账单人"]?.trim() || owner;
    return {
      ...transaction,
      账单人: transactionOwner,
      // 确保owner字段也设置，用于后端的兼容性
      // owner: transactionOwner,
      // 平台: platformMap[platform as keyof typeof platformMap] || platform,
    };
  });
  const filepath = path.join(yearDir, filename);

  // 合并到月份文件
  const monthPath = path.join(yearDir, `${monthStr}.csv`);
  try {
    const monthContent = readFileSync(monthPath, "utf8");
    const monthTransactions = parse(monthContent, {
      delimiter: ",",
      columns: true,
      trim: true,
      relax_column_count: true,
    }) as Record<string, string>[];

    const mergedData = [...monthTransactions, ...transactions];
    const mergedOutput = stringify(mergedData, {
      header: true,
      columns: [
        "账户",
        "转账",
        "描述",
        "交易对方",
        "分类",
        "日期",
        "备注",
        "标签",
        "金额",
        "账单人",
        "来源",
      ],
    });
    writeFileSync(monthPath, mergedOutput);
  } catch (error) {
    // 如果文件不存在，创建新文件
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      writeFileSync(
        monthPath,
        stringify(transactions, {
          header: true,
          columns: [
            "账户",
            "转账",
            "描述",
            "交易对方",
            "分类",
            "日期",
            "备注",
            "标签",
            "金额",
            "账单人",
            "来源",
          ],
        }),
      );
    } else {
      console.error("Error processing month file:", error);
    }
  }

  return { filepath, count: transactions.length };
}

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
    const outputPath = null;
    if (platform === "alipay") {
      // 处理支付宝 CSV 文件
      console.log("Processing Alipay CSV file...");
      const content = await file.text();
      console.log("File content length:", content.length);
      const alipayResult = await processAlipay(
        file,
        accountMap,
        categoryMap,
        owner,
        smartCategory,
      );
      await saveTransactionsByMonth(alipayResult.transactions, "alipay", owner);
      transactions = [...transactions, ...alipayResult.transactions];
    } else if (platform === "wechat") {
      // 处理微信 XLSX 文件
      console.log("Processing Wechat XLSX file...");
      const buffer = Buffer.from(await file.arrayBuffer());
      console.log("File buffer length:", buffer.length);
      const wechatResult = await processWechat(
        buffer,
        accountMap,
        categoryMap,
        owner,
        smartCategory,
      );
      await saveTransactionsByMonth(wechatResult.transactions, "wechat", owner);
      transactions = [...transactions, ...wechatResult.transactions];
    }

    if (transactions.length === 0) {
      return NextResponse.json(
        { error: "未找到有效的交易记录" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      message: `成功导入 ${transactions.length} 条记录`,
      count: transactions.length,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "处理文件时出错" },
      { status: 500 },
    );
  }
}
