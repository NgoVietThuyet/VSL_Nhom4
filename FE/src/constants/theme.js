// Flat learner UI. Keep legacy color names as aliases for existing screens.
export const COLORS = {
  primary: '#176B62',
  primaryPressed: '#12564F',
  primaryDisabled: '#9ABBB4',
  primaryContainer: '#DDF0EA',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#164D47',
  primaryFixed: '#DDF0EA',
  onPrimaryFixedVariant: '#164D47',

  secondary: '#9B4A21',
  secondaryContainer: '#A95528',
  secondaryFixed: '#FBEBDD',
  onSecondaryFixed: '#663318',
  tertiary: '#24714A',
  tertiaryContainer: '#24714A',
  onTertiary: '#FFFFFF',
  tertiaryFixed: '#E1F2E6',
  onTertiaryFixed: '#1D5537',
  onTertiaryContainer: '#1D5537',

  background: '#F6F8F5',
  surface: '#F6F8F5',
  onSurface: '#19302D',
  onSurfaceVariant: '#536561',
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: '#EDF3EF',
  surfaceContainer: '#E7EFEB',
  surfaceContainerHigh: '#DCE7E1',
  surfaceContainerHighest: '#C9DAD2',
  inverseSurface: '#19302D',
  inverseOnSurface: '#FFFFFF',
  outline: '#61736D',
  outlineVariant: '#A9BCB2',
  border: '#D7E3DC',
  error: '#AA3535',
  errorContainer: '#FBE7E4',
  warning: '#9B4A21',
  warningContainer: '#FBEBDD',
  success: '#24714A',
  successContainer: '#E1F2E6',
  cameraBackdrop: '#142523',
};

export const TYPE = {
  caption: 12,
  bodySmall: 14,
  body: 16,
  titleSmall: 18,
  title: 22,
  headline: 28,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  margin: 20,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 16,
  xxl: 20,
  full: 9999,
};

export const SIZES = {
  touch: 44,
  input: 52,
  button: 52,
  icon: 22,
  iconSmall: 18,
};

export const BORDERS = {
  card: { borderWidth: 1, borderColor: COLORS.border },
  input: { borderWidth: 1, borderColor: COLORS.outlineVariant },
  focused: { borderWidth: 2, borderColor: COLORS.primary },
  error: { borderWidth: 1, borderColor: COLORS.error },
};

// Retained aliases remove elevation from screens that already consume SHADOWS.
export const SHADOWS = { sm: {}, md: {}, lg: {} };
