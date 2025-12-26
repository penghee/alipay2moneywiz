import { apiClient } from "@/lib/apiClient";
import { formatMoney } from "@/lib/utils";
import { YearlyStats } from "@/types/api";
import {
  ArrowLeft,
  Calendar,
  TrendingUp,
  DollarSign,
  BarChart3,
  PieChart,
  Wallet,
  Filter,
  User,
  Tag,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function YearSummaryCards({
  year,
  selectedOwner = "all",
}: {
  year: number;
  selectedOwner?: string;
}) {
  const [stats, setStats] = useState<YearlyStats | null>(null);
  const [cashAssets, setCashAssets] = useState<number>(0);
  const [liquidityRatio, setLiquidityRatio] = useState<number>(0);
  const [budgetUsed, setBudgetUsed] = useState<number>(0);
  const [totalBudget, setTotalBudget] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsData, budgetData] = await Promise.all([
          apiClient.getYearlyStats(year, selectedOwner),
          apiClient.getBudgetProgress(year, selectedOwner),
        ]);
        setStats(statsData);
        if (budgetData?.total) {
          setTotalBudget(budgetData.total.budget);
          setBudgetUsed(budgetData.total.spent);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [year, selectedOwner]);

  // Calculate averages
  const averageMonthlyExpense = useMemo(() => {
    if (!stats || !stats.totalExpense || !stats.monthlyData) return 0;
    return stats.totalExpense / stats.monthlyData.length;
  }, [stats]);

  const averageMonthlyIncome = useMemo(() => {
    if (!stats || !stats.totalSalary || !stats.monthlyData) return 0;
    return stats.totalSalary / stats.monthlyData.length;
  }, [stats]);

  // Calculate liquidity ratio
  useEffect(() => {
    const fetchLiquidityRatio = async () => {
      try {
        const data = await apiClient.getSummary();
        // Use the pre-calculated cashAssets from the API
        const cashAssets = data.cashAssets || 0;
        setCashAssets(cashAssets);
        // Calculate ratio (months of coverage)
        const currentAvgExpense = averageMonthlyExpense;
        if (currentAvgExpense > 0) {
          setLiquidityRatio(cashAssets / currentAvgExpense);
        }
      } catch (error) {
        console.error("Error fetching liquidity data:", error);
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

  if (!stats) {
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">总收入</p>
            <p className="text-2xl font-bold text-green-600">
              ¥{formatMoney(stats.totalIncome)}
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
            <div className="flex items-center text-sm font-medium text-gray-600">
              <span>结余</span>
              <div className="ml-1 group relative">
                <span className="text-xs text-gray-400 cursor-help">ⓘ</span>
                <div className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-2 text-xs text-gray-700 bg-white rounded shadow-lg border border-gray-200 z-10">
                  结余 = 总收入 - 总支出
                  <br />
                  正数表示结余，负数表示赤字。
                </div>
              </div>
            </div>
            <p
              className={`text-2xl font-bold ${stats.totalBalance >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              ¥{formatMoney(stats.totalBalance)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {/* 结余比率 */}
              结余比率{" "}
              {stats.totalIncome > 0 ? (
                <>
                  {((stats.totalBalance / stats.totalIncome) * 100).toFixed(2)}%
                </>
              ) : (
                "N/A"
              )}
            </p>
            {stats.totalIncome > 0 && (
              <div className="mt-2">
                <p
                  className={`text-sm font-medium ${
                    (stats.totalIncome - stats.totalExpense) /
                      stats.totalIncome <
                    0.1
                      ? "text-red-600"
                      : (stats.totalIncome - stats.totalExpense) /
                            stats.totalIncome <=
                          0.2
                        ? "text-yellow-600"
                        : "text-green-600"
                  }`}
                >
                  {(
                    ((stats.totalIncome - stats.totalExpense) /
                      stats.totalIncome) *
                    100
                  ).toFixed(1)}
                  %
                  <span className="text-xs ml-1 text-gray-500">
                    {(stats.totalIncome - stats.totalExpense) /
                      stats.totalIncome <
                    0.1
                      ? " (储蓄能力偏弱)"
                      : (stats.totalIncome - stats.totalExpense) /
                            stats.totalIncome <=
                          0.2
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

      {/* 平均月支出 */}
      {selectedOwner === "all" && (
        <div
          className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => router.push(`/year/${year}`)}
        >
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
                    <p className="text-xs font-medium text-gray-600">
                      流动性覆盖率
                    </p>
                    <div className="ml-1 group relative">
                      <span className="text-xs text-gray-400 cursor-help">
                        ⓘ
                      </span>
                      <div className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-2 text-xs text-gray-700 bg-white rounded shadow-lg border border-gray-200 z-10">
                        流动性资产 / 月均支出 (安全垫)
                        <br />
                        3-6个月为健康区间，表示您的应急资金可以支撑3-6个月的正常生活。
                      </div>
                    </div>
                  </div>
                  {stats.totalIncome > 0 ? (
                    <>
                      <p
                        className={`text-sm font-medium ${
                          liquidityRatio < 3
                            ? "text-red-600"
                            : liquidityRatio <= 6
                              ? "text-yellow-600"
                              : "text-green-600"
                        }`}
                      >
                        {liquidityRatio.toFixed(1)} 个月(¥
                        {formatMoney(cashAssets)})
                        <span className="text-xs ml-1 text-gray-500">
                          {liquidityRatio < 3
                            ? " (需增加应急储备)"
                            : liquidityRatio <= 6
                              ? " (健康)"
                              : " (充足)"}
                        </span>
                      </p>
                    </>
                  ) : (
                    <p className="text-sm font-medium text-gray-600">N/A</p>
                  )}
                </div>
              )}
            </div>
            <BarChart3 className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      )}
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
      {selectedOwner === "all" && (
        <div
          className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => router.push(`/year/${year}/budget`)}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center">
                <p className="text-sm font-medium text-gray-600">年度预算</p>
                <span className="ml-2 text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                  {totalBudget > 0
                    ? `${((budgetUsed / totalBudget) * 100).toFixed(2)}%`
                    : "0.00%"}
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
              style={{
                width: `${totalBudget > 0 ? Math.min(100, (budgetUsed / totalBudget) * 100) : 0}%`,
              }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}
