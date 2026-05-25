const fs = require('fs');
const logPath = 'C:\\Users\\kamru\\.gemini\\antigravity\\brain\\32a2227a-666c-4153-85ef-062c691512c9\\.system_generated\\logs\\transcript.jsonl';

if (!fs.existsSync(logPath)) {
  console.error("Log file not found");
  process.exit(1);
}

const content = fs.readFileSync(logPath, 'utf8');
const lines = content.split('\n');

for (let i = lines.length - 1; i >= 0; i--) {
  if (!lines[i]) continue;
  try {
    const obj = JSON.parse(lines[i]);
    const jsonStr = JSON.stringify(obj);
    if (obj.step_index < 4600 && jsonStr.includes('handleApproveProfileChangeRequest') && jsonStr.includes('adminEditLeaveType')) {
      console.log(`Found a potential matching step ${obj.step_index} at idx ${i}`);
      // Write the content
      fs.writeFileSync(`scratch/step_${obj.step_index}_recovered.txt`, jsonStr);
    }
  } catch (e) {}
}

console.log("Done");
