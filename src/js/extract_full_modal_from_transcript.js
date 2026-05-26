const fs = require('fs');
const content = fs.readFileSync('C:\\\\Users\\\\kamru\\\\.gemini\\\\antigravity\\\\brain\\\\32a2227a-666c-4153-85ef-062c691512c9\\\\.system_generated\\\\logs\\\\transcript.jsonl', 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('requested_default_sign_in') || line.includes('requested_working_hours')) {
    try {
      const obj = JSON.parse(line);
      // Let's check obj.content first
      if (obj.content && obj.content.includes('Pending') && obj.content.includes('প্রোফাইল পরিবর্তন') && obj.content.length > 2000) {
        console.log(`Found in Step ${obj.step_index} content, length = ${obj.content.length}`);
        fs.writeFileSync(`scratch/step_${obj.step_index}_recovered_content.txt`, obj.content);
      }
      if (obj.tool_calls) {
        obj.tool_calls.forEach((tc, idx) => {
          if (tc.args && tc.args.ReplacementContent && tc.args.ReplacementContent.includes('requested_working_hours')) {
            console.log(`Found in Step ${obj.step_index} tool call ${idx} ReplacementContent, length = ${tc.args.ReplacementContent.length}`);
            fs.writeFileSync(`scratch/step_${obj.step_index}_recovered_tc_${idx}_replacement.txt`, tc.args.ReplacementContent);
          }
        });
      }
    } catch (e) {
      // ignore
    }
  }
}
