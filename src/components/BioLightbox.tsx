import React from 'react';
import styled from 'styled-components';

interface BioLightboxProps {
  isOpen: boolean;
  onClose: () => void;
}

const Overlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  display: ${props => props.$isOpen ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 2rem;
  opacity: ${props => props.$isOpen ? 1 : 0};
  transition: opacity 0.2s ease;
`;

const LightboxContent = styled.div`
  background: transparent;
  color: #000000;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  padding: 3rem 2.5rem;
  position: relative;
  border: 1px solid #000000;
  
  @media (max-width: 768px) {
    padding: 2rem 1.5rem;
    max-width: 90vw;
    max-height: 85vh;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: transparent;
  border: 1px solid #000000;
  color: #000000;
  padding: 4px 10px;
  font-size: 14px;
  cursor: pointer;
  line-height: 1;
  transition: border-color 120ms linear;
  font-family: 'Times New Roman', Times, serif;
  
  &:hover {
    border-color: #333333;
  }
  
  @media (max-width: 768px) {
    top: 0.5rem;
    right: 0.5rem;
    font-size: 12px;
    padding: 4px 8px;
  }
`;

const BioText = styled.div`
  font-size: 1rem;
  line-height: 1.6;
  color: #000000;
  font-family: 'Times New Roman', Times, serif;
  
  @media (max-width: 768px) {
    font-size: 0.95rem;
    line-height: 1.5;
  }
`;

const BioLightbox: React.FC<BioLightboxProps> = ({ isOpen, onClose }) => {
  const loremText = `
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
    
    Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
    
    Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
  `;

  return (
    <Overlay $isOpen={isOpen} onClick={onClose}>
      <LightboxContent onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose}>close</CloseButton>
        <BioText>{loremText.trim()}</BioText>
      </LightboxContent>
    </Overlay>
  );
};

export default BioLightbox;

