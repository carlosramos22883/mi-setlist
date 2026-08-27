// ============================================================
// IMAGE VALIDATION — formato y tamaño de imágenes permitidos
// ============================================================
import { Platform } from 'react-native';

export const ALLOWED_IMAGE_MIMES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

export const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

export interface PickedAsset {
  uri: string;
  fileName?: string | null;
  mimeType?: string;
  fileSize?: number;
}

function extensionOf(uriOrName: string): string {
  const clean = uriOrName.split('?')[0];
  const match = /\.([a-zA-Z0-9]+)$/.exec(clean);
  return match ? match[1].toLowerCase() : '';
}

// Valida formato y tamaño. En web completa mime/size con el blob
// si el picker no los trae (blob URLs no tienen extensión).
export async function validatePickedImage(
  asset: PickedAsset,
): Promise<{ ok: boolean; message?: string }> {
  let mime = asset.mimeType ?? '';
  let size = asset.fileSize;

  if ((!mime || size == null) && Platform.OS === 'web') {
    try {
      const res = await fetch(asset.uri);
      const blob = await res.blob();
      if (!mime) mime = blob.type;
      if (size == null) size = blob.size;
    } catch {
      // si falla el fetch, seguimos con lo que haya
    }
  }

  const ext = extensionOf(asset.fileName ?? asset.uri);
  const typeOk =
    ALLOWED_IMAGE_MIMES.includes(mime) || ALLOWED_IMAGE_EXTENSIONS.includes(ext);

  if (!typeOk) {
    return {
      ok: false,
      message: 'Formato no soportado. Usa imágenes JPG, PNG, GIF o WEBP.',
    };
  }

  if (size != null && size > MAX_IMAGE_BYTES) {
    return {
      ok: false,
      message: 'La imagen supera el máximo permitido de 5 MB.',
    };
  }

  return { ok: true };
}