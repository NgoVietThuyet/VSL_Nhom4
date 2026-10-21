import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'node_modules', 'pdfjs-dist', 'build');
const dest = join(root, 'public', 'pdfjs', 'build');
const viewerMjs = join(root, 'public', 'pdfjs', 'viewer.mjs');

if (!existsSync(src)) {
  console.warn('[copy-pdfjs] pdfjs-dist chưa cài — bỏ qua.');
  process.exit(0);
}

mkdirSync(dest, { recursive: true });
for (const name of readdirSync(src)) {
  cpSync(join(src, name), join(dest, name), { force: true });
}

const required = ['pdf.mjs', 'pdf.worker.mjs'];
const missing = required.filter((f) => !existsSync(join(dest, f)));
if (missing.length) {
  console.error(`[copy-pdfjs] Thiếu file sau khi copy: ${missing.join(', ')}`);
  process.exit(1);
}

if (existsSync(viewerMjs)) {
  const viewerText = readFileSync(viewerMjs, 'utf8');
  const viewerMatch = viewerText.match(/viewerVersion\s*=\s*"([^"]+)"/);
  const pdfText = readFileSync(join(dest, 'pdf.mjs'), 'utf8');
  const pdfMatch = pdfText.match(/pdfjsVersion\s*=\s*([0-9.]+)/) || pdfText.match(/const version = "([^"]+)"/);
  const viewerVer = viewerMatch?.[1];
  const pdfVer = pdfMatch?.[1];
  if (viewerVer && pdfVer && viewerVer !== pdfVer) {
    console.error(
      `[copy-pdfjs] Lệch phiên bản: viewer.mjs=${viewerVer}, pdf.mjs=${pdfVer}. Cài pdfjs-dist@${viewerVer}.`,
    );
    process.exit(1);
  }
}

console.log(`[copy-pdfjs] Đã copy ${readdirSync(dest).length} file → public/pdfjs/build/`);
