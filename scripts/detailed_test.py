"""
详细分类测试脚本
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from importer import BatchImporter, update_classification_rules
from collections import Counter

# 初始化导入器，使用自定义分类规则
custom_rules = update_classification_rules({})

importer = BatchImporter(category_map=custom_rules)

# 测试支付宝
print("=" * 60)
print("支付宝详细分类")
print("=" * 60)
transactions = importer.import_alipay("alipay_03.csv", auto_save=False)

subs = Counter(t['子类'] for t in transactions)
print(f"总交易数: {len(transactions)}")
print(f"\n分类分布:")
for sub, count in subs.most_common():
    print(f"  {sub}: {count}笔")

# 统计各类别总额
print(f"\n各类别总额:")
for sub, count in subs.most_common():
    total = sum(t['金额'] for t in transactions if t['子类'] == sub)
    print(f"  {sub}: ¥{abs(total):.2f} ({count}笔)")

# 测试微信
print("\n" + "=" * 60)
print("微信详细分类")
print("=" * 60)
transactions_wechat = importer.import_wechat("wechat_03.xlsx", auto_save=False)

subs_wechat = Counter(t['子类'] for t in transactions_wechat)
print(f"总交易数: {len(transactions_wechat)}")
print(f"\n分类分布:")
for sub, count in subs_wechat.most_common():
    print(f"  {sub}: {count}笔")

# 统计各类别总额
print(f"\n各类别总额:")
for sub, count in subs_wechat.most_common():
    total = sum(t['金额'] for t in transactions_wechat if t['子类'] == sub)
    print(f"  {sub}: ¥{abs(total):.2f} ({count}笔)")

# 合并两个数据集
print("\n" + "=" * 60)
print("合并统计")
print("=" * 60)
all_transactions = transactions + transactions_wechat
all_subs = Counter(t['子类'] for t in all_transactions)

print(f"总交易数: {len(all_transactions)}")
print(f"\n分类分布:")
for sub, count in all_subs.most_common(10):
    total = sum(t['金额'] for t in all_transactions if t['子类'] == sub)
    print(f"  {sub}: {count}笔, ¥{abs(total):.2f}")

print("\n✓ 测试完成")
