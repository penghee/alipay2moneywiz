'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

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

// Dynamically import the Sankey component with no SSR
const SankeyChart = dynamic(
  () => import('@/components/charts/SankeyChart'),
  { ssr: false, loading: () => <Skeleton className="h-[500px] w-full" /> }
);

export default function SummaryPage() {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummaryData = async () => {
      try {
        const response = await fetch('/api/summary');
        if (!response.ok) throw new Error('Failed to fetch summary data');
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchSummaryData();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">资产汇总</h1>
        <div className="grid gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-[500px] w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-red-500">No data available</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">资产汇总</h1>
      
      <div className="grid gap-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">总资产</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">¥{data.totalAssets?.toLocaleString() || '0'}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">净资产</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">¥{data.netWorth?.toLocaleString() || '0'}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">总负债</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">¥{data.totalLiabilities?.toLocaleString() || '0'}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>资产分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[500px] w-full">
              {data.sankeyData?.nodes?.length > 0 && data.sankeyData?.links?.length > 0 ? (
                <SankeyChart data={data.sankeyData} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  没有可用的数据来显示图表
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
