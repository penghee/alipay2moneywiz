import { readFileSync, readdirSync, existsSync } from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { getDataDirectory, getYearDataDirectory } from "@/config/paths";

interface HistoricalTransaction {
  描述: string;
  交易对方: string;
  分类: string;
  金额: string;
}

interface CategoryPattern {
  category: string;
  keywords: Set<string>;
  counterpartyPatterns: Set<string>;
  amountRanges: Array<{ min: number; max: number }>;
  confidence: number;
  sampleCount: number;
}

export class SmartCategoryMatcher {
  private patterns: Map<string, CategoryPattern> = new Map();
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    if (this.isInitialized) return;

    console.log("Initializing smart category matcher...");
    await this.learnFromHistory();
    this.isInitialized = true;
    console.log(
      `Smart category matcher initialized with ${this.patterns.size} patterns`,
    );
  }

  private async learnFromHistory() {
    const dataDir = getDataDirectory();
    if (!existsSync(dataDir)) return;

    const years = readdirSync(dataDir, { withFileTypes: true })
      .filter((item) => item.isDirectory() && /^\d{4}$/.test(item.name))
      .map((item) => parseInt(item.name))
      .sort();

    const categoryTransactions: Map<string, HistoricalTransaction[]> =
      new Map();

    // 读取所有历史数据
    for (const year of years) {
      const yearDir = getYearDataDirectory(year);
      if (!existsSync(yearDir)) continue;

      const files = readdirSync(yearDir)
        .filter((f) => f.endsWith(".csv") && !f.includes("_"))
        .sort();

      for (const file of files) {
        try {
          const filePath = path.join(yearDir, file);
          const content = readFileSync(filePath, "utf8");
          const records = parse(content, {
            delimiter: ",",
            columns: true,
            trim: true,
            skip_empty_lines: true,
          }) as HistoricalTransaction[];

          for (const record of records) {
            if (
              record.分类 &&
              record.分类 !== "其他" &&
              record.分类 !== "百货"
            ) {
              if (!categoryTransactions.has(record.分类)) {
                categoryTransactions.set(record.分类, []);
              }
              categoryTransactions.get(record.分类)!.push(record);
            }
          }
        } catch (error) {
          console.error(`Error reading file ${file}:`, error);
        }
      }
    }

    // 为每个分类生成模式
    for (const [category, transactions] of categoryTransactions) {
      const pattern = this.generatePattern(category, transactions);
      this.patterns.set(category, pattern);
    }
  }

  private generatePattern(
    category: string,
    transactions: HistoricalTransaction[],
  ): CategoryPattern {
    const keywords = new Set<string>();
    const counterpartyPatterns = new Set<string>();
    const amountRanges: Array<{ min: number; max: number }> = [];
    const amounts: number[] = [];

    // 提取关键词
    for (const tx of transactions) {
      // 从描述中提取关键词
      if (tx.描述) {
        const descWords = this.extractKeywords(tx.描述);
        descWords.forEach((word) => keywords.add(word));
      }

      // 交易对方模式
      if (tx.交易对方) {
        counterpartyPatterns.add(tx.交易对方.toLowerCase());
      }

      // 金额范围
      const amount = Math.abs(parseFloat(tx.金额 || "0"));
      if (amount > 0) {
        amounts.push(amount);
      }
    }

    // 计算金额范围（分位数）
    if (amounts.length > 0) {
      amounts.sort((a, b) => a - b);
      const q1 = amounts[Math.floor(amounts.length * 0.25)];
      const q3 = amounts[Math.floor(amounts.length * 0.75)];
      const iqr = q3 - q1;

      amountRanges.push({
        min: Math.max(0, q1 - 1.5 * iqr),
        max: q3 + 1.5 * iqr,
      });
    }

    return {
      category,
      keywords,
      counterpartyPatterns,
      amountRanges,
      confidence: Math.min(1.0, transactions.length / 10), // 样本越多置信度越高
      sampleCount: transactions.length,
    };
  }

  private extractKeywords(text: string): string[] {
    // 简单的关键词提取，可以后续优化
    const words = text
      .toLowerCase()
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 1);

    // 过滤掉一些通用词
    const stopWords = new Set([
      "的",
      "了",
      "是",
      "在",
      "有",
      "和",
      "与",
      "及",
      "或",
      "但",
      "而",
      "也",
      "都",
      "很",
      "非常",
      "比较",
    ]);

    return words.filter((word) => !stopWords.has(word) && word.length >= 2);
  }

  public async smartMatchCategory(
    transactionType: string,
    product: string,
    counterparty: string,
    amount: number,
    fallbackCategoryMap: Record<string, string[]>,
    smartCategory: boolean,
  ): Promise<string> {
    await this.initialize();
    // if smartCategory is false, use rule based matching
    if (!smartCategory) {
      return this.ruleBasedMatch(
        transactionType,
        product,
        counterparty,
        fallbackCategoryMap,
      );
    }
    const searchText = `${transactionType} ${product}`.toLowerCase();
    const safeCounterparty = counterparty.toLowerCase();

    const categoryScores: Array<{ category: string; score: number }> = [];

    // 基于历史模式匹配
    for (const pattern of this.patterns.values()) {
      let score = 0;

      // 关键词匹配
      for (const keyword of pattern.keywords) {
        if (searchText.includes(keyword)) {
          score += 2;
        }
        if (searchText === keyword) {
          score += 5; // 完全匹配加分更多
        }
      }

      // 交易对方匹配
      if (safeCounterparty) {
        for (const cpPattern of pattern.counterpartyPatterns) {
          if (
            safeCounterparty.includes(cpPattern) ||
            cpPattern.includes(safeCounterparty)
          ) {
            score += 3;
          }
        }
      }

      // 金额范围匹配
      if (amount > 0 && pattern.amountRanges.length > 0) {
        for (const range of pattern.amountRanges) {
          if (amount >= range.min && amount <= range.max) {
            score += 1;
          }
        }
      }

      // 置信度加权
      score *= pattern.confidence;

      if (score > 0) {
        categoryScores.push({ category: pattern.category, score });
      }
    }

    // 如果有历史模式匹配结果
    if (categoryScores.length > 0) {
      categoryScores.sort((a, b) => b.score - a.score);
      const bestMatch = categoryScores[0];

      // 如果最高分明显高于第二名，返回最佳匹配
      if (
        categoryScores.length === 1 ||
        bestMatch.score > categoryScores[1].score * 1.5
      ) {
        console.log(
          `Smart matched to "${bestMatch.category}" with score ${bestMatch.score}`,
        );
        return bestMatch.category;
      }
    }

    // 回退到原有的规则匹配
    console.log("Falling back to rule-based matching");
    return this.ruleBasedMatch(
      transactionType,
      product,
      counterparty,
      fallbackCategoryMap,
    );
  }

  private ruleBasedMatch(
    transactionType: string,
    product: string,
    counterparty: string,
    categoryMap: Record<string, string[]>,
  ): string {
    const safeTransactionType = transactionType || "";
    const safeProduct = product || "";
    const safeCounterparty = counterparty || "";
    const searchText =
      `${safeTransactionType} ${safeProduct} ${safeCounterparty}`.toLowerCase();

    for (const category in categoryMap) {
      const keywords = categoryMap[category];
      for (const keyword of keywords) {
        if (searchText.includes(keyword.toLowerCase())) {
          return category;
        }
      }
    }
    return "其他";
  }

  // 获取分类统计信息
  public getPatternStats(): Array<{
    category: string;
    sampleCount: number;
    confidence: number;
  }> {
    return Array.from(this.patterns.values())
      .map((pattern) => ({
        category: pattern.category,
        sampleCount: pattern.sampleCount,
        confidence: pattern.confidence,
      }))
      .sort((a, b) => b.sampleCount - a.sampleCount);
  }
}

// 导出单例实例
export const smartCategoryMatcher = new SmartCategoryMatcher();
