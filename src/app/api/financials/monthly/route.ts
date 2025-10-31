import { NextResponse } from 'next/server';
import { getLast12MonthsFinancials } from '@/lib/monthlyStats';

export async function GET() {
  try {
    const monthlyData = await getLast12MonthsFinancials();
    
    return NextResponse.json({
      success: true,
      data: monthlyData
    });
  } catch (error) {
    console.error('Error fetching monthly financial data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch monthly financial data' },
      { status: 500 }
    );
  }
}
