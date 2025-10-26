import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import { DATA_PATHS } from '@/config/paths';

// Helper function to read the category map file
async function readCategoryMap() {
  try {
    const fileContent = await fs.readFile(DATA_PATHS.maps.category(), 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    // If file doesn't exist or is invalid, return empty object
    return {};
  }
}

export async function GET() {
  try {
    const categoryMap = await readCategoryMap();
    return NextResponse.json(categoryMap);
  } catch (error) {
    console.error('Error reading category map:', error);
    return NextResponse.json(
      { error: 'Failed to load category map' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const updates = await request.json();
    
    // Validate the updates object
    if (typeof updates !== 'object' || updates === null) {
      return NextResponse.json(
        { error: 'Invalid update format' },
        { status: 400 }
      );
    }

    // Read current category map
    const categoryMap = await readCategoryMap();
    
    // Apply updates to the category map
    for (const [action, data] of Object.entries(updates)) {
      switch (action) {
        case 'addCategory':
          if (data.name && !categoryMap[data.name]) {
            categoryMap[data.name] = [];
          }
          break;
          
        case 'deleteCategory':
          if (data.name && categoryMap[data.name]) {
            delete categoryMap[data.name];
          }
          break;
          
        case 'addTag':
          if (data.category && data.tag && Array.isArray(categoryMap[data.category])) {
            if (!categoryMap[data.category].includes(data.tag)) {
              categoryMap[data.category].push(data.tag);
            }
          }
          break;
          
        case 'deleteTag':
          if (data.category && Array.isArray(categoryMap[data.category])) {
            categoryMap[data.category] = categoryMap[data.category].filter(
              (tag: string) => tag !== data.tag
            );
          }
          break;
      }
    }

    // Write the updated category map back to the file
    await fs.writeFile(
      DATA_PATHS.maps.category(),
      JSON.stringify(categoryMap, null, 2),
      'utf-8'
    );

    return NextResponse.json({ success: true, data: categoryMap });
  } catch (error) {
    console.error('Error updating category map:', error);
    return NextResponse.json(
      { error: 'Failed to update category map', details: error },
      { status: 500 }
    );
  }
}
