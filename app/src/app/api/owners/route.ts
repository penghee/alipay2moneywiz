import { NextResponse } from 'next/server';
import fs from 'fs';
import { DATA_PATHS } from '@/config/paths';

interface Owner {
  id: string;
  name: string;
  displayName: string;
}

export async function GET() {
  try {
    const ownersPath = DATA_PATHS.billOwners();
    
    // Check if file exists
    if (!fs.existsSync(ownersPath)) {
      // Return default owners if file doesn't exist
      const defaultOwners: Owner[] = [
        { id: 'father', name: 'father', displayName: '父亲' },
        { id: 'mother', name: 'mother', displayName: '母亲' },
      ];
      
      // Save default owners to file
      fs.writeFileSync(
        ownersPath, 
        JSON.stringify({ owners: defaultOwners }, null, 2),
        'utf-8'
      );
      
      return NextResponse.json({ owners: defaultOwners });
    }
    
    // Read existing owners and add display names if missing
    const ownersData: { owners: Owner[] } = JSON.parse(fs.readFileSync(ownersPath, 'utf-8'));
    return NextResponse.json(ownersData);
  } catch (error) {
    console.error('Error loading owners:', error);
    return NextResponse.json(
      { error: 'Failed to load owners' },
      { status: 500 }
    );
  }
}
