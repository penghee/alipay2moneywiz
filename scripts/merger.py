"""
数据合并器
合并多个月份的财务数据
"""

from typing import List, Dict, Set
from datetime import datetime


class DataMerger:
    """数据合并器"""

    def merge_transactions(
        self,
        transactions_list: List[List[Dict]]
    ) -> List[Dict]:
        """
        合并多个月份的交易数据

        Args:
            transactions_list: 交易列表的列表（每个月的数据）

        Returns:
            合并后的交易列表
        """
        merged = []

        for transactions in transactions_list:
            merged.extend(transactions)

        # 按日期排序
        merged.sort(key=lambda x: x["日期"])

        return merged

    def extract_by_month(
        self,
        transactions: List[Dict],
        year: int,
        month: int
    ) -> List[Dict]:
        """
        提取指定月份的交易数据

        Args:
            transactions: 交易列表
            year: 年份
            month: 月份

        Returns:
            该月份的交易列表
        """
        target_date = f"{year}-{str(month).zfill(2)}"

        filtered = []
        for t in transactions:
            if t["日期"] == target_date:
                filtered.append(t)

        return filtered

    def calculate_monthly_summary(
        self,
        transactions: List[Dict],
        year: int,
        month: int
    ) -> Dict:
        """
        计算月度汇总统计

        Args:
            transactions: 交易列表
            year: 年份
            month: 月份

        Returns:
            汇总统计
        """
        monthly_transactions = self.extract_by_month(transactions, year, month)

        total_income = 0.0
        total_expense = 0.0
        balance = 0.0

        category_stats = {}

        for t in monthly_transactions:
            amount = t["金额"]

            if amount > 0:
                total_income += amount
            else:
                total_expense += abs(amount)

            balance += amount

            # 分类统计
            category = t.get("子类", "其他")
            if category not in category_stats:
                category_stats[category] = 0.0
            category_stats[category] += amount

        # 计算储蓄率
        savings_rate = 0.0
        if total_income > 0:
            savings_rate = (balance / total_income) * 100

        return {
            "year": year,
            "month": month,
            "total_transactions": len(monthly_transactions),
            "total_income": total_income,
            "total_expense": total_expense,
            "balance": balance,
            "savings_rate": round(savings_rate, 2),
            "category_stats": category_stats
        }

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
        summary = self.calculate_monthly_summary(transactions, year, month)

        # 生成建议
        suggestions = []

        if summary["total_expense"] > 0:
            savings_rate = summary["savings_rate"]
            if savings_rate < 10:
                suggestions.append(f"储蓄率较低({savings_rate:.1f}%)，建议增加储蓄")
            elif savings_rate >= 30:
                suggestions.append(f"储蓄率优秀({savings_rate:.1f}%)！")
            else:
                suggestions.append(f"储蓄率为{summary['balance']:.0f}元")

        if summary["total_expense"] > summary["total_income"]:
            suggestions.append("本月支出超过收入，需要关注支出控制")

        return {
            "month": f"{year}-{str(month).zfill(2)}",
            "total_transactions": summary["total_transactions"],
            "total_income": summary["total_income"],
            "total_expense": summary["total_expense"],
            "balance": summary["balance"],
            "savings_rate": summary["savings_rate"],
            "suggestions": suggestions,
            "top_category": max(summary["category_stats"].items(),
                              key=lambda x: abs(x[1])) if summary["category_stats"] else None
        }

    def extract_accounts(self, transactions: List[Dict]) -> Dict[str, List[Dict]]:
        """
        按账户类型分组交易

        Args:
            transactions: 交易列表

        Returns:
            账户分组字典
        """
        accounts = {}

        for t in transactions:
            account = t.get("来源/去向", "其他")
            if account not in accounts:
                accounts[account] = []
            accounts[account].append(t)

        return accounts

    def merge_multiple_files(
        self,
        file_list: List[str],
        output_path: str
    ) -> List[Dict]:
        """
        合并多个 Excel 文件的数据

        Args:
            file_list: Excel 文件路径列表
            output_path: 输出文件路径

        Returns:
            合并后的交易列表
        """
        all_transactions = []

        for file_path in file_list:
            print(f"正在读取文件: {file_path}")
            try:
                df = pd.read_excel(file_path, sheet_name="Flow")
                transactions = df.to_dict("records")
                all_transactions.extend(transactions)
            except Exception as e:
                print(f"读取文件失败 {file_path}: {e}")

        # 按日期排序
        all_transactions.sort(key=lambda x: x["日期"])

        # 保存合并结果
        self.save_merged_data(all_transactions, output_path)

        return all_transactions

    def save_merged_data(self, transactions: List[Dict], output_path: str):
        """
        保存合并后的数据

        Args:
            transactions: 交易列表
            output_path: 输出路径
        """
        df = pd.DataFrame(transactions)
        df.to_excel(output_path, sheet_name="Merged", index=False)
        print(f"合并数据已保存: {output_path}")
