import { Transaction, MonthlyStats, YearlyStats } from './data';
import { getYearlyBudget } from './budget';

export interface SpendingAlert {
  type: 'high_value' | 'monthly_increase' | 'yearly_increase' | 'budget_exceeded';
  message: string;
  amount: number;
  threshold: number;
  date: string;
  category?: string;
}

export interface SpendingAnalysisOptions {
  // 单笔消费警告阈值
  singleTransactionThreshold: number;
  // 环比增长警告阈值（百分比）
  monthlyIncreaseThreshold: number;
  // 同比增长警告阈值（百分比）
  yearlyIncreaseThreshold: number;
  // 预算使用率警告阈值（百分比）
  budgetUsageThreshold: number;
}

// 导入配置文件
import appConfig from '@/config/app_config.json';

// 从配置中获取默认值
const DEFAULT_OPTIONS: SpendingAnalysisOptions = {
  singleTransactionThreshold: appConfig.spendingAnalysis.singleTransactionThreshold.default,
  monthlyIncreaseThreshold: appConfig.spendingAnalysis.monthlyIncreaseThreshold.default,
  yearlyIncreaseThreshold: appConfig.spendingAnalysis.yearlyIncreaseThreshold.default,
  budgetUsageThreshold: appConfig.spendingAnalysis.budgetUsageThreshold.default,
};

export const SPENDING_ANALYSIS_CONFIG = {
  singleTransactionThreshold: appConfig.spendingAnalysis.singleTransactionThreshold,
  monthlyIncreaseThreshold: appConfig.spendingAnalysis.monthlyIncreaseThreshold,
  yearlyIncreaseThreshold: appConfig.spendingAnalysis.yearlyIncreaseThreshold,
  budgetUsageThreshold: appConfig.spendingAnalysis.budgetUsageThreshold,
};

export class SpendingAnalyzer {
  private options: SpendingAnalysisOptions;

  constructor(options: Partial<SpendingAnalysisOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  // 检查单笔大额消费
  checkHighValueTransactions(transactions: Transaction[]): SpendingAlert[] {
    const alerts: SpendingAlert[] = [];
    const threshold = this.options.singleTransactionThreshold;

    transactions.forEach(transaction => {
      const amount = Math.abs(parseFloat(transaction.金额) || 0);
      if (amount >= threshold) {
        alerts.push({
          type: 'high_value',
          message: `单笔大额消费: ${transaction.描述} ${amount.toFixed(2)}元`,
          amount,
          threshold,
          date: transaction.日期,
          category: transaction.分类
        });
      }
    });

    return alerts;
  }

  // 检查环比增长
  checkMonthlyIncrease(currentMonth: MonthlyStats, previousMonth: MonthlyStats): SpendingAlert[] {
    const alerts: SpendingAlert[] = [];
    const threshold = this.options.monthlyIncreaseThreshold;
    
    // 避免除以零
    if (previousMonth.expense === 0) return [];
    
    const increase = ((currentMonth.expense - previousMonth.expense) / previousMonth.expense) * 100;
    
    if (increase >= threshold) {
      alerts.push({
        type: 'monthly_increase',
        message: `月度支出环比增长 ${increase.toFixed(1)}%`,
        amount: currentMonth.expense,
        threshold,
        date: new Date().toISOString().split('T')[0]
      });
    }
    
    return alerts;
  }

  // 检查同比增长
  checkYearlyIncrease(currentYear: YearlyStats, previousYear: YearlyStats): SpendingAlert[] {
    const alerts: SpendingAlert[] = [];
    const threshold = this.options.yearlyIncreaseThreshold;
    
    // 避免除以零
    if (previousYear.totalExpense === 0) return [];
    
    const increase = ((currentYear.totalExpense - previousYear.totalExpense) / previousYear.totalExpense) * 100;
    
    if (increase >= threshold) {
      alerts.push({
        type: 'yearly_increase',
        message: `年度支出同比增长 ${increase.toFixed(1)}%`,
        amount: currentYear.totalExpense,
        threshold,
        date: new Date().toISOString().split('T')[0]
      });
    }
    
    return alerts;
  }

  // 检查预算执行情况
  async checkBudgetUsage(year: number, month: number, categoryStats: Record<string, { amount: number }>): Promise<SpendingAlert[]> {
    const alerts: SpendingAlert[] = [];
    const threshold = this.options.budgetUsageThreshold;
    
    try {
      const { categories: categoryBudgets } = await getYearlyBudget(year);
      
      // 检查各分类预算使用情况
      for (const [category, stats] of Object.entries(categoryStats)) {
        const budget = categoryBudgets[category];
        if (budget && budget > 0) {
          const usage = (stats.amount / budget) * 100;
          
          if (usage >= threshold) {
            alerts.push({
              type: 'budget_exceeded',
              message: `"${category}" 分类预算使用 ${usage.toFixed(1)}%`,
              amount: stats.amount,
              threshold: budget,
              date: new Date(year, month - 1, 1).toISOString().split('T')[0],
              category
            });
          }
        }
      }
    } catch (error) {
      console.error('检查预算使用情况时出错:', error);
    }
    
    return alerts;
  }

  // 综合分析
  async analyzeSpending(
    transactions: Transaction[],
    currentMonth: MonthlyStats,
    previousMonth: MonthlyStats,
    currentYear: YearlyStats,
    previousYear: YearlyStats,
    year: number,
    month: number
  ): Promise<SpendingAlert[]> {
    const alerts: SpendingAlert[] = [];
    
    // 检查单笔大额消费
    alerts.push(...this.checkHighValueTransactions(transactions));
    
    // 检查月度环比
    alerts.push(...this.checkMonthlyIncrease(currentMonth, previousMonth));
    
    // 检查年度同比
    alerts.push(...this.checkYearlyIncrease(currentYear, previousYear));
    
    // 检查预算使用情况
    const budgetAlerts = await this.checkBudgetUsage(year, month, currentMonth.categoryStats);
    alerts.push(...budgetAlerts);
    
    return alerts;
  }
}
