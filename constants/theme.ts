// Design system constants for consistent UI

export const colors = {
  primary: '#2563EB',      // Blue
  primaryLight: '#DBEAFE', // Light Blue
  secondary: '#64748B',    // Slate
  accent: '#10B981',       // Emerald
  warning: '#F59E0B',      // Amber
  error: '#EF4444',        // Red
  success: '#10B981',      // Emerald
  
  // Backgrounds
  background: '#FFFFFF',
  surface: '#F8FAFC',
  card: '#FFFFFF',
  
  // Text colors
  text: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  
  // Borders
  border: '#E2E8F0',
  borderFocus: '#2563EB',
  
  // States
  disabled: '#CBD5E1',
  placeholder: '#94A3B8',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
  },
};
