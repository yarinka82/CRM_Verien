
import React from 'react';
import { Box, AppBar, Toolbar, Typography, Button } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { Outlet } from 'react-router-dom';

import Sidebar from '@/components/Sidebar.tsx';
import {tokens} from "@/pages/Members/components/theme.ts";
import LanguageSwitcher from "@/components/LanguageSwitcher.tsx";
import {useAuth} from "@/hooks";



const Layout: React.FC = () => {
  const { username, logout } = useAuth();

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <Sidebar />

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <AppBar
          position="static"
          color="default"
          elevation={0}
          sx={{
            bgcolor: 'background.paper',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Toolbar sx={{ gap: 1 }}>
            <Typography variant="h6" sx={{ flexGrow: 1, color: tokens.ink }}>
              CRM Verein
            </Typography>
            <LanguageSwitcher />
            {username && (
              <Button
                size="small"
                onClick={() => logout()}
                startIcon={<LogoutIcon fontSize="small" />}
                sx={{ color: tokens.muted }}
              >
                {username}
              </Button>
            )}
          </Toolbar>
        </AppBar>

        <Box sx={{ flex: 1, overflow: 'auto', bgcolor: tokens.paper }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;