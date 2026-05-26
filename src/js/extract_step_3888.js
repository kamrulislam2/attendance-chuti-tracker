const fs = require('fs');
const content = fs.readFileSync('C:\\\\Users\\\\kamru\\\\.gemini\\\\antigravity\\\\brain\\\\32a2227a-666c-4153-85ef-062c691512c9\\\\.system_generated\\\\logs\\\\transcript.jsonl', 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.trim().length === 0) continue;
  try {
    const obj = JSON.parse(line);
    // Find step indices close to 3888
    if (obj.step_index >= 3888 && obj.step_index <= 3892) {
      console.log(`Step ${obj.step_index}: type=${obj.type}, length=${JSON.stringify(obj).length}`);
      if (obj.content) {
        fs.writeFileSync(`scratch/step_${obj.step_index}_content.txt`, obj.content);
        console.log(`  Saved content to scratch/step_${obj.step_index}_content.txt`);
      }
    }
  } catch (e) {
    // ignore
  }
}
