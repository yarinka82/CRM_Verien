
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  Tooltip,
} from '@mui/material';
import {
  Home,
  Group as GroupIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const isActive = (path: string) => location.pathname === path;

  // Основные пункты меню
  const menuItems = [
    { label: t('nav.home'), icon: <Home />, path: '/' },
    { label: t('nav.members'), icon: <GroupIcon />, path: '/members' },
    // TODO: Добавить другие пункты позже
    // { label: t('nav.clients'), icon: <People />, path: '/clients' },
  ];

  const renderItem = (item: { label: string; icon: React.ReactNode; path: string }) => (
    <ListItem disablePadding key={item.path} sx={{ mb: 1.5, justifyContent: 'center' }}>
      <Tooltip title={item.label} placement="right">
        <ListItemButton
          selected={isActive(item.path)}
          onClick={() => navigate(item.path)}
          sx={{
            minWidth: 44,
            maxWidth: 44,
            height: 44,
            borderRadius: '12px',
            justifyContent: 'center',
            p: 0,
            '&.Mui-selected': {
              bgcolor: 'primary.main',
              color: 'white',
            },
            '&:hover': {
              bgcolor: 'primary.light',
              color: 'white',
            },
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 0,
              justifyContent: 'center',
              color: 'inherit',
            }}
          >
            {item.icon}
          </ListItemIcon>
        </ListItemButton>
      </Tooltip>
    </ListItem>
  );

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        py: 2,
        height: '100vh',
        width: 60,
        bgcolor: 'background.paper',
        borderRight: '1px solid',
        borderColor: 'divider',
        overflowY: 'auto',
        overflowX: 'hidden',
        '&::-webkit-scrollbar': {
          width: '4px',
        },
        '&::-webkit-scrollbar-track': {
          background: '#f1f1f1',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#c1c1c1',
          borderRadius: '4px',
          '&:hover': {
            background: '#a1a1a1',
          },
        },
      }}
    >
      <List sx={{ width: '100%' }}>
        {menuItems.map(renderItem)}
      </List>

      {/* Settings pinned to the bottom, separate from the main nav list */}
      <List sx={{ width: '100%' }}>
        {renderItem({ label: t('nav.settings'), icon: <SettingsIcon />, path: '/settings' })}
      </List>
    </Box>
  );
};

export default Sidebar;

