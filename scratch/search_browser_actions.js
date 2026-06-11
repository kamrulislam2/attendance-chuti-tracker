const fs = require('fs');
const readline = require('readline');

async function searchBrowserActions() {
  const filePath = 'C:/Users/kamru/.gemini/antigravity-ide/brain/a9c1ba21-5488-46a3-bfd0-479325d93457/.system_generated/logs/transcript.jsonl';
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (line.includes('browser_subagent') || line.includes('open_browser_url') || line.includes('click') || line.includes('type')) {
      try {
        const parsed = JSON.parse(line);
        if (parsed.type === 'PLANNER_RESPONSE' && parsed.tool_calls) {
          const browserCalls = parsed.tool_calls.filter(tc => tc.name === 'browser_subagent');
          if (browserCalls.length > 0) {
            console.log(`[Step ${parsed.step_index}] Spawn Browser Subagent:`);
            console.log(JSON.stringify(browserCalls, null, 2));
            console.log('---');
          }
        } else if (parsed.type === 'SUBAGENT_LOG' || parsed.type === 'SUBAGENT_RESPONSE') {
          console.log(`[Step ${parsed.step_index}] Subagent Log/Response:`);
          console.log(parsed.content.substring(0, 1000));
          console.log('---');
        }
      } catch (e) {
        // ignore
      }
    }
  }
}

searchBrowserActions().catch(console.error);
