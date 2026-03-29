# 使用示例

## 基础用法

### 1. 导入单笔账单

```python
from scripts.importer import BatchImporter

# 初始化
importer = BatchImporter()

# 导入支付宝账单
transactions = importer.import_alipay("alipay.csv")
print(f"导入了 {len(transactions)} 笔交易")

# 导入微信账单
transactions = importer.import_wechat("wechat.xlsx")
print(f"导入了 {len(transactions)} 笔交易")
```

### 2. 快速导入（一行代码）

```python
from scripts.importer import quick_import

# 一行代码完成导入和保存
transactions = quick_import("alipay.csv")
```

### 3. 批量导入

```python
from scripts.importer import BatchImporter

# 初始化，指定保存目录
importer = BatchImporter(save_dir="./output")

# 导入目录下所有文件
transactions = importer.import_from_dir("./bills", merge_all=True)

# 按文件名匹配（只导入包含"2026-03"的文件）
transactions = importer.import_from_dir(
    "./bills",
    pattern="*2026-03*",
    merge_all=True
)
```

### 4. 查看月度报告

```python
# 导入数据
importer = BatchImporter()
transactions = importer.import_alipay("alipay.csv")

# 生成月度报告
report = importer.generate_monthly_report(transactions, 2026, 3)

print(f"月份: {report['month']}")
print(f"交易笔数: {report['total_transactions']}")
print(f"总收入: ¥{report['total_income']:.2f}")
print(f"总支出: ¥{report['total_expense']:.2f}")
print(f"结余: ¥{report['balance']:.2f}")
print(f"储蓄率: {report['savings_rate']}%")
print(f"建议: {', '.join(report['suggestions'])}")
```

## 进阶用法

### 1. 自定义分类规则

```python
from scripts.importer import BatchImporter, update_classification_rules

# 定义自定义规则
custom_rules = {
    "教育支出": ["学费", "补习班", "网课", "培训"],
    "咖啡": ["星巴克", "瑞幸", "咖啡", "奶茶"],
    "打车": ["滴滴", "Uber", "打车", "专车"]
}

# 更新分类映射
category_map = update_classification_rules(custom_rules)

# 使用自定义规则
importer = BatchImporter(category_map=category_map)
transactions = importer.import_alipay("alipay.csv")
```

### 2. 导出月度汇总

```python
import pandas as pd
from scripts.importer import BatchImporter

importer = BatchImporter()
transactions = importer.import_alipay("alipay.csv")

# 生成月度汇总
summary_df = importer.generator.generate_summary_sheet(
    transactions,
    "2026-03-01",
    "2026-03-31"
)

# 保存汇总表
summary_df.to_excel("月度汇总_2026-03.xlsx", index=False)
```

### 3. 生成资产快照

```python
from scripts.importer import BatchImporter
from datetime import datetime

importer = BatchImporter()
transactions = importer.import_alipay("alipay.csv")

# 生成 Snapshot 表
snapshot_df = importer.generator.generate_snapshot_sheet(
    transactions,
    date=datetime.now().strftime("%Y-%m-%d")
)

# 保存快照
snapshot_df.to_excel(f"资产快照_{datetime.now().strftime('%Y-%m-%d')}.xlsx", index=False)
```

### 4. 数据分析

```python
from scripts.importer import BatchImporter
import matplotlib.pyplot as plt

importer = BatchImporter()
transactions = importer.import_alipay("alipay.csv")

# 按账户分组
accounts = importer.merger.extract_accounts(transactions)

for account, acc_transactions in accounts.items():
    print(f"\n账户: {account}")
    print(f"交易笔数: {len(acc_transactions)}")
    print(f"总金额: ¥{sum(t['amount'] for t in acc_transactions):.2f}")

    # 绘制支出分析（示例）
    if any(t['type'] == '支出' for t in acc_transactions):
        amounts = [abs(t['amount']) for t in acc_transactions if t['type'] == '支出']
        categories = [t['sub_type'] for t in acc_transactions if t['type'] == '支出']

        plt.figure(figsize=(10, 6))
        plt.bar(categories, amounts)
        plt.xticks(rotation=45, ha='right')
        plt.ylabel("金额")
        plt.title(f"{account} 支出分析")
        plt.tight_layout()
        plt.savefig(f"{account}_支出分析.png")
```

## 命令行用法

### 1. 导入单个文件

```bash
# 支付宝
python importer.py alipay 支付宝账单.csv

# 微信
python importer.py wechat 微信账单.xlsx
```

### 2. 批量导入

```bash
# 导入整个目录
python importer.py batch ./bills

# 导入并合并
python importer.py batch ./bills --merge

# 按文件名匹配
python importer.py batch ./bills --pattern "*2026-03*"
```

## 常见问题

### Q1: 如何修改分类规则？

编辑 `scripts/config.py` 文件，修改 `INCOME`、`EXPENSE`、`OTHER` 字典。

```python
class ClassificationConfig:
    INCOME = {
        "我的新分类": ["关键词1", "关键词2", "关键词3"],
    }
    # ...
```

### Q2: 导入失败怎么办？

1. 检查文件格式是否正确
2. 确保包含必要的表头（如"交易时间"）
3. 查看错误信息，通常是文件编码问题

```python
# 手动指定编码
importer = BatchImporter()
transactions = importer.import_alipay("alipay.csv")
```

### Q3: 如何处理多个文件？

使用批量导入功能：

```python
importer = BatchImporter()
transactions = importer.import_from_dir("./bills", merge_all=True)
```

### Q4: 生成的 Excel 如何与现有系统集成？

现有的 Next.js 系统可以继续使用，Excel 用于月度汇总。数据来源不同，但可以互补使用。

## 最佳实践

1. **每月固定操作流程**：
   ```python
   from scripts.importer import BatchImporter

   importer = BatchImporter()
   transactions = importer.import_from_dir("./bills", merge_all=True)

   # 查看报告
   report = importer.generate_monthly_report(transactions, 2026, 3)

   # 保存 Excel
   importer.generator.save_to_excel(
       "财务报表_2026-03.xlsx",
       flow_df=importer.generator.generate_flow_sheet(transactions),
       snapshot_df=importer.generator.generate_snapshot_sheet(transactions)
   )
   ```

2. **定期备份**：
   - 每月保存 Excel 文件到备份目录
   - 使用版本号管理（如 `财务报表_2026-03_v1.xlsx`）

3. **自动化**：
   添加到 crontab 定期运行：
   ```bash
   # 每月1号凌晨运行
   0 0 1 * * cd /path/to/project && python importer.py batch ./bills --merge
   ```

4. **自定义规则**：
   - 根据个人习惯创建专属分类
   - 定期更新规则以适应新的消费模式
