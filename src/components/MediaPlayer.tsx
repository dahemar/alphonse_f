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
    margin-bottom: 1.5rem;
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
    line-height: 1.3;
    margin: 0 0 0.3rem 0;
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
    margin-top: 1rem;
    margin-bottom: 0;
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
    height: 140px;
    max-width: 100vw;
    width: 100vw;
    touch-action: pan-y pinch-zoom;
    margin-bottom: 0;
    overflow-x: hidden;
  }
`;

const TrackRow = styled.div`
  display: flex;
  gap: 0.8rem;
  height: 100%;
  will-change: transform;
  transition: transform 0.3s ease-out; /* Smooth transition for auto-scroll */

  /* Mobile gap adjustment */
  @media (max-width: 768px) {
    gap: 0.6rem;
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
  scroll-snap-align: start;

  /* Mobile touch-friendly sizing */
  @media (max-width: 768px) {
    min-width: 120px; /* Larger touch target */
  }
`;

// Mobile-specific swipe indicator
const SwipeIndicator = styled.div`
  display: none;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: var(--accent1);
  font-size: 0.8rem;
  opacity: 0.6;
  pointer-events: none;
  z-index: 15;

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

  // Use custom touch gestures hook
  const { onTouchStart, onTouchMove, onTouchEnd } = useTouchGestures(
    () => {
      // Swipe left - go to next
      const newIndex = currentIndex === links.length - 1 ? 0 : currentIndex + 1;
      onLinkChange(newIndex);
    },
    () => {
      // Swipe right - go to previous
      const newIndex = currentIndex === 0 ? links.length - 1 : currentIndex - 1;
      onLinkChange(newIndex);
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
  };

  const handleCurrentTrackClick = () => {
    window.open(currentLink.url, '_blank');
  };

  // Helper function for auto-scrolling to center selected item
  const scrollToCenterItem = React.useCallback((index: number) => {
    if (isMobile) return; // Only auto-scroll on desktop
    
    setTimeout(() => {
      const viewport = viewportRef.current;
      const track = trackRef.current;
      if (viewport && track) {
        const viewportRect = viewport.getBoundingClientRect();
        const viewportWidth = viewportRect.width;
        
        // Get the actual item dimensions from the DOM
        const firstItem = track.children[0] as HTMLElement;
        if (firstItem) {
          const itemRect = firstItem.getBoundingClientRect();
          const itemWidth = itemRect.width;
          const style = window.getComputedStyle(track);
          const gap = parseFloat(style.columnGap || style.gap || '0') || 12;
          
          // Calculate the target position to perfectly center the item
          const targetX = -(index * (itemWidth + gap)) + (viewportWidth / 2) - (itemWidth / 2);
          
          // For infinite scroll, we need to handle wrapping properly
          const segmentWidth = segmentWidthRef.current;
          let finalTargetX = targetX;
          
          if (segmentWidth > 0) {
            // Normalize to the infinite scroll range
            finalTargetX = ((targetX % segmentWidth) + segmentWidth) % segmentWidth;
            if (finalTargetX > 0) finalTargetX -= segmentWidth;
          }
          
          // Smooth scroll to the target position
          setTrackX(finalTargetX);
        }
      }
    }, 50); // Reduced delay for better responsiveness
  }, [isMobile]);

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

  // Render only visible thumbnails on mobile for performance
  const renderThumbnails = () => {
    if (!isMobile) {
      // Desktop: render all thumbnails twice for infinite scroll
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
                $showInfo={true} // Show info in carousel
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
                $showInfo={true} // Show info in carousel
              />
            </TrackItem>
          ))}
        </>
      );
    }

    // Mobile: render only visible range + buffer for better performance
    const buffer = 2;
    const start = Math.max(0, Math.floor(-trackX / 120) - buffer);
    const end = Math.min(links.length - 1, Math.ceil((-trackX + (viewportRef.current?.getBoundingClientRect().width || 0)) / 120) + buffer);
    
    return links.slice(start, end + 1).map((link, arrayIndex) => {
      const actualIndex = start + arrayIndex;
      return (
        <TrackItem key={`mobile-${actualIndex}`} className={`track-item-${actualIndex}`}>
          <OpenGraphThumbnail
            url={link.url}
            fallbackTitle={link.title}
            fallbackDomain={link.domain}
            $isActive={actualIndex === currentIndex}
            onClick={() => handlePlaylistClick(actualIndex)}
            $size="small"
            $showInfo={false} // Don't show info in carousel to avoid duplication
          />
        </TrackItem>
      );
    });
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
        >
          <TrackRow ref={trackRef} style={{ transform: `translate3d(${trackX}px, 0, 0)` }}>
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
              ← swipe to navigate →
            </SwipeIndicator>
          )}
        </Viewport>
      </PlaylistSection>
    </PlayerContainer>
  );
};

export default MediaPlayer;
