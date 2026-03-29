"""
财务数据分类配置
3+1 极简记账法框架
"""

from typing import Dict, List


class ClassificationConfig:
    """分类配置类"""

    # 收入三来源
    INCOME = {
        "工资收入": [
            "工资收入", "基本工资", "月薪", "年终奖", "绩效工资",
            "工资", "薪资", "工资条", "发薪"
        ],
        "副业收入": [
            "副业收入", "自由职业", "接单", "咨询费", "顾问费",
            "外包", "兼职", "项目收入", "技术服务"
        ],
        "投资收益": [
            "资本性收入", "基金收益", "股票分红", "利息收入",
            "余额宝收益", "理财产品收益", "基金分红", "股息"
        ]
    }

    # 支出三维度
    EXPENSE = {
        "刚性支出": [
            # 住房
            "房租/房贷", "物业费", "水费", "电费", "燃气费", "供暖费",

            # 通信（刚性！）
            "话费", "流量", "宽带费", "联通", "电信", "移动", "通信",
            "手机充值",

            # 医疗基础
            "医疗保险", "体检",

            # 教育基础
            "学费", "培训",

            # 其他必需
            "公共服务/缴税(费)", "缴税",
            "会员储值", "充值", "提现"
        ],
        "弹性消费": [
            # 餐饮
            "餐饮美食", "外卖", "咖啡", "奶茶", "小吃", "火锅", "烧烤",
            "甜品", "餐饮", "大众点评", "美团", "餐", "美食", "生煎",

            # 百货
            "百货", "超市", "便利店", "商场", "购物", "淘宝", "京东",
            "拼多多", "叮咚", "盒马", "日用百货", "生活用品", "TB",
            "数码电器", "手机", "电脑", "家电", "数码", "电子", "电器",
            "服饰装扮", "服装", "鞋帽", "配饰", "化妆品", "美容", "美发",
            "文化休闲", "京东", "大润发", "叮咚", "信用借还",
            "实木", "网易考拉", "好又多", "商业服务", "母婴亲子", "生活服务",
            "运动户外", "宠物", "山姆", "拼多多", "Sam", "公共服务",

            # 交通出行
            "打车", "滴滴", "高德", "哈啰出行", "公交", "地铁",
            "共享单车", "加油", "停车", "高速", "铁路", "航空",
            "出租车", "网约车", "驴充充", "高德打车", "停车费", "快充", "充",
            "寄存", "爱车养车", "平安好车主", "交通", "通信", "火车票",
            "中铁网络", "12306", "车费", "美团收银",

            # 娱乐休闲
            "电影", "KTV", "酒吧", "演出", "景点", "娱乐", "休闲", "游戏",
            "消费", "扫码", "文化旅游",
        ],
        "其他项": [
            # 礼物和旅行
            "礼物", "旅行", "旅游", "旅游交通", "旅游住宿", "旅游餐饮", "旅游娱乐",

            # 教育非刚需
            "教育培训", "课程", "教材", "教育", "学习", "育儿", "奶粉",
            "纸尿裤", "辅食", "玩具", "疫苗医疗", "月嫂", "育儿其他",

            # 个人医疗消费
            "医疗健康", "医院", "药店", "诊所", "体检", "医药", "医疗器械",
            "保险", "长宁妇幼", "大药房", "药",

            # 其他
            "人情往来", "爱好", "其他支出", "退款",
        ]
    }

    # 其他项（损失/计划外）
    OTHER = {
        "实质性亏损": [
            "股票亏损", "基金亏损", "投资亏损", "赎回亏损",
            "浮亏", "止损"
        ],
        "计划外支出": [
            "手机维修", "车辆维修", "家电维修", "设备更换",
            "意外支出", "临时支出"
        ]
    }

    # 过滤关键词（这些描述会被忽略）
    FILTER_KEYWORDS = [
        "亲情卡", "亲属卡", "转账", "充值", "提现",
        "红包", "转账成功", "转账失败", "退款", "退款到账", "不计收支"
    ]

    # 账户类型映射（用于 Snapshot 表）
    ACCOUNT_TYPES = [
        "主银行卡", "支付宝余额", "微信零钱", "货币基金",
        "指数基金", "股票账户", "信用卡欠款", "花呗欠款"
    ]

    # 金额阈值（用于大额支出判断）
    LARGE_AMOUNT_THRESHOLD = 300  # 单笔支出超过300元视为大额

    # 收支类型判断
    INCOME_TYPES = ["收入", "入账"]
    EXPENSE_TYPES = ["支出", "出账"]

    @classmethod
    def get_all_categories(cls) -> Dict[str, List[str]]:
        """获取所有分类"""
        return {
            "收入": sum(cls.INCOME.values(), []),
            "支出": sum(cls.EXPENSE.values(), []),
            "其他项": sum(cls.OTHER.values(), [])
        }

    @classmethod
    def get_category_map(cls) -> Dict[str, str]:
        """获取分类到框架的映射"""
        category_map = {}

        # 收入映射
        for category, keywords in cls.INCOME.items():
            for keyword in keywords:
                category_map[keyword] = f"收入/{category}"

        # 支出映射
        for category, keywords in cls.EXPENSE.items():
            for keyword in keywords:
                category_map[keyword] = f"支出/{category}"

        # 其他项映射
        for category, keywords in cls.OTHER.items():
            for keyword in keywords:
                category_map[keyword] = f"其他项/{category}"

        return category_map

    @classmethod
    def is_filter_keyword(cls, description: str) -> bool:
        """检查是否为过滤关键词"""
        return any(keyword in description for keyword in cls.FILTER_KEYWORDS)

    @classmethod
    def classify_by_keyword(cls, description: str, category_map: Dict[str, str]) -> str:
        """通过关键词匹配分类"""
        for keyword, category in category_map.items():
            if keyword in description:
                return category
        return "其他项/其他"
