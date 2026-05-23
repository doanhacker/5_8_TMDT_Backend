const fs = require('node:fs');
const path = require('node:path');

const currentFile = path.basename(__filename);

for (const fileName of fs.readdirSync(__dirname)) {
  if (fileName === currentFile) continue;
  if (!fileName.endsWith('.test.js')) continue;
  require(path.join(__dirname, fileName));
}
