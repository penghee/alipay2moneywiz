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

export const renderCategoryList = (
  data?: ReturnType<typeof getExpenseSummary>,
) => {
  if (!data) {
    return <></>;
  }
  const { categories, total, refundCategories } = data;
  return (
    <>
      <div className="flex justify-between mb-4">
        <span>总笔数: {data.count}</span>
        <span className="font-bold">
          ¥{data.total.toFixed(2)} (包含退款: {data.refund.toFixed(2)})
        </span>
      </div>
      <div className="space-y-2">
        {Object.entries(categories)
          .sort(([, a], [, b]) => b - a)
          .map(([category, amount]) => {
            const refundAmount = refundCategories[category] || 0;
            return (
              <div key={category} className="flex justify-between">
                <span>{category}</span>
                <span className="font-medium">
                  ¥{amount.toFixed(2)} ({((amount / total) * 100).toFixed(1)}%)
                  (退款:{refundAmount.toFixed(2)})
                </span>
              </div>
            );
          })}
      </div>
    </>
  );
};

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

  return (
    <div className="flex flex-col md:flex-row gap-4">
      <div className="p-4 bg-blue-50 rounded-lg flex-1">
        <h3 className="text-lg font-medium text-blue-800 mb-2">
          大额支出 (≥ ¥{threshold})
        </h3>
        {renderCategoryList(aboveSummary)}
      </div>

      <div className="p-4 bg-green-50 rounded-lg flex-1">
        <h3 className="text-lg font-medium text-green-800 mb-2">
          小额支出 (&lt; ¥{threshold})
        </h3>
        {renderCategoryList(belowSummary)}
      </div>
    </div>
  );
};

export default ExpenseBreakdown;
