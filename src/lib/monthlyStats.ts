import { calculateMonthlyStats } from './data';
import { subMonths, format, parse } from 'date-fns';

export interface MonthlyFinancials {
  month: string;
  expenses: number;
  salary: number;
  balance: number;
}

export async function getLast12MonthsFinancials(): Promise<MonthlyFinancials[]> {
  const result: MonthlyFinancials[] = [];
  const now = new Date();
  
  for (let i = 0; i < 12; i++) {
    const date = subMonths(now, i);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    
    try {
      const stats = calculateMonthlyStats(year, month);
      
      // Calculate salary income (income with category '工资' or 'salary')
      const salary = stats.salary.reduce((sum, exp) => sum + exp.amount, 0);
      
      result.unshift({
        month: format(date, 'yyyy-MM'),
        expenses: stats.expense,
        salary,
        balance: stats.income - stats.expense
      });
    } catch (error) {
      console.error(`Error getting data for ${year}-${month}:`, error);
      // Add empty data for months with errors
      result.unshift({
        month: format(date, 'yyyy-MM'),
        expenses: 0,
        salary: 0,
        balance: 0
      });
    }
  }
  
  return result;
}

export function formatMonthYear(dateStr: string): string {
  const date = parse(`${dateStr}-01`, 'yyyy-MM-dd', new Date());
  return format(date, 'MMM yyyy');
}
