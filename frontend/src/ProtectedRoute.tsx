
import React from 'react';
import { Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from './AuthContext';
import {tokens} from "@/pages/components/theme.ts";


const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { username, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress sx={{ color: tokens.registry }} />
      </Box>
    );
  }

  if (!username) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;