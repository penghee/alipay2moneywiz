"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, LineChart, Table, BarChart3 } from "lucide-react";
// Simple tab state instead of Tabs component
import { YearlyStats, CategoryStats } from "@/types/api";
import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  TooltipProps,
} from "recharts";
import { getCategoryColor } from "@/lib/colors";
import { apiClient } from "@/lib/apiClient";

const FIXED_CATEGORIES = ["餐饮", "交通", "购物", "住房", "医疗"];

type ComparisonData = {
  [year: number]: YearlyStats;
};

// Custom tooltip component
const CustomTooltip = ({
  active,
  payload,
  label,
}: TooltipProps<number, string> & {
  active?: boolean;
  payload?: Array<{ value?: number; name: string; color: string }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border border-gray-200 rounded shadow-lg">
        <p className="font-medium">{label}</p>
        {payload.map((entry, index) => (
          <p key={`tooltip-${index}`} style={{ color: entry.color }}>
            {entry.name}: ¥{entry.value?.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ComparePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [comparisonData, setComparisonData] = useState<ComparisonData>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"trend" | "categories" | "table">(
    "trend",
  );
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set(FIXED_CATEGORIES),
  );

  // Fetch available years from API
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const years = await apiClient.getYears();
        setAvailableYears(years);
      } catch (error) {
        console.error("Failed to fetch years:", error);
        // Fallback to default years if API fails
        setAvailableYears(Array.from({ length: 13 }, (_, i) => 2013 + i));
      }
    };

    fetchYears();
  }, []);

  // Initialize selected years from URL params
  useEffect(() => {
    const yearsParam = searchParams.get("years");
    if (yearsParam) {
      const years = yearsParam
        .split(",")
        .map(Number)
        .filter((y) => !isNaN(y));
      setSelectedYears(years);
      fetchComparisonData(years);
    }
  }, [searchParams]);

  const fetchComparisonData = async (years: number[]) => {
    if (years.length === 0) return;

    setLoading(true);
    try {
      const data: ComparisonData = {};
      for (const year of years) {
        const stats = await apiClient.getYearlyStats(year);
        data[year] = stats;
      }
      setComparisonData(data);
    } catch (error) {
      console.error("Failed to fetch comparison data:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleYearSelection = (year: number) => {
    const newSelectedYears = selectedYears.includes(year)
      ? selectedYears.filter((y) => y !== year)
      : [...selectedYears, year].sort();

    setSelectedYears(newSelectedYears);
    router.push(`/compare?years=${newSelectedYears.join(",")}`, {
      scroll: false,
    });
  };

  // Prepare data for charts
  const monthlyExpenseData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    return months.map((month) => {
      const result: { [key: string]: string | number; name: string } = {
        name: `${month}月`,
      };
      selectedYears.forEach((year) => {
        const stats = comparisonData[year];
        const monthData = stats?.monthlyData?.find((m) => m.month === month);
        result[year] = monthData ? Math.abs(monthData.expense) : 0;
      });
      return result;
    });
  }, [comparisonData, selectedYears]);

  const toggleCategory = (category: string) => {
    const newSelected = new Set(selectedCategories);
    if (newSelected.has(category)) {
      newSelected.delete(category);
    } else {
      newSelected.add(category);
    }
    setSelectedCategories(newSelected);
  };

  const categoryComparisonData = useMemo(() => {
    // Get all unique categories across all selected years and filter by selected categories
    const allCategories = new Set<string>();
    selectedYears.forEach((year) => {
      const stats = comparisonData[year];
      if (stats?.categoryStats) {
        Object.keys(stats.categoryStats).forEach((cat) => {
          if (selectedCategories.has(cat)) {
            allCategories.add(cat);
          }
        });
      }
    });

    interface CategoryData {
      name: string;
      [year: string]: number | string;
    }

    return Array.from(allCategories)
      .map((category) => {
        const categoryData: CategoryData = { name: category };
        selectedYears.forEach((year) => {
          const stats = comparisonData[year];
          const amount = stats?.categoryStats?.[category]?.amount || 0;
          categoryData[year] = Math.abs(amount);
        });
        return categoryData;
      })
      .sort((a, b) => {
        // Sort by total amount across all years
        const totalA = selectedYears.reduce(
          (sum, year) => sum + Number(a[year] || 0),
          0,
        );
        const totalB = selectedYears.reduce(
          (sum, year) => sum + Number(b[year] || 0),
          0,
        );
        return totalB - totalA;
      });
  }, [comparisonData, selectedYears, selectedCategories]);

  const uniqueCategories = useMemo(() => {
    // Get all unique categories across all selected years and filter by selected categories
    const allCategories = new Set<string>();
    selectedYears.forEach((year) => {
      const stats = comparisonData[year];
      if (stats?.categoryStats) {
        Object.keys(stats.categoryStats).forEach((cat) => {
          allCategories.add(cat);
        });
      }
    });
    return Array.from(allCategories);
  }, [comparisonData, selectedYears]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">年度数据对比</h1>

      {/* Year Selection */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>选择要对比的年份</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {availableYears.map((year) => (
              <Button
                key={year}
                variant={selectedYears.includes(year) ? "default" : "outline"}
                onClick={() => toggleYearSelection(year)}
                className="flex items-center gap-2"
              >
                {selectedYears.includes(year) ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <X className="h-4 w-4" />
                )}
                {year}年
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : selectedYears.length > 0 ? (
        <div>
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab("trend")}
              className={`px-4 py-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === "trend"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <LineChart className="h-4 w-4" />
              趋势对比
            </button>
            <button
              onClick={() => setActiveTab("categories")}
              className={`px-4 py-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === "categories"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              分类对比
            </button>
            <button
              onClick={() => setActiveTab("table")}
              className={`px-4 py-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === "table"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Table className="h-4 w-4" />
              数据表格
            </button>
          </div>

          {activeTab === "trend" && (
            <Card>
              <CardHeader>
                <CardTitle>月度支出趋势</CardTitle>
              </CardHeader>
              <CardContent className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart
                    data={monthlyExpenseData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis
                      tickFormatter={(value) => `¥${value.toLocaleString()}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {selectedYears.map((year, index) => (
                      <Line
                        key={year}
                        type="monotone"
                        dataKey={year}
                        name={`${year}年`}
                        stroke={getCategoryColor(`compare-${year}`)}
                        activeDot={{ r: 8 }}
                      />
                    ))}
                  </RechartsLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {activeTab === "categories" && (
            <Card>
              <CardHeader>
                <CardTitle>分类支出对比</CardTitle>
              </CardHeader>
              <div className="px-6 pb-2">
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  选择要显示的分类（当前已选 {selectedCategories.size} 个）
                </h3>
                <div className="flex flex-wrap gap-2 bg-gray-50 p-2 rounded mb-4">
                  {uniqueCategories.map((category, index) => (
                    <button
                      key={category}
                      onClick={() => toggleCategory(category)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        selectedCategories.has(category)
                          ? "text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                      style={{
                        backgroundColor: selectedCategories.has(category)
                          ? getCategoryColor(`category-${index}`)
                          : "",
                      }}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
              <CardContent className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={categoryComparisonData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      type="number"
                      tickFormatter={(value) => `¥${value.toLocaleString()}`}
                    />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip
                      content={<CustomTooltip />}
                      formatter={(value) => [
                        `¥${value.toLocaleString()}`,
                        "金额",
                      ]}
                    />
                    <Legend />
                    {selectedYears.map((year, index) => (
                      <Bar
                        key={year}
                        dataKey={year}
                        name={`${year}年`}
                        fill={getCategoryColor(`compare-${year}`)}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {activeTab === "table" && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>详细数据对比</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          分类
                        </th>
                        {selectedYears.map((year) => (
                          <th
                            key={year}
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {year}年
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr className="bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          总收入
                        </td>
                        {selectedYears.map((year) => (
                          <td
                            key={year}
                            className="px-6 py-4 whitespace-nowrap text-sm text-green-500"
                          >
                            +¥
                            {Math.abs(
                              comparisonData[year]?.totalIncome || 0,
                            ).toLocaleString()}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          总支出
                        </td>
                        {selectedYears.map((year) => (
                          <td
                            key={year}
                            className="px-6 py-4 whitespace-nowrap text-sm text-red-500"
                          >
                            -¥
                            {Math.abs(
                              comparisonData[year]?.totalExpense || 0,
                            ).toLocaleString()}
                          </td>
                        ))}
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          结余
                        </td>
                        {selectedYears.map((year) => (
                          <td
                            key={year}
                            className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                              (comparisonData[year]?.totalBalance || 0) >= 0
                                ? "text-green-500"
                                : "text-red-500"
                            }`}
                          >
                            {(comparisonData[year]?.totalBalance || 0) >= 0
                              ? "+"
                              : ""}
                            ¥
                            {Math.abs(
                              comparisonData[year]?.totalBalance || 0,
                            ).toLocaleString()}
                          </td>
                        ))}
                      </tr>
                      {Object.keys(
                        comparisonData[selectedYears[0]]?.categoryStats || {},
                      ).map((category) => (
                        <tr key={category}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {category}
                          </td>
                          {selectedYears.map((year) => (
                            <td
                              key={year}
                              className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                            >
                              ¥
                              {Math.abs(
                                comparisonData[year]?.categoryStats?.[category]
                                  ?.amount || 0,
                              ).toLocaleString()}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            请选择至少一个年份进行对比
          </CardContent>
        </Card>
      )}
    </div>
  );
}
