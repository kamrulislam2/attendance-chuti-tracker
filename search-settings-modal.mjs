import fs from 'fs';

const content = fs.readFileSync('src/app/page.tsx', 'utf8');
const lines = content.split('\n');

const start = 3515;
const end = 3580;

for (let i = start; i <= end; i++) {
  if (lines[i - 1] !== undefined) {
    console.log(`${i}: ${lines[i - 1]}`);
  }
}
