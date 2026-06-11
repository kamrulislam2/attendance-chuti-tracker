const fs = require('fs');
const readline = require('readline');

async function searchTranscript() {
  const filePath = 'C:/Users/kamru/.gemini/antigravity-ide/brain/a9c1ba21-5488-46a3-bfd0-479325d93457/.system_generated/logs/transcript.jsonl';
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let matchCount = 0;
  for await (const line of rl) {
    if (line.includes('"type":"USER_INPUT"')) {
      try {
        const parsed = JSON.parse(line);
        console.log(`[USER_INPUT] Index: ${parsed.step_index}`);
        console.log(parsed.content);
        console.log('---');
        matchCount++;
      } catch (e) {
        console.log('Parse error:', e.message);
      }
    }
  }
  console.log(`Finished. Found ${matchCount} matches.`);
}

searchTranscript().catch(console.error);
