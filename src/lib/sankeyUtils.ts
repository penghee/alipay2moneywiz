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

  const nodes = [...baseNodes];
  const links: SankeyLink[] = [];

  // Calculate other income
  const otherIncome =
    otherIncomeParam !== undefined
      ? otherIncomeParam
      : Math.max(0, totalIncome - totalSalary);

  // Link income sources to 总收入
  if (totalSalary > 0) {
    links.push({
      source: nodes.findIndex((n) => n.name === "工资收入"),
      target: nodes.findIndex((n) => n.name === "总收入"),
      value: totalSalary,
    });
  }

  if (otherIncome > 0) {
    links.push({
      source: nodes.findIndex((n) => n.name === "其他收入"),
      target: nodes.findIndex((n) => n.name === "总收入"),
      value: otherIncome,
    });
  }

  // Add category nodes
  const categoryNodes: SankeyNode[] = Object.entries(categoryStats)
    .sort((a, b) => b[1].amount - a[1].amount) // Sort by amount descending
    .map(([category]) => ({
      name: category,
      depth: 3,
    }));

  // Add category nodes to nodes array and create category indices map
  const categoryIndices = new Map<string, number>();
  categoryNodes.forEach((node, index) => {
    nodes.push(node);
    categoryIndices.set(node.name, nodes.length - 1);
  });

  // Link 总收入 to 结余 and 支出
  const totalIncomeIndex = nodes.findIndex((n) => n.name === "总收入");
  const balanceIndex = nodes.findIndex((n) => n.name === "结余");
  const expenseIndex = nodes.findIndex((n) => n.name === "支出");

  // Link 总收入 to 支出
  if (totalExpense > 0 && expenseIndex !== -1) {
    links.push({
      source: totalIncomeIndex,
      target: expenseIndex,
      value: totalExpense,
    });
  }

  // Link 总收入 to 结余 (if there's any balance)
  const balance = totalIncome - totalExpense;
  if (balance > 0 && balanceIndex !== -1) {
    links.push({
      source: totalIncomeIndex,
      target: balanceIndex,
      value: balance,
    });
  }

  // Link 支出 to categories
  Object.entries(categoryStats).forEach(([category, stat]) => {
    const categoryIndex = categoryIndices.get(category);
    if (categoryIndex !== undefined && stat.amount > 0) {
      links.push({
        source: expenseIndex,
        target: categoryIndex,
        value: stat.amount,
      });
    }
  });

  return { nodes, links };
}
