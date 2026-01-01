"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  PlusCircle,
  DollarSign,
  Calendar as CalendarIcon,
  Tag,
  User,
  CreditCard,
  ArrowDownUp,
  FileText,
  MessageSquare,
  Hash,
  ChevronDown,
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import categoryMap from "@/config/category_map.json";
import billOwnersData from "@/config/bill_owners.json";

const defaultRecord = {
  account: "储蓄卡",
  transfer: "",
  description: "",
  counterparty: "",
  category: "",
  date: new Date().toISOString().split("T")[0],
  note: "",
  tags: "",
  amount: "",
  owner: "爸爸",
  type: "expense", // 'expense' or 'income'
};

export default function NewTransactionPage() {
  const router = useRouter();
  const [formData, setFormData] = useState(defaultRecord);

  // Get categories based on transaction type
  const categories =
    formData.type === "income"
      ? ["工资", "其他"]
      : Object.keys(categoryMap).sort();

  // Get owners from bill_owners.json
  const { owners } = billOwnersData;

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      // If transaction type changes, reset category
      const newData = {
        ...prev,
        [name]: value,
      };

      // If type changed, reset category
      if (name === "type") {
        newData.category = "";
      }

      return newData;
    });
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Format the transaction data
      const amount =
        formData.type === "expense"
          ? -Math.abs(Number(formData.amount))
          : Math.abs(Number(formData.amount));

      const transaction = {
        account: formData.account,
        transfer: formData.transfer || "",
        description: formData.description,
        counterparty: formData.counterparty || "",
        category: formData.category,
        date: formData.date,
        note: formData.note || "",
        tags: formData.tags || "",
        amount: amount,
        owner: formData.owner,
        type: formData.type as "income" | "expense",
        source: "manual",
        merchant: "",
      };

      // Send the transaction to the API
      await apiClient.createTransaction(transaction);

      // Show success message and ask if user wants to continue
      const shouldContinue = window.confirm(
        "交易记录已保存成功！\n\n是否继续添加下一条记录？",
      );

      if (shouldContinue) {
        // Reset form but keep the same transaction type and owner
        const currentType = formData.type;
        const currentOwner = formData.owner;
        setFormData({
          ...defaultRecord,
          date: new Date().toISOString().split("T")[0],
          owner: currentOwner,
          type: currentType,
        });
      } else {
        // Redirect to home if user doesn't want to continue
        router.push("/");
      }
    } catch (err) {
      console.error("保存交易记录时出错:", err);
      setError(err instanceof Error ? err.message : "保存交易记录时出错");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
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
            <PlusCircle className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">新增交易记录</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-6 pb-2 border-b border-gray-200">
              交易信息
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  <span className="flex items-center">
                    <ArrowDownUp className="h-4 w-4 mr-1.5 text-gray-500" />
                    类型
                  </span>
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="expense">支出</option>
                  <option value="income">收入</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  <span className="flex items-center">
                    <CreditCard className="h-4 w-4 mr-1.5 text-gray-500" />
                    账户
                  </span>
                </label>
                <input
                  type="text"
                  name="account"
                  value={formData.account}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="例如：招商银行信用卡"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  <span className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-1.5 text-gray-500" />
                    金额
                  </span>
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">¥</span>
                  </div>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md py-2 border"
                    placeholder="0.00"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  <span className="flex items-center">
                    <Tag className="h-4 w-4 mr-1.5 text-gray-500" />
                    分类
                  </span>
                </label>
                <div className="relative">
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md appearance-none bg-white"
                    required
                  >
                    <option value="">选择分类</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  <span className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-1.5 text-gray-500" />
                    日期
                  </span>
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  <span className="flex items-center">
                    <User className="h-4 w-4 mr-1.5 text-gray-500" />
                    账单人
                  </span>
                </label>
                <div className="relative">
                  <select
                    name="owner"
                    value={formData.owner}
                    onChange={handleChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md appearance-none bg-white"
                  >
                    {owners.map((owner) => (
                      <option key={owner.id} value={owner.name}>
                        {owner.name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-6 pb-2 border-b border-gray-200">
              交易详情
            </h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  <span className="flex items-center">
                    <FileText className="h-4 w-4 mr-1.5 text-gray-500" />
                    描述
                  </span>
                </label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="交易的具体描述"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    <span className="flex items-center">
                      <User className="h-4 w-4 mr-1.5 text-gray-500" />
                      交易对方
                    </span>
                  </label>
                  <input
                    type="text"
                    name="counterparty"
                    value={formData.counterparty}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="可选，交易对方名称"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    <span className="flex items-center">
                      <ArrowDownUp className="h-4 w-4 mr-1.5 text-gray-500" />
                      转账
                    </span>
                  </label>
                  <input
                    type="text"
                    name="transfer"
                    value={formData.transfer}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="可选，转账账户"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    <span className="flex items-center">
                      <Tag className="h-4 w-4 mr-1.5 text-gray-500" />
                      标签
                    </span>
                    <span className="text-xs text-gray-500 font-normal">
                      多个标签用逗号分隔
                    </span>
                  </label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="例如: 餐饮,日常,购物"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    <span className="flex items-center">
                      <MessageSquare className="h-4 w-4 mr-1.5 text-gray-500" />
                      备注
                    </span>
                  </label>
                  <textarea
                    name="note"
                    value={formData.note}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    rows={3}
                    placeholder="可选，添加额外说明"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                isSubmitting ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-75`}
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  保存中...
                </>
              ) : (
                "保存记录"
              )}
            </button>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    保存失败: {error}
                  </h3>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
