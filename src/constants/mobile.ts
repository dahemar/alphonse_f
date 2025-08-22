// Mobile breakpoints
export const MOBILE_BREAKPOINTS = {
  PHONE: 480,
  TABLET: 768,
  DESKTOP: 1024,
} as const;

// Touch-friendly dimensions
export const TOUCH_DIMENSIONS = {
  MIN_TOUCH_TARGET: 44, // Apple's recommended minimum
  THUMBNAIL_WIDTH: 120,
  THUMBNAIL_HEIGHT: 120,
  LARGE_THUMBNAIL_WIDTH: 180,
  LARGE_THUMBNAIL_HEIGHT: 180,
} as const;

// Swipe gesture settings
export const SWIPE_CONFIG = {
  MIN_DISTANCE: 50,
  VELOCITY_THRESHOLD: 0.3,
  DIRECTION_THRESHOLD: 0.7, // How much horizontal vs vertical movement is required
} as const;

// Performance settings
export const PERFORMANCE_CONFIG = {
  LAZY_LOAD_BUFFER: 2, // Number of items to render outside viewport
  ANIMATION_DURATION_MULTIPLIER: 0.8, // Reduce animation duration on mobile
  RAF_THROTTLE: 16, // ~60fps
} as const;

// Font scaling for mobile
export const FONT_SCALING = {
  TITLE: {
    MIN: '2rem',
    PREFERRED: '8vw',
    MAX: '2.6rem',
  },
  SUBTITLE: {
    MIN: '1rem',
    PREFERRED: '4.5vw',
    MAX: '1.2rem',
  },
  BODY: {
    MIN: '0.7rem',
    PREFERRED: '3vw',
    MAX: '0.78rem',
  },
} as const;

// Spacing adjustments for mobile
export const MOBILE_SPACING = {
  CONTAINER_PADDING: '1rem',
  SECTION_MARGIN: '1.5rem',
  ELEMENT_GAP: '0.6rem',
  THUMBNAIL_MARGIN: '0.4rem',
} as const;
