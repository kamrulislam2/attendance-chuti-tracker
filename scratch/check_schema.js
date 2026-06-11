const fs = require('fs');
const readline = require('readline');

async function searchLogs() {
  const logPath = 'C:\\Users\\kamru\\.gemini\\antigravity-ide\\brain\\a9c1ba21-5488-46a3-bfd0-479325d93457\\.system_generated\\logs\\transcript.jsonl';
  const fileStream = fs.createReadStream(logPath);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  console.log("Searching logs for 'onboarding'...");
  const matches = [];
  for await (const line of rl) {
    if (line.includes('onboarding') || line.includes('Onboarding')) {
      matches.push(line);
    }
  }
  
  console.log(`Found total of ${matches.length} matches.`);
  const lastMatches = matches.slice(-10); // Get last 10 matches
  lastMatches.forEach((m, idx) => {
    console.log(`[Match ${idx+1}] ${m.substring(0, 1000)}...`);
  });
}

searchLogs().catch(console.error);
