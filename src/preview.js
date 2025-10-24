#!/usr/bin/env node
import * as fsp from "fs/promises";
import * as fs from "fs";
import { parse } from "csv-parse/sync";
import path from "path";

// 格式化金额
function formatMoney(amount) {
  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Math.abs(amount));
}

// 读取CSV文件
async function readCSV(filePath) {
  const content = await fsp.readFile(filePath, 'utf8');
  const records = parse(content, {
    delimiter: ",",
    columns: true,
    trim: true,
  });
  return records;
}

// 计算月度统计
async function calculateMonthlyStats(year, month) {
  const dataDir = path.join(process.cwd(), "data", year.toString());
  const filePath = path.join(dataDir, `${String(month).padStart(2, "0")}.csv`);

  if (!fs.existsSync(filePath)) {
    throw new Error(`数据文件不存在: ${filePath}`);
  }

  const transactions = await readCSV(filePath);

  let income = 0;
  let expense = 0;
  const categoryStats = {};

  transactions.forEach(t => {
    const amount = parseFloat(t["金额"]);
    const category = t["分类"];

    if (amount > 0) {
      income += amount;
    } else {
      expense += Math.abs(amount);
      
      if (!categoryStats[category]) {
        categoryStats[category] = {
          amount: 0,
          count: 0
        };
      }
      categoryStats[category].amount += Math.abs(amount);
      categoryStats[category].count += 1;
    }
  });

  return {
    income,
    expense,
    balance: income - expense,
    categoryStats,
    totalTransactions: transactions.length
  };
}

// 计算年度统计
async function calculateYearlyStats(year) {
  const dataDir = path.join(process.cwd(), "data", year.toString());

  if (!fs.existsSync(dataDir)) {
    throw new Error(`数据目录不存在: ${dataDir}`);
  }

  const files = await fsp.readdir(dataDir);
  const csvFiles = files.filter(f => {
    return !(f.includes("alipay") || f.includes("wechat"))
  }).filter(f => f.endsWith('.csv')).sort();

  let totalIncome = 0;
  let totalExpense = 0;
  const monthlyData = [];

  for (const file of csvFiles) {
    const month = parseInt(file.replace('.csv', ''));
    const filePath = path.join(dataDir, file);
    const transactions = await readCSV(filePath);

    let monthIncome = 0;
    let monthExpense = 0;

    transactions.forEach(t => {
      const amount = parseFloat(t["金额"]);
      if (amount > 0) {
        monthIncome += amount;
      } else {
        monthExpense += Math.abs(amount);
      }
    });

    totalIncome += monthIncome;
    totalExpense += monthExpense;

    monthlyData.push({
      month,
      income: monthIncome,
      expense: monthExpense,
      balance: monthIncome - monthExpense
    });
  }

  return {
    totalIncome,
    totalExpense,
    totalBalance: totalIncome - totalExpense,
    monthlyData
  };
}

// 打印月度报告
function printMonthlyReport(year, month, stats) {
  console.log(`\n📊 ${year}年${month}月 账单统计`);
  console.log("━".repeat(42));
  console.log(`收入总计: ¥${formatMoney(stats.income)}`);
  console.log(`支出总计: ¥${formatMoney(stats.expense)}`);
  console.log(`结余: ¥${formatMoney(stats.balance)}`);
  console.log();
  console.log("支出分类明细:");

  // 准备表格数据
  const rows = Object.entries(stats.categoryStats)
    .map(([category, data]) => ({
      category,
      amount: data.amount,
      percentage: (data.amount / stats.expense * 100).toFixed(1),
      count: data.count
    }))
    .sort((a, b) => b.amount - a.amount);

  // 打印表格
  console.log("┌──────────┬──────────┬────────┬────────┐");
  console.log("│ 分类     │ 金额     │ 占比   │ 笔数   │");
  console.log("├──────────┼──────────┼────────┼────────┤");
  
  rows.forEach(row => {
    const category = row.category.padEnd(8, ' ');
    const amount = formatMoney(row.amount).padStart(8, ' ');
    const percentage = `${row.percentage}%`.padStart(6, ' ');
    const count = row.count.toString().padStart(6, ' ');
    console.log(`│ ${category} │ ${amount} │ ${percentage} │ ${count} │`);
  });
  
  console.log("└──────────┴──────────┴────────┴────────┘");
  console.log();
}

// 打印年度报告
function printYearlyReport(year, stats) {
  console.log(`\n📊 ${year}年 全年统计`);
  console.log("━".repeat(42));
  console.log(`收入总计: ¥${formatMoney(stats.totalIncome)}`);
  console.log(`支出总计: ¥${formatMoney(stats.totalExpense)}`);
  console.log(`结余: ¥${formatMoney(stats.totalBalance)}`);
  console.log();
  console.log("月度趋势:");

  // 打印表格
  console.log("┌────────┬──────────┬──────────┬──────────┐");
  console.log("│ 月份   │ 收入     │ 支出     │ 结余     │");
  console.log("├────────┼──────────┼──────────┼──────────┤");
  
  stats.monthlyData.forEach(data => {
    const month = `${String(data.month).padStart(2, '0')}月`.padEnd(6, ' ');
    const income = formatMoney(data.income).padStart(8, ' ');
    const expense = formatMoney(data.expense).padStart(8, ' ');
    const balance = formatMoney(data.balance).padStart(8, ' ');
    console.log(`│ ${month} │ ${income} │ ${expense} │ ${balance} │`);
  });
  
  console.log("└────────┴──────────┴──────────┴──────────┘");
  console.log();
}

// 解析命令行参数
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    year: null,
    month: null,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--year" && i + 1 < args.length) {
      options.year = parseInt(args[i + 1]);
      i++;
    } else if (args[i] === "--month" && i + 1 < args.length) {
      options.month = parseInt(args[i + 1]);
      i++;
    }
  }

  return options;
}

// 主函数
async function main() {
  try {
    const options = parseArgs();

    if (!options.year) {
      console.error("❌ 缺少必要参数");
      console.log("\n使用方法:");
      console.log("  npm run preview -- --year <年份> [--month <月份>]");
      console.log("\n示例:");
      console.log("  npm run preview -- --year 2024 --month 1  # 查看月度数据");
      console.log("  npm run preview -- --year 2024            # 查看年度数据");
      process.exit(1);
    }

    if (options.month) {
      // 月度统计
      const stats = await calculateMonthlyStats(options.year, options.month);
      printMonthlyReport(options.year, options.month, stats);
    } else {
      // 年度统计
      const stats = await calculateYearlyStats(options.year);
      printYearlyReport(options.year, stats);
    }

  } catch (err) {
    console.error("❌ 处理过程中出错:", err.message);
    process.exit(1);
  }
}

main();
