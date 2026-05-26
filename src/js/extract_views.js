const fs = require('fs');
const content = fs.readFileSync('C:\\\\Users\\\\kamru\\\\.gemini\\\\antigravity\\\\brain\\\\32a2227a-666c-4153-85ef-062c691512c9\\\\.system_generated\\\\logs\\\\transcript.jsonl', 'utf8');
const lines = content.split('\n');

const viewSteps = [3470, 3662, 3953, 3959, 3965, 3971];

for (const line of lines) {
  if (line.trim().length === 0) continue;
  try {
    const obj = JSON.parse(line);
    if (viewSteps.includes(obj.step_index)) {
      console.log(`=== STEP ${obj.step_index} (${obj.type}) ===`);
      if (obj.content) {
        fs.writeFileSync(`scratch/step_${obj.step_index}_view.txt`, obj.content);
        console.log(`  Saved content to scratch/step_${obj.step_index}_view.txt`);
      }
    }
  } catch (e) {
    // ignore
  }
}
