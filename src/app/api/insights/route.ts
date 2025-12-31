// src/app/api/insights/capital-flow/route.ts
import { NextResponse } from "next/server";
import {
  generateSankeyData,
  generateTopMerchants,
  generateParetoData,
  generateQuadrantData,
  generateThemeRiverData,
  analyzeSpendingScenarios,
  analyzeSpendingHabits,
  generateFunnelData,
  generateWordCloudData,
  generateBoxPlotData,
} from "@/lib/insights";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year =
      searchParams.get("year") || new Date().getFullYear().toString();
    const ownerId = searchParams.get("ownerId") || undefined;

    // Generate Sankey data
    const sankeyData = await generateSankeyData({
      year: Number(year),
      ownerId,
    });

    // Generate Top merchant
    const topMerchants = await generateTopMerchants({
      year: Number(year),
      ownerId,
    });

    // Generate Pareto data
    const paretoData = await generateParetoData({
      year: Number(year),
      ownerId,
    });

    const quadrantData = await generateQuadrantData({
      year: Number(year),
      ownerId,
    });

    const themeRiverData = await generateThemeRiverData({
      year: Number(year),
      ownerId,
    });

    const spendingScenarios = await analyzeSpendingScenarios({
      year: Number(year),
      ownerId,
    });

    const spendingHabits = await analyzeSpendingHabits({
      year: Number(year),
      ownerId,
    });

    const funnelData = await generateFunnelData({
      year: Number(year),
      ownerId,
    });

    const wordCloudData = await generateWordCloudData({
      year: Number(year),
      ownerId,
    });

    const boxPlotData = await generateBoxPlotData({
      year: Number(year),
      ownerId,
    });

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error("Error in capital-flow API:", error);
    return NextResponse.json(
      { error: "Failed to generate capital flow data" },
      { status: 500 },
    );
  }
}
