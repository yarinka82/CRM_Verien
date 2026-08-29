import React, { useState, useEffect } from 'react';
import { Snackbar, Alert, AlertColor } from '@mui/material';

// Описание типа события
interface NotifyEvent extends Event {
  detail?: {
    message: string;
    severity: AlertColor;
  };
}

const Notifier = () => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<AlertColor>('info');

  useEffect(() => {
    // Обработчик нашего кастомного события
    const handleNotify = (event: NotifyEvent) => {
      if (event.detail) {
        setMessage(event.detail.message);
        setSeverity(event.detail.severity);
        setOpen(true);
      }
    };

    window.addEventListener('notify', handleNotify as EventListener);
    return () => window.removeEventListener('notify', handleNotify as EventListener);
  }, []);

  const handleClose = (_?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setOpen(false);
  };

  return (
    <Snackbar 
      open={open} 
      autoHideDuration={4000} 
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert onClose={handleClose} severity={severity} variant="filled" sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  );
};

export default Notifier;

// Функция-помощник для вызова из любого места
export const toast = (message: string, severity: AlertColor = 'info') => {
  window.dispatchEvent(
    new CustomEvent('notify', { detail: { message, severity } })
  );
};