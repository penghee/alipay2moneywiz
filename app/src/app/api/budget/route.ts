import { NextResponse } from 'next/server';
import { getYearlyBudget, setYearlyBudget } from '@/lib/budget';

export const dynamic = 'force-dynamic'; // Prevent static generation

type RequestBody = {
  year: string | number;
  total?: number;
  categories?: Record<string, number>;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    
    if (!year) {
      return NextResponse.json(
        { error: 'Year parameter is required' },
        { status: 400 }
      );
    }
    
    const budget = await getYearlyBudget(year);
    return NextResponse.json(budget);
  } catch (error) {
    console.error('Error fetching budget:', error);
    return NextResponse.json(
      { error: 'Failed to fetch budget' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { year, total, categories } = await request.json() as RequestBody;
    
    if (!year) {
      return NextResponse.json(
        { error: 'Year is required' },
        { status: 400 }
      );
    }
    
    await setYearlyBudget(year, total, categories);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving budget:', error);
    return NextResponse.json(
      { error: 'Failed to save budget' },
      { status: 500 }
    );
  }
}
