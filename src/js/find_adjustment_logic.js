const fs = require('fs');
const content = fs.readFileSync('C:/Users/kamru/.gemini/antigravity/scratch/chuti/src/app/page.tsx', 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
  if (line.includes('handleRequestAdjustment') || line.includes('handleDirectAdjustment') || line.includes('reserve_adjustment_status') || line.includes('adjust_short_leave')) {
    console.log(`Line ${index + 1}: ${line.trim().substring(0, 120)}`);
  }
});
