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
  
  background: '#f6faf9',
  surface: '#f6faf9',
  onSurface: '#14201e',
  onSurfaceVariant: '#485b57',
  
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#eef4f2',
  surfaceContainer: '#e8f0ed',
  surfaceContainerHigh: '#e1ebe7',
  surfaceContainerHighest: '#d5e2dd',
  
  inverseSurface: '#142623',
  inverseOnSurface: '#f2faf7',
  
  outline: '#667773',
  outlineVariant: '#778b85',
  error: '#ba1a1a',
  errorContainer: '#ffdad6',
};

// Semantic learner-facing tokens shared by authentication and learning flows.
export const LEARNER_THEME = {
  background: '#f6faf9',
  surface: '#ffffff',
  surfaceSubtle: '#eef4f2',
  surfaceRaised: '#e4eeeb',
  primary: COLORS.primary,
  primaryPressed: '#004943',
  primarySoft: '#d7f2ee',
  onPrimary: COLORS.onPrimary,
  secondary: COLORS.secondary,
  secondarySoft: '#ffe4d1',
  onSecondarySoft: '#7a3300',
  success: '#146c4f',
  textPrimary: '#14201e',
  textSecondary: '#485b57',
  textMuted: '#667773',
  border: '#c7d4d1',
  focusRing: '#00766d',
  disabledContainer: '#dce5e3',
  disabledContent: '#879591',
  primaryRipple: 'rgba(255,255,255,0.18)',
  neutralRipple: 'rgba(0,92,85,0.10)',
};

export const TYPOGRAPHY = {
  screenTitle: { fontSize: 24, lineHeight: 30, fontWeight: '700' },
  sectionTitle: { fontSize: 20, lineHeight: 26, fontWeight: '700' },
  componentTitle: { fontSize: 18, lineHeight: 24, fontWeight: '700' },
  bodyLarge: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  body: { fontSize: 14, lineHeight: 21, fontWeight: '400' },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
};

export const CONTROL_SIZE = {
  touchTarget: 48,
  input: 56,
  primaryButton: 56,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  margin: 20,
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
  subtle: {
    shadowColor: '#14201e',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#14201e',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#14201e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  lg: {
    shadowColor: '#14201e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 10,
    elevation: 3,
  },
};
