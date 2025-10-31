'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUp, ArrowDown, Wallet, PiggyBank, Scale } from 'lucide-react';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummaryData = async () => {
      try {
        const response = await fetch('/api/summary');
        if (!response.ok) throw new Error('获取汇总数据失败');
        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('Error fetching summary data:', err);
        setError(err instanceof Error ? err.message : '加载数据失败');
      } finally {
        setLoading(false);
      }
    };

    fetchSummaryData();
  }, []);

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">资产概览</h1>
          <p className="mt-1 text-sm text-gray-500">
            查看您的资产和负债情况
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">最后更新: {new Date().toLocaleDateString('zh-CN')}</span>
          <button
            onClick={() => window.location.reload()}
            className="p-2 text-gray-400 hover:text-gray-500"
            title="刷新数据"
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
                较上月 <span className="text-green-600 font-medium">+2.5%</span>
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
                较上月 <span className="text-green-600 font-medium">+3.2%</span>
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
              <p className="mt-1 text-xs text-gray-500">
                较上月 <span className="text-red-600 font-medium">+1.2%</span>
              </p>
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
              <div className="flex items-center space-x-2">
                <select
                  className="text-sm border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  defaultValue="all"
                >
                  <option value="all">全部</option>
                  <option value="assets">仅资产</option>
                  <option value="liabilities">仅负债</option>
                </select>
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
    </div>
  );
}
