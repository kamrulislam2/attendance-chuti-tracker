const fs = require('fs');
const content = fs.readFileSync('C:\\\\Users\\\\kamru\\\\.gemini\\\\antigravity\\\\brain\\\\32a2227a-666c-4153-85ef-062c691512c9\\\\.system_generated\\\\logs\\\\transcript.jsonl', 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('pendingProfileRequests.map') || line.includes('requested_full_name')) {
    try {
      const obj = JSON.parse(line);
      console.log(`=== Step ${obj.step_index} (${obj.type}) ===`);
      // Let's check where the string could be.
      // If it is a tool call in obj.tool_calls
      if (obj.tool_calls) {
        obj.tool_calls.forEach(tc => {
          if (tc.args && tc.args.ReplacementContent && tc.args.ReplacementContent.includes('pendingProfileRequests')) {
            console.log(`  Found in ReplacementContent of tool call ${tc.name}. Length: ${tc.args.ReplacementContent.length}`);
            fs.writeFileSync(`scratch/step_${obj.step_index}_replacement_full.txt`, tc.args.ReplacementContent);
          }
        });
      }
      // If it is in obj.content
      if (obj.content && obj.content.includes('pendingProfileRequests')) {
        console.log(`  Found in content. Length: ${obj.content.length}`);
      }
    } catch (e) {
      // ignore
    }
  }
}
