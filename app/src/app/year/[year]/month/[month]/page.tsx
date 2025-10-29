'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, TrendingUp, DollarSign, PieChart, BarChart3, Filter } from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import dynamic from 'next/dynamic';

// Dynamically import client-side components
const ThresholdSlider = dynamic(
  () => import('@/components/ThresholdSlider'),
  { ssr: false }
);

const ExpenseBreakdown = dynamic(
  () => import('@/components/ExpenseBreakdown'),
  { ssr: false }
);

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

interface MonthlyStats {
  income: number;
  expense: number;
  balance: number;
  categoryStats: Record<string, CategoryStats>;
  totalTransactions: number;
  expenses?: Expense[];
  prevMonthStats?: {
    amount: number;
    count: number;
  };
  prevYearStats?: {
    amount: number;
    count: number;
  };
}

export default function MonthPage({ params }: { params: Promise<{ year: string; month: string }> }) {
  const [stats, setStats] = useState<MonthlyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState<number | null>(null);
  const [month, setMonth] = useState<number | null>(null);
  const [prevMonthData, setPrevMonthData] = useState<Record<string, CategoryStats>>({});
  const [prevYearData, setPrevYearData] = useState<Record<string, CategoryStats>>({});
  
  // Type for the monthly API response
  interface MonthlyApiResponse {
    categoryStats?: Record<string, CategoryStats>;
    // Add other fields from the API response if needed
  }
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 首先解析 params
        const resolvedParams = await params;
        const yearNum = parseInt(resolvedParams.year);
        const monthNum = parseInt(resolvedParams.month);
        
        if (isNaN(yearNum) || isNaN(monthNum)) {
          console.error('Invalid year or month parameter:', resolvedParams);
          setLoading(false);
          return;
        }
        
        setYear(yearNum);
        setMonth(monthNum);
        
        const [currentMonthRes, prevMonthRes, prevYearRes] = await Promise.all([
          fetch(`/api/stats/monthly/${yearNum}/${monthNum}`),
          // Get previous month's data
          fetch(`/api/stats/monthly/${
            monthNum === 1 ? yearNum - 1 : yearNum
          }/${monthNum === 1 ? 12 : monthNum - 1}`).then(res => res.ok ? res.json() : {}) as Promise<MonthlyApiResponse>,
          // Get same month last year's data
          fetch(`/api/stats/monthly/${yearNum - 1}/${monthNum}`).then(res => res.ok ? res.json() : {}) as Promise<MonthlyApiResponse>
        ]);

        if (currentMonthRes.ok) {
          const data = await currentMonthRes.json();
          setStats(data);
          
          // Process comparison data
          if (prevMonthRes && prevMonthRes.categoryStats) {
            setPrevMonthData(prevMonthRes.categoryStats);
          } else {
            setPrevMonthData({});
          }
          
          if (prevYearRes && prevYearRes.categoryStats) {
            setPrevYearData(prevYearRes.categoryStats);
          } else {
            setPrevYearData({});
          }
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params]);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
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

  if (!stats || !year || !month) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
            <h3 className="text-lg font-medium text-red-800 mb-2">
              数据加载失败
            </h3>
            <p className="text-red-700">
              无法加载 {year || '未知'}年{month || '未知'}月的统计数据
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 准备饼图数据
  const pieData = Object.entries(stats.categoryStats)
    .map(([category, data]) => ({
      name: category,
      value: data.amount,
      count: data.count
    }))
    .sort((a, b) => b.value - a.value);

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
          
          <div className="flex items-center space-x-3">
            <Calendar className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              {year || '未知'}年{month || '未知'}月 财务统计
            </h1>
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
                <p className={`text-2xl font-bold ${stats.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ¥{formatMoney(stats.balance)}
                </p>
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
                  formatter={(value: number) => [`¥${formatMoney(value)}`, '金额']}
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
                    '金额'
                  ]}
                />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pieData.map((item, index) => (
                  <tr key={item.name}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div 
                          className="w-4 h-4 rounded-full mr-3"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
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
                        <span className={`${item.value > (prevMonthData[item.name]?.amount || 0) ? 'text-red-600' : 'text-green-600'}`}>
                          {item.value > (prevMonthData[item.name]?.amount || 0) ? '↑' : '↓'}
                          {prevMonthData[item.name]?.amount ? 
                            `${Math.abs(Math.round((item.value / prevMonthData[item.name].amount - 1) * 100))}%` :
                            'N/A'}
                        </span>
                      ) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {prevYearData[item.name] ? (
                        <span className={`${item.value > (prevYearData[item.name]?.amount || 0) ? 'text-red-600' : 'text-green-600'}`}>
                          {item.value > (prevYearData[item.name]?.amount || 0) ? '↑' : '↓'}
                          {prevYearData[item.name]?.amount ? 
                            `${Math.abs(Math.round((item.value / prevYearData[item.name].amount - 1) * 100))}%` :
                            'N/A'}
                        </span>
                      ) : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
