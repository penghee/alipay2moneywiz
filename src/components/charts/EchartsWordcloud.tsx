/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useMemo } from "react";
import * as echarts from "echarts";
import "echarts-wordcloud";
import type { ECharts, EChartsOption, ECElementEvent } from "echarts";
import { EchartComponent } from "./EchartComponent";

// Register the wordCloud extension
import "echarts-wordcloud/dist/echarts-wordcloud";
import "echarts-wordcloud/dist/echarts-wordcloud.min";

declare global {
  interface Window {
    echartsWordcloudRegistered?: boolean;
  }
}

export interface WordCloudDataItem {
  name: string;
  value: number;
  itemStyle?: {
    color?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface EchartsWordcloudProps {
  data: WordCloudDataItem[];
  width?: number | string;
  height?: number | string;
  className?: string;
  shape?:
    | "circle"
    | "cardioid"
    | "diamond"
    | "triangle-forward"
    | "triangle"
    | "pentagon"
    | "star";
  sizeRange?: [number, number];
  rotationRange?: [number, number];
  rotationStep?: number;
  gridSize?: number;
  drawOutOfBound?: boolean;
  textStyle?: Record<string, unknown>;
  onWordClick?: (params: { name: string; value: number }) => void;
}

export function EchartsWordcloud({
  data,
  width = "100%",
  height = "400px",
  className,
  shape = "circle",
  sizeRange = [12, 60],
  rotationRange = [-90, 90],
  rotationStep = 45,
  gridSize = 8,
  drawOutOfBound = false,
  textStyle = {
    fontFamily: "sans-serif",
    fontWeight: "bold",
    color: () => {
      return (
        "rgb(" +
        [
          Math.round(Math.random() * 160),
          Math.round(Math.random() * 160),
          Math.round(Math.random() * 160),
        ].join(",") +
        ")"
      );
    },
  },
  onWordClick,
}: EchartsWordcloudProps) {
  // Register wordcloud component if not registered
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      !(window as any).echartsWordcloudRegistered
    ) {
      // The wordcloud extension registers itself when imported
      (window as any).echartsWordcloudRegistered = true;
    }
  }, []);

  const option = useMemo<EChartsOption>(
    () => ({
      backgroundColor: "transparent",
      tooltip: {
        show: true,
        formatter: (params: any) => {
          return `${params.name}: ${params.value}`;
        },
      },
      series: [
        {
          type: "wordCloud",
          shape,
          left: "center",
          top: "center",
          width: "100%",
          height: "100%",
          right: null,
          bottom: null,
          sizeRange,
          rotationRange,
          rotationStep,
          gridSize,
          drawOutOfBound,
          textStyle: {
            ...textStyle,
          },
          emphasis: {
            focus: "self",
            textStyle: {
              textShadowBlur: 10,
              textShadowColor: "rgba(0, 0, 0, 0.5)",
            },
          },
          data,
        },
      ] as any,
    }),
    [
      data,
      shape,
      sizeRange,
      rotationRange,
      rotationStep,
      gridSize,
      drawOutOfBound,
      textStyle,
    ],
  );

  const handleChartReady = (chart: ECharts) => {
    if (onWordClick) {
      chart.on("click", (params: ECElementEvent) => {
        if (
          params.data &&
          typeof params.data === "object" &&
          "name" in params.data &&
          "value" in params.data
        ) {
          onWordClick({
            name: String(params.data.name),
            value: Number(params.data.value),
          });
        }
      });
    }
  };

  return (
    <EchartComponent
      option={option}
      style={{ width, height }}
      className={className}
      onChartReady={handleChartReady}
    />
  );
}

export default EchartsWordcloud;
