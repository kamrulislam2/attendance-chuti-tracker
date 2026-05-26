const fs = require('fs');
const content = fs.readFileSync('./src/app/page.tsx', 'utf8');

const regex = /bg-slate-\d+/g;
const matches = content.match(regex) || [];
const uniqueMatches = [...new Set(matches)];

console.log('Unique bg matches:', uniqueMatches);
