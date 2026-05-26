const fs = require('fs');
const content = fs.readFileSync('C:\\\\Users\\\\kamru\\\\.gemini\\\\antigravity\\\\brain\\\\32a2227a-666c-4153-85ef-062c691512c9\\\\.system_generated\\\\logs\\\\transcript.jsonl', 'utf8');
const lines = content.split('\n');

const stepIndices = [3659, 3660, 3661, 3662];

for (const line of lines) {
  if (line.trim().length === 0) continue;
  try {
    const obj = JSON.parse(line);
    if (stepIndices.includes(obj.step_index)) {
      console.log(`Step ${obj.step_index}: type=${obj.type}, source=${obj.source}`);
      if (obj.content && obj.content.length > 100) {
        fs.writeFileSync(`scratch/step_${obj.step_index}_recovered_content.txt`, obj.content);
        console.log(`  Saved content to scratch/step_${obj.step_index}_recovered_content.txt, length = ${obj.content.length}`);
      }
    }
  } catch (e) {
    // ignore
  }
}
