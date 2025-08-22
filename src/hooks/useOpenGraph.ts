import { useState, useEffect } from 'react';

interface OpenGraphData {
  title: string;
  description: string;
  image: string;
  url: string;
  domain: string;
}

interface UseOpenGraphReturn {
  data: OpenGraphData | null;
  loading: boolean;
  error: string | null;
}

// Simple in-memory cache per session
const ogCache: Map<string, OpenGraphData> = new Map();

// Pre-generated thumbnail data (will be populated during build)
let preGeneratedData: OpenGraphData[] = [];
let dataLoaded = false;

// Try to load pre-generated data
const loadPreGeneratedData = async () => {
  if (dataLoaded) return;
  
  try {
    // In production (GitHub Pages), this will be available
    if (typeof window !== 'undefined' && window.location.hostname.includes('github.io')) {
      const response = await fetch('/alphonse_f/thumbnail-data.json');
      if (response.ok) {
        const data = await response.json();
        preGeneratedData = data;
        dataLoaded = true;
        console.log('✅ Loaded pre-generated thumbnail data:', data.length, 'items');
      }
    }
  } catch (error) {
    console.log('⚠️  Could not load pre-generated data:', error);
  }
};

export const useOpenGraph = (url: string): UseOpenGraphReturn => {
  const [data, setData] = useState<OpenGraphData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOpenGraph = async () => {
      if (!url) return;

      // Serve from cache immediately if present
      const cached = ogCache.get(url);
      if (cached) {
        setData(cached);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const isLocal = typeof window !== 'undefined' && (window.location.hostname.includes('localhost') || window.location.hostname === '127.0.0.1');

        if (isLocal) {
          // Desarrollo: usa backend local
          try {
            const response = await fetch(`/api/og?url=${encodeURIComponent(url)}`);
            if (response.ok) {
              const result = await response.json();
              if (result && result.status === 'success') {
                setData(result.data);
                ogCache.set(url, result.data);
                return;
              }
            }
          } catch (localErr) {
            console.log('Local API failed, falling back to pre-generated data');
          }
        }

        // Producción o fallback: usa datos pre-generados
        // Ensure pre-generated data is loaded
        if (!dataLoaded) {
          await loadPreGeneratedData();
        }
        
        const preGenerated = preGeneratedData.find(item => item.url === url);
        if (preGenerated) {
          console.log('Using pre-generated data for:', url);
          setData(preGenerated);
          ogCache.set(url, preGenerated);
        } else {
          console.log('No pre-generated data found for:', url);
          const domain = new URL(url).hostname.replace('www.', '');
          const fallback = { title: '', description: '', image: '', url, domain };
          setData(fallback);
          ogCache.set(url, fallback);
        }
      } catch (err: any) {
        console.error('Error fetching OG data:', err);
        try {
          const domain = new URL(url).hostname.replace('www.', '');
          const fallback = { title: '', description: '', image: '', url, domain };
          setData(fallback);
          ogCache.set(url, fallback);
        } catch (fallbackError) {
          setError('Error al obtener metadatos');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOpenGraph();
  }, [url]);

  return { data, loading, error };
};
