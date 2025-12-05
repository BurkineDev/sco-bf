// ============================================================================
// DESIGN SYSTEM - SCOLARITÉ BF
// Inspiré des couleurs du Burkina Faso: vert, rouge, jaune (soleil)
// Esthétique: Moderne africaine, chaleureuse, accessible
// ============================================================================

export const Colors = {
  // Palette principale - Inspirée du drapeau et de la nature burkinabè
  primary: {
    50: '#E8F5E9',
    100: '#C8E6C9',
    200: '#A5D6A7',
    300: '#81C784',
    400: '#66BB6A',
    500: '#0A6847', // Vert principal - forêt
    600: '#085A3D',
    700: '#064D34',
    800: '#04402A',
    900: '#022E1E',
  },
  
  // Accent - Or/Jaune soleil du Sahel
  accent: {
    50: '#FFF8E1',
    100: '#FFECB3',
    200: '#FFE082',
    300: '#FFD54F',
    400: '#FFCA28',
    500: '#F9A825', // Or principal
    600: '#F57F17',
    700: '#EF6C00',
    800: '#E65100',
    900: '#BF360C',
  },
  
  // Sémantique
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Neutres chauds
  neutral: {
    0: '#FFFFFF',
    50: '#FDFBF7',
    100: '#F5F0E8',
    200: '#E8E0D5',
    300: '#D4C9BC',
    400: '#B8A99A',
    500: '#8C7B6B',
    600: '#6B5B4D',
    700: '#4A3F35',
    800: '#2D251E',
    900: '#1A1512',
  },
  
  // Background
  background: {
    primary: '#FDFBF7',
    secondary: '#F5F0E8',
    tertiary: '#E8E0D5',
    card: '#FFFFFF',
    elevated: '#FFFFFF',
  },
  
  // Text
  text: {
    primary: '#1A1512',
    secondary: '#6B5B4D',
    tertiary: '#8C7B6B',
    inverse: '#FFFFFF',
    link: '#0A6847',
  },
  
  // Overlay
  overlay: {
    light: 'rgba(253, 251, 247, 0.9)',
    dark: 'rgba(26, 21, 18, 0.7)',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
};

export const BorderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
};

export const Typography = {
  // Font families - Google Fonts disponibles via expo-font
  fontFamily: {
    regular: 'Outfit-Regular',
    medium: 'Outfit-Medium',
    semibold: 'Outfit-SemiBold',
    bold: 'Outfit-Bold',
  },
  
  // Font sizes
  fontSize: {
    xs: 11,
    sm: 13,
    base: 15,
    lg: 17,
    xl: 19,
    '2xl': 22,
    '3xl': 26,
    '4xl': 32,
    '5xl': 40,
  },
  
  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const Shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#1A1512',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#1A1512',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#1A1512',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: '#1A1512',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
};

// Animation durations
export const Animation = {
  fast: 150,
  normal: 250,
  slow: 400,
  spring: {
    damping: 15,
    stiffness: 150,
  },
};

// Breakpoints (pour tablettes si besoin)
export const Breakpoints = {
  sm: 320,
  md: 375,
  lg: 414,
  xl: 768,
};
