"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BudgetProgressBar from "@/components/BudgetProgressBar";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { BudgetAlerts } from "@/components/BudgetAlerts";
import appConfig from "@/config/app_config.json";
import { getCategoryColor, resetColorAssignment } from "@/lib/colors";
import { apiClient } from "@/lib/apiClient";

interface BudgetData {
  total: number;
  categories: Record<string, number>;
}

export async function fetchYearlyBudget(
  year: number | string,
): Promise<BudgetData> {
  return apiClient.getBudget(Number(year));
}

export async function updateYearlyBudget(
  year: number | string,
  total: number | null = null,
  categories: Record<string, number> | null = null,
): Promise<void> {
  await apiClient.createBudget(Number(year), total || 0, categories || {});
}

export async function fetchBudgetProgress(
  year: number | string,
  month?: number,
): Promise<{
  total: {
    budget: number;
    spent: number;
    remaining: number;
    percentage: number;
    overBudget: boolean;
  };
  categories: Record<
    string,
    {
      budget: number;
      spent: number;
      remaining: number;
      percentage: number;
      overBudget: boolean;
    }
  >;
}> {
  return apiClient.getBudgetProgress(Number(year), month?.toString());
}

interface BudgetProgressCategory {
  budget: number;
  spent: number;
  remaining: number;
  percentage: number;
  overBudget: boolean;
}

interface BudgetProgressData {
  total: {
    budget: number;
    spent: number;
    remaining: number;
    percentage: number;
    overBudget: boolean;
  };
  categories: Record<string, BudgetProgressCategory>;
}

export default function BudgetPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const [year, setYear] = useState<number | null>(null);
  const [totalBudget, setTotalBudget] = useState(0);
  const [categories, setCategories] = useState<
    { name: string; amount: number }[]
  >([]);
  const [newCategory, setNewCategory] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [budgetProgress, setBudgetProgress] =
    useState<BudgetProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    console.log("Initializing budget page...");
    resetColorAssignment();
    const loadBudget = async () => {
      try {
        console.log("Loading budget data...");
        const resolvedParams = await params;
        console.log("Params:", resolvedParams);
        const yearNum = parseInt(resolvedParams.year);

        if (isNaN(yearNum)) {
          console.error("Invalid year parameter:", resolvedParams.year);
          return;
        }

        console.log("Setting year:", yearNum);
        setYear(yearNum);

        // Load budget data
        console.log("Fetching yearly budget...");
        const budgetData = await fetchYearlyBudget(yearNum);
        console.log("Budget data received:", budgetData);

        if (!budgetData) {
          console.error("No budget data received");
          return;
        }

        setTotalBudget(budgetData.total);

        const categoryList = Object.entries(budgetData.categories || {}).map(
          ([name, amount]) => ({
            name,
            amount,
          }),
        );
        console.log("Setting categories:", categoryList);
        setCategories(categoryList);

        // Load progress data
        console.log("Fetching budget progress...");
        const progress = await fetchBudgetProgress(yearNum);
        console.log("Progress data received:", progress);
        setBudgetProgress(progress);
      } catch (error) {
        console.error("Error loading budget:", error);
        setError(
          error instanceof Error ? error.message : "Failed to load budget data",
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadBudget();
  }, [params]);

  const addCategory = () => {
    if (!newCategory.trim() || !newAmount) return;

    const amount = parseFloat(newAmount);
    if (isNaN(amount) || amount <= 0) return;

    setCategories([...categories, { name: newCategory.trim(), amount }]);
    setNewCategory("");
    setNewAmount("");
  };

  const removeCategory = (index: number) => {
    const newCategories = [...categories];
    newCategories.splice(index, 1);
    setCategories(newCategories);
  };

  const saveBudget = async () => {
    if (year === null) return;

    setIsSaving(true);
    try {
      const categoryMap = categories.reduce<Record<string, number>>(
        (acc, curr) => {
          acc[curr.name] = curr.amount;
          return acc;
        },
        {},
      );

      await updateYearlyBudget(year, totalBudget, categoryMap);

      // Reload progress
      const progress = await fetchBudgetProgress(year);
      setBudgetProgress(progress);

      // Show success message or toast here
      alert("预算保存成功！");
    } catch (error) {
      console.error("Error saving budget:", error);
      alert("保存失败，请重试");
    } finally {
      setIsSaving(false);
    }
  };

  if (year === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>返回</span>
          </button>

          <h1 className="text-3xl font-bold text-gray-900">
            {year}年 预算管理
          </h1>
        </div>

        {/* Budget Alerts */}
        {budgetProgress?.categories && (
          <BudgetAlerts
            categories={budgetProgress.categories}
            budgetUsageThreshold={
              appConfig.spendingAnalysis.budgetUsageThreshold.default
            }
          />
        )}

        {/* Total Budget */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            年度总预算
          </h2>
          <div className="flex items-center">
            <span className="text-gray-700 mr-2">¥</span>
            <input
              type="number"
              value={totalBudget || ""}
              onChange={(e) => setTotalBudget(Number(e.target.value) || 0)}
              className="w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="输入总预算"
              min="0"
              step="100"
            />
            <span className="ml-4 text-sm text-gray-500">
              {budgetProgress?.total && (
                <span
                  className={
                    budgetProgress.total.overBudget
                      ? "text-red-600"
                      : "text-green-600"
                  }
                >
                  已用: ¥{budgetProgress.total.spent?.toLocaleString() ?? "0"} (
                  {(budgetProgress.total.percentage ?? 0).toFixed(2)}%)
                </span>
              )}
            </span>
          </div>

          <div className="mt-4 space-y-6">
            {/* 饼图 - Only show if we have categories with budget */}
            {budgetProgress?.categories &&
              Object.keys(budgetProgress.categories).length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    预算分布
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={Object.entries(budgetProgress.categories || {})
                            .filter(([_, data]) => data && data.budget > 0)
                            .map(([name, data]) => ({
                              name,
                              value: data.budget,
                              color: getCategoryColor(name),
                            }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) =>
                            `${name} ${(Number(percent) * 100).toFixed(1)}%`
                          }
                        >
                          {Object.entries(budgetProgress.categories || {})
                            .filter(([_, data]) => data && data.budget > 0)
                            .map(([name]) => (
                              <Cell
                                key={`cell-${name}`}
                                fill={getCategoryColor(name)}
                              />
                            ))}
                        </Pie>
                        <RechartsTooltip
                          formatter={(value: number, name: string) => [
                            `¥${value.toLocaleString()}`,
                            name,
                          ]}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

            {/* Budget Progress Section */}
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                预算进度
              </h2>

              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-gray-600">加载预算数据中...</p>
                </div>
              ) : error ? (
                <div className="bg-red-50 border-l-4 border-red-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-red-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              ) : budgetProgress ? (
                <BudgetProgressBar
                  budgetProgress={{
                    categories: budgetProgress.categories || {},
                    total: budgetProgress.total || {
                      budget: 0,
                      spent: 0,
                      remaining: 0,
                      percentage: 0,
                      overBudget: false,
                    },
                  }}
                  getCategoryColor={getCategoryColor}
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  暂无预算数据
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Category Budgets */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">分类预算</h2>

          {/* Add Category Form */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="分类名称"
            />
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                ¥
              </span>
              <input
                type="number"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                className="flex-1 min-w-0 w-32 px-3 py-2 border border-l-0 border-gray-300 rounded-r-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="金额"
                min="0"
                step="10"
              />
            </div>
            <button
              onClick={addCategory}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center"
            >
              <Plus className="h-4 w-4 mr-1" />
              添加
            </button>
          </div>

          {/* Categories List */}
          <div className="space-y-4">
            {categories.map((category, index) => (
              <div
                key={index}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {category.name}
                  </div>
                  {budgetProgress?.categories[category.name] && (
                    <div className="text-sm text-gray-500">
                      已用: ¥
                      {budgetProgress.categories[
                        category.name
                      ].spent.toLocaleString()}{" "}
                      (
                      {budgetProgress.categories[
                        category.name
                      ].percentage.toFixed(2)}
                      %)
                    </div>
                  )}
                </div>
                <div className="w-full sm:w-48">
                  <div className="flex items-center">
                    <span className="mr-2 text-gray-700">¥</span>
                    <input
                      type="number"
                      value={category.amount}
                      onChange={(e) => {
                        const newCategories = [...categories];
                        newCategories[index].amount =
                          Number(e.target.value) || 0;
                        setCategories(newCategories);
                      }}
                      className="w-full px-3 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      step="10"
                    />
                  </div>
                  {budgetProgress?.categories[category.name] && (
                    <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          budgetProgress.categories[category.name].overBudget
                            ? "bg-red-500"
                            : "bg-blue-500"
                        }`}
                        style={{
                          width: `${Math.min(100, budgetProgress.categories[category.name].percentage)}%`,
                        }}
                      ></div>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => removeCategory(index)}
                  className="text-red-600 hover:text-red-800 p-1"
                  title="删除分类"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))}

            {categories.length === 0 && (
              <div className="text-center py-6 text-gray-500">
                暂无分类预算，请添加分类
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={saveBudget}
            disabled={isSaving}
            className={`px-6 py-2 rounded-md text-white font-medium flex items-center ${
              isSaving ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
          >
            {isSaving ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                保存中...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-1" />
                保存预算
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
