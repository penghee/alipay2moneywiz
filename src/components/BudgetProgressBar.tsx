import { Info } from "lucide-react";

interface CategoryData {
  spent: number;
  budget: number;
  percentage: number;
  remaining?: number;
  overBudget?: boolean;
}

interface BudgetProgressProps {
  budgetProgress: {
    categories: Record<string, CategoryData>;
    total: {
      budget: number;
      spent: number;
      remaining: number;
      percentage: number;
      overBudget: boolean;
    };
  };
  getCategoryColor: (category: string) => string;
}

export default function BudgetProgressBar({
  budgetProgress,
  getCategoryColor,
}: BudgetProgressProps) {
  const { total } = budgetProgress;
  const totalBudget = total.budget;

  return (
    <>
      {/* 进度条 */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">预算使用情况</h3>
        <div className="w-full bg-gray-100 rounded-full h-6 overflow-hidden relative">
          {(() => {
            // 先过滤出有消费的分类并计算宽度
            const categories = Object.entries(budgetProgress.categories || {})
              .filter(([_, data]) => data && data.spent > 0)
              .map(([category, data]) => {
                const width = Math.min(
                  100,
                  (data.spent / budgetProgress.total.budget) * 100,
                );
                const percentage = (
                  (data.spent / budgetProgress.total.budget) *
                  100
                ).toFixed(2);
                return { category, data, width, percentage };
              });

            // 计算每个分类的偏移量
            let offset = 0;
            const segments = categories.map(
              ({ category, data, width, percentage }) => {
                const segment = (
                  <div
                    key={category}
                    className="h-full absolute top-0 transition-all duration-300 hover:opacity-90 flex items-center justify-end pr-2 text-xs font-medium text-white"
                    style={{
                      left: `${offset}%`,
                      width: `${width}%`,
                      backgroundColor: getCategoryColor(category),
                      backgroundImage: `linear-gradient(to right, ${getCategoryColor(category)}, ${getCategoryColor(category)}80)`,
                      zIndex: 1,
                    }}
                    title={`${category}: ¥${data.spent.toLocaleString()} (${percentage}%)`}
                  >
                    {width > 15 && (
                      <span className="truncate">
                        {category} {percentage}%
                      </span>
                    )}
                  </div>
                );

                // 更新下一个分段的偏移量
                offset += width;

                return segment;
              },
            );

            return segments;
          })()}
          {/* 显示未使用的预算 */}
          {budgetProgress.total.remaining > 0 && (
            <div
              className="h-full absolute top-0 right-0 bg-gray-200 flex items-center justify-end pr-2 text-xs text-gray-500"
              style={{
                width: `${Math.max(0, 100 - budgetProgress.total.percentage)}%`,
                transition: "width 0.3s ease-in-out",
                zIndex: 0,
              }}
            >
              {budgetProgress.total.percentage < 85 && (
                <span>
                  剩余 ¥{budgetProgress.total.remaining.toLocaleString()}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 图例 */}
      <div className="flex flex-wrap gap-4 mt-3 text-sm">
        {Object.entries(budgetProgress.categories || {})
          .filter(([_, data]) => data && data.spent > 0)
          .map(([category, data]) => (
            <div key={category} className="flex items-center">
              <span
                className="w-3 h-3 rounded-sm mr-2"
                style={{
                  backgroundColor: getCategoryColor(category),
                  minWidth: "12px",
                }}
              />
              <span className="text-gray-700 font-medium">{category}</span>
              <span className="text-gray-500 ml-1">
                (¥{data.spent.toLocaleString()},{data.percentage.toFixed(2)}%)
              </span>
            </div>
          ))}
      </div>

      <div className="flex justify-between mt-3 text-sm text-gray-600 border-t border-gray-100 pt-2">
        <div className="flex items-center">
          <span className="font-medium">
            总预算: ¥{totalBudget.toLocaleString()}
          </span>
          <Info className="w-3.5 h-3.5 ml-1 text-gray-400" />
        </div>
        <span
          className={
            budgetProgress.total.overBudget
              ? "text-red-600 font-medium"
              : "text-green-600 font-medium"
          }
        >
          已用: ¥{budgetProgress?.total?.spent?.toLocaleString() ?? "0"} (
          {(budgetProgress?.total?.percentage ?? 0).toFixed(2)}%)
        </span>
      </div>
    </>
  );
}
