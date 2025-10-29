import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DEFAULT_OWNER = '爸爸';

async function processCsvFiles() {
  try {
    // Read all CSV files in the data directory and its subdirectories
    const files = await findCsvFiles(DATA_DIR);
    
    if (files.length === 0) {
      console.log('No CSV files found in the data directory.');
      return;
    }

    console.log(`Found ${files.length} CSV file(s) to process.`);
    
    for (const file of files) {
      await processCsvFile(file);
    }
    
    console.log('\nAll files have been processed successfully!');
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

async function findCsvFiles(dir) {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  let csvFiles = [];
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      const subDirFiles = await findCsvFiles(fullPath);
      csvFiles = csvFiles.concat(subDirFiles);
    } else if (entry.isFile() && entry.name.endsWith('.csv')) {
      csvFiles.push(fullPath);
    }
  }
  
  return csvFiles;
}

async function processCsvFile(filePath) {
  try {
    console.log(`\nProcessing: ${filePath}`);
    
    // Read the CSV file
    const csvContent = await fs.promises.readFile(filePath, 'utf8');
    
    // Parse the CSV content
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      bom: true
    });
    
    if (records.length === 0) {
      console.log(`  No records found in ${filePath}`);
      return;
    }
    
    // Check if the file already has the owner column
    const hasOwnerColumn = records[0].hasOwnProperty('账单人');
    
    if (hasOwnerColumn) {
      console.log(`  File already has a '账单人' column. Skipping.`);
      return;
    }
    
    // Add the owner column to each record
    const updatedRecords = records.map(record => ({
      ...record,
      '账单人': DEFAULT_OWNER
    }));
    
    // Get the original headers and add the new column
    const headers = Object.keys(records[0]);
    headers.push('账单人');
    
    // Convert back to CSV
    const output = stringify(updatedRecords, {
      header: true,
      columns: headers
    });
    
    // Write the updated content back to the file
    await fs.promises.writeFile(filePath, output, 'utf8');
    console.log(`  Successfully added '账单人' column with default value '${DEFAULT_OWNER}'`);
    
  } catch (error) {
    console.error(`  Error processing ${filePath}:`, error.message);
  }
}

// Run the script
processCsvFiles();
