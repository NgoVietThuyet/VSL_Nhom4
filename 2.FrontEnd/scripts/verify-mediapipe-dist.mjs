import { existsSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const distRoot = join(root, 'dist');

const REQUIRED = [
  { name: 'hands.js', minBytes: 10_000 },
  { name: 'hands_solution_packed_assets.data', minBytes: 1_000_000 },
  { name: 'hands_solution_packed_assets_loader.js', minBytes: 1_000 },
  { name: 'hands_solution_wasm_bin.js', minBytes: 10_000 },
  { name: 'hands_solution_wasm_bin.wasm', minBytes: 1_000_000 },
  { name: 'hands.binarypb', minBytes: 100 },
];

function findBrowserDirs(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'browser') acc.push(full);
      else findBrowserDirs(full, acc);
    }
  }
  return acc;
}

const browsers = findBrowserDirs(distRoot);
if (browsers.length === 0) {
  console.error('[verify-mediapipe] Không tìm thấy dist/*/browser. Chạy "npm run build" trước.');
  process.exit(1);
}

let failed = false;
for (const browserDir of browsers) {
  const mpDir = join(browserDir, 'assets', 'mediapipe');
  console.log(`[verify-mediapipe] Kiểm tra ${mpDir}`);

  if (!existsSync(mpDir)) {
    console.error('[verify-mediapipe] Thiếu thư mục assets/mediapipe trong build output.');
    failed = true;
    continue;
  }

  for (const { name, minBytes } of REQUIRED) {
    const filePath = join(mpDir, name);
    if (!existsSync(filePath)) {
      console.error(`[verify-mediapipe] THIẾU: ${name}`);
      failed = true;
      continue;
    }
    const size = statSync(filePath).size;
    if (size < minBytes) {
      console.error(`[verify-mediapipe] ${name} quá nhỏ (${size} bytes, cần >= ${minBytes})`);
      failed = true;
    } else {
      console.log(`[verify-mediapipe] OK ${name} (${(size / 1024 / 1024).toFixed(2)} MB)`);
    }
  }
}

if (failed) {
  console.error('[verify-mediapipe] Build thiếu MediaPipe. Chạy: npm run sync:mediapipe && npm run build');
  process.exit(1);
}

console.log('[verify-mediapipe] Tất cả file MediaPipe có trong dist.');
