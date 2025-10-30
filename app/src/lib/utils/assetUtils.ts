import fs from 'fs';
import path from 'path';
import { Asset } from '@/lib/types/asset';
import { ASSETS_PATH } from '@/config/paths';

export function loadAssets(): Asset[] {
  if (!fs.existsSync(ASSETS_PATH)) {
    console.error('Assets file not found at:', ASSETS_PATH);
    return [];
  }

  try {
    const csvData = fs.readFileSync(ASSETS_PATH, 'utf-8');
    const lines = csvData.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length <= 1) return [];

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
      '资产对象': 'ownerId'
    };

    return lines.slice(1).flatMap((line, index) => {
      if (!line.trim()) return [];
      
      const values = line.match(/(?:[^,"]|"[^"]*")+/g)?.map(v => v.replace(/^"|"$/g, '').trim()) || [];
      if (values.length !== headers.length) {
        console.warn(`Skipping malformed line ${index + 2}:`, line);
        return [];
      }

      const entry: Record<string, string> = {};
      headers.forEach((header, i) => {
        const key = headerMap[header as keyof typeof headerMap] || header;
        entry[key] = values[i] || '';
      });

      const cleanAmount = entry.amount.replace(/,/g, '');
      const amount = parseFloat(cleanAmount) || 0;
      
      if (isNaN(amount)) {
        console.warn(`Invalid amount in line ${index + 2}:`, entry.amount);
        return [];
      }

      return [{
        id: `asset-${index}`,
        type: entry.type === '负债' ? 'liability' : 'cash',
        category: entry.category,
        subcategory: entry.subcategory,
        name: entry.name,
        account: entry.account,
        amount: amount,
        rate: entry.rate ? parseFloat(entry.rate) : undefined,
        note: entry.note,
        ownerId: entry.ownerId,
        date: entry.date
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
      asset.type === 'liability' ? '负债' : '资产',
      asset.date,
      asset.category,
      asset.subcategory,
      asset.name,
      asset.account,
      asset.amount,
      asset.rate ?? '',
      asset.note ?? '',
      asset.ownerId
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
