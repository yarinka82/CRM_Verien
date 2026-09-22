
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { MainLayout } from './layouts';
import Notifier from '@/components/Notifier';
import { Home, Login, MemberList, MemberDetail, MemberForm, Settings, FinanceOverview, CashDeskPage} from './pages';
import { ExpensesPage, DocumentsPage  } from './pages';
import ProtectedRoute from './ProtectedRoute';

function App() {
  return (
    <AuthProvider>

      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <>
        <Notifier />
          <Routes>
            {/*Public routes*/}
            <Route path="/login" element={<Login />} />

            {/*Protected routes*/}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/home" replace />} />
              <Route path="home" element={<Home />} />
              <Route path="members" element={<MemberList />} />
              <Route path="members/add" element={<MemberForm />} />
              <Route path="members/:id" element={<MemberDetail />} />
              <Route path="members/:id/edit" element={<MemberForm />} />
              <Route path="cashdesk" element={<CashDeskPage />} />
              <Route path="finance" element={<FinanceOverview />} />
              <Route path="documents" element={<DocumentsPage />} />
              <Route path="expenses" element={<ExpensesPage />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </>
      </BrowserRouter>

    </AuthProvider>
  );
}

export default App;