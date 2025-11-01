"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, TrendingUp, BarChart3, Table2 } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { formatDate } from "date-fns";

interface CategoryMonthlyData {
  month: number;
  amount: number;
  count: number;
}

interface CategoryStats {
  amount: number;
  count: number;
}

interface TopExpense {
  date: string;
  category: string;
  amount: number;
  description: string;
}

interface CategoryYearlyStats {
  categories: string[];
  monthlyData: Record<string, CategoryMonthlyData[]>;
  totalByCategory: Record<string, CategoryStats>;
  totalExpense: number;
  topExpenses: TopExpense[];
}

export default function CategoryPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const [stats, setStats] = useState<CategoryYearlyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState<number | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set(),
  );
  const [topExpensesLimit, setTopExpensesLimit] = useState<number>(20);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resolvedParams = await params;
        const yearNum = parseInt(resolvedParams.year);

        if (isNaN(yearNum)) {
          console.error("Invalid year parameter:", resolvedParams.year);
          setLoading(false);
          return;
        }

        setYear(yearNum);

        const response = await fetch(`/api/stats/category/${yearNum}`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
          // 默认选择前5个分类
          setSelectedCategories(new Set(data.categories.slice(0, 5)));
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params]);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("zh-CN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(amount));
  };

  const toggleCategory = (category: string) => {
    const newSelected = new Set(selectedCategories);
    if (newSelected.has(category)) {
      newSelected.delete(category);
    } else {
      newSelected.add(category);
    }
    setSelectedCategories(newSelected);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!stats || !year) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
            <h3 className="text-lg font-medium text-red-800 mb-2">
              数据加载失败
            </h3>
            <p className="text-red-700">
              无法加载 {year || "未知"} 年的分类统计数据
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 定义类型
  interface TrendDataPoint {
    month: string;
    [key: string]: string | number;
  }

  interface MonthlyTableRow {
    month: number;
    [key: string]: number;
    total: number;
  }

  // 准备趋势图数据
  const allMonths = new Set<number>();
  Object.values(stats.monthlyData).forEach((data) => {
    data.forEach((item) => allMonths.add(item.month));
  });
  const sortedMonths = Array.from(allMonths).sort((a, b) => a - b);

  const trendData = sortedMonths.map((month) => {
    const dataPoint: TrendDataPoint = { month: `${month}月` };
    selectedCategories.forEach((category) => {
      const monthData = stats.monthlyData[category]?.find(
        (m) => m.month === month,
      );
      dataPoint[category] = monthData ? monthData.amount : 0;
    });
    return dataPoint;
  });

  // 颜色配置
  const COLORS = [
    "#3b82f6",
    "#ef4444",
    "#10b981",
    "#f59e0b",
    "#8b5cf6",
    "#06b6d4",
    "#84cc16",
    "#f97316",
    "#ec4899",
    "#6366f1",
    "#14b8a6",
    "#f43f5e",
    "#a855f7",
    "#22c55e",
    "#eab308",
  ];

  // 固定分类
  const FIXED_CATEGORIES = ["住房", "交通", "医疗"];

  // 准备分类数据
  const prepareCategoryData = () => {
    const fixedTotal = stats.categories
      .filter((cat) => FIXED_CATEGORIES.includes(cat))
      .reduce((sum, cat) => sum + (stats.totalByCategory[cat]?.amount || 0), 0);

    const optionalTotal = stats.categories
      .filter((cat) => !FIXED_CATEGORIES.includes(cat))
      .reduce((sum, cat) => sum + (stats.totalByCategory[cat]?.amount || 0), 0);

    return [
      {
        name: "固定支出",
        amount: fixedTotal,
        type: "fixed",
        color: "#3b82f6",
      },
      {
        name: "可选支出",
        amount: optionalTotal,
        type: "optional",
        color: "#10b981",
      },
    ];
  };

  const categoryData = prepareCategoryData();

  // 准备月度分类数据
  const prepareMonthlyCategoryData = () => {
    return sortedMonths.map((month) => {
      const monthData: { month: string; 固定支出: number; 可选支出: number } = {
        month: `${month}月`,
        固定支出: 0,
        可选支出: 0,
      };

      // 计算固定支出
      const fixedAmount = FIXED_CATEGORIES.reduce((sum, cat) => {
        const monthData = stats.monthlyData[cat]?.find(
          (m) => m.month === month,
        );
        return sum + (monthData?.amount || 0);
      }, 0);

      // 计算可选支出
      const optionalAmount = stats.categories
        .filter((cat) => !FIXED_CATEGORIES.includes(cat))
        .reduce((sum, cat) => {
          const monthData = stats.monthlyData[cat]?.find(
            (m) => m.month === month,
          );
          return sum + (monthData?.amount || 0);
        }, 0);

      monthData["固定支出"] = fixedAmount;
      monthData["可选支出"] = optionalAmount;

      return monthData;
    });
  };

  const monthlyCategoryData = prepareMonthlyCategoryData();

  // 准备月度支出表格数据
  const monthlyTableData: MonthlyTableRow[] = sortedMonths.map((month) => {
    const row: MonthlyTableRow = {
      month,
      total: 0,
      ...Object.fromEntries(stats.categories.map((cat) => [cat, 0])),
    };
    stats.categories.forEach((category) => {
      const monthData = stats.monthlyData[category]?.find(
        (m) => m.month === month,
      );
      row[category] = monthData ? monthData.amount : 0;
    });
    // 计算该月总支出
    row.total = stats.categories.reduce((sum, category) => {
      const monthData = stats.monthlyData[category]?.find(
        (m) => m.month === month,
      );
      return sum + (monthData ? monthData.amount : 0);
    }, 0);
    return row;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>返回</span>
          </button>

          <div className="flex items-center space-x-3">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              {year}年 分类趋势分析
            </h1>
          </div>
        </div>

        {/* Summary Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">年度总支出</p>
              <p className="text-3xl font-bold text-red-600">
                ¥{formatMoney(stats.totalExpense)}
              </p>
            </div>
            <TrendingUp className="h-12 w-12 text-red-600 rotate-180" />
          </div>
          <div className="mt-4 text-sm text-gray-600">
            共 {stats.categories.length} 个分类
          </div>
        </div>
        {/* 分类支出概览 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            分类支出概览
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {categoryData.map((item, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {item.name}
                    </p>
                    <p
                      className="text-2xl font-bold"
                      style={{ color: item.color }}
                    >
                      ¥{formatMoney(item.amount)}
                    </p>
                    <p className="text-sm text-gray-500">
                      占比{" "}
                      {((item.amount / stats.totalExpense) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div
                    className="h-12 w-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${item.color}20` }}
                  >
                    <div
                      className="h-8 w-8"
                      style={{
                        backgroundColor: item.color,
                        mask: "url(#bar-chart-mask)",
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyCategoryData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => [
                    `¥${formatMoney(Number(value))}`,
                    name,
                  ]}
                  labelFormatter={(label) => `${label}`}
                />
                <Legend />
                <Bar dataKey="固定支出" fill="#3b82f6" name="固定支出" />
                <Bar dataKey="可选支出" fill="#10b981" name="可选支出" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <svg width="0" height="0" className="hidden">
            <defs>
              <mask id="bar-chart-mask">
                <rect x="2" y="8" width="4" height="16" fill="white" />
                <rect x="10" y="4" width="4" height="20" fill="white" />
                <rect x="18" y="12" width="4" height="12" fill="white" />
              </mask>
            </defs>
          </svg>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            选择要显示的分类（当前已选 {selectedCategories.size} 个）
          </h3>
          <div className="flex flex-wrap gap-2">
            {stats.categories.map((category, index) => (
              <button
                key={category}
                onClick={() => toggleCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategories.has(category)
                    ? "text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                style={{
                  backgroundColor: selectedCategories.has(category)
                    ? COLORS[index % COLORS.length]
                    : undefined,
                }}
              >
                {category}
                <span className="ml-2 text-xs opacity-75">
                  ¥{formatMoney(stats.totalByCategory[category].amount)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Trend Chart */}
        {selectedCategories.size > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              月度分类趋势图
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `¥${formatMoney(value)}`,
                    name,
                  ]}
                />
                <Legend />
                {Array.from(selectedCategories).map((category) => (
                  <Line
                    key={category}
                    type="monotone"
                    dataKey={category}
                    stroke={
                      COLORS[stats.categories.indexOf(category) % COLORS.length]
                    }
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        {/* Top Expenses Table */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Table2 className="h-5 w-5 mr-2" />
              单笔支出TOP {topExpensesLimit}
            </h3>
            <div className="flex items-center">
              <label
                htmlFor="limit-select"
                className="text-sm text-gray-600 mr-2"
              >
                显示条数:
              </label>
              <select
                id="limit-select"
                value={topExpensesLimit}
                onChange={(e) => setTopExpensesLimit(Number(e.target.value))}
                className="block w-24 rounded-md border-gray-300 py-1 pl-2 pr-8 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              >
                <option value={20}>20 条</option>
                <option value={50}>50 条</option>
                <option value={100}>100 条</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    日期
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    分类
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    描述
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    金额
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.topExpenses
                  .slice(0, topExpensesLimit)
                  .map((expense, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(expense.date, "yyyy-MM-dd")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div
                            className="w-3 h-3 rounded-full mr-2"
                            style={{
                              backgroundColor:
                                COLORS[
                                  stats.categories.indexOf(expense.category) %
                                    COLORS.length
                                ] || "#9CA3AF",
                            }}
                          ></div>
                          <span className="text-sm text-gray-900">
                            {expense.category}
                          </span>
                        </div>
                      </td>
                      <td
                        className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate"
                        title={expense.description}
                      >
                        {expense.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-red-600">
                        ¥{formatMoney(expense.amount)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Category Summary Table */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            分类年度汇总
          </h3>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    分类
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    总金额
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    占比
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    笔数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    月均
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.categories.map((category, index) => {
                  const categoryData = stats.totalByCategory[category];
                  const monthCount = stats.monthlyData[category]?.length || 0;
                  const avgPerMonth =
                    monthCount > 0 ? categoryData.amount / monthCount : 0;

                  return (
                    <tr key={category} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div
                            className="w-4 h-4 rounded-full mr-3"
                            style={{
                              backgroundColor: COLORS[index % COLORS.length],
                            }}
                          ></div>
                          <span className="text-sm font-medium text-gray-900">
                            {category}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ¥{formatMoney(categoryData.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(
                          (categoryData.amount / stats.totalExpense) *
                          100
                        ).toFixed(1)}
                        %
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {categoryData.count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ¥{formatMoney(avgPerMonth)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Monthly Expense Table */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Table2 className="h-5 w-5 mr-2" />
            月度分类支出明细
          </h3>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50">
                    月份
                  </th>
                  {stats.categories.map((category, index) => (
                    <th
                      key={category}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        ></div>
                        <span>{category}</span>
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">
                    月度总计
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {monthlyTableData.map((row) => (
                  <tr key={row.month} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white">
                      {row.month}月
                    </td>
                    {stats.categories.map((category) => (
                      <td
                        key={category}
                        className="px-4 py-3 whitespace-nowrap text-sm text-gray-900"
                      >
                        {row[category] > 0
                          ? `¥${formatMoney(row[category])}`
                          : "-"}
                      </td>
                    ))}
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-blue-900 bg-blue-50">
                      ¥{formatMoney(row.total)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-100 font-semibold">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 sticky left-0 bg-gray-100">
                    总计
                  </td>
                  {stats.categories.map((category) => (
                    <td
                      key={category}
                      className="px-4 py-3 whitespace-nowrap text-sm text-gray-900"
                    >
                      ¥{formatMoney(stats.totalByCategory[category].amount)}
                    </td>
                  ))}
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-900 bg-blue-100">
                    ¥{formatMoney(stats.totalExpense)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
