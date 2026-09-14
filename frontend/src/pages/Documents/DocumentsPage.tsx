
import React, {useState, useEffect, useCallback, useMemo} from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TableSortLabel,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Stack,
  Tooltip,
} from '@mui/material';
import {
  UploadFile as UploadFileIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  PictureAsPdf as PdfIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';

import { documentsApi } from '@/api/documents';
import { toast } from '@/components/Notifier';
import {
  DocumentCategory,
  DOCUMENT_CATEGORY_LABELS,
  DOCUMENT_CATEGORY_KEYS,
  OrgDocument,
  DocumentTemplate,
} from '@/types/documents';

type TabValue = DocumentCategory | 'templates';
type SortField = 'title' | 'description' | 'uploaded_at';



const DocumentsPage: React.FC = () => {
  const { t } = useTranslation();

    const TABS: { value: TabValue; label: string }[] = [
    { value: 'founding', label: t(DOCUMENT_CATEGORY_KEYS.founding, DOCUMENT_CATEGORY_LABELS.founding) },
    { value: 'internal', label: t(DOCUMENT_CATEGORY_KEYS.internal, DOCUMENT_CATEGORY_LABELS.internal) },
    { value: 'protocol', label: t(DOCUMENT_CATEGORY_KEYS.protocol, DOCUMENT_CATEGORY_LABELS.protocol) },
    { value: 'templates', label: t('documents.categories.templates', 'Шаблони') },
  ];

  const [tab, setTab] = useState<TabValue>('founding');
  const [documents, setDocuments] = useState<OrgDocument[]>([]);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<OrgDocument | DocumentTemplate | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState(''); // for templates only
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>('founding');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<{ id: number; isTemplate: boolean; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isTemplatesTab = tab === 'templates';

  const [sortField, setSortField] = useState<SortField>('uploaded_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const rows = isTemplatesTab ? templates : documents;

  const sortedRows = useMemo(() => {
    const list = [...rows];
    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'uploaded_at') {
        cmp = dayjs(a.uploaded_at).valueOf() - dayjs(b.uploaded_at).valueOf();
      } else if (sortField === 'title') {
        cmp = a.title.localeCompare(b.title, 'uk');
      } else {
        const aDesc = (a as DocumentTemplate).description || '';
        const bDesc = (b as DocumentTemplate).description || '';
        cmp = aDesc.localeCompare(bDesc, 'uk');
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [rows, sortField, sortOrder]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (isTemplatesTab) {
        const data = await documentsApi.getTemplates();
        setTemplates(data);
      } else {
        const data = await documentsApi.getDocuments(tab as DocumentCategory);
        setDocuments(data);
      }
    } catch (err) {
      console.error('Error loading documents:', err);
      const msg = t('documents.loadError', 'Помилка завантаження документів');
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [tab, isTemplatesTab, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openUploadDialog = () => {
    setUploadTitle('');
    setUploadDescription('');
    setUploadCategory(isTemplatesTab ? 'founding' : (tab as DocumentCategory));
    setUploadFile(null);
    setUploadError(null);
    setUploadDialogOpen(true);
  };

  const closeUploadDialog = () => {
    if (uploading) return;
    setUploadDialogOpen(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file && file.type !== 'application/pdf') {
      setUploadError(t('documents.onlyPdf', 'Дозволені лише PDF-файли'));
      setUploadFile(null);
      return;
    }
    setUploadError(null);
    setUploadFile(file);
  };

  const handleUpload = async () => {
    if (!uploadTitle.trim()) {
      setUploadError(t('documents.titleRequired', 'Вкажіть назву документа'));
      return;
    }
    if (!uploadFile) {
      setUploadError(t('documents.fileRequired', 'Оберіть PDF-файл'));
      return;
    }

    setUploading(true);
    setUploadError(null);
    try {
      if (isTemplatesTab) {
        await documentsApi.uploadTemplate(uploadTitle, uploadDescription, uploadFile);
      } else {
        await documentsApi.uploadDocument(uploadTitle, uploadCategory, uploadFile);
      }
      toast.success(t('documents.uploadSuccess', 'Документ успішно завантажено'));
      setUploadDialogOpen(false);
      await loadData();
    } catch (err: any) {
      console.error('Upload error:', err);
      const msg = err.message || t('documents.uploadError', 'Помилка завантаження документа');
      setUploadError(msg);
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.isTemplate) {
        await documentsApi.deleteTemplate(deleteTarget.id);
      } else {
        await documentsApi.deleteDocument(deleteTarget.id);
      }
      toast.success(t('documents.deleteSuccess', 'Документ видалено'));
      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      console.error('Delete error:', err);
      toast.error(t('documents.deleteError', 'Не вдалося видалити документ'));
    } finally {
      setDeleting(false);
    }
  };



  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', px: { xs: 2, md: 4 }, py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="overline" sx={{ color: 'text.secondary', letterSpacing: '0.1em' }}>
            {t('documents.subtitle', 'Документообіг організації')}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            {t('documents.title', 'Документи')}
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<UploadFileIcon />}
          onClick={openUploadDialog}
        >
          {t('documents.upload', 'Завантажити документ')}
        </Button>
      </Box>

      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Tabs
          value={tab}
          onChange={(_, val) => setTab(val)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider', px: 1 }}
        >
          {TABS.map((tabItem) => (
            <Tab key={tabItem.value} value={tabItem.value} label={tabItem.label} />
          ))}
        </Tabs>

        {error && <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : rows.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              {t('documents.empty', 'Документів ще немає')}
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small" sx={{ '& td, & th': { verticalAlign: 'middle' } }}>
            <TableHead>
              <TableRow>
                <TableCell sortDirection={sortField === 'title' ? sortOrder : false}>
                  <TableSortLabel
                    active={sortField === 'title'}
                    direction={sortField === 'title' ? sortOrder : 'asc'}
                    onClick={() => handleSort('title')}
                  >
                    {t('documents.fields.title', 'Назва')}
                  </TableSortLabel>
                </TableCell>

                {isTemplatesTab && (
                  <TableCell sortDirection={sortField === 'description' ? sortOrder : false}>
                    <TableSortLabel
                      active={sortField === 'description'}
                      direction={sortField === 'description' ? sortOrder : 'asc'}
                      onClick={() => handleSort('description')}
                    >
                      {t('documents.fields.description', 'Опис')}
                    </TableSortLabel>
                  </TableCell>
                )}

                <TableCell sortDirection={sortField === 'uploaded_at' ? sortOrder : false}>
                  <TableSortLabel
                    active={sortField === 'uploaded_at'}
                    direction={sortField === 'uploaded_at' ? sortOrder : 'asc'}
                    onClick={() => handleSort('uploaded_at')}
                  >
                    {t('documents.fields.uploadedAt', 'Завантажено')}
                  </TableSortLabel>
                </TableCell>

                <TableCell align="right" />
              </TableRow>
            </TableHead>
              <TableBody>
                {sortedRows.map((doc) => (
                  <TableRow key={doc.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PdfIcon fontSize="small" color="error" />
                      {doc.title}
                    </Box>
                  </TableCell>
                    {isTemplatesTab && (
                      <TableCell>{(doc as DocumentTemplate).description || '—'}</TableCell>
                    )}
                    <TableCell>{dayjs(doc.uploaded_at).format('DD.MM.YYYY HH:mm')}</TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap', width: 1 }}>
                        <Tooltip title={t('documents.preview', 'Переглянути')}>
                          <IconButton size="small" onClick={() => setPreviewDoc(doc)}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t('documents.download', 'Завантажити')}>
                          <IconButton size="small" component="a" href={doc.file} target="_blank" rel="noopener noreferrer">
                            <DownloadIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t('common.delete', 'Видалити')}>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteTarget({ id: doc.id, isTemplate: isTemplatesTab, title: doc.title })}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/*Force Download?*/}
      <Dialog open={uploadDialogOpen} onClose={closeUploadDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{t('documents.uploadTitle', 'Завантажити документ')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {uploadError && <Alert severity="error">{uploadError}</Alert>}

            <TextField
              label={t('documents.fields.title', 'Назва')}
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              fullWidth
              autoFocus
            />

            {isTemplatesTab ? (
              <TextField
                label={t('documents.fields.description', 'Опис (необов’язково)')}
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                multiline
                minRows={2}
                fullWidth
              />
            ) : (
              <TextField
                select
                label={t('documents.fields.category', 'Категорія')}
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value as DocumentCategory)}
                fullWidth
              >
              {(Object.keys(DOCUMENT_CATEGORY_LABELS) as DocumentCategory[]).map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {t(DOCUMENT_CATEGORY_KEYS[cat], DOCUMENT_CATEGORY_LABELS[cat])}
                </MenuItem>
              ))}
              </TextField>
            )}

            <Button
              component="label"
              variant="outlined"
              startIcon={<UploadFileIcon />}
              sx={{ justifyContent: 'flex-start', py: 1.2 }}
            >
              {uploadFile ? uploadFile.name : t('documents.selectFile', 'Обрати PDF-файл')}
              <input
                type="file"
                accept="application/pdf"
                hidden
                onChange={handleFileSelect}
              />
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeUploadDialog} disabled={uploading}>
            {t('common.cancel', 'Скасувати')}
          </Button>
          <Button onClick={handleUpload} variant="contained" disabled={uploading}>
            {uploading ? <CircularProgress size={20} /> : t('common.save2', 'Завантажити')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(previewDoc)}
        onClose={() => setPreviewDoc(null)}
        maxWidth="md"
        fullWidth
        slotProps={{ paper: { sx: { height: '85vh' } } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PdfIcon color="error" fontSize="small" />
          {previewDoc?.title}
        </DialogTitle>
        <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
          {previewDoc && (
            <iframe
              src={previewDoc.file}
              title={previewDoc.title}
              style={{ flex: 1, border: 'none' }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button
            component="a"
            href={previewDoc?.file}
            target="_blank"
            rel="noopener noreferrer"
            startIcon={<DownloadIcon />}
          >
            {t('documents.download', 'Завантажити')}
          </Button>
          <Button onClick={() => setPreviewDoc(null)}>{t('common.close')}</Button>
        </DialogActions>
      </Dialog>

      {/*Delete Confirmation Dialog*/}
      <Dialog open={Boolean(deleteTarget)} onClose={() => !deleting && setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('documents.confirmDeleteTitle', 'Видалити документ?')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {t('documents.confirmDeleteText', 'Ви впевнені, що хочете видалити')} «{deleteTarget?.title}»?
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

export default DocumentsPage;