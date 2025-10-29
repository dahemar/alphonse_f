import React, { useState, useEffect, Suspense, lazy, useCallback } from 'react';
import styled from 'styled-components';
import contentManager from './utils/ContentManager';
import BioLightbox from './components/BioLightbox';

// Lazy load heavy components
const MediaPlayer = lazy(() => import('./components/MediaPlayer'));
const Bio = lazy(() => import('./components/Bio'));
const OrnamentalDivider = lazy(() => import('./components/OrnamentalDivider'));

const AppContainer = styled.div`
  min-height: 100dvh; /* use dynamic viewport height */
  /* Regular color scheme */
  --bg: #FFFFFF;
  --fg: #000000;
  --accent1: #000000;
  --accent2: #000000;
  background: var(--bg);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  padding: 2rem;
  font-family: 'Times New Roman', Times, serif;
  color: var(--fg);

  /* Mobile responsive padding and layout */
  @media (max-width: 768px) {
    padding: 1rem;
    padding-top: calc(3.25rem + env(safe-area-inset-top)); /* extra margin + iOS safe area */
  }
`;

const ContentWrapper = styled.div`
  max-width: 900px;
  width: 100%;
  text-align: left;

  /* Mobile centering - removed, keep left alignment */
  @media (max-width: 768px) {
    text-align: left;
    max-width: 100%;
    overflow-x: hidden;
    width: 100%; /* avoid 100vw which can cause overflow on iOS */
  }
`;

const TitleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 1rem;

  @media (max-width: 768px) {
    margin-bottom: 0.6rem;
  }
`;

const BioButton = styled.button`
  appearance: none;
  border: 1px solid var(--accent1);
  background: transparent;
  color: var(--fg);
  padding: 6px 14px;
  border-radius: 0;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 120ms linear, color 120ms linear;
  outline: none;
  line-height: 1.4;
  transform: translateY(5px);
  
  /* Remove any focus outlines that might appear */
  &:focus,
  &:focus-visible {
    outline: none;
    box-shadow: none;
  }
  
  &:hover {
    border-color: var(--accent2);
  }

  /* Mobile touch-friendly sizing */
  @media (max-width: 768px) {
    padding: 8px 14px;
    font-size: 13px;
    min-height: 36px;
    min-width: 50px;
  }
`;


const InvisibleAccent = styled.span`
  color: var(--bg); /* Same color as background - invisible */
  font-size: 1.6em; /* Same size as TitleAccent */
  line-height: 0.9;
  display: inline-block;
  user-select: none; /* Cannot be selected */
  pointer-events: none; /* Cannot be interacted with */

  /* Mobile optimizations */
  @media (max-width: 768px) {
    font-size: 1.4em;
    line-height: 1;
  }
`;

// Mobile-specific title without 's'
const MobileTitle = styled.h1`
  display: none;
  margin: 0 0 0.6rem 0;
  font-size: clamp(2rem, 8vw, 2.6rem);
  font-weight: 700;
  line-height: 1.1;
  color: var(--fg);

  @media (max-width: 768px) {
    display: block;
  }
`;

const DesktopTitle = styled.h1`
  margin: 0 0 1rem 0;
  font-size: 2.6rem;
  font-weight: 700;
  line-height: 1;
  color: var(--fg);

  @media (max-width: 768px) {
    display: none;
  }
`;

function App() {
  const [currentLinkIndex, setCurrentLinkIndex] = useState(1); // Always start with second element
  const [isBioOpen, setIsBioOpen] = useState(false);
  const [bio, setBio] = useState('');
  const [bioLightbox, setBioLightbox] = useState('');
  const [links, setLinks] = useState<Array<{url: string; title: string; domain: string; thumbnail?: string}>>([]);
  const [isReady, setIsReady] = useState(false);

  // Load content from Google Sheets
  useEffect(() => {
    const loadContent = async () => {
      try {
        const data = await contentManager.getData(); // Wait for data to be ready
        
        if (data) {
          setBio(data.bio || '');
          setBioLightbox(data.bioLightbox || '');
          setLinks(data.links || []);
          setIsReady(true);
          
          // Preload first large image immediately for faster rendering
          if (data.links && data.links.length > 0) {
            const firstLink = data.links[1] || data.links[0]; // Start with second element (index 1)
            
            // Use thumbnail from Google Sheets if available, otherwise fallback to hardcoded
            let imageUrl: string | null = null;
            
            if (firstLink.thumbnail) {
              imageUrl = firstLink.thumbnail;
            } else {
              // Fallback to hardcoded mapping
              const hardcodedMap: Record<string, string> = {
                'https://www.papermag.com/bktherula-lvl5': '1.webp',
                'https://www.papermag.com/joanne-robertson-blue-car': '2.webp',
                'https://thecreativeindependent.com/people/painter-and-musician-joanne-robertson-on-why-its-never-just-you-creating-alone/': '3.jpg',
                'https://www.ninaprotocol.com/articles/the-triumph-of-julias-war-recordings-the-indie-rock-antilabel-embracing-cassette-tapes-and-90s-rave-sounds': '4.webp',
                'https://officemagazine.net/building-intensity-ouri': '5.jpg',
                'https://www.altpress.com/sean-kennedy-olth-interview/': '6.jpg',
                'https://www.are.na/editorial/the-future-will-be-like-perfume': '7.png',
                'https://www.papermag.com/palmistry-tinkerbell-interview': '8.webp'
              };
              const filename = hardcodedMap[firstLink.url];
              if (filename) {
                imageUrl = `/assets/fallback/${filename}`;
              }
            }
            
            if (imageUrl) {
              const link = document.createElement('link');
              link.rel = 'preload';
              link.as = 'image';
              link.href = imageUrl;
              document.head.appendChild(link);
            }
          }
        }
      } catch (error) {
        console.error('App: Failed to load content:', error);
        // App will remain blank if loading fails
      }
    };

    loadContent();
  }, []);

  // Memoize handlers to prevent unnecessary re-renders
  const handleLinkChange = useCallback((index: number) => {
    setCurrentLinkIndex(index);
  }, []);

  // Robust page scroll lock: vertical fixed at top, horizontal fixed at page center
  React.useEffect(() => {
    const computeLock = () => {
      const scrollEl = document.scrollingElement || document.documentElement;
      const layoutViewportWidth = document.documentElement.clientWidth;
      const totalScrollWidth = Math.max(
        scrollEl.scrollWidth,
        document.documentElement.scrollWidth,
        layoutViewportWidth
      );

      const lockY = 0; // top of the page

      // Center based on layout viewport width (stable) vs total scrollable width
      let lockX = Math.round((totalScrollWidth - layoutViewportWidth) / 2);

      // Clamp to valid scrollable bounds
      const maxX = Math.max(0, totalScrollWidth - layoutViewportWidth);
      if (lockX < 0) lockX = 0;
      if (lockX > maxX) lockX = maxX;

      return { lockX, lockY };
    };

    let { lockX, lockY } = computeLock();
    if (Math.abs(window.scrollX - lockX) > 0.5 || Math.abs(window.scrollY - lockY) > 0.5) {
      window.scrollTo(lockX, lockY);
    }

    const onScroll = () => {
      if (Math.abs(window.scrollX - lockX) > 0.5 || Math.abs(window.scrollY - lockY) > 0.5) {
        window.scrollTo(lockX, lockY);
      }
    };

    const recalc = () => {
      const v = computeLock();
      lockX = v.lockX;
      lockY = v.lockY;
      window.scrollTo(lockX, lockY);
    };

    const preventScrollDefault = (e: Event) => {
      e.preventDefault();
    };

    window.addEventListener('scroll', onScroll, { passive: false } as any);
    window.addEventListener('resize', recalc);
    window.addEventListener('orientationchange', recalc as any);
    if ((window as any).visualViewport) {
      const vv = (window as any).visualViewport as VisualViewport;
      vv.addEventListener('resize', recalc);
      vv.addEventListener('scroll', recalc);
    }
    document.addEventListener('wheel', preventScrollDefault, { passive: false });
    document.addEventListener('touchmove', preventScrollDefault, { passive: false });
    document.addEventListener('gesturestart', preventScrollDefault as any, { passive: false } as any);
    document.addEventListener('keydown', (e) => {
      const keys = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ', 'Spacebar'];
      if (keys.includes(e.key)) e.preventDefault();
    }, { passive: false } as any);

    return () => {
      window.removeEventListener('scroll', onScroll as any);
      window.removeEventListener('resize', recalc);
      window.removeEventListener('orientationchange', recalc as any);
      if ((window as any).visualViewport) {
        const vv = (window as any).visualViewport as VisualViewport;
        vv.removeEventListener('resize', recalc);
        vv.removeEventListener('scroll', recalc);
      }
      document.removeEventListener('wheel', preventScrollDefault as any);
      document.removeEventListener('touchmove', preventScrollDefault as any);
      document.removeEventListener('gesturestart', preventScrollDefault as any);
    };
  }, []);

  return (
    <AppContainer>
      <ContentWrapper>
        <TitleContainer>
          <DesktopTitle>
            kenna mccafferty<InvisibleAccent>f</InvisibleAccent>
          </DesktopTitle>
          <MobileTitle>
            kenna mccafferty<InvisibleAccent>f</InvisibleAccent>
          </MobileTitle>
          <BioButton onClick={() => setIsBioOpen(true)}>bio</BioButton>
        </TitleContainer>
        
        {isReady && (
          <Suspense fallback={null}>
            <Bio text={bio} />
          </Suspense>
        )}
      </ContentWrapper>
      <Suspense fallback={null}>
        <OrnamentalDivider mode="regular" />
      </Suspense>
      <ContentWrapper>
        {isReady && (
          <Suspense fallback={null}>
            <MediaPlayer 
              links={links}
              currentIndex={currentLinkIndex}
              onLinkChange={handleLinkChange}
              invertScroll={false}
            />
          </Suspense>
        )}
      </ContentWrapper>
      <BioLightbox isOpen={isBioOpen} onClose={() => setIsBioOpen(false)} content={bioLightbox} />
    </AppContainer>
  );
}

export default App;
