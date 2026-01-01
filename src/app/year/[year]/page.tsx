"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/apiClient";
import {
  ArrowLeft,
  Calendar,
  BarChart3,
  PieChart,
  Filter,
  User,
  Tag,
} from "lucide-react";
import dynamic from "next/dynamic";
import ownersData from "@/config/bill_owners.json";
import ExpenseBreakdown from "@/components/ExpenseBreakdown";
import TagBreakdown from "@/components/TaggedExpenseBreakdown";
import ExpenseByWeekday from "@/components/ExpenseByWeekday";
import { formatMoney } from "@/lib/utils";
import { Expense } from "@/types/api";
import PreviewDialog from "@/components/ui/Dialog";
import ExpensePreview from "@/components/ExpensesPreview";

const NAME_MAP: Record<string, string> = {
  income: "收入",
  expense: "支出",
  balance: "结余",
  salary: "工资",
};

// Dynamically import client-side components
const ThresholdSlider = dynamic(() => import("@/components/ThresholdSlider"), {
  ssr: false,
});

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts";
import { YearlyStats } from "@/types/api";
import YearSummaryCards from "@/components/YearSummaryCards";
import { getCategoryColor, COLOR_PALETTE } from "@/lib/colors";
import SankeyChart from "@/components/charts/SankeyChart";

export default function YearPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const [stats, setStats] = useState<YearlyStats | null>(null);
  const [months, setMonths] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState<number | null>(null);
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

        if (isNaN(yearNum)) {
          console.error("Invalid year parameter:", resolvedParams.year);
          setLoading(false);
          return;
        }

        setYear(yearNum);
        const [statsData, months] = await Promise.all([
          apiClient.getYearlyStats(yearNum, selectedOwner),
          apiClient.getMonthsInYear(yearNum, selectedOwner),
        ]);

        // Update state with fetched data
        setStats(statsData);
        setMonths(months);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params, selectedOwner]);

  // Calculate averages
  const averageMonthlyExpense = useMemo(() => {
    if (!stats || !stats.totalExpense || !stats.monthlyData) return 0;
    return stats.totalExpense / stats.monthlyData.length;
  }, [stats]);

  // Calculate average monthly expense per category
  const averageCategoryExpenses = useMemo(() => {
    if (
      !stats ||
      !stats.categoryStats ||
      !stats.monthlyData ||
      !stats.totalExpense
    )
      return [];
    return Object.entries(stats.categoryStats)
      .map(([category, data]) => ({
        category,
        average:
          Math.round((data.amount / (stats.monthlyData?.length || 0)) * 100) /
          100,
        total: data.amount,
        count: data.count,
        percentage:
          Math.round((data.amount / (stats.totalExpense || 0)) * 100) || 0,
        expenses: data.expenses,
      }))
      .sort((a, b) => b.average - a.average);
  }, [stats]);

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
              无法加载 {year || "未知"} 年的统计数据
            </p>
          </div>
        </div>
      </div>
    );
  }

  const chartData =
    stats?.monthlyData?.map((data) => ({
      ...data,
      month: `${data.month}月`,
    })) || [];

  // 准备分类饼图数据
  const pieData = stats
    ? Object.entries(stats?.categoryStats || {})
        .map(([category, data]) => ({
          name: category,
          value: data.amount,
          count: data.count,
          average:
            Math.round(
              (data.amount / (stats?.monthlyData?.length || 0)) * 100,
            ) / 100,
          total: data.amount,
          percentage:
            Math.round((data.amount / (stats?.totalExpense || 0)) * 100) || 0,
          color: getCategoryColor(category),
        }))
        .sort((a, b) => b.value - a.value)
    : [];

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
            <div className="flex items-center space-x-3">
              <Calendar className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {year || "未知"}年 财务统计
              </h1>
            </div>

            <div className="flex items-center space-x-2">
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
        <YearSummaryCards year={year} selectedOwner={selectedOwner} />

        {/* Monthly Trend Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Monthly Trend */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              月度趋势
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `¥${formatMoney(value)}`,
                    NAME_MAP[name],
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke="#10b981"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="expense"
                  stroke="#ef4444"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="balance"
                  stroke="#3b82f6"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="salary"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly Comparison */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              收支对比
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `¥${formatMoney(value)}`,
                    NAME_MAP[name],
                  ]}
                />
                <Bar dataKey="income" fill="#10b981" />
                <Bar dataKey="expense" fill="#ef4444" />
                <Bar dataKey="salary" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/* Category Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Category Distribution Pie Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <PieChart className="h-5 w-5 mr-2" />
              年度支出分类分布
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
                      fill={COLOR_PALETTE[index % COLOR_PALETTE.length]}
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
              年度分类支出金额
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
            年度支出流向
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <SankeyChart data={stats.sankeyData} />
          </ResponsiveContainer>
        </div>

        {/* Category Details Table */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              年度分类明细
            </h3>
            <button
              onClick={() => router.push(`/year/${year}/category`)}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
            >
              查看详情
              <svg
                className="w-4 h-4 ml-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    分类
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    总金额
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    月均
                    <div className="text-xs font-normal text-gray-400">
                      ({stats.monthlyData.length}个月)
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    占比
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    交易笔数
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {averageCategoryExpenses.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.category}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                      ¥{formatMoney(item.total)}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                      ¥{formatMoney(item.average)}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-right">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {item.percentage}%
                      </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-right text-gray-500">
                      {item.count} 笔
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-right text-gray-500">
                      <button
                        onClick={() => {
                          setPreviewExpenses(item.expenses);
                          setOpenPreview(true);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        查看
                      </button>
                    </td>
                  </tr>
                ))}
                {/* 总计行 */}
                <tr className="bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                    总计
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm font-semibold text-right text-gray-900">
                    ¥{formatMoney(stats.totalExpense)}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm font-semibold text-right text-gray-900">
                    ¥{formatMoney(averageMonthlyExpense)}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-right">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-600 text-white">
                      100%
                    </span>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm font-semibold text-right text-gray-900">
                    {averageCategoryExpenses.reduce(
                      (sum, item) => sum + item.count,
                      0,
                    )}{" "}
                    笔
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
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

        {/* Monthly Details */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            月度详情
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {months.map((month) => (
              <div
                key={month}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() =>
                  year && router.push(`/year/${year}/month/${month}`)
                }
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{month}月</h4>
                  <span className="text-sm text-blue-600">查看详情 →</span>
                </div>
                <div className="text-sm text-gray-600">点击查看详细统计</div>
              </div>
            ))}
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
