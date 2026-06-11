const fs = require('fs');
const readline = require('readline');

async function main() {
  const filePath = 'C:/Users/kamru/.gemini/antigravity-ide/brain/a9c1ba21-5488-46a3-bfd0-479325d93457/.system_generated/logs/transcript.jsonl';
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (line.includes('signInWithPassword') || line.includes('signIn') || line.includes('signUp')) {
      const idx = line.indexOf('signInWithPassword');
      const start = Math.max(0, idx - 100);
      const end = Math.min(line.length, idx + 300);
      console.log('Line snippet:', line.substring(start, end));
    }
  }
}
main().catch(console.error);
