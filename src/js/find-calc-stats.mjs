import fs from 'fs';

const content = fs.readFileSync('src/app/page.tsx', 'utf8');
const lines = content.split('\n');

console.log("Finding functions in page.tsx...");
lines.forEach((line, index) => {
  if (line.includes('const calculateUserStats') || line.includes('const calculateAdminStats')) {
    console.log(`Line ${index + 1}: ${line.trim()}`);
  }
});
