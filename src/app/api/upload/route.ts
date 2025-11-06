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

// 读取映射文件
function loadMaps() {
  const accountMap = JSON.parse(
    readFileSync(DATA_PATHS.maps.account(), "utf8"),
  );
  const categoryMap = JSON.parse(
    readFileSync(DATA_PATHS.maps.category(), "utf8"),
  );

  return { accountMap, categoryMap };
}

// 解析日期
function parseDate(dateStr: string): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// 映射账户
function mapAccount(
  recordStr: string,
  accountMap: Record<string, string>,
): string {
  if (!recordStr || typeof recordStr !== "string") {
    return "未知账户";
  }
  for (const key in accountMap) {
    if (recordStr.includes(key)) {
      return accountMap[key];
    }
  }
  return "未知账户";
}

// 映射分类
function mapCategory(
  transactionType: string,
  product: string,
  counterparty: string,
  categoryMap: Record<string, string[]>,
): string {
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
  return "其他";
}

// 处理支付宝账单
async function processAlipay(
  content: File,
  accountMap: Record<string, string>,
  categoryMap: Record<string, string[]>,
  owner: string,
) {
  // 支付宝 CSV 文件前面有元数据，需要提取真实的交易数据
  // transfer GBK to utf-8
  // Convert the File to an ArrayBuffer
  const arrayBuffer = await content.arrayBuffer();
  // Convert ArrayBuffer to Buffer
  const buffer = Buffer.from(arrayBuffer);
  const str = iconv.decode(buffer, "GBK");
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
    transaction["日期"] = parseDate(record["交易时间"] || "");
    transaction["描述"] = record["商品说明"] || "";
    transaction["账户"] = mapAccount(record["收/付款方式"] || "", accountMap);
    // 过滤描述包含亲情卡的记录
    if (transaction["描述"].includes("亲情卡")) {
      continue;
    }
    if (record["收/支"] === "收入" || record["收/支"] === "支出") {
      transaction["交易对方"] = "";
      transaction["分类"] = mapCategory(
        record["交易分类"] || "",
        record["商品说明"] || "",
        record["交易对方"] || "",
        categoryMap,
      );
      transaction["转账"] = "";
      if (record["收/支"] === "支出") {
        const fee = -Math.abs(parseFloat(record["金额"] || "0"));
        transaction["金额"] = fee.toString();
      } else if (record["收/支"] === "收入") {
        transaction["金额"] = record["金额"] || "0";
      }
    } else {
      transaction["交易对方"] = "";
      transaction["分类"] = mapCategory(
        record["交易分类"] || "",
        record["商品说明"] || "",
        record["交易对方"] || "",
        categoryMap,
      );
      transaction["转账"] = mapAccount(record["交易对方"] || "", accountMap);
      if ((record["商品说明"] || "").includes("还款")) {
        const fee = -Math.abs(parseFloat(record["金额"] || "0"));
        transaction["金额"] = fee.toString();
      } else {
        transaction["金额"] = record["金额"] || "0";
      }
    }
    transaction["标签"] = "";
    transaction["备注"] = "";
    transaction["账单人"] = owner;
    transactions.push(transaction);
  }
  return { transactions };
}

// 处理微信账单
function processWechat(
  content: Buffer,
  accountMap: Record<string, string>,
  categoryMap: Record<string, string[]>,
  owner: string,
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
    const transaction: Record<string, string> = {};
    transaction["日期"] = parseDate(record["交易时间"] || "");
    transaction["描述"] = record["商品"] || "";
    transaction["账户"] = mapAccount(record["支付方式"] || "", accountMap);
    // 过滤描述包含亲情卡的记录
    if (transaction["描述"].includes("亲情卡")) {
      continue;
    }

    if (record["收/支"] === "收入" || record["收/支"] === "支出") {
      transaction["交易对方"] = "";
      transaction["分类"] = mapCategory(
        record["交易类型"] || "",
        record["商品"] || "",
        record["交易对方"] || "",
        categoryMap,
      );
      transaction["转账"] = "";
      if (record["收/支"] === "支出") {
        const fee = -Math.abs(
          parseFloat((record["金额(元)"] || "0").replace("¥", "")),
        );
        transaction["金额"] = fee.toString();
      } else if (record["收/支"] === "收入") {
        transaction["金额"] = (record["金额(元)"] || "0").replace("¥", "");
      }
    } else {
      transaction["交易对方"] = "";
      transaction["分类"] = mapCategory(
        record["交易类型"] || "",
        record["商品"] || "",
        record["交易对方"] || "",
        categoryMap,
      );
      transaction["转账"] = mapAccount(record["交易对方"] || "", accountMap);
      transaction["金额"] = (record["金额(元)"] || "0").replace("¥", "");
    }
    transaction["标签"] = "";
    transaction["备注"] = "";
    transaction["账单人"] = owner;
    transactions.push(transaction);
  }

  return { transactions };
}

// 按月份分组并保存交易数据
function saveTransactionsByMonth(
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
function saveData(
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
      owner: transactionOwner,
    };
  });
  const filepath = path.join(yearDir, filename);

  // 检查文件是否存在并读取现有数据
  let existingData: Record<string, string>[] = [];
  try {
    const content = readFileSync(filepath, "utf8");
    if (content.trim()) {
      const parsedData = parse(content, {
        columns: true,
        skip_empty_lines: true,
      }) as Record<string, string>[];

      // Convert to the correct type and ensure all records have the bill owner field
      existingData = parsedData.map((record) => ({
        ...record,
        账单人: record["账单人"] || owner,
      }));

      // 确保现有数据有账单人字段
      existingData = existingData.map((record) => ({
        ...record,
        账单人: record["账单人"] || owner,
      }));
    }
  } catch (error) {
    // 文件不存在或其他错误，继续使用空数组
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      console.error("Error reading existing data:", error);
    }
  }

  // 合并现有数据和新数据
  const allData = [...existingData, ...transactions];

  // 保存数据
  const output = stringify(allData, {
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
    ],
  });
  writeFileSync(filepath, output);

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
      const { transactions: alipayTransactions } = await processAlipay(
        file,
        accountMap,
        categoryMap,
        owner,
      );
      await saveTransactionsByMonth(alipayTransactions, "alipay", owner);
      transactions = [...transactions, ...alipayTransactions];
    } else if (platform === "wechat") {
      // 处理微信 XLSX 文件
      console.log("Processing Wechat XLSX file...");
      const buffer = Buffer.from(await file.arrayBuffer());
      console.log("File buffer length:", buffer.length);
      const { transactions: wechatTransactions } = processWechat(
        buffer,
        accountMap,
        categoryMap,
        owner,
      );
      await saveTransactionsByMonth(wechatTransactions, "wechat", owner);
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
      message: `成功导入 ${transactions.length} 条记录`,
      records: transactions.length,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "处理文件时出错" },
      { status: 500 },
    );
  }
}
