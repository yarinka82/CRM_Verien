
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
  InputAdornment,
  CircularProgress,
  Paper,
  Tooltip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import VerifiedIcon from '@mui/icons-material/Verified';
import { tokens } from "@/pages/components/theme.ts";

interface Member {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  join_date: string;
  status: 'active' | 'inactive';
  is_founder: boolean;
}

type FounderFilter = 'all' | 'founders';

const MemberList: React.FC = () => {
  const { t } = useTranslation();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [founderFilter, setFounderFilter] = useState<FounderFilter>('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch('/api/members/')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: Member[]) => {
        if (!cancelled) setMembers(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    return members
      .filter((m) => (founderFilter === 'founders' ? m.is_founder : true))
      .filter((m) => {
        if (!query.trim()) return true;
        const q = query.toLowerCase();
        return (
          m.first_name.toLowerCase().includes(q) ||
          m.last_name.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q)
        );
      });
  }, [members, founderFilter, query]);

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', px: { xs: 2, md: 4 }, py: 4 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
          mb: 1,
        }}
      >
        <Box>
          <Typography
            variant="overline"
            sx={{
              color: tokens.muted,
              fontFamily: '"IBM Plex Mono", monospace',
              letterSpacing: '0.12em',
            }}
          >
            {t('members.registryTitle')}
          </Typography>
          <Typography variant="h4" sx={{ color: tokens.ink, lineHeight: 1.1 }}>
            {t('members.title')}
          </Typography>
        </Box>
        <Button
          component={RouterLink}
          to="/members/add"
          variant="contained"
          startIcon={<AddIcon />}
          sx={{
            bgcolor: tokens.registry,
            '&:hover': { bgcolor: tokens.registryDark },
          }}
        >
          {t('members.addMember')}
        </Button>
      </Box>

      <Typography variant="body2" sx={{ color: tokens.muted, mb: 3 }}>
        {t('members.totalRecords', { count: filtered.length })}
        {founderFilter === 'founders' ? ` · ${t('members.onlyFounders')}` : ''}
      </Typography>

      {/* Controls */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
        <TextField
          size="small"
          placeholder={t('members.searchPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          sx={{ minWidth: 260, bgcolor: tokens.paperElevated }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: tokens.muted }} />
                </InputAdornment>
              ),
            },
          }}
        />
        <ToggleButtonGroup
          value={founderFilter}
          exclusive
          size="small"
          onChange={(_, val) => val && setFounderFilter(val)}
          sx={{
            bgcolor: tokens.paperElevated,
            '& .MuiToggleButton-root.Mui-selected': {
              bgcolor: tokens.registry,
              color: '#fff',
              '&:hover': { bgcolor: tokens.registryDark },
            },
          }}
        >
          <ToggleButton value="all">{t('members.all')}</ToggleButton>
          <ToggleButton value="founders">{t('members.founders')}</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Table */}
      <Paper
        variant="outlined"
        sx={{ borderColor: tokens.divider, bgcolor: tokens.paperElevated, overflow: 'hidden' }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress sx={{ color: tokens.registry }} />
          </Box>
        ) : error ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography sx={{ color: tokens.danger, fontWeight: 500 }}>
              {t('members.loadError', { error })}
            </Typography>
          </Box>
        ) : filtered.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ color: tokens.ink, mb: 1 }}>
              {t('members.emptyTitle')}
            </Typography>
            <Typography variant="body2" sx={{ color: tokens.muted, mb: 2 }}>
              {t('members.emptyDescription')}
            </Typography>
            <Button component={RouterLink} to="/members/add" variant="outlined">
              {t('members.addMember')}
            </Button>
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('members.fullName')}</TableCell>
                <TableCell>{t('members.email')}</TableCell>
                <TableCell>{t('members.phone')}</TableCell>
                <TableCell>{t('members.joinedDate')}</TableCell>
                <TableCell>{t('members.status')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((m) => (
                <TableRow
                  key={m.id}
                  component={RouterLink}
                  to={`/members/${m.id}`}
                  hover
                  sx={{
                    textDecoration: 'none',
                    cursor: 'pointer',
                    '& td': { color: tokens.ink },
                  }}
                >
                  <TableCell sx={{ fontWeight: 500 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      {m.last_name} {m.first_name}
                      {m.is_founder && (
                        <Tooltip title={t('members.founderTooltip')}>
                          <VerifiedIcon
                            sx={{ fontSize: 18, color: tokens.sealGold }}
                          />
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '0.85rem' }}>
                    {m.email}
                  </TableCell>
                  <TableCell sx={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '0.85rem' }}>
                    {m.phone || '—'}
                  </TableCell>
                  <TableCell sx={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '0.85rem' }}>
                    {m.join_date}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={m.status === 'active' ? t('members.statusActive') : t('members.statusInactive')}
                      size="small"
                      sx={{
                        bgcolor: m.status === 'active' ? 'rgba(47,111,94,0.12)' : 'rgba(154,165,160,0.15)',
                        color: m.status === 'active' ? tokens.registryDark : tokens.muted,
                        fontWeight: 500,
                        border: '1px solid',
                        borderColor: m.status === 'active' ? tokens.registry : tokens.divider,
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>
    </Box>
  );
};

export default MemberList;