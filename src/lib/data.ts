import { parse } from "csv-parse/sync";
import { readFileSync, readdirSync, existsSync } from "fs";
import path from "path";
import ownersData from "@/config/bill_owners.json";
import categoryMap from "@/config/category_map.json";
import { getDataDirectory, getYearDataDirectory } from "@/config/paths";
import { generateSankeyData } from "./sankeyUtils";
import {
  MonthlyStats,
  Expense,
  CategoryStats,
  CategoryMonthlyData,
  CategoryYearlyStats,
  YearlyStats,
} from "@/types/api";

export interface Transaction {
  账户: string;
  转账: string;
  描述: string;
  交易对方: string;
  分类: string;
  日期: string;
  备注: string;
  标签: string;
  金额: string;
  owner?: string;
  账单人?: string;
  来源?: string;
}

// 读取CSV文件
export function readCSV(filePath: string): Transaction[] {
  const content = readFileSync(filePath, "utf8");
  const records = parse(content, {
    delimiter: ",",
    columns: true,
    trim: true,
  }) as Transaction[];

  // Map the 账单人 field to owner
  return records.map((record) => ({
    ...record,
    owner: record["账单人"] || "",
  })) as Transaction[];
}

// 读取并过滤CSV文件
function readAndFilterCSVFiles(dirPath: string): Transaction[] {
  const files = readdirSync(dirPath);
  const transactions: Transaction[] = [];

  // 过滤掉文件名中包含下划线的文件
  const validFiles = files.filter((file) => {
    const filename = path.basename(file, path.extname(file));
    return (
      file.endsWith(".csv") &&
      !filename.includes("_") &&
      !(filename.includes("alipay") || filename.includes("wechat"))
    );
  });

  // 读取所有有效的CSV文件
  for (const file of validFiles) {
    const filePath = path.join(dirPath, file);
    try {
      const fileTransactions = readCSV(filePath);
      transactions.push(...fileTransactions);
    } catch (error) {
      console.error(`Error reading file ${file}:`, error);
    }
  }

  return transactions;
}

// 获取所有者名称映射
function getOwnerName(ownerId: string): string {
  try {
    const owners = ownersData.owners as Array<{ id: string; name: string }>;
    const owner = owners.find((o) => o.id === ownerId);
    return owner ? owner.name : ownerId; // Return the ID if not found
  } catch (error) {
    console.error("Error loading owner mapping:", error);
    return ownerId; // Fallback to ID if there's an error
  }
}

function isExpense(transaction: Transaction): boolean {
  const amount = parseFloat(transaction.金额);
  // 分类的交易为退款的金额为正
  const categoryName = transaction.分类 || "";
  const categoryKeys = Object.keys(categoryMap);
  if (categoryMap && categoryKeys.includes(categoryName)) {
    return true;
  }
  return amount < 0;
}

function getCategoryStats(
  categoryStats: Record<string, CategoryStats>,
): Record<string, CategoryStats> {
  return Object.entries(categoryStats)
    .map(([category, stats]) => ({
      ...stats,
      category,
      amount: Math.abs(stats.amount),
    }))
    .reduce(
      (acc, stats) => {
        acc[stats.category] = stats;
        return acc;
      },
      {} as Record<string, CategoryStats>,
    );
}

// 计算月度统计
export function calculateMonthlyStats(
  year: number,
  month: number,
  ownerId?: string,
): MonthlyStats {
  const dataDir = getYearDataDirectory(year);
  const filePath = path.join(dataDir, `${String(month).padStart(2, "0")}.csv`);

  if (!existsSync(filePath)) {
    throw new Error(`数据文件不存在: ${filePath}`);
  }

  const transactions = readCSV(filePath);

  let income = 0;
  let expense = 0;
  let totalSalary = 0;
  const categoryStats: Record<string, CategoryStats> = {};
  const expenses: Expense[] = [];

  transactions.forEach((t, index) => {
    // Skip transactions that don't match the owner filter
    if (ownerId) {
      const ownerName = getOwnerName(ownerId);
      if (t.owner !== ownerName) {
        return;
      }
    }

    const amount = parseFloat(t.金额);
    const category = t.分类;

    // Add salary transactions to salary array (positive amount for income)
    if (["工资", "salary"].includes(category) && amount > 0) {
      totalSalary += amount;
    }

    if (!isExpense(t)) {
      income += amount;
    } else {
      // const absAmount = Math.abs(amount);
      expense += amount;

      // Add to expenses array
      const expenseItem = {
        id: `${year}-${String(month).padStart(2, "0")}-${index}`,
        amount: amount,
        isRefund: amount > 0,
        category,
        date: t["日期"],
        description: t["描述"] || t["交易对方"] || "无描述",
        tags: t["标签"] || "",
        owner: t["账单人"] || "",
        remark: t["备注"] || "",
        merchant: t["交易对方"] || "",
        source: t["来源"] || "",
        account: t["账户"] || "",
      };
      expenses.push(expenseItem);

      // Update category stats
      if (!categoryStats[category]) {
        categoryStats[category] = {
          amount: 0,
          count: 0,
          expenses: [],
        };
      }
      categoryStats[category].amount += amount;
      categoryStats[category].count += 1;
      categoryStats[category].expenses.push(expenseItem);
    }
  });

  // Generate Sankey data
  const otherIncome = Math.max(0, income - totalSalary);
  const categoryStatsAbs = getCategoryStats(categoryStats);
  const sankeyData = generateSankeyData({
    categoryStats: categoryStatsAbs,
    totalIncome: income,
    totalExpense: Math.abs(expense),
    totalSalary,
    otherIncome,
  });

  return {
    income,
    expense: Math.abs(expense),
    balance: income - Math.abs(expense),
    categoryStats: categoryStatsAbs,
    totalTransactions: expenses.length,
    expenses,
    totalSalary,
    sankeyData,
  };
}

// 计算年度统计
export function calculateYearlyStats(
  year: number,
  ownerId?: string,
): YearlyStats {
  const dataDir = getYearDataDirectory(year);

  if (!existsSync(dataDir)) {
    throw new Error(`数据目录不存在: ${dataDir}`);
  }

  const files = readdirSync(dataDir);
  const csvFiles = files
    .filter((f) => {
      return !(f.includes("alipay") || f.includes("wechat"));
    })
    .filter((f) => f.endsWith(".csv"))
    .sort();

  let totalIncome = 0;
  let totalExpense = 0;
  let totalSalary = 0;

  const categoryStats: Record<string, CategoryStats> = {};
  const monthlyData: Array<{
    month: number;
    income: number;
    expense: number;
    balance: number;
    salary: number;
  }> = [];
  // Prepare expenses data
  const expenses: Expense[] = [];

  for (const file of csvFiles) {
    const month = parseInt(file.replace(".csv", ""));
    const filePath = path.join(dataDir, file);
    const transactions = readCSV(filePath);

    let monthIncome = 0;
    let monthExpense = 0;
    let monthSalary = 0;

    transactions.forEach((t, index) => {
      const amount = parseFloat(t["金额"]);
      // Skip transactions that don't match the owner filter
      if (ownerId && ownerId !== "all") {
        const ownerName = getOwnerName(ownerId);
        // Check both owner fields for backward compatibility
        if (t.owner !== ownerName && t["账单人"] !== ownerName) {
          return;
        }
      }

      const category = t["分类"];

      if (!isExpense(t)) {
        monthIncome += amount;
      } else {
        monthExpense += amount;
        const expense = {
          id: `${year}-${String(month).padStart(2, "0")}-${index}`,
          amount: amount, // Store as positive for consistency
          isRefund: amount > 0,
          category: t["分类"],
          date: t["日期"],
          description: t["描述"] || t["交易对方"] || "无描述",
          tags: t["标签"] || "",
          owner: t["账单人"] || "",
          remark: t["备注"] || "",
          merchant: t["交易对方"] || "",
          source: t["来源"] || "",
          account: t["账户"] || "",
        };
        expenses.push(expense);
        // 聚合分类统计
        if (!categoryStats[category]) {
          categoryStats[category] = {
            amount: 0,
            count: 0,
            expenses: [],
          };
        }
        categoryStats[category].amount += amount;
        categoryStats[category].count += 1;
        categoryStats[category].expenses.push(expense);
      }
      if (category === "工资") {
        monthSalary += amount;
      }
    });

    totalIncome += monthIncome;
    totalExpense += monthExpense;
    totalSalary += monthSalary;
    monthlyData.push({
      month,
      income: monthIncome,
      expense: Math.abs(monthExpense),
      balance: monthIncome - Math.abs(monthExpense),
      salary: monthSalary,
    });
  }

  const categoryStatsAbs = getCategoryStats(categoryStats);

  const sankeyData = generateSankeyData({
    categoryStats: categoryStatsAbs,
    totalIncome,
    totalExpense: Math.abs(totalExpense),
    totalSalary,
    otherIncome: Math.max(0, totalIncome - totalSalary),
  });

  return {
    totalIncome,
    totalExpense: Math.abs(totalExpense),
    totalBalance: totalIncome - Math.abs(totalExpense),
    categoryStats: categoryStatsAbs,
    monthlyData,
    expenses,
    totalSalary,
    sankeyData,
  } as YearlyStats;
}

// 获取可用的年份列表
// 查找最近一次的工资收入
export function findLatestSalary(
  ownerId?: string,
): { amount: number; date: string; category: string } | null {
  try {
    // 获取所有可用的年份，按降序排列
    const years = getAvailableYears();

    // 按从新到旧的顺序检查每年的数据
    for (const year of years) {
      const dataDir = getYearDataDirectory(year);
      const files = readdirSync(dataDir)
        .filter((f) => f.endsWith(".csv"))
        .sort((a, b) => b.localeCompare(a)); // 从新到旧排序

      for (const file of files) {
        const filePath = path.join(dataDir, file);
        const transactions = readCSV(filePath);

        // 查找工资收入（正数且分类为'工资'）
        const salaryTx = transactions.find((t) => {
          // 检查所有者过滤
          if (ownerId && ownerId !== "all") {
            const ownerName = getOwnerName(ownerId);
            if (t.owner !== ownerName && t["账单人"] !== ownerName) {
              return false;
            }
          }

          const amount = parseFloat(t["金额"]);
          const category = t["分类"];
          return amount > 0 && (category === "工资" || category === "salary");
        });

        if (salaryTx) {
          return {
            amount: parseFloat(salaryTx["金额"]),
            date: salaryTx["日期"],
            category: salaryTx["分类"],
          };
        }
      }
    }

    return null;
  } catch (error) {
    console.error("查找工资收入时出错:", error);
    return null;
  }
}

export function getAvailableYears(): number[] {
  const dataDir = getDataDirectory();

  try {
    console.log("Current working directory:", process.cwd());
    console.log("Data directory:", dataDir);

    if (!existsSync(dataDir)) {
      console.log("Data directory does not exist:", dataDir);
      return [];
    }

    const years = readdirSync(dataDir, { withFileTypes: true })
      .filter((item) => item.isDirectory() && !item.name.startsWith("."))
      .filter((dir) => {
        const fullPath = path.join(dataDir, dir.name);
        const files = readdirSync(fullPath);
        return files.some((f) => f.endsWith(".csv"));
      })
      .map((dir) => parseInt(dir.name))
      .filter((year) => !isNaN(year))
      .sort((a, b) => b - a);

    return years;
  } catch (error) {
    console.error("Error reading data directory:", error);
    return [];
  }
}

// 获取指定年份的可用月份
export function getAvailableMonths(year: number, ownerId?: string): number[] {
  const dataDir = getYearDataDirectory(year);

  try {
    if (!existsSync(dataDir)) {
      return [];
    }

    let months = readdirSync(dataDir)
      .filter(
        (f) =>
          f.endsWith(".csv") && !f.includes("alipay") && !f.includes("wechat"),
      )
      .map((f) => parseInt(f.replace(".csv", "")))
      .filter((month) => !isNaN(month));
    // If owner filter is provided, check each month's transactions
    if (ownerId) {
      const ownerName = getOwnerName(ownerId);
      months = months.filter((month) => {
        try {
          const filePath = path.join(
            dataDir,
            `${String(month).padStart(2, "0")}.csv`,
          );
          const transactions = readCSV(filePath);
          return transactions.some((t) => t.owner === ownerName);
        } catch (error) {
          console.error(`Error reading month ${month}:`, error);
          return false;
        }
      });
    }

    months.sort((a, b) => a - b);

    return months;
  } catch (error) {
    console.error("Error reading months directory:", error);
    return [];
  }
}

// 计算分类年度统计（按月聚合）
export function calculateCategoryYearlyStats(
  year: number,
  ownerId?: string,
  filterUnexpected?: boolean,
): CategoryYearlyStats {
  const dataDir = getYearDataDirectory(year);

  if (!existsSync(dataDir)) {
    throw new Error(`数据目录不存在: ${dataDir}`);
  }

  const monthlyData: Record<string, CategoryMonthlyData[]> = {};
  const totalByCategory: Record<string, CategoryStats> = {};
  let totalExpense = 0;
  const categoriesSet = new Set<string>();
  // 获取所有支出记录并按金额降序排序
  const allExpenses: Expense[] = [];

  // 使用新的函数读取并过滤CSV文件
  const transactions = readAndFilterCSVFiles(dataDir);

  for (const t of transactions) {
    // Skip transactions that don't match the owner filter
    if (ownerId) {
      const ownerName = getOwnerName(ownerId);
      if (t.owner !== ownerName && t["账单人"] !== ownerName) {
        continue;
      }
    }
    if (filterUnexpected) {
      if (t["标签"]?.includes("预算外")) {
        continue;
      }
    }
    const amount = parseFloat(t["金额"]);
    const category = t["分类"];
    if (isExpense(t)) {
      // 只处理支出
      allExpenses.push({
        id: `${t.日期}-${t.描述}-${amount}`,
        date: t.日期,
        category: t.分类,
        amount: Math.abs(amount),
        isRefund: amount > 0,
        description: t.描述,
        tags: t.标签 || "",
        owner: t.owner,
        merchant: t.交易对方,
        remark: t.备注 || "",
        source: t.来源 || "",
        account: t.账户 || "",
      });

      const month = (new Date(t.日期).getMonth() + 1)
        .toString()
        .padStart(2, "0");
      totalExpense += amount;
      categoriesSet.add(category);

      // 初始化分类的月度数据数组
      if (!monthlyData[category]) {
        monthlyData[category] = [];
      }

      // 查找或创建该月的数据
      let monthData = monthlyData[category].find((m) => m.month === month);
      if (!monthData) {
        monthData = { month, amount: 0, count: 0, isRefund: false };
        monthlyData[category].push(monthData);
      }
      monthData.amount += amount;
      monthData.count += 1;
      monthData.isRefund = amount > 0;

      // 更新总计
      if (!totalByCategory[category]) {
        totalByCategory[category] = { amount: 0, count: 0, expenses: [] };
      }
      totalByCategory[category].amount += amount;
      totalByCategory[category].count += 1;
      totalByCategory[category].expenses.push({
        id: `${year}-${String(month).padStart(2, "0")}-${category}-${totalByCategory[category].expenses.length}`,
        amount: amount,
        isRefund: amount > 0,
        category,
        date: t["日期"],
        description: t["描述"] || "",
        tags: t["标签"] || "",
        owner: t["账单人"] || "",
        merchant: t["交易对方"] || "",
        remark: t["备注"] || "",
        source: t["来源"] || "",
        account: t["账户"] || "",
      });
    }
  }

  // 对每个分类的月度数据按月份排序
  Object.keys(monthlyData).forEach((category) => {
    monthlyData[category].sort((a, b) => parseInt(a.month) - parseInt(b.month));
    monthlyData[category].forEach((m) => {
      m.amount = Math.abs(m.amount);
    });
  });

  const totalByCategoryAbs = getCategoryStats(totalByCategory);

  const categories = Array.from(categoriesSet).sort((a, b) => {
    return totalByCategoryAbs[b].amount - totalByCategoryAbs[a].amount;
  });

  // 按金额降序排序并取前20
  const topExpenses = allExpenses
    .sort((a: Expense, b: Expense) => Math.abs(b.amount) - Math.abs(a.amount))
    .slice(0, 100);

  const allExpensesWithoutRefund = allExpenses.filter((e) => !e.isRefund);
  // 返回结果
  return {
    categories: Array.from(categories),
    monthlyData: monthlyData,
    totalByCategory: totalByCategoryAbs,
    totalExpense: Math.abs(totalExpense),
    topExpenses: topExpenses,
    allExpenses: allExpensesWithoutRefund,
  };
}
