const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

async function splitCsvByMonth(inputFile, outputDir = 'monthly_statements') {
    try {
        // Create output directory if it doesn't exist
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Read the input CSV file
        const fileContent = fs.readFileSync(inputFile, 'utf8');
        
        // Parse CSV content
        const records = parse(fileContent, {
            columns: true,
            skip_empty_lines: true
        });

        // Group records by month
        const monthlyData = new Map();
        
        records.forEach(record => {
            if (!record['日期']) return; // Skip if date is missing
            
            try {
                const date = new Date(record['日期']);
                const monthKey = String(date.getMonth() + 1).padStart(2, '0');
                
                if (!monthlyData.has(monthKey)) {
                    monthlyData.set(monthKey, []);
                }
                monthlyData.get(monthKey).push(record);
            } catch (error) {
                console.error(`Error processing record: ${JSON.stringify(record)}`, error);
            }
        });

        // Get headers from the first record
        const headers = records[0] ? Object.keys(records[0]) : [];
        
        // Write each month's data to a separate file
        for (const [month, data] of monthlyData.entries()) {
            const outputFile = path.join(outputDir, `${month}.csv`);
            
            const csvString = stringify(data, {
                header: true,
                columns: headers
            });
            
            fs.writeFileSync(outputFile, csvString, 'utf8');
            console.log(`Created: ${outputFile} with ${data.length} transactions`);
        }
        
        console.log('\nProcessing complete. Check the monthly_statements directory for output files.');
        
    } catch (error) {
        console.error('An error occurred:', error);
        process.exit(1);
    }
}

// Get input file from command line arguments
const args = process.argv.slice(2);
if (args.length !== 1) {
    console.log('Usage: node splitByMonth.js <input_csv_file>');
    process.exit(1);
}

const inputFile = args[0];
if (!fs.existsSync(inputFile)) {
    console.error(`Error: File '${inputFile}' not found.`);
    process.exit(1);
}

splitCsvByMonth(inputFile);
