import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { default as glob } from 'fast-glob';

/**
 * Get file stats and basic metadata
 * @param {string} filePath - Path to the file
 * @returns {Promise<Object>} File metadata
 */
async function getFileMetadata(filePath) {
  try {
    const stats = await fs.stat(filePath);
    const content = await fs.readFile(filePath, 'utf-8');
    const { data: frontmatter } = matter(content);
    
    return {
      path: filePath,
      name: path.basename(filePath),
      extension: path.extname(filePath).toLowerCase(),
      size: stats.size,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime,
      frontmatter,
      hasContent: content.trim().length > 0
    };
  } catch (error) {
    console.error(`Error reading file metadata for ${filePath}:`, error);
    throw error;
  }
}

/**
 * List all markdown files in a directory with metadata
 * @param {string} rootDir - Root directory to search
 * @param {Object} options - Search options
 * @param {string} options.pattern - File pattern to match
 * @returns {Promise<Array>} Array of file metadata objects
 */
async function listFiles(rootDir, options = {}) {
  const { pattern = '**/*.md' } = options;
  const files = await glob(pattern, {
    cwd: rootDir,
    absolute: true,
    ignore: ['**/node_modules/**', '**/.git/**'],
    onlyFiles: true,
    caseSensitiveMatch: false,
    dot: true
  });

  return Promise.all(files.map(file => getFileMetadata(file)));
}

/**
 * Search files by content or filename
 * @param {string} rootDir - Root directory to search
 * @param {Object} options - Search options
 * @param {string} [options.query=''] - Text to search in file content
 * @param {string} [options.filename=''] - Filename pattern to match
 * @param {Date} [options.after] - Filter files modified after this date
 * @param {Date} [options.before] - Filter files modified before this date
 * @returns {Promise<Array>} Array of matching files with snippets
 */
async function searchFiles(rootDir, options = {}) {
  const { query = '', filename = '', after, before } = options;
  
  // 首先获取所有 markdown 文件
  const files = await listFiles(rootDir, { pattern: '**/*.md' });
  
  // 过滤文件
  const filteredFiles = files.filter(file => {
    // 按修改时间过滤
    if (after && new Date(file.modifiedAt) < new Date(after)) return false;
    if (before && new Date(file.modifiedAt) > new Date(before)) return false;
    
    // 按文件名过滤（支持模糊匹配）
    if (filename) {
      const normalizedPath = file.path.toLowerCase().normalize('NFKC');
      const searchTerm = filename.toLowerCase().normalize('NFKC');
      // Remove all spaces for better matching
      const normalizedSearch = searchTerm.replace(/\s+/g, '');
      const normalizedPathNoSpaces = normalizedPath.replace(/\s+/g, '');
      
      if (!normalizedPathNoSpaces.includes(normalizedSearch)) {
        return false;
      }
    }
    
    return true;
  });

  // 如果没有搜索词，直接返回过滤后的文件列表
  if (!query) return filteredFiles;

  const results = [];
  // Normalize and clean the query
  const normalizedQuery = query.toLowerCase()
    .normalize('NFKC')
    .replace(/\s+/g, '');
  
  for (const file of filteredFiles) {
    try {
      const content = await fs.readFile(file.path, 'utf-8');
      const lines = content.split('\n');
      const matches = [];
      
      // 检查文件名是否匹配
      const normalizedPath = file.path.toLowerCase()
        .normalize('NFKC')
        .replace(/\s+/g, '');
      if (normalizedPath.includes(normalizedQuery)) {
        matches.push({
          line: 0,
          content: `文件名匹配: ${path.basename(file.path)}`,
          snippet: [{
            line: 0,
            content: `文件路径: ${file.path}`,
            isMatch: true
          }]
        });
      }

      // 检查文件内容
      const normalizedContentQuery = query.toLowerCase().normalize('NFKC');
      lines.forEach((line, index) => {
        const normalizedLine = line.toLowerCase().normalize('NFKC');
        if (normalizedLine.includes(normalizedContentQuery)) {
          matches.push({
            line: index + 1,
            content: line.trim(),
            snippet: lines
              .slice(Math.max(0, index - 1), index + 2)
              .map((l, i) => ({
                line: index - 1 + i,
                content: l,
                isMatch: i === 1
              }))
          });
        }
      });

      if (matches.length > 0) {
        // 计算匹配度分数
        const score = calculateMatchScore(file.path, query, matches);
        
        results.push({
          ...file,
          matches,
          matchCount: matches.length,
          score
        });
      }
    } catch (error) {
      console.error(`Error searching file ${file.path}:`, error);
    }
  }

  // 按匹配度排序
  return results.sort((a, b) => b.score - a.score);
}

// 计算匹配度分数
function calculateMatchScore(filePath, query, matches) {
  let score = 0;
  const normalizedQuery = query.toLowerCase().replace(/\s+/g, '');
  const normalizedPath = filePath.toLowerCase().replace(/\s+/g, '');
  
  // 文件名完全匹配得分最高
  const fileName = path.basename(filePath, '.md');
  if (fileName.toLowerCase() === normalizedQuery) {
    score += 100;
  }
  
  // 文件名包含查询词
  if (normalizedPath.includes(normalizedQuery)) {
    score += 50;
  }
  
  // 匹配数量
  score += matches.length * 5;
  
  return score;
}

/**
 * Get file content with metadata
 * @param {string} filePath - Path to the file
 * @returns {Promise<Object>} File content and metadata
 */
async function getFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const { data: frontmatter, content: markdown } = matter(content);
    
    return {
      ...(await getFileMetadata(filePath)),
      content: markdown.trim(),
      frontmatter,
      wordCount: markdown.split(/\s+/).filter(Boolean).length,
      lineCount: markdown.split('\n').length
    };
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    throw error;
  }
}

/**
 * Get a random markdown file from the directory
 * @param {string} rootDir - Root directory to search
 * @param {Object} options - Search options
 * @param {string} [options.pattern] - File pattern to match (e.g., '**\/*.md')
 * @returns {Promise<Object>} Randomly selected file metadata and content
 */
async function getRandomFile(rootDir, options = {}) {
  const { pattern = '**/*.md' } = options;
  const files = await listFiles(rootDir, { pattern });
  
  if (files.length === 0) {
    throw new Error('No markdown files found');
  }
  
  // Select a random file
  const randomIndex = Math.floor(Math.random() * files.length);
  const randomFile = files[randomIndex];
  
  // Get the full content of the selected file
  const fileContent = await getFile(randomFile.path);
  
  return {
    ...randomFile,
    ...fileContent,
    isRandom: true
  };
}

export {
  listFiles,
  searchFiles,
  getFile,
  getFileMetadata,
  getRandomFile
};
