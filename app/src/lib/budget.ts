import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

export interface BudgetConfig {
  [year: string]: {
    total: number;
    categories: {
      [category: string]: number;
    };
  };
}

const BUDGET_CONFIG_PATH = path.join(process.cwd(), 'src/config/budget_config.json');

export async function getBudgetConfig(): Promise<BudgetConfig> {
  try {
    const data = await readFileSync(BUDGET_CONFIG_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading budget config:', error);
    return {};
  }
}

export async function updateBudgetConfig(updater: (config: BudgetConfig) => BudgetConfig): Promise<void> {
  try {
    const currentConfig = await getBudgetConfig();
    const updatedConfig = updater(currentConfig);
    await writeFileSync(BUDGET_CONFIG_PATH, JSON.stringify(updatedConfig, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error updating budget config:', error);
    throw error;
  }
}

export async function getYearlyBudget(year: number | string): Promise<{ total: number; categories: Record<string, number> }> {
  const config = await getBudgetConfig();
  const yearStr = year.toString();
  
  return config[yearStr] || { total: 0, categories: {} };
}

export async function setYearlyBudget(
  year: number | string,
  total: number | null = null,
  categories: Record<string, number> | null = null
): Promise<void> {
  await updateBudgetConfig((config) => {
    const yearStr = year.toString();
    
    if (!config[yearStr]) {
      config[yearStr] = { total: 0, categories: {} };
    }
    
    if (total !== null) {
      config[yearStr].total = total;
    }
    
    if (categories !== null) {
      config[yearStr].categories = { ...config[yearStr].categories, ...categories };
    }
    
    return { ...config };
  });
}

import { calculateYearlyStats, calculateMonthlyStats } from './data';

export async function getBudgetProgress(year: number, month?: number) {
  try {
    // 获取预算配置
    const { total: yearlyBudget, categories: categoryBudgets } = await getYearlyBudget(year);
    
    // 计算实际支出
    let totalSpent = 0;
    const categorySpending: Record<string, number> = {};
    
    if (month !== undefined) {
      // 计算月度支出
      const monthlyStats = calculateMonthlyStats(year, month);
      totalSpent = monthlyStats.expense;
      
      // 计算各分类支出
      Object.entries(monthlyStats.categoryStats).forEach(([category, stats]) => {
        categorySpending[category] = stats.amount;
      });
    } else {
      // 计算年度支出
      const yearlyStats = calculateYearlyStats(year);
      totalSpent = yearlyStats.totalExpense;
      
      // 计算各分类年度支出
      Object.entries(yearlyStats.categoryStats).forEach(([category, stats]) => {
        categorySpending[category] = stats.amount;
      });
    }
    
    // 计算剩余预算和百分比
    const remainingBudget = Math.max(0, yearlyBudget - totalSpent);
    const percentage = yearlyBudget > 0 ? (totalSpent / yearlyBudget) * 100 : 0;
    
    // 计算各分类的预算使用情况
    const categoriesProgress = Object.fromEntries(
      Object.entries(categoryBudgets).map(([category, budget]) => {
        const spent = categorySpending[category] || 0;
        const remaining = Math.max(0, budget - spent);
        const catPercentage = budget > 0 ? (spent / budget) * 100 : 0;
        
        return [
          category,
          {
            budget,
            spent,
            remaining,
            percentage: catPercentage,
            overBudget: spent > budget
          }
        ];
      })
    );
    
    return {
      total: {
        budget: yearlyBudget,
        spent: totalSpent,
        remaining: remainingBudget,
        percentage,
        overBudget: totalSpent > yearlyBudget
      },
      categories: categoriesProgress
    };
  } catch (error) {
    console.error('Error calculating budget progress:', error);
    
    // 发生错误时返回空数据
    return {
      total: {
        budget: 0,
        spent: 0,
        remaining: 0,
        percentage: 0,
        overBudget: false
      },
      categories: {}
    };
  }
}
