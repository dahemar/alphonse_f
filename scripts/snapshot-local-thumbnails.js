const fs = require('fs');
const path = require('path');
const axios = require('axios');

// URLs to process (same list used by the app)
const urls = [
  'https://www.papermag.com/palmistry-tinkerbell-interview',
  'https://www.papermag.com/bktherula-lvl5',
  'https://www.papermag.com/joanne-robertson-blue-car',
  'https://thecreativeindependent.com/people/painter-and-musician-joanne-robertson-on-why-its-never-just-you-creating-alone/',
  'https://www.ninaprotocol.com/articles/the-triumph-of-julias-war-recordings-the-indie-rock-antilabel-embracing-cassette-tapes-and-90s-rave-sounds',
  'https://officemagazine.net/building-intensity-ouri',
  'https://www.altpress.com/sean-kennedy-olth-interview/',
  'https://www.are.na/editorial/the-future-will-be-like-perfume'
];

const outputDir = path.join(__dirname, '../local-thumbnails');

async function fetchLocalMetadata(url) {
  const endpoint = 'http://localhost:4000/api/og';
  try {
    const response = await axios.get(endpoint, {
      params: { url },
      timeout: 25000,
      validateStatus: () => true
    });
    if (response.data && response.data.status === 'success') {
      return response.data.data;
    }
    return null;
  } catch (err) {
    console.log('⚠️  Local metadata fetch failed for', url, '-', err.message);
    return null;
  }
}

function makeFilename(url, imageUrl) {
  const urlObj = new URL(url);
  const domain = urlObj.hostname.replace('www.', '').replace(/\./g, '-');
  const pathParts = urlObj.pathname.split('/').filter(Boolean);
  const slug = pathParts[pathParts.length - 1] || 'index';
  const cleanSlug = slug.replace(/[^a-zA-Z0-9-]/g, '-').replace(/-+/g, '-');

  let ext = 'jpg';
  if (imageUrl) {
    const base = imageUrl.split('?')[0];
    const parts = base.split('.');
    const maybe = parts[parts.length - 1]?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(maybe)) ext = maybe;
  }
  return `${domain}-${cleanSlug}.${ext}`;
}

async function downloadImage(imageUrl, filename) {
  try {
    console.log(`⬇️  Downloading: ${imageUrl}`);
    const res = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0 Safari/537.36',
        'Referer': 'https://localhost/'
      }
    });
    fs.writeFileSync(path.join(outputDir, filename), res.data);
    console.log(`✅ Saved: ${filename}`);
    return true;
  } catch (e) {
    console.log(`❌ Download failed for ${imageUrl}: ${e.message}`);
    return false;
  }
}

async function snapshot() {
  console.log('🚀 Snapshotting local thumbnails from localhost:4000 ...');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const metaOut = [];

  for (const url of urls) {
    console.log(`\n--- ${url} ---`);
    const data = await fetchLocalMetadata(url);
    if (!data) {
      console.log('⚠️  No local metadata. Skipping.');
      continue;
    }
    const imageUrl = data.image || '';
    if (!imageUrl) {
      console.log('⚠️  No image in local metadata. Skipping.');
      continue;
    }

    const filename = makeFilename(url, imageUrl);
    const ok = await downloadImage(imageUrl, filename);
    if (ok) {
      const domain = new URL(url).hostname.replace('www.', '');
      metaOut.push({
        title: data.title || '',
        description: data.description || '',
        image: `/kenna/assets/thumbnails/${filename}`,
        url,
        domain,
        localImage: filename
      });
    }

    await new Promise(r => setTimeout(r, 500));
  }

  const outPath = path.join(outputDir, 'local-thumbnails-data.json');
  fs.writeFileSync(outPath, JSON.stringify(metaOut, null, 2));
  console.log(`\n✅ Wrote metadata: ${outPath}`);
  console.log(`🎉 Done. Saved ${metaOut.length} images to ${outputDir}`);
}

if (require.main === module) {
  snapshot().catch(console.error);
}

module.exports = { snapshot };
