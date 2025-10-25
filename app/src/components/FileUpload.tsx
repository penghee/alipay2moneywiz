'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface FileUploadProps {
  onUpload: (file: File, platform: string) => Promise<void>;
  loading: boolean;
}

export default function FileUpload({ onUpload, loading }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [platform, setPlatform] = useState<'alipay' | 'wechat'>('alipay');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFile && platform) {
      await onUpload(selectedFile, platform);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Upload className="h-5 w-5 mr-2" />
        导入账单文件
      </h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 平台选择 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            选择平台
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="platform"
                value="alipay"
                checked={platform === 'alipay'}
                onChange={(e) => setPlatform(e.target.value as 'alipay')}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">支付宝</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="platform"
                value="wechat"
                checked={platform === 'wechat'}
                onChange={(e) => setPlatform(e.target.value as 'wechat')}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">微信</span>
            </label>
          </div>
        </div>

        {/* 文件上传区域 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            选择文件
          </label>
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileInput}
              className="hidden"
            />
            
            {selectedFile ? (
              <div className="space-y-2">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto" />
                <p className="text-sm text-gray-600">
                  <FileText className="h-4 w-4 inline mr-1" />
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  重新选择
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                <div>
                  <p className="text-sm text-gray-600">
                    拖拽文件到此处，或
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-blue-600 hover:text-blue-800 ml-1"
                    >
                      点击选择文件
                    </button>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    支持 CSV、XLSX 格式，最大 10MB
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 提交按钮 */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={resetForm}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            重置
          </button>
          <button
            type="submit"
            disabled={!selectedFile || loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                处理中...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                导入文件
              </>
            )}
          </button>
        </div>
      </form>

      {/* 使用说明 */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center">
          <AlertCircle className="h-4 w-4 mr-1" />
          使用说明
        </h4>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• 支付宝：支持 CSV 格式的账单文件</li>
          <li>• 微信：支持 XLSX 格式的账单文件</li>
          <li>• 文件将自动按年月分类存储到 data 目录</li>
          <li>• 系统会自动识别交易类型并进行分类</li>
        </ul>
      </div>
    </div>
  );
}
