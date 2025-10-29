class ContentManager {
  constructor() {
    this.API_KEY = 'AIzaSyBHQgbSv588A3qr-Kzeo6YrZ9TbVNlrSkc';
    this.SPREADSHEET_ID = '1OLoEI-7O9YNIuI-bVig1MNe63xocs_jPS3yLTgMB4zE';
    this.cache = null;
    this.lastFetch = 0;
    this.CACHE_DURATION = 1 * 60 * 1000; // 1 minute cache
    this.preloadPromise = null;
    this.isInitialized = false;
  }

  // Initialize and wait for data to be ready
  async initialize() {
    if (this.isInitialized) {
      return this.cache;
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

  async fetchSheetData(sheetName, range = '') {
    const rangeParam = range ? `!${range}` : '';
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.SPREADSHEET_ID}/values/${sheetName}${rangeParam}?key=${this.API_KEY}`;
    
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
      return result.values || [];
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error(`Timeout fetching ${sheetName}`);
      }
      throw error;
    }
  }

  async fetchData() {
    try {
      // Check cache first
      if (this.cache && (Date.now() - this.lastFetch) < this.CACHE_DURATION) {
        return this.cache;
      }
      
      // Fetch data from multiple sheets in parallel
      const [articlesData, bioData] = await Promise.all([
        this.fetchSheetData('Articles', 'A2:E'), // Skip header row
        this.fetchSheetData('Bio', 'A2:B') // Skip header row
      ]);

      // Parse Articles sheet
      const links = [];
      if (articlesData && articlesData.length > 0) {
        for (const row of articlesData) {
          if (!row || row.length === 0) continue;
          
          // Expected columns: url, title, domain, thumbnail_url, order
          if (row[0] && row[1] && row[2]) {
            const article = {
              url: row[0].trim(),
              title: row[1].trim(),
              domain: row[2].trim(),
              thumbnail: row[3] ? row[3].trim() : undefined,
              order: row[4] ? parseInt(row[4], 10) : 999 // Default order if not specified
            };
            
            // Validate URL format
            try {
              new URL(article.url);
              links.push(article);
            } catch (urlError) {
              console.warn('Invalid URL, skipping row:', row, urlError);
            }
          }
        }
        
        // Sort by order
        links.sort((a, b) => a.order - b.order);
      }

      // Parse Bio sheet
      let bioSubtitle = '';
      let bioLightboxContent = '';
      
      if (bioData && bioData.length > 0) {
        // First row: subtitle, second row: lightbox content
        if (bioData[0] && bioData[0][0]) {
          bioSubtitle = bioData[0][0].trim();
        }
        if (bioData[0] && bioData[0][1]) {
          bioLightboxContent = bioData[0][1].trim();
        }
        // If there are multiple rows, first column is subtitle, second is lightbox
        // But we can also have subtitle in row 0, lightbox in row 1
        if (bioData.length > 1 && bioData[1] && bioData[1][0]) {
          bioLightboxContent = bioData[1][0].trim();
        }
      }

      const data = {
        bio: bioSubtitle,
        bioLightbox: bioLightboxContent,
        links
      };
      
      // Update cache
      this.cache = data;
      this.lastFetch = Date.now();
      
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
    return this.initialize();
  }
}

// Create and export a singleton instance
const contentManager = new ContentManager();

// Start preloading immediately
contentManager.preload();

export default contentManager;
