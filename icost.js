import * as fsp from "fs/promises";
import * as fs from "fs";
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import * as readline from 'node:readline'
import XLSX from 'xlsx';

const ACCOUNT_MAP = JSON.parse(await fsp.readFile("account_map.json"));
const CATEGORY_MAP = JSON.parse(await fsp.readFile("category_map.json"));

function main() {
  // request input file path
  const query = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  query.question('\n***icost账单转换***\n\n\n请输入原文件路径(支持csv和xlsx格式):\n\n', (answer) => {
    const reg = /\\/g;
    mainProcess(answer.trim().replace(reg, ''));
    query.close();
  })
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
    
    // 找到表头行（包含"日期"等字段的行）
    let headerIndex = -1;
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (row && row.length > 0 && row.includes('日期')) {
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
  records.forEach(record => {
    let transaction = {};
    transaction['日期'] = parseDate(record['日期']).date;
    transaction['时间'] = parseDate(record['日期']).time;
    transaction['描述'] = record['一级分类'] + record['二级分类'];
    transaction['账户'] = mapAccount(record['账户1']);
    const fee = isNaN(record['金额']) ? record['金额'].substring(1, record['金额'].length) : record['金额'];

    // record['类型'] 支出  收入 退款入账 转账 还款
    if (record['类型'] == '转账' || record['类型'] == '还款') {
      // keep alipay's transfer process, because no wechat transfer record found yet
      transaction['交易对方'] = '';
      transaction['分类'] = '';
      transaction['账户'] = mapAccount(record['账户2']);
      transaction['转账'] = mapAccount(record['账户1']);
      transaction['金额'] = fee;
    } else {
      // 支出  收入 退款入账
      transaction['交易对方'] = '';
      transaction['分类'] = mapCategory(record['一级分类'], record['二级分类'], '');
      transaction['转账'] = '';
      if (record['类型'] == '支出') {
        transaction['金额'] = (-Math.abs(fee)).toString();
      } else {
        transaction['金额'] = fee;
        if (record['类型'] == '退款入账') {
          transaction['描述'] = `${transaction['分类']} 的退款`
        }
      }
    }
    transaction['标签'] = record['标签'];
    transaction['备注'] = '';
    transactions.push(transaction);
  });

  // output to file
  const output = stringify(transactions, {
    header: true,
    columns: ['账户', '转账', '描述', '交易对方', '分类', '日期', '时间', '备注', '标签', '金额']
  })
  const sourceDir = source.slice(0, source.lastIndexOf('/') + 1);
  await fsp.writeFile(`${sourceDir + getOutputName()}`, output);
  console.log(`\n解析完成，输出路径: ${sourceDir + getOutputName()}`);
}


function parseDate(dateStr) {
  const dateObj = new Date(dateStr);
  
  // 获取日期部分并格式化为 YYYY/MM/DD
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  
  return {
    date: `${year}/${month}/${day}`
  };
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
  if (transactionType == '红包') {
    return "其他";
  }
  return transactionType || "其他";
}

function getOutputName() {
  const now = new Date();
  const date = now.getFullYear() + '_' + (now.getMonth() + 1).toString() + '_' + now.getDate();
  return `【生成】icost账单_${date}.csv`;
}

// main().then(
//   () => process.exit(),
//   (err) => {
//     console.error(err);
//     process.exit(-1);
//   }
// );

main();