const fs = require('fs');
const content = fs.readFileSync('C:/Users/kamru/.gemini/antigravity/scratch/chuti/src/app/page.tsx', 'utf8');
const lines = content.split('\n');

const patterns = [
  'toLocaleDateString',
  'formatDate',
  'Date(',
  'date.split',
  'date:',
  '{record.date}',
  '{item.date}',
  '{chuti.date}',
  'showDate',
  'split(\'-\')'
];

lines.forEach((line, index) => {
  patterns.forEach(pattern => {
    if (line.includes(pattern)) {
      console.log(`Line ${index + 1} [${pattern}]: ${line.trim().substring(0, 100)}`);
    }
  });
});
