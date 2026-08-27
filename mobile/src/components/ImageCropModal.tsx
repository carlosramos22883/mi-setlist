// ============================================================
// IMAGE CROP MODAL (nativo) — no se usa: el SO ya recorta
// ============================================================
// En iOS/Android el picker con allowsEditing muestra el
// recortador nativo, así que este modal nunca se muestra.
import React from 'react';
import { View } from 'react-native';

export default function ImageCropModal(_props: {
  visible: boolean;
  imageUri: string | null;
  round?: boolean;
  onDone: (d: string) => void;
  onCancel: () => void;
}) {
  return <View />;
}