import { calculateMonthlyStats } from "./data";
import { subMonths, format, parse } from "date-fns";

export interface MonthlyFinancials {
  month: string;
  expenses: number;
  salary: number;
  balance: number;
}

export async function getLast12MonthsFinancials(): Promise<
  MonthlyFinancials[]
> {
  const result: MonthlyFinancials[] = [];
  const now = new Date();
  let monthsProcessed = 0;
  let monthsToGoBack = 0;

  while (monthsProcessed < 12) {
    const date = subMonths(now, monthsToGoBack);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    try {
      const stats = calculateMonthlyStats(year, month);

      // Only add to result if we have data for this month
      if (stats.expense > 0 || stats.income > 0) {
        // Calculate salary income (income with category '工资' or 'salary')
        const salary = stats.salary.reduce((sum, exp) => sum + exp.amount, 0);

        result.unshift({
          month: format(date, "yyyy-MM"),
          expenses: stats.expense,
          salary,
          balance: stats.income - stats.expense,
        });

        monthsProcessed++;
      }

      // Move to previous month
      monthsToGoBack++;

      // Safety check to prevent infinite loop
      if (monthsToGoBack > 48) {
        // 4 years should be enough
        console.warn(
          "Reached maximum lookback period (48 months) without finding 12 months of data",
        );
        break;
      }
    } catch (error) {
      console.error(`Error getting data for ${year}-${month}:`, error);
      // Skip this month and try the previous one
      monthsToGoBack++;

      // Safety check to prevent infinite loop
      if (monthsToGoBack > 48) {
        console.warn(
          "Reached maximum lookback period (48 months) without finding 12 months of data",
        );
        break;
      }
      result.unshift({
        month: format(date, "yyyy-MM"),
        expenses: 0,
        salary: 0,
        balance: 0,
      });
    }
  }

  return result;
}

export function formatMonthYear(dateStr: string): string {
  const date = parse(`${dateStr}-01`, "yyyy-MM-dd", new Date());
  return format(date, "MMM yyyy");
}
