import { NextResponse } from 'next/server';
import { getAvailableMonths } from '@/lib/data';
export const dynamic = 'force-dynamic'; // Prevent static generation

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

    const months = getAvailableMonths(year);
    return NextResponse.json({ months });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get available months' },
      { status: 500 }
    );
  }
}
