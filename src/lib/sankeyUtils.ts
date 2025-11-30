import { Expense, CategoryStats } from "../types/api";

interface SankeyNode {
  name: string;
  depth?: number; // Add depth to control node positioning
}

interface SankeyLink {
  source: number;
  target: number;
  value: number;
}

export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

interface GenerateSankeyDataParams {
  categoryStats: Record<string, CategoryStats>;
  totalIncome: number;
  totalExpense: number;
  totalSalary: number;
  otherIncome?: number;
  nodes?: Array<{ name: string }>;
}

export function generateSankeyData({
  categoryStats,
  totalIncome,
  totalExpense,
  totalSalary,
  otherIncome: otherIncomeParam,
  nodes: customNodes,
}: GenerateSankeyDataParams): SankeyData {
  // Node order: Income sources -> 总收入 -> 结余/支出 (aligned) -> Expense categories
  const baseNodes: SankeyNode[] = customNodes || [
    { name: "工资收入", depth: 0 },
    { name: "其他收入", depth: 0 },
    { name: "总收入", depth: 1 },
    { name: "结余", depth: 2 },
    { name: "支出", depth: 2 }, // Same depth as 结余 to align them
  ];

  // Sort nodes by depth to ensure proper alignment
  const sortedNodes = [...baseNodes].sort(
    (a, b) => (a.depth || 0) - (b.depth || 0),
  );

  const nodes = [...sortedNodes];

  const links: SankeyLink[] = [];

  // Use provided otherIncome or calculate it
  const otherIncome =
    otherIncomeParam !== undefined
      ? otherIncomeParam
      : Math.max(0, totalIncome - totalSalary);

  // Link from income sources to 总收入
  if (totalSalary > 0) {
    links.push({
      source: 0, // 工资收入
      target: 2, // 总收入
      value: totalSalary,
    });
  }

  if (otherIncome > 0) {
    links.push({
      source: 1, // 其他收入
      target: 2, // 总收入
      value: otherIncome,
    });
  }

  // Add category nodes and links
  let nodeIndex = nodes.length;
  const categoryIndices = new Map<string, number>();

  // Sort categories by amount in descending order
  const sortedCategories = Object.entries(categoryStats).sort(
    (a, b) => b[1].amount - a[1].amount,
  );

  // Add categories as nodes and create links from 支出 to categories
  sortedCategories.forEach(([category, stat]) => {
    const amount = stat.amount;
    nodes.push({ name: category, depth: 3 }); // Set depth for category nodes
    categoryIndices.set(category, nodeIndex);
    links.push({
      source: nodes.findIndex((n) => n.name === "支出"), // Find expense node dynamically
      target: nodeIndex,
      value: amount,
    });
    nodeIndex++;
  });

  // Add links from 总收入 to 结余 and 支出
  const totalIncomeIndex = nodes.findIndex((n) => n.name === "总收入");
  const balanceIndex = nodes.findIndex((n) => n.name === "结余");
  const expenseIndex = nodes.findIndex((n) => n.name === "支出");

  if (totalIncome > 0) {
    // Link from 总收入 to 结余
    if (totalIncome > totalExpense && balanceIndex !== -1) {
      links.push({
        source: totalIncomeIndex,
        target: balanceIndex,
        value: totalIncome - totalExpense,
      });
    }

    // Link from 总收入 to 支出
    if (totalExpense > 0 && expenseIndex !== -1) {
      links.push({
        source: totalIncomeIndex,
        target: expenseIndex,
        value: totalExpense,
      });
    }
  }

  // No need for separate otherIncome handling as it's already included in totalIncome

  // No need for this link anymore as we're going directly from 总收入 to 结余 and 支出

  return { nodes, links };
}
