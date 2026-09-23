
import React from 'react';
import { Box, Typography, ToggleButtonGroup, ToggleButton } from '@mui/material';

interface PageHeaderProps {
  overline: string;
  title: string;
  periodMode?: 'month' | 'year';
  onPeriodModeChange?: (mode: 'month' | 'year') => void;
  monthLabel: string;
  yearLabel: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  overline, title, periodMode, onPeriodModeChange, monthLabel, yearLabel,
}) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
    <Box>
      <Typography variant="overline" sx={{ color: 'text.secondary', letterSpacing: '0.1em' }}>
        {overline}
      </Typography>
      <Typography variant="h4" sx={{ fontWeight: 800 }}>
        {title}
      </Typography>
    </Box>
    {periodMode && onPeriodModeChange && (
      <ToggleButtonGroup value={periodMode} exclusive size="small" onChange={(_, v) => v && onPeriodModeChange(v)}>
        <ToggleButton value="month" sx={{ px: 2.5, fontWeight: 600 }}>{monthLabel}</ToggleButton>
        <ToggleButton value="year" sx={{ px: 2.5, fontWeight: 600 }}>{yearLabel}</ToggleButton>
      </ToggleButtonGroup>
    )}
  </Box>
);