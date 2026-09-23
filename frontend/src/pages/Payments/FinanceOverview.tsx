import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
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
  Grid, ToggleButtonGroup, ToggleButton, Alert, CircularProgress,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

import RefreshIcon from '@mui/icons-material/Refresh';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import LayersIcon from '@mui/icons-material/Layers';

import { paymentsApi } from '@/api/payments';
import { expensesApi } from '@/api/expenses';
import type { Payment } from '@/types/payments';
import type { Expense } from '@/types/expenses';
import { PageHeader } from '@/components/PageHeader';
import { PeriodToolbar } from '@/components/PeriodToolbar';

type PeriodMode = 'month' | 'year';
type ChartMode = 'month' | 'year';

export const FinanceOverviewPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [periodMode, setPeriodMode] = useState<PeriodMode>('year');
  const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());
  const [chartMode, setChartMode] = useState<ChartMode>('month');

  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Current locale for formatting numbers and dates
  const locale = useMemo(() => {
    return i18n.language === 'de' ? 'de-DE' : i18n.language === 'en' ? 'en-US' : 'uk-UA';
  }, [i18n.language]);

  const formatAmount = useCallback(
    (value: number) => {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value || 0);
    },
    [locale]
  );

  // Formatting the period header (without the parasitic "p" for UA)
  const { dateFrom, dateTo, periodLabel } = useMemo(() => {
    const from = periodMode === 'month' ? currentDate.startOf('month') : currentDate.startOf('year');
    const to = periodMode === 'month' ? currentDate.endOf('month') : currentDate.endOf('year');

    let label = '';
    if (periodMode === 'month') {
      const month = currentDate.toDate().toLocaleDateString(locale, { month: 'long' });
      label = `${month.charAt(0).toUpperCase() + month.slice(1)} ${currentDate.format('YYYY')}`;
    } else {
      label = `${currentDate.format('YYYY')} ${t('financeOverview.yearSuffix', 'рік')}`;
    }

    return {
      dateFrom: from.format('YYYY-MM-DD'),
      dateTo: to.format('YYYY-MM-DD'),
      periodLabel: label,
    };
  }, [periodMode, currentDate, t, locale]);

  // Uploading both payments and expenses at the same time
  const fetchOverviewData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [paymentsData, expensesData] = await Promise.all([
        paymentsApi.getPayments({ date_from: dateFrom, date_to: dateTo }),
        expensesApi.getExpenses({ date_from: dateFrom, date_to: dateTo }),
      ]);
      setPayments(paymentsData);
      setExpenses(expensesData);
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      setError(t('financeOverview.loadError', 'Не вдалося завантажити аналітику'));
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, t]);

  useEffect(() => {
    fetchOverviewData();
  }, [fetchOverviewData]);

  const handlePrev = () => setCurrentDate((prev) => prev.subtract(1, periodMode));
  const handleNext = () => setCurrentDate((prev) => prev.add(1, periodMode));
  const handleResetToCurrent = () => setCurrentDate(dayjs());

  // --- Data Matrix: Combine Income and Expenses by Period ---
  const matrixData = useMemo(() => {
    const groups: {
      key: string;
      label: string;
      fees: number;
      donations: number;
      sponsorships: number;
      grants: number;
      otherIncome: number;
      totalIncome: number;
      totalExpense: number;
      netBalance: number;
    }[] = [];

    if (periodMode === 'year') {
      for (let m = 0; m < 12; m++) {
        const monthDate = currentDate.month(m);
        // Translation of the name of the month into the locale language with a capital letter
        const mName = monthDate.toDate().toLocaleDateString(locale, { month: 'long' });
        const label = mName.charAt(0).toUpperCase() + mName.slice(1);

        groups.push({
          key: monthDate.format('YYYY-MM'),
          label,
          fees: 0,
          donations: 0,
          sponsorships: 0,
          grants: 0,
          otherIncome: 0,
          totalIncome: 0,
          totalExpense: 0,
          netBalance: 0,
        });
      }
    } else {
      const daysInMonth = currentDate.daysInMonth();
      for (let d = 1; d <= daysInMonth; d++) {
        const dayDate = currentDate.date(d);
        const weekday = dayDate.toDate().toLocaleDateString(locale, { weekday: 'short' });
        groups.push({
          key: dayDate.format('YYYY-MM-DD'),
          label: `${dayDate.format('DD.MM')} (${weekday})`,
          fees: 0,
          donations: 0,
          sponsorships: 0,
          grants: 0,
          otherIncome: 0,
          totalIncome: 0,
          totalExpense: 0,
          netBalance: 0,
        });
      }
    }

    const groupMap = new Map(groups.map((g) => [g.key, g]));

    // 1. Adding earnings
    payments.forEach((p) => {
      const amount = Number(p.amount) || 0;
      const key = periodMode === 'month' ? p.date : dayjs(p.date).format('YYYY-MM');
      const group = groupMap.get(key);
      if (group) {
        group.totalIncome += amount;
        if (p.type === 'membership_fee') group.fees += amount;
        else if (p.type === 'donation') group.donations += amount;
        else if (p.type === 'sponsorship') group.sponsorships += amount;
        else if (p.type === 'grant') group.grants += amount;
        else group.otherIncome += amount;
      }
    });

    // 2. Adding expenses
    expenses.forEach((e) => {
      const amount = Number(e.amount) || 0;
      const key = periodMode === 'month' ? e.date : dayjs(e.date).format('YYYY-MM');
      const group = groupMap.get(key);
      if (group) {
        group.totalExpense += amount;
      }
    });

    // 3. Calculate the balance for each line
    groups.forEach((g) => {
      g.netBalance = g.totalIncome - g.totalExpense;
    });

    return periodMode === 'month' ? groups.filter((g) => g.totalIncome > 0 || g.totalExpense > 0) : groups;
  }, [payments, expenses, periodMode, currentDate, locale]);

  // --- Data for graph (Revenues vs Expenses) ---
  const chartData = useMemo(() => {
    const map = new Map<string, { income: number; expense: number }>();

    payments.forEach((p) => {
      const amt = Number(p.amount) || 0;
      const d = dayjs(p.date);
      const key = chartMode === 'month' ? d.format('YYYY-MM') : d.format('YYYY');
      const cur = map.get(key) || { income: 0, expense: 0 };
      cur.income += amt;
      map.set(key, cur);
    });

    expenses.forEach((e) => {
      const amt = Number(e.amount) || 0;
      const d = dayjs(e.date);
      const key = chartMode === 'month' ? d.format('YYYY-MM') : d.format('YYYY');
      const cur = map.get(key) || { income: 0, expense: 0 };
      cur.expense += amt;
      map.set(key, cur);
    });

    return Array.from(map.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([period, data]) => ({
        period,
        income: data.income,
        expense: data.expense,
        balance: data.income - data.expense,
      }));
  }, [payments, expenses, chartMode]);

  // --- Grand Totals ---
  const grandTotals = useMemo(() => {
    let fees = 0, donations = 0, sponsorships = 0, grants = 0, otherIncome = 0;
    let totalIncome = 0;
    let totalExpense = 0;

    payments.forEach((p) => {
      const amt = Number(p.amount) || 0;
      totalIncome += amt;
      if (p.type === 'membership_fee') fees += amt;
      else if (p.type === 'donation') donations += amt;
      else if (p.type === 'sponsorship') sponsorships += amt;
      else if (p.type === 'grant') grants += amt;
      else otherIncome += amt;
    });

    expenses.forEach((e) => {
      totalExpense += Number(e.amount) || 0;
    });

    const netBalance = totalIncome - totalExpense;

    return { fees, donations, sponsorships, grants, otherIncome, totalIncome, totalExpense, netBalance };
  }, [payments, expenses]);

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 4 }, py: 4 }}>
      <PageHeader
        overline={t('financeOverview.subtitle', 'Фінансова звітність та аналіз')}
        title={t('financeOverview.title', 'Фінансовий огляд')}
        periodMode={periodMode}
        onPeriodModeChange={setPeriodMode}
        monthLabel={t('financeOverview.modes.month', 'Місяць')}
        yearLabel={t('financeOverview.modes.year', 'Рік')}
      />

      <PeriodToolbar
        periodLabel={periodLabel}
        dateFromLabel={dayjs(dateFrom).format('DD.MM.YYYY')}
        dateToLabel={dayjs(dateTo).format('DD.MM.YYYY')}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleResetToCurrent}
        actionLabel={t('common.refresh', 'Оновити дані')}
        actionIcon={<RefreshIcon />}
        onAction={fetchOverviewData}
        actionLoading={loading}
      />

      {/*3. Consolidated KPI Cards (Income, Expenses, Balance)*/}
      <Grid container spacing={2} sx={{ mb: 3 }}>

        {/*🟢 CARD 1: EARNINGS -> transition to /cashdesk*/}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Paper
          onClick={() => {
            const searchParam =
              periodMode === 'year'
                ? currentDate.format('YYYY')
                : currentDate.format('MM.YYYY');

            navigate(
              `/cashdesk?search=${searchParam}&mode=${periodMode}&date=${currentDate.format('YYYY-MM-DD')}`
            );
          }}
          sx={{
              p: 2,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              border: '1px solid transparent',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: 4,
                borderColor: 'success.light',
              },
            }}
          >
            <TrendingUpIcon sx={{ fontSize: 36, color: 'success.main' }} />
            <Box sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  {t('financeOverview.totalIncomes', 'Всього доходів')}
                </Typography>
                <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>
                  →
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
                {formatAmount(grandTotals.totalIncome)}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/*🔴 CARD 2: EXPENSES -> transition to /expenses*/}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper
            onClick={() =>
              navigate(`/expenses?mode=${periodMode}&date=${currentDate.format('YYYY-MM-DD')}`)
            }
            sx={{
              p: 2,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              border: '1px solid transparent',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: 4,
                borderColor: 'error.light',
              },
            }}
          >
            <TrendingDownIcon sx={{ fontSize: 36, color: 'error.main' }} />
            <Box sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  {t('financeOverview.totalExpenses', 'Всього витрат')}
                </Typography>
                <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 600 }}>
                  →
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'error.main' }}>
                {formatAmount(grandTotals.totalExpense)}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/*⚖️ CARD 3: Net Balance*/}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper
            sx={{
              p: 2,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              bgcolor: grandTotals.netBalance >= 0 ? 'rgba(46, 125, 50, 0.04)' : 'rgba(211, 47, 47, 0.04)',
            }}
          >
            <AccountBalanceIcon
              sx={{ fontSize: 36, color: grandTotals.netBalance >= 0 ? 'primary.main' : 'error.main' }}
            />
            <Box>
              <Typography variant="caption" color="text.secondary">
                {t('financeOverview.netBalance', 'Чистий баланс (Сальдо)')}
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  color: grandTotals.netBalance >= 0 ? 'primary.main' : 'error.main',
                }}
              >
                {formatAmount(grandTotals.netBalance)}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/*📊 CARD 4: Membership fee structure*/}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 2, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <LayersIcon sx={{ fontSize: 36, color: 'info.main' }} />
            <Box>
              <Typography variant="caption" color="text.secondary">
                {t('payments.types.membership_fee', 'Внески')} / {t('financeOverview.otherIncome', 'Інші доходи')}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {formatAmount(grandTotals.fees)} / {formatAmount(grandTotals.totalIncome - grandTotals.fees)}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/*4. Graph of dynamics: Revenues vs Expenses*/}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {chartMode === 'month'
              ? t('financeOverview.monthlyDynamics', 'Динаміка по місяцях')
              : t('financeOverview.yearlyDynamics', 'Динаміка по роках')}
          </Typography>
          <ToggleButtonGroup
            value={chartMode}
            exclusive
            size="small"
            onChange={(_, val) => val && setChartMode(val)}
          >
            <ToggleButton value="month" sx={{ px: 2 }}>{t('financeOverview.modes.month', 'Місяць')}</ToggleButton>
            <ToggleButton value="year" sx={{ px: 2 }}>{t('financeOverview.modes.year', 'Рік')}</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Box sx={{ width: '100%', height: 320 }}>
          <ResponsiveContainer>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <RechartsTooltip formatter={(value: any) => [formatAmount(Number(value || 0)), '']} />
              <Legend />
              <Line
                type="monotone"
                dataKey="income"
                name={t('financeOverview.incomesCol', 'Доходи')}
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="expense"
                name={t('financeOverview.expensesCol', 'Витрати')}
                stroke="#ef4444"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Paper>

      {/*5. Summary Analytical Table*/}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {error && <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : matrixData.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              {t('financeOverview.empty', 'Немає фінансових операцій за цей період')}
            </Typography>
          </Box>
        ) : (
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, bgcolor: 'background.paper' }}>
                    {periodMode === 'month' ? t('financeOverview.dateCol', 'Дата') : t('financeOverview.monthCol', 'Місяць')}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, bgcolor: 'background.paper' }}>
                    {t('payments.types.membership_fee', 'Членські внески')}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, bgcolor: 'background.paper' }}>
                    {t('payments.types.donation', 'Пожертви')}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, bgcolor: 'background.paper' }}>
                    {t('payments.types.grant', 'Гранти')}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, bgcolor: 'background.paper', color: 'success.dark' }}>
                    {t('financeOverview.incomesCol', 'Всього доходів')}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, bgcolor: 'background.paper', color: 'error.main' }}>
                    {t('financeOverview.expensesCol', 'Витрати')}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, bgcolor: 'background.paper', color: 'primary.main' }}>
                    {t('financeOverview.netCol', 'Сальдо')}
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {matrixData.map((row) => (
                  <TableRow key={row.key} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{row.label}</TableCell>
                    <TableCell align="right" sx={{ color: row.fees > 0 ? 'text.primary' : 'text.disabled' }}>
                      {row.fees > 0 ? formatAmount(row.fees) : '—'}
                    </TableCell>
                    <TableCell align="right" sx={{ color: row.donations > 0 ? 'text.primary' : 'text.disabled' }}>
                      {row.donations > 0 ? formatAmount(row.donations) : '—'}
                    </TableCell>
                    <TableCell align="right" sx={{ color: row.grants > 0 ? 'text.primary' : 'text.disabled' }}>
                      {row.grants > 0 ? formatAmount(row.grants) : '—'}
                    </TableCell>

                    {/*Income*/}
                    <TableCell align="right" sx={{ fontWeight: 700, color: row.totalIncome > 0 ? 'success.dark' : 'text.disabled' }}>
                      {row.totalIncome > 0 ? formatAmount(row.totalIncome) : '—'}
                    </TableCell>

                    {/*Expenses*/}
                    <TableCell align="right" sx={{ fontWeight: 700, color: row.totalExpense > 0 ? 'error.main' : 'text.disabled' }}>
                      {row.totalExpense > 0 ? formatAmount(row.totalExpense) : '—'}
                    </TableCell>

                    {/*Balance*/}
                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: 700,
                        color:
                          row.netBalance > 0
                            ? 'success.main'
                            : row.netBalance < 0
                            ? 'error.main'
                            : 'text.disabled',
                      }}
                    >
                      {row.totalIncome > 0 || row.totalExpense > 0 ? formatAmount(row.netBalance) : '—'}
                    </TableCell>
                  </TableRow>
                ))}

                {/*Final line*/}
                <TableRow sx={{ bgcolor: 'action.hover', borderTop: '2px solid', borderColor: 'divider' }}>
                  <TableCell sx={{ fontWeight: 800, fontSize: '0.95rem' }}>
                    {t('financeOverview.totalCol', 'РАЗОМ')}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>{formatAmount(grandTotals.fees)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>{formatAmount(grandTotals.donations)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>{formatAmount(grandTotals.grants)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 900, color: 'success.dark', fontSize: '1rem' }}>
                    {formatAmount(grandTotals.totalIncome)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 900, color: 'error.main', fontSize: '1rem' }}>
                    {formatAmount(grandTotals.totalExpense)}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: 900,
                      fontSize: '1.05rem',
                      color: grandTotals.netBalance >= 0 ? 'success.dark' : 'error.main',
                    }}
                  >
                    {formatAmount(grandTotals.netBalance)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
};

export default FinanceOverviewPage;