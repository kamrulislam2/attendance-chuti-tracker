const fs = require('fs');
const logPath = 'C:\\Users\\kamru\\.gemini\\antigravity\\brain\\32a2227a-666c-4153-85ef-062c691512c9\\.system_generated\\logs\\transcript.jsonl';

if (!fs.existsSync(logPath)) {
  console.error("Log file not found");
  process.exit(1);
}

const content = fs.readFileSync(logPath, 'utf8');
const lines = content.split('\n');

console.log(`Searching transcript lines...`);
let matchCount = 0;

lines.forEach((line, idx) => {
  if (!line) return;
  try {
    const obj = JSON.parse(line);
    
    // Check if it's a model step with tool_calls or system step
    const jsonStr = JSON.stringify(obj);
    if (jsonStr.includes('Supervisor Leave Approvals Modal') || jsonStr.includes('পেন্ডিং ভেরিফিকেশন প্যানেল (Supervisor)')) {
      console.log(`Match at line ${idx}, step ${obj.step_index}, type: ${obj.type}`);
      // Let's dump the whole object to a file for inspect
      fs.writeFileSync(`scratch/step_${obj.step_index}_content.txt`, JSON.stringify(obj, null, 2));
      matchCount++;
    }
  } catch (e) {}
});

console.log(`Done. Found ${matchCount} matches.`);
