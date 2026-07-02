const cloudinary = require('cloudinary').v2;
const path = require('path');
const fs = require('fs');

cloudinary.config({
  cloud_name: 'dqufkjjbz',
  api_key: '815962119251441',
  api_secret: 'nEl7qietEqe306WmOsYkpIaIwak',
});

const BASE = '/mnt/d/ФОКУС/маркин/Markin';

const videos = [
  // fx.html
  { local: 'images/Spec/IMG_5181.mov', folder: 'markin/fx', public_id: 'IMG_5181' },
  { local: 'images/Spec/IMG_5528.mov', folder: 'markin/fx', public_id: 'IMG_5528' },
  { local: 'images/Spec/IMG_7184.MOV', folder: 'markin/fx', public_id: 'IMG_7184' },
  { local: 'images/Spec/IMG_7408.mov', folder: 'markin/fx', public_id: 'IMG_7408' },
  { local: 'images/Spec/гендер пати.MOV', folder: 'markin/fx', public_id: 'gender-party' },
  // index.html
  { local: 'video/effects.mp4', folder: 'markin/hero', public_id: 'effects' },
  // light.html
  { local: 'video/Fog_and_smoke.mp4', folder: 'markin/hero', public_id: 'fog-and-smoke' },
  { local: 'images/Svet/IMG_9541.mp4', folder: 'markin/light', public_id: 'IMG_9541' },
  // portfolio.html
  { local: 'images/couples/arseniy-agnessa/IMG_9613.MOV', folder: 'markin/portfolio', public_id: 'arseniy-9613' },
  { local: 'images/couples/arseniy-agnessa/IMG_9621.MOV', folder: 'markin/portfolio', public_id: 'arseniy-9621' },
  { local: 'images/couples/arseniy-agnessa/IMG_9675.MOV', folder: 'markin/portfolio', public_id: 'arseniy-9675' },
  { local: 'images/couples/artem-anastasiya/IMG_9909.MOV', folder: 'markin/portfolio', public_id: 'artem-9909' },
  { local: 'images/couples/nikita-darya/IMG_9908.MP4', folder: 'markin/portfolio', public_id: 'nikita-9908' },
  { local: 'images/all/IMG_9541.mp4', folder: 'markin/portfolio', public_id: 'IMG_9541-all' },
];

async function uploadAll() {
  const results = [];
  for (const v of videos) {
    const fullPath = path.join(BASE, v.local);
    const sizeMB = (fs.statSync(fullPath).size / 1024 / 1024).toFixed(1);
    process.stdout.write(`Uploading ${v.public_id} (${sizeMB}MB)... `);
    try {
      const res = await cloudinary.uploader.upload(fullPath, {
        resource_type: 'video',
        folder: v.folder,
        public_id: v.public_id,
        overwrite: true,
      });
      console.log(`OK -> ${res.secure_url}`);
      results.push({ ...v, url: res.secure_url });
    } catch (err) {
      console.log(`FAIL: ${err.message}`);
      results.push({ ...v, url: null, error: err.message });
    }
  }
  // Save URLs for reference
  fs.writeFileSync(path.join(BASE, 'cloudinary-urls.json'), JSON.stringify(results, null, 2));
  console.log('\nDone! URLs saved to cloudinary-urls.json');
}

uploadAll();
