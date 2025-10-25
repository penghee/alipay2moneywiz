import { NextResponse } from 'next/server';
import { calculateMonthlyStats } from '@/lib/data';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ year: string; month: string }> }
) {
  try {
    const { year: yearStr, month: monthStr } = await params;
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);
    
    if (isNaN(year) || isNaN(month)) {
      return NextResponse.json(
        { error: 'Invalid year or month parameter' },
        { status: 400 }
      );
    }

    const stats = calculateMonthlyStats(year, month);
    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to calculate monthly stats' },
      { status: 500 }
    );
  }
}
