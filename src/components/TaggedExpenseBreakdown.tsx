"use client";

import React, { useEffect, useState } from "react";
import { Expense } from "../types/expense";
import { getExpenseSummary } from "../lib/expenseUtils";

interface TaggedExpenseBreakdownProps {
  expenses: Expense[];
  defaultTag?: string;
}

const STORAGE_KEY = "expense-tag-filter";

const TaggedExpenseBreakdown: React.FC<TaggedExpenseBreakdownProps> = ({
  expenses,
  defaultTag = "预算外",
}) => {
  // Initialize state with value from localStorage or defaultTag
  const getInitialTag = () => {
    if (typeof window !== "undefined") {
      const savedTag = localStorage.getItem(STORAGE_KEY);
      return savedTag || defaultTag;
    }
    return defaultTag;
  };

  const [tag, setTag] = useState<string>(getInitialTag);

  // Save tag to localStorage when it changes
  useEffect(() => {
    if (tag) {
      localStorage.setItem(STORAGE_KEY, tag);
    }
  }, [tag]);

  const filterExpensesByTag = (
    expenses: Expense[],
    tag: string,
    include: boolean,
  ): Expense[] => {
    if (!tag) return [];
    return expenses.filter((expense) => {
      const hasTag = expense.tags?.toLowerCase().includes(tag.toLowerCase());
      return include ? hasTag : !hasTag;
    });
  };

  const taggedExpenses = filterExpensesByTag(expenses, tag, true);
  const untaggedExpenses = filterExpensesByTag(expenses, tag, false);

  const taggedSummary = getExpenseSummary(taggedExpenses);
  const untaggedSummary = getExpenseSummary(untaggedExpenses);

  const renderCategoryList = (
    categories: Record<string, number>,
    total: number,
  ) => (
    <div className="space-y-2 mt-2">
      {Object.entries(categories)
        .sort(([, a], [, b]) => b - a)
        .map(([category, amount]) => (
          <div key={category} className="flex justify-between text-sm">
            <span className="truncate max-w-[60%]">{category}</span>
            <span className="font-medium whitespace-nowrap">
              ¥{amount.toFixed(2)} ({((amount / total) * 100).toFixed(1)}%)
            </span>
          </div>
        ))}
    </div>
  );

  const commonTagSuggestions = ["预算外", "工作餐"];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="w-full sm:w-64">
          <label
            htmlFor="tag-filter"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            标签筛选
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              id="tag-filter"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              placeholder="输入标签名..."
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {commonTagSuggestions.map((suggestedTag) => (
              <button
                key={suggestedTag}
                type="button"
                onClick={() => setTag(suggestedTag)}
                className={`px-2 py-1 text-xs rounded-full ${
                  tag === suggestedTag
                    ? "bg-blue-100 text-blue-800 border border-blue-300"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {suggestedTag}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="p-4 bg-purple-50 rounded-lg flex-1">
          <h3 className="text-lg font-medium text-purple-800 mb-2">
            标签: {tag || "未选择"}
          </h3>
          <div className="flex justify-between mb-4 text-sm">
            <span>总笔数: {taggedSummary.count}</span>
            <span className="font-bold">¥{taggedSummary.total.toFixed(2)}</span>
          </div>
          {tag ? (
            renderCategoryList(
              taggedSummary.categories,
              taggedSummary.total || 1,
            )
          ) : (
            <p className="text-sm text-gray-500">请选择一个标签进行筛选</p>
          )}
        </div>

        <div className="p-4 bg-gray-50 rounded-lg flex-1">
          <h3 className="text-lg font-medium text-gray-800 mb-2">其他支出</h3>
          <div className="flex justify-between mb-4 text-sm">
            <span>总笔数: {untaggedSummary.count}</span>
            <span className="font-bold">
              ¥{untaggedSummary.total.toFixed(2)}
            </span>
          </div>
          {tag ? (
            renderCategoryList(
              untaggedSummary.categories,
              untaggedSummary.total || 1,
            )
          ) : (
            <p className="text-sm text-gray-500">请选择一个标签查看其他支出</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaggedExpenseBreakdown;
