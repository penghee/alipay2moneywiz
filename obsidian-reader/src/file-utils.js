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
  const files = await listFiles(rootDir, { pattern: filename ? `**/*${filename}*.md` : '**/*.md' });
  
  const filteredFiles = files.filter(file => {
    if (after && new Date(file.modifiedAt) < new Date(after)) return false;
    if (before && new Date(file.modifiedAt) > new Date(before)) return false;
    return true;
  });

  if (!query) return filteredFiles;

  const results = [];
  
  for (const file of filteredFiles) {
    try {
      const content = await fs.readFile(file.path, 'utf-8');
      const lines = content.split('\n');
      const matches = [];
      
      lines.forEach((line, index) => {
        if (line.toLowerCase().includes(query.toLowerCase())) {
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
        results.push({
          ...file,
          matches,
          matchCount: matches.length
        });
      }
    } catch (error) {
      console.error(`Error searching file ${file.path}:`, error);
    }
  }

  return results;
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
