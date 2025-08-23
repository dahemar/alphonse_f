import React, { useState, useEffect, Suspense, lazy, useCallback } from 'react';
import styled from 'styled-components';
import contentManager from './utils/ContentManager';

// Lazy load heavy components
const MediaPlayer = lazy(() => import('./components/MediaPlayer'));
const Bio = lazy(() => import('./components/Bio'));
const OrnamentalDivider = lazy(() => import('./components/OrnamentalDivider'));

type Mode = 'evil' | 'angel' | 'regular';

const AppContainer = styled.div<{ $mode: Mode }>`
  min-height: 100dvh; /* use dynamic viewport height */
  /* Color scheme variables per mode */
  --bg: ${p => (p.$mode === 'evil' ? '#000000' : p.$mode === 'angel' ? '#FFFFFF' : '#FFFFFF')};
  --fg: ${p => (p.$mode === 'evil' ? '#FFFF00' : p.$mode === 'angel' ? '#1A73E8' : '#000000')};
  --accent1: ${p => (p.$mode === 'evil' ? '#FFFF00' : p.$mode === 'angel' ? '#1A73E8' : '#000000')};
  --accent2: ${p => (p.$mode === 'evil' ? '#FF3B30' : p.$mode === 'angel' ? '#00C853' : '#000000')};
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

const ModeSwitcher = styled.div`
  position: fixed;
  top: 12px;
  right: 12px;
  display: flex;
  gap: 8px;
  z-index: 1000;

  /* Mobile positioning and sizing */
  @media (max-width: 768px) {
    top: calc(env(safe-area-inset-top) + 8px);
    right: 8px;
    gap: 6px;
  }
`;

const ModeOption = styled.button<{ $active?: boolean }>`
  appearance: none;
  border: 1px solid ${p => (p.$active ? 'var(--accent2)' : 'var(--accent1)')};
  background: transparent;
  color: var(--fg);
  padding: 4px 10px;
  border-radius: 0;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 120ms linear, color 120ms linear;
  outline: none;
  
  /* Remove any focus outlines that might appear */
  &:focus,
  &:focus-visible {
    outline: none;
    box-shadow: none;
  }

  /* Mobile touch-friendly sizing */
  @media (max-width: 768px) {
    padding: 6px 12px;
    font-size: 11px;
    min-height: 32px;
    min-width: 44px;
  }
`;

const HelpBadge = styled.div`
  position: fixed;
  right: 14px;
  bottom: 14px;
  z-index: 1000;

  /* Hide on mobile */
  @media (max-width: 768px) {
    display: none;
  }
`;

const HelpSymbol = styled.div`
  font-size: 24px;
  line-height: 1;
  color: var(--accent1);
  cursor: default;
  transition: color 120ms linear;

  /* Mobile sizing */
  @media (max-width: 768px) {
    font-size: 20px;
  }
`;

const HelpTooltip = styled.div`
  position: absolute;
  right: 0;
  bottom: 28px;
  white-space: nowrap;
  color: var(--fg);
  border: 1px solid var(--accent1);
  padding: 6px 8px;
  font-size: 12px;
  background: transparent;
  opacity: 0;
  transform: translateY(4px);
  transition: opacity 140ms linear, transform 140ms linear, border-color 120ms linear, color 120ms linear;
  pointer-events: none;

  /* Mobile optimizations */
  @media (max-width: 768px) {
    font-size: 11px;
    padding: 4px 6px;
    white-space: normal;
    max-width: 120px;
    text-align: center;
  }
`;

const Help = styled(HelpBadge)`
  &:hover ${HelpSymbol} { color: var(--accent2); }
  &:hover ${HelpTooltip} { opacity: 1; transform: translateY(0); border-color: var(--accent2); }
`;

const TitleAccent = styled.span`
  color: var(--accent2);
  font-size: 1.6em; /* oversize the f */
  line-height: 0.9;
  display: inline-block;

  /* Mobile optimizations */
  @media (max-width: 768px) {
    font-size: 1.4em;
    line-height: 1;
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
  const [mode, setMode] = useState<Mode>('regular');
  const [bio, setBio] = useState('');
  const [links, setLinks] = useState<Array<{url: string; title: string; domain: string; thumbnail?: string}>>([]);
  const [isReady, setIsReady] = useState(false);

  // Load content from Google Sheets
  useEffect(() => {
    const loadContent = async () => {
      try {
        console.log('App: Starting to load content...');
        const data = await contentManager.getData(); // Wait for data to be ready
        console.log('App: Content loaded successfully:', data);
        
        if (data) {
          setBio(data.bio);
          setLinks(data.links);
          setIsReady(true);
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
    <AppContainer $mode={mode}>
      <ModeSwitcher>
        <ModeOption title="evil" aria-label="evil" $active={mode === 'evil'} onClick={() => setMode('evil')}>evil</ModeOption>
        <ModeOption title="angel" aria-label="angel" $active={mode === 'angel'} onClick={() => setMode('angel')}>angel</ModeOption>
        <ModeOption title="regular" aria-label="regular" $active={mode === 'regular'} onClick={() => setMode('regular')}>regular</ModeOption>
      </ModeSwitcher>
      <ContentWrapper>
        <DesktopTitle>
          {mode === 'regular' ? <>kenna mccafferty<InvisibleAccent>f</InvisibleAccent></> : <>alphonse <TitleAccent>f</TitleAccent></>}
        </DesktopTitle>
        <MobileTitle>
          {mode === 'regular' ? <>kenna mccafferty<InvisibleAccent>f</InvisibleAccent></> : <>alphonse <TitleAccent>f</TitleAccent></>}
        </MobileTitle>
        
        {isReady && (
          <Suspense fallback={null}>
            <Bio text={bio} />
          </Suspense>
        )}
      </ContentWrapper>
              <Suspense fallback={null}>
          <OrnamentalDivider mode={mode} />
        </Suspense>
      <ContentWrapper>
        {isReady && (
          <Suspense fallback={null}>
            <MediaPlayer 
              links={links}
              currentIndex={currentLinkIndex}
              onLinkChange={handleLinkChange}
              invertScroll={mode === 'evil'}
            />
          </Suspense>
        )}
      </ContentWrapper>
              {mode !== 'regular' && (
          <Help>
            <HelpSymbol>§</HelpSymbol>
            <HelpTooltip>click on objects to reach other layers of information</HelpTooltip>
          </Help>
        )}
    </AppContainer>
  );
}

export default App;
