import fs from 'fs';
import path from 'path';
import { Asset, ASSET_TYPES } from '@/lib/types/asset';
import { ASSETS_PATH } from '@/config/paths';

export function loadAssets(): Asset[] {
  if (!fs.existsSync(ASSETS_PATH)) {
    console.error('Assets file not found at:', ASSETS_PATH);
    return [];
  }

  try {
    const csvData = fs.readFileSync(ASSETS_PATH, 'utf-8');
    // Split lines and remove empty lines
    const lines = csvData.split(/\r?\n/).map(line => line.trim()).filter(line => line);
    if (lines.length <= 1) return [];

    // Process headers
    const headers = lines[0].split(',').map(h => h.trim());
    const headerMap: Record<string, string> = {
      '资产/负债': 'type',
      '日期': 'date',
      '大类': 'category',
      '子类': 'subcategory',
      '名称': 'name',
      '账户/说明': 'account',
      '金额': 'amount',
      '利率%': 'rate',
      '备注': 'note',
      '资产对象': 'owner'
    };

    // Process data lines
    return lines.slice(1).flatMap((line, index) => {
      if (!line.trim()) return [];
      
      // Improved CSV parsing that handles Chinese characters and commas
      const values: string[] = [];
      let inQuotes = false;
      let currentValue = '';
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(currentValue.trim());
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      // Add the last value
      values.push(currentValue.trim());
      
      if (values.length !== headers.length) {
        console.warn(`Skipping malformed line ${index + 2}:`, line);
        console.warn('Expected', headers.length, 'columns but got', values.length);
        console.warn('Values:', values);
        return [];
      }

      const entry: Record<string, string> = {};
      headers.forEach((header, i) => {
        const key = headerMap[header as keyof typeof headerMap] || header;
        entry[key] = (values[i] || '').replace(/^"|"$/g, '').trim();
      });

      // Clean and parse amount
      const cleanAmount = (entry.amount || '').replace(/[^0-9.-]+/g, '');
      const amount = parseFloat(cleanAmount) || 0;
      
      if (isNaN(amount)) {
        console.warn(`Invalid amount in line ${index + 2}:`, entry.amount);
        return [];
      }

      // Use Chinese type directly
      const assetType = entry.type as '活期' | '投资' | '固定资产' | '应收' | '负债';
      
      return [{
        id: `asset-${Date.now()}-${index}`,
        type: assetType,
        typeDisplay: entry.type,
        category: entry.category,
        subcategory: entry.subcategory,
        name: entry.name,
        account: entry.account,
        amount,
        rate: entry.rate ? parseFloat(entry.rate) : undefined,
        note: entry.note,
        owner: entry.owner,
        date: entry.date || new Date().toISOString().split('T')[0],
      }];
    });
  } catch (error) {
    console.error('Error loading assets:', error);
    return [];
  }
}

export function saveAssets(assets: Asset[]): void {
  const csvHeaders = [
    '资产/负债', '日期', '大类', '子类', '名称', 
    '账户/说明', '金额', '利率%', '备注', '资产对象'
  ];

  if (!fs.existsSync(ASSETS_PATH)) {
    // Ensure directory exists
    const dir = path.dirname(ASSETS_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  if (assets.length === 0) {
    // Write just the headers if no assets
    fs.writeFileSync(ASSETS_PATH, csvHeaders.join(',') + '\n', 'utf-8');
    return;
  }

  const rows = assets.map(asset => {
    // Map asset properties to CSV columns in the correct order
    const row = [
      asset.type, // Now using Chinese type directly
      asset.date,
      asset.category,
      asset.subcategory,
      asset.name,
      asset.account,
      asset.amount,
      asset.rate ?? '',
      asset.note ?? '',
      asset.owner
    ];

    // Format the row with proper CSV escaping
    return row.map(value => {
      const strValue = String(value);
      // Quote values that contain commas, quotes, or newlines
      if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
        return `"${strValue.replace(/"/g, '""')}"`;
      }
      return strValue;
    }).join(',');
  });

  // Combine headers and rows
  const csvContent = [csvHeaders.join(','), ...rows].join('\n');
  fs.writeFileSync(ASSETS_PATH, csvContent, 'utf-8');
}
