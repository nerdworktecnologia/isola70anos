import fs from 'fs';
import path from 'path';

const src = path.resolve('dist');
const dest = path.resolve('docs');

function copyDir(from, to) {
  if (!fs.existsSync(to)) fs.mkdirSync(to, { recursive: true });
  const entries = fs.readdirSync(from, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(from, entry.name);
    const destPath = path.join(to, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function rimraf(p) {
  if (!fs.existsSync(p)) return;
  for (const entry of fs.readdirSync(p, { withFileTypes: true })) {
    const full = path.join(p, entry.name);
    if (entry.isDirectory()) rimraf(full);
    else fs.unlinkSync(full);
  }
  fs.rmdirSync(p);
}

try {
  if (fs.existsSync(dest)) rimraf(dest);
  copyDir(src, dest);
  console.log('Copied', src, '->', dest);
} catch (e) {
  console.error('deploy-docs failed:', e);
  process.exit(1);
}
