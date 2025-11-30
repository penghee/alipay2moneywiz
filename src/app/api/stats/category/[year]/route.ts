import { NextResponse } from "next/server";
import { calculateCategoryYearlyStats } from "@/lib/data";
import { URL } from "url";

export const dynamic = "force-dynamic"; // Prevent static generation

export async function GET(
  request: Request,
  { params }: { params: Promise<{ year: string }> },
) {
  try {
    const { year: yearStr } = await params;
    const year = parseInt(yearStr);
    if (isNaN(year)) {
      return NextResponse.json(
        { error: "Invalid year parameter" },
        { status: 400 },
      );
    }

    // Get owner from query parameters
    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get("owner") || "all";
    // filterUnexpected is not 0 or undefined
    const filterUnexpectedParam = searchParams.get("filterUnexpected");
    const filterUnexpected = Boolean(
      filterUnexpectedParam && filterUnexpectedParam !== "0",
    );

    const stats = calculateCategoryYearlyStats(
      year,
      ownerId !== "all" ? ownerId : undefined,
      filterUnexpected,
    );
    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to calculate category stats",
      },
      { status: 500 },
    );
  }
}
