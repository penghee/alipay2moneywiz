/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useMemo } from "react";
import type { EChartsOption } from "echarts";
import EchartComponent from "./EchartComponent";

interface TransactionPoint {
  c: number; // category index
  v: number; // value
  m: string; // merchant
  d: string; // date
}

interface BoxPlotData {
  categories: string[];
  data: TransactionPoint[];
  box_data: number[][];
}

interface ConsumptionDistributionChartProps {
  data: BoxPlotData;
  loading?: boolean;
  onDataPointClick?: (params: any) => void;
}

const ConsumptionDistributionChart: React.FC<
  ConsumptionDistributionChartProps
> = ({ data, loading = false, onDataPointClick }) => {
  const option = useMemo<any>(() => {
    if (!data || !data.data || data.data.length === 0) {
      return {};
    }

    // Align categories and box data
    const alignedCategories = ["", ...data.categories];
    const alignedBoxData = [[], ...data.box_data];

    // Generate scatter plot data
    const scatterData = data.data.map((item) => {
      // eslint-disable-next-line react-hooks/purity
      const jitter = (Math.random() - 0.5) * 0.6; // Reduced jitter for better visualization
      return {
        value: [item.c + 1 + jitter, item.v],
        merchant: item.m,
        date: item.d,
        categoryName: data.categories[item.c],
      };
    });

    return {
      tooltip: {
        trigger: "item",
        formatter: (params: any) => {
          if (params.seriesType === "boxplot") {
            const [min, q1, median, q3, max] = params.data;
            return `
              <strong>${params.name}</strong><br/>
              最大值: ¥${max.toFixed(2)}<br/>
              Q3: ¥${q3.toFixed(2)}<br/>
              中位数: ¥${median.toFixed(2)}<br/>
              Q1: ¥${q1.toFixed(2)}<br/>
              最小值: ¥${min.toFixed(2)}
            `;
          } else {
            const d = params.data;
            return `
              <strong>${d.categoryName}</strong><br/>
              ${d.date}<br/>
              ${d.merchant}<br/>
              <strong>¥${d.value[1].toFixed(2)}</strong>
            `;
          }
        },
      },
      grid: {
        left: "10%",
        right: "10%",
        bottom: "15%",
      },
      xAxis: [
        {
          type: "category",
          data: alignedCategories,
          boundaryGap: true,
          axisLabel: {
            interval: 0,
            rotate: 0,
            formatter: (value: string) => {
              return value.length > 4 ? value.substring(0, 4) + ".." : value;
            },
          },
          splitLine: {
            show: true,
            lineStyle: {
              type: "dashed",
            },
          },
          axisTick: {
            alignWithLabel: true,
          },
        },
        {
          type: "value",
          min: -0.5,
          max: alignedCategories.length - 0.5,
          show: false,
        },
      ],
      yAxis: {
        type: "log",
        logBase: 10,
        min: 1,
        name: "金额 (元)",
        splitLine: {
          show: true,
          lineStyle: {
            color: "#eee",
          },
        },
        axisLabel: {
          formatter: (value: number) => {
            return value >= 1000 ? value / 1000 + "k" : value.toString();
          },
        },
      },
      series: [
        {
          name: "summary",
          type: "boxplot",
          xAxisIndex: 0,
          data: alignedBoxData,
          boxWidth: "50%",
          itemStyle: {
            color: "rgba(0, 0, 0, 0.02)",
            borderColor: "#666",
            borderWidth: 1.5,
          },
          symbolSize: 0,
          z: 10,
          emphasis: {
            itemStyle: {
              color: "rgba(0, 0, 0, 0.1)",
              borderWidth: 2,
            },
          },
        },
        {
          name: "transaction",
          type: "scatter",
          xAxisIndex: 1,
          symbolSize: 6,
          itemStyle: {
            color: (params: any) => {
              // You can implement getCategoryColor or use a color scheme
              const colors = [
                "#5470c6",
                "#91cc75",
                "#fac858",
                "#ee6666",
                "#73c0de",
                "#3ba272",
                "#fc8452",
                "#9a60b4",
              ];
              return colors[params.dataIndex % colors.length];
            },
            opacity: 0.6,
            shadowBlur: 2,
            shadowColor: "rgba(0, 0, 0, 0.2)",
          },
          data: scatterData,
          z: 1,
        },
      ],
    };
  }, [data]);

  if (!data || !data.data || data.data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        暂无数据
      </div>
    );
  }

  return (
    <EchartComponent
      option={option}
      style={{ width: "100%", height: "500px" }}
      onChartReady={(chart) => {
        if (onDataPointClick) {
          chart.on("click", "series.scatter", (params: any) => {
            onDataPointClick(params.data);
          });
        }
      }}
    />
  );
};

export default ConsumptionDistributionChart;
