"use client";

import React from "react";
import { Expense } from "../types/api";
import { useThreshold } from "../contexts/ThresholdContext";
import {
  filterExpensesByThreshold,
  getExpenseSummary,
} from "../lib/expenseUtils";

interface ExpenseBreakdownProps {
  expenses: Expense[];
}

const ExpenseBreakdown: React.FC<ExpenseBreakdownProps> = ({ expenses }) => {
  const { threshold } = useThreshold();

  const aboveThresholdExpenses = filterExpensesByThreshold(
    expenses,
    threshold,
    true,
  );
  const belowThresholdExpenses = filterExpensesByThreshold(
    expenses,
    threshold,
    false,
  );

  const aboveSummary = getExpenseSummary(aboveThresholdExpenses);
  const belowSummary = getExpenseSummary(belowThresholdExpenses);

  const renderCategoryList = (
    categories: Record<string, number>,
    total: number,
  ) => (
    <div className="space-y-2">
      {Object.entries(categories)
        .sort(([, a], [, b]) => b - a)
        .map(([category, amount]) => (
          <div key={category} className="flex justify-between">
            <span>{category}</span>
            <span className="font-medium">
              ¥{amount.toFixed(2)} ({((amount / total) * 100).toFixed(1)}%)
            </span>
          </div>
        ))}
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row gap-4">
      <div className="p-4 bg-blue-50 rounded-lg flex-1">
        <h3 className="text-lg font-medium text-blue-800 mb-2">
          大额支出 (≥ ¥{threshold})
        </h3>
        <div className="flex justify-between mb-4">
          <span>总笔数: {aboveSummary.count}</span>
          <span className="font-bold">¥{aboveSummary.total.toFixed(2)}</span>
        </div>
        {renderCategoryList(aboveSummary.categories, aboveSummary.total || 1)}
      </div>

      <div className="p-4 bg-green-50 rounded-lg flex-1">
        <h3 className="text-lg font-medium text-green-800 mb-2">
          小额支出 (&lt; ¥{threshold})
        </h3>
        <div className="flex justify-between mb-4">
          <span>总笔数: {belowSummary.count}</span>
          <span className="font-bold">¥{belowSummary.total.toFixed(2)}</span>
        </div>
        {renderCategoryList(belowSummary.categories, belowSummary.total || 1)}
      </div>
    </div>
  );
};

export default ExpenseBreakdown;
