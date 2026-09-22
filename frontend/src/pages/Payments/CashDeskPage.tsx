
import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TableSortLabel,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Stack,
  InputAdornment,
  Grid,
  Autocomplete,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText,
} from '@mui/material';

import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FileDownload as FileDownloadIcon,
  TableView as TableViewIcon,
  PictureAsPdf as PictureAsPdfIcon,
  AccountBalanceWallet as WalletIcon,
  TrendingUp as TrendingUpIcon,
  Groups as GroupsIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';

import { paymentsApi } from '@/api/payments';
import { apiFetch } from '@/api/client';
import { toast } from '@/components/Notifier';
import {
  Payment,
  PaymentFormData,
  PaymentType,
  PayerType,
  PAYMENT_TYPE_LABELS,
  PAYER_TYPE_LABELS,
} from '@/types/payments';
import { DateField } from "./DateField";

interface MemberShort {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

type CashDeskFormData = PaymentFormData & {
  member_obj?: MemberShort | null;
};

const emptyUniversalForm = (): CashDeskFormData => ({
  member: null,
  member_obj: null,
  amount: '',
  date: dayjs().format('YYYY-MM-DD'),
  type: 'membership_fee',
  payer_type: 'individual',
  source_name: '',
  period: `${dayjs().year()}`,
  comment: '',
});

export const CashDeskPage: React.FC = () => {
  const { t } = useTranslation();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [members, setMembers] = useState<MemberShort[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [payerTypeFilter, setPayerTypeFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CashDeskFormData>(emptyUniversalForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Payment | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const paymentsData = await paymentsApi.getPayments();
      setPayments(paymentsData);

      const res = await apiFetch('/api/members/');
      if (res.ok) {
        const membersData = await res.json();
        setMembers(membersData);
      }
    } catch (err) {
      console.error('Error loading cash desk data:', err);
      const errMsg = t('cashDesk.loadError', 'Помилка завантаження даних каси');
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // 1. Create a quick dictionary of members of the organization for instant search by ID
  const membersMap = useMemo(() => {
    return new Map(members.map((m) => [m.id, m]));
  }, [members]);

  // 2. Smart and safe filtration
  const filteredPayments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return payments
      .filter((p) => (typeFilter === 'all' ? true : p.type === typeFilter))
      .filter((p) => (payerTypeFilter === 'all' ? true : p.payer_type === payerTypeFilter))
      .filter((p) => {
        if (!q) return true;

        // Name of the member of the organization (from the object or through the dictionary by ID)
        const memberObj = p.member ? membersMap.get(p.member) : null;
        const memberFullName = memberObj
          ? `${memberObj.last_name} ${memberObj.first_name} ${memberObj.email}`.toLowerCase()
          : (p.member_name || '').toLowerCase();

        // Source / Fund
        const source = (p.source_name || '').toLowerCase();

        // Period & Comment
        const period = String(p.period || '').toLowerCase();
        const comment = (p.comment || '').toLowerCase();

        // Amount (safe line break)
        const amountStr = String(p.amount ?? '');

        // Dates (ISO and DD.MM.YYYY)
        const dateRaw = String(p.date || '');
        const dateFormatted = dayjs(p.date).format('DD.MM.YYYY');

        // Translated names of payment types and payer
        const typeTranslated = t(`payments.types.${p.type}`, p.type || '').toLowerCase();
        const payerTypeTranslated = t(`payments.payerTypes.${p.payer_type}`, p.payer_type || '').toLowerCase();

        return (
          memberFullName.includes(q) ||
          source.includes(q) ||
          period.includes(q) ||
          comment.includes(q) ||
          amountStr.includes(q) ||
          dateRaw.includes(q) ||
          dateFormatted.includes(q) ||
          typeTranslated.includes(q) ||
          payerTypeTranslated.includes(q)
        );
      })
      .sort((a, b) => {
        const diff = dayjs(a.date).valueOf() - dayjs(b.date).valueOf();
        return sortOrder === 'asc' ? diff : -diff;
      });
  }, [payments, membersMap, typeFilter, payerTypeFilter, searchQuery, sortOrder, t]);

  const stats = useMemo(() => {
    const total = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const individualTotal = payments
      .filter((p) => p.payer_type === 'individual')
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const companyTotal = payments
      .filter((p) => p.payer_type === 'company')
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const count = payments.length;
    return { total, individualTotal, companyTotal, count };
  }, [payments]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm(emptyUniversalForm());
    setFormError(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (payment: Payment) => {
    setEditingId(payment.id);
    const memberObj = payment.member
      ? members.find((m) => m.id === payment.member) || null
      : null;

    setForm({
      member: payment.member || null,
      member_obj: memberObj,
      amount: String(payment.amount),
      date: payment.date,
      type: payment.type,
      payer_type: payment.payer_type,
      source_name: payment.source_name || '',
      period: payment.period || '',
      comment: payment.comment || '',
    });
    setFormError(null);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.amount || Number(form.amount) <= 0) {
      const msg = t('payments.validation.amountRequired', 'Вкажіть суму більше нуля');
      setFormError(msg);
      toast.warning(msg);
      return;
    }

    if (form.type === 'membership_fee' && !form.member) {
      const msg = t('cashDesk.validation.memberRequired', 'Оберіть члена організації для членського внеску');
      setFormError(msg);
      toast.warning(msg);
      return;
    }

    if (form.type !== 'membership_fee' && !form.source_name.trim()) {
      const msg = t('cashDesk.validation.sourceRequired', 'Вкажіть назву джерела / організації / фонду');
      setFormError(msg);
      toast.warning(msg);
      return;
    }

    setSaving(true);
    setFormError(null);

    const payload: PaymentFormData = {
      amount: form.amount,
      date: form.date,
      type: form.type,
      payer_type: form.payer_type,
      comment: form.comment || '',
      member: form.type === 'membership_fee' ? form.member : null,
      source_name: form.type !== 'membership_fee' ? form.source_name : '',
      period: form.period || '',
    };

    try {
      if (editingId) {
        await paymentsApi.updatePayment(editingId, payload);
        toast.success(t('payments.messages.updateSuccess', 'Платіж успішно оновлено'));
      } else {
        await paymentsApi.createPayment(payload);
        toast.success(t('payments.messages.createSuccess', 'Надходження успішно додано'));
      }

      setDialogOpen(false);
      const updated = await paymentsApi.getPayments();
      setPayments(updated);
    } catch (err: any) {
      console.error('Save payment error:', err);
      let msg = t('payments.messages.saveError', 'Помилка збереження');
      if (err.response?.data) {
        const d = err.response.data;
        msg = typeof d === 'string' ? d : d.detail || Object.values(d).flat().join(' ');
      }
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await paymentsApi.deletePayment(deleteTarget.id);
      setPayments((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      toast.success(t('payments.messages.deleteSuccess', 'Платіж успішно видалено'));
      setDeleteTarget(null);
    } catch (err) {
      console.error('Delete error:', err);
      toast.error(t('payments.messages.deleteError', 'Не вдалося видалити платіж'));
    } finally {
      setDeleting(false);
    }
  };

  const exportCSV = () => {
    setExportAnchorEl(null);
    if (!filteredPayments.length) return;

    try {
      const headers = [
        t('payments.fields.date', 'Дата'),
        t('payments.fields.type', 'Тип'),
        t('cashDesk.payerOrSource', 'Платник / Джерело'),
        t('payments.fields.payerType', 'Тип платника'),
        t('payments.fields.period', 'Період'),
        t('payments.fields.amount', 'Сума (€)'),
        t('payments.fields.comment', 'Коментар'),
      ];

      const rows = filteredPayments.map((p) => [
        `"${p.date}"`,
        `"${t(`payments.types.${p.type}`, p.type)}"`,
        `"${p.member_name || p.source_name || '—'}"`,
        `"${t(`payments.payerTypes.${p.payer_type}`, p.payer_type)}"`,
        `"${p.period || '—'}"`,
        `"${p.amount}"`,
        `"${(p.comment || '').replace(/"/g, '""')}"`,
      ]);

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `cash_desk_${dayjs().format('YYYY-MM-DD')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(t('common.exportSuccess', 'Файл CSV успішно завантажено'));
    } catch {
      toast.error(t('common.exportError', 'Помилка експорту у CSV'));
    }
  };

  const exportPDF = () => {
    setExportAnchorEl(null);
    if (!filteredPayments.length) return;

    const win = window.open('', '_blank');
    if (!win) {
      toast.warning(t('common.popupBlocked', 'Дозвольте спливаючі вікна для друку PDF'));
      return;
    }

    win.document.write(`
      <html>
        <head>
          <title>${t('cashDesk.title', 'Каса та надходження')} - ${dayjs().format('DD.MM.YYYY')}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #1a1a1a; }
            h2 { margin-bottom: 4px; }
            .meta { color: #666; font-size: 13px; margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px 10px; text-align: left; }
            th { background-color: #f4f6f8; font-weight: bold; }
            tr:nth-child(even) { background-color: #fafafa; }
            .amount { text-align: right; font-weight: bold; }
            @media print { @page { size: landscape; margin: 10mm; } }
          </style>
        </head>
        <body>
          <h2>${t('cashDesk.title', 'Каса та журнал надходжень')}</h2>
          <div class="meta">${t('common.total', 'Всього записів')}: ${filteredPayments.length} | ${t('financeOverview.totalIncomes', 'Всього отримано')}: ${stats.total.toFixed(2)} € | ${dayjs().format('DD.MM.YYYY HH:mm')}</div>
          <table>
            <thead>
              <tr>
                <th>${t('payments.fields.date', 'Дата')}</th>
                <th>${t('payments.fields.type', 'Тип')}</th>
                <th>${t('cashDesk.payerOrSource', 'Платник / Джерело')}</th>
                <th>${t('payments.fields.payerType', 'Тип платника')}</th>
                <th>${t('payments.fields.period', 'Період')}</th>
                <th class="amount">${t('payments.fields.amount', 'Сума')}</th>
              </tr>
            </thead>
            <tbody>
              ${filteredPayments
                .map(
                  (p) => `
                <tr>
                  <td>${dayjs(p.date).format('DD.MM.YYYY')}</td>
                  <td>${t(`payments.types.${p.type}`, p.type)}</td>
                  <td>${p.member_name || p.source_name || '—'}</td>
                  <td>${t(`payments.payerTypes.${p.payer_type}`, p.payer_type)}</td>
                  <td>${p.period || '—'}</td>
                  <td class="amount">${Number(p.amount).toFixed(2)} €</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
          <script>
            window.onload = () => { window.print(); window.onafterprint = () => window.close(); };
          </script>
        </body>
      </html>
    `);
    win.document.close();
    toast.info(t('common.printReady', 'Вікно друку PDF відкрито'));
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 4 }, py: 4 }}>
      {/* 1. Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3.5,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon sx={{ fontSize: '1.6rem !important' }} />}
            onClick={handleOpenCreate}
            sx={{
              py: 1.5,
              px: 3.5,
              fontSize: '1.05rem',
              fontWeight: 700,
              borderRadius: 2.5,
              boxShadow: 3,
              textTransform: 'none',
              letterSpacing: '0.02em',
              bgcolor: 'primary.main',
              '&:hover': {
                bgcolor: 'primary.dark',
                boxShadow: 5,
              },
            }}
          >
            {t('cashDesk.addIncome', '+ Додати надходження')}
          </Button>

          <Box sx={{ ml: { xs: 0, md: 4 } }}>
            <Typography
              variant="overline"
              sx={{ color: 'text.secondary', letterSpacing: '0.1em', display: 'block', lineHeight: 1.2 }}
            >
              {t('cashDesk.subtitle', 'Фінансовий облік')}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
              {t('cashDesk.title', 'Каса та журнал надходжень')}
            </Typography>
          </Box>
        </Box>

        <Box>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={(e) => setExportAnchorEl(e.currentTarget)}
            disabled={filteredPayments.length === 0}
            sx={{ borderRadius: 2, px: 2, py: 1 }}
          >
            {t('common.export', 'Експорт')}
          </Button>

          <Menu
            anchorEl={exportAnchorEl}
            open={Boolean(exportAnchorEl)}
            onClose={() => setExportAnchorEl(null)}
          >
            <MenuItem onClick={exportCSV}>
              <ListItemIcon><TableViewIcon fontSize="small" /></ListItemIcon>
              <ListItemText>{t('common.exportCSV', 'Експорт у CSV (Excel)')}</ListItemText>
            </MenuItem>
            <MenuItem onClick={exportPDF}>
              <ListItemIcon><PictureAsPdfIcon fontSize="small" /></ListItemIcon>
              <ListItemText>{t('common.exportPDF', 'Експорт у PDF')}</ListItemText>
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      {/* 2. KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
            <WalletIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            <Box>
              <Typography variant="caption" color="text.secondary">
                {t('financeOverview.totalIncomes', 'Загальна каса')}
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {stats.total.toFixed(2)} €
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
            <GroupsIcon sx={{ fontSize: 40, color: 'info.main' }} />
            <Box>
              <Typography variant="caption" color="text.secondary">
                {t('financeOverview.payerBreakdown', 'Фіз. особи / Підприємства')}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {stats.individualTotal.toFixed(2)} € / {stats.companyTotal.toFixed(2)} €
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
            <TrendingUpIcon sx={{ fontSize: 40, color: 'success.main' }} />
            <Box>
              <Typography variant="caption" color="text.secondary">
                {t('cashDesk.totalTransactions', 'Всього транзакцій')}
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {stats.count}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* 3. Filters */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 2,
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <TextField
            size="small"
            placeholder={t('cashDesk.searchPlaceholder', 'Пошук за платником, джерелом, періодом...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ width: { xs: '100%', md: 380 } }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              },
            }}
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ width: { xs: '100%', md: 'auto' } }}>
            <TextField
              select
              size="small"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              sx={{ minWidth: 160 }}
              label={t('payments.fields.type', 'Тип')}
            >
              <MenuItem value="all">{t('common.all', 'Всі типи')}</MenuItem>
              {(Object.keys(PAYMENT_TYPE_LABELS) as PaymentType[]).map((type) => (
                <MenuItem key={type} value={type}>
                  {t(`payments.types.${type}`, PAYMENT_TYPE_LABELS[type])}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              size="small"
              value={payerTypeFilter}
              onChange={(e) => setPayerTypeFilter(e.target.value)}
              sx={{ minWidth: 160 }}
              label={t('payments.fields.payerType', 'Платник')}
            >
              <MenuItem value="all">{t('common.all', 'Всі')}</MenuItem>
              {(Object.keys(PAYER_TYPE_LABELS) as PayerType[]).map((pt) => (
                <MenuItem key={pt} value={pt}>
                  {t(`payments.payerTypes.${pt}`, PAYER_TYPE_LABELS[pt])}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </Box>
      </Paper>

      {/* 4. Table */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        ) : filteredPayments.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              {t('cashDesk.emptyTitle', 'Записів не знайдено')}
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate} sx={{ mt: 1 }}>
              {t('cashDesk.addFirstIncome', 'Додати перший платіж')}
            </Button>
          </Box>
        ) : (
          <TableContainer sx={{ maxHeight: 520 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sortDirection={sortOrder} sx={{ fontWeight: 600 }}>
                    <TableSortLabel
                      active
                      direction={sortOrder}
                      onClick={() => setSortOrder((p) => (p === 'asc' ? 'desc' : 'asc'))}
                    >
                      {t('payments.fields.date', 'Дата')}
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t('payments.fields.type', 'Тип')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t('cashDesk.payerOrSource', 'Платник / Джерело')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t('payments.fields.payerType', 'Тип платника')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t('payments.fields.period', 'Період')}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>{t('payments.fields.amount', 'Сума')}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>{t('common.actions', 'Дії')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPayments.map((p) => (
                  <TableRow key={p.id} hover>
                    <TableCell>{dayjs(p.date).format('DD.MM.YYYY')}</TableCell>
                    <TableCell>
                      <Chip
                        label={t(`payments.types.${p.type}`, p.type_display || '')}
                        size="small"
                        variant="outlined"
                        color={p.type === 'membership_fee' ? 'primary' : 'default'}
                      />
                    </TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>
                        {p.member ? (
                          (() => {
                            const m = membersMap.get(p.member);
                            return (
                              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                <span>{m ? `${m.last_name} ${m.first_name}` : p.member_name || `ID #${p.member}`}</span>
                                {m?.email && <Typography variant="caption" color="text.secondary">{m.email}</Typography>}
                              </Box>
                            );
                          })()
                        ) : (
                          <Box sx={{ fontStyle: p.source_name ? 'normal' : 'italic', color: p.source_name ? 'text.primary' : 'text.disabled' }}>
                            {p.source_name || '—'}
                          </Box>
                        )}
                      </TableCell>
                    <TableCell>
                      <Chip
                        label={t(`payments.payerTypes.${p.payer_type}`, p.payer_type_display || '')}
                        size="small"
                        variant="outlined"
                        color={p.payer_type === 'company' ? 'info' : 'default'}
                      />
                    </TableCell>
                    <TableCell>{p.period || '—'}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
                      {Number(p.amount).toFixed(2)} €
                    </TableCell>
                     <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                       <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
                         <Tooltip title={t('common.edit', 'Редагувати')}>
                           <IconButton size="small" onClick={() => handleOpenEdit(p)}>
                             <EditIcon fontSize="small" />
                           </IconButton>
                         </Tooltip>
                         <Tooltip title={t('common.delete', 'Видалити')}>
                           <IconButton
                             size="small"
                             color="error"
                             onClick={() => setDeleteTarget(p)}
                           >
                             <DeleteIcon fontSize="small" />
                           </IconButton>
                         </Tooltip>
                       </Stack>
                     </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/*5. UNIVERSAL MODAL FOR ADDING / EDITING*/}
      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>
          {editingId
            ? t('cashDesk.dialog.editTitle', 'Редагувати надходження')
            : t('cashDesk.dialog.addTitle', 'Нове фінансове надходження')}
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            {formError && <Alert severity="error">{formError}</Alert>}

            <TextField
              select
              label={t('payments.fields.type', 'Тип надходження')}
              value={form.type}
              onChange={(e) => {
                const newType = e.target.value as PaymentType;
                setForm({
                  ...form,
                  type: newType,
                  member: newType === 'membership_fee' ? form.member : null,
                  member_obj: newType === 'membership_fee' ? form.member_obj : null,
                  source_name: newType !== 'membership_fee' ? form.source_name : '',
                });
              }}
              fullWidth
            >
              {(Object.keys(PAYMENT_TYPE_LABELS) as PaymentType[]).map((type) => (
                <MenuItem key={type} value={type}>
                  {t(`payments.types.${type}`, PAYMENT_TYPE_LABELS[type])}
                </MenuItem>
              ))}
            </TextField>

            {form.type === 'membership_fee' ? (
              <Autocomplete
                options={members}
                getOptionLabel={(option) => `${option.last_name} ${option.first_name} (${option.email})`}
                value={form.member_obj || null}
                onChange={(_, value) => {
                  setForm({
                    ...form,
                    member: value ? value.id : null,
                    member_obj: value,
                  });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t('cashDesk.fields.selectMember', 'Член організації *')}
                    placeholder={t('cashDesk.fields.searchMemberPlaceholder', 'Почніть вводити прізвище або email...')}
                    fullWidth
                  />
                )}
              />
            ) : (
              <TextField
                label={t('payments.fields.sourceName', 'Назва джерела / фонду / спонсора *')}
                placeholder={t('cashDesk.fields.sourcePlaceholder', 'Наприклад: Фонд Відродження, Донат від громади')}
                value={form.source_name || ''}
                onChange={(e) => setForm({ ...form, source_name: e.target.value })}
                fullWidth
                autoFocus
              />
            )}

            <TextField
              label={t('payments.fields.period', 'Період ')}
              placeholder={`${dayjs().year()} або ${dayjs().year()}-Q1`}
              value={form.period || ''}
              onChange={(e) => setForm({ ...form, period: e.target.value })}
              fullWidth
            />

            <TextField
              select
              label={t('payments.fields.payerType', 'Тип платника')}
              value={form.payer_type}
              onChange={(e) => setForm({ ...form, payer_type: e.target.value as PayerType })}
              fullWidth
            >
              {(Object.keys(PAYER_TYPE_LABELS) as PayerType[]).map((pt) => (
                <MenuItem key={pt} value={pt}>
                  {t(`payments.payerTypes.${pt}`, PAYER_TYPE_LABELS[pt])}
                </MenuItem>
              ))}
            </TextField>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                  sx={{ flex: 1 }}
                label={t('payments.fields.amount', 'Сума *')}
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                slotProps={{
                  input: {
                    endAdornment: <InputAdornment position="end">€</InputAdornment>,
                  },
                }}
                fullWidth
              />

             <Box sx={{ flex: 1, minWidth: 0 }}>

               <DateField
                 label={t('payments.fields.date', 'Дата *')}
                 value={form.date}
                 onChange={(value) => setForm({ ...form, date: value ?? form.date })}
               />
             </Box>
            </Stack>

            <TextField
              label={t('payments.fields.comment', 'Коментар')}
              value={form.comment || ''}
              onChange={(e) => setForm({ ...form, comment: e.target.value })}
              multiline
              minRows={2}
              fullWidth
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>
            {t('common.cancel', 'Скасувати')}
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}>
            {saving ? <CircularProgress size={20} /> : t('common.save', 'Зберегти')}
          </Button>
        </DialogActions>
      </Dialog>

      {/*6. DELETION CONFIRMATION MODAL*/}
      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => !deleting && setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          {t('payments.dialogs.confirmDeleteTitle', 'Видалити платіж?')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deleteTarget && (
              <>
                {t('payments.dialogs.confirmDeleteText', 'Ви впевнені, що хочете видалити цей платіж на суму')}{' '}
                <b>{Number(deleteTarget.amount).toFixed(2)} €</b> (
                {deleteTarget.member_name || deleteTarget.source_name || deleteTarget.type})?
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>
            {t('common.cancel', 'Скасувати')}
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={deleting}
          >
            {deleting ? <CircularProgress size={20} color="inherit" /> : t('common.delete', 'Видалити')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CashDeskPage;