import React from 'react';
import styled from 'styled-components';
import OpenGraphThumbnail from './OpenGraphThumbnail';
import { useMobile, useTouchGestures } from '../hooks/useMobile';

interface Link {
  url: string;
  title: string;
  domain: string;
}

interface MediaPlayerProps {
  links: Link[];
  currentIndex: number;
  onLinkChange: (index: number) => void;
  invertScroll?: boolean;
}

const PlayerContainer = styled.div`
  width: 100%;
  color: var(--fg);
  overflow: hidden; /* prevent any horizontal spill */
`;

const CurrentTrack = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-bottom: 3rem;
  cursor: pointer;
  transition: opacity 0.2s ease;
  padding: 0;

  &:hover { opacity: 0.9; }

  /* Mobile optimizations */
  @media (max-width: 768px) {
    margin-bottom: 1.25rem; /* More space between thumbnail and carousel */
    min-height: 220px; /* Ensure enough vertical space for title/link area */
  }
`;

const TrackInfo = styled.div`
  text-align: left;
`;

const TrackTitle = styled.h3`
  color: var(--fg);
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 0.4rem 0;
  letter-spacing: 0.02em;
  font-family: 'Times New Roman', Times, serif;

  /* Mobile font scaling */
  @media (max-width: 768px) {
    font-size: clamp(1rem, 4vw, 1.25rem);
    line-height: 1.4;
    margin: 0 0 0.5rem 0; /* More space below title */
    min-height: 2.8em; /* Ensure space for 2 lines if needed */
  }
`;

const TrackDomain = styled.p`
  color: var(--accent2);
  font-size: 0.9rem;
  margin: 0;
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0.08em;

  /* Mobile font scaling */
  @media (max-width: 768px) {
    font-size: clamp(0.75rem, 3vw, 0.9rem);
    line-height: 1.2;
  }
`;

const PlaylistSection = styled.div`
  margin-top: 2rem;
  position: relative;

  /* Mobile spacing */
  @media (max-width: 768px) {
    margin-top: 0.75rem; /* More space above carousel */
    margin-bottom: 0;
    position: fixed; /* Fixed position to prevent movement */
    bottom: 2rem; /* More margin from bottom edge */
    left: 0;
    right: 0;
    z-index: 10;
  }
`;

const Viewport = styled.div`
  position: relative;
  overflow: hidden;
  width: 100%;
  max-width: 900px; /* Increased width */
  height: 165px; /* Increased to fit image + titles */

  /* Mobile optimizations */
  @media (max-width: 768px) {
    height: 128px; /* slightly taller to avoid cropping bottom */
    max-width: 100%;
    width: 100%;
    touch-action: none; /* block all touch gestures to prevent horizontal scroll */
    margin-bottom: 0;
    overflow-x: hidden;
  }
`;

const TrackRow = styled.div`
  display: flex;
  gap: 0.8rem;
  height: 100%;
  will-change: transform;
  transition: transform 0.2s ease-out; /* Smooth transition for auto-scroll */
  align-items: center; /* Center items vertically */
  touch-action: pan-x; /* prefer horizontal gestures */

  /* Mobile gap adjustment */
  @media (max-width: 768px) {
    gap: 0.4rem;
    align-items: center;
    touch-action: pan-x; /* restrict to horizontal on mobile */
  }
`;

const FadeOverlay = styled.div<{ $position: 'left' | 'right' }>`
  position: absolute;
  top: 0;
  left: ${props => props.$position === 'left' ? '0' : 'auto'};
  right: ${props => props.$position === 'right' ? '0' : 'auto'};
  width: 80px;
  height: 100%;
  background: ${props => props.$position === 'left'
    ? 'linear-gradient(to right, #C0C0C0 0%, rgba(192, 192, 192, 0.8) 50%, transparent 100%)'
    : 'linear-gradient(to left, #C0C0C0 0%, rgba(192, 192, 192, 0.8) 50%, transparent 100%)'
  };
  pointer-events: none; /* allow viewport to receive mouse events */
  z-index: 5;

  /* Hide on mobile for better touch experience */
  @media (max-width: 768px) {
    display: none;
  }
`;

const OverlayLayer = styled.div`
  position: absolute;
  inset: 0; /* ocupa todo el espacio del viewport */
  width: 100%;
  height: 100%;
  pointer-events: none; /* capa contenedora no intercepta, los hijos sí */
  z-index: 6;
`;

const NavigationArrows = styled.div`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  justify-content: space-between;
  width: 100%;
  pointer-events: none;
  z-index: 10;

  /* Hide on mobile, use swipe instead */
  @media (max-width: 768px) {
    display: none;
  }
`;

const ArrowButton = styled.button<{ $direction: 'left' | 'right' }>`
  background: none;
  border: none;
  color: var(--fg);
  font-size: 2rem;
  cursor: default; /* do not show hand cursor */
  padding: 0.75rem;
  transition: opacity 0.3s ease;
  pointer-events: auto;
  opacity: 0.8;
  font-family: Georgia, 'Times New Roman', serif; /* Changed font */
  font-weight: 300;

  &:hover { opacity: 1; }
`;

const TrackItem = styled.div`
  flex: 0 0 auto;
  scroll-snap-align: center; /* Center alignment instead of start */
  touch-action: pan-x; /* restrict gesture to horizontal */

  /* Mobile: force exactly 3 thumbnails to fit viewport width */
  @media (max-width: 768px) {
    /* Two gaps of 0.4rem inside the viewport; use container width to avoid overflow */
    flex: 0 0 calc((100% - 0.8rem) / 3);
    max-width: calc((100% - 0.8rem) / 3);
    min-width: calc((100% - 0.8rem) / 3);
    display: flex;
    justify-content: center; /* Center content within each item */
    align-items: center;
    touch-action: pan-x; /* also on mobile */
  }
`;

// Mobile-specific swipe indicator
const SwipeIndicator = styled.div`
  display: none;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white; /* Base color, mix-blend-mode will invert it */
  font-size: 1rem; /* Increased from 0.8rem */
  opacity: 0.9;
  pointer-events: none;
  z-index: 15;
  mix-blend-mode: difference; /* Automatically invert colors based on background */
  font-weight: 500;
  text-shadow: none;
  /* Ensure it blends with page background, not just thumbnail */
  isolation: isolate;

  @media (max-width: 768px) {
    display: block;
  }
`;

const MediaPlayer: React.FC<MediaPlayerProps> = ({ links, currentIndex, onLinkChange, invertScroll = false }) => {
  const currentLink = links[currentIndex];
  const { isMobile } = useMobile();

  const viewportRef = React.useRef<HTMLDivElement | null>(null);
  const trackRef = React.useRef<HTMLDivElement | null>(null);
  const rafRef = React.useRef<number | null>(null);
  const velocityRef = React.useRef<number>(0);
  const lastTsRef = React.useRef<number>(0);
  const [trackX, setTrackX] = React.useState(0);
  const segmentWidthRef = React.useRef<number>(0);

  // Helper function for auto-scrolling to center selected item (mobile + desktop)
  const scrollToCenterItem = React.useCallback((index: number) => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    const viewportRect = viewport.getBoundingClientRect();
    const viewportWidth = viewportRect.width;

    // Calculate gap between items
    const style = window.getComputedStyle(track);
    const gap = parseFloat((style as any).columnGap || (style as any).gap || '0') || 0;

    // Estimate item width using the first child if present
    const firstChild = track.children[0] as HTMLElement | undefined;
    const itemWidth = firstChild ? firstChild.getBoundingClientRect().width : 120;

    // Desired target position: center selected item in the viewport
    let targetX = -(index * (itemWidth + gap)) + (viewportWidth / 2) - (itemWidth / 2);

    // Apply wrapping for infinite effect (both desktop and mobile)
    const segmentWidth = segmentWidthRef.current;
    if (segmentWidth > 0) {
      let nx = ((targetX % segmentWidth) + segmentWidth) % segmentWidth;
      if (nx > 0) nx -= segmentWidth; // normalize to [-w, 0)
      targetX = nx;
    }
    setTrackX(targetX);
  }, []);

  // Use custom touch gestures hook
  const { onTouchStart, onTouchMove, onTouchEnd, onTouchCancel, isSwiping } = useTouchGestures(
    () => {
      // Swipe left - go to next
      const newIndex = currentIndex === links.length - 1 ? 0 : currentIndex + 1;
      onLinkChange(newIndex);
      // Center after selection change
      scrollToCenterItem(newIndex);
    },
    () => {
      // Swipe right - go to previous
      const newIndex = currentIndex === 0 ? links.length - 1 : currentIndex - 1;
      onLinkChange(newIndex);
      // Center after selection change
      scrollToCenterItem(newIndex);
    }
  );

  const measure = React.useCallback(() => {
    const tr = trackRef.current;
    if (!tr) return;
    const children = Array.from(tr.children) as HTMLElement[];
    if (children.length === 0) return;
    const count = Math.floor(children.length / 2); // first segment length
    let total = 0;
    for (let i = 0; i < count; i += 1) {
      total += children[i].getBoundingClientRect().width;
    }
    const style = window.getComputedStyle(tr);
    const gapPx = parseFloat((style as any).columnGap || (style as any).gap || '0') || 0;
    // Include internal gaps and the seam gap between segment 1 and segment 2
    total += gapPx * Math.max(0, count - 1);
    segmentWidthRef.current = total + gapPx;
    // Align to 0 so wrapping uses range [-w, 0)
    setTrackX(0);
  }, []);

  React.useEffect(() => {
    const id = window.setTimeout(measure, 0);
    const onResize = () => measure();
    window.addEventListener('resize', onResize);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener('resize', onResize);
    };
  }, [measure]);

  const tick = React.useCallback((ts: number) => {
    if (!lastTsRef.current) lastTsRef.current = ts;
    const dt = (ts - lastTsRef.current) / 1000;
    lastTsRef.current = ts;
    const v = velocityRef.current;
    if (v !== 0) {
      setTrackX((x) => {
        let nx = x + v * dt;
        const w = segmentWidthRef.current;
        if (w > 0) {
          // Robust wrap using modulo to avoid drift and handle large dt
          nx = ((nx % w) + w) % w;
          if (nx > 0) nx -= w; // normalize to [-w, 0)
        }
        return nx;
      });
    }
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const startRaf = React.useCallback(() => {
    if (rafRef.current == null) rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const stopRaf = React.useCallback(() => {
    velocityRef.current = 0;
  }, []);

  const handleMouseMove = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile) return; // Disable mouse navigation on mobile
    
    const vp = viewportRef.current;
    if (!vp) return;
    const rect = vp.getBoundingClientRect();
    const rel = (e.clientX - rect.left) / rect.width;
    const edgeRatio = 0.18;
    if (rel <= edgeRatio) {
      const base = -80; // px/s (left pulls left by default)
      velocityRef.current = invertScroll ? -base : base;
      startRaf();
    } else if (rel >= 1 - edgeRatio) {
      const base = 80; // px/s (right pulls right by default)
      velocityRef.current = invertScroll ? -base : base;
      startRaf();
    } else {
      stopRaf();
    }
  }, [invertScroll, isMobile, startRaf, stopRaf]);

  React.useEffect(() => {
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  const handlePlaylistClick = (index: number) => {
    onLinkChange(index);
    if (isMobile) {
      scrollToCenterItem(index);
    }
  };

  const handleCurrentTrackClick = () => {
    window.open(currentLink.url, '_blank');
  };

  // Keep desktop arrow/click navigation centering

  const scrollLeftIndex = React.useCallback(() => {
    const newIndex = currentIndex === 0 ? links.length - 1 : currentIndex - 1;
    onLinkChange(newIndex);
    
    // Auto-scroll to center the selected item on desktop
    scrollToCenterItem(newIndex);
  }, [currentIndex, links.length, onLinkChange, scrollToCenterItem]);

  const scrollRightIndex = React.useCallback(() => {
    const newIndex = currentIndex === links.length - 1 ? 0 : currentIndex + 1;
    onLinkChange(newIndex);
    
    // Auto-scroll to center the selected item on desktop
    scrollToCenterItem(newIndex);
  }, [currentIndex, links.length, onLinkChange, scrollToCenterItem]);

  // Keyboard navigation: left/right arrows switch current item
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        scrollLeftIndex();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        scrollRightIndex();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [scrollLeftIndex, scrollRightIndex]);

  // Keep centered when currentIndex changes externally
  React.useEffect(() => {
    scrollToCenterItem(currentIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  // Render only visible thumbnails on mobile for performance
  const renderThumbnails = () => {
    // Render two segments on all devices for consistent infinite loop behavior
    return (
      <>
        {links.map((link, index) => (
          <TrackItem key={`seg1-${index}`} className={`track-item-${index}`}>
            <OpenGraphThumbnail
              url={link.url}
              fallbackTitle={link.title}
              fallbackDomain={link.domain}
              $isActive={index === currentIndex}
              onClick={() => handlePlaylistClick(index)}
              $size="small"
              $showInfo={!isMobile}
            />
          </TrackItem>
        ))}
        {links.map((link, index) => (
          <TrackItem key={`seg2-${index}`} className={`track-item-${index}`}>
            <OpenGraphThumbnail
              url={link.url}
              fallbackTitle={link.title}
              fallbackDomain={link.domain}
              $isActive={index === currentIndex}
              onClick={() => handlePlaylistClick(index)}
              $size="small"
              $showInfo={!isMobile}
            />
          </TrackItem>
        ))}
      </>
    );
  };

  return (
    <PlayerContainer>
      <CurrentTrack onClick={handleCurrentTrackClick}>
        <OpenGraphThumbnail
          url={currentLink.url}
          fallbackTitle={currentLink.title}
          fallbackDomain={currentLink.domain}
          $isActive={true}
          onClick={() => {}}
          $size="large"
        />
        {!isMobile && (
          <TrackInfo>
            <TrackTitle>{currentLink.title}</TrackTitle>
            <TrackDomain>{currentLink.domain}</TrackDomain>
          </TrackInfo>
        )}
      </CurrentTrack>

      <PlaylistSection>
        <Viewport 
          ref={viewportRef} 
          onMouseMove={handleMouseMove} 
          onMouseLeave={() => { velocityRef.current = 0; }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchCancel}
          className="carousel-touch-area"
        >
          <TrackRow ref={trackRef} style={{ transform: `translate3d(${trackX}px, 0, 0)`, transition: isSwiping ? 'none' : undefined }}>
            {renderThumbnails()}
          </TrackRow>
          <OverlayLayer>
            <FadeOverlay $position="left" />
            <FadeOverlay $position="right" />
            <NavigationArrows>
              <ArrowButton $direction="left">‹</ArrowButton>
              <ArrowButton $direction="right">›</ArrowButton>
            </NavigationArrows>
          </OverlayLayer>
          {isMobile && (
            <SwipeIndicator>
              {'← swipe to navigate →'}
            </SwipeIndicator>
          )}
        </Viewport>
      </PlaylistSection>
    </PlayerContainer>
  );
};

export default MediaPlayer;
