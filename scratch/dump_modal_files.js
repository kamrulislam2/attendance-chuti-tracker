const fs = require('fs');
const path = require('path');

const dir = 'C:\\Users\\kamru\\.gemini\\antigravity\\brain\\32a2227a-666c-4153-85ef-062c691512c9\\scratch';
const files = [
  'recovered_view_126.txt',
  'recovered_view_158.txt',
  'recovered_view_289.txt',
  'recovered_view_292.txt',
  'recovered_view_323.txt',
  'recovered_view_329.txt'
];

for (const file of files) {
  const filePath = path.join(dir, file);
  console.log(`\n===================================`);
  console.log(`FILE: ${file}`);
  console.log(`===================================`);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    console.log(content);
  } catch (e) {
    console.error(e);
  }
}
