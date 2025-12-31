// 颜色池 - 使用 Tailwind CSS 的调色板
export const COLOR_PALETTE = [
  // 蓝色系
  "#3b82f6", // blue-500
  // 绿色系
  "#10b981", // emerald-500
  // 紫色系
  "#8b5cf6", // violet-500
  // 红色系
  "#ef4444", // red-500
  // 黄色系
  "#f59e0b", // amber-500
  // 青色系
  "#06b6d4", // cyan-500
  // 粉红色系
  "#ec4899", // pink-500
  // 橙色系
  "#f97316", // orange-500

  "#60a5fa", // blue-400
  "#34d399", // emerald-400
  "#a78bfa", // violet-400
  "#f87171", // red-400
  "#fbbf24", // amber-400
  "#22d3ee", // cyan-400
  "#f472b6", // pink-400
  "#fb923c", // orange-400

  "#93c5fd", // blue-300
  "#6ee7b7", // emerald-300
  "#fca5a5", // red-300
  "#fbbf24", // amber-300
  "#fcd34d", // amber-200
  "#67e8f9", // cyan-300
  "#f9a8d4", // pink-300
  "#fdba74", // orange-300
];

// 存储已分配的颜色
const assignedColors: Record<string, string> = {};
let colorIndex = 0;

/**
 * 获取分类颜色
 * @param category 分类名称
 * @returns 十六进制颜色代码
 */
export function getCategoryColor(category: string): string {
  // 如果已经有颜色，直接返回
  if (assignedColors[category]) {
    return assignedColors[category];
  }

  // 从颜色池中获取颜色
  const color = COLOR_PALETTE[colorIndex % COLOR_PALETTE.length];
  assignedColors[category] = color;
  colorIndex++;

  return color;
}

/**
 * 重置颜色分配
 */
export function resetColorAssignment(): void {
  Object.keys(assignedColors).forEach((key) => delete assignedColors[key]);
  colorIndex = 0;
}

import type { QuadrantData } from "@/lib/insights";

export function getQuadrantColor(
  frequency: number,
  avgAmount: number,
  data: QuadrantData[],
): string {
  if (data.length === 0) return "#8884d8";

  const maxFreq = Math.max(...data.map((d) => d.frequency));
  const maxAvg = Math.max(...data.map((d) => d.avgAmount));

  const isHighFreq = frequency > maxFreq / 2;
  const isHighAvg = avgAmount > maxAvg / 2;

  if (isHighFreq && isHighAvg) return "#ff7f0e"; // Orange - High frequency, high amount
  if (!isHighFreq && isHighAvg) return "#d62728"; // Red - Low frequency, high amount
  if (isHighFreq && !isHighAvg) return "#2ca02c"; // Green - High frequency, low amount
  return "#1f77b4"; // Blue - Low frequency, low amount
}
