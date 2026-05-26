const fs = require('fs');
const content = fs.readFileSync('./src/app/page.tsx', 'utf8');

const regex = /text-(blue|emerald|amber|violet|indigo|purple|red|cyan|green|pink|yellow|orange)-\d+/g;
const matches = content.match(regex) || [];
const uniqueMatches = [...new Set(matches)];

console.log('Unique non-slate text colors:', uniqueMatches);
