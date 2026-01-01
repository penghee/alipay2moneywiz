import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { listFiles, searchFiles, getFile, getRandomFile } from './file-utils.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_DIR = path.join(process.cwd(), 'notes');

// Create MCP server using high-level API with environment configuration
const server = new McpServer({
  name: "obsidian-reader-mcp",
  version: "1.0.0",
  description: "Obsidian Vault Reader MCP for managing and searching Obsidian notes",
  env: {
    NOTES_DIR: {
      type: "string",
      description: "Base directory containing markdown notes",
      default: DEFAULT_DIR
    }
  }
});

// Get the configured notes directory from environment variables
const NOTES_DIR = process.env.NOTES_DIR || DEFAULT_DIR;

// Tool: List markdown files
server.registerTool(
  "list_markdown_files",
  {
    description: "List all markdown files in the notes directory with metadata.",
    inputSchema: {
      pattern: z.string().optional().default('**/*.md')
        .describe("Glob pattern to match files (e.g., '**/*.md')"),
      directory: z.string().optional().default(NOTES_DIR)
        .describe("Base directory to search in")
    }
  },
  async ({ pattern, directory = NOTES_DIR }) => {
    const files = await listFiles(directory, { pattern });
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          files,
          count: files.length,
          directory: path.resolve(directory)
        }, null, 2)
      }]
    };
  }
);

// Tool: Search markdown files
server.registerTool(
  "search_markdown_files",
  {
    description: "Search markdown files by content or filename.",
    inputSchema: {
      query: z.string().optional()
        .describe("Text to search in file content"),
      filename: z.string().optional()
        .describe("Filename pattern to match"),
      after: z.string().optional()
        .describe("Filter files modified after this date (YYYY-MM-DD)"),
      before: z.string().optional()
        .describe("Filter files modified before this date (YYYY-MM-DD)"),
      directory: z.string().optional().default(NOTES_DIR)
        .describe("Base directory to search in")
    }
  },
  async ({ query, filename, after, before, directory = NOTES_DIR }) => {
    const results = await searchFiles(directory, { query, filename, after, before });
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          results,
          count: results.length,
          query: { query, filename, after, before },
          directory: path.resolve(directory)
        }, null, 2)
      }]
    };
  }
);

// Tool: Get markdown file content
server.registerTool(
  "get_markdown_file",
  {
    description: "Get the content and metadata of a specific markdown file.",
    inputSchema: {
      path: z.string()
        .describe("Path to the markdown file (relative to notes directory or absolute)")
    }
  },
  async ({ path: filePath }) => {
    // If path is not absolute, resolve it relative to NOTES_DIR
    const fullPath = path.isAbsolute(filePath) 
      ? filePath 
      : path.join(NOTES_DIR, filePath);
    
    const file = await getFile(fullPath);
    
    return {
      content: [{
        type: "text",
        text: JSON.stringify(file, null, 2)
      }]
    };
  }
);

// Tool: Random walk - get a random note
server.registerTool(
  "random_walk",
  {
    description: "Get a random markdown file from the notes directory for review.",
    inputSchema: {
      pattern: z.string().optional().default('**/*.md')
        .describe("Pattern to filter files (e.g., '**/*.md' for all markdown files)"),
      directory: z.string().optional().default(NOTES_DIR)
        .describe("Base directory to search in")
    }
  },
  async ({ pattern, directory = NOTES_DIR }) => {
    try {
      const randomFile = await getRandomFile(directory, { pattern });
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            message: "Here's a random note for you to review:",
            file: randomFile,
            stats: {
              wordCount: randomFile.wordCount,
              lineCount: randomFile.lineCount,
              lastModified: randomFile.modifiedAt
            }
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            error: "Failed to get a random file",
            message: error.message
          }, null, 2)
        }]
      };
    }
  }
);

// Start the server with stdio transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log('✅ Markdown Reader MCP server started');
}

// Start the server
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
