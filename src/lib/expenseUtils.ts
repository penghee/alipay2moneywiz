import { Expense } from "../types/expense";

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

      if (!acc.categories[expense.category]) {
        acc.categories[expense.category] = 0;
      }
      acc.categories[expense.category] += amount;

      return acc;
    },
    {
      total: 0,
      count: 0,
      categories: {} as Record<string, number>,
    },
  );
}
