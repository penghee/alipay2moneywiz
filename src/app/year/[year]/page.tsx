'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, TrendingUp, DollarSign, BarChart3, PieChart, Wallet, Filter, User } from 'lucide-react';
import dynamic from 'next/dynamic';
import ownersData from '@/config/bill_owners.json';

// Dynamically import client-side components
const ThresholdSlider = dynamic(
  () => import('@/components/ThresholdSlider'),
  { ssr: false }
);

const ExpenseBreakdown = dynamic(
  () => import('@/components/ExpenseBreakdown'),
  { ssr: false }
);
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

interface CategoryStats {
  amount: number;
  count: number;
}

interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string;
  description: string;
}

interface YearlyStats {
  totalIncome: number;
  totalExpense: number;
  totalBalance: number;
  categoryStats: Record<string, CategoryStats>;
  monthlyData: Array<{
    month: number;
    income: number;
    expense: number;
    balance: number;
  }>;
  expenses?: Expense[]; // Add expenses to the stats if available
}

interface MonthData {
  months: number[];
}

export default function YearPage({ params }: { params: Promise<{ year: string }> }) {
  const [stats, setStats] = useState<YearlyStats | null>(null);
  const [months, setMonths] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState<number | null>(null);
  const [prevYearStats, setPrevYearStats] = useState<YearlyStats | null>(null);
  const [budgetUsed, setBudgetUsed] = useState<number>(0);
  const [totalBudget, setTotalBudget] = useState<number>(0);
  const [selectedOwner, setSelectedOwner] = useState<string>('all');
  const [cashAssets, setCashAssets] = useState<number>(0);
  const [liquidityRatio, setLiquidityRatio] = useState<number>(0);
  const router = useRouter();

  const owners = useMemo(() => [
    { id: 'all', name: '全部' },
    ...ownersData.owners
  ], []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 首先解析 params
        const resolvedParams = await params;
        const yearNum = parseInt(resolvedParams.year);
        
        if (isNaN(yearNum)) {
          console.error('Invalid year parameter:', resolvedParams.year);
          setLoading(false);
          return;
        }
        
        setYear(yearNum);
        
        // Build query parameters
        const queryParams = new URLSearchParams();
        if (selectedOwner !== 'all') {
          queryParams.append('owner', selectedOwner);
        }
        
        const [statsRes, monthsRes, budgetRes, prevYearRes] = await Promise.all([
          fetch(`/api/stats/yearly/${yearNum}?${queryParams.toString()}`),
          fetch(`/api/years/${yearNum}/months?${queryParams.toString()}`),
          fetch(`/api/budget/progress?year=${yearNum}&${queryParams.toString()}`).then(res => res.ok ? res.json() : { total: { budget: 0, spent: 0 } }),
          // Fetch previous year's data for comparison
          fetch(`/api/stats/yearly/${yearNum - 1}?${queryParams.toString()}`).then(res => res.ok ? res.json() : null).catch(() => null)
        ]);
        
        if (prevYearRes) {
          setPrevYearStats(prevYearRes);
        }

        // 设置预算数据
        if (budgetRes && budgetRes.total) {
          setTotalBudget(budgetRes.total.budget);
          setBudgetUsed(budgetRes.total.spent);
        }

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        if (monthsRes.ok) {
          const monthsData = await monthsRes.json();
          setMonths(monthsData.months);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params, selectedOwner]);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };
  // Calculate averages
  const averageMonthlyExpense = useMemo(() => {
    if (!stats) return 0;
    return stats.totalExpense / stats.monthlyData.length;
  }, [stats]);

  const averageMonthlyIncome = stats ? Math.round((stats.totalIncome / stats.monthlyData.length) * 100) / 100 : 0;

  // Calculate average monthly expense per category
  const averageCategoryExpenses = stats ? Object.entries(stats.categoryStats)
    .map(([category, data]) => ({
      category,
      average: Math.round((data.amount / stats.monthlyData.length) * 100) / 100,
      total: data.amount,
      count: data.count,
      percentage: Math.round((data.amount / stats.totalExpense) * 100) || 0
    }))
    .sort((a, b) => b.average - a.average) : [];

  // Calculate liquidity ratio
  useEffect(() => {
    const fetchLiquidityRatio = async () => {
      try {
        const response = await fetch('/api/summary');
        if (response.ok) {
          const data = await response.json();
          // Use the pre-calculated cashAssets from the API
          const cashAssets = data.cashAssets || 0;
          setCashAssets(cashAssets);
          // Calculate ratio (months of coverage)
          const currentAvgExpense = averageMonthlyExpense;
          if (currentAvgExpense > 0) {
            setLiquidityRatio(cashAssets / currentAvgExpense);
          }
        }
      } catch (error) {
        console.error('Error fetching liquidity data:', error);
      }
    };

    if (averageMonthlyExpense > 0) {
      fetchLiquidityRatio();
    }
  }, [averageMonthlyExpense]);

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
              无法加载 {year || '未知'} 年的统计数据
            </p>
          </div>
        </div>
      </div>
    );
  }

  const chartData = stats.monthlyData.map(data => ({
    month: `${data.month}月`,
    income: data.income,
    expense: data.expense,
    balance: data.balance
  }));

  // 准备分类饼图数据
  const pieData = stats ? Object.entries(stats.categoryStats)
    .map(([category, data]) => ({
      name: category,
      value: data.amount,
      count: data.count,
      average: Math.round((data.amount / stats.monthlyData.length) * 100) / 100,
      total: data.amount,
      percentage: Math.round((data.amount / stats.totalExpense) * 100) || 0
    }))
    .sort((a, b) => b.value - a.value) : [];

  // 颜色配置
  const COLORS = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
  ];

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
          
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="flex items-center space-x-3">
              <Calendar className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {year || '未知'}年 财务统计
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">总收入</p>
                <p className="text-2xl font-bold text-green-600">
                  ¥{formatMoney(stats.totalIncome)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">总支出</p>
                <p className="text-2xl font-bold text-red-600">
                  ¥{formatMoney(stats.totalExpense)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-red-600 rotate-180" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">结余</p>
                <p className={`text-2xl font-bold ${stats.totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ¥{formatMoney(stats.totalBalance)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {/* 结余比率 */}
                  结余比率 {((stats.totalBalance / stats.totalIncome) * 100).toFixed(2)}%
                </p>
                {stats.totalIncome > 0 && (
                  <div className="mt-2">
                    <p className={`text-sm font-medium ${
                      (stats.totalIncome - stats.totalExpense) / stats.totalIncome < 0.1 ? 'text-red-600' : 
                      (stats.totalIncome - stats.totalExpense) / stats.totalIncome <= 0.2 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {((stats.totalIncome - stats.totalExpense) / stats.totalIncome * 100).toFixed(1)}%
                      <span className="text-xs ml-1 text-gray-500">
                        {(stats.totalIncome - stats.totalExpense) / stats.totalIncome < 0.1 ? ' (储蓄能力偏弱)' : 
                         (stats.totalIncome - stats.totalExpense) / stats.totalIncome <= 0.2 ? ' (健康区)' : ' (优秀区)'}
                      </span>
                    </p>
                  </div>
                )}
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          {/* 平均月支出 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">平均月支出</p>
                <p className="text-2xl font-bold text-purple-600">
                  ¥{formatMoney(averageMonthlyExpense)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  共 {stats.monthlyData.length} 个月数据
                </p>
                {averageMonthlyExpense > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <div className="flex items-center">
                      <p className="text-xs font-medium text-gray-600">流动性覆盖率</p>
                      <div className="ml-1 group relative">
                        <span className="text-xs text-gray-400 cursor-help">ⓘ</span>
                        <div className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-2 text-xs text-gray-700 bg-white rounded shadow-lg border border-gray-200 z-10">
                          流动性资产 / 月均支出 (安全垫)<br/>
                          3-6个月为健康区间，表示您的应急资金可以支撑3-6个月的正常生活。
                        </div>
                      </div>
                    </div>
                    <p className={`text-sm font-medium ${
                      liquidityRatio < 3 ? 'text-red-600' : 
                      liquidityRatio <= 6 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {liquidityRatio.toFixed(1)} 个月(¥{formatMoney(cashAssets)})
                      <span className="text-xs ml-1 text-gray-500">
                        {liquidityRatio < 3 ? ' (需增加应急储备)' : 
                         liquidityRatio <= 6 ? ' (健康)' : ' (充足)'}
                      </span>
                    </p>
                  </div>
                )}
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          {/* 平均月收入 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">平均月收入</p>
                <p className="text-2xl font-bold text-green-600">
                  ¥{formatMoney(averageMonthlyIncome)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  共 {stats.monthlyData.length} 个月数据
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-600" />
            </div>
          </div>


          {/* 预算概览 */}
          <div 
            className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push(`/year/${year}/budget`)}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center">
                  <p className="text-sm font-medium text-gray-600">年度预算</p>
                  <span className="ml-2 text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                    {totalBudget > 0 ? `${((budgetUsed / totalBudget) * 100).toFixed(2)}%` : '0.00%'}
                  </span>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  ¥{formatMoney(totalBudget)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  已用: ¥{formatMoney(budgetUsed)}
                </p>
              </div>
              <Wallet className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${totalBudget > 0 ? Math.min(100, (budgetUsed / totalBudget) * 100) : 0}%` }}
              ></div>
            </div>
          </div>
        </div>
      
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
                    name === 'income' ? '收入' : name === 'expense' ? '支出' : '结余'
                  ]}
                />
                <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} />
                <Line type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={2} />
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
                    name === 'income' ? '收入' : '支出'
                  ]}
                />
                <Bar dataKey="income" fill="#10b981" />
                <Bar dataKey="expense" fill="#ef4444" />
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
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number, name: string) => [`¥${formatMoney(value)}`, name]}
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
                    '金额'
                  ]}
                />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
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
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    分类
                  </th>
                  <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    总金额
                  </th>
                  <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    月均
                    <div className="text-xs font-normal text-gray-400">({stats.monthlyData.length}个月)</div>
                  </th>
                  <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    占比
                  </th>
                  <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    交易笔数
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
                    {averageCategoryExpenses.reduce((sum, item) => sum + item.count, 0)} 笔
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
        {/* Monthly Details */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            月度详情
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {months.map(month => (
              <div
                key={month}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => year && router.push(`/year/${year}/month/${month}`)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{month}月</h4>
                  <span className="text-sm text-blue-600">查看详情 →</span>
                </div>
                <div className="text-sm text-gray-600">
                  点击查看详细统计
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
