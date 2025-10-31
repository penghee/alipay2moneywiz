import { NextResponse } from 'next/server';
import { AssetSummary } from '@/lib/types/asset';
import { loadAssets } from '@/lib/utils/assetUtils';

export async function GET() {
  try {
    const assets = await loadAssets();
    const summary: AssetSummary = {
      totalAssets: 0,
      totalLiabilities: 0,
      netWorth: 0,
      byCategory: {},
      byOwner: {},
    };

    // Process each asset
    assets.forEach(asset => {
      const amount = asset.amount || 0;
      
      // Update category summary
      const categoryKey = `${asset.type}.${asset.category}`;
      if (!summary.byCategory[categoryKey]) {
        summary.byCategory[categoryKey] = { amount: 0, percentage: 0 };
      }
      summary.byCategory[categoryKey].amount += amount;

      // Update owner summary
      if (!summary.byOwner[asset.ownerId]) {
        summary.byOwner[asset.ownerId] = { assets: 0, liabilities: 0, netWorth: 0 };
      }
      
      if (asset.type === 'liability') {
        summary.byOwner[asset.ownerId].liabilities += amount;
        summary.totalLiabilities += amount;
      } else {
        summary.byOwner[asset.ownerId].assets += amount;
        summary.totalAssets += amount;
      }
      
      summary.byOwner[asset.ownerId].netWorth = 
        summary.byOwner[asset.ownerId].assets - summary.byOwner[asset.ownerId].liabilities;
    });

    // Calculate percentages
    Object.keys(summary.byCategory).forEach(key => {
      const total = summary.byCategory[key].amount >= 0 
        ? summary.totalAssets 
        : Math.abs(summary.totalLiabilities);
      summary.byCategory[key].percentage = total > 0 
        ? (Math.abs(summary.byCategory[key].amount) / total) * 100 
        : 0;
    });

    summary.netWorth = summary.totalAssets - summary.totalLiabilities;
    
    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error calculating asset summary:', error);
    return NextResponse.json(
      { error: 'Failed to calculate asset summary' },
      { status: 500 }
    );
  }
}
