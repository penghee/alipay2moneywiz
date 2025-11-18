import { NextResponse } from "next/server";
import { findLatestSalary } from "@/lib/data";

export async function GET() {
  try {
    const latestSalary = findLatestSalary();

    if (!latestSalary) {
      return NextResponse.json(
        {
          success: false,
          error: "No salary records found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      amount: latestSalary.amount,
      date: latestSalary.date,
      category: latestSalary.category,
    });
  } catch (error) {
    console.error("Error fetching latest income:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch latest income" },
      { status: 500 },
    );
  }
}
