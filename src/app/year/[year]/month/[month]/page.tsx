"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/apiClient";
import {
  ArrowLeft,
  Calendar,
  TrendingUp,
  DollarSign,
  PieChart,
  BarChart3,
  Filter,
  User,
  Tag,
} from "lucide-react";
import ownersData from "@/config/bill_owners.json";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import dynamic from "next/dynamic";
import ExpenseByWeekday from "@/components/ExpenseByWeekday";
import ExpenseBreakdown from "@/components/ExpenseBreakdown";
import TagBreakdown from "@/components/TaggedExpenseBreakdown";
import { Expense, MonthlyStats } from "@/types/api";
import { formatMoney } from "@/lib/utils";
import SankeyChart from "@/components/charts/SankeyChart";
import PreviewDialog from "@/components/ui/Dialog";
import ExpensePreview from "@/components/ExpensesPreview";

// Dynamically import client-side components
const ThresholdSlider = dynamic(() => import("@/components/ThresholdSlider"), {
  ssr: false,
});

interface CategoryStats {
  amount: number;
  count: number;
}

export default function MonthPage({
  params,
}: {
  params: Promise<{ year: string; month: string }>;
}) {
  const [stats, setStats] = useState<MonthlyStats | null>(null);
  const [topExpensesLimit, setTopExpensesLimit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState<number | null>(null);
  const [month, setMonth] = useState<number | null>(null);
  const [prevMonthData, setPrevMonthData] = useState<
    Record<string, CategoryStats>
  >({});
  const [prevYearData, setPrevYearData] = useState<
    Record<string, CategoryStats>
  >({});
  const [selectedOwner, setSelectedOwner] = useState<string>("all");
  const [openPreview, setOpenPreview] = useState(false);
  const [previewExpenses, setPreviewExpenses] = useState<Expense[]>([]);
  const router = useRouter();

  const owners = useMemo(
    () => [{ id: "all", name: "全部" }, ...ownersData.owners],
    [],
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 首先解析 params
        const resolvedParams = await params;
        const yearNum = parseInt(resolvedParams.year);
        const monthNum = parseInt(resolvedParams.month);

        if (isNaN(yearNum) || isNaN(monthNum)) {
          console.error("Invalid year or month parameter:", resolvedParams);
          setLoading(false);
          return;
        }

        setYear(yearNum);
        setMonth(monthNum);

        const owner = selectedOwner !== "all" ? selectedOwner : undefined;

        try {
          // Current month data
          const currentMonthData = (await apiClient.getMonthlyStats(
            yearNum,
            monthNum,
            owner,
          )) as MonthlyStats;
          setStats(currentMonthData);

          // Previous month data
          const prevMonthData = await apiClient
            .getMonthlyStats(
              monthNum === 1 ? yearNum - 1 : yearNum,
              monthNum === 1 ? 12 : monthNum - 1,
              owner,
            )
            .catch(() => ({}) as MonthlyStats);

          // Same month last year data
          const prevYearData = await apiClient
            .getMonthlyStats(yearNum - 1, monthNum, owner)
            .catch(() => ({}) as MonthlyStats);

          const toCategoryRecord = (
            stats: MonthlyStats | null,
          ): Record<string, CategoryStats> => {
            if (!stats) return {};

            // If we have categoryStats (old format), use it directly
            if (stats.categoryStats) {
              return stats.categoryStats;
            }
            return {};
          };

          // Process comparison data
          setPrevMonthData(toCategoryRecord(prevMonthData));
          setPrevYearData(toCategoryRecord(prevYearData));
        } catch (error) {
          console.error("Failed to fetch data:", error);
          setPrevMonthData({});
          setPrevYearData({});
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params, selectedOwner]);

  const fitleredExpenses = useMemo(() => {
    if (!stats) return [];
    if (!topExpensesLimit) return stats.expenses;
    return [...stats.expenses]
      .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
      .slice(0, topExpensesLimit);
  }, [stats, topExpensesLimit]);

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

  if (!stats || !year || !month) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
            <h3 className="text-lg font-medium text-red-800 mb-2">
              数据加载失败
            </h3>
            <p className="text-red-700">
              无法加载 {year || "未知"}年{month || "未知"}月的统计数据
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 准备饼图数据
  const categoryStats = stats.categoryStats;

  const pieData = Object.entries(categoryStats)
    .map(([category, data]) => ({
      name: category,
      value: data.amount,
      count: data.count,
    }))
    .sort((a, b) => b.value - a.value);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto px-4 py-8">
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
            <Calendar className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              {year || "未知"}年{month || "未知"}月 财务统计
            </h1>
            <div className="flex items-center space-x-2 ml-4">
              <User className="h-5 w-5 text-gray-500" />
              <select
                value={selectedOwner}
                onChange={(e) => setSelectedOwner(e.target.value)}
                className="w-32 px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {owners.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">收入</p>
                <p className="text-2xl font-bold text-green-600">
                  ¥{formatMoney(stats.income)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  (工资: ¥{formatMoney(stats.totalSalary)})
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">支出</p>
                <p className="text-2xl font-bold text-red-600">
                  ¥{formatMoney(stats.expense)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-red-600 rotate-180" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">结余</p>
                <p
                  className={`text-2xl font-bold ${stats.balance >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  ¥{formatMoney(stats.balance)}
                </p>
                {stats.income > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500">储蓄率</p>
                    <p
                      className={`text-sm font-medium ${
                        (stats.income - stats.expense) / stats.income < 0.1
                          ? "text-red-600"
                          : (stats.income - stats.expense) / stats.income <= 0.2
                            ? "text-yellow-600"
                            : "text-green-600"
                      }`}
                    >
                      {(
                        ((stats.income - stats.expense) / stats.income) *
                        100
                      ).toFixed(1)}
                      %
                      <span className="text-xs ml-1 text-gray-500">
                        {(stats.income - stats.expense) / stats.income < 0.1
                          ? " (储蓄能力偏弱)"
                          : (stats.income - stats.expense) / stats.income <= 0.2
                            ? " (健康区)"
                            : " (优秀区)"}
                      </span>
                    </p>
                  </div>
                )}
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">交易笔数</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalTransactions}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-gray-600" />
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Category Distribution Pie Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <PieChart className="h-5 w-5 mr-2" />
              支出分类分布
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(Number(percent) * 100).toFixed(1)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `¥${formatMoney(value)}`,
                    name,
                  ]}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>

          {/* Category Amount Bar Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              分类支出金额
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={pieData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `¥${formatMoney(value)}`,
                    name,
                  ]}
                />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sankey Chart */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            月度支出流向
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <SankeyChart data={stats.sankeyData} />
          </ResponsiveContainer>
        </div>

        {/* Top Expenses Table */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              {topExpensesLimit === -1
                ? `全部支出${stats.expenses.length}条`
                : `单笔支出TOP ${topExpensesLimit}`}
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
                <option value={-1}>全部</option>
                <option value={20}>20 条</option>
                <option value={50}>50 条</option>
                <option value={100}>100 条</option>
              </select>
            </div>
          </div>

          {stats.expenses && stats.expenses.length > 0 ? (
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
                  {fitleredExpenses.map((expense, index) => (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {expense.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div
                            className="w-3 h-3 rounded-full mr-2"
                            style={{
                              backgroundColor:
                                COLORS[index % COLORS.length] || "#9CA3AF",
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
                        ¥{formatMoney(expense.amount)}{" "}
                        {expense.isRefund ? "(退款)" : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">暂无支出数据</div>
          )}
        </div>

        {/* Threshold-based Expense Analysis */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              支出阈值分析
            </h3>
            <div className="w-1/2 max-w-md">
              <ThresholdSlider />
            </div>
          </div>

          {stats.expenses && stats.expenses.length > 0 ? (
            <ExpenseBreakdown expenses={stats.expenses} />
          ) : (
            <div className="text-center py-8 text-gray-500">
              暂无详细的交易数据用于阈值分析
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mt-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Tag className="h-5 w-5 mr-2" />
              标签分析
            </h3>
          </div>

          {stats.expenses && stats.expenses.length > 0 ? (
            <TagBreakdown expenses={stats.expenses} />
          ) : (
            <div className="text-center py-8 text-gray-500">
              暂无详细的交易数据用于标签分析
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mt-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              按周分析
            </h3>
          </div>

          {stats.expenses && stats.expenses.length > 0 ? (
            <ExpenseByWeekday expenses={stats.expenses} />
          ) : (
            <div className="text-center py-8 text-gray-500">
              暂无详细的交易数据用于按周分析
            </div>
          )}
        </div>
        {/* Category Details Table */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            分类明细
          </h3>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    分类
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    金额
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    占比
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    笔数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    环比上月
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    同比去年
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pieData.map((item, index) => (
                  <tr key={item.name}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div
                          className="w-4 h-4 rounded-full mr-3"
                          style={{
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        ></div>
                        <span className="text-sm font-medium text-gray-900">
                          {item.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ¥{formatMoney(item.value)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {((item.value / stats.expense) * 100).toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {prevMonthData[item.name] ? (
                        <span
                          className={`${item.value > (prevMonthData[item.name]?.amount || 0) ? "text-red-600" : "text-green-600"}`}
                        >
                          {item.value > (prevMonthData[item.name]?.amount || 0)
                            ? "↑"
                            : "↓"}
                          {prevMonthData[item.name]?.amount
                            ? `${Math.abs(Math.round((item.value / prevMonthData[item.name].amount - 1) * 100))}%`
                            : "N/A"}
                        </span>
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {prevYearData[item.name] ? (
                        <span
                          className={`${item.value > (prevYearData[item.name]?.amount || 0) ? "text-red-600" : "text-green-600"}`}
                        >
                          {item.value > (prevYearData[item.name]?.amount || 0)
                            ? "↑"
                            : "↓"}
                          {prevYearData[item.name]?.amount
                            ? `${Math.abs(Math.round((item.value / prevYearData[item.name].amount - 1) * 100))}%`
                            : "N/A"}
                        </span>
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => {
                          setPreviewExpenses(
                            stats.expenses.filter(
                              (expense) => expense.category === item.name,
                            ),
                          );
                          setOpenPreview(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        查看
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <PreviewDialog
        open={openPreview}
        onOpenChange={setOpenPreview}
        title="交易预览"
      >
        <ExpensePreview expenses={previewExpenses} />
      </PreviewDialog>
    </div>
  );
}
