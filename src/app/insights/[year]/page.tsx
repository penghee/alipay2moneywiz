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

  // Mock data - replace with real data from your API
  const spendingByCategory = [
    { name: "百货", value: 40000 },
    { name: "住房", value: 30000 },
    { name: "餐饮", value: 20000 },
    { name: "交通", value: 18000 },
    { name: "医疗", value: 10000 },
    { name: "其他", value: 5000 },
  ];

  const monthlyTrend = [
    { name: "1月", 百货: 4000, 餐饮: 2400, 交通: 2400 },
    { name: "2月", 百货: 3000, 餐饮: 1398, 交通: 2210 },
    { name: "3月", 百货: 2000, 餐饮: 9800, 交通: 2290 },
    { name: "4月", 百货: 2780, 餐饮: 3908, 交通: 2000 },
    { name: "5月", 百货: 1890, 餐饮: 4800, 交通: 2181 },
    { name: "6月", 百货: 2390, 餐饮: 3800, 交通: 2500 },
  ];

  const paymentMethods = [
    { name: "微信支付", value: 45 },
    { name: "支付宝", value: 35 },
    { name: "银行卡", value: 15 },
    { name: "现金", value: 5 },
  ];

  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884d8",
    "#82ca9d",
  ];

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">消费洞察 {year}</h1>

      {/* 资金流向全景 */}
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
              <SankeyChart data={sankeyData} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                暂无数据
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* 最常光顾 */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>最常光顾</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-2 max-h-[300px] overflow-y-auto p-4">
              {topMerchants?.map((item, i) => (
                <div
                  key={i}
                  className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="font-medium truncate">{item.name}</div>
                  {/* <div className="text-sm text-gray-500 dark:text-gray-400">最近消费: {item.date}</div> */}
                  <div className="flex justify-between text-sm mt-1">
                    <span>消费金额: ¥{item.totalAmount}</span>
                    <span>消费次数: {item.transactionCount}次</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 消费场景 */}
        <Card className="mb-6">
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* 消费习惯 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>消费习惯</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

                  <div className="p-4 border rounded-lg text-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="text-2xl font-bold text-primary">
                      {spendingHabits.lateNightRatio}%
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      深夜消费占比
                    </div>
                  </div>

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

      {/* 消费热词云 - Using Treemap as an alternative */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>消费热词云</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <Treemap
                data={wordCloudData}
                dataKey="value"
                aspectRatio={4 / 3}
                stroke="#fff"
                fill="#8884d8"
                animationDuration={1000}
                content={
                  <CustomContent
                    colors={COLOR_PALETTE}
                    x={0}
                    y={0}
                    width={0}
                    height={0}
                    index={0}
                    name={""}
                  />
                }
              >
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `¥${value.toLocaleString()}`,
                    name,
                  ]}
                />
              </Treemap>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
