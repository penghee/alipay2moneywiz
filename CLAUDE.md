# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
Alipay2Moneywiz is a Node.js utility that converts Alipay and WeChat transaction exports into MoneyWiz-compatible CSV format. The project handles Chinese financial data format conversion with proper encoding and field mapping.

## Architecture
- **alipay.js**: Main script for Alipay CSV processing (GBK encoding, CSV format)
- **wechat.js**: Main script for WeChat transaction processing (CSV/XLSX formats)
- **account_map.json**: Account name mapping configuration between source and MoneyWiz accounts
- Uses `csv-parse`, `csv-stringify`, `iconv-lite` (for GBK encoding), and `xlsx` (for Excel processing)

## Key Components
- **Data Processing Flow**: Read → Decode GBK → Filter headers → Parse CSV → Transform → Output CSV
- **Account Mapping**: String matching on payment method names to MoneyWiz account names
- **Date Formatting**: Chinese locale datetime formatting for MoneyWiz compatibility
- **Transaction Types**: Handles income, expense, and transfer transactions with proper sign handling

## Common Commands
```bash
# Install dependencies
npm install

# Convert Alipay CSV
npm run alipay

# Convert WeChat transactions (CSV/XLSX)
npm run wechat

# Direct execution
node alipay.js
node wechat.js
```

## Configuration
**account_map.json** format:
```json
{
  "source_account_substring": "moneywiz_account_name",
  "余额": "支付宝余额",
  "花呗": "花呗",
  "零钱": "微信零钱"
}
```

## Input/Output
- **Input**: Alipay/WeChat exported transaction files (drag into terminal when prompted)
- **Output**: CSV files in same directory as input with Chinese naming convention: `【生成】支付宝账单_YYYY_M_D.csv` or `【生成】微信账单_YYYY_M_D.csv`

## Data Format Notes
- Alipay: GBK encoded CSV with headers starting after "--" lines
- WeChat: Supports both CSV and XLSX formats
- MoneyWiz output format: 账户,转账,描述,交易对方,分类,日期,备注,标签,金额