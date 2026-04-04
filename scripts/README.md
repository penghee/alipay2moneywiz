# 财务数据导入脚本

基于「3+1 极简记账法」的自动财务数据导入工具，支持支付宝和微信账单的导入、分类和 Excel 生成。

## 功能特性

- ✅ 自动解析支付宝 CSV 和微信 XLSX 文件
- ✅ 智能分类（收入/支出/其他项）
- ✅ Excel 序列日期转换
- ✅ 编码自动检测（UTF-8/GBK）
- ✅ 自动生成 Flow 表和 Snapshot 表
- ✅ 支持批量导入和合并
- ✅ 可配置的分类规则

## 目录结构

```
scripts/
├── importer.py      # 主导入程序
├── parsers.py       # 文件解析器
├── classifier.py    # 智能分类器
├── generator.py     # Excel 生成器
├── merger.py        # 数据合并器
├── config.py        # 分类配置
└── README.md        # 说明文档
```

## 快速开始

### 安装依赖

```bash
pip install pandas openpyxl chardet
```

### 使用示例

#### 1. 命令行导入

```bash
# 导入支付宝账单
python importer.py alipay 支付宝账单.csv

# 导入微信账单
python importer.py wechat 微信账单.xlsx

# 批量导入目录下所有文件
python importer.py batch ./bills --merge
```

#### 2. Python API

```python
from scripts.importer import BatchImporter

# 初始化导入器
importer = BatchImporter()

# 导入支付宝账单
transactions = importer.import_alipay("alipay.csv")
# 或自动保存（会创建/更新 财务报表_YYYY-MM.xlsx）
transactions = importer.import_alipay("alipay.csv", auto_save=True)

# 导入微信账单（会自动合并同月份的支付宝和微信数据）
transactions = importer.import_wechat("wechat.xlsx")
# 自动去重，按日期+来源+金额判断

# 批量导入
transactions = importer.import_from_dir("./bills", merge_all=True)

# 生成月度报告
report = importer.generate_monthly_report(transactions, 2026, 3)
print(f"储蓄率: {report['savings_rate']}%")
print(f"总支出: ¥{report['total_expense']:.2f}")
```

#### 3. 快速导入

```python
from scripts.importer import quick_import

# 一行代码导入
transactions = quick_import("alipay.csv")

# 合并多个文件
transactions = quick_import("bills/*.csv", merge_all=True)
```

## 分类规则

### 收入三来源

- **工资收入**: 工资、月薪、年终奖、绩效工资
- **副业收入**: 自由职业、接单、咨询费、外包
- **投资收益**: 基金收益、股票分红、余额宝收益、理财收益

### 支出三维度

- **刚性支出**: 房租/房贷、水电燃气、物业费、保险费
- **弹性消费**: 餐饮外卖、购物娱乐、交通出行、人情往来
- **其他项**: 医疗健康、宠物、爱好、其他支出

### 其他项

- **实质性亏损**: 股票亏损、基金亏损、投资亏损
- **计划外支出**: 手机维修、车辆维修、家电维修

## 配置自定义规则

```python
from scripts.importer import update_classification_rules

# 定义自定义规则
custom_rules = {
    "教育支出": ["学费", "补习班", "网课"],
    "餐饮": ["麦当劳", "肯德基", "星巴克"],
    "交通": ["滴滴", "打车", "地铁"]
}

# 更新分类映射
category_map = update_classification_rules(custom_rules)

# 使用自定义规则
importer = BatchImporter(category_map=category_map)
transactions = importer.import_alipay("alipay.csv")
```

## 输出格式

### 文件命名

- **合并后文件**: `财务报表_YYYY-MM.xlsx`（自动合并同月份的支付宝和微信数据）
- **独立文件**: `支付宝_支出_alipay_03.xlsx` / `微信_支出_wechat_03.xlsx`（旧版本）

### Flow 表

| 日期 | 类型 | 子类 | 金额 | 来源/去向 | 备注 |
|------|------|------|------|-----------|------|
| 2026-03-01 | 收入 | 工资收入 | 15000 | 公司A | - |
| 2026-03-05 | 支出 | 餐饮外卖 | -2200 | 美团/饿了么 | - |
| 2026-03-10 | 其他项 | 股票亏损 | -5000 | 华泰证券 | - |

### Snapshot 表

| 日期 | 账户类型 | 金额 | 备注 |
|------|----------|------|------|
| 2026-03-28 | 主银行卡 | 12000 | 资产 |
| 2026-03-28 | 支付宝余额 | 3500 | 资产 |
| 2026-03-28 | 微信零钱 | 800 | 资产 |
| 2026-03-28 | 净资产总计 | 72300 | =SUM(C2:C9) |

## 自动合并功能

### 合并逻辑

- **文件命名**: 从文件名提取月份（如 `alipay_03.csv` → `2026-03`）
- **自动去重**: 按日期+来源+金额判断是否重复
- **自动追加**: 同月份多次导入会自动追加到已有文件

### 使用示例

```python
from scripts.importer import BatchImporter

importer = BatchImporter()

# 第一次导入支付宝（创建新文件）
transactions = importer.import_alipay("alipay_03.csv", auto_save=True)
# 生成: 财务报表_03.xlsx

# 第二次导入微信（自动合并）
transactions = importer.import_wechat("wechat_03.xlsx", auto_save=True)
# 追加到: 财务报表_03.xlsx

# 第三次导入支付宝（继续追加）
transactions = importer.import_alipay("alipay_03.csv", auto_save=True)
# 继续追加到: 财务报表_03.xlsx
```

## 使用流程

### 每月操作（5分钟）

1. 从支付宝/微信导出账单
2. 运行 `python importer.py batch ./bills --merge`
3. 打开生成的 Excel 文件查看分析

### 自动化建议

```bash
# 添加到 crontab（每月1号凌晨运行）
0 0 1 * * cd /path/to/project && python importer.py batch ./bills --merge
```

## 注意事项

1. **文件格式**：只支持 CSV（支付宝）和 XLSX（微信）
2. **编码问题**：脚本会自动检测 UTF-8/GBK 编码
3. **Excel 序列日期**：自动转换（如 46109.4248 → 2026-03-28）
4. **过滤规则**：亲情卡、转账、提现等会被自动过滤

## 与现有系统对比

| 特性 | 现有系统 | 脚本导入 |
|------|----------|----------|
| 数据来源 | API/导入 | Excel 直接导入 |
| 分类逻辑 | 基于规则 | 3+1 框架智能分类 |
| 数据存储 | SQLite | Excel 文件 |
| 分析功能 | 在线查看 | Excel 公式 |
| 维护成本 | 低 | 低 |
| 灵活性 | 中 | 高 |

## 故障排除

### 编码错误
```bash
# 手动指定编码
export PYTHONIOENCODING=utf-8
```

### 文件解析失败
检查文件格式是否正确，确保包含必要的表头字段。

### 分类不准确
编辑 `config.py` 文件，添加自定义分类规则。
