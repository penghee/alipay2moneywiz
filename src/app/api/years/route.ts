import { NextResponse } from 'next/server';
import { getAvailableYears } from '@/lib/data';

export const dynamic = 'force-dynamic'; // Prevent static generation

export async function GET() {
  try {
    console.log('Current working directory:', process.cwd());
    const years = getAvailableYears();
    console.log('Available years:', years);
    return NextResponse.json({ years });
  } catch (error) {
    console.error('Error in years API:', error);
    return NextResponse.json(
      { error: 'Failed to get available years', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
