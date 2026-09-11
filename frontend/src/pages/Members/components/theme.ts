import { createTheme } from '@mui/material/styles';

// Hub IT theme — navy/cyan-blue palette, geometric sans.
// Matches the Digital I Hub Würzburg e.V. logo: dark navy background,
// single bright accent blue, no gold, no serif.

export const tokens = {
  ink: '#011226',
  registry: '#1C9DF2',
  registryDark: '#1580CC',
  cyan: '#29ABE2',
  paper: '#F7F9FC',
  paperElevated: '#FFFFFF',
  muted: '#8A94A6',
  divider: '#E1E5EC',
  danger: '#D6453D',
};

const theme = createTheme({
  palette: {
    background: {
      default: tokens.paper,
      paper: tokens.paperElevated,
    },
    primary: {
      main: tokens.registry,
      dark: tokens.registryDark,
      contrastText: '#FFFFFF',
    },
    text: {
      primary: tokens.ink,
      secondary: tokens.muted,
    },
    divider: tokens.divider,
    error: {
      main: tokens.danger,
    },
  },
  typography: {
    fontFamily: '"Inter", "Helvetica Neue", sans-serif',
    h1: { fontFamily: '"Inter", sans-serif', fontWeight: 800, letterSpacing: '-0.01em' },
    h2: { fontFamily: '"Inter", sans-serif', fontWeight: 800, letterSpacing: '-0.01em' },
    h3: { fontFamily: '"Inter", sans-serif', fontWeight: 700 },
    h4: { fontFamily: '"Inter", sans-serif', fontWeight: 700 },
    h5: { fontFamily: '"Inter", sans-serif', fontWeight: 700, letterSpacing: '0.02em' },
    h6: { fontFamily: '"Inter", sans-serif', fontWeight: 700 },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: '0.72rem',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: tokens.muted,
          borderBottom: `2px solid ${tokens.ink}`,
        },
        body: {
          borderBottom: `1px solid ${tokens.divider}`,
        },
      },
    },
  },
});

export default theme;