#!/usr/bin/env python3
"""
支付宝CSV文件合并器
合并目录下的所有支付宝CSV文件，保持原始编码格式
"""

import os
import sys
import glob
import csv
from typing import List


class AlipayCSVMerger:
    """支付宝CSV文件合并器"""
    
    def __init__(self):
        """初始化合并器"""
        pass
    
    def read_alipay_csv_records(self, file_path: str) -> List[str]:
        """
        读取支付宝CSV文件的数据记录
        
        Args:
            file_path: CSV文件路径
            
        Returns:
            数据记录列表（每行作为一个字符串）
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
        
        in_data_section = False
        header_found = False
        
        for line in lines:
            line = line.strip()
            
            # 检查是否是表头行（包含列名）
            if not header_found and "交易时间" in line and "交易分类" in line:
                header_found = True
                # 保存表头，但只在第一个文件中保留
                continue
            
            # 检查是否是数据行（以日期开头）
            if header_found and line and len(line) > 10:
                # 检查是否以日期格式开头（YYYY-MM-DD）
                if len(line) >= 10 and line[4] == '-' and line[7] == '-':
                    # 这是一个数据行
                    records.append(line)
        
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
                header = "交易时间,交易分类,交易对方,对方账号,商品说明,收/支,金额,收/付款方式,交易状态,交易订单号,商家订单号,备注,"
                f.write(header + '\n')
                
                # 写入所有数据记录
                for record in all_records:
                    f.write(record + '\n')
            
            print(f"\n合并完成！")
            print(f"总共合并 {total_records} 条交易记录")
            print(f"来自 {len(csv_files)} 个文件")
            print(f"合并结果已保存到: {output_path}")
            
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
                print(f"第{i+1}行: {record}")
                
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
