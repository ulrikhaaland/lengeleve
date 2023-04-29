import * as fs from 'fs';
import csv from 'csv-parser';

type Row = { [key: string]: string };

async function readCsvFile(filePath: string): Promise<Row[]> {
  return new Promise<Row[]>((resolve, reject) => {
    const rows: Row[] = [];

    fs.createReadStream(filePath)
      .pipe(csv({}))
      .on('data', (row: Row) => rows.push(row))
      .on('end', () => resolve(rows))
      .on('error', (error) => reject(error));
  });
}

function areTitlesEqual(row1: Row, row2: Row): boolean {
  return row1.title === row2.title;
}

async function compareAndSaveCsvFiles(
  csvFile1Path: string,
  csvFile2Path: string,
  outputCsvPath: string
): Promise<void> {
  const file1Rows = await readCsvFile(csvFile1Path);
  const file2Rows = await readCsvFile(csvFile2Path);

  const uniqueRowsInFile1 = file1Rows.filter(
    (row1) => !file2Rows.some((row2) => areTitlesEqual(row1, row2))
  );

  const header = Object.keys(uniqueRowsInFile1[0]).join(',') + '\n';
  const rows = uniqueRowsInFile1
    .map((row) =>
      Object.values(row)
        .map((value) => `"${value}"`)
        .join(',')
    )
    .join('\n');

  await fs.promises.writeFile(outputCsvPath, header + rows);
}

(async () => {
  compareAndSaveCsvFiles(
    'scripts/data/csv/insulin_unique.csv',
    'scripts/data/csv/chronic2.csv',
    'scripts/data/csv/insulin_unique.csv'
  )
    .then(() => console.log('Comparison and save completed'))
    .catch((error) => console.error('Error:', error));
})();
