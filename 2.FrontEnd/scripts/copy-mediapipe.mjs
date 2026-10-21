import { cpSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'node_modules', '@mediapipe', 'hands');
const dest = join(root, 'public', 'assets', 'mediapipe');

if (!existsSync(src)) {
  console.warn('[copy-mediapipe] @mediapipe/hands chưa cài — bỏ qua.');
  process.exit(0);
}

mkdirSync(dest, { recursive: true });
for (const name of readdirSync(src)) {
  cpSync(join(src, name), join(dest, name), { force: true });
}

const required = ['hands_solution_packed_assets.data', 'hands_solution_wasm_bin.wasm', 'hands.js'];
const missing = required.filter((f) => !existsSync(join(dest, f)));
if (missing.length) {
  console.error(`[copy-mediapipe] Thiếu file sau khi copy: ${missing.join(', ')}`);
  process.exit(1);
}

console.log(`[copy-mediapipe] Đã copy ${readdirSync(dest).length} file → public/assets/mediapipe/`);
