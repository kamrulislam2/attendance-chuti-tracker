const fs = require('fs');
const readline = require('readline');

const transcriptPath = 'C:\\Users\\kamru\\.gemini\\antigravity\\brain\\32a2227a-666c-4153-85ef-062c691512c9\\.system_generated\\logs\\transcript.jsonl';

async function run() {
  const fileStream = fs.createReadStream(transcriptPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const step = JSON.parse(line);
      if (step.step_index >= 4400 && step.step_index <= 4620) {
        console.log(`Step ${step.step_index}: source=${step.source}, type=${step.type}, status=${step.status}`);
        if (step.tool_calls) {
          step.tool_calls.forEach(tc => {
            console.log(`  Tool call: ${tc.name}`);
            if (tc.args && tc.args.Description) {
              console.log(`    Description: ${tc.args.Description}`);
            }
          });
        }
      }
    } catch (e) {}
  }
}

run();
