import React from 'react';
import styled from 'styled-components';

const BioContainer = styled.div`
  margin-bottom: 4rem;

  /* Mobile spacing */
  @media (max-width: 768px) {
    margin-bottom: 1.25rem;
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

const Bio: React.FC = () => {
  return (
    <BioContainer>
      <BioText>
        I ask because I want to turn you over in the question
      </BioText>
    </BioContainer>
  );
};

export default Bio;
