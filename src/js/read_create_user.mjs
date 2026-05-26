import fs from 'fs';

const filePath = 'C:/Users/kamru/.gemini/antigravity/scratch/chuti/src/app/page.tsx';
const content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

function printRange(start, end) {
  console.log(`--- Lines ${start} to ${end} ---`);
  for (let i = start - 1; i < end && i < lines.length; i++) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
}

printRange(4790, 4825);
