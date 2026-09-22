
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from '@/components/Notifier';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Paper,
  Typography,
  TextField,
  Grid,
  FormControlLabel,
  Switch,
  MenuItem,
  CircularProgress,
  Alert,
  Stack,
} from '@mui/material';
import { Save as SaveIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { DatePicker } from '@/components/DatePicker';
import dayjs from 'dayjs';
import {useMembers} from "@/hooks";
import {MemberFormData} from "@/types/members.ts";
import membersApi from "@/api/members.ts";

const MemberForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const { createMember, updateMember } = useMembers();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<MemberFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    birth_date: null,
    address: '',
    join_date: dayjs().format('YYYY-MM-DD'),
    status: 'active',
    payer_type: 'individual',
    is_founder: false,
    notes: '',
  });

  useEffect(() => {
    if (isEdit && id) {
      fetchMember(parseInt(id));
    }
  }, [id]);

  const fetchMember = async (memberId: number) => {
    try {
      const member = await membersApi.getMember(memberId);
      setFormData({
        first_name: member.first_name,
        last_name: member.last_name,
        email: member.email,
        phone: member.phone || '',
        birth_date: member.birth_date,
        address: member.address || '',
        join_date: member.join_date,
        status: member.status,
        payer_type: member.payer_type,
        is_founder: member.is_founder,
        notes: member.notes || '',
      });
    } catch (error) {
      console.error('Error fetching member:', error);
      setError('Помилка завантаження даних члена');
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (field: keyof MemberFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isEdit && id) {
        await updateMember(parseInt(id), formData);
        toast.success(t('members.updateSuccess'));
      } else {
        await createMember(formData);
        toast.success(t('members.createSuccess'));
      }
      navigate('/members');
    } catch (error: any) {
      const message = error.response?.data?.error || t('members.saveError');
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }
  console.log('FORM DATA:', formData);
console.log('PAYER TYPE:', formData.payer_type);
  return (
    <Box sx={{ p: 3 }}>
      {/*Title*/}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/members')}
        >
          {t('common.back')}
        </Button>
        <Typography variant="h4" component="h1">
          {isEdit ? t('members.editMember') : t('members.addMember')}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 8 }}>
              <TextField
                label={t('members.firstName')}
                required
                fullWidth
                value={formData.first_name}
                onChange={(e) => handleChange('first_name', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label={t('members.lastName')}
                required
                fullWidth
                value={formData.last_name}
                onChange={(e) => handleChange('last_name', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label={t('members.email')}
                required
                type="email"
                fullWidth
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label={t('members.phone')}
                fullWidth
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                {t('members.birthDate')}
              </Typography>
              <DatePicker
                value={formData.birth_date}
                onChange={(value) => handleChange('birth_date', value)}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                {t('members.joinedDate')}
              </Typography>
              <DatePicker
                value={formData.join_date}
                onChange={(value) => handleChange('join_date', value ?? '')}
              />
            </Grid>
            <Grid size={{ xs: 12}}>
              <TextField
                label={t('members.address')}
                fullWidth
                multiline
                rows={2}
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                select
                label={t('members.status')}
                required
                fullWidth
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
              >
                <MenuItem value="active">{t('members.statusActive')}</MenuItem>
                <MenuItem value="inactive">{t('members.statusInactive')}</MenuItem>
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                select
                label={t('members.payerType')}
                required
                fullWidth
                value={formData.payer_type}
                onChange={(e) => handleChange('payer_type', e.target.value)}
              >
                <MenuItem value="individual">{t('members.payerTypeIndividual')}</MenuItem>
                <MenuItem value="company">{t('members.payerTypeCompany')}</MenuItem>
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_founder}
                    onChange={(e) => handleChange('is_founder', e.target.checked)}
                    color="warning"
                  />
                }
                label={t('members.isFounder')}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                label={t('members.notes')}
                fullWidth
                multiline
                rows={3}
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
              />
            </Grid>
          </Grid>

          <Stack direction="row" spacing={2} sx={{ mt: 3, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/members')}
              disabled={loading}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={loading}
            >
              {loading ? t('common.saving') : t('common.save')}
            </Button>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
};

export default MemberForm;