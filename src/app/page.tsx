'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, TrendingUp, DollarSign, Upload, List } from 'lucide-react';

interface YearData {
  years: number[];
}

export default function Home() {
  const [years, setYears] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/years')
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        setYears(data.years || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch years:', err);
        setYears([]);
        setLoading(false);
      });
  }, []);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            财务数据统计
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            查看您的年度和月度财务统计
          </p>
          
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => router.push('/import')}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Upload className="h-5 w-5 mr-2" />
              导入账单文件
            </button>
            <button
              onClick={() => router.push('/category-management')}
              className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              <List className="h-5 w-5 mr-2" />
              分类管理
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {years.map(year => (
            <div
              key={year}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1"
              onClick={() => router.push(`/year/${year}`)}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {year}年
                    </h2>
                  </div>
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">年度统计</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">月度详情</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <span className="text-sm text-blue-600 font-medium group-hover:text-blue-800">
                    点击查看详情 →
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {years.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-yellow-100 rounded-full">
                <Calendar className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="text-lg font-medium text-yellow-800 mb-2">
                暂无数据
              </h3>
              <p className="text-yellow-700">
                请确保 data 目录中有可用的 CSV 文件
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}