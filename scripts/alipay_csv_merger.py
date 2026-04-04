#!/usr/bin/env python3
"""
支付宝CSV文件合并器
合并目录下的所有支付宝CSV文件，保持原始编码格式，支持智能分类
"""

import os
import sys
import glob
import csv
import json
from typing import List, Dict


class AlipayCSVMerger:
    """支付宝CSV文件合并器"""
    
    def __init__(self, category_map_path: str = None):
        """初始化合并器"""
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
    
    def classify_transaction(self, counterparty: str, description: str) -> str:
        """
        分类交易
        
        Args:
            counterparty: 交易对方
            description: 商品说明
            
        Returns:
            分类名称
        """
        # 获取交易对方和商品说明字段
        counterparty = str(counterparty).strip()
        description = str(description).strip()
        
        # 合并搜索文本
        search_text = f"{counterparty}{description}".lower()
        
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
    
    def read_alipay_csv_records(self, file_path: str) -> List[Dict]:
        """
        读取支付宝CSV文件的数据记录
        
        Args:
            file_path: CSV文件路径
            
        Returns:
            数据记录列表（每行作为字典）
        """
        records = []
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
        except UnicodeDecodeError:
            # 如果UTF-8解码失败，尝试GBK编码
            try:
                with open(file_path, 'r', encoding='gbk') as f:
                    lines = f.readlines()
            except UnicodeDecodeError:
                # 最后尝试utf-8-sig
                with open(file_path, 'r', encoding='utf-8-sig') as f:
                    lines = f.readlines()
        
        header_found = False
        headers = []
        
        for line in lines:
            line = line.strip()
            
            # 检查是否是表头行（包含列名）
            if not header_found and "交易时间" in line and "交易分类" in line:
                header_found = True
                headers = [h.strip() for h in line.split(',')]
                continue
            
            # 检查是否是数据行（以日期开头）
            if header_found and line and len(line) > 10:
                # 检查是否以日期格式开头（YYYY-MM-DD）
                if len(line) >= 10 and line[4] == '-' and line[7] == '-':
                    # 这是一个数据行
                    values = [v.strip() for v in line.split(',')]
                    if len(values) >= len(headers):
                        row_dict = dict(zip(headers, values))
                        # 进行分类
                        if '交易分类' in row_dict and '交易对方' in row_dict and '商品说明' in row_dict:
                            new_category = self.classify_transaction(
                                row_dict['交易对方'], 
                                row_dict['商品说明']
                            )
                            row_dict['交易分类'] = new_category
                        records.append(row_dict)
        
        return records
    
    def merge_csv_files(self, directory_path: str, output_path: str = None) -> str:
        """
        合并目录下的所有支付宝CSV文件
        
        Args:
            directory_path: 目录路径
            output_path: 输出文件路径（可选）
            
        Returns:
            输出文件路径
        """
        print(f"开始合并目录: {directory_path}")
        
        # 查找目录下所有CSV文件
        csv_files = glob.glob(os.path.join(directory_path, "*.csv"))
        
        # 过滤出支付宝相关的文件
        
        if not csv_files:
            print(f"目录中未找到支付宝CSV文件: {directory_path}")
            return ""
        
        print(f"找到 {len(csv_files)} 个支付宝CSV文件:")
        for file in csv_files:
            print(f"  - {os.path.basename(file)}")
        
        all_records = []
        total_records = 0
        header_written = False
        
        # 处理每个文件
        for csv_file in csv_files:
            print(f"\n处理文件: {os.path.basename(csv_file)}")
            
            try:
                # 读取文件记录
                records = self.read_alipay_csv_records(csv_file)
                
                if records:
                    all_records.extend(records)
                    total_records += len(records)
                    print(f"  成功读取 {len(records)} 条记录")
                else:
                    print(f"  未找到数据记录")
                    
            except Exception as e:
                print(f"  处理文件时出错: {e}")
                continue
        
        if not all_records:
            print("没有成功读取任何数据记录")
            return ""
        
        # 设置输出路径
        if output_path is None:
            output_path = os.path.join(directory_path, "alipay_all_merged.csv")
        
        # 写入合并后的文件
        try:
            with open(output_path, 'w', encoding='gbk', newline='') as f:
                # 写入表头（使用支付宝CSV的标准表头）
                if all_records:
                    headers = list(all_records[0].keys())
                    f.write(','.join(headers) + '\n')
                    
                    # 写入所有数据记录
                    for record in all_records:
                        # 将字典转换为CSV行
                        row_values = []
                        for header in headers:
                            value = str(record.get(header, '')).replace(',', '，')  # 替换逗号避免CSV混乱
                            row_values.append(value)
                        f.write(','.join(row_values) + '\n')
            
            print(f"\n合并完成！")
            print(f"总共合并 {total_records} 条交易记录")
            print(f"来自 {len(csv_files)} 个文件")
            print(f"合并结果已保存到: {output_path}")
            
            # 分类统计
            if '交易分类' in all_records[0]:
                category_counts = {}
                for record in all_records:
                    category = record.get('交易分类', '其他')
                    category_counts[category] = category_counts.get(category, 0) + 1
                
                print("\n分类统计:")
                for category, count in sorted(category_counts.items(), key=lambda x: x[1], reverse=True):
                    print(f"  {category}: {count} 条")
            
        except Exception as e:
            print(f"保存文件失败: {e}")
            return ""
        
        return output_path
    
    def test_csv_reading(self, file_path: str):
        """
        测试CSV文件读取，显示前几行数据
        
        Args:
            file_path: CSV文件路径
        """
        print(f"测试读取文件: {file_path}")
        print("-" * 80)
        
        try:
            records = self.read_alipay_csv_records(file_path)
            
            print(f"读取到 {len(records)} 条记录")
            print("\n前5条记录:")
            for i, record in enumerate(records[:5]):
                print(f"第{i+1}行:")
                for key, value in record.items():
                    print(f"  {key}: {value}")
                print("-" * 40)
                
        except Exception as e:
            print(f"读取文件失败: {e}")


def main():
    """主函数"""
    # 从命令行参数获取路径
    if len(sys.argv) < 2:
        print("使用方法:")
        print("  合并目录: python3 alipay_csv_merger.py <directory_path>")
        print("  测试文件: python3 alipay_csv_merger.py test <csv_file_path>")
        print("示例:")
        print("  python3 alipay_csv_merger.py ./alipay_files/")
        print("  python3 alipay_csv_merger.py test alipay_03.csv")
        return
    
    path = sys.argv[1]
    
    # 初始化合并器
    merger = AlipayCSVMerger()
    
    if path == "test" and len(sys.argv) >= 3:
        # 测试单个文件
        csv_file = sys.argv[2]
        if not os.path.exists(csv_file):
            print(f"文件不存在: {csv_file}")
            return
        
        merger.test_csv_reading(csv_file)
        
    elif os.path.isdir(path):
        # 合并目录
        result_path = merger.merge_csv_files(path)
        
        if result_path:
            print(f"\n✅ 合并成功！")
            print(f"📁 输出文件: {result_path}")
        else:
            print("\n❌ 合并失败！")
    else:
        print(f"路径不存在或无效: {path}")


if __name__ == "__main__":
    main()
