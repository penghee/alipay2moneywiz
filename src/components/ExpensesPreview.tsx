import { formatMoney, COLORS } from "@/lib/utils";
import { Expense } from "@/types/api";
import { cn } from "@/lib/utils";
import categoryMap from "@/config/category_map.json";
import billOwnersData from "@/config/bill_owners.json";

export default function ExpensePreview({
  expenses = [],
}: {
  expenses?: Expense[];
}) {
  return (
    <div className="bg-white shadow-md p-6">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                日期
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                分类
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                账单人
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                金额
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                描述
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                标签
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                备注
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {expenses.map((expense, index) => (
              <tr
                key={`${expense.id}-${index}-${expense.category}`}
                className="hover:bg-gray-50 group"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {expense.date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                      style={{
                        backgroundColor:
                          COLORS[index % COLORS.length] || "#9CA3AF",
                      }}
                    ></div>
                    {expense.category}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{expense.owner}</td>
                <td
                  className={cn(
                    "px-6 py-4 whitespace-nowrap text-right text-sm font-medium",
                    Number(expense.amount) >= 0
                      ? "text-red-600"
                      : "text-green-600",
                  )}
                >
                  {formatMoney(expense.amount)}
                </td>
                <td
                  className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate"
                  title={expense.description}
                >
                  {expense.description}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                  {expense.tags}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                  {expense.remark}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
