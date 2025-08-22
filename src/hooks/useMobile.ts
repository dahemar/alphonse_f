import { useState, useEffect } from 'react';

interface MobileInfo {
  isMobile: boolean;
  isTablet: boolean;
  isPhone: boolean;
  screenWidth: number;
  screenHeight: number;
  orientation: 'portrait' | 'landscape';
  pixelRatio: number;
  touchSupport: boolean;
}

export const useMobile = (): MobileInfo => {
  const [mobileInfo, setMobileInfo] = useState<MobileInfo>({
    isMobile: false,
    isTablet: false,
    isPhone: false,
    screenWidth: 0,
    screenHeight: 0,
    orientation: 'portrait',
    pixelRatio: 1,
    touchSupport: false,
  });

  useEffect(() => {
    const updateMobileInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Detect mobile devices
      const isMobile = width <= 768;
      const isTablet = width > 768 && width <= 1024;
      const isPhone = width <= 480;
      
      // Detect orientation
      const orientation = width > height ? 'landscape' : 'portrait';
      
      // Get pixel ratio for high-DPI displays
      const pixelRatio = window.devicePixelRatio || 1;
      
      // Detect touch support
      const touchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      setMobileInfo({
        isMobile,
        isTablet,
        isPhone,
        screenWidth: width,
        screenHeight: height,
        orientation,
        pixelRatio,
        touchSupport,
      });
    };

    // Initial check
    updateMobileInfo();
    
    // Listen for resize events
    window.addEventListener('resize', updateMobileInfo);
    window.addEventListener('orientationchange', updateMobileInfo);
    
    return () => {
      window.removeEventListener('resize', updateMobileInfo);
      window.removeEventListener('orientationchange', updateMobileInfo);
    };
  }, []);

  return mobileInfo;
};

// Hook for lazy loading optimization
export const useLazyLoading = (isMobile: boolean, items: any[], bufferSize: number = 2) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: Math.min(bufferSize, items.length - 1) });

  const updateVisibleRange = (start: number, end: number) => {
    if (!isMobile) return;
    
    const bufferedStart = Math.max(0, start - bufferSize);
    const bufferedEnd = Math.min(items.length - 1, end + bufferSize);
    
    setVisibleRange({ start: bufferedStart, end: bufferedEnd });
  };

  return { visibleRange, updateVisibleRange };
};

// Hook for touch gesture detection
export const useTouchGestures = (onSwipeLeft?: () => void, onSwipeRight?: () => void) => {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number; timestamp: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number; timestamp: number } | null>(null);
  const [isSwiping, setIsSwiping] = useState(false);

  const minSwipeDistance = 25; // px
  const maxSwipeTime = 500; // ms
  const minSwipeVelocity = 0.3; // px/ms

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.targetTouches.length !== 1) return;
    const t = e.targetTouches[0];
    setTouchEnd(null);
    setIsSwiping(false);
    setTouchStart({ x: t.clientX, y: t.clientY, timestamp: Date.now() });
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.targetTouches.length !== 1) return;
    const t = e.targetTouches[0];
    setTouchEnd({ x: t.clientX, y: t.clientY, timestamp: Date.now() });

    if (touchStart && !isSwiping) {
      const dx = Math.abs(t.clientX - touchStart.x);
      const dy = Math.abs(t.clientY - touchStart.y);
      if (dx > 10 && dx > dy) {
        setIsSwiping(true);
      }
    }

    // Prevent vertical scrolling when interacting with thumbnails
    // Allow only horizontal intent
    if (touchStart) {
      const dy = Math.abs(t.clientY - touchStart.y);
      const dx = Math.abs(t.clientX - touchStart.x);
      if (dx > dy) {
        e.preventDefault();
      }
    }
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      setIsSwiping(false);
      return;
    }
    const now = Date.now();
    const timeElapsed = now - touchStart.timestamp;
    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const velocityX = Math.abs(distanceX) / Math.max(1, timeElapsed);
    const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY);
    const hasMinDistance = Math.abs(distanceX) > minSwipeDistance;
    const hasMinVelocity = velocityX > minSwipeVelocity;
    const isQuickGesture = timeElapsed < maxSwipeTime;

    if (isHorizontalSwipe && hasMinDistance && (hasMinVelocity || isQuickGesture) && isSwiping) {
      if (distanceX > 0 && onSwipeLeft) onSwipeLeft();
      else if (distanceX < 0 && onSwipeRight) onSwipeRight();
    }

    setTouchStart(null);
    setTouchEnd(null);
    setIsSwiping(false);
  };

  const onTouchCancel = () => {
    setTouchStart(null);
    setTouchEnd(null);
    setIsSwiping(false);
  };

  return { onTouchStart, onTouchMove, onTouchEnd, onTouchCancel, isSwiping };
};
