
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, AppBar, Toolbar, Typography } from '@mui/material';
import Sidebar from '../components/Sidebar';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useAuth } from '../hooks/useAuth';

const MainLayout: React.FC = () => {
  const { user } = useAuth();

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#f5f5f5' }}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top Bar */}
        <AppBar
          position="static"
          color="default"
          elevation={1}
          sx={{
            bgcolor: 'background.paper',
            borderBottom: '1px solid',
            borderColor: 'divider',
            flexShrink: 0,
          }}
        >
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
              CRM Verien
            </Typography>

            {/* User info */}
            {user && (
              <Typography variant="body2" sx={{ mr: 2, color: 'text.secondary' }}>
                {user.username}
              </Typography>
            )}

            {/* Language Switcher */}
            <LanguageSwitcher />
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