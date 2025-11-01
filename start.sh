#!/bin/bash

# 启动财务数据统计 Web 应用

echo "🚀 启动财务数据统计 Web 应用..."
echo "📊 应用将读取 ./data 目录中的 CSV 文件"
echo "🌐 访问地址: http://localhost:3000"
echo ""

# 检查是否存在 data 目录
if [ ! -d "./data" ]; then
    echo "⚠️  警告: 未找到 ./data 目录"
    echo "   请确保在项目根目录的 data 文件夹中有 CSV 文件"
    echo ""
fi
# 确保 npm install
npm install
npm run build

# 启动服务器
npm run start
