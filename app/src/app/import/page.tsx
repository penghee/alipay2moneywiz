'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, CheckCircle, AlertCircle, FileText, Calendar } from 'lucide-react';
import FileUpload from '@/components/FileUpload';

interface BillOwner {
  id: string;
  name: string;
}

interface BillOwnersData {
  defaultOwner: string;
  owners: BillOwner[];
}

interface UploadResult {
  success: boolean;
  message: string;
  records: number;
  year: number;
  month: number;
  outputPath: string;
}

export default function ImportPage() {
  const [billOwners, setBillOwners] = useState<BillOwnersData>({ defaultOwner: '爸爸', owners: [] });

  useEffect(() => {
    // Load bill owners data
    const loadBillOwners = async () => {
      try {
        // Use dynamic import for the JSON file
        const billOwnersData = await import('@/config/bill_owners.json');
        setBillOwners(billOwnersData);
      } catch (error) {
        console.error('Failed to load bill owners:', error);
        // Fallback to default values if loading fails
        setBillOwners({
          defaultOwner: '爸爸',
          owners: [
            { id: 'father', name: '爸爸' },
            { id: 'mother', name: '妈妈' },
            { id: 'zhaozhao', name: '昭昭' }
          ]
        });
      }
    };

    loadBillOwners();
  }, []);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleUpload = async (file: File, platform: string, owner: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('platform', platform);
      formData.append('owner', owner);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || '上传失败');
      }
    } catch (err) {
      setError('网络错误，请重试');
      console.error('Upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewStats = () => {
    if (result) {
      router.push(`/year/${result.year}`);
    }
  };

  const handleImportMore = () => {
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>返回</span>
          </button>
          
          <div className="flex items-center space-x-3">
            <Upload className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              导入账单文件
            </h1>
          </div>
        </div>

        {/* 成功结果 */}
        {result && (
          <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
              <h3 className="text-lg font-semibold text-green-800">
                导入成功！
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-blue-600 mr-2" />
                  <div>
                    <p className="text-sm text-gray-600">导入记录</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {result.records} 条
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-green-600 mr-2" />
                  <div>
                    <p className="text-sm text-gray-600">数据时间</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {result.year}年{result.month}月
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-purple-600 mr-2" />
                  <div>
                    <p className="text-sm text-gray-600">存储位置</p>
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {result.outputPath.split('/').pop()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleViewStats}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
              >
                <Calendar className="h-4 w-4 mr-2" />
                查看统计
              </button>
              <button
                onClick={handleImportMore}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center"
              >
                <Upload className="h-4 w-4 mr-2" />
                继续导入
              </button>
            </div>
          </div>
        )}

        {/* 错误信息 */}
        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <AlertCircle className="h-6 w-6 text-red-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-red-800">
                  导入失败
                </h3>
                <p className="text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* 文件上传组件 */}
        <FileUpload 
          onUpload={handleUpload} 
          loading={loading}
          owners={billOwners.owners}
          defaultOwner={billOwners.defaultOwner}
        />

        {/* 导入历史 */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            导入说明
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">支付宝账单</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 支持 CSV 格式文件</li>
                <li>• 包含交易时间、商品说明等字段</li>
                <li>• 自动识别收入/支出类型</li>
                <li>• 智能分类和账户映射</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">微信账单</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 支持 XLSX 格式文件</li>
                <li>• 包含交易时间、商品等字段</li>
                <li>• 自动识别收入/支出类型</li>
                <li>• 智能分类和账户映射</li>
              </ul>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              数据处理流程
            </h4>
            <ol className="text-xs text-blue-800 space-y-1">
              <li>1. 解析文件内容，提取交易记录</li>
              <li>2. 根据映射规则进行账户和分类匹配</li>
              <li>3. 按年月自动分类存储到 data 目录</li>
              <li>4. 合并到月度汇总文件中</li>
              <li>5. 更新统计数据和图表</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
