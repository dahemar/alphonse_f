const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());

const port = process.env.PORT || 4000;

// Serve local fallback images for development
app.use('/assets/fallback', express.static(path.join(__dirname, 'images')));

async function fetchViaMicrolink(targetUrl) {
  const microlinkUrl = `https://api.microlink.io?url=${encodeURIComponent(targetUrl)}&screenshot=true&meta=true&embed=screenshot.url`;
  const resp = await axios.get(microlinkUrl, { timeout: 20000, validateStatus: () => true });
  if (resp.data && resp.data.status === 'success') {
    const d = resp.data.data;
    const image = (d.screenshot && d.screenshot.url) || (d.image && d.image.url) || '';
    return {
      _raw: d,
      title: d.title || '',
      description: d.description || '',
      image,
      url: targetUrl,
      domain: new URL(targetUrl).hostname.replace('www.', '')
    };
  }
  const errMsg = resp.data && resp.data.status ? `Microlink status=${resp.data.status}` : `HTTP ${resp.status}`;
  throw new Error(errMsg);
}

function extractFromHtml(html, targetUrl) {
  const $ = cheerio.load(html);

  // Si el HTML aparenta ser una página de bloqueo/403, devolver vacío
  const rawTitle = ($('title').text() || '').trim();
  if (/^(403|forbidden|access denied)/i.test(rawTitle) || html.toLowerCase().includes('error 403')) {
    const domain403 = new URL(targetUrl).hostname.replace('www.', '');
    return { title: '', description: '', image: '', url: targetUrl, domain: domain403 };
  }

  const pick = (selectors) => {
    for (const s of selectors) {
      const el = $(s);
      const v = el.attr('content') || el.attr('href') || (s === 'title' ? $('title').text() : undefined);
      if (v) return v;
    }
    return undefined;
  };

  const title = pick([
    'meta[property="og:title"]',
    'meta[name="og:title"]',
    'meta[name="twitter:title"]',
    'meta[property="twitter:title"]',
    'title'
  ]) || '';

  const description = pick([
    'meta[property="og:description"]',
    'meta[name="og:description"]',
    'meta[name="description"]',
    'meta[name="twitter:description"]',
    'meta[property="twitter:description"]'
  ]) || '';

  // Reunir múltiples candidatos de imagen
  const candidates = new Set();
  const pushIf = (val) => { if (val && typeof val === 'string') candidates.add(val); };

  $('meta[property="og:image"], meta[property="og:image:url"], meta[property="og:image:secure_url"]').each((_, el) => pushIf($(el).attr('content')));
  $('meta[name="twitter:image"], meta[name="twitter:image:src"]').each((_, el) => pushIf($(el).attr('content')));
  $('meta[itemprop="image"]').each((_, el) => pushIf($(el).attr('content')));
  $('meta[name="thumbnail"]').each((_, el) => pushIf($(el).attr('content')));
  $('link[rel="image_src"]').each((_, el) => pushIf($(el).attr('href')));
  $('link[rel="preload"][as="image"]').each((_, el) => pushIf($(el).attr('href')));

  // Extraer de <img> por src / data-src / srcset y elegir mayor resolución
  const parseSrcset = (srcset) => {
    try {
      return srcset.split(',')
        .map(s => s.trim())
        .map(entry => {
          const parts = entry.split(/\s+/);
          const url = parts[0];
          const size = parts[1] || '';
          const wMatch = size.match(/(\d+)w/);
          const px = wMatch ? parseInt(wMatch[1], 10) : 0;
          return { url, px };
        })
        .sort((a,b) => b.px - a.px);
    } catch { return []; }
  };

  // picture > source
  $('picture source[srcset], source[srcset]').each((_, el) => {
    const srcset = $(el).attr('srcset') || $(el).attr('data-srcset');
    if (srcset) {
      const list = parseSrcset(srcset);
      if (list.length) pushIf(list[0].url);
    }
  });

  $('img').each((_, el) => {
    const $el = $(el);
    const srcset = $el.attr('srcset') || $el.attr('data-srcset');
    if (srcset) {
      const list = parseSrcset(srcset);
      if (list.length) pushIf(list[0].url);
    }
    const dataSrc = $el.attr('data-src');
    if (dataSrc) pushIf(dataSrc);
    const src = $el.attr('src');
    if (src) pushIf(src);
  });

  // Intentar extraer desde JSON-LD
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).contents().text());
      const maybeImages = [];

      const collectFromImage = (img) => {
        if (!img) return;
        if (typeof img === 'string') {
          maybeImages.push(img);
        } else if (Array.isArray(img)) {
          img.forEach(collectFromImage);
        } else if (typeof img === 'object') {
          if (typeof img.url === 'string') maybeImages.push(img.url);
          if (typeof img.contentUrl === 'string') maybeImages.push(img.contentUrl);
        }
      };

      if (json) {
        collectFromImage(json.image);
        const graph = json['@graph'];
        if (graph && Array.isArray(graph)) {
          graph.forEach((node) => {
            if (!node) return;
            collectFromImage(node.image);
          });
        }
      }
      maybeImages.forEach(pushIf);
    } catch (_) {}
  });

  // Heurística para puntuar URLs de imagen
  const scoreImage = (u) => {
    let score = 0;
    const lowTokens = ['favicon', 'sprite', 'logo', 'placeholder', 'seedling'];
    const hiTokens = ['1200', '1080', '1024', 'w=1200', 'w=1080', 'width=1200', '1200x', 'x1200', '630', 'og:image'];
    const extOk = /(\.jpg|\.jpeg|\.png|\.webp)(\?|$)/i.test(u) ? 1 : 0;

    if (extOk) score += 2; else score -= 1;
    hiTokens.forEach(t => { if (u.toLowerCase().includes(t)) score += 3; });
    lowTokens.forEach(t => { if (u.toLowerCase().includes(t)) score -= 3; });
    return score;
  };

  // Normalizar a absoluta y escoger mejor
  let bestImage = '';
  let bestScore = -Infinity;
  const toAbs = (img) => {
    if (!img) return '';
    if (/^https?:\/\//i.test(img)) return img;
    try {
      const base = new URL(targetUrl);
      return new URL(img, base.origin).href;
    } catch { return ''; }
  };

  Array.from(candidates).forEach((raw) => {
    const abs = toAbs(raw);
    if (!abs) return;
    const sc = scoreImage(abs);
    if (sc > bestScore) {
      bestScore = sc;
      bestImage = abs;
    }
  });

  const domain = new URL(targetUrl).hostname.replace('www.', '');

  return { title, description, image: bestImage, url: targetUrl, domain };
}

app.get('/api/og', async (req, res) => {
  const targetUrl = req.query.url;
  const debug = req.query.debug === '1' || req.query.debug === 'true';
  if (!targetUrl) {
    return res.status(400).json({ status: 'error', message: 'Missing url param' });
  }

  console.log(`[OG] → ${targetUrl}`);

  try {
    // 1) Try Microlink first (avoids many 403s)
    try {
      const microlink = await fetchViaMicrolink(targetUrl);
      // Sanitizar títulos/descr/imágenes tipo 403/Forbidden
      const blockedRe = /403|forbidden|access denied/i;
      if (blockedRe.test(microlink.title)) {
        microlink.title = '';
      }
      if (blockedRe.test(microlink.description)) {
        microlink.description = '';
      }
      if (blockedRe.test(microlink.title) || blockedRe.test(microlink.description)) {
        microlink.image = '';
      }
      if (debug) {
        return res.json({ status: 'success', data: { title: microlink.title, description: microlink.description, image: microlink.image, url: microlink.url, domain: microlink.domain }, debug: { source: 'microlink', raw: microlink._raw } });
      }
      return res.json({ status: 'success', data: { title: microlink.title, description: microlink.description, image: microlink.image, url: microlink.url, domain: microlink.domain } });
    } catch (e) {
      console.log(`[OG] Microlink failed for ${targetUrl}: ${e.message}`);
      // 2) Fallback: direct HTML fetch + cheerio parse
      try {
        const resp = await axios.get(targetUrl, {
          timeout: 20000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Connection': 'keep-alive'
          },
          validateStatus: () => true
        });
        const html = typeof resp.data === 'string' ? resp.data : '';
        const parsed = extractFromHtml(html, targetUrl);
        // Sanitizar 403
        const blockedRe = /403|forbidden|access denied/i;
        if (blockedRe.test(parsed.title)) parsed.title = '';
        if (blockedRe.test(parsed.description)) parsed.description = '';
        if (blockedRe.test(parsed.title) || blockedRe.test(parsed.description)) parsed.image = '';
        if (debug) {
          return res.json({ status: 'success', data: parsed, debug: { source: 'scrape', httpStatus: resp.status } });
        }
        return res.json({ status: 'success', data: parsed });
      } catch (scrapeErr) {
        console.log(`[OG] scrape failed for ${targetUrl}: ${scrapeErr.message}`);
      }
      // 3) Final fallback: empty
      const domain = new URL(targetUrl).hostname.replace('www.', '');
      const payload = { title: '', description: '', image: '', url: targetUrl, domain };
      if (debug) {
        return res.json({ status: 'success', data: payload, debug: { source: 'fallback', reason: e.message } });
      }
      return res.json({ status: 'success', data: payload });
    }
  } catch (err) {
    console.error('[OG] Unexpected error:', err.message);
    const domain = new URL(targetUrl).hostname.replace('www.', '');
    const payload = { title: '', description: '', image: '', url: targetUrl, domain };
    if (debug) {
      return res.json({ status: 'success', data: payload, debug: { source: 'catch', error: err.message } });
    }
    return res.status(200).json({ status: 'success', data: payload });
  }
});

// Image proxy to avoid hotlink 403s
app.get('/api/image', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).send('Missing url');
  try {
    const resp = await axios.get(targetUrl, {
      responseType: 'arraybuffer',
      timeout: 20000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/jpeg,image/png,image/gif,*/*;q=0.8',
        // Spoof referer to try to bypass hotlink protections
        'Referer': (() => { try { return new URL(targetUrl).origin; } catch { return undefined; } })()
      },
      validateStatus: () => true
    });
    console.log(`[IMG] ${resp.status} ← ${targetUrl}`);
    if (resp.status >= 400 || !resp.data) {
      return res.status(200).end();
    }
    const contentType = resp.headers['content-type'] || 'image/jpeg';
    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=3600');
    return res.send(Buffer.from(resp.data));
  } catch (e) {
    console.log(`[IMG] error for ${targetUrl}: ${e.message}`);
    return res.status(200).end();
  }
});

// Google Sheets API proxy to avoid CORS issues
app.get('/api/sheets', async (req, res) => {
  const { spreadsheetId, sheetName, apiKey } = req.query;
  
  if (!spreadsheetId || !sheetName || !apiKey) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    console.log(`[SHEETS] Fetching sheet: ${sheetName} from ${spreadsheetId}`);
    
    const response = await axios.get(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}`,
      {
        params: { key: apiKey },
        timeout: 10000
      }
    );

    console.log(`[SHEETS] Successfully fetched ${sheetName}`);
    res.json(response.data);
    
  } catch (error) {
    console.error(`[SHEETS] Error fetching sheet:`, error.message);
    
    if (error.response) {
      console.error(`[SHEETS] Response status: ${error.response.status}`);
      console.error(`[SHEETS] Response data:`, error.response.data);
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch Google Sheets data',
      details: error.message 
    });
  }
});

app.listen(port, () => {
  console.log(`OG server running on http://localhost:${port}`);
});
