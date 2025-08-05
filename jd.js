import * as fsp from "fs/promises";
import * as fs from "fs";
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import * as readline from 'node:readline'

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
  const answer = await askQuestion('\n***京东账单转换***\n\n\n请输入原文件路径(支持csv格式):\n\n')
  const reg = /\\/g;
  mainProcess(answer.trim().replace(reg, ''));
}

async function mainProcess(source) {
  let records;
  
  // 检测文件格式
  const fileExtension = source.toLowerCase().split('.').pop();
  
  if (fileExtension === 'csv') {
    // 处理csv文件
    const fileStream = fs.createReadStream(source);
    const rl = readline.createInterface({
      input: fileStream,
    });
    // 跳过标题行和提示信息，找到数据起始位置
    let realContent = '';
    let foundHeader = false;
    for await (let input of rl) {
      if (!foundHeader && input.includes('交易时间')) {
        foundHeader = true;
        realContent += input + '\n';
      } else if (foundHeader) {
        realContent += input + '\n';
      }
    }

    if (!foundHeader) {
      throw new Error('无法找到数据表头，请检查CSV文件格式');
    }

    // parse the csv content to object
    records = parse(realContent, {
      delimiter: ',',
      columns: true,
      trim: true,
    });
  } else {
    throw new Error('不支持的文件格式，请使用CSV格式');
  }

  // process all records
  const transactions = [];
  for (const record of records) {
    // 跳过不计收支的交易（退款等）
    if (record['收/支'] === '不计收支') {
      continue;
    }
    
    let transaction = {};
    transaction['日期'] = parseDate(record['交易时间']);
    transaction['描述'] = record['交易说明'];
    transaction['账户'] = mapAccount(record['收/付款方式']);
    
    // 处理金额
    let fee = record['金额'].toString();
    if (fee.includes('(')) {
      fee = fee.substring(0, fee.indexOf('('));
    }
    fee = parseFloat(fee);
    
    transaction['交易对方'] = record['商户名称'];
    transaction['分类'] = mapCategory(record['交易分类'], record['交易说明'], record['商户名称']);
    transaction['转账'] = '';
    
    // 根据收/支设置金额符号
    if (record['收/支'] === '支出') {
      transaction['金额'] = (-Math.abs(fee)).toString();
    } else if (record['收/支'] === '收入') {
      transaction['金额'] = fee.toString();
    } else {
      transaction['金额'] = (-Math.abs(fee)).toString(); // 默认支出
    }
    
    transaction['标签'] = '';
    transaction['备注'] = record['备注'] || '';

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
  rl.close();
}

function parseDate(dateStr) {
  const dateObj = new Date(dateStr.trim());
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}

function mapAccount(recordStr) {
  if (recordStr == "" || recordStr == "/") {
    return "京东账户";
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
  
  // 根据京东的分类进行映射
  const jdCategoryMap = {
    '医疗保健': '医疗',
    '数码电器': '数码',
    '电脑办公': '数码',
    '食品酒饮': '餐饮',
    '母婴用品': '母婴',
    '美妆个护': '美妆',
    '日用百货': '日用',
    '运动户外': '运动',
    '文体玩具': '娱乐',
    '汽车用品': '交通',
    '宠物生活': '宠物',
    '手机通讯': '数码',
    '其他网购': '购物'
  };
  
  if (jdCategoryMap[transactionType]) {
    return jdCategoryMap[transactionType];
  }
  
  return transactionType || "其他";
}

function getOutputName() {
  const now = new Date();
  const date = now.getFullYear() + '_' + (now.getMonth() + 1).toString() + '_' + now.getDate();
  return `【生成】京东账单_${date}.csv`;
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