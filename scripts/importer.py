"""
财务数据导入主程序
支持支付宝和微信账单的导入和 Excel 生成
"""

import pandas as pd
from typing import List, Dict, Optional, Callable
import os
from datetime import datetime
from pathlib import Path

from parsers import (
    parse_alipay_csv,
    parse_wechat_xlsx,
    read_csv_with_encoding
)
from classifier import TransactionClassifier
from generator import ExcelGenerator
from merger import DataMerger


class AlipayImporter:
    """支付宝账单导入器"""

    def __init__(self, category_map: Optional[Dict[str, str]] = None):
        """
        初始化支付宝导入器

        Args:
            category_map: 自定义分类映射
        """
        self.category_map = category_map or {}

    def import_from_file(self, file_path: str) -> List[Dict]:
        """
        从文件导入支付宝账单

        Args:
            file_path: CSV 文件路径

        Returns:
            交易记录列表
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"文件不存在: {file_path}")

        print(f"正在解析支付宝 CSV: {file_path}")
        transactions = parse_alipay_csv(file_path, self.category_map)
        print(f"成功导入 {len(transactions)} 笔交易")

        return transactions


class WechatImporter:
    """微信账单导入器"""

    def __init__(self, category_map: Optional[Dict[str, str]] = None):
        """
        初始化微信导入器

        Args:
            category_map: 自定义分类映射
        """
        self.category_map = category_map or {}

    def import_from_file(self, file_path: str) -> List[Dict]:
        """
        从文件导入微信账单

        Args:
            file_path: XLSX 文件路径

        Returns:
            交易记录列表
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"文件不存在: {file_path}")

        print(f"正在解析微信 XLSX: {file_path}")
        transactions = parse_wechat_xlsx(file_path, self.category_map)
        print(f"成功导入 {len(transactions)} 笔交易")

        return transactions


class BatchImporter:
    """批量导入器"""

    def __init__(
        self,
        category_map: Optional[Dict[str, str]] = None,
        save_dir: Optional[str] = None
    ):
        """
        初始化批量导入器

        Args:
            category_map: 自定义分类映射
            save_dir: 保存目录
        """
        self.category_map = category_map or {}
        self.save_dir = save_dir or os.getcwd()
        self.merger = DataMerger()
        self.generator = ExcelGenerator()

        # 确保保存目录存在
        os.makedirs(self.save_dir, exist_ok=True)

    def import_alipay(self, file_path: str, auto_save: bool = True) -> List[Dict]:
        """
        导入支付宝账单，自动合并同月份的支付宝和微信数据

        Args:
            file_path: CSV 文件路径
            auto_save: 是否自动保存为 Excel

        Returns:
            交易记录列表
        """
        importer = AlipayImporter(self.category_map)
        transactions = importer.import_from_file(file_path)

        if auto_save:
            # 从文件名提取月份 (如 alipay_03.csv → 03)
            stem = Path(file_path).stem
            month_match = stem.split("_")[-1]
            if month_match.isdigit() and len(month_match) == 2:
                month = month_match
            else:
                # 如果无法从文件名提取月份，使用第一笔交易的日期
                month = transactions[0]["日期"][:7].replace("-", "")

            # 生成统一的文件名：财务报表_YYYY-MM.xlsx
            filename = os.path.join(
                self.save_dir,
                f"财务报表_{month}.xlsx"
            )

            # 检查文件是否已存在
            if os.path.exists(filename):
                # 读取现有文件
                existing_df = pd.read_excel(filename, sheet_name="Flow")
                existing_transactions = existing_df.to_dict("records")

                # 合并交易（去重：按日期+来源/去向+金额判断）
                all_transactions = self._merge_transactions(
                    existing_transactions, transactions
                )

                # 更新数据
                flow_df = self.generator.generate_flow_sheet(all_transactions)
                snapshot_df = self.generator.generate_snapshot_sheet(all_transactions)
                summary_df = self.generator.generate_summary_sheet(
                    all_transactions,
                    all_transactions[0]["日期"],
                    all_transactions[-1]["日期"]
                )
            else:
                all_transactions = transactions
                flow_df = self.generator.generate_flow_sheet(all_transactions)
                snapshot_df = self.generator.generate_snapshot_sheet(all_transactions)
                summary_df = self.generator.generate_summary_sheet(
                    all_transactions,
                    all_transactions[0]["日期"],
                    all_transactions[-1]["日期"]
                )

            # 保存文件
            self.generator.save_to_excel(
                file_path=filename,
                flow_df=flow_df,
                snapshot_df=snapshot_df,
                summary_df=summary_df
            )

        return transactions

    def import_wechat(self, file_path: str, auto_save: bool = True) -> List[Dict]:
        """
        导入微信账单，自动合并同月份的支付宝和微信数据

        Args:
            file_path: XLSX 文件路径
            auto_save: 是否自动保存为 Excel

        Returns:
            交易记录列表
        """
        importer = WechatImporter(self.category_map)
        transactions = importer.import_from_file(file_path)

        if auto_save:
            # 从文件名提取月份 (如 wechat_03.xlsx → 03)
            stem = Path(file_path).stem
            month_match = stem.split("_")[-1]
            if month_match.isdigit() and len(month_match) == 2:
                month = month_match
            else:
                # 如果无法从文件名提取月份，使用第一笔交易的日期
                month = transactions[0]["日期"][:7].replace("-", "")

            # 生成统一的文件名：财务报表_YYYY-MM.xlsx
            filename = os.path.join(
                self.save_dir,
                f"财务报表_{month}.xlsx"
            )

            # 检查文件是否已存在
            if os.path.exists(filename):
                # 读取现有文件
                existing_df = pd.read_excel(filename, sheet_name="Flow")
                existing_transactions = existing_df.to_dict("records")

                # 合并交易（去重：按日期+来源/去向+金额判断）
                all_transactions = self._merge_transactions(
                    existing_transactions, transactions
                )

                # 更新数据
                flow_df = self.generator.generate_flow_sheet(all_transactions)
                snapshot_df = self.generator.generate_snapshot_sheet(all_transactions)
                summary_df = self.generator.generate_summary_sheet(
                    all_transactions,
                    all_transactions[0]["日期"],
                    all_transactions[-1]["日期"]
                )
            else:
                all_transactions = transactions
                flow_df = self.generator.generate_flow_sheet(all_transactions)
                snapshot_df = self.generator.generate_snapshot_sheet(all_transactions)
                summary_df = self.generator.generate_summary_sheet(
                    all_transactions,
                    all_transactions[0]["日期"],
                    all_transactions[-1]["日期"]
                )

            # 保存文件
            self.generator.save_to_excel(
                file_path=filename,
                flow_df=flow_df,
                snapshot_df=snapshot_df,
                summary_df=summary_df
            )

        return transactions

    def _merge_transactions(
        self,
        existing_transactions: List[Dict],
        new_transactions: List[Dict]
    ) -> List[Dict]:
        """
        合并交易列表，去除重复交易

        Args:
            existing_transactions: 现有交易列表
            new_transactions: 新导入的交易列表

        Returns:
            合并后的交易列表（去重）
        """
        # 创建去重键的集合：日期 + 来源/去向 + 金额
        existing_keys = set()
        for t in existing_transactions:
            key = (
                t["日期"],
                t["来源/去向"],
                abs(t["金额"])
            )
            existing_keys.add(key)

        # 添加新交易，避免重复
        merged = existing_transactions.copy()
        for t in new_transactions:
            key = (
                t["日期"],
                t["来源/去向"],
                abs(t["金额"])
            )
            if key not in existing_keys:
                merged.append(t)
                existing_keys.add(key)
            else:
                # 如果日期相同但不同来源，可以选择合并或跳过
                # 这里选择跳过重复
                print(f"跳过重复交易: {t['日期']} | {t['来源/去向']} | ¥{abs(t['金额'])}")

        # 按日期排序
        merged.sort(key=lambda x: x["日期"])

        return merged

    def import_from_dir(
        self,
        dir_path: str,
        file_pattern: str = "*",
        auto_save: bool = True,
        merge_all: bool = False
    ) -> List[Dict]:
        """
        从目录导入多个文件

        Args:
            dir_path: 目录路径
            file_pattern: 文件匹配模式（支持通配符）
            auto_save: 是否自动保存
            merge_all: 是否合并所有文件

        Returns:
            交易记录列表
        """
        dir_path = os.path.abspath(dir_path)

        if not os.path.isdir(dir_path):
            raise NotADirectoryError(f"不是目录: {dir_path}")

        all_transactions = []

        # 查找匹配的文件
        for filename in os.listdir(dir_path):
            if filename.lower().endswith((".csv", ".xlsx")) and Path(filename).match(file_pattern):
                file_path = os.path.join(dir_path, filename)

                try:
                    if filename.lower().endswith(".csv"):
                        transactions = self.import_alipay(file_path, auto_save=False)
                    else:
                        transactions = self.import_wechat(file_path, auto_save=False)

                    all_transactions.extend(transactions)
                    print(f"已导入: {filename}")

                except Exception as e:
                    print(f"导入 {filename} 失败: {e}")

        if not all_transactions:
            print("没有找到匹配的文件")
            return []

        # 合并所有交易
        if merge_all:
            merged = self.merger.merge_transactions([all_transactions])
            print(f"合并后共 {len(merged)} 笔交易")

            if auto_save:
                filename = os.path.join(
                    self.save_dir,
                    f"合并_财务报表_{datetime.now().strftime('%Y-%m-%d')}.xlsx"
                )
                self.generator.save_to_excel(
                    file_path=filename,
                    flow_df=self.generator.generate_flow_sheet(merged),
                    snapshot_df=self.generator.generate_snapshot_sheet(merged),
                    summary_df=self.generator.generate_summary_sheet(
                        merged,
                        merged[0]["日期"],
                        merged[-1]["日期"]
                    )
                )

            return merged

        return all_transactions

    def generate_monthly_report(
        self,
        transactions: List[Dict],
        year: int,
        month: int
    ) -> Dict:
        """
        生成月度报告

        Args:
            transactions: 交易列表
            year: 年份
            month: 月份

        Returns:
            月度报告
        """
        return self.merger.generate_monthly_report(transactions, year, month)


def quick_import(
    file_path: str,
    save_dir: str = None,
    merge_all: bool = False
) -> List[Dict]:
    """
    快速导入函数（简化版）

    Args:
        file_path: 文件路径
        save_dir: 保存目录
        merge_all: 是否合并所有文件

    Returns:
        交易记录列表
    """
    importer = BatchImporter(save_dir=save_dir)

    if file_path.endswith(".csv"):
        return importer.import_alipay(file_path, auto_save=True, merge_all=merge_all)
    elif file_path.endswith(".xlsx"):
        return importer.import_wechat(file_path, auto_save=True, merge_all=merge_all)
    else:
        raise ValueError("不支持的文件格式，请使用 CSV 或 XLSX")


def update_classification_rules(custom_rules: Dict[str, List[str]]) -> Dict[str, str]:
    """
    更新分类规则

    Args:
        custom_rules: 自定义分类规则 {category: [keywords]}

    Returns:
        更新后的分类映射
    """
    from config import ClassificationConfig

    config = ClassificationConfig()

    # 合并自定义规则
    new_category_map = config.get_category_map()
    for category, keywords in custom_rules.items():
        for keyword in keywords:
            new_category_map[keyword] = category

    return new_category_map


def main():
    """主函数（命令行接口）"""
    import argparse

    parser = argparse.ArgumentParser(description="财务数据导入工具")

    subparsers = parser.add_subparsers(dest="command", help="子命令")

    # 导入支付宝
    alipay_parser = subparsers.add_parser("alipay", help="导入支付宝账单")
    alipay_parser.add_argument("file", help="CSV 文件路径")
    alipay_parser.add_argument("--output", help="输出文件路径")
    alipay_parser.add_argument("--no-save", action="store_true", help="不自动保存")

    # 导入微信
    wechat_parser = subparsers.add_parser("wechat", help="导入微信账单")
    wechat_parser.add_argument("file", help="XLSX 文件路径")
    wechat_parser.add_argument("--output", help="输出文件路径")
    wechat_parser.add_argument("--no-save", action="store_true", help="不自动保存")

    # 批量导入
    batch_parser = subparsers.add_parser("batch", help="批量导入")
    batch_parser.add_argument("directory", help="目录路径")
    batch_parser.add_argument("--pattern", default="*", help="文件匹配模式")
    batch_parser.add_argument("--no-save", action="store_true", help="不自动保存")
    batch_parser.add_argument("--merge", action="store_true", help="合并所有文件")

    args = parser.parse_args()

    if args.command == "alipay":
        importer = BatchImporter()
        importer.import_alipay(args.file, auto_save=not args.no_save)

    elif args.command == "wechat":
        importer = BatchImporter()
        importer.import_wechat(args.file, auto_save=not args.no_save)

    elif args.command == "batch":
        importer = BatchImporter()
        importer.import_from_dir(args.directory, args.pattern, not args.no_save, args.merge)

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
