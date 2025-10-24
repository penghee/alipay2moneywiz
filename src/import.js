#!/usr/bin/env node
import * as fsp from "fs/promises";
import * as fs from "fs";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";
import iconv from "iconv-lite";
import * as readline from "node:readline";
import path from "path";
import XLSX from "xlsx";

// 全局变量
let ACCOUNT_MAP;
let CATEGORY_MAP;
let CATEGORIES;

// 初始化全局数据
async function initGlobalData() {
  try {
    const accountData = await fsp.readFile("account_map.json", "utf8");
    const categoryData = await fsp.readFile("category_map.json", "utf8");

    ACCOUNT_MAP = JSON.parse(accountData);
    CATEGORY_MAP = JSON.parse(categoryData);
    CATEGORIES = Object.keys(CATEGORY_MAP);
  } catch (err) {
    console.error("初始化全局数据失败:", err);
    throw err;
  }
}

// 解析日期
function parseDate(dateStr) {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// 映射账户
function mapAccount(recordStr) {
  for (const key in ACCOUNT_MAP) {
    if (recordStr.includes(key)) {
      return ACCOUNT_MAP[key];
    }
  }
  return "未知账户";
}

// 映射分类
function mapCategory(transactionType, product, counterparty) {
  const searchText = `${transactionType} ${product} ${counterparty}`.toLowerCase();
  
  for (const category of CATEGORIES) {
    const keywords = CATEGORY_MAP[category];
    for (const keyword of keywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        return category;
      }
    }
  }
  return "其他";
}

// 处理支付宝账单
async function processAlipay(filePath) {
  const file = await fsp.readFile(filePath, { encoding: "binary" });
  let buf = Buffer.from(file, "binary");
  let str = iconv.decode(buf, "UTF-8");
  await fsp.writeFile("temp_res", str);

  const fileStream = fs.createReadStream("temp_res");
  const rl = readline.createInterface({
    input: fileStream,
  });

  let realContent = "";
  let belowAreRealContent = false;
  for await (let input of rl) {
    if (input.startsWith("--")) {
      belowAreRealContent = input.includes("支付宝");
    } else if (belowAreRealContent) {
      if (input.endsWith(",")) {
        input = input.substring(0, input.length - 1);
      }
      realContent += input + "\n";
    }
  }
  await fsp.unlink("temp_res");

  const records = parse(realContent, {
    delimiter: ",",
    columns: true,
    trim: true,
    relax_column_count: true, // 允许列数不一致
  skip_empty_lines: true,   // 跳过空行
  });
  const transactions = [];
  for (const record of records) {
    let transaction = {};
    transaction["日期"] = parseDate(record["交易时间"]);
    transaction["描述"] = record["商品说明"];
    transaction["账户"] = mapAccount(record["收/付款方式"]);
    
    if (record["收/支"] == "收入" || record["收/支"] == "支出") {
      transaction["交易对方"] = "";
      transaction["分类"] = mapCategory(
        record["交易分类"],
        record["商品说明"],
        record["交易对方"]
      );
      transaction["转账"] = "";
      if (record["收/支"] == "支出") {
        const fee = -Math.abs(record["金额"]);
        transaction["金额"] = fee.toString();
      } else if (record["收/支"] == "收入") {
        transaction["金额"] = record["金额"];
      }
    } else {
      transaction["交易对方"] = "";
      transaction["分类"] = mapCategory(
        record["交易分类"],
        record["商品说明"],
        record["交易对方"]
      );
      transaction["转账"] = mapAccount(record["交易对方"]);
      if (record["商品说明"].includes("还款")) {
        const fee = -Math.abs(record["金额"]);
        transaction["金额"] = fee.toString();
      } else {
        transaction["金额"] = record["金额"];
      }
    }
    transaction["标签"] = "";
    transaction["备注"] = "";
    transactions.push(transaction);
  }

  return transactions;
}

// 处理微信账单
async function processWechat(filePath) {
  // 处理xlsx文件
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0]; // 取第一个sheet
  const worksheet = workbook.Sheets[sheetName];

  // 转换为数组格式
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  // 找到表头行（包含"交易时间"等字段的行）
  let headerIndex = -1;
  for (let i = 0; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (row && row.length > 0 && row.includes("交易时间")) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    throw new Error("无法找到数据表头，请检查xlsx文件格式");
  }

  // 提取表头和数据
  const headers = jsonData[headerIndex];
  const dataRows = jsonData
    .slice(headerIndex + 1)
    .filter((row) => row && row.length > 0);

  // 转换为对象数组
  const records = dataRows.map((row) => {
    const record = {};
    headers.forEach((header, index) => {
      record[header] = row[index] || "";
    });
    return record;
  });

  const transactions = [];
  for (const record of records) {
    let transaction = {};
    transaction["日期"] = parseDate(record["交易时间"]);
    transaction["描述"] = record["商品"];
    transaction["账户"] = mapAccount(record["支付方式"]);
    
    if (record["收/支"] == "收入" || record["收/支"] == "支出") {
      transaction["交易对方"] = "";
      transaction["分类"] = mapCategory(
        record["交易类型"],
        record["商品"],
        record["交易对方"]
      );
      transaction["转账"] = "";
      if (record["收/支"] == "支出") {
        const fee = -Math.abs(parseFloat(record["金额(元)"].replace("¥", "")));
        transaction["金额"] = fee.toString();
      } else if (record["收/支"] == "收入") {
        transaction["金额"] = record["金额(元)"].replace("¥", "");
      }
    } else {
      transaction["交易对方"] = "";
      transaction["分类"] = mapCategory(
        record["交易类型"],
        record["商品"],
        record["交易对方"]
      );
      transaction["转账"] = mapAccount(record["交易对方"]);
      transaction["金额"] = record["金额(元)"].replace("¥", "");
    }
    transaction["标签"] = "";
    transaction["备注"] = "";
    transactions.push(transaction);
  }

  return transactions;
}

// 保存数据到指定路径
async function saveData(transactions, year, month, platform) {
  const dataDir = path.join(process.cwd(), "data", year.toString());
  await fsp.mkdir(dataDir, { recursive: true });

  const outputPath = path.join(dataDir, `${String(month).padStart(2, "0")}_${platform}.csv`);
  
  const output = stringify(transactions, {
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
    ],
  });

  await fsp.writeFile(outputPath, output);

  // 每月多平台聚合，自动追加到月份文件后
  const monthPath = path.join(dataDir, `${String(month).padStart(2, "0")}.csv`);
  if (!fs.existsSync(monthPath)) {
    await fsp.writeFile(monthPath, output);
    return outputPath;
  }
  const monthContent = await fsp.readFile(monthPath, "utf8");
  const monthTransactions = parse(monthContent, {
    delimiter: ",",
    columns: true,
    trim: true,
    relax_column_count: true,
    skip_empty_lines: true,
  });
  monthTransactions.push(...transactions);
  const monthOutput = stringify(monthTransactions, {
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
    ],
  });
  await fsp.writeFile(monthPath, monthOutput);
  return outputPath;
}

// 解析命令行参数
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    file: null,
    platform: null,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--file" && i + 1 < args.length) {
      options.file = args[i + 1];
      i++;
    } else if (args[i] === "--platform" && i + 1 < args.length) {
      options.platform = args[i + 1];
      i++;
    }
  }

  return options;
}

// 主函数
async function main() {
  try {
    await initGlobalData();

    const options = parseArgs();

    if (!options.file || !options.platform) {
      console.error("❌ 缺少必要参数");
      console.log("\n使用方法:");
      console.log("  npm run import -- --file <文件路径> --platform <平台>");
      console.log("\n示例:");
      console.log("  npm run import -- --file ~/Downloads/alipay_2024_01.csv --platform alipay");
      console.log("\n支持的平台: alipay, wechat");
      process.exit(1);
    }

    // 展开 ~ 路径
    const filePath = options.file.replace(/^~/, process.env.HOME);

    if (!fs.existsSync(filePath)) {
      console.error(`❌ 文件不存在: ${filePath}`);
      process.exit(1);
    }

    console.log(`\n正在处理 ${options.platform} 账单...`);

    let transactions;
    if (options.platform === "alipay") {
      transactions = await processAlipay(filePath);
    } else if (options.platform === "wechat") {
      transactions = await processWechat(filePath);
    } else {
      console.error(`❌ 不支持的平台: ${options.platform}`);
      process.exit(1);
    }

    console.log(`✓ 成功解析 ${transactions.length} 条记录`);

    // 自动分类统计
    const categoryStats = {};
    transactions.forEach(t => {
      const category = t["分类"];
      categoryStats[category] = (categoryStats[category] || 0) + 1;
    });
    console.log(`✓ 自动分类完成`);

    // 从第一条记录获取年月信息
    if (transactions.length > 0) {
      const firstDate = new Date(transactions[0]["日期"]);
      const year = firstDate.getFullYear();
      const month = firstDate.getMonth() + 1;

      const outputPath = await saveData(transactions, year, month, options.platform);
      console.log(`✓ 保存到 ${outputPath}`);
    } else {
      console.log("⚠️  没有找到任何交易记录");
    }

  } catch (err) {
    console.error("❌ 处理过程中出错:", err);
    process.exit(1);
  }
}

main();
