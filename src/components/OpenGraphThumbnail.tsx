import React from 'react';
import styled from 'styled-components';
import { useOpenGraph } from '../hooks/useOpenGraph';

interface OpenGraphThumbnailProps {
  url: string;
  fallbackTitle: string;
  fallbackDomain: string;
  $isActive: boolean;
  onClick: () => void;
  $size?: 'large' | 'small';
  $showInfo?: boolean; // New prop to control info display
  thumbnailUrl?: string; // Optional thumbnail URL from Google Sheets
}

const ThumbnailContainer = styled.div<{ $isActive: boolean; $size: 'large' | 'small' }>`
  display: inline-block;
  vertical-align: top;
  width: ${props => props.$size === 'large' ? '200px' : '100px'};
  height: auto;
  cursor: pointer;
  transition: opacity 0.2s ease;
  opacity: ${props => props.$isActive ? 1 : 0.6};

  &:hover {
    opacity: 1;
  }

  /* Mobile touch-friendly optimizations */
  @media (max-width: 768px) {
    width: ${props => props.$size === 'large' ? '180px' : '120px'};
    min-height: ${props => props.$size === 'large' ? '180px' : '120px'};
    
    /* Larger touch target */
    padding: 4px;
    margin: 2px;
    
    /* Better touch feedback */
    &:active {
      transform: scale(0.98);
      transition: transform 0.1s ease;
    }
  }
`;

const ThumbnailWrapper = styled.div<{ $isActive: boolean; $size: 'large' | 'small' }>`
  border: ${props => props.$isActive ? '2px solid var(--accent2)' : '1px solid var(--accent1)'};
  display: inline-block;
  overflow: hidden;
  width: 100%;
  height: ${props => props.$size === 'large' ? '200px' : '100px'};
  box-sizing: border-box;
  margin-bottom: 0.6rem;

  /* Mobile optimizations */
  @media (max-width: 768px) {
    height: ${props => props.$size === 'large' ? '180px' : '120px'};
    margin-bottom: 0.2rem; /* tighter */
    border-width: ${props => props.$isActive ? '3px' : '2px'};
  }
`;

const ThumbnailImage = styled.img<{ $size: 'large' | 'small' }>`
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: #f5f5f5;

  /* Mobile image optimization */
  @media (max-width: 768px) {
    object-fit: cover;
    image-rendering: -webkit-optimize-contrast;
    image-rendering: crisp-edges;
  }
`;

const FallbackThumbnail = styled.div<{ $size: 'large' | 'small' }>`
  width: 100%;
  height: ${props => props.$size === 'large' ? '200px' : '100px'};
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: ${props => props.$size === 'large' ? '1rem' : '0.7rem'};
  font-weight: 500;
  text-align: center;
  padding: 0.5rem;
  line-height: 1.2;

  /* Mobile font scaling */
  @media (max-width: 768px) {
    height: ${props => props.$size === 'large' ? '180px' : '120px'};
    font-size: ${props => props.$size === 'large' ? 'clamp(0.9rem, 4vw, 1rem)' : 'clamp(0.6rem, 3vw, 0.7rem)'};
    line-height: 1.3;
    padding: 0.4rem;
  }
`;

const FallbackTitle = styled.div`
  font-weight: 600;
  margin-bottom: 0.5rem;

  /* Mobile optimizations */
  @media (max-width: 768px) {
    margin-bottom: 0.3rem;
    line-height: 1.2;
  }
`;

const FallbackDomain = styled.div`
  font-size: 0.8em;
  opacity: 0.8;
  text-transform: uppercase;
  letter-spacing: 0.05em;

  /* Mobile optimizations */
  @media (max-width: 768px) {
    font-size: 0.75em;
    line-height: 1.1;
  }
`;

const LoadingThumbnail = styled.div<{ $size: 'large' | 'small' }>`
  width: 100%;
  height: ${props => props.$size === 'large' ? '200px' : '100px'};
  background: #f7f7f7;

  /* Mobile optimizations */
  @media (max-width: 768px) {
    height: ${props => props.$size === 'large' ? '180px' : '120px'};
  }
`;

const ThumbnailInfo = styled.div<{ $size: 'large' | 'small' }>`
  text-align: left;
  display: ${props => props.$size === 'large' ? 'none' : 'block'};

  /* Mobile optimizations */
  @media (max-width: 768px) {
    display: block;
    margin-top: 0.2rem;
  }
`;

const ThumbnailTitle = styled.p`
  color: var(--fg);
  font-size: 0.78rem;
  font-weight: 600;
  margin: 0 0 0.2rem 0;
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: 'Times New Roman', Times, serif;

  /* Mobile font scaling and line height */
  @media (max-width: 768px) {
    font-size: clamp(0.7rem, 3vw, 0.78rem);
    line-height: 1.4;
    margin: 0 0 0.15rem 0;
    white-space: normal;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;

const ThumbnailDomain = styled.p`
  color: var(--accent2);
  font-size: 0.68rem;
  margin: 0;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  /* Mobile font scaling and line height */
  @media (max-width: 768px) {
    font-size: clamp(0.6rem, 2.5vw, 0.68rem);
    line-height: 1.3;
    letter-spacing: 0.03em;
  }
`;

// Hardcoded mapping: 1..8 as provided by user
const HARDCODED_FILES: Record<string, string> = {
  'https://www.papermag.com/bktherula-lvl5': '1.webp',
  'https://www.papermag.com/joanne-robertson-blue-car': '2.webp',
  'https://thecreativeindependent.com/people/painter-and-musician-joanne-robertson-on-why-its-never-just-you-creating-alone/': '3.jpg',
  'https://www.ninaprotocol.com/articles/the-triumph-of-julias-war-recordings-the-indie-rock-antilabel-embracing-cassette-tapes-and-90s-rave-sounds': '4.webp',
  'https://officemagazine.net/building-intensity-ouri': '5.jpg',
  'https://www.altpress.com/sean-kennedy-olth-interview/': '6.jpg',
  'https://www.are.na/editorial/the-future-will-be-like-perfume': '7.png',
  'https://www.papermag.com/palmistry-tinkerbell-interview': '8.webp'
};

function getHardcodedUrl(linkUrl: string): string | null {
  const filename = HARDCODED_FILES[linkUrl];
  if (!filename) return null;
  
  // Detect environment
  const isGitHubPages = typeof window !== 'undefined' && window.location.hostname.includes('github.io');
  const isLocalDev = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  
  if (isGitHubPages) {
    return `/alphonse_f/assets/fallback/${filename}`;
  } else if (isLocalDev) {
    // Local dev served from Express
    return `http://localhost:4000/assets/fallback/${filename}`;
  } else {
    // Production (Vercel or other hosting)
    return `/assets/fallback/${filename}`;
  }
}

const OpenGraphThumbnail: React.FC<OpenGraphThumbnailProps> = ({
  url,
  fallbackTitle,
  fallbackDomain,
  $isActive,
  onClick,
  $size = 'small',
  $showInfo = true, // Default to true
  thumbnailUrl // Optional thumbnail from Google Sheets
}) => {
  const hardcodedImage = React.useMemo(() => getHardcodedUrl(url), [url]);
  const shouldFetchOG = !thumbnailUrl && !hardcodedImage;
  const { data, loading } = useOpenGraph(url, shouldFetchOG);

  const renderThumbnail = () => {
    if (loading) {
      return (
        <LoadingThumbnail $size={$size} />
      );
    }

    const ogImage = data?.image ? data.image : '';

    // Priority: 1. thumbnailUrl from Google Sheets, 2. hardcoded mapping, 3. OG image, 4. fallback block
    const imageToShow = thumbnailUrl || hardcodedImage || ogImage || '';

    if (imageToShow) {
      return (
        <ThumbnailImage
          $size={$size}
          src={imageToShow}
          alt={fallbackTitle}
          referrerPolicy="no-referrer"
          loading={$size === 'large' ? 'eager' : 'lazy'}
          onError={(e) => {
            const imgEl = e.currentTarget as HTMLImageElement;
            imgEl.style.display = 'none';
            const fb = imgEl.parentElement?.querySelector('.fallback');
            if (fb) (fb as HTMLElement).style.display = 'flex';
          }}
        />
      );
    }

    return (
      <FallbackThumbnail className="fallback" $size={$size}>
        <FallbackTitle>
          {fallbackTitle.split(' ').slice(0, $size === 'large' ? 4 : 2).join(' ')}
        </FallbackTitle>
        <FallbackDomain>
          {fallbackDomain}
        </FallbackDomain>
      </FallbackThumbnail>
    );
  };

  const displayTitle = fallbackTitle;
  const displayDomain = fallbackDomain;

  return (
    <ThumbnailContainer $isActive={$isActive} onClick={onClick} $size={$size}>
      <ThumbnailWrapper $isActive={$isActive} $size={$size}>
        {renderThumbnail()}
      </ThumbnailWrapper>
      {$showInfo && (
        <ThumbnailInfo $size={$size}>
          <ThumbnailTitle>{displayTitle}</ThumbnailTitle>
          <ThumbnailDomain>{displayDomain}</ThumbnailDomain>
        </ThumbnailInfo>
      )}
    </ThumbnailContainer>
  );
};

export default OpenGraphThumbnail;
