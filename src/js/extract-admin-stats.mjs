import fs from 'fs';

const content = fs.readFileSync('src/app/page.tsx', 'utf8');
const lines = content.split('\n');

console.log("Extracting calculateAdminStats (Lines 1660-1715):");
for (let i = 1660; i <= 1715; i++) {
  if (lines[i - 1] !== undefined) {
    console.log(`${i}: ${lines[i - 1]}`);
  }
}
