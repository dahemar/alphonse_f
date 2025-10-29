class ContentManager {
  constructor() {
    this.API_KEY = 'AIzaSyBHQgbSv588A3qr-Kzeo6YrZ9TbVNlrSkc';
    this.SPREADSHEET_ID = '1OLoEI-7O9YNIuI-bVig1MNe63xocs_jPS3yLTgMB4zE';
    this.cache = null;
    this.lastFetch = 0;
    this.CACHE_DURATION = 1 * 60 * 1000; // 1 minute cache
    this.preloadPromise = null;
    this.isInitialized = false;
    this.LOCAL_STORAGE_KEY = 'content-manager-cache-v1';
  }

  loadFromStorage() {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.localStorage.getItem(this.LOCAL_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.timestamp || !parsed.data) return null;
      if (Date.now() - parsed.timestamp > this.CACHE_DURATION) return null;
      this.cache = parsed.data;
      this.lastFetch = parsed.timestamp;
      this.isInitialized = true;
      return parsed.data;
    } catch (error) {
      console.warn('ContentManager: failed to load from storage', error);
      return null;
    }
  }

  saveToStorage(data) {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify({
        timestamp: Date.now(),
        data
      }));
    } catch (error) {
      console.warn('ContentManager: failed to save to storage', error);
    }
  }

  clearStorage() {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(this.LOCAL_STORAGE_KEY);
    } catch (error) {
      console.warn('ContentManager: failed to clear storage', error);
    }
  }

  // Initialize and wait for data to be ready
  async initialize() {
    if (this.isInitialized) {
      return this.cache;
    }

    const cached = this.loadFromStorage();
    if (cached) {
      return cached;
    }
    
    try {
      const data = await this.fetchData();
      this.isInitialized = true;
      return data;
    } catch (error) {
      console.error('Failed to initialize ContentManager:', error);
      throw error;
    }
  }

  // Get data - ensures it's loaded first
  async getData() {
    if (!this.isInitialized) {
      return this.initialize();
    }
    return this.cache;
  }

  // Preload data immediately when class is instantiated
  preload() {
    if (!this.preloadPromise) {
      this.preloadPromise = this.initialize();
    }
    return this.preloadPromise;
  }

  async fetchBatchData() {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.SPREADSHEET_ID}/values:batchGet?ranges=Articles!A2:E&ranges=Bio!A2:B&key=${this.API_KEY}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        cache: 'default'
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.valueRanges || [];
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Timeout fetching Google Sheets data');
      }
      throw error;
    }
  }

  async fetchData() {
    try {
      if (this.cache && (Date.now() - this.lastFetch) < this.CACHE_DURATION) {
        return this.cache;
      }

      const valueRanges = await this.fetchBatchData();
      const articlesData = valueRanges[0]?.values || [];
      const bioData = valueRanges[1]?.values || [];

      const links = [];
      if (articlesData.length > 0) {
        for (const row of articlesData) {
          if (!row || row.length === 0) continue;
          const [url, title, domain, thumbnailUrl, orderValue] = row;
          if (url && title && domain) {
            const article = {
              url: url.trim(),
              title: title.trim(),
              domain: domain.trim(),
              thumbnail: thumbnailUrl ? thumbnailUrl.trim() : undefined,
              order: orderValue ? parseInt(orderValue, 10) : 999
            };
            try {
              new URL(article.url);
              links.push(article);
            } catch (urlError) {
              console.warn('Invalid URL, skipping row:', row, urlError);
            }
          }
        }
        links.sort((a, b) => a.order - b.order);
      }

      let bioSubtitle = '';
      let bioLightboxContent = '';

      if (bioData.length > 0) {
        const [subtitleCell, lightboxCell] = bioData[0];
        if (subtitleCell) bioSubtitle = subtitleCell.trim();
        if (lightboxCell) bioLightboxContent = lightboxCell.trim();
        if (bioData.length > 1 && !bioLightboxContent && bioData[1]?.[0]) {
          bioLightboxContent = bioData[1][0].trim();
        }
      }

      const data = {
        bio: bioSubtitle,
        bioLightbox: bioLightboxContent,
        links
      };

      this.cache = data;
      this.lastFetch = Date.now();
      this.saveToStorage(data);

      return data;

    } catch (error) {
      console.error('Error fetching Google Sheets data:', error);
      throw error;
    }
  }

  async refresh() {
    this.cache = null;
    this.lastFetch = 0;
    this.preloadPromise = null;
    this.isInitialized = false;
    this.clearStorage();
    return this.initialize();
  }
}

const contentManager = new ContentManager();
contentManager.preload();
export default contentManager;
