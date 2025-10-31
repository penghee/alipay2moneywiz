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
  owner?: string;
  账单人?: string;
}

export interface CategoryStats {
  amount: number;
  count: number;
}

export interface MonthlyStats {
  income: number;
  expense: number;
  balance: number;
  expenses: Expense[];
  categoryStats: Record<string, CategoryStats>;
  totalTransactions: number;
}

export interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string;
  description: string;
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
  expenses: Expense[];
}

export interface CategoryMonthlyData {
  month: number;
  amount: number;
  count: number;
}

export interface CategoryYearlyStats {
  categories: string[];
  monthlyData: Record<string, CategoryMonthlyData[]>;
  totalByCategory: Record<string, CategoryStats>;
  totalExpense: number;
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
  }) as any[];
  
  // Map the 账单人 field to owner
  return records.map(record => ({
    ...record,
    owner: record['账单人'] || ''
  })) as Transaction[];
}

// 获取所有者名称映射
function getOwnerName(ownerId: string): string {
  try {
    const owners = require('@/config/bill_owners.json').owners as Array<{id: string, name: string}>;
    const owner = owners.find(o => o.id === ownerId);
    return owner ? owner.name : ownerId; // Return the ID if not found
  } catch (error) {
    console.error('Error loading owner mapping:', error);
    return ownerId; // Fallback to ID if there's an error
  }
}

// 计算月度统计
export function calculateMonthlyStats(year: number, month: number, ownerId?: string): MonthlyStats {
  const dataDir = getYearDataDirectory(year);
  const filePath = path.join(dataDir, `${String(month).padStart(2, "0")}.csv`);

  if (!existsSync(filePath)) {
    throw new Error(`数据文件不存在: ${filePath}`);
  }

  const transactions = readCSV(filePath);

  let income = 0;
  let expense = 0;
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
    
    const amount = parseFloat(t["金额"]);
    const category = t["分类"];

    if (amount > 0) {
      income += amount;
    } else {
      const absAmount = Math.abs(amount);
      expense += absAmount;
      
      // Add to expenses array
      expenses.push({
        id: `${year}-${String(month).padStart(2, '0')}-${index}`,
        amount: absAmount,
        category,
        date: t["日期"],
        description: t["描述"] || t["交易对方"] || '无描述'
      });
      
      // Update category stats
      if (!categoryStats[category]) {
        categoryStats[category] = {
          amount: 0,
          count: 0
        };
      }
      categoryStats[category].amount += absAmount;
      categoryStats[category].count += 1;
    }
  });

  return {
    income,
    expense,
    balance: income - expense,
    categoryStats,
    totalTransactions: transactions.length,
    expenses
  };
}

// 计算年度统计
export function calculateYearlyStats(year: number, ownerId?: string): YearlyStats {
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
      // Skip transactions that don't match the owner filter
      if (ownerId && ownerId !== 'all') {
        const ownerName = getOwnerName(ownerId);
        // Check both owner fields for backward compatibility
        if (t.owner !== ownerName && t['账单人'] !== ownerName) {
          return;
        }
      }

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

  // Prepare expenses data
  const expenses: Expense[] = [];
  for (const file of csvFiles) {
    const month = parseInt(file.replace('.csv', ''));
    const filePath = path.join(dataDir, file);
    const transactions = readCSV(filePath);

    transactions.forEach((t, index) => {
      const amount = parseFloat(t["金额"]);
      // Skip transactions that don't match the owner filter
      if (ownerId && ownerId !== 'all') {
        const ownerName = getOwnerName(ownerId);
        // Check both owner fields for backward compatibility
        if (t.owner !== ownerName && t['账单人'] !== ownerName) {
          console.log('Skipping transaction:', t);
          return;
        }
      }
      if (amount < 0) { // Only include expenses (negative amounts)
        expenses.push({
          id: `${year}-${String(month).padStart(2, '0')}-${index}`,
          amount: Math.abs(amount), // Store as positive for consistency
          category: t["分类"],
          date: t["日期"],
          description: t["描述"] || t["交易对方"] || '无描述'
        });
      }
    });
  }

  return {
    totalIncome,
    totalExpense,
    totalBalance: totalIncome - totalExpense,
    categoryStats,
    monthlyData,
    expenses
  };
}

// 获取可用的年份列表
// 查找最近一次的工资收入
export function findLatestSalary(ownerId?: string): { amount: number; date: string; category: string } | null {
  try {
    // 获取所有可用的年份，按降序排列
    const years = getAvailableYears();
    
    // 按从新到旧的顺序检查每年的数据
    for (const year of years) {
      const dataDir = getYearDataDirectory(year);
      const files = readdirSync(dataDir)
        .filter(f => f.endsWith('.csv'))
        .sort((a, b) => b.localeCompare(a)); // 从新到旧排序
      
      for (const file of files) {
        const month = parseInt(file.replace('.csv', ''));
        const filePath = path.join(dataDir, file);
        const transactions = readCSV(filePath);
        
        // 查找工资收入（正数且分类为'工资'）
        const salaryTx = transactions.find(t => {
          // 检查所有者过滤
          if (ownerId && ownerId !== 'all') {
            const ownerName = getOwnerName(ownerId);
            if (t.owner !== ownerName && t['账单人'] !== ownerName) {
              return false;
            }
          }
          
          const amount = parseFloat(t['金额']);
          const category = t['分类'];
          return amount > 0 && (category === '工资' || category === 'salary');
        });
        
        if (salaryTx) {
          return {
            amount: parseFloat(salaryTx['金额']),
            date: salaryTx['日期'],
            category: salaryTx['分类']
          };
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('查找工资收入时出错:', error);
    return null;
  }
}

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
export function getAvailableMonths(year: number, ownerId?: string): number[] {
  const dataDir = getYearDataDirectory(year);
  
  try {
    if (!existsSync(dataDir)) {
      return [];
    }

    let months = readdirSync(dataDir)
      .filter(f => f.endsWith('.csv') && !f.includes('alipay') && !f.includes('wechat'))
      .map(f => parseInt(f.replace('.csv', '')))
      .filter(month => !isNaN(month));

      // If owner filter is provided, check each month's transactions
      if (ownerId) {
        const ownerName = getOwnerName(ownerId);
        months = months.filter(month => {
          try {
            const filePath = path.join(dataDir, `${month}.csv`);
            const transactions = readCSV(filePath);
            return transactions.some(t => t.owner === ownerName);
          } catch (error) {
            console.error(`Error reading month ${month}:`, error);
            return false;
          }
        });
      }

    months.sort((a, b) => a - b);

    return months;
  } catch (error) {
    console.error('Error reading months directory:', error);
    return [];
  }
}

// 计算分类年度统计（按月聚合）
export function calculateCategoryYearlyStats(year: number): CategoryYearlyStats {
  const dataDir = getYearDataDirectory(year);

  if (!existsSync(dataDir)) {
    throw new Error(`数据目录不存在: ${dataDir}`);
  }

  const files = readdirSync(dataDir);
  const csvFiles = files.filter(f => {
    return !(f.includes("alipay") || f.includes("wechat"))
  }).filter(f => f.endsWith('.csv')).sort();

  const monthlyData: Record<string, CategoryMonthlyData[]> = {};
  const totalByCategory: Record<string, CategoryStats> = {};
  let totalExpense = 0;
  const categoriesSet = new Set<string>();

  for (const file of csvFiles) {
    const month = parseInt(file.replace('.csv', ''));
    const filePath = path.join(dataDir, file);
    const transactions = readCSV(filePath);

    transactions.forEach(t => {
      const amount = parseFloat(t["金额"]);
      const category = t["分类"];

      // 只统计支出
      if (amount < 0) {
        const absAmount = Math.abs(amount);
        totalExpense += absAmount;
        categoriesSet.add(category);

        // 初始化分类的月度数据数组
        if (!monthlyData[category]) {
          monthlyData[category] = [];
        }

        // 查找或创建该月的数据
        let monthData = monthlyData[category].find(m => m.month === month);
        if (!monthData) {
          monthData = { month, amount: 0, count: 0 };
          monthlyData[category].push(monthData);
        }
        monthData.amount += absAmount;
        monthData.count += 1;

        // 更新总计
        if (!totalByCategory[category]) {
          totalByCategory[category] = { amount: 0, count: 0 };
        }
        totalByCategory[category].amount += absAmount;
        totalByCategory[category].count += 1;
      }
    });
  }

  // 对每个分类的月度数据按月份排序
  Object.keys(monthlyData).forEach(category => {
    monthlyData[category].sort((a, b) => a.month - b.month);
  });

  const categories = Array.from(categoriesSet).sort((a, b) => {
    return totalByCategory[b].amount - totalByCategory[a].amount;
  });

  return {
    categories,
    monthlyData,
    totalByCategory,
    totalExpense
  };
}
