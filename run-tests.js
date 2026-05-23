const path = require('node:path');
const { spawnSync } = require('node:child_process');

const testFile = path.join(__dirname, 'tests', 'all.test.js');
const result = spawnSync(process.execPath, ['--test', testFile], {
  stdio: 'inherit',
  shell: false,
});

process.exit(result.status ?? 1);