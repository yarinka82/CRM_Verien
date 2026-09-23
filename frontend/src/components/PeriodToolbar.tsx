
import React from 'react';
import { Paper, Grid, Box, IconButton, Typography, Button } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useTranslation } from 'react-i18next';

interface PeriodToolbarProps {
  periodLabel: string;
  dateFromLabel: string;
  dateToLabel: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  actionLabel: string;
  actionIcon?: React.ReactNode;
  onAction: () => void;
  actionLoading?: boolean;
}

export const PeriodToolbar: React.FC<PeriodToolbarProps> = ({
  periodLabel, dateFromLabel, dateToLabel,
  onPrev, onNext, onToday,
  actionLabel, actionIcon, onAction, actionLoading,
}) => {
  const { t } = useTranslation();
  return (
    <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
      <Grid container spacing={2} sx={{ alignItems: 'center' }}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={onPrev}><ChevronLeftIcon /></IconButton>
            <Box sx={{ flexGrow: 1, textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, textTransform: 'capitalize' }}>
                {periodLabel}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {dateFromLabel} — {dateToLabel}
              </Typography>
            </Box>
            <IconButton onClick={onNext}><ChevronRightIcon /></IconButton>
            <Button size="small" onClick={onToday} sx={{ ml: 1, textTransform: 'none' }}>
              {t('financeOverview.today', 'Поточний')}
            </Button>
          </Box>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Button
            variant="contained"
            fullWidth
            startIcon={actionIcon}
            onClick={onAction}
            disabled={actionLoading}
            sx={{ height: 44 }}
          >
            {actionLabel}
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
};