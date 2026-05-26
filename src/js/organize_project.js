const fs = require('fs');
const path = require('path');

const projectRoot = 'C:/Users/kamru/.gemini/antigravity/scratch/chuti';
const targetDir = path.join(projectRoot, 'src', 'js');

// Create target directory if it doesn't exist
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
  console.log(`Created directory: ${targetDir}`);
}

const configExclusions = ['eslint.config.mjs', 'postcss.config.mjs'];

// Move files from project root
const rootFiles = fs.readdirSync(projectRoot);
rootFiles.forEach(file => {
  const fullPath = path.join(projectRoot, file);
  const stat = fs.statSync(fullPath);
  
  if (stat.isFile() && (file.endsWith('.js') || file.endsWith('.mjs'))) {
    if (!configExclusions.includes(file)) {
      const destPath = path.join(targetDir, file);
      fs.renameSync(fullPath, destPath);
      console.log(`Moved root file: ${file} -> src/js/${file}`);
    }
  }
});

// Move files from scratch directory
const scratchDir = path.join(projectRoot, 'scratch');
if (fs.existsSync(scratchDir)) {
  const scratchFiles = fs.readdirSync(scratchDir);
  scratchFiles.forEach(file => {
    const fullPath = path.join(scratchDir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isFile()) {
      const destPath = path.join(targetDir, file);
      // If file already exists, make name unique
      let finalDest = destPath;
      if (fs.existsSync(destPath)) {
        const ext = path.extname(file);
        const base = path.basename(file, ext);
        finalDest = path.join(targetDir, `${base}_scratch${ext}`);
      }
      fs.renameSync(fullPath, finalDest);
      console.log(`Moved scratch file: scratch/${file} -> src/js/${path.basename(finalDest)}`);
    }
  });
  
  // Try to remove scratch directory if empty
  try {
    fs.rmdirSync(scratchDir);
    console.log("Removed empty scratch directory.");
  } catch (err) {
    console.log("Could not remove scratch directory (it might not be empty yet):", err.message);
  }
}
