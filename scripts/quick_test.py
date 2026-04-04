"""
快速测试脚本
测试实际文件导入
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import sys
from importer import BatchImporter, update_classification_rules

# 初始化导入器，使用默认分类规则
category_map = update_classification_rules({})
importer = BatchImporter(category_map=category_map, save_dir="./test_output")

# 测试导入支付宝
print("=" * 50)
print("测试支付宝导入")
print("=" * 50)
try:
    alipay_file = "alipay_03.csv"
    if os.path.exists(alipay_file):
        transactions = importer.import_alipay(alipay_file, auto_save=True)
        print(f"\n✓ 成功导入 {len(transactions)} 笔交易")

        # 查看分类分布
        from collections import Counter
        subs = Counter(t['子类'] for t in transactions)
        print(f"\n分类分布:")
        for sub, count in subs.most_common(10):
            print(f"  {sub}: {count}笔")

        print(f"\n前 5 笔交易:")
        for t in transactions[:5]:
            print(f"  {t['日期']} | {t['类型']} | {t['子类']} | ¥{t['金额']:.2f} | {t['来源/去向']}")
    else:
        print(f"✗ 文件不存在: {alipay_file}")
except Exception as e:
    print(f"✗ 导入失败: {e}")
    import traceback
    traceback.print_exc()

# 测试导入微信
print("\n" + "=" * 50)
print("测试微信导入")
print("=" * 50)
try:
    wechat_file = "wechat_03.xlsx"
    if os.path.exists(wechat_file):
        transactions = importer.import_wechat(wechat_file, auto_save=True)
        print(f"\n✓ 成功导入 {len(transactions)} 笔交易")
        print(f"\n前 5 笔交易:")
        for t in transactions[:5]:
            print(f"  {t['日期']} | {t['类型']} | {t['子类']} | ¥{t['金额']:.2f} | {t['来源/去向']}")
    else:
        print(f"✗ 文件不存在: {wechat_file}")
except Exception as e:
    print(f"✗ 导入失败: {e}")
    import traceback
    traceback.print_exc()

# 测试月度报告
print("\n" + "=" * 50)
print("测试月度报告")
print("=" * 50)
try:
    alipay_file = "alipay_03.csv"
    if os.path.exists(alipay_file):
        transactions = importer.import_alipay(alipay_file, auto_save=False)
        report = importer.generate_monthly_report(transactions, 2026, 3)
        print(f"月份: {report['month']}")
        print(f"交易笔数: {report['total_transactions']}")
        print(f"总收入: ¥{report['total_income']:.2f}")
        print(f"总支出: ¥{report['total_expense']:.2f}")
        print(f"结余: ¥{report['balance']:.2f}")
        print(f"储蓄率: {report['savings_rate']}%")
        print(f"建议: {', '.join(report['suggestions'])}")
    else:
        print(f"✗ 文件不存在: {alipay_file}")
except Exception as e:
    print(f"✗ 测试失败: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 50)
print("测试完成")
print("=" * 50)
