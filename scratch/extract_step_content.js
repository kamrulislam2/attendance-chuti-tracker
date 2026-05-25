const fs = require('fs');
const content = fs.readFileSync('C:\\\\Users\\\\kamru\\\\.gemini\\\\antigravity\\\\brain\\\\32a2227a-666c-4153-85ef-062c691512c9\\\\.system_generated\\\\logs\\\\transcript.jsonl', 'utf8');
const lines = content.split('\n');

function tryExtract(stepIndex) {
  for (const line of lines) {
    if (line.trim().length === 0) continue;
    try {
      const obj = JSON.parse(line);
      if (obj.step_index === stepIndex) {
        console.log(`=== STEP ${stepIndex} ===`);
        console.log('Keys:', Object.keys(obj));
        if (obj.content) {
          fs.writeFileSync(`scratch/step_${stepIndex}_content.txt`, obj.content);
          console.log(`Saved content to scratch/step_${stepIndex}_content.txt`);
        }
        if (obj.tool_calls) {
          fs.writeFileSync(`scratch/step_${stepIndex}_tool_calls.json`, JSON.stringify(obj.tool_calls, null, 2));
          console.log(`Saved tool_calls to scratch/step_${stepIndex}_tool_calls.json`);
        }
        return true;
      }
    } catch (e) {
      // ignore
    }
  }
  return false;
}

tryExtract(3907);
tryExtract(1267);
