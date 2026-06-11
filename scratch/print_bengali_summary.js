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
const results = [];

walkDir(path.join(__dirname, '..', 'src'), (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  if (banglaRegex.test(content)) {
    const relative = path.relative(path.join(__dirname, '..'), filePath);
    const lines = content.split('\n');
    let count = 0;
    lines.forEach(line => {
      if (banglaRegex.test(line)) count++;
    });
    results.push({ file: relative, count });
  }
});

console.log('=== BENGALI OCCURRENCES BY FILE ===');
results.sort((a, b) => b.count - a.count).forEach(r => {
  console.log(`${r.file}: ${r.count} lines`);
});
