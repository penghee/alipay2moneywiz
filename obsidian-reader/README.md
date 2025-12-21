# Markdown Reader MCP

A Markdown file reader and analyzer for your second brain, built as a Model Context Protocol (MCP) server.

## Features

- **List Files**: Get metadata for all markdown files in a directory
- **Search Files**: Search by content or filename with filtering options
- **Get File**: Retrieve full content and metadata for a specific file

## Installation

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Start the server:
   ```bash
   pnpm start
   ```

## API Endpoints

### List Files

```
GET /list-files?pattern=**/*.md
```

Parameters:
- `pattern` (optional): Glob pattern to match files (default: `**/*.md`)

### Search Files

```
GET /search-files?query=search+term&filename=pattern&after=2025-01-01&before=2025-12-31
```

Parameters:
- `query` (optional): Text to search in file content
- `filename` (optional): Filename pattern to match
- `after` (optional): Filter files modified after this date (YYYY-MM-DD)
- `before` (optional): Filter files modified before this date (YYYY-MM-DD)

### Get File

```
GET /get-file?path=/path/to/file.md
```

Parameters:
- `path`: Absolute path to the markdown file

## Example Usage

```javascript
// List all markdown files
const listResponse = await fetch('http://localhost:3001/list-files');
const files = await listResponse.json();

// Search for files containing "knowledge management"
const searchResponse = await fetch(
  'http://localhost:3001/search-files?query=knowledge+management'
);
const results = await searchResponse.json();

// Get a specific file
const fileResponse = await fetch(
  'http://localhost:3001/get-file?path=/path/to/note.md'
);
const file = await fileResponse.json();
```

## Development

### Environment Variables

- `PORT`: Port to run the server on (default: 3001)
- `NODE_ENV`: Set to 'development' for debug output

### Testing

```bash
# Run tests
pnpm test
```

## License

MIT
