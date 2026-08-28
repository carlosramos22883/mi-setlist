// ============================================================
// UPLOADS SERVICE (móvil) — subida de archivos al servidor
// ============================================================
import { Platform } from 'react-native';
import { api } from './api';

// Sube una imagen (dataURL de cropper o file:// de nativo)
// y devuelve la ruta relativa guardada en el servidor.
export async function uploadImage(localUri: string): Promise<string> {
  const formData = new FormData();

  if (Platform.OS === 'web') {
    // En web puede venir como dataURL o blob URL
    const res = await fetch(localUri);
    const blob = await res.blob();

    const extension = blob.type.split('/')[1] || 'jpg';
    const filename = `image.${extension === 'jpeg' ? 'jpg' : extension}`;

    formData.append('file', blob, filename);
  } else {
    const filename = localUri.split('/').pop() ?? 'image.jpg';

    formData.append('file', {
      uri: localUri,
      name: filename,
      type: 'image/jpeg',
    } as any);
  }

  // IMPORTANTE:
  // No seteamos Content-Type manualmente.
  // Axios/navegador agregan el boundary correcto.
  const { data } = await api.post<{ path: string }>('/uploads/image', formData);

  return data.path;
}