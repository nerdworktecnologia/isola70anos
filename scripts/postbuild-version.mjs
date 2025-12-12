import fs from 'fs';
import path from 'path';

const file = path.resolve('dist', 'index.html');
const ts = Date.now();

try {
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace(/(src="\.\/assets\/[^\"]+\.js)(")/g, `$1?v=${ts}$2`);
  html = html.replace(/(href="\.\/assets\/[^\"]+\.(css|js))(\")/g, `$1?v=${ts}$3`);
  fs.writeFileSync(file, html, 'utf8');
  console.log('postbuild-version applied', file);
} catch (e) {
  console.error('postbuild-version failed:', e);
  process.exit(1);
}
