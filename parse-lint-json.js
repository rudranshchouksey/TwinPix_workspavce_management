const fs = require('fs');
let raw = fs.readFileSync('lint-errors.json', 'utf16le');
if (raw.charCodeAt(0) === 0xFEFF) {
  raw = raw.slice(1);
}
const data = JSON.parse(raw);
const issues = [];
data.forEach(file => {
  if (!file.messages) return;
  file.messages.forEach(msg => {
    if (msg.severity === 2) {
      issues.push({
        file: file.filePath,
        line: msg.line,
        rule: msg.ruleId,
        message: msg.message
      });
    }
  });
});
fs.writeFileSync('lint-to-fix.json', JSON.stringify(issues, null, 2));
