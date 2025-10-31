#!/bin/bash

# 停止财务数据统计 Web 应用

echo "🚀 停止财务数据统计 Web 应用..."

# 停止服务器
# close port 3000
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# success
if [ $? -eq 0 ]; then
    echo "🚀 停止财务数据统计 Web 应用成功"
else
    echo "🚀 停止财务数据统计 Web 应用失败"
fi
