import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';

const SRC_DIR = resolve('src');
const OUT_DIR = resolve('public/assets/thumbs');
const SCAN_EXTENSIONS = new Set(['.ts', '.tsx', '.astro']);
const QUALITY_CANDIDATES = ['maxresdefault', 'hq720', 'hqdefault'];
const MIN_BYTES = 2000;

const VIDEO_ID_PATTERNS = [
  /videoId:\s*['"]([A-Za-z0-9_-]{11})['"]/g,
  /thumbnailUrl(?:Max)?\(\s*['"]([A-Za-z0-9_-]{11})['"]/g,
  /i\.ytimg\.com\/vi\/([A-Za-z0-9_-]{11})/g,
];

const force = process.argv.includes('--force');

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) return walk(full);
      return SCAN_EXTENSIONS.has(extname(entry.name)) ? [full] : [];
    }),
  );
  return files.flat();
}

async function collectVideoIds() {
  const files = await walk(SRC_DIR);
  const ids = new Set();

  for (const file of files) {
    const content = await readFile(file, 'utf8');
    for (const pattern of VIDEO_ID_PATTERNS) {
      for (const match of content.matchAll(pattern)) {
        ids.add(match[1]);
      }
    }
  }

  return [...ids].sort();
}

async function fileExists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function downloadBest(videoId) {
  const target = join(OUT_DIR, `${videoId}.jpg`);

  if (!force && (await fileExists(target))) {
    return { videoId, status: 'skipped' };
  }

  for (const quality of QUALITY_CANDIDATES) {
    const url = `https://i.ytimg.com/vi/${videoId}/${quality}.jpg`;

    try {
      const response = await fetch(url, { redirect: 'follow' });
      if (!response.ok) continue;

      const contentType = response.headers.get('content-type') ?? '';
      if (!contentType.startsWith('image/')) continue;

      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.byteLength < MIN_BYTES) continue;

      await writeFile(target, buffer);
      return { videoId, status: 'downloaded', quality, bytes: buffer.byteLength };
    } catch {
      // try next quality candidate
    }
  }

  return { videoId, status: 'failed' };
}

const videoIds = await collectVideoIds();
await mkdir(OUT_DIR, { recursive: true });

console.log(`Found ${videoIds.length} video ids. Output: ${OUT_DIR}`);

const results = [];
for (const videoId of videoIds) {
  const result = await downloadBest(videoId);
  results.push(result);
  const detail =
    result.status === 'downloaded' ? `${result.quality} (${Math.round(result.bytes / 1024)} KB)` : result.status;
  console.log(`  ${videoId}: ${detail}`);
}

const failed = results.filter((r) => r.status === 'failed');
if (failed.length > 0) {
  console.error(`\nFailed: ${failed.map((r) => r.videoId).join(', ')}`);
  process.exitCode = 1;
}

console.log(
  `\nDone. ${results.filter((r) => r.status === 'downloaded').length} downloaded, ${results.filter((r) => r.status === 'skipped').length} skipped.`,
);
