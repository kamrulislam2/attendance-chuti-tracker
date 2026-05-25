import fs from 'fs';
const content = fs.readFileSync('src/app/page.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.includes('username') && !l.includes('username_')) {
    console.log(`${i + 1}: ${l.trim()}`);
  }
});
