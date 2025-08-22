const fs = require('fs');
const path = require('path');

// URLs to process
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

const buildDir = path.join(__dirname, '../build');
const assetsDir = path.join(buildDir, 'assets');
const thumbnailsDir = path.join(assetsDir, 'thumbnails');
const workingThumbnailsDir = path.join(__dirname, '../working-thumbnails');
const localThumbnailsDir = path.join(__dirname, '../local-thumbnails');
const imagesDir = path.join(__dirname, '../images');
const fallbackDir = path.join(assetsDir, 'fallback');

function pickSource() {
  const localMetaPath = path.join(localThumbnailsDir, 'local-thumbnails-data.json');
  const workingMetaPath = path.join(workingThumbnailsDir, 'working-thumbnails-data.json');

  if (fs.existsSync(localMetaPath)) {
    return { dir: localThumbnailsDir, metaPath: localMetaPath, label: 'local-thumbnails' };
  }
  if (fs.existsSync(workingMetaPath)) {
    return { dir: workingThumbnailsDir, metaPath: workingMetaPath, label: 'working-thumbnails' };
  }
  return null;
}

function copyFallbackImages() {
  try {
    if (!fs.existsSync(imagesDir)) {
      console.log('ℹ️  No images/ directory found for fallbacks. Skipping.');
      return;
    }
    if (!fs.existsSync(fallbackDir)) fs.mkdirSync(fallbackDir, { recursive: true });
    const files = fs.readdirSync(imagesDir);
    for (const f of files) {
      const src = path.join(imagesDir, f);
      const dst = path.join(fallbackDir, f);
      const stat = fs.statSync(src);
      if (stat.isFile()) {
        fs.copyFileSync(src, dst);
        console.log(`✅ Copied fallback image: ${f}`);
      }
    }
  } catch (e) {
    console.log('⚠️  Failed copying fallback images:', e.message);
  }
}

async function copyThumbnails() {
  console.log('🚀 Preparing thumbnails for build...');

  const source = pickSource();
  if (!source) {
    console.log('❌ No thumbnail source found. Run snapshot-local-thumbnails.js or extract-working-thumbnails.js first.');
  }

  // Create directories
  if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir, { recursive: true });
  if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });
  if (!fs.existsSync(thumbnailsDir)) fs.mkdirSync(thumbnailsDir, { recursive: true });

  // Always copy user-provided fallback images
  copyFallbackImages();

  const metadata = [];

  if (source) {
    // Load metadata
    const items = JSON.parse(fs.readFileSync(source.metaPath, 'utf8'));
    console.log(`📁 Using ${items.length} items from ${source.label}`);

    for (const item of items) {
      const src = path.join(source.dir, item.localImage);
      const dst = path.join(thumbnailsDir, item.localImage);
      if (!fs.existsSync(src)) {
        console.log(`⚠️  Missing source image: ${src}`);
        continue;
      }
      fs.copyFileSync(src, dst);
      console.log(`✅ Copied: ${item.localImage}`);

      metadata.push({
        title: item.title,
        description: item.description || '',
        image: `/kenna/assets/thumbnails/${item.localImage}`,
        url: item.url,
        domain: item.domain,
        localImage: item.localImage
      });
    }
  }

  const metadataPath = path.join(buildDir, 'thumbnail-data.json');
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  console.log(`\n✅ Metadata saved to: ${metadataPath}`);
  console.log('🎉 Thumbnails ready.');
}

if (require.main === module) {
  copyThumbnails().catch(console.error);
}

module.exports = { copyThumbnails };
