const fs = require('fs');
const stepFile = 'scratch/step_3796_content.txt';

if (!fs.existsSync(stepFile)) {
  console.error("Step file not found");
  process.exit(1);
}

const obj = JSON.parse(fs.readFileSync(stepFile, 'utf8'));
// We want to write obj.content to scratch/supervisor_modal_original.txt
fs.writeFileSync('scratch/supervisor_modal_original.txt', obj.content);
console.log("Wrote full content of step 3796 to scratch/supervisor_modal_original.txt");
