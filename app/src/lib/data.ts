import { parse } from 'csv-parse/sync';
import { readFileSync, readdirSync, existsSync } from 'fs';
import path from 'path';
import { getDataDirectory, getYearDataDirectory } from '@/config/paths';

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
}

export interface CategoryStats {
  amount: number;
  count: number;
}

export interface MonthlyStats {
  income: number;
  expense: number;
  balance: number;
  categoryStats: Record<string, CategoryStats>;
  totalTransactions: number;
}

export interface YearlyStats {
  totalIncome: number;
  totalExpense: number;
  totalBalance: number;
  categoryStats: Record<string, CategoryStats>;
  monthlyData: Array<{
    month: number;
    income: number;
    expense: number;
    balance: number;
  }>;
}

// 格式化金额
export function formatMoney(amount: number): string {
  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Math.abs(amount));
}

// 读取CSV文件
export function readCSV(filePath: string): Transaction[] {
  const content = readFileSync(filePath, 'utf8');
  const records = parse(content, {
    delimiter: ",",
    columns: true,
    trim: true,
  }) as Transaction[];
  return records;
}

// 计算月度统计
export function calculateMonthlyStats(year: number, month: number): MonthlyStats {
  const dataDir = getYearDataDirectory(year);
  const filePath = path.join(dataDir, `${String(month).padStart(2, "0")}.csv`);

  if (!existsSync(filePath)) {
    throw new Error(`数据文件不存在: ${filePath}`);
  }

  const transactions = readCSV(filePath);

  let income = 0;
  let expense = 0;
  const categoryStats: Record<string, CategoryStats> = {};

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
export function calculateYearlyStats(year: number): YearlyStats {
  const dataDir = getYearDataDirectory(year);

  if (!existsSync(dataDir)) {
    throw new Error(`数据目录不存在: ${dataDir}`);
  }

  const files = readdirSync(dataDir);
  const csvFiles = files.filter(f => {
    return !(f.includes("alipay") || f.includes("wechat"))
  }).filter(f => f.endsWith('.csv')).sort();

  let totalIncome = 0;
  let totalExpense = 0;
  const categoryStats: Record<string, CategoryStats> = {};
  const monthlyData: Array<{
    month: number;
    income: number;
    expense: number;
    balance: number;
  }> = [];

  for (const file of csvFiles) {
    const month = parseInt(file.replace('.csv', ''));
    const filePath = path.join(dataDir, file);
    const transactions = readCSV(filePath);

    let monthIncome = 0;
    let monthExpense = 0;

    transactions.forEach(t => {
      const amount = parseFloat(t["金额"]);
      const category = t["分类"];

      if (amount > 0) {
        monthIncome += amount;
      } else {
        monthExpense += Math.abs(amount);
        
        // 聚合分类统计
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
    categoryStats,
    monthlyData
  };
}

// 获取可用的年份列表
export function getAvailableYears(): number[] {
  const dataDir = getDataDirectory();
  
  try {
    console.log('Current working directory:', process.cwd());
    console.log('Data directory:', dataDir);
    
    if (!existsSync(dataDir)) {
      console.log('Data directory does not exist:', dataDir);
      return [];
    }

    const years = readdirSync(dataDir, { withFileTypes: true })
      .filter(item => item.isDirectory() && !item.name.startsWith('.'))
      .filter(dir => {
        const fullPath = path.join(dataDir, dir.name);
        const files = readdirSync(fullPath);
        return files.some(f => f.endsWith('.csv'));
      })
      .map(dir => parseInt(dir.name))
      .filter(year => !isNaN(year))
      .sort((a, b) => b - a);

    return years;
  } catch (error) {
    console.error('Error reading data directory:', error);
    return [];
  }
}

// 获取指定年份的可用月份
export function getAvailableMonths(year: number): number[] {
  const dataDir = getYearDataDirectory(year);
  
  try {
    if (!existsSync(dataDir)) {
      return [];
    }

    const months = readdirSync(dataDir)
      .filter(f => f.endsWith('.csv') && !f.includes('alipay') && !f.includes('wechat'))
      .map(f => parseInt(f.replace('.csv', '')))
      .filter(month => !isNaN(month))
      .sort((a, b) => a - b);

    return months;
  } catch (error) {
    console.error('Error reading months directory:', error);
    return [];
  }
}
