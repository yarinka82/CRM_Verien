
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import dayjs, { Dayjs } from 'dayjs';
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
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Stack,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
  Grid,
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { DatePicker } from '@/components/DatePicker';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';

import { expensesApi } from '@/api/expenses';
import { toast } from '@/components/Notifier';
import type { Expense, ExpenseFormData } from '@/types/expenses';

type PeriodMode = 'month' | 'year';



const emptyForm = (): ExpenseFormData => ({
  title: '',
  amount: '',
  date: dayjs().format('YYYY-MM-DD'),
});

const ExpensesPage: React.FC = () => {
  const { t, i18n } = useTranslation();

  const [searchParams] = useSearchParams();
  const modeParam = searchParams.get('mode');
  const dateParam = searchParams.get('date');

  const [periodMode, setPeriodMode] = useState<PeriodMode>(
    modeParam === 'year' || modeParam === 'month' ? modeParam : 'month'
  );


  const [currentDate, setCurrentDate] = useState<Dayjs>(
    dateParam && dayjs(dateParam).isValid() ? dayjs(dateParam) : dayjs()
  );

  const EXPENSE_SUGGESTIONS = [
    t('expenses.suggestions.rent', 'Оренда приміщення'),
    t('expenses.suggestions.utilities', 'Комунальні послуги'),
    t('expenses.suggestions.goods', 'Придбання продукції / товарів'),
    t('expenses.suggestions.stationery', 'Канцелярські товари'),
    t('expenses.suggestions.logistics', 'Транспортні / логістичні витрати'),
    t('expenses.suggestions.bank', 'Банківське обслуговування'),
    t('expenses.suggestions.services', 'Оплата послуг підрядників'),
    t('expenses.suggestions.household', 'Господарські витрати'),
  ];

  
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ExpenseFormData>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState(false);

  const formatAmount = useCallback(
    (value: number) => {
      const locale = i18n.language === 'de' ? 'de-DE' : i18n.language === 'en' ? 'en-US' : 'uk-UA';
      return new Intl.NumberFormat(locale, {
        style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2,
      }).format(value || 0);
    },
    [i18n.language]
  );

  const { dateFrom, dateTo, periodLabel } = useMemo(() => {
    const from = periodMode === 'month' ? currentDate.startOf('month') : currentDate.startOf('year');
    const to = periodMode === 'month' ? currentDate.endOf('month') : currentDate.endOf('year');

    const locale = i18n.language === 'de' ? 'de-DE' : i18n.language === 'en' ? 'en-US' : 'uk-UA';

    // 1. We receive a separate month in the desired language
    const month = currentDate.toDate().toLocaleDateString(locale, { month: 'long' });
    const year = currentDate.format('YYYY');

    // 2. Glue the month and year: "August 2026" / "September 2026"
    const monthString = `${month} ${year}`;

    const label = periodMode === 'month'
      ? monthString
      : `${year} ${t('financeOverview.yearSuffix', 'рік')}`;

    return {
      dateFrom: from.format('YYYY-MM-DD'),
      dateTo: to.format('YYYY-MM-DD'),
      periodLabel: label,
    };
  }, [periodMode, currentDate, t, i18n.language]);

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await expensesApi.getExpenses({ date_from: dateFrom, date_to: dateTo });
      setExpenses(data);
    } catch (err) {
      console.error('Error loading expenses:', err);
      const msg = t('expenses.loadError', 'Помилка завантаження витрат');
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, t]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const handlePrev = () => setCurrentDate((p) => p.subtract(1, periodMode));
  const handleNext = () => setCurrentDate((p) => p.add(1, periodMode));
  const handleToday = () => setCurrentDate(dayjs());

  const total = useMemo(
    () => expenses.reduce((sum, e) => sum + Number(e.amount), 0),
    [expenses]
  );

  const openCreateDialog = () => {
    setEditingId(null);
    setForm(emptyForm());
    setFormError(null);
    setDialogOpen(true);
  };

  const openEditDialog = (expense: Expense) => {
    setEditingId(expense.id);
    setForm({ title: expense.title, amount: String(expense.amount), date: expense.date });
    setFormError(null);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      const msg = t('expenses.validation.titleRequired', 'Вкажіть назву витрати');
      setFormError(msg);
      toast.warning(msg);
      return;
    }
    if (!form.amount || Number(form.amount) <= 0) {
      const msg = t('payments.validation.amountRequired', 'Вкажіть суму більше нуля');
      setFormError(msg);
      toast.warning(msg);
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      if (editingId) {
        await expensesApi.updateExpense(editingId, form);
        toast.success(t('expenses.updateSuccess', 'Витрату оновлено'));
      } else {
        await expensesApi.createExpense(form);
        toast.success(t('expenses.createSuccess', 'Витрату додано'));
      }
      setDialogOpen(false);
      await loadExpenses();
    } catch (err: any) {
      console.error('Error saving expense:', err);
      const msg = t('expenses.saveError', 'Помилка збереження витрати');
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
      await expensesApi.deleteExpense(deleteTarget.id);
      setExpenses((prev) => prev.filter((e) => e.id !== deleteTarget.id));
      toast.success(t('expenses.deleteSuccess', 'Витрату видалено'));
      setDeleteTarget(null);
    } catch (err) {
      console.error('Error deleting expense:', err);
      toast.error(t('expenses.deleteError', 'Не вдалося видалити витрату'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', px: { xs: 2, md: 4 }, py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="overline" sx={{ color: 'text.secondary', letterSpacing: '0.1em' }}>
            {t('expenses.subtitle', 'Облік витрат організації')}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            {t('expenses.title', 'Витрати')}
          </Typography>
        </Box>

        <ToggleButtonGroup
          value={periodMode}
          exclusive
          size="small"
          onChange={(_, val) => val && setPeriodMode(val)}
        >
          <ToggleButton value="month" sx={{ px: 2.5, fontWeight: 600 }}>{t('financeOverview.modes.month', 'Місяць')}</ToggleButton>
          <ToggleButton value="year" sx={{ px: 2.5, fontWeight: 600 }}>{t('financeOverview.modes.year', 'Рік')}</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton onClick={handlePrev}><ChevronLeftIcon /></IconButton>
              <Box sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, textTransform: 'capitalize' }}>{periodLabel}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {dayjs(dateFrom).format('DD.MM.YYYY')} — {dayjs(dateTo).format('DD.MM.YYYY')}
                </Typography>
              </Box>
              <IconButton onClick={handleNext}><ChevronRightIcon /></IconButton>
              <Button size="small" onClick={handleToday} sx={{ ml: 1, textTransform: 'none' }}>
                {t('financeOverview.today', 'Поточний')}
              </Button>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 5 }}>
            <Button variant="contained" fullWidth startIcon={<AddIcon />} onClick={openCreateDialog} sx={{ height: 44 }}>
              {t('expenses.add', 'Додати витрату')}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 2.5, mb: 3, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2, maxWidth: 320 }}>
        <TrendingDownIcon sx={{ fontSize: 36, color: 'error.main' }} />
        <Box>
          <Typography variant="caption" color="text.secondary">{t('expenses.totalForPeriod', 'Витрачено за період')}</Typography>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{formatAmount(total)}</Typography>
        </Box>
      </Paper>

      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {error && <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : expenses.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">{t('expenses.empty', 'Витрат за цей період немає')}</Typography>
          </Box>
        ) : (
          <TableContainer sx={{ maxHeight: 500 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ bgcolor: 'background.paper' }}>{t('expenses.fields.date', 'Дата')}</TableCell>
                  <TableCell sx={{ bgcolor: 'background.paper' }}>{t('expenses.fields.title', 'Назва')}</TableCell>
                  <TableCell align="right" sx={{ bgcolor: 'background.paper' }}>{t('expenses.fields.amount', 'Сума')}</TableCell>
                  <TableCell align="right" sx={{ bgcolor: 'background.paper' }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id} hover>
                    <TableCell>{dayjs(expense.date).format('DD.MM.YYYY')}</TableCell>
                    <TableCell>{expense.title}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: 'error.main' }}>
                      {Number(expense.amount).toFixed(2)} €
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => openEditDialog(expense)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => setDeleteTarget(expense)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingId ? t('expenses.editTitle', 'Редагувати витрату') : t('expenses.addTitle', 'Нова витрата')}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {formError && <Alert severity="error">{formError}</Alert>}

        <Autocomplete
          freeSolo
          options={EXPENSE_SUGGESTIONS}
          value={form.title}
          onInputChange={(_, newInputValue) => {
            setForm({ ...form, title: newInputValue });
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t('expenses.fields.title', 'Назва')}
              placeholder={t('expenses.titlePlaceholder', 'Оберіть зі списку або введіть свою назву')}
              fullWidth
              autoFocus
            />
          )}
        />

            <TextField
              label={t('expenses.fields.amount', 'Сума')}
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              slotProps={{ input: { endAdornment: <InputAdornment position="end">€</InputAdornment> } }}
              fullWidth
            />

            <div>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                {t('expenses.fields.date', 'Дата')}
              </Typography>
              <DatePicker
                value={form.date}
                onChange={(value) => setForm({ ...form, date: value ?? form.date })}
              />
            </div>

          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>
            {t('common.cancel', 'Скасувати')}
          </Button>
          <Button onClick={handleSubmit} variant="contained" disabled={saving}>
            {saving ? <CircularProgress size={20} /> : t('common.save', 'Зберегти')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onClose={() => !deleting && setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('expenses.confirmDeleteTitle', 'Видалити витрату?')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {deleteTarget && (
              <>
                {t('expenses.confirmDeleteText', 'Видалити витрату')} «{deleteTarget.title}» —{' '}
                <b>{Number(deleteTarget.amount).toFixed(2)} €</b>?
              </>
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>
            {t('common.cancel', 'Скасувати')}
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" disabled={deleting}>
            {deleting ? <CircularProgress size={20} color="inherit" /> : t('common.delete', 'Видалити')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ExpensesPage;