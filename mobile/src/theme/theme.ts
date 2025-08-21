import { MD3LightTheme as DefaultTheme } from 'react-native-paper';

// DeciGrade Design System - Consistent Color Palette
export const colors = {
  // Primary Colors
  primary: {
    main: '#1976D2',
    light: '#42A5F5',
    dark: '#1565C0',
    contrast: '#FFFFFF',
  },
  // Secondary Colors
  secondary: {
    main: '#FF6B35',
    light: '#FF8A65',
    dark: '#E64A19',
    contrast: '#FFFFFF',
  },
  // Success Colors
  success: {
    main: '#4CAF50',
    light: '#81C784',
    dark: '#388E3C',
    contrast: '#FFFFFF',
  },
  // Warning Colors
  warning: {
    main: '#FF9800',
    light: '#FFB74D',
    dark: '#F57C00',
    contrast: '#FFFFFF',
  },
  // Error Colors
  error: {
    main: '#F44336',
    light: '#E57373',
    dark: '#D32F2F',
    contrast: '#FFFFFF',
  },
  // Info Colors
  info: {
    main: '#2196F3',
    light: '#64B5F6',
    dark: '#1976D2',
    contrast: '#FFFFFF',
  },
  // Neutral Colors
  grey: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
  // Background Colors
  background: {
    default: '#FAFAFA',
    paper: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceVariant: '#F5F5F5',
  },
  // Text Colors
  text: {
    primary: '#212121',
    secondary: '#757575',
    disabled: '#BDBDBD',
    hint: '#9E9E9E',
  },
  // Border Colors
  border: {
    light: '#E0E0E0',
    medium: '#BDBDBD',
    dark: '#9E9E9E',
  },
  // Shadow Colors
  shadow: {
    light: 'rgba(0, 0, 0, 0.1)',
    medium: 'rgba(0, 0, 0, 0.2)',
    dark: 'rgba(0, 0, 0, 0.3)',
  },
  // Gradient Colors
  gradient: {
    primary: ['#1976D2', '#42A5F5'],
    secondary: ['#FF6B35', '#FF8A65'],
    success: ['#4CAF50', '#81C784'],
    warning: ['#FF9800', '#FFB74D'],
    error: ['#F44336', '#E57373'],
  },
};

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    // Primary Colors
    primary: colors.primary.main,
    primaryContainer: colors.primary.light,
    onPrimary: colors.primary.contrast,
    onPrimaryContainer: colors.primary.dark,
    
    // Secondary Colors
    secondary: colors.secondary.main,
    secondaryContainer: colors.secondary.light,
    onSecondary: colors.secondary.contrast,
    onSecondaryContainer: colors.secondary.dark,
    
    // Tertiary Colors
    tertiary: colors.success.main,
    tertiaryContainer: colors.success.light,
    onTertiary: colors.success.contrast,
    onTertiaryContainer: colors.success.dark,
    
    // Surface Colors
    surface: colors.background.surface,
    surfaceVariant: colors.background.surfaceVariant,
    onSurface: colors.text.primary,
    onSurfaceVariant: colors.text.secondary,
    
    // Background Colors
    background: colors.background.default,
    onBackground: colors.text.primary,
    
    // Error Colors
    error: colors.error.main,
    errorContainer: colors.error.light,
    onError: colors.error.contrast,
    onErrorContainer: colors.error.dark,
    
    // Outline Colors
    outline: colors.border.medium,
    outlineVariant: colors.border.light,
    
    // Shadow Colors
    shadow: colors.shadow.medium,
    scrim: colors.shadow.dark,
    
    // Inverse Colors
    inverseSurface: colors.grey[900],
    inverseOnSurface: colors.grey[50],
    inversePrimary: colors.primary.light,
    
    // Elevation Colors
    elevation: {
      level0: 'transparent',
      level1: colors.background.surface,
      level2: colors.background.surface,
      level3: colors.background.surface,
      level4: colors.background.surface,
      level5: colors.background.surface,
    },
  },
  fonts: {
    ...DefaultTheme.fonts,
    displayLarge: {
      fontFamily: 'System',
      fontSize: 57,
      fontWeight: '400' as const,
      letterSpacing: -0.25,
      lineHeight: 64,
    },
    displayMedium: {
      fontFamily: 'System',
      fontSize: 45,
      fontWeight: '400' as const,
      letterSpacing: 0,
      lineHeight: 52,
    },
    displaySmall: {
      fontFamily: 'System',
      fontSize: 36,
      fontWeight: '400' as const,
      letterSpacing: 0,
      lineHeight: 44,
    },
    headlineLarge: {
      fontFamily: 'System',
      fontSize: 32,
      fontWeight: '700' as const,
      letterSpacing: 0,
      lineHeight: 40,
    },
    headlineMedium: {
      fontFamily: 'System',
      fontSize: 28,
      fontWeight: '600' as const,
      letterSpacing: 0,
      lineHeight: 36,
    },
    headlineSmall: {
      fontFamily: 'System',
      fontSize: 24,
      fontWeight: '600' as const,
      letterSpacing: 0,
      lineHeight: 32,
    },
    titleLarge: {
      fontFamily: 'System',
      fontSize: 22,
      fontWeight: '600' as const,
      letterSpacing: 0,
      lineHeight: 28,
    },
    titleMedium: {
      fontFamily: 'System',
      fontSize: 16,
      fontWeight: '500' as const,
      letterSpacing: 0.15,
      lineHeight: 24,
    },
    titleSmall: {
      fontFamily: 'System',
      fontSize: 14,
      fontWeight: '500' as const,
      letterSpacing: 0.1,
      lineHeight: 20,
    },
    bodyLarge: {
      fontFamily: 'System',
      fontSize: 16,
      fontWeight: '400' as const,
      letterSpacing: 0.5,
      lineHeight: 24,
    },
    bodyMedium: {
      fontFamily: 'System',
      fontSize: 14,
      fontWeight: '400' as const,
      letterSpacing: 0.25,
      lineHeight: 20,
    },
    bodySmall: {
      fontFamily: 'System',
      fontSize: 12,
      fontWeight: '400' as const,
      letterSpacing: 0.4,
      lineHeight: 16,
    },
    labelLarge: {
      fontFamily: 'System',
      fontSize: 14,
      fontWeight: '500' as const,
      letterSpacing: 0.1,
      lineHeight: 20,
    },
    labelMedium: {
      fontFamily: 'System',
      fontSize: 12,
      fontWeight: '500' as const,
      letterSpacing: 0.5,
      lineHeight: 16,
    },
    labelSmall: {
      fontFamily: 'System',
      fontSize: 11,
      fontWeight: '500' as const,
      letterSpacing: 0.5,
      lineHeight: 16,
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    round: 50,
  },
  shadows: {
    small: {
      shadowColor: colors.shadow.light,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
    },
    medium: {
      shadowColor: colors.shadow.medium,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 4,
    },
    large: {
      shadowColor: colors.shadow.dark,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
  },
}; 