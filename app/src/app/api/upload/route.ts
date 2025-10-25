import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import iconv from 'iconv-lite';

// 读取映射文件
function loadMaps() {
  const accountMapPath = path.join(process.cwd(), '..', 'account_map.json');
  const categoryMapPath = path.join(process.cwd(), '..', 'category_map.json');
  
  const accountMap = JSON.parse(readFileSync(accountMapPath, 'utf8'));
  const categoryMap = JSON.parse(readFileSync(categoryMapPath, 'utf8'));
  
  return { accountMap, categoryMap };
}

// 解析日期
function parseDate(dateStr: string): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 映射账户
function mapAccount(recordStr: string, accountMap: Record<string, string>): string {
  if (!recordStr || typeof recordStr !== 'string') {
    return '未知账户';
  }
  for (const key in accountMap) {
    if (recordStr.includes(key)) {
      return accountMap[key];
    }
  }
  return '未知账户';
}

// 映射分类
function mapCategory(
  transactionType: string,
  product: string,
  counterparty: string,
  categoryMap: Record<string, string[]>
): string {
  const safeTransactionType = transactionType || '';
  const safeProduct = product || '';
  const safeCounterparty = counterparty || '';
  const searchText = `${safeTransactionType} ${safeProduct} ${safeCounterparty}`.toLowerCase();
  
  for (const category in categoryMap) {
    const keywords = categoryMap[category];
    for (const keyword of keywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        return category;
      }
    }
  }
  return '其他';
}

// 处理支付宝账单
function processAlipay(content: string, accountMap: Record<string, string>, categoryMap: Record<string, string[]>) {
  // 支付宝 CSV 文件前面有元数据，需要提取真实的交易数据
  const lines = content.split('\n');
  let realContent = '';
  let belowAreRealContent = false;
  
  for (let line of lines) {
    if (line.startsWith('--')) {
      belowAreRealContent = line.includes('支付宝');
    } else if (belowAreRealContent) {
      // 移除行尾的逗号
      if (line.endsWith(',')) {
        line = line.substring(0, line.length - 1);
      }
      realContent += line + '\n';
    }
  }
  
  const records = parse(realContent, {
    delimiter: ',',
    columns: true,
    trim: true,
    relax_column_count: true,
    skip_empty_lines: true,
  }) as Record<string, string>[];

  const transactions: Record<string, string>[] = [];
  for (const record of records) {
    const transaction: Record<string, string> = {};
    transaction['日期'] = parseDate(record['交易时间'] || '');
    transaction['描述'] = record['商品说明'] || '';
    transaction['账户'] = mapAccount(record['收/付款方式'] || '', accountMap);
    
    if (record['收/支'] === '收入' || record['收/支'] === '支出') {
      transaction['交易对方'] = '';
      transaction['分类'] = mapCategory(
        record['交易分类'] || '',
        record['商品说明'] || '',
        record['交易对方'] || '',
        categoryMap
      );
      transaction['转账'] = '';
      if (record['收/支'] === '支出') {
        const fee = -Math.abs(parseFloat(record['金额'] || '0'));
        transaction['金额'] = fee.toString();
      } else if (record['收/支'] === '收入') {
        transaction['金额'] = record['金额'] || '0';
      }
    } else {
      transaction['交易对方'] = '';
      transaction['分类'] = mapCategory(
        record['交易分类'] || '',
        record['商品说明'] || '',
        record['交易对方'] || '',
        categoryMap
      );
      transaction['转账'] = mapAccount(record['交易对方'] || '', accountMap);
      if ((record['商品说明'] || '').includes('还款')) {
        const fee = -Math.abs(parseFloat(record['金额'] || '0'));
        transaction['金额'] = fee.toString();
      } else {
        transaction['金额'] = record['金额'] || '0';
      }
    }
    transaction['标签'] = '';
    transaction['备注'] = '';
    transactions.push(transaction);
  }

  return transactions;
}

// 处理微信账单
function processWechat(content: Buffer, accountMap: Record<string, string>, categoryMap: Record<string, string[]>) {
  const workbook = XLSX.read(content, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  // 找到表头行
  let headerIndex = -1;
  for (let i = 0; i < jsonData.length; i++) {
    const row = jsonData[i] as any[];
    if (row && row.length > 0 && row.includes('交易时间')) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    throw new Error('无法找到数据表头，请检查xlsx文件格式');
  }

  const headers = jsonData[headerIndex] as string[];
  const dataRows = jsonData
    .slice(headerIndex + 1)
    .filter((row: any) => row && row.length > 0);

  const records = dataRows.map((row: any) => {
    const record: Record<string, string> = {};
    headers.forEach((header: string, index: number) => {
      record[header] = (row[index] || '').toString();
    });
    return record;
  });

  const transactions: Record<string, string>[] = [];
  for (const record of records) {
    const transaction: Record<string, string> = {};
    transaction['日期'] = parseDate(record['交易时间'] || '');
    transaction['描述'] = record['商品'] || '';
    transaction['账户'] = mapAccount(record['支付方式'] || '', accountMap);
    
    if (record['收/支'] === '收入' || record['收/支'] === '支出') {
      transaction['交易对方'] = '';
      transaction['分类'] = mapCategory(
        record['交易类型'] || '',
        record['商品'] || '',
        record['交易对方'] || '',
        categoryMap
      );
      transaction['转账'] = '';
      if (record['收/支'] === '支出') {
        const fee = -Math.abs(parseFloat((record['金额(元)'] || '0').replace('¥', '')));
        transaction['金额'] = fee.toString();
      } else if (record['收/支'] === '收入') {
        transaction['金额'] = (record['金额(元)'] || '0').replace('¥', '');
      }
    } else {
      transaction['交易对方'] = '';
      transaction['分类'] = mapCategory(
        record['交易类型'] || '',
        record['商品'] || '',
        record['交易对方'] || '',
        categoryMap
      );
      transaction['转账'] = mapAccount(record['交易对方'] || '', accountMap);
      transaction['金额'] = (record['金额(元)'] || '0').replace('¥', '');
    }
    transaction['标签'] = '';
    transaction['备注'] = '';
    transactions.push(transaction);
  }

  return transactions;
}

// 保存数据
function saveData(transactions: Record<string, string>[], year: number, month: number, platform: string) {
  const dataDir = path.join(process.cwd(), '..', 'data', year.toString());
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }

  const outputPath = path.join(dataDir, `${String(month).padStart(2, '0')}_${platform}.csv`);
  
  const output = stringify(transactions, {
    header: true,
    columns: ['账户', '转账', '描述', '交易对方', '分类', '日期', '备注', '标签', '金额'],
  });

  writeFileSync(outputPath, output);

  // 合并到月份文件
  const monthPath = path.join(dataDir, `${String(month).padStart(2, '0')}.csv`);
  if (!existsSync(monthPath)) {
    writeFileSync(monthPath, output);
  } else {
    const monthContent = readFileSync(monthPath, 'utf8');
    const monthTransactions = parse(monthContent, {
      delimiter: ',',
      columns: true,
      trim: true,
      relax_column_count: true,
      skip_empty_lines: true,
    });
    monthTransactions.push(...transactions);
    const monthOutput = stringify(monthTransactions, {
      header: true,
      columns: ['账户', '转账', '描述', '交易对方', '分类', '日期', '备注', '标签', '金额'],
    });
    writeFileSync(monthPath, monthOutput);
  }

  return outputPath;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const platform = formData.get('platform') as string;

    console.log('Upload request received:', { 
      fileName: file?.name, 
      fileSize: file?.size, 
      platform 
    });

    if (!file || !platform) {
      return NextResponse.json(
        { error: '缺少文件或平台参数' },
        { status: 400 }
      );
    }

    if (!['alipay', 'wechat'].includes(platform)) {
      return NextResponse.json(
        { error: '不支持的平台' },
        { status: 400 }
      );
    }

    // 加载映射文件
    const { accountMap, categoryMap } = loadMaps();

    let transactions: Record<string, string>[] = [];

    if (platform === 'alipay') {
      // 处理支付宝 CSV 文件
      console.log('Processing Alipay CSV file...');
      const content = await file.text();
      console.log('File content length:', content.length);
      transactions = processAlipay(content, accountMap, categoryMap);
      console.log('Processed transactions:', transactions.length);
    } else if (platform === 'wechat') {
      // 处理微信 XLSX 文件
      console.log('Processing Wechat XLSX file...');
      const buffer = Buffer.from(await file.arrayBuffer());
      console.log('File buffer length:', buffer.length);
      transactions = processWechat(buffer, accountMap, categoryMap);
      console.log('Processed transactions:', transactions.length);
    }

    if (transactions.length === 0) {
      return NextResponse.json(
        { error: '未找到有效的交易记录' },
        { status: 400 }
      );
    }

    // 从第一条记录获取年月信息
    const firstDate = new Date(transactions[0]['日期']);
    const year = firstDate.getFullYear();
    const month = firstDate.getMonth() + 1;

    // 保存数据
    const outputPath = saveData(transactions, year, month, platform);

    return NextResponse.json({
      success: true,
      message: `成功导入 ${transactions.length} 条记录`,
      records: transactions.length,
      year,
      month,
      outputPath,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '处理文件时出错' },
      { status: 500 }
    );
  }
}
