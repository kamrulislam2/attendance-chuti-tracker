import fs from 'fs';

const content = fs.readFileSync('src/app/page.tsx', 'utf8');
const lines = content.split('\n');

console.log("Searching for getUserSummaryStats in page.tsx...");
lines.forEach((line, index) => {
  if (line.includes('getUserSummaryStats')) {
    console.log(`Line ${index + 1}: ${line.trim()}`);
  }
});
