"""
测试合并功能
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from importer import BatchImporter, update_classification_rules
from collections import Counter

# 初始化导入器
custom_rules = update_classification_rules({})
importer = BatchImporter(category_map=custom_rules, save_dir="./test_output_merged")

print("=" * 60)
print("测试合并功能")
print("=" * 60)

# 导入支付宝
print("\n1. 导入支付宝...")
transactions_alipay = importer.import_alipay("alipay_03.csv", auto_save=True)
print(f"   导入 {len(transactions_alipay)} 笔交易")

# 导入微信
print("\n2. 导入微信（会自动合并）...")
transactions_wechat = importer.import_wechat("wechat_03.xlsx", auto_save=True)
print(f"   导入 {len(transactions_wechat)} 笔交易")

# 再次导入支付宝（测试追加）
print("\n3. 再次导入支付宝（测试追加）...")
transactions_alipay2 = importer.import_alipay("alipay_03.csv", auto_save=False)
print(f"   导入 {len(transactions_alipay2)} 笔交易")

# 统计
print("\n" + "=" * 60)
print("统计结果")
print("=" * 60)
print(f"支付宝原始: {len(transactions_alipay)} 笔")
print(f"微信原始: {len(transactions_wechat)} 笔")
print(f"合并后（去重）: {len(transactions_alipay2)} 笔")
print(f"重复交易数: {len(transactions_alipay) + len(transactions_wechat) - len(transactions_alipay2)} 笔")

print(f"\n生成的文件:")
for f in os.listdir("./test_output_merged"):
    print(f"  - {f}")

print("\n✓ 合并测试完成")
