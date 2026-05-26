const fs = require('fs');
const content = fs.readFileSync('C:/Users/kamru/.gemini/antigravity/scratch/chuti/src/app/page.tsx', 'utf8');
const lines = content.split('\n');

const vars = ['staffHours', 'staffFull', 'staffReserve', 'staffOvertimeHours', 'staffShortMins', 'staffOvertimeMins'];
lines.forEach((line, index) => {
  vars.forEach(v => {
    if (line.includes(v)) {
      console.log(`Line ${index + 1}: ${line.trim()}`);
    }
  });
});
