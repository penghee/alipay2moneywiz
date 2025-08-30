import * as fsp from "fs/promises";
import * as fs from "fs";
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import * as readline from 'node:readline'
import XLSX from 'xlsx';

const ACCOUNT_MAP = JSON.parse(await fsp.readFile("account_map.json"));
const CATEGORY_MAP = JSON.parse(await fsp.readFile("category_map.json"));
const CATEGORIES = Object.keys(CATEGORY_MAP);

// 1. 在 mainProcess 顶部创建一次
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 2. 改写 interactiveCorrect 为接受 rl 的同步提问
function askQuestion(query) {
  return new Promise(resolve =>
    rl.question(query, answer => resolve(answer.trim()))
  );
}


async function main() {
  try {
    const answer = await askQuestion('\n***微信账单转换***\n\n\n请输入原文件路径(支持csv和xlsx格式):\n\n')
    const reg = /\\/g;
    mainProcess(answer.trim().replace(reg, ''));
  } catch (err) {
    console.error('处理过程中出错:', err);
  } finally {
    rl.close();
    process.exit(0); // 确保程序退出
  }
}

async function mainProcess(source) {
  let records;
  
  // 检测文件格式
  const fileExtension = source.toLowerCase().split('.').pop();
  
  if (fileExtension === 'xlsx') {
    // 处理xlsx文件
    const workbook = XLSX.readFile(source);
    const sheetName = workbook.SheetNames[0]; // 取第一个sheet
    const worksheet = workbook.Sheets[sheetName];
    
    // 转换为数组格式
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // 找到表头行（包含"交易时间"等字段的行）
    let headerIndex = -1;
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (row && row.length > 0 && row.includes('交易时间')) {
        headerIndex = i;
        break;
      }
    }
    
    if (headerIndex === -1) {
      throw new Error('无法找到数据表头，请检查xlsx文件格式');
    }
    
    // 提取表头和数据
    const headers = jsonData[headerIndex];
    const dataRows = jsonData.slice(headerIndex + 1).filter(row => row && row.length > 0);
    
    // 转换为对象数组
    records = dataRows.map(row => {
      const record = {};
      headers.forEach((header, index) => {
        record[header] = row[index] || '';
      });
      return record;
    });
    
  } else {
    // 处理csv文件（保持原有逻辑）
    const fileStream = fs.createReadStream(source);
    const rl = readline.createInterface({
      input: fileStream,
    });
    // remove unused line of csv
    let numberOfDash = 0;
    let realContent = '';
    for await (let input of rl) {
      if (input.startsWith('--')) {
        numberOfDash++;
        continue;
      }
      if (numberOfDash > 0) {
        realContent += input + '\n';
      }
    }

    // parse the csv content to object
    records = parse(realContent, {
      delimiter: ',',
      columns: true,
      trim: true,
    });
  }

  // process all records
  const transactions = [];
  for (const record of records) {
    let transaction = {};
    transaction['日期'] = parseDate(record['交易时间']);
    transaction['描述'] = record['商品'] == "/" ? record['交易类型'] : record['商品'];
    transaction['账户'] = mapAccount(record['支付方式']);
    const fee = isNaN(record['金额(元)']) ? record['金额(元)'].substring(1, record['金额(元)'].length) : record['金额(元)'];
    if (record['收/支'] == '其他') {
      // keep alipay's transfer process, because no wechat transfer record found yet
      transaction['交易对方'] = '';
      transaction['分类'] = mapCategory(record['交易类型'], record['商品'], record['交易对方']);
      transaction['转账'] = mapAccount(record['交易对方']);
      if (record['商品说明'].includes("还款")) {
        transaction['金额'] = (-Math.abs(fee)).toString();
      } else {
        transaction['金额'] = fee;
      }
    } else {
      transaction['交易对方'] = '';
      transaction['分类'] = mapCategory(record['交易类型'], record['商品'], record['交易对方']);
      transaction['转账'] = '';
      if (record['收/支'] == '支出') {
        transaction['金额'] = (-Math.abs(fee)).toString();
      } else if (record['收/支'] == '收入') {
        transaction['金额'] = fee;
      }
    }
    transaction['标签'] = '';
    transaction['备注'] = '';

    if (transaction['分类'] === '其他') {
      await interactiveCorrect(transaction);
    }
    transactions.push(transaction);
  }

  // output to file
  const output = stringify(transactions, {
    header: true,
    columns: ['账户', '转账', '描述', '交易对方', '分类', '日期', '备注', '标签', '金额']
  })
  const sourceDir = source.slice(0, source.lastIndexOf('/') + 1);
  await fsp.writeFile(`${sourceDir + getOutputName()}`, output);
  console.log(`\n解析完成，输出路径: ${sourceDir + getOutputName()}`);
}


function parseDate(dateStr) {
  const dateObj = new Date(dateStr);
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}

function mapAccount(recordStr) {
  if (recordStr == "" || recordStr == "/") {
    return "微信零钱";
  }
  for (const k in ACCOUNT_MAP) {
    if (recordStr.includes(k)) {
      return ACCOUNT_MAP[k];
    }
  }
  return recordStr;
}

function mapCategory(transactionType, product, counterparty) {
  const searchText = `${transactionType} ${product} ${counterparty}`.toLowerCase();
  
  for (const [category, keywords] of Object.entries(CATEGORY_MAP)) {
    for (const keyword of keywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        return category;
      }
    }
  }
  
  return transactionType || "其他";
}

function getOutputName() {
  const now = new Date();
  const date = now.getFullYear() + '_' + (now.getMonth() + 1).toString() + '_' + now.getDate();
  return `【生成】微信账单_${date}.csv`;
}

async function interactiveCorrect(transaction) {
  console.log(`\n🤔 未分类: "${transaction['描述']}" - ¥${Math.abs(transaction['金额'])}`);
  CATEGORIES.forEach((cat, idx) => console.log(`${idx + 1}. ${cat}`));

  const ans = await askQuestion('请选择正确分类（输入序号）: ');
  const idx = parseInt(ans, 10) - 1;
  if (idx >= 0 && idx < CATEGORIES.length) {
    transaction['分类'] = CATEGORIES[idx];
    console.log(`✅ 已更新为：${CATEGORIES[idx]}`);
  } else {
    console.log('⚠️ 保持为“其他”');
  }
  return transaction;
}

// main().then(
//   () => process.exit(),
//   (err) => {
//     console.error(err);
//     process.exit(-1);
//   }
// );

main();