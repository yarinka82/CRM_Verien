import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Typography, TextField, Button, Alert, IconButton, InputAdornment } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import {tokens} from "@/pages/Members/components/theme.ts";
import {useAuth} from "@/hooks";
import LanguageSwitcher from "@/components/LanguageSwitcher.tsx";
import logo from "@/assets/img.png";

const Login: React.FC = () => {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as { from?: Location })?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login.errorGeneric'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', position: 'relative', flexDirection: 'column' }}>
      <Box sx={{ height: 4, flexShrink: 0, bgcolor: tokens.registry }} />

      <Box sx={{ display: 'flex', flex: 1 }}>
        <Box sx={{ position: 'absolute', top: 22, right: 16, zIndex: 1 }}>
          <LanguageSwitcher />
        </Box>

    {/* Left — logo panel, hidden on narrow screens */}
    <Box
      sx={{
        display: { xs: 'none', md: 'flex' },
        flex: 1,
        bgcolor: tokens.ink,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        p: 6,
      }}
    >
      <Box
        component="img"
        src={logo}
        alt="Hub IT"
        sx={{ width: '100%', maxWidth: { md: 420, lg: 520 } }}
      />
      <Typography
        variant="h4"
        sx={{
          color: tokens.cyan,
          mt: 3,
          textAlign: 'center',
          fontWeight: 800,
          letterSpacing: '0.03em',
          maxWidth: 380,
        }}
      >
        {t('login.brandSubtitle')}
      </Typography>
    </Box>

        {/* Right — login form */}
        <Box
          sx={{
            flex: 1,
            bgcolor: tokens.paper,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            px: 4,
          }}
        >
          <Box sx={{ width: '100%', maxWidth: 360 }}>
            <Typography variant="h4" sx={{ color: tokens.ink, mb: 0.5 }}>
              {t('login.title')}
            </Typography>
            <Typography variant="body2" sx={{ color: tokens.muted, mb: 4 }}>
              {t('login.subtitle')}
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

              <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label={t('login.usernameLabel')}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                margin="normal"
                autoFocus
                sx={{ bgcolor: tokens.paperElevated }}
              />
              <TextField
                fullWidth
                type={showPassword ? 'text' : 'password'}
                label={t('login.passwordLabel')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                sx={{ bgcolor: tokens.paperElevated }}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                          onClick={() => setShowPassword((prev) => !prev)}
                          edge="end"
                          tabIndex={-1}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={submitting}
                sx={{
                  mt: 3,
                  py: 1.2,
                  bgcolor: tokens.registry,
                  '&:hover': { bgcolor: tokens.registryDark },
                }}
              >
                {submitting ? t('login.submitting') : t('login.submit')}
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;