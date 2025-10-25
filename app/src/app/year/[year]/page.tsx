'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, TrendingUp, DollarSign, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface YearlyStats {
  totalIncome: number;
  totalExpense: number;
  totalBalance: number;
  monthlyData: Array<{
    month: number;
    income: number;
    expense: number;
    balance: number;
  }>;
}

interface MonthData {
  months: number[];
}

export default function YearPage({ params }: { params: Promise<{ year: string }> }) {
  const [stats, setStats] = useState<YearlyStats | null>(null);
  const [months, setMonths] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState<number | null>(null);
  const router = useRouter();

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
        
        const [statsRes, monthsRes] = await Promise.all([
          fetch(`/api/stats/yearly/${yearNum}`),
          fetch(`/api/years/${yearNum}/months`)
        ]);

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
  }, [params]);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Math.abs(amount));
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
              {year || '未知'}年 财务统计
            </h1>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">总退款</p>
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
                <p className="text-sm font-medium text-gray-600">净支出</p>
                <p className={`text-2xl font-bold ${stats.totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ¥{formatMoney(stats.totalBalance)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Charts */}
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
                    name === 'income' ? '退款' : name === 'expense' ? '支出' : '净支出'
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
                    name === 'income' ? '退款' : '支出'
                  ]}
                />
                <Bar dataKey="income" fill="#10b981" />
                <Bar dataKey="expense" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
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
