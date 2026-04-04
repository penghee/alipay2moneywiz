"""
文件解析器
处理支付宝 CSV 和微信 XLSX 文件
"""

import pandas as pd
from datetime import datetime
from typing import List, Dict, Optional
import json


def read_csv_with_encoding(file_path: str, encoding: str = None) -> str:
    """
    读取 CSV 文件，自动处理编码

    Args:
        file_path: CSV 文件路径
        encoding: 指定编码，如果为 None 则自动检测

    Returns:
        文件内容字符串
    """
    import chardet

    if encoding is None:
        # 自动检测编码
        with open(file_path, "rb") as f:
            raw_data = f.read()
            result = chardet.detect(raw_data)
            encoding = result["encoding"]

    # 尝试 UTF-8，失败则使用检测到的编码
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            # 检查是否包含支付宝相关关键词
            if "支付宝" in content or "交易号" in content:
                return content
    except UnicodeDecodeError:
        pass

    # 使用检测到的编码
    if encoding:
        with open(file_path, "r", encoding=encoding) as f:
            return f.read()

    raise ValueError(f"无法读取文件: {file_path}")


def parse_excel_sequence_date(serial_date: float) -> datetime:
    """
    解析 Excel 序列日期（如 46109.42482638889）

    Excel 序列日期从 1900-01-01 开始，Unix 时间戳从 1970-01-01 开始
    Excel 的 1 = 1900-01-01，需要减去 25569 天（从 1900-01-01 到 1970-01-01）

    Args:
        serial_date: Excel 序列日期

    Returns:
        datetime 对象
    """
    # Excel 序列日期转换公式
    excel_epoch = 25569  # 1970-01-01 对应的 Excel 序列日期
    excel_date = serial_date - excel_epoch
    seconds = excel_date * 86400  # 转换为秒
    milliseconds = seconds * 1000

    return datetime.fromtimestamp(milliseconds / 1000)


def parse_alipay_csv(file_path: str, category_map: Dict[str, str]) -> List[Dict]:
    """
    解析支付宝 CSV 文件

    Args:
        file_path: CSV 文件路径
        category_map: 自定义分类映射

    Returns:
        交易记录列表
    """
    content = read_csv_with_encoding(file_path)

    # 解析 CSV（使用 pandas）
    lines = content.split("\n")
    records = []
    in_data_section = False

    for line in lines:
        line = line.strip()

        # 检查是否进入数据部分（以 -- 开头且包含 支付宝）
        if line.startswith("--") and "支付宝" in line:
            in_data_section = True
            continue

        # 退出数据部分
        if line.startswith("--") and "微信" in line:
            break

        if not in_data_section:
            continue

        # 处理数据行
        if line.endswith(","):
            line = line[:-1]  # 移除末尾的逗号

        if not line:
            continue

        # 解析 CSV 行
        row = line.split(",")

        # 检查是否为数据行（应该有多列）
        if len(row) < 3:
            continue

        record = {
            "交易时间": row[0] if len(row) > 0 else "",
            "交易分类": row[1] if len(row) > 1 else "",
            "交易对方": row[2] if len(row) > 2 else "",
            "对方账号": row[3] if len(row) > 3 else "",
            "商品说明": row[4] if len(row) > 4 else "",
            "收/支": row[5] if len(row) > 5 else "",
            "金额": row[6] if len(row) > 6 else "0",
            "支付方式": row[7] if len(row) > 7 else "",
            "交易状态": row[8] if len(row) > 8 else "",
            "交易订单号": row[9] if len(row) > 9 else "",
            "商家订单号": row[10] if len(row) > 10 else "",
            "备注": row[11] if len(row) > 11 else ""
        }

        records.append(record)

    # 转换为字典列表
    transactions = []
    for record in records:
        # 检查是否为表头（交易时间通常是字符串"交易时间"）
        if record["交易时间"] == "交易时间":
            continue

        # 检查是否为空
        if not record["交易时间"]:
            continue

        # 解析时间
        try:
            # 尝试 Excel 序列日期
            time_value = float(record["交易时间"])
            date_obj = parse_excel_sequence_date(time_value)
        except (ValueError, TypeError):
            # 尝试其他格式
            try:
                date_str = record["交易时间"].strip()
                if len(date_str) == 10:
                    # YYYY-MM-DD
                    date_obj = datetime.strptime(date_str, "%Y-%m-%d")
                else:
                    # 尝试解析完整时间
                    date_obj = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
            except Exception as e:
                print(f"解析时间失败: {record['交易时间']}, 错误: {e}")
                continue

        # 确定金额（正数表示收入，负数表示支出）
        amount_str = record["金额"].replace("¥", "").replace(",", "").strip()
        try:
            amount = float(amount_str)
        except ValueError:
            amount = 0.0

        # 交易对方（使用账户）
        counterparty = record["交易对方"]
        if not counterparty:
            counterparty = record["商品说明"]

        # 分类
        category = classify_transaction(
            record["交易分类"],
            record["商品说明"],
            counterparty,
            amount,
            category_map,
            is_alipay=True
        )

        # 确定方向
        is_income = record["收/支"] in ["收入", "入账"]
        if is_income:
            final_amount = abs(amount)
        else:
            final_amount = -abs(amount)

        transaction = {
            "日期": date_obj.strftime("%Y-%m-%d"),
            "类型": "收入" if is_income else "支出",
            "子类": category.split("/")[-1] if "/" in category else category,
            "金额": final_amount,
            "来源/去向": counterparty,
            "备注": record["备注"],
            "原始数据": record
        }

        transactions.append(transaction)

    return transactions


def parse_wechat_xlsx(file_path: str, category_map: Dict[str, str]) -> List[Dict]:
    """
    解析微信 XLSX 文件

    Args:
        file_path: XLSX 文件路径
        category_map: 自定义分类映射

    Returns:
        交易记录列表
    """
    # 读取 Excel
    df = pd.read_excel(file_path, sheet_name=0, header=None)

    # 找到表头行（包含"交易时间"的行）
    header_row = None
    for i, row in df.iterrows():
        if "交易时间" in str(row.iloc[0]) or "交易时间" in str(row.iloc[1]):
            header_row = i
            break

    if header_row is None:
        raise ValueError("无法找到数据表头，请检查文件格式")

    # 获取表头
    headers = df.iloc[header_row].astype(str).tolist()
    headers = [h.strip() for h in headers]

    # 找到各个字段的索引
    time_idx = headers.index("交易时间") if "交易时间" in headers else -1
    amount_idx = headers.index("金额(元)") if "金额(元)" in headers else -1
    type_idx = headers.index("交易类型") if "交易类型" in headers else -1
    pay_method_idx = headers.index("支付方式") if "支付方式" in headers else -1
    counterparty_idx = headers.index("交易对方") if "交易对方" in headers else -1
    goods_idx = headers.index("商品") if "商品" in headers else -1
    remark_idx = headers.index("备注") if "备注" in headers else -1

    # 解析数据行
    transactions = []
    for i in range(header_row + 1, len(df)):
        row = df.iloc[i]

        # 跳过空行
        if pd.isna(row.iloc[0]) and pd.isna(row.iloc[1]):
            continue

        # 获取交易时间
        time_value = row.iloc[time_idx] if time_idx >= 0 else None
        if pd.isna(time_value):
            continue

        try:
            # 尝试 Excel 序列日期
            time_val = float(str(time_value))
            date_obj = parse_excel_sequence_date(time_val)
        except (ValueError, TypeError):
            # 尝试其他格式
            try:
                time_str = str(time_value).strip()
                if len(time_str) == 10:
                    date_obj = datetime.strptime(time_str, "%Y-%m-%d")
                else:
                    date_obj = datetime.fromisoformat(time_str.replace("Z", "+00:00"))
            except Exception as e:
                print(f"解析时间失败: {time_value}, 错误: {e}")
                continue

        # 获取金额
        amount_str = str(row.iloc[amount_idx]) if amount_idx >= 0 else "0"
        amount_str = amount_str.replace("¥", "").replace(",", "").strip()
        try:
            amount = float(amount_str)
        except ValueError:
            amount = 0.0

        # 获取交易类型
        trans_type = str(row.iloc[type_idx]) if type_idx >= 0 else ""

        # 获取支付方式
        pay_method = str(row.iloc[pay_method_idx]) if pay_method_idx >= 0 else ""

        # 获取交易对方
        counterparty = str(row.iloc[counterparty_idx]) if counterparty_idx >= 0 else ""

        # 获取商品
        goods = str(row.iloc[goods_idx]) if goods_idx >= 0 else ""

        # 获取备注
        remark = str(row.iloc[remark_idx]) if remark_idx >= 0 else ""

        # 分类
        category = classify_transaction(
            trans_type,
            goods,
            counterparty,
            amount,
            category_map,
            is_alipay=False
        )

        # 确定方向
        is_income = "收入" in trans_type or "入账" in trans_type
        if is_income:
            final_amount = abs(amount)
        else:
            final_amount = -abs(amount)

        transaction = {
            "日期": date_obj.strftime("%Y-%m-%d"),
            "类型": "收入" if is_income else "支出",
            "子类": category.split("/")[-1] if "/" in category else category,
            "金额": final_amount,
            "来源/去向": counterparty,
            "备注": remark,
            "原始数据": row.to_dict()
        }

        transactions.append(transaction)

    return transactions


def classify_transaction(
    category: str,
    description: str,
    counterparty: str,
    amount: float,
    category_map: Dict[str, str],
    is_alipay: bool = True
) -> str:
    """
    智能分类交易

    Args:
        category: 原始分类
        description: 商品说明
        counterparty: 交易对方
        amount: 金额
        category_map: 自定义分类映射
        is_alipay: 是否为支付宝

    Returns:
        分类字符串 (如 "收入/工资收入")
    """
    # 组合所有描述用于匹配
    full_text = f"{category} {description} {counterparty}".lower()

    # 先尝试通过映射表匹配
    matched_category = None
    for keyword, cat in category_map.items():
        if keyword in full_text:
            matched_category = cat
            break

    if matched_category:
        return matched_category

    # 如果没有匹配到，使用默认分类
    # 根据金额判断是否为支出
    if amount > 0:
        return "支出/其他支出"
    else:
        return "收入/其他收入"

# 初始化调用计数
classify_transaction.call_count = 0
