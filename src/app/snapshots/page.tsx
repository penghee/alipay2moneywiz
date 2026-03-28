/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import { useState, useEffect } from "react";
import { AssetSnapshot } from "@/types/asset";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Dialog from "@/components/ui/Dialog";
import {
  Calendar,
  Trash2,
  Camera,
  LineChart as LineChartIcon,
  BarChart3 as BarChartIcon,
} from "lucide-react";
import EchartComponent from "@/components/charts/EchartComponent";
import * as echarts from "echarts";

interface SnapshotCardProps {
  snapshot: AssetSnapshot;
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

function SnapshotCard({ snapshot, onDelete }: SnapshotCardProps) {
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
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(snapshot.date)}
        >
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
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

      <div className="text-xs text-gray-400">
        {snapshot.assets.length} 项资产记录
      </div>
    </Card>
  );
}

export default function SnapshotsPage() {
  const [snapshots, setSnapshots] = useState<AssetSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedSnapshotDate, setSelectedSnapshotDate] = useState<string>("");
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

  // 计算净资产走势数据（用于面积图）
  const netWorthData = snapshots.map((snapshot) => ({
    name: snapshot.date,
    value: snapshot.netWorth,
  }));

  // 计算多曲线图数据
  const assetCategories = ["活期", "投资", "固定资产", "应收", "其他"];
  const assetsTypes = ["负债"];

  const assetLineData = assetCategories.map((category) => ({
    name: category,
    data: snapshots.map((snapshot) => {
      const categoryAssets = snapshot.assets.filter(
        (item) => item.type === "资产",
      );
      const currentAssets = categoryAssets.filter(
        (item) => item.category === category,
      );
      const total = currentAssets.reduce((sum, item) => sum + item.amount, 0);
      return { name: snapshot.date, value: total };
    }),
  }));

  const debtLineData = assetsTypes.map((category) => ({
    name: category,
    data: snapshots.map((snapshot) => {
      const currentAssets = snapshot.assets.filter(
        (item) => item.type === "负债",
      );
      const total = currentAssets.reduce((sum, item) => sum + item.amount, 0);
      return { name: snapshot.date, value: total };
    }),
  }));

  const multiLineData = [...assetLineData, ...debtLineData];

  // 净资产面积图配置
  const netWorthAreaOption: echarts.EChartsOption = {
    tooltip: {
      trigger: "axis" as const,
      formatter: function (params: any) {
        return (
          params[0].name + "<br/>净资产: " + formatCurrency(params[0].value)
        );
      },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      top: "10%",
      containLabel: true,
    },
    xAxis: {
      type: "category" as const,
      data: netWorthData.map((item) => item.name),
      axisLine: { lineStyle: { color: "#6b7280" } },
    },
    yAxis: {
      type: "value" as const,
      axisLine: { lineStyle: { color: "#6b7280" } },
      splitLine: { lineStyle: { color: "#e5e7eb", type: "dashed" as const } },
    },
    series: [
      {
        name: "净资产",
        type: "line" as const,
        data: netWorthData.map((item) => item.value),
        smooth: true,
        symbol: "circle" as const,
        symbolSize: 6,
        itemStyle: {
          color: "#3b82f6",
        },
        lineStyle: {
          width: 3,
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "rgba(59, 130, 246, 0.5)" },
            { offset: 1, color: "rgba(59, 130, 246, 0.1)" },
          ]),
        },
      },
    ],
  };

  // 多曲线图配置
  const multiLineOption: echarts.EChartsOption = {
    tooltip: {
      trigger: "axis" as const,
      formatter: function (params: any) {
        let result = params[0].name + "<br/>";
        params.forEach((param: any) => {
          result += `<span style="display:inline-block;margin-right:8px;border-radius:10px;width:10px;height:10px;background-color:${param.color}"></span>`;
          result += `${param.seriesName}: ${formatCurrency(param.value)}<br/>`;
        });
        return result;
      } as any,
    },
    legend: {
      data: multiLineData.map((item) => item.name),
      bottom: 0,
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "15%",
      top: "10%",
      containLabel: true,
    },
    xAxis: {
      type: "category" as const,
      data: snapshots.map((item) => item.date),
      axisLine: { lineStyle: { color: "#6b7280" } },
    },
    yAxis: {
      type: "value" as const,
      axisLine: { lineStyle: { color: "#6b7280" } },
      splitLine: { lineStyle: { color: "#e5e7eb", type: "dashed" as const } },
    },
    series: multiLineData.map((item) => ({
      name: item.name,
      type: "line" as const,
      data: item.data.map((d) => d.value),
      smooth: true,
      symbol: "circle" as const,
      symbolSize: 6,
      itemStyle: {
        color: getCategoryColor(item.name),
      },
      lineStyle: {
        width: 2,
      },
    })),
  };

  function getCategoryColor(category: string): string {
    const colors: { [key: string]: string } = {
      活期: "#10b981", // green
      投资: "#3b82f6", // blue
      固定资产: "#8b5cf6", // purple
      应收: "#f59e0b", // yellow
      负债: "#ef4444", // red
    };
    return colors[category] || "#6b7280";
  }

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

      {/* 图表区域 */}
      {snapshots.length > 0 && (
        <div className="space-y-6">
          {/* 净资产走势面积图 */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <LineChartIcon className="h-5 w-5 text-blue-500" />
                净资产走势
              </h2>
            </div>
            <div style={{ height: "400px" }}>
              <EchartComponent option={netWorthAreaOption} />
            </div>
          </Card>

          {/* 总资产、负债等变化多曲线图 */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <BarChartIcon className="h-5 w-5 text-purple-500" />
                资产与负债变化
              </h2>
            </div>
            <div style={{ height: "400px" }}>
              <EchartComponent option={multiLineOption} />
            </div>
          </Card>
        </div>
      )}

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
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* 创建快照对话框 */}
      <Dialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        title="创建资产快照"
        hideFooter={true}
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
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="确认删除"
        hideFooter={true}
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
      </Dialog>
    </div>
  );
}
