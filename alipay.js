import * as fsp from "fs/promises";
import * as fs from "fs";
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import iconv from "iconv-lite"
import * as readline from 'node:readline'

const ACCOUNT_MAP = JSON.parse(await fsp.readFile("account_map.json"));
const CATEGORY_MAP = JSON.parse(await fsp.readFile("category_map.json"));

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
  const answer = await askQuestion('\n***支付宝账单转换***\n\n\n请输入原文件路径(支持csv和xlsx格式):\n\n')
  const reg = /\\/g;
  mainProcess(answer.trim().replace(reg, ''));
}

async function mainProcess(source) {
  // transfer GBK to utf-8
  const file = await fsp.readFile(source, { encoding: "binary" });
  let buf = Buffer.from(file, "binary");
  let str = iconv.decode(buf, 'GBK');
  await fsp.writeFile('temp_res', str);
  // read line by line
  const fileStream = fs.createReadStream('temp_res');
  const rl = readline.createInterface({
    input: fileStream,
  });
  // remove unused line of csv
  let realContent = '';
  let belowAreRealContent = false;
  for await (let input of rl) {
    if (input.startsWith('--')) {
        belowAreRealContent = input.includes("支付宝")
    } else if (belowAreRealContent) {
      // remove the last ',' of the line
      if (input.endsWith(',')) {
        input = input.substring(0, input.length - 1);
      }
      realContent += input + '\n';
    }
  }
  await fsp.unlink("temp_res"); //delete the temp file

  // parse the csv content to object
  const records = parse(realContent, {
    delimiter: ',',
    columns: true,
    trim: true,
  });

  // process all records
  const transactions = [];
  for(const record of records) {
    if (record['交易状态'] == '交易关闭') {
      return;
    }
    let transaction = {};
    transaction['日期'] = parseDate(record['交易时间']);
    transaction['描述'] = record['商品说明'];
    transaction['账户'] = mapAccount(record['收/付款方式']);
    if (record['收/支'] == '收入' || record['收/支'] == '支出') {
      transaction['交易对方'] = '';
      transaction['分类'] = mapCategory(record['交易分类'], record['商品说明'], record['交易对方']);
      transaction['转账'] = '';
      if (record['收/支'] == '支出') {
        const fee = -Math.abs(record['金额']);
        transaction['金额'] = fee.toString();
      } else if (record['收/支'] == '收入') {
        transaction['金额'] = record['金额'];
      }
    } else {
      transaction['交易对方'] = '';
      transaction['分类'] = mapCategory(record['交易分类'], record['商品说明'], record['交易对方']);
      transaction['转账'] = mapAccount(record['交易对方']);
      if (record['商品说明'].includes("还款")) {
        const fee = -Math.abs(record['金额']);
        transaction['金额'] = fee.toString();
      } else {
        transaction['金额'] = record['金额'];
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
  rl.close();
}


function parseDate(dateStr) {
  const dateObj = new Date(dateStr);
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}

function mapAccount(recordStr) {
  if (recordStr == "") {
    return "支付宝余额";
  }
  for (const k in ACCOUNT_MAP) {
    if (recordStr.includes(k)) {
      return ACCOUNT_MAP[k];
    }
  }
  return "";
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
  return `【生成】支付宝账单_${date}.csv`;
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