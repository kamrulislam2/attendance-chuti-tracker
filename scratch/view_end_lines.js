const fs = require('fs');
const content = fs.readFileSync('C:/Users/kamru/.gemini/antigravity/scratch/chuti/src/app/page.tsx', 'utf8');
const lines = content.split('\n');

console.log(`Total lines: ${lines.length}`);
for (let i = lines.length - 25; i < lines.length; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
