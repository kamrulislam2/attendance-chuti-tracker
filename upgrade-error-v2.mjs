import fs from 'fs';

const filePath = './src/app/page.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

// Use simpler regex-based replacements to avoid exact string matching issues
const patterns = [
  // Pattern for simple err.message || 'message' replacements
  {
    pattern: /} catch \(err: any\) {\s*setMessage\(\{ type: 'error', text: err\.message \|\| '([^']+)' \}\);/g,
    replacement: `} catch (err: any) {
      const errorInfo = errorHandler.handleError(err);
      setMessage({ type: 'error', text: errorInfo.userMessage });`
  },
  // Pattern for catch blocks with additional logic (like setError)
  {
    pattern: /} catch \(err: any\) {\s*set\w+Error\(err\.message \|\| '([^']+)'\);/g,
    replacement: (match) => {
      const varName = match.match(/set(\w+)Error/)[1];
      return `} catch (err: any) {
      const errorInfo = errorHandler.handleError(err);
      set${varName}Error(errorInfo.userMessage);`;
    }
  }
];

let updated = 0;
patterns.forEach((p, idx) => {
  const matches = content.match(p.pattern);
  if (matches) {
    updated += matches.length;
    content = content.replace(p.pattern, p.replacement);
    console.log(`✓ Pattern ${idx + 1}: Replaced ${matches.length} catch blocks`);
  }
});

fs.writeFileSync(filePath, content, 'utf-8');
console.log(`\n✅ Updated ${updated} total catch blocks`);
