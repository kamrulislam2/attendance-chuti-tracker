const fs = require('fs');
const logPath = 'C:\\Users\\kamru\\.gemini\\antigravity\\brain\\32a2227a-666c-4153-85ef-062c691512c9\\.system_generated\\logs\\transcript.jsonl';

if (!fs.existsSync(logPath)) {
  console.error("Log file not found");
  process.exit(1);
}

const content = fs.readFileSync(logPath, 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (!line) return;
  try {
    const obj = JSON.parse(line);
    const jsonStr = JSON.stringify(obj);
    if (jsonStr.includes('write_to_file') && jsonStr.includes('page.tsx')) {
      console.log(`Write page.tsx match at line ${idx}, step ${obj.step_index}`);
      fs.writeFileSync(`scratch/write_step_${obj.step_index}.txt`, JSON.stringify(obj, null, 2));
    }
  } catch (e) {}
});

console.log("Done");
