import { NextResponse } from 'next/server';
import { loadAssets } from '@/lib/utils/assetUtils';
import { Asset } from '@/lib/types/asset';

interface SankeyNode {
  name: string;
}

interface SankeyLink {
  source: number;
  target: number;
  value: number;
}

interface SummaryResponse {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  investmentAssets: number;
  cashAssets: number; // New field for cash and cash equivalents
  creditCardDebt: number; // New field for credit card debt
  annualExpenses: number; // This will be used for financial freedom calculation
  sankeyData: {
    nodes: SankeyNode[];
    links: SankeyLink[];
  };
}

export async function GET(): Promise<NextResponse<SummaryResponse | { error: string }>> {
  try {
    // Load assets directly from the file
    const assets = loadAssets();
    // Calculate summary data
    // Calculate total assets and investment assets
    const totalAssets = assets
      .filter((asset: Asset) => asset.type !== '负债')
      .reduce((sum: number, asset: Asset) => sum + (Number(asset.amount) || 0), 0);
      
    const investmentAssets = assets
      .filter((asset: Asset) => asset.category === '投资')
      .reduce((sum: number, asset: Asset) => sum + (Number(asset.amount) || 0), 0);
      
    const totalLiabilities = assets
      .filter((asset: Asset) => asset.type === '负债')
      .reduce((sum: number, asset: Asset) => sum + (Number(asset.amount) || 0), 0);
      
    const netWorth = totalAssets - totalLiabilities;
    
    // Calculate cash assets (cash, 活期, 货基)
    const cashAssets = assets
      .filter((asset: Asset) => 
        asset.category?.toLowerCase().includes('活期')
      )
      .reduce((sum: number, asset: Asset) => sum + (Number(asset.amount) || 0), 0);
      
    // Calculate credit card debt
    const creditCardDebt = assets
      .filter((asset: Asset) => 
        asset.subcategory?.includes('信用卡')
      )
      .reduce((sum: number, asset: Asset) => sum + (Number(asset.amount) || 0), 0);
    
    // For demonstration, using a fixed annual expenses value
    // In a real app, this should come from user settings or expense tracking
    const annualExpenses = 240000; // Example: 20,000 per month * 12
    
    // Prepare Sankey data
    const categories = Array.from(new Set(assets
      .map((asset: Asset) => asset.category)
      .filter(Boolean) as string[]
    ));
    const nodes: SankeyNode[] = [
      { name: '总资产' },
      { name: '净资产' },
      { name: '总负债' },
      ...categories.map(category => ({ name: category })),
    ];
    
    const nodeMap = nodes.reduce<Record<string, number>>((acc, node, index) => {
      acc[node.name] = index;
      return acc;
    }, {});
        
    // Create links for assets to categories
    const assetLinks = assets
      .filter((asset: Asset) => asset.type !== '负债' && asset.category)
      .map((asset: Asset) => {
        const link = {
          source: nodeMap[asset.category],
          target: nodeMap['总资产'],
          value: Number(asset.amount) || 0,
        };
        console.log('Asset link:', link);
        return link;
      });
    
    // Create net worth and liability links
    const netWorthLink = {
      source: nodeMap['总资产'],
      target: nodeMap['净资产'],
      value: netWorth,
    };
    
    const liabilityLink = {
      source: nodeMap['总资产'],
      target: nodeMap['总负债'],
      value: totalLiabilities,
    };
    
    console.log('Net worth link:', netWorthLink);
    console.log('Liability link:', liabilityLink);
    
    const links: SankeyLink[] = [
      ...assetLinks,
      netWorthLink,
      liabilityLink,
    ].filter(link => link.value > 0); // Only include non-zero links
    
    return NextResponse.json({
      totalAssets,
      totalLiabilities,
      netWorth,
      investmentAssets,
      creditCardDebt,
      cashAssets,
      annualExpenses,
      sankeyData: {
        nodes: nodes.map(node => ({ name: node.name })),
        links,
      },
    });
    
  } catch (error) {
    console.error('Error generating summary:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
}
