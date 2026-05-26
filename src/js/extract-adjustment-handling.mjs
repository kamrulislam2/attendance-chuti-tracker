import fs from 'fs';

const content = fs.readFileSync('src/app/page.tsx', 'utf8');
const lines = content.split('\n');

console.log("Extracting Adjustment Save Handler (Lines 710-750):");
for (let i = 710; i <= 750; i++) {
  if (lines[i - 1] !== undefined) {
    console.log(`${i}: ${lines[i - 1]}`);
  }
}
