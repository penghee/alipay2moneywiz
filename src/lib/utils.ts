import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isValid, parseISO, toDate } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 格式化金额
// Get current year
export function getCurrentYear(): number {
  return new Date().getFullYear();
}

export function formatMoney(amount?: number): string {
  if (!amount) return "0.00";
  return new Intl.NumberFormat("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export const COLORS = [
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
  "#84cc16",
  "#f97316",
  "#ec4899",
  "#6366f1",
  "#14b8a6",
  "#f43f5e",
  "#a855f7",
  "#22c55e",
  "#eab308",
];

// 解析日期 - 支持多种输入类型
// 支持类型: string (ISO格式、普通格式)、number (时间戳、Excel序列日期)、Date 对象等
// 输出格式: YYYY-MM-DD
export function parseDate(date: Date | number | string): string {
  let dateObj: Date;
  const dateNum = typeof date === "string" ? parseFloat(date) : false;
  // 处理 Excel 序列日期（number 类型，通常大于 60000）
  if (dateNum && dateNum > 40000) {
    // Excel 序列日期：从 1900-01-01 开始的天数
    // Excel 的 1 = 1900-01-01，需要减去 25569 天（从 1900-01-01 到 1970-01-01）
    const excelEpoch = 25569; // 1970-01-01 对应的 Excel 序列日期
    const excelDate = dateNum - excelEpoch;
    const jsTime = excelDate * 86400 * 1000; // 转换为毫秒时间戳
    dateObj = new Date(jsTime);
  } else {
    // 使用 toDate 处理其他类型（ISO 字符串、Unix 时间戳等）
    dateObj = toDate(date);
  }

  // 检查日期是否有效
  if (!isValid(dateObj)) {
    throw new Error(`Invalid date: ${date}`);
  }

  // 格式化为 YYYY-MM-DD
  return format(dateObj, "yyyy-MM-dd");
}
