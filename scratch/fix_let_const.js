import fs from 'fs';

const filePath = 'src/app/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Normalize line endings
content = content.replace(/\r\n/g, '\n');

const targetStr = `      let updates: any = { 
        reserve_adjustment_status: approve ? 'approved' : 'rejected',
      };`;

const replacementStr = `      const updates: any = { 
        reserve_adjustment_status: approve ? 'approved' : 'rejected',
      };`;

if (!content.includes(targetStr)) {
  console.error("Target string not found!");
  process.exit(1);
}

content = content.replace(targetStr, replacementStr);
fs.writeFileSync(filePath, content, 'utf8');
console.log("Success: Changed let updates to const updates.");
