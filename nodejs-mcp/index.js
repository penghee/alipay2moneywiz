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
              note: "Use query_transactions for more advanced querying capabilities"
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// Note: The following tools have been removed as their functionality is now covered by query_transactions:
// - get_monthly_summary: Use query_transactions with groupBy and aggregations
// - get_top_expenses: Use query_transactions with sorting and filtering
// - analyze_by_category: Use query_transactions with groupBy and aggregations
// - query_by_bill_person: Use query_transactions with filters

// Example of how to use query_transactions for common scenarios:
/*
1. Get monthly summary (replaces get_monthly_summary):
{
  "groupBy": ["date"],
  "aggregations": [
    { "field": "amount", "op": "sum", "as": "total_amount" },
    { "field": "amount", "op": "avg", "as": "avg_amount" },
    { "field": "*", "op": "count", "as": "transaction_count" }
  ],
  "sortBy": [{ "field": "date", "direction": "asc" }]
}

2. Get top expenses (replaces get_top_expenses):
{
  "filters": [
    { "field": "amount", "operator": "lessThan", "value": "0" }
  ],
  "sortBy": [{ "field": "amount", "direction": "asc" }],
  "limit": 10
}

3. Analyze by category (replaces analyze_by_category):
{
  "groupBy": ["category"],
  "aggregations": [
    { "field": "amount", "op": "sum", "as": "total" },
    { "field": "amount", "op": "avg", "as": "average" },
    { "field": "*", "op": "count", "as": "count" }
  ],
  "sortBy": [{ "field": "total", "direction": "desc" }]
}

4. Query by bill person (replaces query_by_bill_person):
{
  "filters": [
    { "field": "billPerson", "operator": "equals", "value": "爸爸" },
    { "field": "date", "operator": "startsWith", "value": "2025" }
  ],
  "sortBy": [{ "field": "date", "direction": "desc" }],
  "limit": 50
}
*/

// Helper: Parse filter conditions
function parseFilter(record, filter) {
  const { field, operator, value } = filter;
  const recordValue = record[field];
  
  if (recordValue === undefined) return false;
  
  switch (operator) {
    case 'equals': 
      return String(recordValue) === String(value);
    case 'notEquals':
      return String(recordValue) !== String(value);
    case 'contains':
      return String(recordValue).toLowerCase().includes(String(value).toLowerCase());
    case 'notContains':
      return !String(recordValue).toLowerCase().includes(String(value).toLowerCase());
    case 'startsWith':
      return String(recordValue).toLowerCase().startsWith(String(value).toLowerCase());
    case 'endsWith':
      return String(recordValue).toLowerCase().endsWith(String(value).toLowerCase());
    case 'greaterThan':
      return parseFloat(recordValue) > parseFloat(value);
    case 'lessThan':
      return parseFloat(recordValue) < parseFloat(value);
    case 'between':
      return Array.isArray(value) && 
             value.length === 2 &&
             parseFloat(recordValue) >= parseFloat(value[0]) && 
             parseFloat(recordValue) <= parseFloat(value[1]);
    case 'in':
      return Array.isArray(value) && value.includes(recordValue);
    case 'notIn':
      return Array.isArray(value) && !value.includes(recordValue);
    case 'isNull':
      return recordValue === null || recordValue === undefined || recordValue === '';
    case 'isNotNull':
      return recordValue !== null && recordValue !== undefined && recordValue !== '';
    default:
      return true;
  }
}

// Helper: Sort records
function sortRecords(records, sortBy) {
  if (!sortBy || sortBy.length === 0) return records;
  
  return [...records].sort((a, b) => {
    for (const { field, direction = 'asc' } of sortBy) {
      let aVal = a[field];
      let bVal = b[field];
      
      // Handle undefined/null values
      if (aVal === undefined || aVal === null) aVal = '';
      if (bVal === undefined || bVal === null) bVal = '';
      
      // Numeric comparison if both values are numbers
      if (!isNaN(aVal) && !isNaN(bVal)) {
        const numA = parseFloat(aVal);
        const numB = parseFloat(bVal);
        if (numA !== numB) {
          return direction === 'asc' ? numA - numB : numB - numA;
        }
      } 
      // String comparison
      else {
        const strA = String(aVal).toLowerCase();
        const strB = String(bVal).toLowerCase();
        if (strA !== strB) {
          return direction === 'asc' 
            ? strA.localeCompare(strB) 
            : strB.localeCompare(strA);
        }
      }

      return 0;
    }
  });
}

// Tool: Advanced Transaction Query
server.registerTool(
  'query_transactions',
  {
    description: `Advanced query for transaction data with filtering, sorting, and aggregation.

Available Fields (use exact Chinese field names):
- 账户 (account)
- 转账 (transfer)
- 描述 (description)
- 交易对方 (counterparty)
- 分类 (category)
- 日期 (date, format: YYYY/MM/DD)
- 备注 (notes)
- 标签 (tags)
- 金额 (amount, positive for income, negative for expenses)
- 账单人 (bill person, e.g. "爸爸", "妈妈")

Example Query:
{
  "filters": [
    { "field": "账单人", "operator": "in", "value": ["爸爸", "妈妈"] },
    { "field": "日期", "operator": "startsWith", "value": "2025" },
    { "field": "金额", "operator": "greaterThan", "value": "0" }
  ],
  "groupBy": ["账单人"],
  "aggregations": [
    { "field": "金额", "op": "sum", "as": "total_income" }
  ]
}`,
    inputSchema: {
      filters: z.array(z.object({
        field: z.string().describe('Field name to filter on'),
        operator: z.enum([
          'equals', 'notEquals', 'contains', 'notContains', 
          'startsWith', 'endsWith', 'greaterThan', 'lessThan',
          'between', 'in', 'notIn', 'isNull', 'isNotNull'
        ]).describe('Comparison operator'),
        value: z.any().optional().describe('Value to compare against')
      })).optional(),
      sortBy: z.array(z.object({
        field: z.string().describe('Field to sort by'),
        direction: z.enum(['asc', 'desc']).default('asc')
      })).optional(),
      fields: z.array(z.string()).optional().describe('Fields to include in results'),
      groupBy: z.array(z.string()).optional().describe('Fields to group by for aggregation'),
      aggregations: z.array(z.object({
        field: z.string(),
        op: z.enum(['sum', 'avg', 'min', 'max', 'count']),
        as: z.string().optional()
      })).optional(),
      limit: z.number().min(1).max(1000).default(100),
      offset: z.number().min(0).default(0),
      includeTotals: z.boolean().default(false).describe('Include total count and sums')
    },
  },
  async ({ 
    filters = [], 
    sortBy = [], 
    fields = [],
    groupBy = [],
    aggregations = [],
    limit = 100,
    offset = 0,
    includeTotals = false
  }) => {
    // Get all records from CSV files
    const files = getCsvFiles();
    let allRecords = [];
    
    for (const file of files) {
      const records = readCsvFile(file);
      allRecords.push(...records);
    }

    // Apply filters
    let filtered = filters.length > 0
      ? allRecords.filter(record => 
          filters.every(filter => parseFilter(record, filter))
        )
      : [...allRecords];

    // Group and aggregate if needed
    let result;
    if (groupBy.length > 0 || aggregations.length > 0) {
      const groups = {};
      
      // Group records
      filtered.forEach(record => {
        const groupKey = groupBy.map(field => record[field] || '').join('|');
        if (!groups[groupKey]) {
          groups[groupKey] = {
            _key: groupKey,
            _count: 0,
            _items: []
          };
          
          // Add group fields
          groupBy.forEach(field => {
            groups[groupKey][field] = record[field] || null;
          });
        }
        
        groups[groupKey]._count++;
        groups[groupKey]._items.push(record);
      });
      
      // Apply aggregations
      const aggregated = Object.values(groups).map(group => {
        const result = { ...group };
        
        aggregations.forEach(({ field, op, as = `${field}_${op}` }) => {
          const values = group._items
            .map(item => parseFloat(item[field] || '0'))
            .filter(n => !isNaN(n));
          
          switch (op) {
            case 'sum':
              result[as] = values.reduce((a, b) => a + b, 0);
              break;
            case 'avg':
              result[as] = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
              break;
            case 'min':
              result[as] = values.length ? Math.min(...values) : 0;
              break;
            case 'max':
              result[as] = values.length ? Math.max(...values) : 0;
              break;
            case 'count':
              result[as] = values.length;
              break;
          }
        });
        
        // Remove internal fields
        delete result._items;
        
        return result;
      });
      
      // Sort aggregated results
      result = sortRecords(aggregated, sortBy);
    } else {
      // Sort and paginate regular results
      const sorted = sortRecords(filtered, sortBy);
      const paginated = sorted.slice(offset, offset + limit);
      
      // Select fields if specified
      result = fields.length > 0
        ? paginated.map(record => {
            const selected = {};
            fields.forEach(field => {
              selected[field] = record[field];
            });
            return selected;
          })
        : paginated;
    }
    
    // Prepare response
    const response = {
      data: result,
      pagination: {
        total: filtered.length,
        limit,
        offset,
        hasMore: offset + limit < filtered.length
      }
    };
    
    // Add totals if requested
    if (includeTotals) {
      response.totals = {
        count: filtered.length,
        sum: {},
        avg: {},
        min: {},
        max: {}
      };
      
      // Calculate numeric field summaries
      if (filtered.length > 0) {
        const numericFields = new Set();
        
        // Find all numeric fields
        filtered.forEach(record => {
          Object.entries(record).forEach(([field, value]) => {
            if (!isNaN(parseFloat(value)) && value !== '') {
              numericFields.add(field);
            }
          });
        });
        
        // Calculate summaries for each numeric field
        Array.from(numericFields).forEach(field => {
          const values = filtered
            .map(r => parseFloat(r[field] || '0'))
            .filter(n => !isNaN(n));
            
          if (values.length > 0) {
            response.totals.sum[field] = values.reduce((a, b) => a + b, 0);
            response.totals.avg[field] = response.totals.sum[field] / values.length;
            response.totals.min[field] = Math.min(...values);
            response.totals.max[field] = Math.max(...values);
          }
        });
      }
    }
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(response, null, 2),
      }],
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
