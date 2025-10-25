import { NextResponse } from 'next/server';
import { calculateYearlyStats } from '@/lib/data';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ year: string }> }
) {
  try {
    const { year: yearStr } = await params;
    const year = parseInt(yearStr);
    if (isNaN(year)) {
      return NextResponse.json(
        { error: 'Invalid year parameter' },
        { status: 400 }
      );
    }

    const stats = calculateYearlyStats(year);
    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to calculate yearly stats' },
      { status: 500 }
    );
  }
}
