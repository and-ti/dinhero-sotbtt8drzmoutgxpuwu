import { StyleSheet } from 'react-native';

// Definição dos temas
export const lightTheme = {
  colors: {
    primary: '#1976d2',
    primaryDark: '#1565c0',
    secondary: '#388e3c',
    onPrimary: '#ffffff',
    error: '#d32f2f',
    warning: '#f57c00',
    success: '#388e3c',
    background: '#f5f5f5',
    surface: '#ffffff',
    card: '#ffffff',
    text: '#333333',
    textSecondary: '#666666',
    textLight: '#999999',
    placeholder: 'red',
    border: '#e0e0e0',
    divider: '#e0e0e0',
    overlay: 'rgba(0,0,0,0.4)',
    // Cores para header e navbar
    header: '#ffffff',
    navbar: '#ffffff',
    navbarText: '#333333',
    navbarActive: '#1976d2',
    navbarInactive: '#666666',
    // Gradientes
    gradientStart: 'rgb(251, 231, 255)',
    gradientEnd: 'rgb(213, 211, 255)',
    gradientSecondary: 'rgb(250, 231, 252)',
    gradientSecondaryEnd: 'rgb(250, 220, 224)',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
  typography: {
    h1: {
      fontSize: 28,
      fontWeight: 'bold',
    },
    h2: {
      fontSize: 24,
      fontWeight: 'bold',
    },
    h3: {
      fontSize: 20,
      fontWeight: 'bold',
    },
    h4: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    body: {
      fontSize: 16,
    },
    bodySmall: {
      fontSize: 14,
    },
    caption: {
      fontSize: 12,
    },
  },
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 4,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
  },
  blur: {
    intensity: 10,
    tint: 'light',
  },
};

export const darkTheme = {
  colors: {
    primary: '#42a5f5',
    primaryDark: '#1976d2',
    secondary: '#66bb6a',
    onPrimary: '#ffffff',
    error: '#ef5350',
    warning: '#ff9800',
    success: '#66bb6a',
    background: '#121212',
    surface: '#1e1e1e',
    card: '#2d2d2d',
    text: '#ffffff',
    textSecondary: '#b0b0b0',
    textLight: '#808080',
    placeholder: 'red',
    border: '#404040',
    divider: '#404040',
    overlay: 'rgba(0,0,0,0.6)',
    // Cores para header e navbar
    header: '#1e1e1e',
    navbar: '#1e1e1e',
    navbarText: '#ffffff',
    navbarActive: '#42a5f5',
    navbarInactive: '#b0b0b0',
    // Gradientes
    gradientStart: 'rgb(15, 0, 34)',
    gradientEnd: 'rgb(3, 19, 37)',
    gradientSecondary: 'rgb(41, 21, 49)',
    gradientSecondaryEnd: 'rgb(37, 17, 31)',
  },
  spacing: lightTheme.spacing,
  borderRadius: lightTheme.borderRadius,
  typography: lightTheme.typography,
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 4,
      elevation: 4,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 8,
      elevation: 8,
    },
  },
  blur: {
    intensity: 15,
    tint: 'dark',
  },
};

export type Theme = typeof lightTheme;

// Estilos comuns que podem ser reutilizados
export const commonStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    margin: theme.spacing.md,
    ...theme.shadows.medium,
    overflow: 'hidden',
  },
  cardContent: {
    padding: theme.spacing.md,
    backgroundColor: 'transparent',
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  input: {
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.md,
  },
  button: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
  },
  buttonSpaced: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.typography.h4,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  infoText: {
    ...theme.typography.body,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  divider: {
    marginVertical: theme.spacing.md,
    backgroundColor: theme.colors.divider,
  },
  fab: {
    position: 'absolute',
    margin: theme.spacing.md,
    right: 0,
    bottom: 0,
  },
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
  },
  emptyText: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    marginTop: theme.spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  summaryValue: {
    ...theme.typography.body,
    fontWeight: 'bold',
  },
  chipContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  chip: {
    marginRight: theme.spacing.sm,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  filterLabel: {
    ...theme.typography.body,
    marginRight: theme.spacing.sm,
    minWidth: 80,
  },
  searchBar: {
    marginBottom: theme.spacing.md,
  },
  clearButton: {
    marginTop: theme.spacing.sm,
  },
  transactionItem: {
    paddingVertical: theme.spacing.sm,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionValue: {
    ...theme.typography.body,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
  },
  editButton: {
    margin: 0,
  },
  segmentedButtons: {
    marginBottom: theme.spacing.md,
  },
  linkButton: {
    marginTop: theme.spacing.sm,
  },
  logoutButton: {
    borderColor: theme.colors.error,
  },
  deleteButton: {
    borderColor: theme.colors.error,
  },
  familiaPreview: {
    backgroundColor: theme.colors.primary + '10',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.md,
  },
  familiaLabel: {
    ...theme.typography.bodySmall,
    color: theme.colors.primary,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
  },
  familiaNome: {
    ...theme.typography.body,
    color: theme.colors.primary,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
  },
  // Estilos para gradiente e blur
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  blurContainer: {
    overflow: 'hidden',
    borderRadius: theme.borderRadius.md,
  },
  glassCard: {
    backgroundColor: theme.colors.surface + '33',
    borderRadius: theme.borderRadius.md,
    margin: theme.spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border + '40',
  },
}); 