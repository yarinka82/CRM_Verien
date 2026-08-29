
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider,
  FormControlLabel,
  Checkbox,
  IconButton,
  InputAdornment,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { apiFetch } from '@/apiClient';
import { useAuth } from '@/AuthContext';
import { tokens } from "@/pages/components/theme.ts";

interface AppUser {
  id: number;
  username: string;
  email: string;
  is_staff: boolean;
  is_active: boolean;
  date_joined: string;
}

// ---- Компонент для поля пароля с глазиком ----
const PasswordField: React.FC<{
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  size?: 'small' | 'medium';
  autoFocus?: boolean;
  required?: boolean;
}> = ({ label, value, onChange, size = 'small', autoFocus = false, required = false }) => {
  const [showPassword, setShowPassword] = useState(false);

  const handleClickShowPassword = () => setShowPassword(!showPassword);

  return (
    <TextField
      type={showPassword ? 'text' : 'password'}
      label={label}
      value={value}
      onChange={onChange}
      size={size}
      autoFocus={autoFocus}
      required={required}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label="toggle password visibility"
                onClick={handleClickShowPassword}
                edge="end"
                size="small"
              >
                {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
};

const Settings: React.FC = () => {
  const { t } = useTranslation();
  const { isStaff } = useAuth();

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', px: { xs: 2, md: 4 }, py: 4 }}>
      <Typography
        variant="overline"
        sx={{ color: tokens.muted, fontFamily: '"IBM Plex Mono", monospace', letterSpacing: '0.12em' }}
      >
        {t('settings.title')}
      </Typography>
      <Typography variant="h4" sx={{ color: tokens.ink, mb: 4 }}>
        {t('settings.subtitle')}
      </Typography>

      <ChangePasswordSection />

      {isStaff && (
        <>
          <Divider sx={{ my: 5, borderColor: tokens.divider }} />
          <UserManagementSection />
        </>
      )}
    </Box>
  );
};

// ---- Self-service password change ----
const ChangePasswordSection: React.FC = () => {
  const { t } = useTranslation();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError(t('settings.passwordMismatch'));
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch('/api/auth/change-password/', {
        method: 'POST',
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const message =
          data.old_password?.[0] ||
          data.new_password?.[0] ||
          data.detail ||
          t('settings.passwordChangeError');
        throw new Error(message);
      }
      setSuccess(true);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('settings.passwordChangeError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Paper variant="outlined" sx={{ borderColor: tokens.divider, bgcolor: tokens.paperElevated, p: 3 }}>
      <Typography variant="h6" sx={{ color: tokens.ink, mb: 2 }}>
        {t('settings.changePassword')}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{t('settings.passwordUpdated')}</Alert>}

      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 360 }}>
        <PasswordField
          label={t('settings.currentPassword')}
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
        />
        <PasswordField
          label={t('settings.newPassword')}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <PasswordField
          label={t('settings.confirmNewPassword')}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <Button
          type="submit"
          variant="contained"
          disabled={submitting}
          sx={{ alignSelf: 'flex-start', bgcolor: tokens.registry, '&:hover': { bgcolor: tokens.registryDark } }}
        >
          {submitting ? t('common.saving') : t('common.save')}
        </Button>
      </Box>
    </Paper>
  );
};

// ---- User management (staff only) ----
const UserManagementSection: React.FC = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const loadUsers = () => {
    setLoading(true);
    setLoadError(null);
    apiFetch('/api/users/')
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || !Array.isArray(data)) {
          throw new Error(t('settings.unexpectedResponse'));
        }
        setUsers(data);
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : t('settings.loadUsersError')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ color: tokens.ink }}>
          {t('settings.systemUsers')}
        </Typography>
        <Button
          startIcon={<PersonAddIcon />}
          variant="outlined"
          size="small"
          onClick={() => setDialogOpen(true)}
        >
          {t('settings.addUser')}
        </Button>
      </Box>

      {loadError && <Alert severity="error" sx={{ mb: 2 }}>{loadError}</Alert>}

      <Paper variant="outlined" sx={{ borderColor: tokens.divider, bgcolor: tokens.paperElevated, overflow: 'hidden' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t('settings.username')}</TableCell>
              <TableCell>{t('settings.email')}</TableCell>
              <TableCell>{t('settings.role')}</TableCell>
              <TableCell>{t('settings.status')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading && users.map((u) => (
              <TableRow key={u.id}>
                <TableCell sx={{ fontWeight: 500 }}>{u.username}</TableCell>
                <TableCell sx={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '0.85rem' }}>
                  {u.email || '—'}
                </TableCell>
                <TableCell>
                  {u.is_staff ? (
                    <Chip label={t('settings.admin')} size="small" sx={{ bgcolor: 'rgba(184,134,59,0.15)', color: tokens.sealGold }} />
                  ) : (
                    <Chip label={t('settings.user')} size="small" sx={{ bgcolor: 'rgba(154,165,160,0.15)', color: tokens.muted }} />
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={u.is_active ? t('settings.active') : t('settings.inactive')}
                    size="small"
                    sx={{
                      bgcolor: u.is_active ? 'rgba(47,111,94,0.12)' : 'rgba(164,74,63,0.12)',
                      color: u.is_active ? tokens.registryDark : tokens.danger,
                    }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <AddUserDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={() => {
          setDialogOpen(false);
          loadUsers();
        }}
      />
    </Box>
  );
};

const AddUserDialog: React.FC<{ open: boolean; onClose: () => void; onCreated: () => void }> = ({
  open,
  onClose,
  onCreated,
}) => {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isStaffFlag, setIsStaffFlag] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await apiFetch('/api/users/', {
        method: 'POST',
        body: JSON.stringify({ username, email, password, is_staff: isStaffFlag }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const message =
          data.username?.[0] || data.password?.[0] || data.email?.[0] || data.detail || t('settings.createUserError');
        throw new Error(message);
      }
      setUsername('');
      setEmail('');
      setPassword('');
      setIsStaffFlag(false);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('settings.createUserError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogTitle sx={{ color: tokens.ink }}>{t('settings.newUser')}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label={t('settings.username')}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            size="small"
            required
            autoFocus
          />
          <TextField
            label={t('settings.email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            size="small"
          />
          <PasswordField
            label={t('settings.password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <FormControlLabel
            control={<Checkbox checked={isStaffFlag} onChange={(e) => setIsStaffFlag(e.target.checked)} />}
            label={t('settings.adminLabel')}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting}
            sx={{ bgcolor: tokens.registry, '&:hover': { bgcolor: tokens.registryDark } }}
          >
            {submitting ? t('common.creating') : t('common.create')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default Settings;