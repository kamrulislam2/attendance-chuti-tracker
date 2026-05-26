const fs = require('fs');
const stepFile = 'scratch/step_3474_content.txt';

if (!fs.existsSync(stepFile)) {
  console.error("Step file not found");
  process.exit(1);
}

const obj = JSON.parse(fs.readFileSync(stepFile, 'utf8'));
console.log("Step index:", obj.step_index);
console.log("Type:", obj.type);
if (obj.tool_calls) {
  obj.tool_calls.forEach((tc, i) => {
    console.log(`Tool call ${i}:`, tc.name);
    console.log("Args:", tc.args);
  });
}
if (obj.output) {
  console.log("Output length:", obj.output.length);
  // Write the output to step_3474_output.txt
  fs.writeFileSync('scratch/step_3474_output.txt', obj.output);
  console.log("Wrote tool output to scratch/step_3474_output.txt");
}
