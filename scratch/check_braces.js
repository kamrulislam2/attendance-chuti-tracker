const fs = require('fs');

const orig = fs.readFileSync('C:/Users/kamru/.gemini/antigravity/scratch/chuti/src/app/page.tsx.bak', 'utf8');
const mod = fs.readFileSync('C:/Users/kamru/.gemini/antigravity/scratch/chuti/src/app/page.tsx', 'utf8');

function countBraces(str) {
  let open = 0, close = 0;
  for (let char of str) {
    if (char === '{') open++;
    if (char === '}') close++;
  }
  return { open, close };
}

console.log("Original braces:", countBraces(orig));
console.log("Modified braces:", countBraces(mod));
