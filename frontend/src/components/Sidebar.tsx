
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

// Icons
import HomeIcon from '@mui/icons-material/Home';
import GroupIcon from '@mui/icons-material/Group';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TableChartIcon from '@mui/icons-material/TableChart';
import DescriptionIcon from '@mui/icons-material/Description';
import SettingsIcon from '@mui/icons-material/Settings';

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const menuItems = [
    {
      label: t('nav.home', 'Головна'),
      icon: <HomeIcon />,
      path: '/'
    },
    {
      label: t('nav.members', 'Реєстр членів'),
      icon: <GroupIcon />,
      path: '/members'
    },
    {
      label: t('nav.cashDesk', 'Каса та надходження'),
      icon: <AccountBalanceWalletIcon />,
      path: '/cashdesk'
    },
    {
      label: t('nav.financeAnalytics', 'Фінансовий огляд'),
      icon: <TableChartIcon />,
      path: '/finance'
    },
    {
      label: t('nav.documents', 'Документи'),
      icon: <DescriptionIcon />,
      path: '/documents'
    },
  ];

  const renderItem = (item: { label: string; icon: React.ReactNode; path: string }) => (
    <ListItem disablePadding key={item.path} sx={{ mb: 1.5, justifyContent: 'center' }}>
      <Tooltip title={item.label} placement="right" arrow>
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
              '&:hover': {
                bgcolor: 'primary.dark',
              },
            },
            '&:hover': {
              bgcolor: 'action.hover',
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
      }}
    >
      <List sx={{ width: '100%', p: 0 }}>
        {menuItems.map(renderItem)}
      </List>

      <List sx={{ width: '100%', p: 0 }}>
        {renderItem({
          label: t('nav.settings', 'Налаштування'),
          icon: <SettingsIcon />,
          path: '/settings'
        })}
      </List>
    </Box>
  );
};

export default Sidebar;

