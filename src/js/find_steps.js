const fs = require('fs');
const content = fs.readFileSync('C:\\\\Users\\\\kamru\\\\.gemini\\\\antigravity\\\\brain\\\\32a2227a-666c-4153-85ef-062c691512c9\\\\.system_generated\\\\logs\\\\transcript.jsonl', 'utf8');
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('Admin Profile Approvals Modal')) {
    try {
      const obj = JSON.parse(line);
      console.log(`Step ${obj.step_index}: type=${obj.type}, length=${JSON.stringify(obj).length}`);
    } catch (e) {
      console.log(`Step line ${i}: contains term but JSON.parse failed`);
    }
  }
}
