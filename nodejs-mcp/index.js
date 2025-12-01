import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { z } from "zod";
import { parse } from "csv-parse/sync";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data directory path (relative to project root)
const DATA_DIR = path.resolve(__dirname, "../data");

// Create MCP server using high-level API
const server = new McpServer({
  name: "csv-reader-mcp",
  version: "1.0.0",
});

// Helper: Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Helper: Find all files recursively in a directory
function findFilesRecursively(dir, pattern) {
  const results = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      results.push(...findFilesRecursively(fullPath, pattern));
    } else if (item.isFile() && pattern.test(item.name)) {
      results.push(path.relative(DATA_DIR, fullPath));
    }
  }
  
  return results;
}

// Helper: Get all CSV files in data directory and subdirectories
function getCsvFiles() {
  ensureDataDir();
  return findFilesRecursively(DATA_DIR, /\.csv$/i);
}

// Helper: Read and parse CSV file
function readCsvFile(filename, options = {}) {
  const filePath = path.join(DATA_DIR, filename);
  const resolvedPath = path.resolve(filePath);

  // Security check: prevent path traversal and ensure file exists
  if (!resolvedPath.startsWith(path.resolve(DATA_DIR)) || !fs.existsSync(resolvedPath)) {
    // Try to find the file in subdirectories if not found directly
    const allFiles = findFilesRecursively(DATA_DIR, new RegExp(`.*${path.basename(filename)}$`));
    if (allFiles.length === 0) {
      throw new Error(`File not found: ${filename}`);
    }
    // Use the first matching file found
    return readCsvFile(allFiles[0], options);
  }

  const content = fs.readFileSync(filePath, "utf-8");

  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    ...options,
  });

  return records;
}

// Tool: List CSV files
server.registerTool(
  "list_csv_files",
  {
    description: "List all CSV files available in the data directory. Returns an array of filenames.",
  },
  async () => {
    const files = getCsvFiles();
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              files,
              count: files.length,
              dataDirectory: DATA_DIR,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// Tool: Read CSV file
server.registerTool(
  "read_csv",
  {
    description: "Read a CSV file and return its contents as a JSON array. Each row becomes an object with column headers as keys.",
    inputSchema: {
      filename: z.string().describe("Name of the CSV file to read (e.g., 'data.csv')"),
    },
  },
  async ({ filename }) => {
    const records = readCsvFile(filename);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              filename,
              rowCount: records.length,
              data: records,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// Tool: Query CSV with filtering
server.registerTool(
  "query_csv",
  {
    description: "Read a CSV file with optional filtering. Supports limiting rows, selecting specific columns, and basic filtering.",
    inputSchema: {
      filename: z.string().describe("Name of the CSV file to read"),
      limit: z.number().optional().describe("Maximum number of rows to return (default: all)"),
      columns: z.array(z.string()).optional().describe("List of column names to include (default: all)"),
      filter: z.record(z.string()).optional().describe('Key-value pairs to filter rows (e.g., {"status": "active"})'),
    },
  },
  async ({ filename, limit, columns, filter }) => {
    let records = readCsvFile(filename);

    // Apply filter if provided
    if (filter && typeof filter === "object") {
      records = records.filter((row) => {
        return Object.entries(filter).every(([key, value]) => {
          return row[key] === value;
        });
      });
    }

    // Select specific columns if provided
    if (columns && Array.isArray(columns) && columns.length > 0) {
      records = records.map((row) => {
        const filtered = {};
        columns.forEach((col) => {
          if (col in row) {
            filtered[col] = row[col];
          }
        });
        return filtered;
      });
    }

    // Apply limit if provided
    if (limit && typeof limit === "number" && limit > 0) {
      records = records.slice(0, limit);
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              filename,
              rowCount: records.length,
              data: records,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// Tool: Get CSV schema
server.registerTool(
  "get_csv_schema",
  {
    description: "Get the schema (column names and sample data) of a CSV file. Useful for understanding the structure before querying.",
    inputSchema: {
      filename: z.string().describe("Name of the CSV file"),
    },
  },
  async ({ filename }) => {
    const records = readCsvFile(filename);
    const columns = records.length > 0 ? Object.keys(records[0]) : [];
    const sampleData = records.slice(0, 3);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              filename,
              totalRows: records.length,
              columns,
              columnCount: columns.length,
              sampleData,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// Start the server
async function main() {
  ensureDataDir();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("✅ CSV Reader MCP Server is ready!");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
