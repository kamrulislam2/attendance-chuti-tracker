const fs = require('fs');
const logPath = 'C:\\Users\\kamru\\.gemini\\antigravity\\brain\\32a2227a-666c-4153-85ef-062c691512c9\\.system_generated\\logs\\transcript.jsonl';

if (!fs.existsSync(logPath)) {
  console.error("Log file not found");
  process.exit(1);
}

const content = fs.readFileSync(logPath, 'utf8');
const lines = content.split('\n');

const recentMatches = [];
lines.forEach((line, idx) => {
  if (!line) return;
  try {
    const obj = JSON.parse(line);
    const jsonStr = JSON.stringify(obj);
    if (jsonStr.includes('replace_file_content') && jsonStr.includes('page.tsx')) {
      recentMatches.push({ idx, step: obj.step_index, created_at: obj.created_at, type: obj.type, keys: Object.keys(obj) });
    }
  } catch (e) {}
});

console.log("Recent matches (last 15):");
console.log(JSON.stringify(recentMatches.slice(-15), null, 2));
