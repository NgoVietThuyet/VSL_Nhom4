// Legacy role names remain so every screen uses one semantic palette.
export const COLORS = {
  primary: '#00645B',
  primaryContainer: '#E0F3EE',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#164B44',
  primaryFixed: '#C6EBE2',
  onPrimaryFixedVariant: '#164B44',

  secondary: '#9B4D18',
  secondaryContainer: '#B65B1D',
  secondaryFixed: '#FFF0DF',
  onSecondaryFixed: '#713714',

  tertiary: '#2E7155',
  tertiaryContainer: '#E5F3E9',
  onTertiary: '#FFFFFF',
  tertiaryFixed: '#D7ECDD',
  onTertiaryFixed: '#22543B',
  onTertiaryContainer: '#22543B',

  background: '#F1F3F5',
  surface: '#F1F3F5',
  onSurface: '#17252B',
  onSurfaceVariant: '#46575D',
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: '#ECF3F0',
  surfaceContainer: '#E8EDEF',
  surfaceContainerHigh: '#DCE4E7',
  surfaceContainerHighest: '#CAD5D9',

  inverseSurface: '#20342F',
  inverseSurfaceRaised: '#34534A',
  inverseOnSurface: '#F7F9F6',
  outline: '#596C72',
  outlineVariant: '#C9D4D9',
  error: '#B3261E',
  errorContainer: '#FCEAE8',
  success: '#28704C',
  successContainer: '#E3F3E8',
  warning: '#8C521A',
  warningContainer: '#FFF0DF',
  disabled: '#7B8C84',
  disabledContainer: '#E7ECE8',
};

export const TYPOGRAPHY = {
  screenTitle: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  title: { fontSize: 20, lineHeight: 26, fontWeight: '700' },
  section: { fontSize: 18, lineHeight: 24, fontWeight: '700' },
  body: { fontSize: 15, lineHeight: 22 },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
  caption: { fontSize: 12, lineHeight: 17 },
  button: { fontSize: 15, lineHeight: 20, fontWeight: '700' },
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

export const ICON_SIZE = { sm: 20, md: 24, lg: 36 };
export const TOUCH_TARGET = 48;
export const CONTENT_MAX_WIDTH = 720;

export const SURFACES = {
  card: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: RADIUS.lg,
  },
};
