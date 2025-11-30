import { Asset, AssetSummary, Liability } from "./asset";

export interface Budget {
  year: number;
  total: number;
  categories: Record<string, number>;
  spent: number;
  remaining: number;
}

export interface BudgetProgress {
  total: {
    budget: number;
    spent: number;
    remaining: number;
    percentage: number;
    overBudget: boolean;
  };
  categories: Record<
    string,
    {
      budget: number;
      spent: number;
      remaining: number;
      percentage: number;
      overBudget: boolean;
    }
  >;
}

export interface MonthlyFinancials {
  month: string; // YYYY-MM
  expenses: number;
  salary: number;
  income: number;
  balance: number;
  categories?: Record<string, number>; // Optional since not all components need it
}

export interface YearlyStats {
  year: number;
  income: number;
  expense: number;
  balance: number;
  // For backward compatibility
  totalIncome: number;
  totalExpense: number;
  totalBalance: number;
  categoryStats?: Record<string, { amount: number; count: number }>;
  monthlyData: Array<{
    month: number;
    income: number;
    expense: number;
    balance: number;
    totalIncome?: number;
    totalExpense?: number;
    salary?: number;
  }>;
  expenses?: Expense[];
  totalSalary?: number;
}

export interface MonthlyCategoryStats {
  amount: number;
  count: number;
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
  totalSalary: number;
}

export interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string;
  description: string;
  tags: string;
  remark?: string;
}

export interface CategoryMonthlyData {
  month: number;
  amount: number;
  count: number;
}

export interface TopExpense {
  date: string;
  category: string;
  amount: number;
  description: string;
}

export interface CategoryYearlyStats {
  categories: string[];
  monthlyData: Record<string, CategoryMonthlyData[]>;
  totalByCategory: Record<string, CategoryStats>;
  totalExpense: number;
  topExpenses: TopExpense[];
}

export interface Summary {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlySavings: number;
  savingsRate: number;
  cashAssets: number; // Liquid cash available
  creditCardDebt?: number;
  investmentAssets?: number;
  sankeyData?: {
    nodes: Array<{ name: string }>;
    links: Array<{ source: number; target: number; value: number }>;
  };
  budgetStatus: {
    totalBudget: number;
    totalSpent: number;
    remaining: number;
    percentageUsed: number;
  };
}

export interface Transaction extends Expense {
  id: string;
  type: "income" | "expense";
  account: string;
  owner: string;
  date: string; // ISO date string
}

export interface UploadResponse {
  success: boolean;
  message: string;
  count: number;
  error?: string;
}

export interface YearsResponse {
  years: number[];
}

export interface MonthsResponse {
  year: number;
  months: number[];
}

export interface TransactionPreview {
  日期: string;
  描述: string;
  账户: string;
  交易对方: string;
  分类: string;
  转账: string;
  金额: string;
  标签: string;
  备注: string;
  账单人: string;
}

export interface PreviewUploadResponse {
  success: boolean;
  error?: string;
  preview?: boolean;
  total?: number;
  platform?: string;
  owner?: string;
  transactions?: TransactionPreview[];
}
