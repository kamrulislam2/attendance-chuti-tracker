const fs = require('fs');
const file = 'C:/Users/kamru/.gemini/antigravity/brain/32a2227a-666c-4153-85ef-062c691512c9/scratch/step_4406_rep.txt';
let content = fs.readFileSync(file, 'utf8');

try {
  if (content.startsWith('"')) {
    try {
      content = JSON.parse(content);
    } catch (jsonErr) {
      // Fallback to manual replacement if JSON.parse fails due to control chars
      content = content.substring(1, content.length - 1)
        .replace(/\\n/g, '\n')
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'")
        .replace(/\\\\/g, '\\');
    }
  } else {
    content = content.replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'")
      .replace(/\\\\/g, '\\');
  }
  fs.writeFileSync(file, content);
  console.log('Processed successfully! File size:', content.length);
} catch (e) {
  console.error('Fatal error:', e);
}
