# 财务数据统计 Web 应用

这是一个基于 Next.js 的财务数据统计 Web 应用，用于查看和分析您的财务数据。

## 功能特性

- 📊 **年度统计**: 查看全年的收入、支出和结余情况
- 📈 **月度统计**: 详细的月度财务分析和分类统计
- 🎨 **可视化图表**: 使用 Recharts 库提供丰富的图表展示
- 📱 **响应式设计**: 支持桌面和移动设备
- 🎯 **分类分析**: 详细的支出分类统计和占比分析

## 技术栈

- **Next.js 14**: React 框架
- **TypeScript**: 类型安全
- **Tailwind CSS**: 样式框架
- **Recharts**: 图表库
- **Lucide React**: 图标库

## 项目结构

```
app/
├── src/
│   ├── app/
│   │   ├── api/                    # API 路由
│   │   │   ├── years/             # 年份相关 API
│   │   │   └── stats/             # 统计数据 API
│   │   ├── year/[year]/           # 年度统计页面
│   │   │   └── month/[month]/     # 月度统计页面
│   │   ├── globals.css            # 全局样式
│   │   ├── layout.tsx             # 根布局
│   │   └── page.tsx               # 首页
│   └── lib/
│       └── data.ts                # 数据处理工具
├── package.json
└── README.md
```

## 数据格式

应用读取 `../data/` 目录下的 CSV 文件，支持以下格式：

```csv
账户,转账,描述,交易对方,分类,日期,备注,标签,金额
招商信用卡2542,未知账户,退款-平安好车主预支付,,交通,2025-07-28,,,78.85
```

## 安装和运行

1. 安装依赖：
```bash
npm install
```

2. 启动开发服务器：
```bash
npm run dev
```

3. 访问应用：
打开浏览器访问 [http://localhost:3000](http://localhost:3000)

## API 接口

### 获取可用年份
```
GET /api/years
```

### 获取指定年份的月份
```
GET /api/years/[year]/months
```

### 获取年度统计
```
GET /api/stats/yearly/[year]
```

### 获取月度统计
```
GET /api/stats/monthly/[year]/[month]
```

## 页面路由

- `/` - 首页，显示所有可用年份
- `/year/[year]` - 年度统计页面
- `/year/[year]/month/[month]` - 月度统计页面

## 开发说明

### 数据目录结构
```
data/
├── 2025/
│   ├── 01.csv
│   ├── 02.csv
│   └── ...
└── 2024/
    ├── 01.csv
    └── ...
```

### 数据处理
- 支持正数（收入）和负数（支出）
- 自动计算结余（收入 - 支出）
- 按分类统计支出情况
- 支持中文格式的金额显示

### 图表类型
- 折线图：月度趋势
- 柱状图：收支对比
- 饼图：分类分布
- 条形图：分类金额

## 部署

可以使用 Vercel、Netlify 等平台部署：

```bash
npm run build
npm start
```

## 注意事项

1. 确保 `data` 目录中有有效的 CSV 文件
2. CSV 文件需要包含正确的列名
3. 金额字段应为数字格式
4. 日期格式建议使用 YYYY-MM-DD

## 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目！