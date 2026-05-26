const fs = require('fs');

const content = fs.readFileSync('C:/Users/kamru/.gemini/antigravity/scratch/chuti/src/app/page.tsx.bak', 'utf8');
const lines = content.split('\n');

const start = 2194 - 1; // 2193
const end = 2266 - 1; // 2265

let depth = 0;
for (let i = start; i <= end; i++) {
  let open = 0, close = 0;
  for (let char of lines[i]) {
    if (char === '{') { open++; depth++; }
    if (char === '}') { close++; depth--; }
  }
  console.log(`${i+1}: (open=${open}, close=${close}, depth=${depth}) ${lines[i]}`);
}
