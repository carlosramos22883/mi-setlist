// ============================================================
// PDF SERVICE (móvil) — descarga y abre PDFs generados por el API
// ============================================================
import { Platform } from 'react-native';
import { api } from './api';
import { showAlert } from '../utils/dialogs';

async function openPdf(path: string) {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    showAlert('Próximamente', 'La descarga de PDF estará disponible en la versión nativa.');
    return;
  }
  const res = await api.get(path, { responseType: 'blob' });
  const url = URL.createObjectURL(res.data);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function openSongPdf(songId: string) {
  return openPdf(`/pdf/songs/${songId}`);
}

export function openSetlistPdf(setlistId: string) {
  return openPdf(`/pdf/setlists/${setlistId}`);
}