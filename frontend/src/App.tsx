
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';


import { AuthProvider } from '@/AuthContext';
import ProtectedRoute from '@/ProtectedRoute';
import Login from '@/Login';
import Home from '@/Home';

import MemberList from './pages/MemberList';
import MemberDetail from './pages/MemberDetail';
import MemberForm from './pages/MemberForm';
import Layout from '@/pages/components/Layout';
import theme from "@/pages/components/theme.ts";
import Preferences from './pages/Preferences.tsx';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />

              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Home />} />
                <Route path="members" element={<MemberList />} />
                <Route path="members/add" element={<MemberForm />} />
                <Route path="members/:id" element={<MemberDetail />} />
                <Route path="members/:id/edit" element={<MemberForm />} />
                <Route path="settings" element={<Preferences />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;