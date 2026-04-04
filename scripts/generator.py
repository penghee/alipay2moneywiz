"""
Excel 生成器
生成 Flow 表和 Snapshot 表
"""

from typing import List, Dict
import pandas as pd
from datetime import datetime


class ExcelGenerator:
    """Excel 生成器"""

    # Flow 表字段
    FLOW_HEADERS = [
        "日期", "类型", "子类", "金额", "来源/去向", "备注"
    ]

    # Snapshot 表字段
    SNAPSHOT_HEADERS = [
        "日期", "账户类型", "金额", "备注"
    ]

    def generate_flow_sheet(self, transactions: List[Dict]) -> pd.DataFrame:
        """
        生成 Flow 表

        Args:
            transactions: 交易列表

        Returns:
            DataFrame
        """
        # 按日期排序
        sorted_transactions = sorted(transactions, key=lambda x: x["日期"])

        data = []
        for t in sorted_transactions:
            data.append({
                "日期": t["日期"],
                "类型": t["类型"],
                "子类": t["子类"],
                "金额": t["金额"],
                "来源/去向": t["来源/去向"],
                "备注": t.get("备注", "")
            })

        df = pd.DataFrame(data)
        return df

    def generate_snapshot_sheet(
        self,
        monthly_transactions: List[Dict],
        date: str = None
    ) -> pd.DataFrame:
        """
        生成 Snapshot 表

        Args:
            monthly_transactions: 月度交易列表（用于计算净资产）
            date: 日期（YYYY-MM-DD）

        Returns:
            DataFrame
        """
        if date is None:
            date = datetime.now().strftime("%Y-%m-%d")

        # 计算各类资产和负债
        assets = {
            "主银行卡": 0.0,
            "支付宝余额": 0.0,
            "微信零钱": 0.0,
            "货币基金": 0.0,
            "指数基金": 0.0,
            "股票账户": 0.0,
            "信用卡欠款": 0.0,
            "花呗欠款": 0.0
        }

        # 累计交易金额
        for t in monthly_transactions:
            amount = t["金额"]
            category = t.get("子类", "")

            # 根据交易类型和子类判断属于哪个账户
            if "工资收入" in category:
                assets["主银行卡"] += amount
            elif "支付宝余额" in category:
                assets["支付宝余额"] += amount
            elif "微信零钱" in category:
                assets["微信零钱"] += amount
            elif "基金收益" in category or "投资收益" in category:
                assets["货币基金"] += amount
            elif "股票" in category and "亏损" in category:
                assets["股票账户"] += amount
            elif category in ["支付宝充值", "银行卡充值"]:
                assets["主银行卡"] += amount

        # 净资产 = 所有资产 - 负债
        net_worth = sum(assets.values()) - assets["信用卡欠款"] - assets["花呗欠款"]

        # 构建 Snapshot 行
        rows = []

        # 资产行
        for account_type, amount in assets.items():
            if account_type in ["信用卡欠款", "花呗欠款"]:
                # 负债用负数表示
                rows.append({
                    "日期": date,
                    "账户类型": account_type,
                    "金额": -abs(amount) if amount != 0 else 0,
                    "备注": "负债"
                })
            else:
                rows.append({
                    "日期": date,
                    "账户类型": account_type,
                    "金额": abs(amount) if amount != 0 else 0,
                    "备注": "资产"
                })

        # 净资产总计
        rows.append({
            "日期": date,
            "账户类型": "净资产总计",
            "金额": net_worth,
            "备注": "=SUM(C2:C9)"  # Excel 公式
        })

        df = pd.DataFrame(rows)
        return df

    def generate_summary_sheet(
        self,
        transactions: List[Dict],
        start_date: str,
        end_date: str
    ) -> pd.DataFrame:
        """
        生成汇总表

        Args:
            transactions: 交易列表
            start_date: 开始日期
            end_date: 结束日期

        Returns:
            DataFrame
        """
        total_income = 0.0
        total_expense = 0.0
        income_count = 0
        expense_count = 0

        # 按类型和子类分组汇总
        category_summary = {}
        source_summary = {}
        large_expenses = []
        negative_expenses = []  # 退款、退货等负支出

        for t in transactions:
            amount = t["金额"]

            # 总收支统计
            if amount > 0:
                total_income += amount
                income_count += 1
            else:
                total_expense += abs(amount)
                expense_count += 1

            # 按类型和子类分组
            key = f"{t['类型']}/{t['子类']}"
            if key not in category_summary:
                category_summary[key] = {
                    "类型": t["类型"],
                    "子类": t["子类"],
                    "金额": 0.0,
                    "笔数": 0
                }
            category_summary[key]["金额"] += amount
            category_summary[key]["笔数"] += 1

            # 按来源分组
            source = t["来源/去向"]
            if source not in source_summary:
                source_summary[source] = {
                    "来源": source,
                    "金额": 0.0,
                    "笔数": 0
                }
            source_summary[source]["金额"] += amount
            source_summary[source]["笔数"] += 1

            # 大额支出统计（只统计支出，>300元）
            if amount < 0 and abs(amount) > 300:
                large_expenses.append({
                    "日期": t["日期"],
                    "类型": t["类型"],
                    "子类": t["子类"],
                    "金额": amount,
                    "来源/去向": source
                })

            # 负支出统计（退款、退货等）
            if amount < 0:
                negative_expenses.append({
                    "日期": t["日期"],
                    "类型": t["类型"],
                    "子类": t["子类"],
                    "金额": amount,
                    "来源/去向": source
                })

        # 转换为 DataFrame
        category_data = list(category_summary.values())
        category_df = pd.DataFrame(category_data)
        category_df = category_df.sort_values("金额", ascending=False)

        # 转换为 DataFrame
        source_data = list(source_summary.values())
        source_df = pd.DataFrame(source_data)
        source_df = source_df.sort_values("金额", ascending=False)

        # 分类占比分析（只统计支出）
        expense_categories = {}
        for t in transactions:
            if t["金额"] < 0:
                category = t["子类"]
                if category not in expense_categories:
                    expense_categories[category] = {
                        "类别": category,
                        "金额": 0.0,
                        "笔数": 0
                    }
                expense_categories[category]["金额"] += abs(t["金额"])
                expense_categories[category]["笔数"] += 1

        # 转换为 DataFrame
        expense_data = list(expense_categories.values())
        if expense_data:
            expense_df = pd.DataFrame(expense_data)
            expense_df = expense_df.sort_values("金额", ascending=False)

            # 计算占比
            total_expense_amount = expense_df["金额"].sum()
            expense_df["占比%"] = (expense_df["金额"] / total_expense_amount * 100).round(2)
        else:
            expense_df = pd.DataFrame(columns=["类别", "金额", "笔数", "占比%"])

        # 大额支出统计
        if large_expenses:
            large_expenses.sort(key=lambda x: x["金额"], reverse=True)
            large_df = pd.DataFrame(large_expenses)
            large_df["金额"] = large_df["金额"].abs()
        else:
            large_df = pd.DataFrame(columns=["日期", "类型", "子类", "金额", "来源/去向"])

        # 异常交易统计
        # Top 5 最大支出
        all_expenses = [t for t in transactions if t["金额"] < 0]
        all_expenses.sort(key=lambda x: x["金额"], reverse=True)
        top_5 = all_expenses[:5]
        top_5_df = pd.DataFrame(top_5)
        top_5_df["金额"] = top_5_df["金额"].abs()

        # Top 5 最小支出（最低支出可能意味着最大收益/退款）
        if len(all_expenses) > 0:
            top_5_smallest = sorted(all_expenses, key=lambda x: x["金额"])[:5]
        else:
            top_5_smallest = []
        smallest_df = pd.DataFrame(top_5_smallest)
        smallest_df["金额"] = smallest_df["金额"].abs()

        # 负支出统计
        if negative_expenses:
            negative_df = pd.DataFrame(negative_expenses)
            negative_df["金额"] = negative_df["金额"].abs()
        else:
            negative_df = pd.DataFrame(columns=["日期", "类型", "子类", "金额", "来源/去向"])

        # 净现金流
        net_cashflow = total_income - total_expense

        # 储蓄率
        savings_rate = 0.0
        if total_income > 0:
            savings_rate = (net_cashflow / total_income) * 100

        # 合并所有统计到一个 DataFrame
        summary_data = []

        # 基础统计
        summary_data.append({
            "汇总项": "总交易笔数",
            "数值": f"{len(transactions)}笔",
            "说明": "-"
        })
        summary_data.append({
            "汇总项": "总收入",
            "数值": f"¥{total_income:.2f}",
            "说明": f"{income_count}笔"
        })
        summary_data.append({
            "汇总项": "总支出",
            "数值": f"¥{total_expense:.2f}",
            "说明": f"{expense_count}笔"
        })
        summary_data.append({
            "汇总项": "结余",
            "数值": f"¥{net_cashflow:.2f}",
            "说明": f"储蓄率: {savings_rate:.2f}%"
        })

        summary_data.append({
            "汇总项": "大额支出",
            "数值": f"{len(large_expenses)}笔，¥{sum(abs(x['金额']) for x in large_expenses):.2f}",
            "说明": f"单笔 > 300元"
        })

        summary_df = pd.DataFrame(summary_data)

        # 返回所有统计
        return {
            "summary": summary_df,
            "category": category_df,
            "source": source_df,
            "expense": expense_df,
            "large_expenses": large_df,
            "top_5_largest": top_5_df,
            "top_5_smallest": smallest_df,
            "negative_expenses": negative_df,
            "total_income": total_income,
            "total_expense": total_expense,
            "net_cashflow": net_cashflow,
            "savings_rate": savings_rate
        }

    def save_to_excel(
        self,
        file_path: str,
        flow_df: pd.DataFrame,
        snapshot_df: pd.DataFrame,
        summary_df: pd.DataFrame = None
    ):
        """
        保存为 Excel 文件

        Args:
            file_path: 输出文件路径
            flow_df: Flow 表数据
            snapshot_df: Snapshot 表数据
            summary_df: 汇总表数据（可选）
        """
        with pd.ExcelWriter(file_path, engine="xlsxwriter") as writer:
            flow_df.to_excel(writer, sheet_name="Flow", index=False)
            snapshot_df.to_excel(writer, sheet_name="Snapshot", index=False)

            if summary_df is not None:
                summary_df.to_excel(writer, sheet_name="Summary", index=False)

        print(f"Excel 文件已保存: {file_path}")


def create_excel_with_transactions(
    transactions: List[Dict],
    filename: str = None,
    include_summary: bool = True
):
    """
    快速创建 Excel 文件

    Args:
        transactions: 交易列表
        filename: 输出文件名
        include_summary: 是否包含汇总表

    Returns:
        生成的文件路径
    """
    generator = ExcelGenerator()

    # 生成 Flow 表
    flow_df = generator.generate_flow_sheet(transactions)

    # 生成 Snapshot 表
    snapshot_df = generator.generate_snapshot_sheet(transactions)

    # 生成汇总表
    summary_df = None
    if include_summary:
        summary_df = generator.generate_summary_sheet(
            transactions,
            transactions[0]["日期"],
            transactions[-1]["日期"]
        )

    # 生成文件名
    if filename is None:
        from datetime import datetime
        filename = f"财务报表_{datetime.now().strftime('%Y-%m-%d')}.xlsx"

    # 保存
    generator.save_to_excel(file_path=filename, flow_df=flow_df,
                          snapshot_df=snapshot_df, summary_df=summary_df)

    return filename
