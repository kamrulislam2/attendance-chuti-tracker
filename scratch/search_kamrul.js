const fs = require('fs');
const readline = require('readline');

async function searchKamrul() {
  const filePath = 'C:/Users/kamru/.gemini/antigravity-ide/brain/a9c1ba21-5488-46a3-bfd0-479325d93457/.system_generated/logs/transcript.jsonl';
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (line.includes('kamrul@admin.chuti')) {
      try {
        const parsed = JSON.parse(line);
        console.log(`[Step ${parsed.step_index}] Match:`);
        if (parsed.content) {
          console.log(parsed.content.substring(0, 1000));
        }
        if (parsed.tool_calls) {
          console.log(JSON.stringify(parsed.tool_calls, null, 2));
        }
        console.log('---');
      } catch (e) {
        console.log('Parse error:', e.message);
      }
    }
  }
}

searchKamrul().catch(console.error);
