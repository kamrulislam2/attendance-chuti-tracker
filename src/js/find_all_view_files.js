const fs = require('fs');
const content = fs.readFileSync('C:\\\\Users\\\\kamru\\\\.gemini\\\\antigravity\\\\brain\\\\32a2227a-666c-4153-85ef-062c691512c9\\\\.system_generated\\\\logs\\\\transcript.jsonl', 'utf8');
const lines = content.split('\n');

for (const line of lines) {
  if (line.trim().length === 0) continue;
  try {
    const obj = JSON.parse(line);
    if (obj.tool_calls) {
      obj.tool_calls.forEach(tc => {
        if (tc.name === 'view_file' && tc.args && tc.args.AbsolutePath && tc.args.AbsolutePath.includes('page.tsx')) {
          console.log(`Step ${obj.step_index}: StartLine=${tc.args.StartLine}, EndLine=${tc.args.EndLine}`);
        }
      });
    }
  } catch (e) {
    // ignore
  }
}
