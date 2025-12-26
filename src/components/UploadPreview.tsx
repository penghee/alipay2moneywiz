import { useState, useEffect } from "react";
import { formatMoney, COLORS } from "@/lib/utils";
import { TransactionPreview } from "@/types/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import categoryMap from "@/config/category_map.json";
import billOwnersData from "@/config/bill_owners.json";

interface EditableTransaction extends TransactionPreview {
  onUpdate?: (field: keyof TransactionPreview, value: string) => void;
}

export default function UploadPreview({
  expenses = [],
  onDelete,
}: {
  expenses?: EditableTransaction[];
  onDelete?: (index: number) => void;
}) {
  const [editableExpenses, setEditableExpenses] =
    useState<EditableTransaction[]>(expenses);

  const handleCategoryChange = (index: number, value: string) => {
    const updated = [...editableExpenses];
    const updatedExpense = { ...updated[index], 分类: value };
    updated[index] = updatedExpense;
    setEditableExpenses(updated);

    // Call onUpdate from the original expense item to update parent state
    if (expenses[index]?.onUpdate) {
      expenses[index].onUpdate!("分类", value);
    }
  };

  const handleBillOwnerChange = (index: number, value: string) => {
    const updated = [...editableExpenses];
    const updatedExpense = { ...updated[index], 账单人: value };
    updated[index] = updatedExpense;
    setEditableExpenses(updated);

    // Call onUpdate from the original expense item to update parent state
    if (expenses[index]?.onUpdate) {
      expenses[index].onUpdate!("账单人", value);
    }
  };

  const handleRemarkChange = (index: number, value: string) => {
    const updated = [...editableExpenses];
    const updatedExpense = { ...updated[index], 备注: value };
    updated[index] = updatedExpense;
    setEditableExpenses(updated);

    // Call onUpdate from the original expense item to update parent state
    if (expenses[index]?.onUpdate) {
      expenses[index].onUpdate!("备注", value);
    }
  };

  const handleTagChange = (index: number, value: string) => {
    const updated = [...editableExpenses];
    const updatedExpense = { ...updated[index], 标签: value };
    updated[index] = updatedExpense;
    setEditableExpenses(updated);

    // Call onUpdate from the original expense item to update parent state
    if (expenses[index]?.onUpdate) {
      expenses[index].onUpdate!("标签", value);
    }
  };

  const handleDelete = (index: number) => {
    const updated = [...editableExpenses];
    updated.splice(index, 1);
    setEditableExpenses(updated);

    if (onDelete) {
      onDelete(index);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                描述
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                标签
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                金额
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                备注
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {editableExpenses.map((expense, index) => (
              <tr
                key={`${expense["日期"]}-${index}-${expense["分类"]}`}
                className="hover:bg-gray-50 group"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {expense["日期"]}
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
                    <Select
                      value={expense["分类"]}
                      onValueChange={(value) =>
                        handleCategoryChange(index, value)
                      }
                    >
                      <SelectTrigger className="w-full border-0 p-0 h-auto text-sm font-medium bg-transparent hover:bg-gray-100 rounded">
                        <SelectValue placeholder="选择分类" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(categoryMap)
                          .sort()
                          .map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
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
                    <Select
                      value={expense["账单人"]}
                      onValueChange={(value) =>
                        handleBillOwnerChange(index, value)
                      }
                    >
                      <SelectTrigger className="w-full border-0 p-0 h-auto text-sm font-medium bg-transparent hover:bg-gray-100 rounded">
                        <SelectValue placeholder="选择账单人" />
                      </SelectTrigger>
                      <SelectContent>
                        {billOwnersData.owners.map((owner) => (
                          <SelectItem key={owner.id} value={owner.name}>
                            {owner.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </td>
                <td
                  className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate"
                  title={expense["描述"]}
                >
                  {expense["描述"]}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <Input
                    type="text"
                    value={expense["标签"] || ""}
                    onChange={(e) => handleTagChange(index, e.target.value)}
                    className="h-8 text-sm border-gray-300 focus-visible:ring-1 focus-visible:ring-blue-500"
                    placeholder="添加标签"
                  />
                </td>
                <td
                  className={cn(
                    "px-6 py-4 whitespace-nowrap text-right text-sm font-medium",
                    Number(expense["金额"]) >= 0
                      ? "text-red-600"
                      : "text-green-600",
                  )}
                >
                  {Number(expense["金额"]) >= 0 ? "+" : ""}¥
                  {formatMoney(Math.abs(Number(expense["金额"])))}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Input
                    type="text"
                    value={expense["备注"] || ""}
                    onChange={(e) => handleRemarkChange(index, e.target.value)}
                    className="h-8 text-sm border-gray-300 focus-visible:ring-1 focus-visible:ring-blue-500"
                    placeholder="添加备注"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleDelete(index)}
                    className="text-red-600 hover:text-red-900"
                  >
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
