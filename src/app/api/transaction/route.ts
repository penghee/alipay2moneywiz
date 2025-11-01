import { NextResponse } from 'next/server';
import * as fs from 'fs/promises';
import * as path from 'path';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { getDataDirectory } from '@/config/paths';
import billOwners from '@/config/bill_owners.json';

// 确保目录存在
async function ensureDirectoryExists(directory: string) {
  if (!existsSync(directory)) {
    await mkdir(directory, { recursive: true });
  }
}

export async function POST(request: Request) {
  try {
    const transaction = await request.json();
    
    // 验证必要字段
    if (!transaction.date || !transaction.account || !transaction.description || !transaction.category || !transaction.amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 解析日期
    const date = new Date(transaction.date);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    // 构建文件路径
    const dataDir = path.join(getDataDirectory(), String(year));
    const filePath = path.join(dataDir, `${month}.csv`);
    
    // 确保目录存在
    await ensureDirectoryExists(dataDir);

    // 检查文件是否存在，如果不存在则创建并添加表头
    const fileExists = existsSync(filePath);
    let csvContent = '';
    const headers = ['account', 'transfer', 'description', 'counterparty', 'category', 'date', 'note', 'tags', 'amount', 'owner'];
    
    if (!fileExists) {
      csvContent = `${headers.join(',')}\n`;
    }
    
    // 准备CSV行数据
    const row = [
      `"${transaction.account}"`,
      `"${transaction.transfer || ''}"`,
      `"${transaction.description}"`,
      `"${transaction.counterparty || ''}"`,
      `"${transaction.category}"`,
      `"${transaction.date}"`,
      `"${transaction.note || ''}"`,
      `"${transaction.tags || ''}"`,
      transaction.amount,
      `"${transaction.owner || ''}"`
    ];
    
    // 添加到CSV内容
    csvContent += `${row.join(',')}\n`;
    
    // 追加到文件
    await writeFile(filePath, csvContent, { flag: fileExists ? 'a' : 'w', encoding: 'utf8' });
    
    return NextResponse.json({ 
      success: true, 
      message: '交易记录已保存',
      filePath
    });
    
  } catch (error) {
    console.error('保存交易记录时出错:', error);
    return NextResponse.json(
      { error: '保存交易记录时出错' },
      { status: 500 }
    );
  }
}
