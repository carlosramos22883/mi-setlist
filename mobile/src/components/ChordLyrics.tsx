// ============================================================
// CHORD LYRICS — letra con acordes encima + tabs (ChordPro)
// ============================================================
// Acordes: [D]texto [A]texto  → el acorde se pinta encima y el
//          texto queda LIMPIO (sin corchetes) en ambos modos.
// Tabs:    líneas que inician con "e|", "B|", "E!" → monoespaciadas.
// Modo limpio (showChords=false): solo letra, sin notación.
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import type { Palette } from '../constants/theme';
import { transposeChord } from '../utils/transpose';

interface Segment {
  chord: string | null;
  text: string;
}

// Detecta tablatura: "e|---", "B|-1-1", "E!---" ...
const TAB_REGEX = /^[eEbBgGdDaA]\s*[|!]/;

// "[D]Hola [A]mundo" → [{chord:'D', text:'Hola '}, {chord:'A', text:'mundo'}]
// Los corchetes NUNCA llegan al texto renderizado.
function parseLine(line: string): Segment[] {
  const parts = line.split(/(\[[^\]]+\])/); // separa y conserva [acordes]
  const segments: Segment[] = [];
  let pendingChord: string | null = null;

  for (const part of parts) {
    if (!part) continue;
    const m = part.match(/^\[([^\]]+)\]$/);
    if (m) {
      // Es un marcador de acorde
      if (pendingChord !== null) {
        segments.push({ chord: pendingChord, text: '' }); // acorde seguido de acorde
      }
      pendingChord = m[1];
    } else {
      // Es texto: se lleva el acorde pendiente encima
      segments.push({ chord: pendingChord, text: part });
      pendingChord = null;
    }
  }
  if (pendingChord !== null) {
    segments.push({ chord: pendingChord, text: '' }); // acorde al final de línea
  }
  return segments;
}

interface Props {
  lyrics: string;
  showChords: boolean;
  transpose?: number;
}

export default function ChordLyrics({ lyrics, showChords, transpose = 0 }: Props) {
  const { c } = useTheme();
  const s = buildStyles(c);
  const lines = lyrics.split('\n');

  return (
    <View>
      {lines.map((line, i) => {
        // Línea vacía = separador de estrofas
        if (line.trim() === '') return <View key={i} style={s.stanzaGap} />;

        // 🎸 Tablatura: monoespaciada (se oculta en modo limpio)
        if (TAB_REGEX.test(line.trim())) {
          if (!showChords) return null;
          return (
            <Text key={i} style={s.tabLine}>
              {line}
            </Text>
          );
        }

        const segments = parseLine(line);
        const hasChords = segments.some((seg) => seg.chord !== null);

        // Línea sin acordes, o modo limpio: texto SIN corchetes
        if (!hasChords || !showChords) {
          return (
            <Text key={i} style={s.plainLine}>
              {segments.map((seg) => seg.text).join('')}
            </Text>
          );
        }

        // Línea con acordes: acorde encima de su sílaba, texto limpio
        return (
          <View key={i} style={s.lineRow}>
            {segments.map((seg, j) => (
              <View key={j} style={s.segment}>                
                <Text style={s.chord}>{transposeChord(seg.chord ?? '', transpose)}</Text>
                <Text style={s.segmentText}>{seg.text}</Text>
              </View>
            ))}
          </View>
        );
      })}
    </View>
  );
}

const buildStyles = (c: Palette) =>
  StyleSheet.create({
    stanzaGap: { height: 14 },
    plainLine: { color: c.text, fontSize: 15, lineHeight: 24 },
    lineRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'flex-end',
      marginBottom: 4,
    },
    segment: { marginRight: 0 },
    chord: { color: c.accent, fontSize: 13, fontWeight: '800', lineHeight: 16 },
    segmentText: { color: c.text, fontSize: 15, lineHeight: 22 },
    tabLine: {
      color: c.accent,
      fontSize: 13,
      lineHeight: 18,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
  });