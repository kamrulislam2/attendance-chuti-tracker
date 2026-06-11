const fs = require('fs');
const readline = require('readline');

async function searchEmails() {
  const filePath = 'C:/Users/kamru/.gemini/antigravity-ide/brain/a9c1ba21-5488-46a3-bfd0-479325d93457/.system_generated/logs/transcript.jsonl';
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const patterns = [
    /@office\.local/i,
    /@admin\.chuti/i,
    /@supervisor\.chuti/i,
    /@user\.chuti/i,
    /signInWithPassword/i,
    /username/i
  ];

  for await (const line of rl) {
    let matched = false;
    for (const p of patterns) {
      if (p.test(line)) {
        matched = true;
        break;
      }
    }
    if (matched) {
      try {
        const parsed = JSON.parse(line);
        if (parsed.type === 'RUN_COMMAND' && parsed.content && parsed.content.includes('Output')) {
          console.log(`[Step ${parsed.step_index}] COMMAND OUTPUT:`);
          console.log(parsed.content.substring(0, 1000));
          console.log('---');
        } else if (parsed.type === 'USER_INPUT') {
          console.log(`[Step ${parsed.step_index}] USER INPUT:`);
          console.log(parsed.content);
          console.log('---');
        } else if (parsed.tool_calls && JSON.stringify(parsed.tool_calls).includes('signInWithPassword') || JSON.stringify(parsed.tool_calls).includes('tryLogin')) {
          console.log(`[Step ${parsed.step_index}] TOOL CALL:`);
          console.log(JSON.stringify(parsed.tool_calls, null, 2));
          console.log('---');
        }
      } catch (e) {
        // ignore parse error
      }
    }
  }
}

searchEmails().catch(console.error);
