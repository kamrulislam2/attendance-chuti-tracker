const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      callback(path.join(dir, f));
    }
  });
}

const banglaRegex = /[\u0980-\u09FF]/;

walkDir(path.join(__dirname, '..', 'src'), (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  if (banglaRegex.test(content)) {
    const relative = path.relative(path.join(__dirname, '..'), filePath);
    console.log(`File: ${relative}`);
    // Print matching lines
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (banglaRegex.test(line)) {
        console.log(`  L${index + 1}: ${line.trim()}`);
      }
    });
    console.log('---');
  }
});
