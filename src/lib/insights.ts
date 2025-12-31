// src/lib/insights.ts
import { calculateCategoryYearlyStats } from "./data";

interface SankeyNode {
  name: string;
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
  year: number;
  ownerId?: string;
}

// Add this function at the top level of the file, before generateSankeyData
function standardizeMerchantName(name: string | null | undefined): string {
  if (!name) return "其他";

  // Convert to string, take part before any parentheses, and trim
  const cleanName = String(name).split("(")[0].trim();

  // Standardize common merchant names
  if (
    ["山姆", "SamsCLUB", "WALMART"].some((term) => cleanName.includes(term))
  ) {
    return "山姆会员店";
  }
  if (cleanName.includes("支付宝小荷包")) {
    return "支付宝小荷包";
  }
  if (cleanName.includes("美团")) {
    return "美团";
  }
  if (cleanName.includes("京东")) {
    return "京东";
  }
  if (["淘宝", "1688", "天猫"].some((term) => cleanName.includes(term))) {
    return "淘宝";
  }
  if (["携程", "上海赫程"].some((term) => cleanName.includes(term))) {
    return "携程";
  }
  if (
    ["盒马", "上海盒浦网络科技有限公司"].some((term) =>
      cleanName.includes(term),
    )
  ) {
    return "盒马";
  }
  if (
    ["水务", "燃气", "电力", "供电"].some((term) => cleanName.includes(term))
  ) {
    return "水电煤";
  }

  if (cleanName.includes("保险")) {
    return "保险";
  }

  return cleanName || name;
}

export async function generateSankeyData({
  year,
  ownerId,
}: GenerateSankeyDataParams): Promise<SankeyData> {
  const nodes: SankeyNode[] = [];
  const links: SankeyLink[] = [];
  const nodeMap = new Map<string, number>();

  try {
    // Get category stats using existing utility
    const { totalByCategory } = calculateCategoryYearlyStats(year, ownerId);
    const totalExpense = Object.values(totalByCategory).reduce(
      (sum, cat) => sum + Math.abs(cat.amount),
      0,
    );

    // Add root node
    const rootName = "总支出";
    nodes.push({ name: rootName });
    nodeMap.set(rootName, 0);

    const allCategories = Object.entries(totalByCategory).sort(
      ([, a], [, b]) => Math.abs(b.amount) - Math.abs(a.amount),
    );

    // Sort categories by amount (descending) and take top 8
    const sortedCategories = allCategories.slice(0, 8);

    const otherCategories = allCategories.slice(8);

    // Calculate threshold (0.5% of total expense)
    const threshold = totalExpense * 0.005;

    // Process top categories
    for (const [category, stats] of sortedCategories) {
      // Add category node
      const categoryIndex = nodes.length;
      nodes.push({ name: category });
      nodeMap.set(category, categoryIndex);

      // Add link from root to category
      links.push({
        source: 0, // Root node index
        target: categoryIndex,
        value: Math.abs(stats.amount),
      });

      // Process merchants in this category
      const merchantTotals = new Map<string, number>();

      // Aggregate expenses by merchant
      for (const expense of stats.expenses) {
        const merchant = standardizeMerchantName(
          expense.merchant || expense.description || "未知商户",
        );
        const amount = Math.abs(expense.amount);
        merchantTotals.set(
          merchant,
          (merchantTotals.get(merchant) || 0) + amount,
        );
      }

      // Convert to array and sort by amount
      const sortedMerchants = Array.from(merchantTotals.entries()).sort(
        (a, b) => b[1] - a[1],
      );

      // Get significant merchants (over threshold or top 1)
      const significantMerchants = sortedMerchants
        .filter(([_, amount], index) => amount >= threshold || index === 0)
        .slice(0, 3); // Limit to top 10

      // Add merchant nodes and links
      for (const [merchant, amount] of significantMerchants) {
        let merchantIndex = nodeMap.get(merchant);

        if (merchantIndex === undefined) {
          merchantIndex = nodes.length;
          nodes.push({ name: merchant });
          nodeMap.set(merchant, merchantIndex);
        }

        links.push({
          source: categoryIndex,
          target: merchantIndex,
          value: amount,
        });
      }
    }

    // Process other categories if they exist
    if (otherCategories.length > 0) {
      const otherCategoriesTotal = otherCategories.reduce(
        (sum, [_, stats]) => sum + Math.abs(stats.amount),
        0,
      );

      if (otherCategoriesTotal > 0) {
        const otherCatName = "其他分类";
        const otherMerchantName = "其他商家";

        // Add other categories node
        const otherCatIndex = nodes.length;
        nodes.push({ name: otherCatName });
        nodeMap.set(otherCatName, otherCatIndex);

        // Add link from root to other categories
        links.push({
          source: 0, // Root
          target: otherCatIndex,
          value: otherCategoriesTotal,
        });

        // Add other merchants node
        const otherMerchantIndex = nodes.length;
        nodes.push({ name: otherMerchantName });

        // Add link from other categories to other merchants
        links.push({
          source: otherCatIndex,
          target: otherMerchantIndex,
          value: otherCategoriesTotal,
        });
      }
    }

    return { nodes, links };
  } catch (error) {
    console.error("Error generating Sankey data:", error);
    return { nodes: [], links: [] };
  }
}

interface GenerateTopMerchantsParams {
  year: number;
  ownerId?: string;
  limit?: number;
}

export interface MerchantStats {
  name: string;
  totalAmount: number;
  transactionCount: number;
  lastTransactionDate?: string;
  categories: Record<string, { amount: number; count: number }>;
}

export async function generateTopMerchants({
  year,
  ownerId,
  limit = 100,
}: GenerateTopMerchantsParams) {
  const { totalByCategory } = calculateCategoryYearlyStats(year, ownerId);

  // Process top merchants
  const merchantMap = new Map<string, MerchantStats>();
  // Aggregate merchant data across all categories
  for (const [category, stats] of Object.entries(totalByCategory)) {
    for (const expense of stats.expenses) {
      const merchantName = standardizeMerchantName(
        expense.merchant || expense.description || "未知商户",
      );
      const amount = Math.abs(expense.amount);

      if (!merchantMap.has(merchantName)) {
        merchantMap.set(merchantName, {
          name: merchantName,
          totalAmount: 0,
          transactionCount: 0,
          categories: {},
        });
      }

      const merchant = merchantMap.get(merchantName)!;
      merchant.totalAmount += amount;
      merchant.transactionCount += 1;

      // Track category breakdown
      if (!merchant.categories[category]) {
        merchant.categories[category] = { amount: 0, count: 0 };
      }
      merchant.categories[category].amount += amount;
      merchant.categories[category].count += 1;
    }
  }
  // Convert to array and sort
  const topMerchants = Array.from(merchantMap.values())
    .sort((a, b) => {
      // First by total amount (descending)
      if (b.totalAmount !== a.totalAmount) {
        return b.totalAmount - a.totalAmount;
      }
      // Then by transaction count (descending)
      return b.transactionCount - a.transactionCount;
    })
    .slice(0, limit);
  return topMerchants;
}

export interface ParetoData {
  categories: string[];
  values: number[];
  percentages: number[];
}

export async function generateParetoData({
  year,
  ownerId,
}: GenerateSankeyDataParams): Promise<ParetoData> {
  // First get the expenses data
  const { allExpenses } = await calculateCategoryYearlyStats(year, ownerId);
  // Group expenses by category and calculate total amount
  const categoryTotals = allExpenses.reduce(
    (acc, expense) => {
      const amount = Math.abs(expense.amount);
      acc[expense.category] = (acc[expense.category] || 0) + amount;
      return acc;
    },
    {} as Record<string, number>,
  );
  // Convert to array and sort by amount (descending)
  const sortedCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15); // Limit to top 15 categories
  // Calculate cumulative percentages
  const totalAmount = sortedCategories.reduce(
    (sum, [_, amount]) => sum + amount,
    0,
  );
  let cumulativeSum = 0;

  const result = sortedCategories.map(([category, amount]) => {
    cumulativeSum += amount;
    const percentage = (cumulativeSum / totalAmount) * 100;
    return {
      category,
      amount,
      percentage: parseFloat(percentage.toFixed(2)),
    };
  });

  return {
    categories: result.map((r) => r.category),
    values: result.map((r) => r.amount),
    percentages: result.map((r) => r.percentage),
  };
}

// Add to src/lib/insights.ts

export interface QuadrantData {
  name: string;
  category: string;
  frequency: number;
  avgAmount: number;
  totalAmount: number;
}

export async function generateQuadrantData({
  year,
  ownerId,
  minTotalAmount = 50,
  minFrequency = 2,
}: {
  year: number;
  ownerId?: string;
  minTotalAmount?: number;
  minFrequency?: number;
}): Promise<QuadrantData[]> {
  const { allExpenses } = await calculateCategoryYearlyStats(year, ownerId);

  // Group by merchant
  const merchantStats = allExpenses.reduce(
    (acc, expense) => {
      const merchant = standardizeMerchantName(expense.merchant || "未知商家");
      if (!acc[merchant]) {
        acc[merchant] = {
          name: merchant,
          category: expense.category || "其他",
          count: 0,
          totalAmount: 0,
          amounts: [],
        };
      }
      const amount = Math.abs(expense.amount);
      acc[merchant].count += 1;
      acc[merchant].totalAmount += amount;
      acc[merchant].amounts.push(amount);
      return acc;
    },
    {} as Record<
      string,
      {
        name: string;
        category: string;
        count: number;
        totalAmount: number;
        amounts: number[];
      }
    >,
  );

  // Convert to array and calculate metrics
  const result = Object.values(merchantStats)
    .filter((merchant) => merchant.name && merchant.name !== "未知商家")
    .filter(
      (merchant) =>
        merchant.totalAmount >= minTotalAmount &&
        merchant.count >= minFrequency,
    )
    .map((merchant) => {
      const avgAmount = merchant.totalAmount / merchant.count;
      return {
        name: merchant.name,
        category: merchant.category,
        frequency: merchant.count,
        avgAmount: parseFloat(avgAmount.toFixed(2)),
        totalAmount: parseFloat(merchant.totalAmount.toFixed(2)),
      };
    });

  return result;
}

// Add to src/lib/insights.ts

export interface ThemeRiverData {
  date: string;
  category: string;
  value: number;
}

export async function generateThemeRiverData({
  year,
  ownerId,
  topN = 10,
}: {
  year: number;
  ownerId?: string;
  topN?: number;
}): Promise<{ data: ThemeRiverData[]; categories: string[] }> {
  const { allExpenses } = await calculateCategoryYearlyStats(year, ownerId);

  // Get top N categories by total amount
  const categoryTotals = allExpenses.reduce(
    (acc, expense) => {
      const amount = Math.abs(expense.amount);
      acc[expense.category] = (acc[expense.category] || 0) + amount;
      return acc;
    },
    {} as Record<string, number>,
  );

  const topCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([category]) => category);

  // Group by month and category
  const monthlyData = allExpenses.reduce(
    (acc, expense) => {
      if (!topCategories.includes(expense.category)) {
        return acc; // Skip non-top categories
      }

      const date = new Date(expense.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const amount = Math.abs(expense.amount);

      if (!acc[monthKey]) {
        acc[monthKey] = {};
      }

      acc[monthKey][expense.category] =
        (acc[monthKey][expense.category] || 0) + amount;
      return acc;
    },
    {} as Record<string, Record<string, number>>,
  );

  // Generate data points for each month and category
  const data: ThemeRiverData[] = [];
  const months = Object.keys(monthlyData).sort();

  months.forEach((month) => {
    const monthData = monthlyData[month];
    topCategories.forEach((category) => {
      data.push({
        date: month,
        category,
        value: monthData[category] || 0,
      });
    });
  });

  return {
    data,
    categories: topCategories,
  };
}

// Add to src/lib/insights.ts

export interface PaymentMethodStats {
  [key: string]: unknown;
  name: string;
  transactionCount: number;
  totalAmount: number;
  avgAmount: number;
  usageDays: number;
  amountRatio: number;
  countRatio: number;
}

type ChartDataInput = {
  [key: string]: unknown;
  name: string;
  value: number;
};

export interface SpendingTier extends ChartDataInput {
  range: [number, number];
}

export interface SpendingScenarioData {
  paymentMethods: PaymentMethodStats[];
  spendingTiers: SpendingTier[];
}

export async function analyzeSpendingScenarios({
  year,
  ownerId,
}: {
  year: number;
  ownerId?: string;
}): Promise<SpendingScenarioData> {
  const { allExpenses } = await calculateCategoryYearlyStats(year, ownerId);

  // 1. Analyze payment methods
  const paymentMethodMap = allExpenses.reduce(
    (acc, expense) => {
      const accountStr = expense.account || "其他";
      const method = accountStr.includes("(")
        ? accountStr.split("(")[0]
        : accountStr;
      if (!acc[method]) {
        acc[method] = {
          name: method,
          transactionCount: 0,
          totalAmount: 0,
          dates: new Set<string>(),
        };
      }
      const amount = Math.abs(expense.amount);
      acc[method].transactionCount += 1;
      acc[method].totalAmount += amount;
      acc[method].dates.add(expense.date.split("T")[0]); // Store date for usage days
      return acc;
    },
    {} as Record<
      string,
      {
        name: string;
        transactionCount: number;
        totalAmount: number;
        dates: Set<string>;
      }
    >,
  );

  const totalAmount = Object.values(paymentMethodMap).reduce(
    (sum, method) => sum + method.totalAmount,
    0,
  );
  const totalTransactions = allExpenses.length;

  const paymentMethods = Object.values(paymentMethodMap)
    .map((method) => ({
      name: method.name,
      transactionCount: method.transactionCount,
      totalAmount: parseFloat(method.totalAmount.toFixed(2)),
      avgAmount: parseFloat(
        (method.totalAmount / method.transactionCount).toFixed(2),
      ),
      usageDays: method.dates.size,
      amountRatio: parseFloat(
        ((method.totalAmount / totalAmount) * 100).toFixed(2),
      ),
      countRatio: parseFloat(
        ((method.transactionCount / totalTransactions) * 100).toFixed(2),
      ),
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);

  // 2. Analyze spending tiers
  const tierRanges: Array<{ name: string; range: [number, number] }> = [
    { name: "大额(15000+)", range: [15000, Infinity] },
    { name: "大额(10000-15000)", range: [10000, 15000] },
    { name: "大额(5000-10000)", range: [5000, 10000] },
    { name: "大额(1000-5000)", range: [1000, 5000] },
    { name: "中额(300-1000)", range: [300, 1000] },
    { name: "小额(100-300)", range: [100, 300] },
    { name: "零花(0-100)", range: [0, 100] },
  ];

  const spendingTiers = tierRanges
    .map((tier) => {
      const amount = allExpenses
        .filter((expense) => {
          const absAmount = Math.abs(expense.amount);
          return absAmount >= tier.range[0] && absAmount < tier.range[1];
        })
        .reduce((sum, expense) => sum + Math.abs(expense.amount), 0);

      return {
        name: tier.name,
        value: parseFloat(amount.toFixed(2)),
        range: tier.range,
      };
    })
    .filter((tier) => tier.value > 0); // Only include tiers with transactions

  return {
    paymentMethods,
    spendingTiers,
  };
}

// Add to src/lib/insights.ts

export interface SpendingHabits {
  dailyAvg: number;
  activeDays: number;
  weekendRatio: number;
  fixedExpensesRatio: number;
  monthStartRatio: number;
  lateNightRatio: number;
  engelCoefficient: number;
}

export async function analyzeSpendingHabits({
  year,
  ownerId,
}: {
  year: number;
  ownerId?: string;
}): Promise<SpendingHabits> {
  const { allExpenses } = await calculateCategoryYearlyStats(year, ownerId);

  // 1. Basic statistics
  const dailyExpenses = allExpenses.reduce(
    (acc, expense) => {
      const date = expense.date.split("T")[0];
      acc[date] = (acc[date] || 0) + Math.abs(expense.amount);
      return acc;
    },
    {} as Record<string, number>,
  );

  const dailyAvg =
    Object.values(dailyExpenses).reduce((sum, amount) => sum + amount, 0) /
    (Object.keys(dailyExpenses).length || 1);

  // 2. Weekend spending ratio
  const weekendExpenses = allExpenses
    .filter((expense) => {
      const day = new Date(expense.date).getDay();
      return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
    })
    .reduce((sum, expense) => sum + Math.abs(expense.amount), 0);

  const totalExpenses = allExpenses.reduce(
    (sum, expense) => sum + Math.abs(expense.amount),
    0,
  );
  const weekendRatio = (weekendExpenses / totalExpenses) * 100;

  // 3. Fixed expenses ratio (merchants with regular spending)
  const monthlyMerchantCounts = allExpenses.reduce(
    (acc, expense) => {
      const date = new Date(expense.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const merchant = expense.merchant || "Unknown";

      if (!acc[merchant]) {
        acc[merchant] = new Set();
      }
      acc[merchant].add(monthKey);
      return acc;
    },
    {} as Record<string, Set<string>>,
  );

  const totalMonths = new Set(
    allExpenses.map((expense) => {
      const date = new Date(expense.date);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    }),
  ).size;

  const recurringMerchants = Object.entries(monthlyMerchantCounts)
    .filter(([_, months]) => months.size >= Math.max(2, totalMonths * 0.8))
    .map(([merchant]) => merchant);

  const fixedExpenses = allExpenses
    .filter((expense) => recurringMerchants.includes(expense.merchant || ""))
    .reduce((sum, expense) => sum + Math.abs(expense.amount), 0);
  const fixedExpensesRatio = (fixedExpenses / totalExpenses) * 100;

  // 4. Month start spending ratio (first 5 days)
  const monthStartExpenses = allExpenses
    .filter((expense) => new Date(expense.date).getDate() <= 5)
    .reduce((sum, expense) => sum + Math.abs(expense.amount), 0);

  const monthStartRatio = (monthStartExpenses / totalExpenses) * 100;

  // 5. Late night spending (10 PM - 4 AM)
  const lateNightExpenses = allExpenses
    .filter((expense) => {
      const hour = new Date(expense.date).getHours();
      return hour >= 22 || hour < 4;
    })
    .reduce((sum, expense) => sum + Math.abs(expense.amount), 0);

  const lateNightRatio = (lateNightExpenses / totalExpenses) * 100;

  // 6. Engel's coefficient (food expenses / total expenses)
  const foodCategories = [
    "餐饮",
    "食品",
    "外卖",
    "超市",
    "生鲜",
    "水果",
    "零食",
    "酒水",
  ];
  const foodExpenses = allExpenses
    .filter((expense) =>
      foodCategories.some((cat) =>
        expense.category?.toLowerCase().includes(cat.toLowerCase()),
      ),
    )
    .reduce((sum, expense) => sum + Math.abs(expense.amount), 0);

  const engelCoefficient = (foodExpenses / totalExpenses) * 100;

  return {
    dailyAvg: parseFloat(dailyAvg.toFixed(2)),
    activeDays: Object.keys(dailyExpenses).length,
    weekendRatio: parseFloat(weekendRatio.toFixed(1)),
    fixedExpensesRatio: parseFloat(fixedExpensesRatio.toFixed(1)),
    monthStartRatio: parseFloat(monthStartRatio.toFixed(1)),
    lateNightRatio: parseFloat(lateNightRatio.toFixed(2)),
    engelCoefficient: parseFloat(engelCoefficient.toFixed(2)),
  };
}

// Add to src/lib/insights.ts

export interface FunnelData {
  name: string;
  value: number;
  percentage: number;
}

export async function generateFunnelData({
  year,
  ownerId,
}: {
  year: number;
  ownerId?: string;
}): Promise<FunnelData[]> {
  const { allExpenses } = await calculateCategoryYearlyStats(year, ownerId);
  const totalAmount = allExpenses.reduce(
    (sum, expense) => sum + Math.abs(expense.amount),
    0,
  );
  // Define amount ranges in ascending order
  const ranges = [
    { min: 0, max: 50, label: "0-50元" },
    { min: 50, max: 100, label: "50-100元" },
    { min: 100, max: 500, label: "100-500元" },
    { min: 500, max: 1000, label: "500-1000元" },
    { min: 1000, max: 5000, label: "1000-5000元" },
    { min: 5000, max: 10000, label: "5000-10000元" },
    { min: 10000, max: 15000, label: "10000-15000元" },
    { min: 15000, max: 20000, label: "15000-20000元" },
    { min: 20000, max: Infinity, label: ">20000元" },
  ];

  // Calculate total amount for each range
  const rangeTotals = ranges.map((range) => {
    const total = allExpenses
      .filter((expense) => {
        const amount = Math.abs(expense.amount);
        return amount >= range.min && amount < range.max;
      })
      .reduce((sum, expense) => sum + Math.abs(expense.amount), 0);

    return {
      name: range.label,
      value: parseFloat(total.toFixed(2)),
      percentage: parseFloat(((total / totalAmount) * 100).toFixed(1)),
    };
  });

  // Filter out empty ranges and sort by value in descending order
  return rangeTotals
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);
}

// Add to src/lib/insights.ts

export interface WordCloudData {
  [key: string]: unknown;
  name: string;
  value: number;
}

export async function generateWordCloudData({
  year,
  ownerId,
  limit = 30,
}: {
  year: number;
  ownerId?: string;
  limit?: number;
}): Promise<WordCloudData[]> {
  const { allExpenses } = await calculateCategoryYearlyStats(year, ownerId);

  // Group by merchant and calculate total amount and count
  const merchantStats = allExpenses.reduce(
    (acc, expense) => {
      const merchant = standardizeMerchantName(expense.merchant);
      if (!acc[merchant]) {
        acc[merchant] = {
          amount: 0,
          count: 0,
        };
      }
      acc[merchant].amount += Math.abs(expense.amount);
      acc[merchant].count += 1;
      return acc;
    },
    {} as Record<string, { amount: number; count: number }>,
  );

  // Convert to array and filter out small amounts
  const data = Object.entries(merchantStats)
    .filter(([name, _]) => name.trim().length > 0 && name !== "其他")
    .filter(([_, stats]) => stats.amount > 10) // Filter out small amounts
    .map(([name, stats]) => ({
      name,
      value: parseFloat(stats.amount.toFixed(2)),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit); // Limit to top N merchants

  return data;
}

export interface BoxPlotData {
  categories: string[];
  data: Array<{
    c: number; // category index
    v: number; // value (amount)
    m: string; // merchant
    d: string; // date (YYYY-MM-DD)
  }>;
  box_data: number[][]; // Array of [min, q1, median, q3, max] for each category
}

export async function generateBoxPlotData({
  year,
  ownerId,
}: {
  year: number;
  ownerId?: string;
}): Promise<BoxPlotData> {
  const { allExpenses: expenseTransactions } =
    await calculateCategoryYearlyStats(year, ownerId);

  if (expenseTransactions.length === 0) {
    return { categories: [], data: [], box_data: [] };
  }

  // Group transactions by category and calculate total amount for sorting
  const categoryTotals = new Map<string, number>();
  expenseTransactions.forEach((tx) => {
    const total = categoryTotals.get(tx.category) || 0;
    categoryTotals.set(tx.category, total + tx.amount);
  });

  // Get top 8 categories by total amount
  const topCategories = Array.from(categoryTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([category]) => category);

  const pointsData: Array<{ c: number; v: number; m: string; d: string }> = [];
  const boxStats: number[][] = [];

  // Process each category
  topCategories.forEach((category, categoryIndex) => {
    const categoryTransactions = expenseTransactions
      .filter((tx) => tx.category === category)
      .map((tx) => ({
        amount: tx.amount,
        merchant: tx.account || "未知",
        date: tx.date || new Date().toISOString().split("T")[0],
      }));

    // Add to points data
    categoryTransactions.forEach((tx) => {
      pointsData.push({
        c: categoryIndex,
        v: tx.amount,
        m: tx.merchant,
        d: tx.date,
      });
    });

    // Calculate box plot statistics
    if (categoryTransactions.length > 0) {
      const amounts = categoryTransactions
        .map((tx) => tx.amount)
        .sort((a, b) => a - b);
      const min = amounts[0];
      const max = amounts[amounts.length - 1];
      const median = calculatePercentile(amounts, 50);
      const q1 = calculatePercentile(amounts, 25);
      const q3 = calculatePercentile(amounts, 75);

      boxStats.push([min, q1, median, q3, max]);
    } else {
      boxStats.push([] as unknown as number[]);
    }
  });

  return {
    categories: topCategories,
    data: pointsData,
    box_data: boxStats,
  };
}

// Helper function to calculate percentiles
function calculatePercentile(
  sortedValues: number[],
  percentile: number,
): number {
  if (sortedValues.length === 0) return 0;

  const index = (percentile / 100) * (sortedValues.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);

  if (lower === upper) return sortedValues[lower];

  // Linear interpolation
  const fraction = index - lower;
  return (
    sortedValues[lower] + (sortedValues[upper] - sortedValues[lower]) * fraction
  );
}

export interface InsightsData {
  sankeyData: SankeyData;
  topMerchants: MerchantStats[];
  paretoData: ParetoData;
  quadrantData: QuadrantData[];
  themeRiverData: {
    data: ThemeRiverData[];
    categories: string[];
  };
  spendingScenarios: SpendingScenarioData;
  spendingHabits: SpendingHabits;
  funnelData: FunnelData[];
  wordCloudData: WordCloudData[];
  boxPlotData: BoxPlotData;
}
