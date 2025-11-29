"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, TrendingUp, DollarSign } from "lucide-react";
import dynamic from "next/dynamic";

import { getCategoryColor, resetColorAssignment } from "@/lib/colors";
import BudgetProgressBar from "@/components/BudgetProgressBar";
import { apiClient } from "@/lib/apiClient";
import YearSummaryCards from "@/components/YearSummaryCards";

// Dynamically import the FinancialOverview component with no SSR
const FinancialOverview = dynamic(
  () => import("@/components/FinancialOverview"),
  { ssr: false },
);

export default function Home() {
  // 获取当前年份的预算数据
  const currentYear = new Date().getFullYear();
  const [years, setYears] = useState<number[]>([]);
  const [budgetProgress, setBudgetProgress] = useState<{
    total: {
      budget: number;
      spent: number;
      remaining: number;
      percentage: number;
      overBudget: boolean;
    };
    categories: Record<
      string,
      {
        budget: number;
        spent: number;
        remaining: number;
        percentage: number;
        overBudget: boolean;
      }
    >;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    resetColorAssignment();
    const fetchData = async () => {
      try {
        // 获取年份数据
        const yearsData = await apiClient.getYears();
        setYears(yearsData);

        try {
          const budgetData = await apiClient.getBudgetProgress(currentYear);
          setBudgetProgress(budgetData);
        } catch (error) {
          console.error("Error fetching budget progress:", error);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            个人财务概览
          </h1>
          <p className="text-gray-600">查看和管理您的财务数据</p>
        </header>
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {currentYear}年财务概览
          </h2>
          <YearSummaryCards year={currentYear} />
        </div>
        {budgetProgress && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {currentYear}年预算概览
            </h2>
            <BudgetProgressBar
              budgetProgress={budgetProgress}
              getCategoryColor={getCategoryColor}
            />
          </div>
        )}
        {/* Financial Overview Section */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            近12个月财务概览
          </h2>
          <FinancialOverview />
        </section>

        {/* Years Grid */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">年度数据概览</h2>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>共 {years.length} 年数据</span>
              <span className="h-1 w-1 rounded-full bg-gray-400"></span>
              <span>最后更新: {new Date().toLocaleDateString("zh-CN")}</span>
            </div>
          </div>

          {years.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {years.map((year) => (
                <div
                  key={year}
                  className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden border border-gray-100 hover:border-blue-100"
                  onClick={() => router.push(`/year/${year}`)}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center space-x-3">
                        <div className="p-2.5 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
                          <Calendar className="h-5 w-5 text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">
                          {year}年
                        </h2>
                      </div>
                      <div className="flex items-center space-x-1 text-sm font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                        <TrendingUp className="h-4 w-4" />
                        <span>查看</span>
                      </div>
                    </div>

                    <div className="space-y-3.5 mb-5">
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/year/${year}/budget`);
                        }}
                        className="flex items-center space-x-2.5 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="p-1.5 bg-blue-50 rounded-lg">
                          <DollarSign className="h-4 w-4 text-blue-500" />
                        </div>
                        <span className="text-sm text-gray-600">年度预算</span>
                      </div>
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/year/${year}/category`);
                        }}
                        className="flex items-center space-x-2.5 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <div
                          className="p-1.5 bg-purple-50 rounded-lg"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Calendar className="h-4 w-4 text-purple-500" />
                        </div>
                        <span className="text-sm text-gray-600">分类明细</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                      <div className="flex items-center text-sm font-medium text-blue-600 group-hover:text-blue-700 transition-colors">
                        <span>查看详细数据</span>
                        <svg
                          className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 max-w-md mx-auto">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-2xl">
                  <Calendar className="h-8 w-8 text-yellow-600" />
                </div>
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                  暂无数据
                </h3>
                <p className="text-yellow-700 text-sm mb-4">
                  请确保 data 目录中有可用的 CSV 文件
                </p>
                <button
                  onClick={() => router.push("/import")}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  导入数据
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
