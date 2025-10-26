import { NextResponse } from 'next/server';
import { getBudgetProgress as getBudgetProgressFromDB } from '@/lib/budget';
export const dynamic = 'force-dynamic'; // Ensure this route is server-side rendered

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    
    if (!year) {
      return NextResponse.json(
        { error: 'Year parameter is required' },
        { status: 400 }
      );
    }
    
    const yearNum = parseInt(year);
    const monthNum = month ? parseInt(month) : undefined;
    
    if (isNaN(yearNum) || (month && isNaN(monthNum!))) {
      return NextResponse.json(
        { error: 'Invalid year or month parameter' },
        { status: 400 }
      );
    }
    
    const progress = await getBudgetProgressFromDB(yearNum, monthNum);
    return NextResponse.json(progress);
  } catch (error) {
    console.error('Error fetching budget progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch budget progress' },
      { status: 500 }
    );
  }
}

