export interface Asset {
  id: string;
  date: string; // YYYY-MM-DD
  type: "活期" | "投资" | "固定资产" | "应收" | "负债";
  typeDisplay: string; // Display name for the type
  category: string;
  subcategory: string;
  name: string;
  account: string;
  amount: number;
  rate?: number; // Interest rate or return rate
  note?: string;
  owner: string; // Store owner name directly
}

export interface Liability extends Asset {
  type: "负债";
  dueDate?: string; // For loans with specific due dates
}

export interface AssetSummary {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  byCategory: {
    [category: string]: {
      amount: number;
      percentage: number;
    };
  };
  byOwner: {
    [ownerId: string]: {
      assets: number;
      liabilities: number;
      netWorth: number;
    };
  };
}

export const ASSET_TYPES = {
  cash: "活期",
  investment: "投资",
  fixed_asset: "固定资产",
  receivable: "应收",
  liability: "负债",
} as const;

export const ASSET_CATEGORIES = {
  cash: ["现金", "活期存款", "货基"],
  investment: ["股票", "基金", "债券", "定期"],
  fixed_asset: ["自住住宅", "投资房产", "汽车", "其他固定资产"],
  receivable: ["应收款", "借款"],
  liability: [
    "房贷",
    "车贷",
    "信用贷",
    "信用卡",
    "花呗/白条",
    "亲友借款",
    "其他",
  ],
} as const;
