import React, { useState } from 'react';
import styled from 'styled-components';
import MediaPlayer from './components/MediaPlayer';
import Bio from './components/Bio';
import OrnamentalDivider from './components/OrnamentalDivider';

type Mode = 'evil' | 'angel' | 'regular';

const AppContainer = styled.div<{ $mode: Mode }>`
  min-height: 100vh;
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
    padding-top: 2.5rem; /* tighter to fit content on one screen */
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
    top: 8px;
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
  const [currentLinkIndex, setCurrentLinkIndex] = useState(0);
  const [mode, setMode] = useState<Mode>('regular');

  const links = [
    {
      url: 'https://www.papermag.com/palmistry-tinkerbell-interview',
      title: 'Palmistry Tinkerbell Interview',
      domain: 'papermag.com'
    },
    {
      url: 'https://www.papermag.com/bktherula-lvl5',
      title: 'BKTHERULA Lvl5',
      domain: 'papermag.com'
    },
    {
      url: 'https://www.papermag.com/joanne-robertson-blue-car',
      title: 'Joanne Robertson Blue Car',
      domain: 'papermag.com'
    },
    {
      url: 'https://thecreativeindependent.com/people/painter-and-musician-joanne-robertson-on-why-its-never-just-you-creating-alone/',
      title: 'Joanne Robertson on Creating Alone',
      domain: 'thecreativeindependent.com'
    },
    {
      url: 'https://www.ninaprotocol.com/articles/the-triumph-of-julias-war-recordings-the-indie-rock-antilabel-embracing-cassette-tapes-and-90s-rave-sounds',
      title: 'Julia\'s War Recordings: The Indie Rock Antilabel',
      domain: 'ninaprotocol.com'
    },
    {
      url: 'https://officemagazine.net/building-intensity-ouri',
      title: 'Building Intensity: Ouri',
      domain: 'officemagazine.net'
    },
    {
      url: 'https://www.altpress.com/sean-kennedy-olth-interview/',
      title: 'Sean Kennedy Olth Interview',
      domain: 'altpress.com'
    },
    {
      url: 'https://www.are.na/editorial/the-future-will-be-like-perfume',
      title: 'The Future Will Be Like Perfume',
      domain: 'are.na'
    }
  ];

  const handleLinkChange = (index: number) => {
    setCurrentLinkIndex(index);
  };

  return (
    <AppContainer $mode={mode}>
      <ModeSwitcher>
        <ModeOption title="evil" aria-label="evil" $active={mode === 'evil'} onClick={() => setMode('evil')}>evil</ModeOption>
        <ModeOption title="angel" aria-label="angel" $active={mode === 'angel'} onClick={() => setMode('angel')}>angel</ModeOption>
        <ModeOption title="regular" aria-label="regular" $active={mode === 'regular'} onClick={() => setMode('regular')}>regular</ModeOption>
      </ModeSwitcher>
      <ContentWrapper>
        <DesktopTitle>
          alphonse <TitleAccent>f</TitleAccent>
        </DesktopTitle>
        <MobileTitle>
          alphonse <TitleAccent>f</TitleAccent>
        </MobileTitle>
        <Bio />
      </ContentWrapper>
      <OrnamentalDivider mode={mode} />
      <ContentWrapper>
        <MediaPlayer 
          links={links}
          currentIndex={currentLinkIndex}
          onLinkChange={handleLinkChange}
          invertScroll={mode === 'evil'}
        />
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
