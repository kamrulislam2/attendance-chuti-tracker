import fs from 'fs';

const filePath = './src/app/page.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

// Find and replace the special error handler case
const pattern = /} catch \(err: any\) {\s+let errorMsg = err\.message \|\| '.*?';\s+if \(err\.code === '23505'[\s\S]*?\n\s+setMessage\(\{ type: 'error', text: errorMsg \}\);/;

if (content.match(pattern)) {
  content = content.replace(pattern, `} catch (err: any) {
      const errorInfo = errorHandler.handleError(err);
      setMessage({ type: 'error', text: errorInfo.userMessage });`);
  console.log('✅ Updated remaining duplicate key error handler');
} else {
  console.log('No match found');
}

fs.writeFileSync(filePath, content, 'utf-8');
