import React from 'react';
import styled, { keyframes } from 'styled-components';

const Wrap = styled.div`
  margin: 1.25rem 0 1.5rem 0;
  color: var(--fg); /* match main text color per mode */
  user-select: none;
  pointer-events: none;
  width: 100vw;
  margin-left: calc(50% - 50vw);
  margin-right: calc(50% - 50vw);
  overflow: hidden;

  /* Mobile spacing */
  @media (max-width: 768px) {
    margin: 0.75rem 0 1rem 0;
    width: 100%;
    margin-left: 0;
    margin-right: 0;
  }
`;

const Row = styled.div`
  overflow: hidden;
  width: 100%;
`;

const BaseText = styled.div`
  display: inline-block;
  white-space: nowrap;
  font-family: 'IBM Plex Mono', 'JetBrains Mono', 'SFMono-Regular', ui-monospace, monospace;
  font-size: 12px;
  line-height: 1;

  /* Mobile font scaling */
  @media (max-width: 768px) {
    font-size: 10px;
  }
`;

const scrollLoop = keyframes`
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
`;

const Track = styled(BaseText)<{ $duration: number; $direction?: 'normal' | 'reverse'; $delay?: number }>`
  will-change: transform;
  animation: ${scrollLoop} ${p => p.$duration}s linear infinite;
  animation-direction: ${p => p.$direction || 'normal'};
  animation-delay: ${p => (p.$delay || 0)}s;

  /* Mobile performance optimizations */
  @media (max-width: 768px) {
    /* Force animations to work on mobile */
    will-change: transform;
    transform: translateZ(0); /* Force hardware acceleration */
    -webkit-transform: translateZ(0);
    -webkit-animation: ${scrollLoop} ${p => p.$duration}s linear infinite;
    -webkit-animation-direction: ${p => p.$direction || 'normal'};
    -webkit-animation-delay: ${p => (p.$delay || 0)}s;
    
    /* Ensure animations are not disabled */
    animation-play-state: running !important;
    -webkit-animation-play-state: running !important;
    
    /* Disable animations on low-end devices */
    @media (prefers-reduced-motion: reduce) {
      animation: none;
      -webkit-animation: none;
    }
  }
`;

interface OrnamentalDividerProps {
  mode?: 'evil' | 'angel' | 'regular';
}

const OrnamentalDivider: React.FC<OrnamentalDividerProps> = ({ mode = 'evil' }) => {
  // Extended groupings
  const topSeg = '╔══════════════╦═══════════════════╦══════════════╗   ';
  const midSeg = '✧ ✦ ✪ ✫ ✬ ✭ ✮ ✯ ✰ ✱ ✲ ✳ ✴ ✵ ✶ ✷ ✸ ✹ ✺ ✻ ✼ ✽ ✾ ❀ ❁ ❂ ❃ ❄ ❅ ❆ ❇   ';
  const botSeg = '╚══════════════╩═══════════════════╩══════════════╝   ';

  const top = topSeg.repeat(60);
  const mid = midSeg.repeat(60);
  const bot = botSeg.repeat(60);

  // Two concatenated copies for seamless loop; the -50% shift hides the reset
  const dup = (s: string) => s + s;

  // In regular mode, make ornament invisible by matching background color
  const isRegular = mode === 'regular';
  
  return (
    <Wrap aria-hidden style={{ color: isRegular ? 'var(--bg)' : undefined }}>
      <Row>
        <Track
          $duration={192}
          $direction="normal"
          $delay={0}
        >
          {dup(top)}
        </Track>
      </Row>
      <Row>
        <Track
          $duration={144}
          $direction="reverse"
          $delay={0}
        >
          {dup(mid)}
        </Track>
      </Row>
      <Row>
        <Track
          $duration={240}
          $direction="normal"
          $delay={0}
        >
          {dup(bot)}
        </Track>
      </Row>
    </Wrap>
  );
};

export default OrnamentalDivider;
