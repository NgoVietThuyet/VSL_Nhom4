const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');

const OBFUSCATOR_OPTIONS = {
  compact: true,
  controlFlowFlattening: false,
  deadCodeInjection: false,
  debugProtection: false,
  disableConsoleOutput: false,
  identifierNamesGenerator: 'hexadecimal',
  renameGlobals: false,
  rotateStringArray: true,
  selfDefending: false,
  simplify: true,
  splitStrings: true,
  splitStringsChunkLength: 10,
  stringArray: true,
  stringArrayEncoding: ['base64'],
  stringArrayThreshold: 0.75,
  transformObjectKeys: false,
  unicodeEscapeSequence: false
};

const SKIP_FILES = new Set(['ngsw-worker.js', 'worker-basic.min.js', 'safety-worker.js', 'sw.js']);

function findJsTargets(distDir) {
  if (!fs.existsSync(distDir)) return [];
  const targets = [];
  const entries = fs.readdirSync(distDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const projectDir = path.join(distDir, entry.name);
    const browserDir = path.join(projectDir, 'browser');
    const serverDir = path.join(projectDir, 'server');
    if (fs.existsSync(browserDir)) targets.push(browserDir);
    if (fs.existsSync(serverDir)) targets.push(serverDir);
    if (!fs.existsSync(browserDir) && !fs.existsSync(serverDir)) targets.push(projectDir);
  }
  return targets;
}

function collectJsFiles(dir, acc) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectJsFiles(full, acc);
      continue;
    }
    if (!entry.name.startsWith('chunk-')) continue;
    if (!entry.name.endsWith('.js')) continue;
    if (SKIP_FILES.has(entry.name)) continue;
    acc.push(full);
  }
  return acc;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

(function run() {
  const start = Date.now();
  const distDir = path.resolve(__dirname, '..', 'dist');
  const targets = findJsTargets(distDir);

  if (targets.length === 0) {
    console.error(`[obfuscate] No dist output found at ${distDir}`);
    process.exit(1);
  }

  const files = targets.reduce((acc, t) => collectJsFiles(t, acc), []);

  if (files.length === 0) {
    console.error('[obfuscate] No JavaScript files found to obfuscate');
    process.exit(1);
  }

  let beforeTotal = 0;
  let afterTotal = 0;
  let processed = 0;

  for (const file of files) {
    try {
      const original = fs.readFileSync(file, 'utf8');
      beforeTotal += Buffer.byteLength(original, 'utf8');
      const result = JavaScriptObfuscator.obfuscate(original, OBFUSCATOR_OPTIONS).getObfuscatedCode();
      fs.writeFileSync(file, result, 'utf8');
      afterTotal += Buffer.byteLength(result, 'utf8');
      processed++;
      console.log(`[obfuscate] ${path.relative(distDir, file)}`);
    } catch (err) {
      console.error(`[obfuscate] Failed: ${file}`);
      console.error(err.message || err);
      process.exit(1);
    }
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(2);
  console.log('-----------------------------------------');
  console.log(`[obfuscate] Files processed : ${processed}`);
  console.log(`[obfuscate] Size before     : ${formatBytes(beforeTotal)}`);
  console.log(`[obfuscate] Size after      : ${formatBytes(afterTotal)}`);
  console.log(`[obfuscate] Elapsed         : ${elapsed}s`);
  console.log('-----------------------------------------');
})();
