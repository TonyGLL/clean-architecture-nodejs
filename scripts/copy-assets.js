// tsc only emits .ts files; the EJS templates must sit next to the compiled output (dist/views).
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
fs.rmSync(path.join(root, 'dist', 'views'), { recursive: true, force: true });
fs.cpSync(path.join(root, 'src', 'views'), path.join(root, 'dist', 'views'), { recursive: true });
console.log('Copied src/views -> dist/views');
