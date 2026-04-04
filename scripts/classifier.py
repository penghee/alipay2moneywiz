"""
智能分类器
基于关键词和规则进行交易分类
"""

from typing import Dict, List
from config import ClassificationConfig


class TransactionClassifier:
    """交易分类器"""

    def __init__(self, custom_rules: Dict[str, List[str]] = None):
        """
        初始化分类器

        Args:
            custom_rules: 自定义分类规则
        """
        self.config = ClassificationConfig()
        self.custom_rules = custom_rules or {}
        self.category_map = self._build_category_map()

    def _build_category_map(self) -> Dict[str, str]:
        """构建分类映射表"""
        category_map = {}

        # 添加自定义规则
        for category, keywords in self.custom_rules.items():
            for keyword in keywords:
                category_map[keyword] = category

        # 添加默认规则
        for category, keywords in self.config.INCOME.items():
            for keyword in keywords:
                category_map[keyword] = f"收入/{category}"

        for category, keywords in self.config.EXPENSE.items():
            for keyword in keywords:
                category_map[keyword] = f"支出/{category}"

        for category, keywords in self.config.OTHER.items():
            for keyword in keywords:
                category_map[keyword] = f"其他项/{category}"

        return category_map

    def classify(self, description: str, amount: float) -> str:
        """
        分类单个交易

        Args:
            description: 交易描述
            amount: 金额

        Returns:
            分类字符串
        """
        full_text = description.lower()

        # 过滤
        if self.config.is_filter_keyword(description):
            return "其他项/已过滤"

        # 尝试匹配
        for keyword, category in self.category_map.items():
            if keyword in full_text:
                return category

        # 默认分类
        if amount > 0:
            return "支出/其他支出"
        else:
            return "收入/其他收入"

    def batch_classify(self, transactions: List[Dict]) -> List[Dict]:
        """
        批量分类交易

        Args:
            transactions: 交易列表

        Returns:
            分类后的交易列表
        """
        for transaction in transactions:
            description = transaction.get("商品说明", "") or transaction.get("描述", "")
            amount = transaction.get("金额", 0)

            category = self.classify(description, amount)
            transaction["分类"] = category

            # 分解类型和子类
            if "/" in category:
                transaction["类型"], transaction["子类"] = category.split("/", 1)
            else:
                transaction["类型"] = category
                transaction["子类"] = category

        return transactions

    def get_summary(self) -> Dict[str, int]:
        """获取分类统计"""
        summary = {}
        for transaction in self._all_transactions:
            category = transaction.get("分类", "其他项/其他")
            summary[category] = summary.get(category, 0) + 1
        return summary

    @property
    def _all_transactions(self) -> List[Dict]:
        """获取所有交易（需要先批量分类）"""
        return []
