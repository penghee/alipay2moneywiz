import { Expense } from "../types/api";

export function filterExpensesByThreshold(
  expenses: Expense[],
  threshold: number,
  above: boolean,
): Expense[] {
  return expenses.filter((expense) => {
    const amount = Math.abs(expense.amount);
    return above ? amount >= threshold : amount < threshold;
  });
}

export function getExpenseSummary(expenses: Expense[]) {
  return expenses.reduce(
    (acc, expense) => {
      const amount = Math.abs(expense.amount);
      acc.total += amount;
      acc.count += 1;
      if (expense.isRefund) {
        acc.refund += amount;
        acc.refundCount += 1;
        if (!acc.refundCategories[expense.category]) {
          acc.refundCategories[expense.category] = 0;
        }
        acc.refundCategories[expense.category] += amount;
        return acc;
      }
      if (!acc.categories[expense.category]) {
        acc.categories[expense.category] = 0;
      }
      acc.categories[expense.category] += amount;

      return acc;
    },
    {
      total: 0,
      refund: 0,
      count: 0,
      refundCount: 0,
      categories: {} as Record<string, number>,
      refundCategories: {} as Record<string, number>,
    },
  );
}
