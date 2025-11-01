'use client';

import React, { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowUp, ArrowDown, Wallet, PiggyBank, Scale, Plus, Save, X, Trash2 } from 'lucide-react';
import { AssetsTable } from '@/components/AssetsTable';

// Define types for our data
interface SankeyNode {
  name: string;
}

interface SankeyLink {
  source: number;
  target: number;
  value: number;
}

interface SummaryData {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  investmentAssets: number;
  annualExpenses: number;
  sankeyData: {
    nodes: SankeyNode[];
    links: SankeyLink[];
  };
}

// Helper function to format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

// Dynamically import the Sankey component with no SSR
const SankeyChart = dynamic(
  () => import('@/components/charts/SankeyChart'),
  { 
    ssr: false, 
    loading: () => (
      <div className="flex items-center justify-center h-[500px] w-full bg-gray-50 rounded-lg">
        <Skeleton className="h-full w-full" />
      </div>
    ) 
  }
);

export default function SummaryPage() {
  const [data, setData] = useState<SummaryData | null>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [debtServiceRatio, setDebtServiceRatio] = useState<number | null>(null);
  const [latestIncome, setLatestIncome] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchAssets = useCallback(async () => {
    try {
      const response = await fetch('/api/assets');
      if (!response.ok) throw new Error('Failed to fetch assets');
      const assetsData = await response.json();
      setAssets(assetsData);
    } catch (err) {
      console.error('Error fetching assets:', err);
      setError('Failed to load assets');
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [summaryRes, incomeRes] = await Promise.all([
          fetch('/api/summary'),
          fetch('/api/income/latest')
        ]);
        
        if (!summaryRes.ok) throw new Error('Failed to fetch summary data');
        if (!incomeRes.ok) throw new Error('Failed to fetch income data');
        
        const [summaryData, incomeData] = await Promise.all([
          summaryRes.json(),
          incomeRes.json()
        ]);
        
        setData(summaryData);
        
        // Calculate debt service ratio if we have credit card debt and income
        const creditCardDebt = summaryData.creditCardDebt || 0;
        const monthlyIncome = incomeData.data.amount || 0;
        
        setLatestIncome(monthlyIncome);
        
        if (monthlyIncome > 0) {
          const ratio = creditCardDebt / monthlyIncome;
          setDebtServiceRatio(ratio);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    const loadAllData = async () => {
      await Promise.all([fetchData(), fetchAssets()]);
    };
    
    loadAllData().finally(() => setLoading(false));
  }, []);

  const handleSaveAssets = async (updatedAssets: any[]) => {
    try {
      setIsSaving(true);
      const response = await fetch('/api/assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedAssets),
      });

      if (!response.ok) {
        throw new Error('Failed to save assets');
      }
      
      // Refresh summary data
      const [summaryRes] = await Promise.all([
        fetch('/api/summary'),
      ]);
      
      if (!summaryRes.ok) throw new Error('Failed to refresh summary data');
      const summaryData = await summaryRes.json();
      setData(prevData => ({
        ...prevData,
        ...summaryData
      }));
      
    } catch (err) {
      console.error('Error saving assets:', err);
      setError('Failed to save assets');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
<div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">资产概览</h1>
          <Skeleton className="h-9 w-24" />
        </div>
        
        <div className="grid gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24 mb-1" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
          
          <Card className="overflow-hidden">
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[400px] w-full" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">加载数据时出错</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                onClick={() => window.location.reload()}
                className="text-sm font-medium text-red-700 hover:text-red-600"
              >
                重试 <span aria-hidden="true">&rarr;</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5.25 15.5h13.5l-3.841-5.101a2.25 2.25 0 01-.659-1.59V3.104M9.75 3.104c-.251.323-.25.814-.25 1.5v5.714c0 .491.336.936.84 1.064l5.82 1.496a2.25 2.25 0 011.72 2.2V19.5a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-6.922c0-.867.55-1.64 1.37-1.93l5.63-1.68v-.5m0-3.4l-5.63-1.68a1.5 1.5 0 01-.87-1.37v-.5m6.5 3.55v5.93"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">没有可用数据</h3>
        <p className="mt-1 text-sm text-gray-500">
          当前没有可用的资产数据。
        </p>
        <div className="mt-6">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            刷新页面
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">资产概览</h1>
          <p className="mt-1 text-sm text-gray-500">
            查看和管理您的资产和负债情况
          </p>
        </div>
        <div className="flex space-x-2">
          <button 
            className="p-2 text-gray-400 hover:text-gray-500"
            title="刷新数据"
            onClick={() => window.location.reload()}
          >
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="grid gap-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 总资产 */}
          <Card className="bg-white shadow-sm hover:shadow-md transition-shadow border-l-4 border-blue-500">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-500">总资产</CardTitle>
                <div className="p-2 rounded-full bg-blue-100">
                  <Wallet className="h-4 w-4 text-blue-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(data.totalAssets)}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {/* 较上月 <span className="text-green-600 font-medium">+2.5%</span> */}
              </p>
            </CardContent>
          </Card>

          {/* 净资产 */}
          <Card className="bg-white shadow-sm hover:shadow-md transition-shadow border-l-4 border-green-500">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-500">净资产</CardTitle>
                <div className="p-2 rounded-full bg-green-100">
                  <Scale className="h-4 w-4 text-green-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(data.netWorth)}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {/* 较上月 <span className="text-green-600 font-medium">+3.2%</span> */}
              </p>
            </CardContent>
          </Card>

          {/* 总负债 */}
          <Card className="bg-white shadow-sm hover:shadow-md transition-shadow border-l-4 border-amber-500">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-500">总负债</CardTitle>
                <div className="p-2 rounded-full bg-amber-100">
                  <PiggyBank className="h-4 w-4 text-amber-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(data.totalLiabilities)}
              </div>
              {debtServiceRatio !== null && latestIncome && latestIncome > 0 && (
                <div className="mt-2">
                  <p>最新收入: {formatCurrency(latestIncome)}</p>
                  <p className="text-sm font-medium">
                    信用卡负债率: {' '}
                    <span className={
                      debtServiceRatio < 0.3 ? 'text-green-600' :
                      debtServiceRatio <= 0.4 ? 'text-yellow-600' : 'text-red-600'
                    }>
                      {(debtServiceRatio * 100).toFixed(1)}%
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {debtServiceRatio < 0.3 ? '轻松区' :
                     debtServiceRatio <= 0.4 ? '警戒区，申请新贷款较困难' :
                     '危险区，影响生活质量'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Financial Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 投资资产比率 */}
          <Card className="bg-white shadow-sm hover:shadow-md transition-shadow border-l-4 border-purple-500">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-500">投资资产比率</CardTitle>
                <div className="p-2 rounded-full bg-purple-100">
                  <svg className="h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {data.totalAssets > 0 ? ((data.investmentAssets / data.totalAssets * 100).toFixed(1) + '%') : 'N/A'}
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full" 
                    style={{ width: `${data.totalAssets > 0 ? Math.min(100, (data.investmentAssets / data.totalAssets * 100)) : 0}%` }}
                  ></div>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {data.investmentAssets / data.totalAssets >= 0.5 ? '健康' : '待优化'}
                  {data.totalAssets > 0 && (
                    <span className="ml-2">
                      (目标 ≥50%)
                    </span>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 资产负债率 */}
          <Card className="bg-white shadow-sm hover:shadow-md transition-shadow border-l-4 border-rose-500">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-500">资产负债率</CardTitle>
                <div className="p-2 rounded-full bg-rose-100">
                  <svg className="h-4 w-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {data.totalAssets > 0 ? ((data.totalLiabilities / data.totalAssets * 100).toFixed(1) + '%') : 'N/A'}
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      (data.totalLiabilities / data.totalAssets) < 0.3 ? 'bg-green-500' : 
                      (data.totalLiabilities / data.totalAssets) < 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${data.totalAssets > 0 ? Math.min(100, (data.totalLiabilities / data.totalAssets * 100)) : 0}%` }}
                  ></div>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {data.totalAssets > 0 && (
                    <>
                      {data.totalLiabilities / data.totalAssets < 0.3 ? '安全区' : 
                       data.totalLiabilities / data.totalAssets < 0.6 ? '观察区' : '危险区'}
                      <span className="ml-2">
                        (目标 &lt;30%)
                      </span>
                    </>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 财务自由度 */}
          <Card className="bg-white shadow-sm hover:shadow-md transition-shadow border-l-4 border-emerald-500">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-500">财务自由度</CardTitle>
                <div className="p-2 rounded-full bg-emerald-100">
                  <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {data.annualExpenses > 0 ? ((data.investmentAssets * 0.08 / data.annualExpenses * 100).toFixed(1) + '%') : 'N/A'}
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-emerald-500 h-2 rounded-full" 
                    style={{ width: `${data.annualExpenses > 0 ? Math.min(100, (data.investmentAssets * 0.08 / data.annualExpenses * 100)) : 0}%` }}
                  ></div>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {data.annualExpenses > 0 && (
                    <>
                      {data.investmentAssets * 0.08 / data.annualExpenses >= 1 ? '财务自由' : '努力中'}
                      <span className="ml-2">
                        (目标 100%)
                      </span>
                    </>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Asset Distribution Chart */}
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-medium">资产分布</CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  您的资产和负债分布情况
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[500px] w-full">
              {data.sankeyData?.nodes?.length > 0 && data.sankeyData?.links?.length > 0 ? (
                <SankeyChart data={data.sankeyData} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">没有可用的图表数据</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    添加更多资产和负债数据以查看分布情况
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="mt-8">
        <AssetsTable 
          assets={assets} 
          onSave={handleSaveAssets}
          isSaving={isSaving}
        />
      </div>
    </div>
  );
}
