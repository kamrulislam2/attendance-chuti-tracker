const fs = require('fs');
try {
  const content = fs.readFileSync('scratch/supervisor_modal_cleaned.txt', 'utf8');
  console.log(content);
} catch (e) {
  console.error(e);
}
