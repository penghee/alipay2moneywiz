# 环境变量配置说明

## 数据目录配置

本应用支持通过环境变量自定义数据目录位置。

### 配置方式

在 `app` 目录下创建 `.env.local` 文件（该文件不会被 git 追踪），添加以下配置：

#### 方式 1：使用绝对路径（推荐）

```bash
# 指定数据目录的绝对路径
MONEY_DATA_PATH=/Users/yourname/Documents/money-data
```

#### 方式 2：使用相对路径

```bash
# 相对于项目根目录（alipay2moneywiz）的路径
MONEY_DATA_DIR=money-data
```

### 优先级

1. `MONEY_DATA_PATH`（绝对路径）- 最高优先级
2. `MONEY_DATA_DIR`（相对路径）- 次优先级
3. 默认值：`../money-data`（相对于 app 目录）

### 示例配置

#### 示例 1：数据存放在用户文档目录

```bash
# .env.local
MONEY_DATA_PATH=/Users/penghee/Documents/money-data
```

#### 示例 2：数据存放在外部硬盘

```bash
# .env.local
MONEY_DATA_PATH=/Volumes/ExternalDrive/money-data
```

#### 示例 3：使用项目根目录下的 money-data

```bash
# .env.local
MONEY_DATA_DIR=money-data
```

### 目录结构要求

无论使用哪种配置方式，数据目录的结构必须如下：

```
money-data/
├── 2024/
│   ├── 01.csv
│   ├── 02.csv
│   ├── 01_alipay.csv  (可选，原始数据)
│   ├── 01_wechat.csv  (可选，原始数据)
│   └── ...
├── 2025/
│   ├── 01.csv
│   └── ...
└── ...
```

### 应用配置

1. 复制示例配置：
   ```bash
   cd app
   cp ENV.md .env.local
   ```

2. 编辑 `.env.local`，设置你的数据目录路径

3. 重启开发服务器：
   ```bash
   npm run dev
   ```

### 验证配置

启动应用后，在控制台会输出当前使用的数据目录路径：

```
Current working directory: /path/to/alipay2moneywiz/app
Data directory: /Users/yourname/Documents/money-data
```

### 注意事项

- `.env.local` 文件已被 `.gitignore` 忽略，不会提交到 git
- 修改环境变量后需要重启 Next.js 开发服务器
- 确保配置的目录路径存在且有读取权限
- Windows 用户请使用正斜杠 `/` 或双反斜杠 `\\` 作为路径分隔符
