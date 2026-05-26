const fs = require('fs');
const content = fs.readFileSync('C:/Users/kamru/.gemini/antigravity/scratch/chuti/src/app/page.tsx', 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
  if (line.includes('sendPushNotification')) {
    console.log(`Line ${index + 1}: ${line.trim()}`);
    // Print 5 lines before and after
    console.log('--- Context ---');
    for (let i = Math.max(0, index - 5); i <= Math.min(lines.length - 1, index + 5); i++) {
      console.log(`${i + 1}: ${lines[i]}`);
    }
    console.log('===============\n');
  }
});
