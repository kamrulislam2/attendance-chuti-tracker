const fs = require('fs');
const content = fs.readFileSync('C:\\\\Users\\\\kamru\\\\.gemini\\\\antigravity\\\\brain\\\\32a2227a-666c-4153-85ef-062c691512c9\\\\.system_generated\\\\logs\\\\transcript.jsonl', 'utf8');
const lines = content.split('\n');

const stepIndices = [1068, 1076, 1260, 1266, 1267];

for (const line of lines) {
  if (line.trim().length === 0) continue;
  try {
    const obj = JSON.parse(line);
    if (stepIndices.includes(obj.step_index)) {
      console.log(`=== STEP ${obj.step_index} (${obj.type}) ===`);
      if (obj.tool_calls) {
        obj.tool_calls.forEach((tc, idx) => {
          console.log(`  Tool Call ${idx}: ${tc.name}`);
          if (tc.args && tc.args.ReplacementContent) {
            fs.writeFileSync(`scratch/step_${obj.step_index}_tc_${idx}_replacement.txt`, tc.args.ReplacementContent);
            console.log(`    Saved ReplacementContent to scratch/step_${obj.step_index}_tc_${idx}_replacement.txt`);
          }
          if (tc.args && tc.args.TargetContent) {
            fs.writeFileSync(`scratch/step_${obj.step_index}_tc_${idx}_target.txt`, tc.args.TargetContent);
            console.log(`    Saved TargetContent to scratch/step_${obj.step_index}_tc_${idx}_target.txt`);
          }
        });
      }
    }
  } catch (e) {
    // ignore
  }
}
