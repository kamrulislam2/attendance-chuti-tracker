const fs = require('fs');
const readline = require('readline');

async function main() {
  const filePath = 'C:/Users/kamru/.gemini/antigravity-ide/brain/a9c1ba21-5488-46a3-bfd0-479325d93457/.system_generated/logs/transcript.jsonl';
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const matchedSteps = [];
  for await (const line of rl) {
    if (line.includes('kamrul') && (line.includes('password') || line.includes('Password') || line.includes('pw') || line.includes('signUp') || line.includes('signIn'))) {
      try {
        const parsed = JSON.parse(line);
        // let's save the steps that are not about the scripts we wrote just now
        if (parsed.step_index < 10000) {
          matchedSteps.push(parsed);
        }
      } catch (e) {}
    }
  }

  // Print them formatted
  for (const step of matchedSteps) {
    console.log(`[Step ${step.step_index}] Source: ${step.source}, Type: ${step.type}`);
    if (step.tool_calls) {
      console.log('Tool Calls:', JSON.stringify(step.tool_calls, null, 2));
    }
    if (step.content) {
      console.log('Content:', step.content.substring(0, 1000));
    }
    console.log('====================================');
  }
}
main().catch(console.error);
