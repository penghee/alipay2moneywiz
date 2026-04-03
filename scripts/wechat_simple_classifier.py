"""
微信交易分类器
基于关键词匹配对微信交易进行分类，保持原始Excel表头
"""

import pandas as pd
import json
import os
import sys
import glob
from typing import Dict, List


class WeChatSimpleClassifier:
    """微信交易分类器"""
    
    def __init__(self, category_map_path: str = None):
        """
        初始化分类器
        
        Args:
            category_map_path: 分类映射文件路径
        """
        self.category_map = self._load_category_map(category_map_path)
        
    def _load_category_map(self, path: str = None) -> Dict[str, List[str]]:
        """加载分类映射"""
        if path is None:
            # 默认使用项目中的分类映射
            path = os.path.join(os.path.dirname(__file__), '..', 'src', 'config', 'category_map.json')
        
        try:
            with open(path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"分类映射文件未找到: {path}")
            return {}
        except json.JSONDecodeError:
            print(f"分类映射文件格式错误: {path}")
            return {}
    
    def _build_keyword_map(self) -> Dict[str, str]:
        """构建关键词到分类的反向映射"""
        keyword_map = {}
        
        for category, keywords in self.category_map.items():
            for keyword in keywords:
                keyword_map[keyword.lower()] = category
                
        return keyword_map
    
    def classify_transaction(self, transaction: Dict) -> str:
        """
        分类单笔交易
        
        Args:
            transaction: 交易数据字典
            
        Returns:
            分类名称
        """
        # 获取商品和交易对方字段
        商品 = str(transaction.get('商品', '')).strip()
        交易对方 = str(transaction.get('交易对方', '')).strip()
        
        # 合并搜索文本
        search_text = f"{商品}{交易对方}".lower()
        
        # 构建关键词映射
        keyword_map = self._build_keyword_map()
        
        # 按关键词长度排序，优先匹配更具体的关键词
        sorted_keywords = sorted(keyword_map.items(), key=lambda x: len(x[0]), reverse=True)
        
        # 尝试匹配关键词
        for keyword, category in sorted_keywords:
            if keyword in search_text:
                return category
        
        # 如果没有匹配到，返回"其他"
        return "其他"
    
    def classify_excel(self, excel_path: str, output_path: str = None) -> pd.DataFrame:
        """
        分类Excel文件中的交易
        
        Args:
            excel_path: Excel文件路径
            output_path: 输出文件路径（可选）
            
        Returns:
            分类后的DataFrame
        """
        print(f"正在处理文件: {excel_path}")
        
        # 读取Excel文件，保持原始表头
        try:
            df = pd.read_excel(excel_path, sheet_name=0, header=None)  # 第一行作为表头
            print(f"读取到 {len(df)} 行数据")
        except Exception as e:
            print(f"读取Excel文件失败: {e}")
            return pd.DataFrame()
        
        # 查找实际数据开始行（跳过说明行）
        data_start_row = 0
        for i, row in df.iterrows():
            if "交易时间" in str(row.iloc[0]) or "交易时间" in str(row.iloc[1]):
                data_start_row = i
                break

        if data_start_row == 0:
            raise ValueError("无法找到数据表头，请检查文件格式")
        
        # 获取实际数据
        data_df = df.iloc[data_start_row + 1:].copy()
        
        # 重置索引并设置正确的列名（保持原始表头）
        data_df.columns = [
            '交易时间', '交易类型', '交易对方', '商品', '收/支', '金额(元)', 
            '支付方式', '当前状态', '交易单号', '商户单号', '备注'
        ]
        
        # 移除空行
        data_df = data_df.dropna(subset=['交易时间']).copy()
        
        print(f"有效数据行数: {len(data_df)}")
        
        if len(data_df) == 0:
            print("没有找到有效的交易数据")
            return pd.DataFrame()
        
        # 为每行添加分类
        for idx in data_df.index:
            row = data_df.loc[idx]
            transaction_dict = row.to_dict()
            category = self.classify_transaction(transaction_dict)
            
            # 直接在DataFrame中更新分类列
            data_df.loc[idx, '交易类型'] = category
        
        # 统计分类结果
        category_counts = data_df['交易类型'].value_counts()
        print("\n分类统计:")
        for category, count in category_counts.items():
            print(f"  {category}: {count} 条")
        
        # 保存结果
        if output_path is None:
            return
            # # 默认输出路径
            # base_name = os.path.splitext(os.path.basename(excel_path))[0]
            # output_path = os.path.join(os.path.dirname(excel_path), f"{base_name}_classified.xlsx")
            # output_path = os.path.join(os.path.dirname(excel_path), f"{base_name}_classified.csv")
        
        try:
            data_df.to_excel(output_path, index=False)
            # data_df.to_csv(output_path, index=False)
            print(f"\n分类结果已保存到: {output_path}")
        except Exception as e:
            print(f"保存文件失败: {e}")
        
        return data_df
    
    def batch_classify_directory(self, directory_path: str, output_path: str = None) -> pd.DataFrame:
        """
        批量处理目录下的所有Excel文件
        
        Args:
            directory_path: 目录路径
            output_path: 输出文件路径（可选）
            
        Returns:
            合并后的DataFrame
        """
        print(f"开始批量处理目录: {directory_path}")
        
        # 查找目录下所有Excel文件
        excel_files = glob.glob(os.path.join(directory_path, "*.xlsx"))
        excel_files.extend(glob.glob(os.path.join(directory_path, "*.xls")))
        
        if not excel_files:
            print(f"目录中未找到Excel文件: {directory_path}")
            return pd.DataFrame()
        
        print(f"找到 {len(excel_files)} 个Excel文件:")
        for file in excel_files:
            print(f"  - {os.path.basename(file)}")
        
        all_data = []
        total_processed = 0
        
        # 处理每个文件
        for excel_file in excel_files:
            print(f"\n处理文件: {os.path.basename(excel_file)}")
            
            try:
                # 分类单个文件
                df = self.classify_excel(excel_file, output_path=None)  # 不保存单个文件
                
                if not df.empty:
                    # 添加来源文件信息
                    # df['来源文件'] = os.path.basename(excel_file)
                    all_data.append(df)
                    total_processed += len(df)
                    print(f"  成功处理 {len(df)} 条记录")
                else:
                    print(f"  处理失败或无数据")
                    
            except Exception as e:
                print(f"  处理文件时出错: {e}")
                continue
        
        if not all_data:
            print("没有成功处理任何文件")
            return pd.DataFrame()
        
        # 合并所有数据
        merged_df = pd.concat(all_data, ignore_index=True)
        
        # 按时间排序
        if '交易时间' in merged_df.columns:
            try:
                merged_df['交易时间'] = pd.to_datetime(merged_df['交易时间'])
                merged_df = merged_df.sort_values('交易时间', ascending=False)
            except Exception as e:
                print(f"时间排序失败: {e}")
        
        # 统计结果
        print(f"\n批量处理完成！")
        print(f"总共处理 {total_processed} 条交易记录")
        print(f"来自 {len(all_data)} 个文件")
        
        # 分类统计
        if '交易类型' in merged_df.columns:
            category_counts = merged_df['交易类型'].value_counts()
            print("\n总体分类统计:")
            for category, count in category_counts.items():
                print(f"  {category}: {count} 条")
        
        # 保存合并结果
        if output_path is None:
            output_path = os.path.join(directory_path, "wechat_all_classified.xlsx")
        
        try:
            merged_df.to_excel(output_path, index=False)
            print(f"\n合并结果已保存到: {output_path}")
        except Exception as e:
            print(f"保存文件失败: {e}")
        
        return merged_df
    
    def test_classification(self, excel_path: str):
        """
        测试分类功能，显示详细分类过程
        
        Args:
            excel_path: Excel文件路径
        """
        print("分类测试结果（前10条）:")
        print("-" * 80)
        
        # 读取Excel文件
        try:
            df = pd.read_excel(excel_path, sheet_name=0, header=None)
        except Exception as e:
            print(f"读取Excel文件失败: {e}")
            return
        
        # 查找实际数据开始行
        data_start_row = 0
        for i, row in df.iterrows():
            if i < 5:  # 跳过前5行说明
                continue
            交易时间 = str(row.iloc[0]) if pd.notna(row.iloc[0]) else ''
            if 交易时间 and ('2026-' in 交易时间 or '2025-' in 交易时间 or '2024-' in 交易时间):
                data_start_row = i
                break
        
        if data_start_row == 0:
            print("未找到实际交易数据")
            return
        
        # 获取实际数据
        data_df = df.iloc[data_start_row + 1:].copy()
        data_df.columns = [
            '交易时间', '交易类型', '交易对方', '商品', '收/支', '金额(元)', 
            '支付方式', '当前状态', '交易单号', '商户单号', '备注'
        ]
        
        # 移除空行
        data_df = data_df.dropna(subset=['交易时间']).copy()
        
        # 测试前10条
        for idx, (_, row) in enumerate(data_df.head(10).iterrows()):
            商品 = str(row.get('商品', '')).strip()
            交易对方 = str(row.get('交易对方', '')).strip()
            search_text = f"{商品}{交易对方}".lower()
            
            # 查找匹配的关键词
            matched_keyword = None
            matched_category = "其他"
            
            keyword_map = self._build_keyword_map()
            for keyword, category in sorted(keyword_map.items(), key=lambda x: len(x[0]), reverse=True):
                if keyword in search_text:
                    matched_keyword = keyword
                    matched_category = category
                    break
            
            print(f"第{idx+1}行:")
            print(f"  交易时间: {row.get('交易时间', '')}")
            print(f"  交易对方: {交易对方}")
            print(f"  商品: {商品}")
            print(f"  搜索文本: '{search_text}'")
            print(f"  匹配关键词: {matched_keyword}")
            print(f"  分类结果: {matched_category}")
            print("-" * 40)


def main():
    """主函数"""
    # 从命令行参数获取路径
    if len(sys.argv) < 2:
        print("使用方法:")
        print("  单个文件: python3 wechat_simple_classifier.py <excel_file_path>")
        print("  批量处理: python3 wechat_simple_classifier.py <directory_path>")
        print("示例:")
        print("  python3 wechat_simple_classifier.py wechat_03.xlsx")
        print("  python3 wechat_simple_classifier.py ./wechat_files/")
        return
    
    path = sys.argv[1]
    
    # 初始化分类器
    classifier = WeChatSimpleClassifier()
    
    # 判断是文件还是目录
    if os.path.isfile(path):
        # 单个文件处理
        print(f"处理单个文件: {path}")
        
        if not os.path.exists(path):
            print(f"文件不存在: {path}")
            return
        
        # 运行分类测试
        print("开始分类测试...")
        classifier.test_classification(path)
        
        print("\n" + "="*80)
        print("开始正式分类...")
        
        # 默认输出路径
        base_name = os.path.splitext(os.path.basename(path))[0]
        output_path = os.path.join(os.path.dirname(path), f"{base_name}_classified.xlsx")

        # 正式分类
        result_df = classifier.classify_excel(path, output_path)
        
        if not result_df.empty:
            print(f"\n分类完成！共处理 {len(result_df)} 条交易记录")
        else:
            print("\n分类失败！")
            
    elif os.path.isdir(path):
        # 批量处理目录
        print(f"批量处理目录: {path}")
        result_df = classifier.batch_classify_directory(path)
        
        if not result_df.empty:
            print(f"\n批量处理完成！共处理 {len(result_df)} 条交易记录")
        else:
            print("\n批量处理失败！")
    else:
        print(f"路径不存在或无效: {path}")


if __name__ == "__main__":
    main()
