
import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Box, AppBar, Toolbar, Typography, Button } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import Sidebar from '../components/Sidebar';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useAuth } from '../hooks/useAuth';
import { tokens } from '@/pages/Members/components/theme.ts';

const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: tokens.paper }}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top Bar */}
        <AppBar
          position="static"
          color="default"
          elevation={0}
          sx={{
            bgcolor: tokens.ink,
            borderBottom: `2px solid ${tokens.registry}`,
            flexShrink: 0,
          }}
        >
          <Toolbar sx={{ gap: 1 }}>
            <Typography
              variant="h6"
              sx={{ flexGrow: 1, fontWeight: 800, color: tokens.paperElevated, letterSpacing: '0.02em' }}
            >
              Hub IT
            </Typography>

            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* User info + Logout */}
            {user && (
              <Button
                size="small"
                onClick={handleLogout}
                startIcon={<LogoutIcon fontSize="small" />}
                sx={{
                  color: tokens.cyan,
                  '&:hover': { color: tokens.paperElevated, bgcolor: 'rgba(41,171,226,0.1)' },
                }}
              >
                {user.username}
              </Button>
            )}
          </Toolbar>
        </AppBar>

        {/* Page Content */}
        <Box
          component="main"
          sx={{
            flex: 1,
            overflow: 'auto',
            p: 2,
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;