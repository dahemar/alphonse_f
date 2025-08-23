class ContentManager {
  constructor() {
    this.API_KEY = 'AIzaSyBHQgbSv588A3qr-Kzeo6YrZ9TbVNlrSkc';
    this.SPREADSHEET_ID = '12sMGjn8DGuKlSmykoQqH_oMGowPZMo-qA3WDnHm2_tM';
    this.SHEET_NAME = 'kenna';
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
      console.log('Initializing ContentManager...');
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

  async fetchData() {
    try {
      // Check cache first with longer duration
      if (this.cache && (Date.now() - this.lastFetch) < this.CACHE_DURATION) {
        console.log('Using cached data (age:', Math.round((Date.now() - this.lastFetch) / 1000), 's)');
        return this.cache;
      }

      console.log('Fetching fresh data from Google Sheets...');
      
      // Use direct Google Sheets API call with specific range
      // Format: kenna!A2:D (skip header row, get columns A-D)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
      
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.SPREADSHEET_ID}/values/kenna!A2:D?key=${this.API_KEY}`,
        { signal: controller.signal }
      );
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Raw API response received');
      
      const values = result.values;

      if (!values || values.length === 0) {
        throw new Error('No data found in the sheet');
      }

      // Parse the data - simplified structure
      // Row 0: Bio in column A
      // Row 1+: Article data (url, title, domain, thumbnail)
      
      let bio = '';
      const links = [];

      // First row (index 0) should contain bio in column A
      if (values[0] && values[0][0]) {
        bio = values[0][0].trim();
      }

      // Parse articles starting from second row (index 1)
      for (let i = 1; i < values.length; i++) {
        const row = values[i];
        if (!row || row.length === 0) continue; // Skip empty rows
        
        // Check if this row has the minimum required data
        if (row[0] && row[1] && row[2]) { // url, title, domain
          const article = {
            url: row[0].trim(),
            title: row[1].trim(),
            domain: row[2].trim(),
            thumbnail: row[3] ? row[3].trim() : undefined
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

      const data = { bio, links };
      
      // Update cache
      this.cache = data;
      this.lastFetch = Date.now();
      
      console.log('Data fetched successfully:', `${links.length} articles, bio length: ${bio.length}`);
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
