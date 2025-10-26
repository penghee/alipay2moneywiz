import path from 'path';
import fs from 'fs';

// 项目根目录（app 目录的父目录）
const PROJECT_ROOT = path.join(process.cwd(), '..');

/**
 * 获取数据目录路径
 * 优先级：
 * 1. 环境变量 MONEY_DATA_PATH（绝对路径）
 * 2. 环境变量 MONEY_DATA_DIR（相对于项目根目录）
 * 3. 默认值：../data（相对于 app 目录）
 */
export function getDataDirectory(): string {
  // 如果设置了绝对路径
  if (process.env.MONEY_DATA_PATH) {
    return process.env.MONEY_DATA_PATH;
  }

  // 如果设置了相对路径（相对于项目根目录）
  if (process.env.MONEY_DATA_DIR) {
    return path.join(PROJECT_ROOT, process.env.MONEY_DATA_DIR);
  }

  // 默认路径
  return path.join(PROJECT_ROOT, 'data');
}

/**
 * 获取指定年份的数据目录
 */
export function getYearDataDirectory(year: number | string): string {
  return path.join(getDataDirectory(), year.toString());
}

/**
 * 获取配置文件目录
 */
export function getConfigDirectory(): string {
  return path.join(process.cwd(), 'src', 'config');
}

/**
 * 获取映射文件路径
 */
export function getMapFilePath(filename: string): string {
  return path.join(getConfigDirectory(), filename);
}

/**
 * 确保目录存在，如果不存在则创建
 */
export function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * 数据目录配置
 */
export const DATA_PATHS = {
  // 项目根目录
  projectRoot: PROJECT_ROOT,
  
  // 获取数据根目录
  root: getDataDirectory,
  
  // 获取年份目录
  year: getYearDataDirectory,
  
  // 获取配置目录
  config: getConfigDirectory,
  
  // 获取映射文件路径
  maps: {
    account: () => getMapFilePath('account_map.json'),
    category: () => getMapFilePath('category_map.json'),
    budget: () => getMapFilePath('budget_config.json'),
  },
  
  // 确保数据目录存在
  ensureDataDirectory: () => {
    ensureDirectoryExists(getDataDirectory());
  },
  
  // 确保年份目录存在
  ensureYearDirectory: (year: number | string) => {
    const yearDir = getYearDataDirectory(year);
    ensureDirectoryExists(yearDir);
    return yearDir;
  },
  
  // 确保预算配置文件存在
  ensureBudgetConfigExists: () => {
    const configPath = DATA_PATHS.maps.budget();
    try {
      fs.readFileSync(configPath, 'utf-8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // 如果文件不存在，创建默认配置
        const configDir = path.dirname(configPath);
        if (!fs.existsSync(configDir)) {
          fs.mkdirSync(configDir, { recursive: true });
        }
        fs.writeFileSync(configPath, JSON.stringify({}, null, 2), 'utf-8');
      } else {
        throw error;
      }
    }
  }
} as const;
