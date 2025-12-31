"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
  AreaChart,
  Area,
  FunnelChart,
  Funnel,
  LabelList,
  Treemap,
  ComposedChart,
  ReferenceLine,
  RadialBarChart,
  RadialBar,
} from "recharts";
import { SankeyChart } from "@/components/charts/SankeyChart";
import { apiClient } from "@/lib/apiClient";
import { InsightsResponse } from "@/types/api";
import {
  getQuadrantColor,
  getCategoryColor,
  COLOR_PALETTE,
} from "@/lib/colors";
import dynamic from "next/dynamic";
const EchartsWordcloud = dynamic(
  () => import("@/components/charts/EchartsWordcloud"),
  { ssr: false },
);
import EchartComponent from "@/components/charts/EchartComponent";
import ConsumptionDistributionChart from "@/components/charts/ConsumptionDistributionChart";

interface CustomContentProps {
  x: number;
  y: number;
  width: number;
  height: number;
  index: number;
  name: string;
  colors: string[];
}

const CustomContent = (props: CustomContentProps) => {
  const { x, y, width, height, index, name, colors } = props;
  const color = colors[index % colors.length];

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: color,
          stroke: "#fff",
          strokeWidth: 1,
        }}
      />
      <text
        x={x + width / 2}
        y={y + height / 2}
        textAnchor="middle"
        fill="#fff"
        fontSize={14}
        style={{
          fontWeight: "bold",
        }}
      >
        {name}
      </text>
    </g>
  );
};

export default function InsightsPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const [year, setYear] = useState<number | null>(null);
  const [sankeyData, setSankeyData] = useState<
    InsightsResponse["sankeyData"] | null
  >(null);
  const [topMerchants, setTopMerchants] = useState<
    InsightsResponse["topMerchants"]
  >([]);
  const [paretoData, setParetoData] = useState<
    InsightsResponse["paretoData"] | null
  >(null);
  const [quadrantData, setQuadrantData] = useState<
    InsightsResponse["quadrantData"]
  >([]);
  const [themeRiverData, setThemeRiverData] = useState<
    InsightsResponse["themeRiverData"]
  >({ data: [], categories: [] });
  const [activeTab, setActiveTab] = useState<"amount" | "payment">("amount");
  const [spendingScenarios, setSpendingScenarios] = useState<
    InsightsResponse["spendingScenarios"] | null
  >(null);
  const [spendingHabits, setSpendingHabits] = useState<
    InsightsResponse["spendingHabits"] | null
  >(null);
  const [funnelData, setFunnelData] = useState<InsightsResponse["funnelData"]>(
    [],
  );
  const [wordCloudData, setWordCloudData] = useState<
    InsightsResponse["wordCloudData"]
  >([]);
  const [boxPlotData, setBoxPlotData] = useState<
    InsightsResponse["boxPlotData"] | null
  >(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (year: number) => {
    try {
      setLoading(true);
      const {
        sankeyData,
        topMerchants,
        paretoData,
        quadrantData,
        themeRiverData,
        spendingScenarios,
        spendingHabits,
        funnelData,
        wordCloudData,
        boxPlotData,
      } = await apiClient.getInsights(year);
      setSankeyData(sankeyData);
      setTopMerchants(topMerchants);
      setParetoData(paretoData);
      setQuadrantData(quadrantData);
      setThemeRiverData(themeRiverData);
      setFunnelData(funnelData);
      setSpendingScenarios(spendingScenarios);
      setSpendingHabits(spendingHabits);
      setWordCloudData(wordCloudData);
      setBoxPlotData(boxPlotData);
    } catch (err) {
      console.error("Failed to fetch insights:", err);
      setError("Failed to load insights data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Parse the year parameter
    const parseYear = async () => {
      const resolvedParams = await params;
      const yearNum = parseInt(resolvedParams.year);
      if (!isNaN(yearNum)) {
        setYear(yearNum);
        fetchData(yearNum);
      }
    };
    parseYear();
  }, [params]);

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">消费洞察 {year}</h1>

      {/* 资金流向全景 */}
      {/* <Card className="mb-6">
        <CardHeader>
          <CardTitle>资金流向全景</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[600px] w-full">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full text-red-500">
                加载失败: {error}
              </div>
            ) : sankeyData ? (
              <SankeyChart data={sankeyData} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                暂无数据
              </div>
            )}
          </div>
        </CardContent>
      </Card> */}

      {/* 资金流向全景2 - ECharts Version */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>资金流向全景</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[600px] w-full">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full text-red-500">
                加载失败: {error}
              </div>
            ) : sankeyData ? (
              <EchartComponent
                option={{
                  tooltip: {
                    trigger: "item",
                    triggerOn: "mousemove",
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter: (params: any) => {
                      if (params.dataType === "edge") {
                        return `${params.data.source} > ${params.data.target}<br/>金额: ${new Intl.NumberFormat(
                          "zh-CN",
                          {
                            style: "currency",
                            currency: "CNY",
                            minimumFractionDigits: 2,
                          },
                        ).format(params.data.value)}`;
                      } else {
                        return `${params.name}<br/>金额: ${new Intl.NumberFormat(
                          "zh-CN",
                          {
                            style: "currency",
                            currency: "CNY",
                            minimumFractionDigits: 2,
                          },
                        ).format(params.data?.value || params.value || 0)}`;
                      }
                    },
                  },
                  series: [
                    {
                      type: "sankey",
                      layoutIterations: 0,
                      nodeGap: 12,
                      data: sankeyData.nodes.map((node) => ({
                        name: node.name,
                        itemStyle: {
                          color: `hsl(${Math.random() * 360}, 70%, 60%)`,
                        },
                      })),
                      links: sankeyData.links,
                      emphasis: {
                        focus: "adjacency",
                      },
                      lineStyle: {
                        color: "gradient",
                        curveness: 0.5,
                      },
                      label: {
                        color: "rgba(0,0,0,0.7)",
                        fontFamily: "Arial",
                      },
                    },
                  ],
                }}
                style={{ width: "100%", height: "100%" }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                暂无数据
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        {/* 最常光顾 */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>最常光顾</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-3 max-h-[500px] overflow-y-auto p-4">
              {topMerchants?.map((item, i) => {
                // Define colors for the first 3 items, then use gray for the rest
                const colors = [
                  "bg-orange-100 text-orange-600",
                  "bg-purple-100 text-purple-600",
                  "bg-green-100 text-green-600",
                  "bg-gray-100 text-gray-600",
                ];
                const colorClass = colors[Math.min(i, colors.length - 1)];

                return (
                  <div
                    key={i}
                    className="p-4 border rounded-xl shadow-sm hover:shadow-md transition-all duration-200 bg-white dark:bg-gray-800"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-medium ${colorClass}`}
                      >
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {item.name}
                        </div>
                        {/* <div className="text-sm text-gray-500 dark:text-gray-400">
                          {item.date && `最近消费: ${new Date(item.date).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\./g, '-')}`}
                        </div> */}
                      </div>
                      <div className="flex items-end gap-6 ml-4">
                        <div className="text-center">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            消费金额
                          </div>
                          <div
                            className={`font-medium text-base whitespace-nowrap ${i === 0 ? "text-orange-600" : i === 1 ? "text-purple-600" : i === 2 ? "text-green-600" : "text-gray-600"}`}
                          >
                            ¥
                            {item.totalAmount.toLocaleString("zh-CN", {
                              minimumFractionDigits: 2,
                            })}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            消费次数
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                            {item.transactionCount}次
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        {/* 消费习惯 */}
        <Card>
          <CardHeader>
            <CardTitle>消费习惯</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-4">
              {spendingHabits ? (
                <>
                  <div className="p-4 border rounded-lg text-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="text-2xl font-bold text-primary">
                      ¥{spendingHabits.dailyAvg.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      日均消费
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg text-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="text-2xl font-bold text-primary">
                      {spendingHabits.weekendRatio}%
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      周末消费占比
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg text-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="text-2xl font-bold text-primary">
                      {spendingHabits.fixedExpensesRatio}%
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      固定支出占比
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg text-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="text-2xl font-bold text-primary">
                      {spendingHabits.monthStartRatio}%
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      月初消费占比
                    </div>
                  </div>

                  {/* <div className="p-4 border rounded-lg text-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="text-2xl font-bold text-primary">
                      {spendingHabits.lateNightRatio}%
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      深夜消费占比
                    </div>
                  </div> */}

                  <div className="p-4 border rounded-lg text-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="text-2xl font-bold text-primary">
                      {spendingHabits.engelCoefficient}%
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      恩格尔系数
                    </div>
                  </div>
                </>
              ) : (
                <div className="col-span-full text-center py-8 text-gray-500">
                  加载中...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* 消费场景 */}
        <Card>
          <CardHeader>
            <CardTitle>消费场景</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs
              value={activeTab}
              onValueChange={(value) =>
                setActiveTab(value as "amount" | "payment")
              }
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="amount">金额层级</TabsTrigger>
                <TabsTrigger value="payment">支付方式</TabsTrigger>
              </TabsList>

              <TabsContent value="amount" className="h-96">
                <div className="h-full">
                  {spendingScenarios?.spendingTiers.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={spendingScenarios.spendingTiers}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) =>
                            `${(name as string).split("(")[0]}: ${((percent as number) * 100).toFixed(0)}%`
                          }
                        >
                          {spendingScenarios.spendingTiers.map(
                            (entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={getCategoryColor(entry.name)}
                              />
                            ),
                          )}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) =>
                            `¥${value.toLocaleString()}`
                          }
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      暂无数据
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="payment" className="h-96">
                <div className="h-full">
                  {spendingScenarios?.paymentMethods.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={spendingScenarios.paymentMethods}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="amountRatio"
                          label={({ name, percent }) =>
                            `${name as string}: ${((percent as number) * 100).toFixed(0)}%`
                          }
                        >
                          {spendingScenarios.paymentMethods.map(
                            (entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={getCategoryColor(entry.name)}
                              />
                            ),
                          )}
                        </Pie>
                        <Tooltip
                          formatter={(value: number, name: string) => {
                            const method =
                              spendingScenarios.paymentMethods.find(
                                (m) => m.name === name,
                              );
                            return [
                              `¥${method?.totalAmount.toLocaleString()}`,
                              `交易次数: ${method?.transactionCount}`,
                              `平均金额: ¥${method?.avgAmount}`,
                              `使用天数: ${method?.usageDays}`,
                            ];
                          }}
                        />
                        <Legend
                          formatter={(value, _, index) => {
                            const method =
                              spendingScenarios.paymentMethods[index];
                            return `${value} (${method?.countRatio.toFixed(1)}%)`;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      暂无数据
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        {/* 消费金额漏斗 */}
        <Card>
          <CardHeader>
            <CardTitle>消费金额漏斗</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <FunnelChart>
                  <Tooltip
                    formatter={(
                      value: number,
                      name: string,
                      props: { payload?: { percentage?: number } },
                    ) => {
                      const percentage = props.payload?.percentage || 0;
                      return [
                        `¥${value.toLocaleString()} (${percentage}%)`,
                        name,
                      ];
                    }}
                  />
                  <Funnel dataKey="value" data={funnelData} isAnimationActive>
                    <LabelList
                      position="right"
                      fill="#000"
                      stroke="none"
                      dataKey="name"
                    />
                    {funnelData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={getCategoryColor(entry.name)}
                      />
                    ))}
                  </Funnel>
                  <Legend
                    formatter={(value, _, index) => {
                      const item = funnelData[index];
                      return `${value} (¥${item?.value.toLocaleString()}) ${item?.percentage}%`;
                    }}
                  />
                </FunnelChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      <h1 className="text-2xl font-bold text-gray-800 mb-4">深度洞察</h1>
      <h2 className="text-xl font-semibold text-gray-700 mb-6">时间密码</h2>
      {/* 消费趋势河流 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            消费趋势河流
            <div className="ml-1 group relative">
              <span className="text-xs text-gray-400 cursor-help">ⓘ</span>
              <div className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-2 text-xs text-gray-700 bg-white rounded shadow-lg border border-gray-200 z-10">
                <p>
                  <strong>消费趋势分析：</strong>
                  <br />
                  展示各消费分类随时间的金额变化趋势，帮助您了解消费模式的变化。
                </p>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={themeRiverData.data.reduce<
                  Array<{ date: string; [key: string]: number | string }>
                >((acc, item) => {
                  const existing = acc.find((d) => d.date === item.date);
                  if (existing) {
                    (existing as { [key: string]: number | string })[
                      item.category
                    ] = item.value;
                  } else {
                    acc.push({
                      date: item.date,
                      [item.category]: item.value,
                      ...themeRiverData.categories.reduce(
                        (cats, cat) => {
                          if (cat !== item.category) cats[cat] = 0;
                          return cats;
                        },
                        {} as Record<string, number>,
                      ),
                    });
                  }
                  return acc;
                }, [])}
                margin={{ top: 20, right: 30, left: 30, bottom: 60 }}
                stackOffset="expand"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name === "date") return null;
                    return [`¥${value.toLocaleString()}`, name];
                  }}
                />
                <Legend />
                {themeRiverData.categories.map((category, index) => (
                  <Area
                    key={category}
                    type="monotone"
                    dataKey={category}
                    stackId="1"
                    stroke={getCategoryColor(category)}
                    fill={getCategoryColor(category)}
                    fillOpacity={0.8}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <h2 className="text-xl font-semibold text-gray-700 mb-6">决策心理</h2>

      {/* 消费象限 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            消费象限 (频次 vs 均价)
            <div className="ml-1 group relative">
              <span className="text-xs text-gray-400 cursor-help">ⓘ</span>
              <div className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-2 text-xs text-gray-700 bg-white rounded shadow-lg border border-gray-200 z-10">
                <p>
                  <strong>消费习惯分析：</strong>
                  <br />
                  - 右上：高频高价 (重点关注)
                  <br />
                  - 左上：低频高价 (大额支出)
                  <br />
                  - 右下：高频低价 (习惯性消费)
                  <br />- 左下：低频低价 (偶发消费)
                </p>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[600px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart
                margin={{ top: 20, right: 30, left: 30, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  dataKey="frequency"
                  name="消费频次"
                  label={{
                    value: "消费频次 (次)",
                    position: "bottom",
                    offset: 20,
                  }}
                />
                <YAxis
                  type="number"
                  dataKey="avgAmount"
                  name="平均金额"
                  label={{
                    value: "平均金额 (¥)",
                    angle: -90,
                    position: "left",
                    offset: 10,
                  }}
                />
                <ZAxis
                  type="number"
                  dataKey="totalAmount"
                  range={[100, 1000]}
                  name="总金额"
                />
                <Tooltip
                  formatter={(
                    value: number,
                    name: string,
                    props: { payload?: { name?: string } },
                  ) => {
                    const merchant = props?.payload?.name || "";
                    if (name === "平均金额")
                      return [
                        `¥${value.toLocaleString()}`,
                        `${merchant} - ${name}`,
                      ];
                    if (name === "总金额")
                      return [
                        `¥${value.toLocaleString()}`,
                        `${merchant} - ${name}`,
                      ];
                    return [value, name];
                  }}
                />
                <Legend />
                <ReferenceLine
                  x={
                    quadrantData.length > 0
                      ? Math.max(...quadrantData.map((d) => d.frequency)) / 2
                      : 0
                  }
                  stroke="#888"
                  label={{
                    value: "高频",
                    position: "top",
                    fill: "#666",
                  }}
                />
                <ReferenceLine
                  y={
                    quadrantData.length > 0
                      ? Math.max(...quadrantData.map((d) => d.avgAmount)) / 2
                      : 0
                  }
                  stroke="#888"
                  label={{
                    value: "高价",
                    position: "right",
                    fill: "#666",
                  }}
                />
                <Scatter
                  name="商家"
                  data={quadrantData}
                  fill="#8884d8"
                  fillOpacity={0.8}
                >
                  {quadrantData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getQuadrantColor(
                        entry.frequency,
                        entry.avgAmount,
                        quadrantData,
                      )}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <h2 className="text-xl font-semibold text-gray-700 mb-6">结构解析</h2>

      {/* 核心支出来源 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            核心支出来源 (帕累托图)
            <div className="ml-1 group relative">
              <span className="text-xs text-gray-400 cursor-help">ⓘ</span>
              <div className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-2 text-xs text-gray-700 bg-white rounded shadow-lg border border-gray-200 z-10">
                <p>
                  <strong>二八定律分析：</strong>
                  <br />
                  红线与 80%
                  刻度线交叉点左侧的分类，就是您需要重点控制的&quot;核心支出&quot;。
                </p>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={paretoData?.categories.map((category, i) => ({
                  category,
                  amount: paretoData?.values[i] || 0,
                  percentage: paretoData?.percentages[i] || 0,
                }))}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="category"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  yAxisId="left"
                  orientation="left"
                  stroke="#8884d8"
                  label={{
                    value: "金额 (¥)",
                    angle: -90,
                    position: "insideLeft",
                    offset: -10,
                  }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#82ca9d"
                  domain={[0, 100]}
                  label={{
                    value: "累积百分比 (%)",
                    angle: 90,
                    position: "insideRight",
                    offset: -10,
                  }}
                />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name === "金额")
                      return [`¥${value.toLocaleString()}`, name];
                    if (name === "累积百分比")
                      return [`${value.toFixed(2)}%`, name];
                    return [value, name];
                  }}
                />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="amount"
                  name="金额"
                  fill="#8884d8"
                  barSize={20}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="percentage"
                  name="累积百分比"
                  stroke="#82ca9d"
                  strokeWidth={2}
                  dot={false}
                />
                <ReferenceLine
                  yAxisId="right"
                  y={80}
                  stroke="red"
                  strokeDasharray="3 3"
                  label={{
                    value: "80%",
                    position: "right",
                    fill: "red",
                  }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* echarts 词云 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>消费热词云</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px]">
            <EchartsWordcloud
              data={wordCloudData}
              shape="circle"
              onWordClick={(params) => {
                console.log("Word clicked:", params);
                // You can add additional interaction logic here
              }}
            />
          </CardContent>
        </Card>

        {/* 消费分布云图 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>消费分布云图</CardTitle>
          </CardHeader>
          <CardContent>
            <ConsumptionDistributionChart
              data={boxPlotData || { categories: [], data: [], box_data: [] }}
              loading={!boxPlotData}
              onDataPointClick={(data) => {
                console.log("Data point clicked:", data);
                // Handle click event
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
