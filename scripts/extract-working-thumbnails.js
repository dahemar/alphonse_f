const fs = require('fs');
const path = require('path');
const axios = require('axios');

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

// Working image URLs from local version (these are the ones that actually work)
const workingImages = {
  'https://www.papermag.com/palmistry-tinkerbell-interview': 'https://officemag.b-cdn.net/sites/default/files/styles/slider/public/img_5615_1_0.jpg?itok=zlmlZVCJ&c=f55f0224b7a7be3dcd1fe410c5ce1dc7',
  'https://www.papermag.com/bktherula-lvl5': 'https://officemag.b-cdn.net/sites/default/files/styles/slider/public/img_5615_1_0.jpg?itok=zlmlZVCJ&c=f55f0224b7a7be3dcd1fe410c5ce1dc7',
  'https://www.papermag.com/joanne-robertson-blue-car': 'https://officemag.b-cdn.net/sites/default/files/styles/slider/public/img_5615_1_0.jpg?itok=zlmlZVCJ&c=f55f0224b7a7be3dcd1fe410c5ce1dc7',
  'https://thecreativeindependent.com/people/painter-and-musician-joanne-robertson-on-why-its-never-just-you-creating-alone/': 'https://cdn.filestackcontent.com/AmkFtyGJREmLOuKRFzIS',
  'https://www.ninaprotocol.com/articles/the-triumph-of-julias-war-recordings-the-indie-rock-antilabel-embracing-cassette-tapes-and-90s-rave-sounds': 'https://nina.imgix.net/https%3A%2F%2Fgateway.irys.xyz%2FtWgd0Hr8hRkzPHpwGM7k9Y0ry3g8eFeXKMv-YNAF7bQ?ixlib=js-3.8.0&width=800&fm=webp&s=7ceb245389199bd13916e357e8c04a82',
  'https://officemagazine.net/building-intensity-ouri': 'https://officemag.b-cdn.net/sites/default/files/styles/slider/public/img_5615_1_0.jpg?itok=zlmlZVCJ&c=f55f0224b7a7be3dcd1fe410c5ce1dc7',
  'https://www.altpress.com/sean-kennedy-olth-interview/': 'https://officemag.b-cdn.net/sites/default/files/styles/slider/public/img_5615_1_0.jpg?itok=zlmlZVCJ&c=f55f0224b7a7be3dcd1fe410c5ce1dc7',
  'https://www.are.na/editorial/the-future-will-be-like-perfume': 'https://images.ctfassets.net/xq10wb7ogoji/V54vpcho89MkgJn1QkbuA/3f9852788f3552edaea5c612e5c57bac/The_Future_Is_Like_Perfume.png?w=1200&h=630&q=85'
};

const workingThumbnailsDir = path.join(__dirname, '../working-thumbnails');

async function downloadWorkingImage(imageUrl, filename) {
  try {
    console.log(`Downloading working image: ${imageUrl}`);
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0 Safari/537.36'
      }
    });
    
    const filePath = path.join(workingThumbnailsDir, filename);
    fs.writeFileSync(filePath, response.data);
    console.log(`✅ Saved working thumbnail: ${filename}`);
    return true;
  } catch (error) {
    console.log(`❌ Failed to download ${imageUrl}: ${error.message}`);
    return false;
  }
}

async function extractWorkingThumbnails() {
  console.log('🚀 Starting extraction of working thumbnails...');
  
  // Create directory
  if (!fs.existsSync(workingThumbnailsDir)) {
    fs.mkdirSync(workingThumbnailsDir, { recursive: true });
  }
  
  const metadata = [];
  
  for (const url of urls) {
    console.log(`\n--- Processing: ${url} ---`);
    
    const workingImageUrl = workingImages[url];
    if (!workingImageUrl) {
      console.log('⚠️  No working image found for this URL');
      continue;
    }
    
    // Generate filename from URL
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace('www.', '').replace('.', '-');
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    const slug = pathParts[pathParts.length - 1] || 'index';
    
    // Clean up the slug and determine extension
    let cleanSlug = slug.replace(/[^a-zA-Z0-9-]/g, '-').replace(/-+/g, '-');
    let extension = 'jpg'; // default
    
    // Try to get extension from the working image URL
    if (workingImageUrl.includes('.')) {
      const urlParts = workingImageUrl.split('?')[0].split('.');
      if (urlParts.length > 1) {
        const possibleExt = urlParts[urlParts.length - 1].toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(possibleExt)) {
          extension = possibleExt;
        }
      }
    }
    
    const filename = `${domain}-${cleanSlug}.${extension}`;
    
    // Download working image
    const success = await downloadWorkingImage(workingImageUrl, filename);
    
    if (success) {
      // Create metadata entry
      const data = {
        title: getTitleFromUrl(url),
        description: '',
        image: `/kenna/assets/thumbnails/${filename}`,
        url,
        domain: new URL(url).hostname.replace('www.', ''),
        localImage: filename
      };
      
      metadata.push(data);
    }
    
    // Small delay to avoid overwhelming servers
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Save metadata
  const metadataPath = path.join(workingThumbnailsDir, 'working-thumbnails-data.json');
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  console.log(`\n✅ Working thumbnails metadata saved to: ${metadataPath}`);
  
  console.log('\n🎉 Working thumbnails extraction complete!');
  console.log(`📁 Extracted ${metadata.length} working thumbnails in: ${workingThumbnailsDir}`);
}

function getTitleFromUrl(url) {
  const titles = {
    'https://www.papermag.com/palmistry-tinkerbell-interview': 'Palmistry Tinkerbell Interview',
    'https://www.papermag.com/bktherula-lvl5': 'BKTHERULA Lvl5',
    'https://www.papermag.com/joanne-robertson-blue-car': 'Joanne Robertson Blue Car',
    'https://thecreativeindependent.com/people/painter-and-musician-joanne-robertson-on-why-its-never-just-you-creating-alone/': 'Joanne Robertson on Creating Alone',
    'https://www.ninaprotocol.com/articles/the-triumph-of-julias-war-recordings-the-indie-rock-antilabel-embracing-cassette-tapes-and-90s-rave-sounds': 'Julia\'s War Recordings: The Indie Rock Antilabel',
    'https://officemagazine.net/building-intensity-ouri': 'Building Intensity: Ouri',
    'https://www.altpress.com/sean-kennedy-olth-interview/': 'Sean Kennedy Olth Interview',
    'https://www.are.na/editorial/the-future-will-be-like-perfume': 'The Future Will Be Like Perfume'
  };
  
  return titles[url] || '';
}

// Run if called directly
if (require.main === module) {
  extractWorkingThumbnails().catch(console.error);
}

module.exports = { extractWorkingThumbnails };
