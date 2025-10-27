import React from 'react';
import styled from 'styled-components';

interface BioProps {
  text: string;
}

const BioContainer = styled.div`
  margin-bottom: 3.375rem; /* 4rem - 0.625rem (10px) */
  margin-top: -16px;

  /* Mobile spacing */
  @media (max-width: 768px) {
    margin-bottom: 1rem; /* 1.25rem - 0.25rem (4px) */
  }
`;

const BioText = styled.p`
  color: var(--fg);
  font-size: 1.2rem;
  line-height: 1.4;
  margin: 0;
  font-weight: 300;
  font-style: italic;
  letter-spacing: 0.02em;
  max-width: 600px;
  margin: 0; /* remove auto-centering */
  text-align: left;

  /* Mobile font scaling and line height */
  @media (max-width: 768px) {
    font-size: clamp(0.95rem, 4vw, 1.1rem);
    line-height: 1.3;
    letter-spacing: 0.01em;
    max-width: 100%;
    text-align: left; /* Keep left alignment */
    padding: 0; /* Remove horizontal padding */
  }
`;

const Bio: React.FC<BioProps> = ({ text }) => {
  return (
    <BioContainer>
      <BioText>
        {text}
      </BioText>
    </BioContainer>
  );
};

export default Bio;
