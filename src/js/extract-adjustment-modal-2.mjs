import fs from 'fs';

const content = fs.readFileSync('src/app/page.tsx', 'utf8');
const lines = content.split('\n');

console.log("Extracting Adjustment Modal Rest (Lines 4020-4060):");
for (let i = 4020; i <= 4060; i++) {
  if (lines[i - 1] !== undefined) {
    console.log(`${i}: ${lines[i - 1]}`);
  }
}
