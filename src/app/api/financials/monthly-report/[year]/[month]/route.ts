import { NextResponse } from "next/server";
import { calculateMonthlyStats } from "@/lib/data";
import { formatMoney } from "@/lib/utils";

/**
 * 生成月度财务报告
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ year: string; month: string }> },
) {
  try {
    const resolvedParams = await params;
    const year = parseInt(resolvedParams.year);
    const month = parseInt(resolvedParams.month);

    if (isNaN(year) || isNaN(month)) {
      return NextResponse.json(
        { error: "Invalid year or month" },
        { status: 400 },
      );
    }

    const stats = calculateMonthlyStats(year, month);

    // 生成大额支出列表
    const largeExpenses = stats.expenses
      .filter((e) => e.isLargeExpense)
      .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));

    // 找出最大支出分类
    const categoryStats = stats.categoryStats;
    let topCategory = null;
    let maxAmount = 0;

    for (const [category, data] of Object.entries(categoryStats)) {
      if (data.amount > maxAmount) {
        maxAmount = data.amount;
        topCategory = { category, amount: data.amount };
      }
    }

    // 计算储蓄率
    const savingsRate =
      stats.income > 0 ? (stats.balance / stats.income) * 100 : 0;

    // 生成建议
    const suggestions: string[] = [];

    // 收支平衡建议
    if (stats.balance < 0) {
      suggestions.push("本月支出超过收入，需要关注支出控制");
    } else if (stats.balance > 0 && savingsRate < 10) {
      suggestions.push("本月有结余，但储蓄率较低，建议适当增加储蓄");
    } else if (stats.balance > 0 && savingsRate >= 30) {
      suggestions.push("本月储蓄率优秀，财务状况健康！");
    }

    // 大额支出建议
    if (largeExpenses.length > 0) {
      suggestions.push(
        `本月有${largeExpenses.length}笔大额支出（总额¥${formatMoney(largeExpenses.reduce((sum, e) => sum + e.amount, 0))}），建议定期回顾`,
      );
    }

    // 分类建议
    if (topCategory && stats.expense > 0) {
      const percentage = (topCategory.amount / stats.expense) * 100;
      if (percentage > 50) {
        suggestions.push(
          `${topCategory.category}占本月支出${percentage.toFixed(1)}%，是该月最大支出项`,
        );
      }
    }

    // 工资收入建议
    if (stats.totalSalary > 0) {
      suggestions.push(
        `本月工资收入¥${formatMoney(stats.totalSalary)}，占总收入的${((stats.totalSalary / stats.income) * 100).toFixed(1)}%`,
      );
    }

    // 计算整体评分 (0-100)
    let score = 50; // 基础分

    // 根据储蓄率加分
    if (stats.income > 0) {
      score += (savingsRate / 100) * 30; // 最多30分
    }

    // 根据大额支出数量减分
    score -= Math.min(5, largeExpenses.length) * 5; // 每笔-5分，最多-25分

    // 根据收支平衡加分
    if (stats.balance >= 0) {
      score += 10;
    }

    score = Math.max(0, Math.min(100, score));

    const report = {
      month: `${year}-${String(month).padStart(2, "0")}`,
      totalIncome: stats.income,
      totalExpense: stats.expense,
      balance: stats.balance,
      savingsRate,
      largeExpenses,
      largeExpenseCount: largeExpenses.length,
      largeExpenseTotal: largeExpenses.reduce((sum, e) => sum + e.amount, 0),
      topCategory,
      suggestions,
      overallScore: Math.round(score),
    };

    return NextResponse.json(report);
  } catch (error) {
    console.error("Error generating monthly report:", error);
    return NextResponse.json(
      { error: "Failed to generate monthly report" },
      { status: 500 },
    );
  }
}
