import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import dayjs, { Dayjs } from 'dayjs';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
dayjs.extend(quarterOfYear);

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
  CircularProgress,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  Grid,
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

import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import RefreshIcon from '@mui/icons-material/Refresh';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import GroupsIcon from '@mui/icons-material/Groups';
import LayersIcon from '@mui/icons-material/Layers';

import { paymentsApi } from '@/api/payments';
import type { Payment } from '@/types/payments';

type PeriodMode = 'month' | 'quarter' | 'year';
type ChartMode = 'month' | 'quarter';

export const FinanceOverviewPage: React.FC = () => {
  const { t, i18n } = useTranslation();

  const [periodMode, setPeriodMode] = useState<PeriodMode>('year');
  const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());
  const [chartMode, setChartMode] = useState<ChartMode>('month');

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const formatAmount = useCallback(
    (value: number) => {
      const locale =
        i18n.language === 'de' ? 'de-DE' : i18n.language === 'en' ? 'en-US' : 'uk-UA';

      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value || 0);
    },
    [i18n.language]
  );

  const { dateFrom, dateTo, periodLabel } = useMemo(() => {
    let from: Dayjs;
    let to: Dayjs;
    let label = '';

    if (periodMode === 'month') {
      from = currentDate.startOf('month');
      to = currentDate.endOf('month');
      label = currentDate.format('MMMM YYYY');
    } else if (periodMode === 'quarter') {
      from = currentDate.startOf('quarter');
      to = currentDate.endOf('quarter');
      label = `${currentDate.year()} - Q${currentDate.quarter()} (${from.format('MMM')} – ${to.format('MMM')})`;
    } else {
      from = currentDate.startOf('year');
      to = currentDate.endOf('year');
      label = `${currentDate.format('YYYY')} ${t('financeOverview.yearSuffix', 'рік')}`;
    }

    return {
      dateFrom: from.format('YYYY-MM-DD'),
      dateTo: to.format('YYYY-MM-DD'),
      periodLabel: label,
    };
  }, [periodMode, currentDate, t]);

  const fetchOverviewData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await paymentsApi.getPayments({
        date_from: dateFrom,
        date_to: dateTo,
      });
      setPayments(data);
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

  // --- Grouping data into analytical table rows ---
  const matrixData = useMemo(() => {
    const groups: {
      key: string;
      label: string;
      fees: number;
      donations: number;
      sponsorships: number;
      grants: number;
      other: number;
      total: number;
    }[] = [];

    if (periodMode === 'year') {
      for (let m = 0; m < 12; m++) {
        const monthDate = currentDate.month(m);
        groups.push({
          key: monthDate.format('YYYY-MM'),
          label: monthDate.format('MMMM'),
          fees: 0, donations: 0, sponsorships: 0, grants: 0, other: 0, total: 0,
        });
      }
    } else if (periodMode === 'quarter') {
      const startMonth = (currentDate.quarter() - 1) * 3;
      for (let m = startMonth; m < startMonth + 3; m++) {
        const monthDate = currentDate.month(m);
        groups.push({
          key: monthDate.format('YYYY-MM'),
          label: monthDate.format('MMMM YYYY'),
          fees: 0, donations: 0, sponsorships: 0, grants: 0, other: 0, total: 0,
        });
      }
    } else {
      const daysInMonth = currentDate.daysInMonth();
      for (let d = 1; d <= daysInMonth; d++) {
        const dayDate = currentDate.date(d);
        groups.push({
          key: dayDate.format('YYYY-MM-DD'),
          label: dayDate.format('DD.MM (dd)'),
          fees: 0, donations: 0, sponsorships: 0, grants: 0, other: 0, total: 0,
        });
      }
    }

    const groupMap = new Map(groups.map((g) => [g.key, g]));

    payments.forEach((p) => {
      const amount = Number(p.amount) || 0;
      const key = periodMode === 'month' ? p.date : dayjs(p.date).format('YYYY-MM');

      let group = groupMap.get(key);
      if (!group) {
        group = { key, label: p.date, fees: 0, donations: 0, sponsorships: 0, grants: 0, other: 0, total: 0 };
        groups.push(group);
        groupMap.set(key, group);
      }

      group.total += amount;
      if (p.type === 'membership_fee') group.fees += amount;
      else if (p.type === 'donation') group.donations += amount;
      else if (p.type === 'sponsorship') group.sponsorships += amount;
      else if (p.type === 'grant') group.grants += amount;
      else group.other += amount;
    });

    return periodMode === 'month' ? groups.filter((g) => g.total > 0) : groups;
  }, [payments, periodMode, currentDate]);

  // --- Data for the graph (regardless of the periodMode of the table) ---
  const chartData = useMemo(() => {
    const groupMap = new Map<string, number>();

    payments.forEach((p) => {
      const amount = Number(p.amount) || 0;
      const d = dayjs(p.date);
      const key =
        chartMode === 'month'
          ? d.format('YYYY-MM')
          : `${d.year()}-Q${d.quarter()}`;
      groupMap.set(key, (groupMap.get(key) || 0) + amount);
    });

    return Array.from(groupMap.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([period, total]) => ({ period, total }));
  }, [payments, chartMode]);

  // Total scores for Total Row and KPI cards
  const grandTotals = useMemo(() => {
    let fees = 0, donations = 0, sponsorships = 0, grants = 0, other = 0, total = 0;
    let individual = 0, company = 0, otherPayer = 0;

    payments.forEach((p) => {
      const amt = Number(p.amount) || 0;
      total += amt;
      if (p.type === 'membership_fee') fees += amt;
      else if (p.type === 'donation') donations += amt;
      else if (p.type === 'sponsorship') sponsorships += amt;
      else if (p.type === 'grant') grants += amt;
      else other += amt;

      if (p.payer_type === 'individual') individual += amt;
      else if (p.payer_type === 'company') company += amt;
      else otherPayer += amt;
    });

    return { fees, donations, sponsorships, grants, other, total, individual, company, otherPayer };
  }, [payments]);

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 4 }, py: 4 }}>
      {/* 1. Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="overline" sx={{ color: 'text.secondary', letterSpacing: '0.1em' }}>
            {t('financeOverview.subtitle', 'Фінансова звітність та аналіз')}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            {t('financeOverview.title', 'Фінансовий огляд')}
          </Typography>
        </Box>

        <ToggleButtonGroup
          value={periodMode}
          exclusive
          size="small"
          onChange={(_, val) => val && setPeriodMode(val)}
          sx={{ bgcolor: 'background.paper' }}
        >
          <ToggleButton value="month" sx={{ px: 2.5, fontWeight: 600 }}>{t('financeOverview.modes.month', 'Місяць')}</ToggleButton>
          <ToggleButton value="quarter" sx={{ px: 2.5, fontWeight: 600 }}>{t('financeOverview.modes.quarter', 'Квартал')}</ToggleButton>
          <ToggleButton value="year" sx={{ px: 2.5, fontWeight: 600 }}>{t('financeOverview.modes.year', 'Рік')}</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/*2. Period Navigator*/}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton onClick={handlePrev} size="large" sx={{ bgcolor: 'action.hover' }}>
                <ChevronLeftIcon />
              </IconButton>

              <Box sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, textTransform: 'capitalize' }}>
                  {periodLabel}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {dayjs(dateFrom).format('DD.MM.YYYY')} — {dayjs(dateTo).format('DD.MM.YYYY')}
                </Typography>
              </Box>

              <IconButton onClick={handleNext} size="large" sx={{ bgcolor: 'action.hover' }}>
                <ChevronRightIcon />
              </IconButton>

              <Button size="small" variant="text" onClick={handleResetToCurrent} sx={{ ml: 1, textTransform: 'none' }}>
                {t('financeOverview.today', 'Поточний')}
              </Button>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <RefreshIcon />}
              onClick={fetchOverviewData}
              disabled={loading}
              sx={{ height: 44, borderRadius: 2 }}
            >
              {t('common.refresh', 'Оновити дані')}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/*3. Consolidated KPI Cards*/}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 2, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <AccountBalanceWalletIcon sx={{ fontSize: 36, color: 'primary.main' }} />
            <Box>
              <Typography variant="caption" color="text.secondary">{t('financeOverview.totalIncomes', 'Всього отримано')}</Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>{formatAmount(grandTotals.total)}</Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 2, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <GroupsIcon sx={{ fontSize: 36, color: 'info.main' }} />
            <Box>
              <Typography variant="caption" color="text.secondary">{t('financeOverview.payerBreakdown', 'Фіз. особи / Підприємства')}</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {formatAmount(grandTotals.individual)} / {formatAmount(grandTotals.company)}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 2, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <LayersIcon sx={{ fontSize: 36, color: 'success.main' }} />
            <Box>
              <Typography variant="caption" color="text.secondary">
                {t('payments.types.membership_fee', 'Внески')} / {t('payments.types.grant', 'Гранти')}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {formatAmount(grandTotals.fees)} / {formatAmount(grandTotals.grants)}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 2, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <LayersIcon sx={{ fontSize: 36, color: 'warning.main' }} />
            <Box>
              <Typography variant="caption" color="text.secondary">
                {t('payments.types.donation', 'Пожертви')} / {t('payments.types.sponsorship', 'Спонсори')}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {formatAmount(grandTotals.donations)} / {formatAmount(grandTotals.sponsorships)}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/*4. Dynamics chart (month / quarter)*/}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {chartMode === 'month'
              ? t('financeOverview.monthlyDynamics', 'Динаміка по місяцях')
              : t('financeOverview.quarterlyDynamics', 'Динаміка по кварталах')}
          </Typography>
          <ToggleButtonGroup
            value={chartMode}
            exclusive
            size="small"
            onChange={(_, val) => val && setChartMode(val)}
          >
            <ToggleButton value="month" sx={{ px: 2 }}>{t('financeOverview.modes.month', 'Місяць')}</ToggleButton>
            <ToggleButton value="quarter" sx={{ px: 2 }}>{t('financeOverview.modes.quarter', 'Квартал')}</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Box sx={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <RechartsTooltip formatter={(value: any) => [formatAmount(Number(value || 0)), '']} />
              <Legend />
              <Line
                type="monotone"
                dataKey="total"
                name={t('financeOverview.totalCol', 'Всього')}
                stroke="#2563eb"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Paper>

      {/*analytic grid*/}
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
                  <TableCell align="right" sx={{ fontWeight: 700, bgcolor: 'background.paper', color: 'primary.dark' }}>
                    {t('payments.types.membership_fee', 'Членські внески')}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, bgcolor: 'background.paper' }}>
                    {t('payments.types.donation', 'Пожертви')}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, bgcolor: 'background.paper' }}>
                    {t('payments.types.sponsorship', 'Спонсорство')}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, bgcolor: 'background.paper' }}>
                    {t('payments.types.grant', 'Гранти')}
                  </TableCell>
                  {grandTotals.other > 0 && (
                    <TableCell align="right" sx={{ fontWeight: 700, bgcolor: 'background.paper' }}>
                      {t('payments.types.other', 'Інше')}
                    </TableCell>
                  )}
                  <TableCell align="right" sx={{ fontWeight: 800, bgcolor: 'background.paper', color: 'success.main' }}>
                    {t('financeOverview.totalCol', 'Всього')}
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {matrixData.map((row) => (
                  <TableRow key={row.key} hover>
                    <TableCell sx={{ fontWeight: 600, textTransform: 'capitalize' }}>{row.label}</TableCell>
                    <TableCell align="right" sx={{ color: row.fees > 0 ? 'text.primary' : 'text.disabled' }}>
                      {row.fees > 0 ? formatAmount(row.fees) : '—'}
                    </TableCell>
                    <TableCell align="right" sx={{ color: row.donations > 0 ? 'text.primary' : 'text.disabled' }}>
                      {row.donations > 0 ? formatAmount(row.donations) : '—'}
                    </TableCell>
                    <TableCell align="right" sx={{ color: row.sponsorships > 0 ? 'text.primary' : 'text.disabled' }}>
                      {row.sponsorships > 0 ? formatAmount(row.sponsorships) : '—'}
                    </TableCell>
                    <TableCell align="right" sx={{ color: row.grants > 0 ? 'text.primary' : 'text.disabled' }}>
                      {row.grants > 0 ? formatAmount(row.grants) : '—'}
                    </TableCell>
                    {grandTotals.other > 0 && (
                      <TableCell align="right" sx={{ color: row.other > 0 ? 'text.primary' : 'text.disabled' }}>
                        {row.other > 0 ? formatAmount(row.other) : '—'}
                      </TableCell>
                    )}
                    <TableCell align="right" sx={{ fontWeight: 700, color: row.total > 0 ? 'success.dark' : 'text.disabled' }}>
                      {row.total > 0 ? formatAmount(row.total) : '—'}
                    </TableCell>
                  </TableRow>
                ))}

                <TableRow sx={{ bgcolor: 'action.hover', borderTop: '2px solid', borderColor: 'divider' }}>
                  <TableCell sx={{ fontWeight: 800, fontSize: '0.95rem' }}>{t('common.total', 'РАЗОМ')}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>{formatAmount(grandTotals.fees)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>{formatAmount(grandTotals.donations)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>{formatAmount(grandTotals.sponsorships)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>{formatAmount(grandTotals.grants)}</TableCell>
                  {grandTotals.other > 0 && (
                    <TableCell align="right" sx={{ fontWeight: 800 }}>{formatAmount(grandTotals.other)}</TableCell>
                  )}
                  <TableCell align="right" sx={{ fontWeight: 900, color: 'success.dark', fontSize: '1rem' }}>
                    {formatAmount(grandTotals.total)}
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