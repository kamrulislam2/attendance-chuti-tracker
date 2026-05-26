import fs from 'fs';

const content = fs.readFileSync('src/app/page.tsx', 'utf8');
const lines = content.split('\n');
console.log("Line 1916:", lines[1915]);
console.log("Line 1990:", lines[1989]);
console.log("Line 2091:", lines[2090]);
console.log("Line 2120:", lines[2119]);
console.log("Line 2175:", lines[2174]);
