"use client";

import { useState, useEffect } from "react";
import { AssetSnapshot, SnapshotComparison } from "@/types/asset";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import PreviewDialog from "@/components/ui/Dialog";
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Trash2,
  Camera,
  ArrowUpDown,
} from "lucide-react";

interface SnapshotCardProps {
  snapshot: AssetSnapshot;
  showComparison: boolean;
  comparison?: SnapshotComparison;
  onCompare: (date: string) => void;
  onDelete: (date: string) => void;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function SnapshotCard({
  snapshot,
  showComparison,
  comparison,
  onCompare,
  onDelete,
}: SnapshotCardProps) {
  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-blue-500" />
          <div>
            <h3 className="text-lg font-semibold">{snapshot.date}</h3>
            <p className="text-sm text-gray-500">
              创建于 {snapshot.snapshotDate}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCompare(snapshot.date)}
          >
            <ArrowUpDown className="h-4 w-4 mr-1" />
            对比
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(snapshot.date)}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-sm text-gray-500">总资产</p>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(snapshot.totalAssets)}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">总负债</p>
          <p className="text-2xl font-bold text-red-600">
            {formatCurrency(snapshot.totalLiabilities)}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">净资产</p>
          <p
            className={`text-2xl font-bold ${
              snapshot.netWorth >= 0 ? "text-blue-600" : "text-red-600"
            }`}
          >
            {formatCurrency(snapshot.netWorth)}
          </p>
        </div>
      </div>

      {snapshot.note && (
        <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
          备注: {snapshot.note}
        </div>
      )}

      {showComparison && comparison && (
        <div className="border-t pt-4 mt-4">
          <div className="flex items-center gap-2 mb-3">
            {comparison.netWorthChange >= 0 ? (
              <TrendingUp className="h-5 w-5 text-green-500" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-500" />
            )}
            <p className="font-semibold">
              净资产变化:{" "}
              <span
                className={
                  comparison.netWorthChange >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }
              >
                {formatComparison(comparison.netWorthChange)}
              </span>
              {comparison.netWorthChangePercent !== 0 && (
                <span className="text-sm text-gray-600 ml-2">
                  ({comparison.netWorthChangePercent.toFixed(2)}%)
                </span>
              )}
            </p>
          </div>

          {comparison.assetChanges.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">资产变化详情:</p>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {comparison.assetChanges.slice(0, 5).map((change, index) => (
                  <div
                    key={index}
                    className="flex justify-between text-sm bg-gray-50 p-2 rounded"
                  >
                    <span>{change.name}</span>
                    <span
                      className={
                        change.change >= 0 ? "text-green-600" : "text-red-600"
                      }
                    >
                      {formatComparison(change.change)}
                      {change.changePercent !== 0 && (
                        <span className="text-gray-500 ml-1">
                          ({change.changePercent.toFixed(1)}%)
                        </span>
                      )}
                    </span>
                  </div>
                ))}
                {comparison.assetChanges.length > 5 && (
                  <p className="text-sm text-gray-500 text-center">
                    还有 {comparison.assetChanges.length - 5} 项变化...
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="text-xs text-gray-400">
        {snapshot.assets.length} 项资产记录
      </div>
    </Card>
  );
}

function formatComparison(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return sign + formatCurrency(value);
}

export default function SnapshotsPage() {
  const [snapshots, setSnapshots] = useState<AssetSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showCompareDialog, setShowCompareDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedSnapshotDate, setSelectedSnapshotDate] = useState<string>("");
  const [comparison, setComparison] = useState<SnapshotComparison | null>(null);
  const [snapshotDate, setSnapshotDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [note, setNote] = useState("");

  useEffect(() => {
    fetchSnapshots();
  }, []);

  const fetchSnapshots = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/snapshots");
      const data = await response.json();
      setSnapshots(data);
    } catch (error) {
      console.error("Error loading snapshots:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSnapshot = async () => {
    try {
      const response = await fetch("/api/snapshots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: snapshotDate, note }),
      });

      if (response.ok) {
        setShowCreateDialog(false);
        setNote("");
        fetchSnapshots();
      } else {
        alert("创建快照失败");
      }
    } catch (error) {
      console.error("Error creating snapshot:", error);
      alert("创建快照失败");
    }
  };

  const handleCompare = async (date: string) => {
    setSelectedSnapshotDate(date);
    try {
      const response = await fetch(`/api/snapshots/${date}/compare`);
      const data = await response.json();
      setComparison(data);
      setShowCompareDialog(true);
    } catch (error) {
      console.error("Error comparing snapshots:", error);
    }
  };

  const handleDelete = (date: string) => {
    setSelectedSnapshotDate(date);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(`/api/snapshots/${selectedSnapshotDate}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setShowDeleteDialog(false);
        fetchSnapshots();
      } else {
        alert("删除快照失败");
      }
    } catch (error) {
      console.error("Error deleting snapshot:", error);
      alert("删除快照失败");
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">资产快照管理</h1>
          <p className="text-gray-600 mt-2">记录和追踪你的财务状况变化</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Camera className="h-5 w-5 mr-2" />
          创建快照
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">加载中...</div>
      ) : snapshots.length === 0 ? (
        <Card className="p-12 text-center">
          <Camera className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold mb-2">还没有快照</h2>
          <p className="text-gray-600 mb-6">
            {`点击"创建快照"按钮来记录你的当前资产状况`}
          </p>
          <Button onClick={() => setShowCreateDialog(true)}>
            创建第一个快照
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {snapshots.map((snapshot) => (
            <SnapshotCard
              key={snapshot.date}
              snapshot={snapshot}
              showComparison={
                comparison?.currentSnapshot?.date === snapshot.date
              }
              comparison={comparison || undefined}
              onCompare={handleCompare}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* 创建快照对话框 */}
      <PreviewDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        title="创建资产快照"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">快照日期</label>
            <Input
              type="date"
              value={snapshotDate}
              onChange={(e) => setSnapshotDate(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">备注（可选）</label>
            <Input
              placeholder="如：月末总结、特殊支出后等"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
              取消
            </Button>
            <Button onClick={handleCreateSnapshot}>创建</Button>
          </div>
        </div>
      </PreviewDialog>

      {/* 对比对话框 */}
      <PreviewDialog
        open={showCompareDialog}
        onOpenChange={setShowCompareDialog}
        title="快照对比"
      >
        {comparison && (
          <div className="space-y-4">
            {comparison.previousSnapshot ? (
              <div className="text-sm text-gray-600">
                对比: {comparison.previousSnapshot.date} →{" "}
                {comparison.currentSnapshot.date}
              </div>
            ) : (
              <div className="text-sm text-gray-600">
                这是第一个快照，没有对比数据
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">总资产变化</p>
                <p
                  className={`text-lg font-semibold ${
                    comparison.currentSnapshot.totalAssets -
                      (comparison.previousSnapshot?.totalAssets || 0) >=
                    0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {formatComparison(
                    comparison.currentSnapshot.totalAssets -
                      (comparison.previousSnapshot?.totalAssets || 0),
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">总负债变化</p>
                <p
                  className={`text-lg font-semibold ${
                    comparison.currentSnapshot.totalLiabilities -
                      (comparison.previousSnapshot?.totalLiabilities || 0) <=
                    0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {formatComparison(
                    comparison.currentSnapshot.totalLiabilities -
                      (comparison.previousSnapshot?.totalLiabilities || 0),
                  )}
                </p>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <Button onClick={() => setShowCompareDialog(false)}>关闭</Button>
            </div>
          </div>
        )}
      </PreviewDialog>

      {/* 删除确认对话框 */}
      <PreviewDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="确认删除"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            确定要删除 {selectedSnapshotDate} 的快照吗？此操作无法撤销。
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              取消
            </Button>
            <Button
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              删除
            </Button>
          </div>
        </div>
      </PreviewDialog>
    </div>
  );
}
