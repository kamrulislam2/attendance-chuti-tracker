const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\kamru\\.gemini\\antigravity\\brain\\32a2227a-666c-4153-85ef-062c691512c9\\.system_generated\\logs\\transcript.jsonl';
if (!fs.existsSync(logPath)) {
  console.error("Log file not found at " + logPath);
  process.exit(1);
}

console.log("Reading transcript...");
const content = fs.readFileSync(logPath, 'utf8');
const lines = content.split('\n');

console.log(`Found ${lines.length} lines. Searching for writes/replaces...`);

// Let's search for the last successful write or read to view_file or edit
let lastFullContent = null;
let stepIndex = -1;

for (let i = lines.length - 1; i >= 0; i--) {
  if (!lines[i]) continue;
  try {
    const obj = JSON.parse(lines[i]);
    // Check if it's a tool output containing file content of page.tsx
    if (obj.tool_calls) {
      for (const tc of obj.tool_calls) {
        if (tc.name === 'default_api:view_file' && tc.args && tc.args.AbsolutePath && tc.args.AbsolutePath.endsWith('page.tsx')) {
          // If we read the whole file
          if (!tc.args.StartLine && obj.output && obj.output.length > 50000) {
            console.log(`Found a view_file output at step ${obj.step_index}`);
            lastFullContent = obj.output;
            stepIndex = obj.step_index;
            break;
          }
        }
      }
    }
    if (lastFullContent) break;
  } catch (e) {
    // ignore
  }
}

if (lastFullContent) {
  console.log(`Found full content of page.tsx at step ${stepIndex}. Writing backup...`);
  fs.writeFileSync('src/app/page.tsx.recovered', lastFullContent);
  console.log("Recovered file saved to src/app/page.tsx.recovered");
} else {
  console.log("No full content found in view_file. Let's look for apply_page_edits or other files.");
}
