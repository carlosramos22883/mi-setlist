// ============================================================
// IMAGE CROP MODAL (solo web) — recorte interactivo tipo Croppie
// ============================================================
// Zoom + arrastre + viewport cuadrado/circular. Al guardar,
// recorta con canvas y devuelve un dataURL listo para subir.
import React, { useCallback, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Cropper, { type Area } from 'react-easy-crop';
import { useTheme } from '../context/ThemeContext';

interface Props {
  visible: boolean;
  imageUri: string | null;
  round?: boolean;
  onDone: (croppedDataUrl: string) => void;
  onCancel: () => void;
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', reject);
    image.src = url;
  });
}

// Recorte con canvas usando los píxeles que eligió el usuario
async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, pixelCrop.width, pixelCrop.height,
  );
  return canvas.toDataURL('image/jpeg', 0.92);
}

export default function ImageCropModal({ visible, imageUri, round = false, onDone, onCancel }: Props) {
  const { c } = useTheme();
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setArea(croppedAreaPixels);
  }, []);

  async function handleSave() {
    if (!imageUri || !area) return;
    setSaving(true);
    try {
      const dataUrl = await getCroppedImg(imageUri, area);
      onDone(dataUrl);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={s.overlay}>
        <View style={[s.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[s.title, { color: c.text }]}>Recortar imagen</Text>
          <Text style={[s.subtitle, { color: c.textSecondary }]}>
            Arrastra para centrar y usa el control para hacer zoom
          </Text>

          <View style={s.cropperWrap}>
            {imageUri !== null && (
              <Cropper
                image={imageUri}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape={round ? 'round' : 'rect'}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            )}
          </View>

          <View style={s.actions}>
            <TouchableOpacity
              style={[s.btn, { backgroundColor: c.surface2, borderWidth: 1, borderColor: c.border }]}
              onPress={onCancel}
            >
              <Text style={{ color: c.text, fontWeight: '600' }}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.btn, { backgroundColor: c.primary }]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Guardar y recortar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 24 },
  card: { borderRadius: 16, borderWidth: 1, padding: 20 },
  title: { fontSize: 18, fontWeight: '700' },
  subtitle: { fontSize: 12, marginTop: 4, marginBottom: 16 },
  cropperWrap: { height: 320, borderRadius: 12, overflow: 'hidden', backgroundColor: '#000' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 16 },
  btn: { borderRadius: 9999, paddingHorizontal: 18, paddingVertical: 12 },
});