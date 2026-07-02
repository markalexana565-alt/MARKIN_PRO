const cloudinary = require('cloudinary').v2;
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

cloudinary.config({
  cloud_name: 'dqufkjjbz',
  api_key: '815962119251441',
  api_secret: 'nEl7qietEqe306WmOsYkpIaIwak',
});

const BASE = '/mnt/d/ФОКУС/маркин/Markin';
const FFMPEG = path.join(BASE, 'node_modules/ffmpeg-static/ffmpeg');
const OUT = path.join(BASE, 'video-compressed');
const JSON_PATH = path.join(BASE, 'cloudinary-urls.json');

const videos = [
  { local: 'images/Spec/IMG_5181.mov', folder: 'markin/fx', public_id: 'IMG_5181', dur: 24 },
  { local: 'images/Spec/IMG_5528.mov', folder: 'markin/fx', public_id: 'IMG_5528', dur: 27 },
  { local: 'images/Spec/IMG_7184.MOV', folder: 'markin/fx', public_id: 'IMG_7184', dur: 28 },
  { local: 'images/Spec/IMG_7408.mov', folder: 'markin/fx', public_id: 'IMG_7408', dur: 18 },
  { local: 'images/Spec/гендер пати.MOV', folder: 'markin/fx', public_id: 'gender-party', dur: 19 },
  { local: 'video/effects.mp4', folder: 'markin/hero', public_id: 'effects', dur: 8 },
  { local: 'video/Fog_and_smoke.mp4', folder: 'markin/hero', public_id: 'fog-and-smoke', dur: 8 },
  { local: 'images/Svet/IMG_9541.mp4', folder: 'markin/light', public_id: 'IMG_9541', dur: 26 },
  { local: 'images/couples/arseniy-agnessa/IMG_9613.MOV', folder: 'markin/portfolio', public_id: 'arseniy-9613', dur: 35 },
  { local: 'images/couples/arseniy-agnessa/IMG_9621.MOV', folder: 'markin/portfolio', public_id: 'arseniy-9621', dur: 14 },
  { local: 'images/couples/arseniy-agnessa/IMG_9675.MOV', folder: 'markin/portfolio', public_id: 'arseniy-9675', dur: 25 },
  { local: 'images/couples/artem-anastasiya/IMG_9909.MOV', folder: 'markin/portfolio', public_id: 'artem-9909', dur: 79 },
  { local: 'images/couples/nikita-darya/IMG_9908.MP4', folder: 'markin/portfolio', public_id: 'nikita-9908', dur: 119 },
  { local: 'images/all/IMG_9541.mp4', folder: 'markin/portfolio', public_id: 'IMG_9541-all', dur: 26 },
];

fs.mkdirSync(OUT, { recursive: true });

// Load existing results
let results = [];
if (fs.existsSync(JSON_PATH)) {
  try { results = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8')); } catch {}
}
const done = new Set(results.filter(r => r.url).map(r => r.public_id));
console.log(`Already uploaded: ${[...done].join(', ') || 'none'}`);

function compress(v) {
  const src = path.join(BASE, v.local);
  const outName = v.public_id + '.mp4';
  const outPath = path.join(OUT, outName);
  if (fs.existsSync(outPath)) {
    const sz = fs.statSync(outPath).size;
    if (sz < 10 * 1024 * 1024) {
      console.log(`  Compressed file exists (${(sz/1024/1024).toFixed(1)}MB)`);
      return outPath;
    }
  }
  const targetKbit = 9 * 1024 * 8;
  const vbitrate = Math.max(200, Math.floor((targetKbit / v.dur) - 64));
  console.log(`  Compressing (${v.dur}s, ${vbitrate}k)...`);
  try {
    execSync(`"${FFMPEG}" -i "${src}" -vf "scale=-2:720" -b:v ${vbitrate}k -b:a 64k -y "${outPath}" 2>&1`, { stdio: 'pipe', timeout: 300000 });
    const sz = fs.statSync(outPath).size;
    console.log(`  -> ${(sz/1024/1024).toFixed(1)}MB`);
    return outPath;
  } catch (e) {
    console.log(`  FAIL compress: ${e.message.slice(0, 100)}`);
    return null;
  }
}

async function uploadFile(filePath, v) {
  const sz = fs.statSync(filePath).size;
  console.log(`  Uploading ${(sz/1024/1024).toFixed(1)}MB...`);
  try {
    const res = await cloudinary.uploader.upload(filePath, {
      resource_type: 'video',
      folder: v.folder,
      public_id: v.public_id,
      overwrite: true,
    });
    console.log(`  OK -> ${res.secure_url}`);
    return res.secure_url;
  } catch (err) {
    console.log(`  FAIL: ${err.message.slice(0, 100)}`);
    return null;
  }
}

function saveResults() {
  fs.writeFileSync(JSON_PATH, JSON.stringify(results, null, 2));
}

async function main() {
  for (const v of videos) {
    if (done.has(v.public_id)) {
      console.log(`\n[${v.public_id}] SKIP (already uploaded)`);
      continue;
    }
    console.log(`\n[${v.public_id}]`);
    const compressed = compress(v);
    if (!compressed) {
      results.push({ ...v, url: null, error: 'compress failed' });
      saveResults();
      continue;
    }
    const url = await uploadFile(compressed, v);
    results.push({ ...v, url, error: url ? null : 'upload failed' });
    saveResults();
  }
  console.log('\n=== DONE ===');
  const ok = results.filter(r => r.url).length;
  const fail = results.filter(r => !r.url).length;
  console.log(`Success: ${ok}, Failed: ${fail}`);
}

main();
