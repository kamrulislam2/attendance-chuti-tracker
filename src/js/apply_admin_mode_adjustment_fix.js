const fs = require('fs');

const filePath = 'C:/Users/kamru/.gemini/antigravity/scratch/chuti/src/app/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const targetStr = "const isAdmin = profile?.role === 'admin';";
const replacementStr = "const isAdmin = profile?.role === 'admin' && adminActiveTab === 'admin';";

// Make sure target exists in file
if (!content.includes(targetStr)) {
  console.error("Error: Target string not found in page.tsx!");
  process.exit(1);
}

// Replace
content = content.replace(targetStr, replacementStr);
fs.writeFileSync(filePath, content, 'utf8');
console.log("Successfully updated page.tsx to restrict direct adjustment to active Admin Mode!");
