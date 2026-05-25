import fs from 'fs';
const content = fs.readFileSync('src/app/page.tsx', 'utf8');
const lines = content.split('\n');
const targets = [210, 226, 338, 916, 976];

targets.forEach(target => {
  console.log(`\n--- Context around line ${target} ---`);
  const start = Math.max(0, target - 10);
  const end = Math.min(lines.length - 1, target + 10);
  for (let i = start; i <= end; i++) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
});
