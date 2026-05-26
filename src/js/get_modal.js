const fs = require('fs');
const content = fs.readFileSync('C:\\\\Users\\\\kamru\\\\.gemini\\\\antigravity\\\\brain\\\\32a2227a-666c-4153-85ef-062c691512c9\\\\.system_generated\\\\logs\\\\transcript.jsonl', 'utf8');
const lines = content.split('\n');
for (const line of lines) {
  if (line.trim().length === 0) continue;
  try {
    const obj = JSON.parse(line);
    if (obj.step_index === 3906) {
      let rawText = obj.tool_calls[0].args.TargetContent;
      // Since it's a string, we can do JSON.parse(JSON.stringify(rawText)) or eval it, or parse it if it is JSON.
      // Wait, if it has escaped quotes and newlines, we can just do:
      // JSON.parse('"' + rawText.replace(/"/g, '\\"').replace(/\n/g, '\\n') + '"') etc?
      // Actually, since targetContent was double serialized, we can parse it by parsing the string as a JSON value.
      // Let's print the raw characters.
      console.log('rawText type:', typeof rawText);
      console.log('rawText length:', rawText.length);
      console.log('rawText starts with:', rawText.substring(0, 50));
      
      // Let's try to unescape by parsing it as JSON if it's wrapped in double quotes.
      // Or we can parse it as a JSON string by wrapping it and parsing.
      // Wait, if we parse it, does it contain literal backslashes? Yes, `\\n`.
      // Let's replace literal `\n` (backslash n) with real newline, and `\"` with `"`
      // Wait, a clean way in JS is to do:
      const clean = rawText
        .replace(/\\n/g, '\n')
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'")
        .replace(/\\\\/g, '\\');
      fs.writeFileSync('scratch/deleted_modal_unescaped.txt', clean);
      console.log("Saved unescaped modal to scratch/deleted_modal_unescaped.txt");
      break;
    }
  } catch (e) {
    console.error('Error parsing line:', e);
  }
}
