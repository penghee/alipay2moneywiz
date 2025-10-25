import path from 'path';

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
    return path.join(process.cwd(), '..', process.env.MONEY_DATA_DIR);
  }

  // 默认路径
  return path.join(process.cwd(), '..', 'data');
}

/**
 * 获取指定年份的数据目录
 */
export function getYearDataDirectory(year: number): string {
  return path.join(getDataDirectory(), year.toString());
}

/**
 * 获取配置文件目录
 */
export function getConfigDirectory(): string {
  return path.join(process.cwd(), 'src', 'config');
}

/**
 * 数据目录配置
 */
export const DATA_PATHS = {
  // 获取数据根目录
  root: getDataDirectory,
  
  // 获取年份目录
  year: getYearDataDirectory,
  
  // 获取配置目录
  config: getConfigDirectory,
} as const;
