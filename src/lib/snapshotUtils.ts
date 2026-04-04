import fs from "fs";
import path from "path";
import {
  Asset,
  AssetSnapshot,
  SnapshotItem,
  SnapshotComparison,
} from "@/types/asset";
import {
  SNAPSHOTS_DIR,
  getSnapshotPath,
  getAllSnapshotPaths,
} from "@/config/paths";

/**
 * 创建资产快照
 */
export function createSnapshot(
  date: string,
  assets: Asset[],
  note?: string,
): AssetSnapshot {
  const snapshotItems: SnapshotItem[] = assets.map((asset) => ({
    type: asset.type,
    category: asset.category,
    subcategory: asset.subcategory,
    name: asset.name,
    account: asset.account,
    amount: asset.amount,
    owner: asset.owner,
  }));

  const totalAssets = Number(
    assets
      .filter((a) => a.type !== "负债")
      .reduce((sum, a) => sum + a.amount, 0)
      .toFixed(2),
  );

  const totalLiabilities = Number(
    assets
      .filter((a) => a.type === "负债")
      .reduce((sum, a) => sum + a.amount, 0)
      .toFixed(2),
  );

  const netWorth = Number((totalAssets - totalLiabilities).toFixed(2));

  return {
    id: `snapshot-${date}`,
    date,
    snapshotDate: new Date().toISOString().replace("T", " ").slice(0, 19),
    note,
    assets: snapshotItems,
    totalAssets,
    totalLiabilities,
    netWorth,
  };
}

/**
 * 保存快照到文件
 */
export function saveSnapshot(snapshot: AssetSnapshot): void {
  const snapshotPath = getSnapshotPath(snapshot.date);

  // 确保快照目录存在
  if (!fs.existsSync(SNAPSHOTS_DIR)) {
    fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });
  }

  fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2), "utf-8");
}

/**
 * 加载快照
 */
export function loadSnapshot(date: string): AssetSnapshot | null {
  const snapshotPath = getSnapshotPath(date);

  if (!fs.existsSync(snapshotPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(snapshotPath, "utf-8");
    return JSON.parse(content) as AssetSnapshot;
  } catch (error) {
    console.error(`Error loading snapshot ${date}:`, error);
    return null;
  }
}

/**
 * 加载所有快照
 */
export function loadAllSnapshots(): AssetSnapshot[] {
  const snapshotPaths = getAllSnapshotPaths();
  const snapshots: AssetSnapshot[] = [];

  for (const snapshotPath of snapshotPaths) {
    try {
      const content = fs.readFileSync(snapshotPath, "utf-8");
      const snapshot = JSON.parse(content) as AssetSnapshot;
      snapshots.push(snapshot);
    } catch (error) {
      console.error(`Error loading snapshot ${snapshotPath}:`, error);
    }
  }

  // 按日期倒序排序
  return snapshots.sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * 删除快照
 */
export function deleteSnapshot(date: string): boolean {
  const snapshotPath = getSnapshotPath(date);

  if (!fs.existsSync(snapshotPath)) {
    return false;
  }

  try {
    fs.unlinkSync(snapshotPath);
    return true;
  } catch (error) {
    console.error(`Error deleting snapshot ${date}:`, error);
    return false;
  }
}

/**
 * 比较两个快照
 */
export function compareSnapshots(
  currentSnapshot: AssetSnapshot,
  previousSnapshot?: AssetSnapshot,
): SnapshotComparison {
  const netWorthChange = previousSnapshot
    ? Number((currentSnapshot.netWorth - previousSnapshot.netWorth).toFixed(2))
    : 0;

  const netWorthChangePercent = previousSnapshot
    ? previousSnapshot.netWorth !== 0
      ? Number(
          (
            (netWorthChange / Math.abs(previousSnapshot.netWorth)) *
            100
          ).toFixed(2),
        )
      : 0
    : 0;

  // 按名称聚合资产变化
  const currentAssetsByName = currentSnapshot.assets.reduce(
    (acc, asset) => {
      if (!acc[asset.name]) {
        acc[asset.name] = { amount: 0, type: asset.type };
      }
      if (asset.type !== "负债") {
        acc[asset.name].amount += asset.amount;
      } else {
        acc[asset.name].amount -= asset.amount;
      }
      return acc;
    },
    {} as Record<string, { amount: number; type: string }>,
  );

  const previousAssetsByName = previousSnapshot
    ? previousSnapshot.assets.reduce(
        (acc, asset) => {
          if (!acc[asset.name]) {
            acc[asset.name] = { amount: 0, type: asset.type };
          }
          if (asset.type !== "负债") {
            acc[asset.name].amount += asset.amount;
          } else {
            acc[asset.name].amount -= asset.amount;
          }
          return acc;
        },
        {} as Record<string, { amount: number; type: string }>,
      )
    : {};

  const assetChanges: SnapshotComparison["assetChanges"] = [];

  // 收集所有资产名称
  const allNames = new Set([
    ...Object.keys(currentAssetsByName),
    ...Object.keys(previousAssetsByName),
  ]);

  allNames.forEach((name) => {
    const currentAmount = currentAssetsByName[name]?.amount || 0;
    const previousAmount = previousAssetsByName[name]?.amount || 0;

    if (currentAmount !== previousAmount) {
      const change = Number((currentAmount - previousAmount).toFixed(2));
      const changePercent =
        previousAmount !== 0
          ? Number(((change / Math.abs(previousAmount)) * 100).toFixed(2))
          : 0;

      assetChanges.push({
        name,
        previousAmount,
        currentAmount,
        change,
        changePercent,
      });
    }
  });

  // 按变化金额绝对值降序排序
  assetChanges.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

  return {
    previousSnapshot,
    currentSnapshot,
    netWorthChange,
    netWorthChangePercent,
    assetChanges,
  };
}

/**
 * 获取月度净资产趋势
 */
export function getNetWorthTrend(
  months: number = 12,
): Array<{ date: string; netWorth: number; change: number }> {
  const snapshots = loadAllSnapshots().slice(0, months);
  const trend: Array<{ date: string; netWorth: number; change: number }> = [];

  for (let i = 0; i < snapshots.length; i++) {
    const snapshot = snapshots[i];
    const previousSnapshot = snapshots[i + 1];
    const change = previousSnapshot
      ? Number((snapshot.netWorth - previousSnapshot.netWorth).toFixed(2))
      : 0;

    trend.push({
      date: snapshot.date,
      netWorth: snapshot.netWorth,
      change,
    });
  }

  return trend;
}
