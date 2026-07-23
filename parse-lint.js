const fs = require('fs');

const data = fs.readFileSync('lint.txt', 'utf8');
const lines = data.split('\n');
let currentFile = '';
const errors = [];

for (const line of lines) {
  if (line.match(/^[A-Z]:\\[^\n]+/)) {
    currentFile = line.trim();
  } else if (line.includes('error')) {
    if (!line.includes('warning')) {
      const match = line.match(/\s+(\d+):(\d+)\s+error\s+(.+?)\s+([a-zA-Z0-9\-\/]+)$/);
      if (match) {
        errors.push({
          file: currentFile,
          line: match[1],
          col: match[2],
          message: match[3],
          rule: match[4]
        });
      } else if (line.trim().startsWith('Error:')) {
         errors.push({
          file: currentFile,
          message: line.trim(),
          rule: "react-compiler"
        });
      } else {
        // Just generic error line
        errors.push({
            file: currentFile,
            line: line.trim()
        });
      }
    }
  }
}

fs.writeFileSync('lint-errors.json', JSON.stringify(errors, null, 2));
