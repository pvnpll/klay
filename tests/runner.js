#!/usr/bin/env node

/**
 * Klay Browser Test Runner (KL-202)
 *
 * Provides a single, reproducible entry point for running game regression suites,
 * smoke tests, and viewport checks with:
 *  - Python / Node Playwright prerequisite checking
 *  - External BASE_URL support (external servers are NEVER terminated)
 *  - Automatic Vite preview startup with readiness polling (no fixed sleeps)
 *  - Isolated artifact output directories (screenshots/reports)
 *  - Deterministic process cleanup on exit or interrupt
 */

import { spawn, spawnSync } from 'node:child_process';
import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// CLI Argument Parsing
// ---------------------------------------------------------------------------
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    suite: 'all',
    baseUrl: process.env.GAME_BASE_URL || null,
    port: 4173,
    filter: null,
    outputDir: null,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--suite' || arg === '-s') {
      options.suite = args[++i];
    } else if (arg.startsWith('--suite=')) {
      options.suite = arg.split('=')[1];
    } else if (arg === '--base-url' || arg === '-u') {
      options.baseUrl = args[++i];
    } else if (arg.startsWith('--base-url=')) {
      options.baseUrl = arg.split('=')[1];
    } else if (arg === '--port' || arg === '-p') {
      options.port = parseInt(args[++i], 10);
    } else if (arg.startsWith('--port=')) {
      options.port = parseInt(arg.split('=')[1], 10);
    } else if (arg === '--filter' || arg === '-f') {
      options.filter = args[++i];
    } else if (arg.startsWith('--filter=')) {
      options.filter = arg.split('=')[1];
    } else if (arg === '--output-dir' || arg === '-o') {
      options.outputDir = args[++i];
    } else if (arg.startsWith('--output-dir=')) {
      options.outputDir = arg.split('=')[1];
    }
  }

  return options;
}

function printHelp() {
  console.log(`
Klay Browser Test Runner (KL-202)

Usage:
  npm test [-- [options]]
  node tests/runner.js [options]

Options:
  -s, --suite <name>       Suite to run: smoke, viewport, regressions, bounce,
                           classics, prince, space, all (default: all)
  -u, --base-url <url>     Use an external server URL (skips spawning preview;
                           external servers are never terminated)
  -p, --port <number>      Port to use when launching preview (default: 4173)
  -f, --filter <pattern>   Filter tests by substring or filename pattern
  -o, --output-dir <path>  Directory to save screenshots & artifacts
  -h, --help               Display this help text

Examples:
  npm test
  npm test -- --suite=smoke
  npm test -- --suite=bounce
  npm test -- --base-url=http://127.0.0.1:5173
  npm test -- --filter=pop
`);
}

// ---------------------------------------------------------------------------
// Prerequisite Checks
// ---------------------------------------------------------------------------
function findPython() {
  const candidates = [
    process.env.PYTHON,
    path.join(ROOT_DIR, 'venv', 'bin', 'python'),
    path.join(ROOT_DIR, 'venv', 'bin', 'python3'),
    'python3',
    'python',
  ].filter(Boolean);

  for (const py of candidates) {
    try {
      const res = spawnSync(py, ['-c', 'import playwright; print("ok")'], {
        encoding: 'utf-8',
        timeout: 4000,
      });
      if (res.status === 0 && res.stdout.includes('ok')) {
        return py;
      }
    } catch {
      // Continue searching
    }
  }
  return null;
}

function checkNodePlaywright() {
  try {
    const res = spawnSync('node', ['-e', 'require("playwright"); console.log("ok")'], {
      cwd: ROOT_DIR,
      encoding: 'utf-8',
      timeout: 3000,
    });
    return res.status === 0 && res.stdout.includes('ok');
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Network & Polling Helpers
// ---------------------------------------------------------------------------
function checkUrlReady(urlStr, timeoutMs = 5000) {
  return new Promise((resolve) => {
    const url = new URL(urlStr);
    const client = url.protocol === 'https:' ? https : http;
    const startTime = Date.now();

    function poll() {
      const req = client.get(urlStr, { timeout: 1000 }, (res) => {
        res.resume();
        resolve({ ok: true, status: res.statusCode, elapsedMs: Date.now() - startTime });
      });

      req.on('error', () => {
        if (Date.now() - startTime > timeoutMs) {
          resolve({ ok: false, elapsedMs: Date.now() - startTime });
        } else {
          setTimeout(poll, 100);
        }
      });

      req.on('timeout', () => {
        req.destroy();
        if (Date.now() - startTime > timeoutMs) {
          resolve({ ok: false, elapsedMs: Date.now() - startTime });
        } else {
          setTimeout(poll, 100);
        }
      });
    }

    poll();
  });
}

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const tester = net.createServer()
      .once('error', (err) => {
        resolve(err.code !== 'EADDRINUSE');
      })
      .once('listening', () => {
        tester.once('close', () => resolve(true)).close();
      })
      .listen(port, '127.0.0.1');
  });
}

async function findFreePort(startPort) {
  let port = startPort;
  while (port < startPort + 50) {
    if (await isPortAvailable(port)) {
      return port;
    }
    port++;
  }
  throw new Error(`Could not find a free port between ${startPort} and ${startPort + 50}`);
}

// ---------------------------------------------------------------------------
// Main Runner Execution
// ---------------------------------------------------------------------------
async function main() {
  const options = parseArgs();

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  console.log('='.repeat(70));
  console.log('KLAY BROWSER TEST RUNNER (KL-202)');
  console.log('='.repeat(70));

  // 1. Verify Python & Playwright prerequisites
  const pythonPath = findPython();
  if (!pythonPath) {
    console.error('\n[PREREQUISITE ERROR] No Python interpreter with "playwright" was found.');
    console.error('Please configure the test environment:');
    console.error('  1. python3 -m venv venv');
    console.error('  2. ./venv/bin/pip install playwright');
    console.error('  3. ./venv/bin/playwright install chromium\n');
    process.exit(1);
  }
  console.log(`[PREREQUISITE] Using Python: ${pythonPath}`);

  const hasNodePlaywright = checkNodePlaywright();
  if (hasNodePlaywright) {
    console.log('[PREREQUISITE] Node.js Playwright: Available');
  } else {
    console.log('[PREREQUISITE] Node.js Playwright: Not detected (Hanuman Node tests will be skipped unless installed)');
  }

  // 2. Prepare artifact output directory
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const defaultOutputDir = path.join(ROOT_DIR, 'test-results', `run-${timestamp}`);
  const outputDir = options.outputDir ? path.resolve(options.outputDir) : defaultOutputDir;
  fs.mkdirSync(outputDir, { recursive: true });
  console.log(`[OUTPUT DIR] Artifacts saved to: ${outputDir}`);

  // Create or update "test-results/latest" symlink
  try {
    const latestLink = path.join(ROOT_DIR, 'test-results', 'latest');
    if (fs.existsSync(latestLink)) {
      fs.unlinkSync(latestLink);
    }
    fs.symlinkSync(outputDir, latestLink, 'dir');
  } catch {
    // Ignore symlink errors on platforms without symlink support
  }

  // 3. Server Management
  let previewProc = null;
  let baseUrl = options.baseUrl;
  const isExternalServer = Boolean(baseUrl);

  // Deterministic cleanup
  function cleanup() {
    if (previewProc && !isExternalServer) {
      console.log('\n[SERVER] Terminating spawned preview server...');
      try {
        previewProc.kill('SIGTERM');
      } catch {
        // Ignored
      }
      previewProc = null;
    }
  }

  process.on('SIGINT', () => {
    console.log('\n[RUNNER] Interrupted (SIGINT)');
    cleanup();
    process.exit(130);
  });
  process.on('SIGTERM', () => {
    console.log('\n[RUNNER] Terminated (SIGTERM)');
    cleanup();
    process.exit(143);
  });

  try {
    if (isExternalServer) {
      console.log(`[SERVER] Using external server: ${baseUrl}`);
      const ready = await checkUrlReady(baseUrl, 5000);
      if (!ready.ok) {
        console.error(`\n[ERROR] External server at ${baseUrl} is unreachable after ${ready.elapsedMs}ms.`);
        console.error('Verify that the server is running or omit --base-url to launch an automatic preview.\n');
        process.exit(1);
      }
      console.log(`[SERVER] External server responded with status ${ready.status} (${ready.elapsedMs}ms).`);
    } else {
      const port = await findFreePort(options.port);
      console.log(`[SERVER] Launching Vite preview on http://127.0.0.1:${port}...`);

      previewProc = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
        cwd: ROOT_DIR,
        stdio: 'pipe',
        env: { ...process.env },
      });

      let serverOutput = '';
      previewProc.stdout.on('data', (d) => { serverOutput += d.toString(); });
      previewProc.stderr.on('data', (d) => { serverOutput += d.toString(); });

      baseUrl = `http://127.0.0.1:${port}`;
      const ready = await checkUrlReady(baseUrl, 15000);
      if (!ready.ok) {
        console.error(`\n[ERROR] Preview server failed to respond at ${baseUrl} within 15 seconds.`);
        if (serverOutput) {
          console.error(`Server logs:\n${serverOutput}`);
        }
        cleanup();
        process.exit(1);
      }
      console.log(`[SERVER] Preview server ready at ${baseUrl} (${ready.elapsedMs}ms).`);
    }

    // 4. Test Suite Registry
    const allTests = [
      { id: 'smoke', name: 'Game Catalog Smoke', file: 'tests/game-smoke.py', type: 'python', suite: 'smoke' },
      { id: 'viewport', name: 'Multi-Viewport Responsive Check', file: 'tests/game-viewport.py', type: 'python', suite: 'smoke' },
      { id: 'regressions', name: 'Game Interactions & Logic Regressions', file: 'tests/game-regressions.py', type: 'python', suite: 'regressions' },
      { id: 'bounce', name: 'Bounce 4-Level Progression & Fail States', file: 'tests/bounce-test.py', type: 'python', suite: 'bounce' },
      { id: 'classics', name: 'Classic Nokia Games Pack (Rapid Roll, Asphalt, Diamond Rush)', file: 'tests/classics-pack-test.py', type: 'python', suite: 'classics' },
      { id: 'prince', name: 'Prince of Persia Combat & Rewind', file: 'tests/prince-of-persia-test.py', type: 'python', suite: 'prince' },
      { id: 'space', name: 'Space Impact Combat & LCD Themes', file: 'tests/space-impact-test.py', type: 'python', suite: 'space' },
    ];

    if (hasNodePlaywright) {
      allTests.push({ id: 'hanuman', name: 'Hanuman: Son of the Wind 3D Prototype', file: 'tests/hanuman-test.cjs', type: 'node', suite: 'hanuman' });
    }

    // Filter tests by requested suite or filter pattern
    const selectedTests = allTests.filter((t) => {
      if (options.suite !== 'all') {
        if (options.suite === 'smoke') {
          if (t.suite !== 'smoke') return false;
        } else if (t.suite !== options.suite && t.id !== options.suite) {
          return false;
        }
      }
      if (options.filter) {
        const needle = options.filter.toLowerCase();
        const matches = t.id.toLowerCase().includes(needle) ||
                        t.name.toLowerCase().includes(needle) ||
                        t.file.toLowerCase().includes(needle);
        if (!matches) return false;
      }
      return true;
    });

    if (selectedTests.length === 0) {
      console.log(`\n[WARNING] No tests matched suite="${options.suite}" with filter="${options.filter || ''}".`);
      cleanup();
      process.exit(0);
    }

    console.log(`\n[RUNNER] Running ${selectedTests.length} selected test suite(s)...`);
    console.log('-'.repeat(70));

    // 5. Execute Tests
    const results = [];
    let allPassed = true;

    for (let i = 0; i < selectedTests.length; i++) {
      const t = selectedTests[i];
      const testNum = `[${i + 1}/${selectedTests.length}]`;
      console.log(`\n${testNum} RUNNING: ${t.name} (${t.file})`);

      const startTime = Date.now();
      const testEnv = {
        ...process.env,
        GAME_BASE_URL: baseUrl,
        OUTPUT_DIR: outputDir,
        HANUMAN_SCREENSHOT_DIR: outputDir,
      };

      const cmd = t.type === 'python' ? pythonPath : 'node';
      const args = [path.join(ROOT_DIR, t.file)];

      const testProc = spawnSync(cmd, args, {
        cwd: ROOT_DIR,
        env: testEnv,
        encoding: 'utf-8',
        stdio: ['inherit', 'pipe', 'pipe'],
      });

      const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
      const passed = testProc.status === 0;

      if (testProc.stdout) {
        process.stdout.write(testProc.stdout);
      }
      if (testProc.stderr) {
        process.stderr.write(testProc.stderr);
      }

      if (passed) {
        console.log(`>>> ${testNum} PASS: ${t.name} (${elapsedSec}s)`);
      } else {
        console.error(`>>> ${testNum} FAIL: ${t.name} (exit code ${testProc.status}) (${elapsedSec}s)`);
        allPassed = false;
      }

      results.push({
        id: t.id,
        name: t.name,
        file: t.file,
        passed,
        exitCode: testProc.status,
        elapsedSec,
      });
    }

    // 6. Summary Report
    console.log('\n' + '='.repeat(70));
    console.log('TEST SUMMARY REPORT');
    console.log('='.repeat(70));
    for (const r of results) {
      const badge = r.passed ? 'PASS' : 'FAIL';
      console.log(`[${badge}] ${r.name.padEnd(54)} ${r.elapsedSec}s`);
    }
    console.log('-'.repeat(70));
    const passedCount = results.filter((r) => r.passed).length;
    const totalCount = results.length;
    console.log(`Total: ${passedCount}/${totalCount} suites passed.`);
    console.log(`Artifacts: ${outputDir}`);
    console.log('='.repeat(70) + '\n');

    cleanup();
    process.exit(allPassed ? 0 : 1);
  } catch (err) {
    console.error('\n[UNEXPECTED ERROR in Test Runner]:', err);
    cleanup();
    process.exit(1);
  }
}

main();
