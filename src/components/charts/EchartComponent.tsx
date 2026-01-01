"use client";

import React, { useEffect, useRef, CSSProperties } from "react";
import * as echarts from "echarts";
import type { ECharts, EChartsOption } from "echarts";
import { useTheme } from "next-themes";

type EchartComponentProps = {
  option: EChartsOption;
  style?: CSSProperties;
  className?: string;
  onChartReady?: (chart: ECharts) => void;
};

export function EchartComponent({
  option,
  style = { width: "100%", height: "400px" },
  className,
  onChartReady,
}: EchartComponentProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<ECharts | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (!chartRef.current) return;

    // Initialize chart
    chartInstance.current = echarts.init(chartRef.current);
    if (onChartReady) {
      onChartReady(chartInstance.current);
    }

    // Set chart theme based on next-theme
    if (theme === "dark") {
      chartInstance.current.setOption({
        backgroundColor: "transparent",
      });
    }

    // Handle window resize
    const handleResize = () => {
      chartInstance.current?.resize();
    };
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      chartInstance.current?.dispose();
    };
  }, [onChartReady, theme]);

  // Update chart when option changes
  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.setOption(option, true);
    }
  }, [option]);

  return <div ref={chartRef} style={style} className={className} />;
}

export default EchartComponent;
