const fs = require('fs');
const content = fs.readFileSync('C:\\\\Users\\\\kamru\\\\.gemini\\\\antigravity\\\\brain\\\\32a2227a-666c-4153-85ef-062c691512c9\\\\.system_generated\\\\logs\\\\transcript.jsonl', 'utf8');
const lines = content.split('\n');

for (const line of lines) {
  if (line.trim().length === 0) continue;
  try {
    const obj = JSON.parse(line);
    if (obj.step_index === 1260) {
      console.log("=== STEP 1260 ===");
      if (obj.tool_calls) {
        obj.tool_calls.forEach((tc, idx) => {
          console.log(`Tool call ${idx} name:`, tc.name);
          fs.writeFileSync(`scratch/step_1260_tc_${idx}_args.json`, JSON.stringify(tc.args, null, 2));
          console.log(`Saved args to scratch/step_1260_tc_${idx}_args.json`);
        });
      }
      break;
    }
  } catch (e) {
    // ignore
  }
}
