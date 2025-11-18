"use client";

import React, { useState, useMemo } from "react";
import { Expense } from "../types/expense";
import { useThreshold } from "../contexts/ThresholdContext";
import {
  filterExpensesByThreshold,
  getExpenseSummary,
} from "../lib/expenseUtils";

interface ExpenseByWeekdayProps {
  expenses: Expense[];
}

const weekdays = [
  { id: "1", name: "周一" },
  { id: "2", name: "周二" },
  { id: "3", name: "周三" },
  { id: "4", name: "周四" },
  { id: "5", name: "周五" },
  { id: "6", name: "周六" },
  { id: "0", name: "周日" },
];

const ExpenseByWeekday: React.FC<ExpenseByWeekdayProps> = ({ expenses }) => {
  const [selectedWeekdays, setSelectedWeekdays] = useState<Set<string>>(
    new Set(["1", "2", "3", "4", "5"]),
  );
  const { threshold } = useThreshold();

  const { selectedExpenses, otherExpenses } = useMemo(() => {
    if (selectedWeekdays.size === 0) {
      return { selectedExpenses: [], otherExpenses: expenses };
    }

    return expenses.reduce(
      (acc, expense) => {
        const date = new Date(expense.date);
        const dayOfWeek = date.getDay().toString();

        if (selectedWeekdays.has(dayOfWeek)) {
          acc.selectedExpenses.push(expense);
        } else {
          acc.otherExpenses.push(expense);
        }
        return acc;
      },
      { selectedExpenses: [] as Expense[], otherExpenses: [] as Expense[] },
    );
  }, [expenses, selectedWeekdays]);

  const handleWeekdayToggle = (dayId: string) => {
    setSelectedWeekdays((prev) => {
      const newSelection = new Set(prev);
      if (newSelection.has(dayId)) {
        newSelection.delete(dayId);
      } else {
        newSelection.add(dayId);
      }
      return newSelection;
    });
  };

  const selectedAboveThreshold = filterExpensesByThreshold(
    selectedExpenses,
    threshold,
    true,
  );
  const selectedBelowThreshold = filterExpensesByThreshold(
    selectedExpenses,
    threshold,
    false,
  );
  const otherAboveThreshold = filterExpensesByThreshold(
    otherExpenses,
    threshold,
    true,
  );
  const otherBelowThreshold = filterExpensesByThreshold(
    otherExpenses,
    threshold,
    false,
  );

  const selectedSummary = getExpenseSummary(selectedExpenses);
  const otherSummary = getExpenseSummary(otherExpenses);

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
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
        {weekdays.map((weekday) => (
          <label
            key={weekday.id}
            className="flex items-center space-x-2 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selectedWeekdays.has(weekday.id)}
              onChange={() => handleWeekdayToggle(weekday.id)}
              className="rounded text-blue-600"
            />
            <span>{weekday.name}</span>
          </label>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-medium text-blue-800 mb-2">
            {selectedWeekdays.size > 0
              ? `选中的${Array.from(selectedWeekdays)
                  .map((d) => weekdays.find((w) => w.id === d)?.name)
                  .join("、")}`
              : "请选择星期"}
          </h3>
          {selectedWeekdays.size > 0 && (
            <>
              <div className="flex justify-between mb-4">
                <span>总笔数: {selectedSummary.count}</span>
                <span className="font-bold">
                  ¥{selectedSummary.total.toFixed(2)}
                </span>
              </div>
              {renderCategoryList(
                selectedSummary.categories,
                selectedSummary.total || 1,
              )}

              <div className="mt-4 pt-4 border-t border-blue-100">
                <h4 className="font-medium text-blue-700 mb-2">
                  大额支出 (≥ ¥{threshold})
                </h4>
                <div className="flex justify-between mb-2">
                  <span>笔数: {selectedAboveThreshold.length}</span>
                  <span>
                    ¥
                    {selectedAboveThreshold
                      .reduce((sum, exp) => sum + exp.amount, 0)
                      .toFixed(2)}
                  </span>
                </div>

                <h4 className="font-medium text-blue-700 mb-2 mt-3">
                  小额支出 (&lt; ¥{threshold})
                </h4>
                <div className="flex justify-between">
                  <span>笔数: {selectedBelowThreshold.length}</span>
                  <span>
                    ¥
                    {selectedBelowThreshold
                      .reduce((sum, exp) => sum + exp.amount, 0)
                      .toFixed(2)}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="p-4 bg-green-50 rounded-lg">
          <h3 className="text-lg font-medium text-green-800 mb-2">
            {selectedWeekdays.size > 0 ? "其他星期" : "所有星期"}
          </h3>
          <div className="flex justify-between mb-4">
            <span>总笔数: {otherSummary.count}</span>
            <span className="font-bold">¥{otherSummary.total.toFixed(2)}</span>
          </div>
          {renderCategoryList(otherSummary.categories, otherSummary.total || 1)}

          <div className="mt-4 pt-4 border-t border-green-100">
            <h4 className="font-medium text-green-700 mb-2">
              大额支出 (≥ ¥{threshold})
            </h4>
            <div className="flex justify-between mb-2">
              <span>笔数: {otherAboveThreshold.length}</span>
              <span>
                ¥
                {otherAboveThreshold
                  .reduce((sum, exp) => sum + exp.amount, 0)
                  .toFixed(2)}
              </span>
            </div>

            <h4 className="font-medium text-green-700 mb-2 mt-3">
              小额支出 (&lt; ¥{threshold})
            </h4>
            <div className="flex justify-between">
              <span>笔数: {otherBelowThreshold.length}</span>
              <span>
                ¥
                {otherBelowThreshold
                  .reduce((sum, exp) => sum + exp.amount, 0)
                  .toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseByWeekday;
