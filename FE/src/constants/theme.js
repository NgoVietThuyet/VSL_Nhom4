export const COLORS = {
  primary: '#005c55',
  primaryContainer: '#0f766e',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#a3faef',
  primaryFixed: '#9cf2e8',
  onPrimaryFixedVariant: '#00504a',
  
  secondary: '#9d4300',
  secondaryContainer: '#fd761a',
  secondaryFixed: '#ffdbca',
  onSecondaryFixed: '#341100',
  
  tertiary: '#005e3f',
  tertiaryContainer: '#007952',
  onTertiary: '#ffffff',
  tertiaryFixed: '#6ffbbe',
  onTertiaryFixed: '#002113',
  onTertiaryContainer: '#99ffcd',
  
  background: '#e8eef5',
  surface: '#e8eef5',
  onSurface: '#131b2e',
  onSurfaceVariant: '#3e4947',
  
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f2f3ff',
  surfaceContainer: '#eaedff',
  surfaceContainerHigh: '#e2e7ff',
  surfaceContainerHighest: '#dae2fd',
  
  inverseSurface: '#283044',
  inverseOnSurface: '#eef0ff',
  
  outline: '#6e7977',
  outlineVariant: '#bdc9c6',
  error: '#ba1a1a',
  errorContainer: '#ffdad6',

  // Viền thẻ & lớp phủ tương tác (hover / nhấn)
  cardBorder: '#d3dde9',
  hoverOverlay: 'rgba(19, 27, 46, 0.06)',
  pressedOverlay: 'rgba(19, 27, 46, 0.14)',
  disabledSurface: '#dde4ec',
  disabledOnSurface: '#7a8794',
};

// Kích thước tối thiểu của vùng chạm và cỡ chữ (chuẩn truy cập)
export const TOUCH = {
  min: 44,
};

export const FONT = {
  label: 12,
  body: 14,
  bodyLg: 16,
  title: 18,
};

// Thông số chuyển động dùng chung cho hover / nhấn / ăn mừng
export const MOTION = {
  hoverScale: 1.02,
  pressScale: 0.96,
  springSpeed: 28,
  springBounciness: 8,
  popDurationMs: 380,
  shakeDistance: 8,
  shakeStepMs: 60,
  confettiMs: 1800,
  confettiCount: 36,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  margin: 16,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 8,
  },
};
