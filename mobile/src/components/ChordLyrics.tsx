// ============================================================
// CHORD LYRICS — letra con acordes + tabs, transposición y tamaños
// ============================================================
// Acordes: [D]texto | Tabs: líneas "e|", "B|", "E!" | transpose: semitonos
// sizeLevel: 1 normal · 2 grande · 3 gigante (escenario)
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { colors, type Palette } from '../constants/theme';
import { transposeChord } from '../utils/transpose';

interface Segment {
  chord: string | null;
  text: string;
}

const TAB_REGEX = /^[eEbBgGdDaA]\s*[|!]/;

const SIZES = {
  1: { lyric: 15, lyricLH: 24, chord: 13, chordLH: 16, tab: 13, tabLH: 18 },
  2: { lyric: 22, lyricLH: 34, chord: 18, chordLH: 22, tab: 17, tabLH: 24 },
  3: { lyric: 28, lyricLH: 42, chord: 22, chordLH: 26, tab: 20, tabLH: 28 },
} as const;

export type SizeLevel = 1 | 2 | 3;

function parseLine(line: string): Segment[] {
  const parts = line.split(/(\[[^\]]+\])/);
  const segments: Segment[] = [];
  let pendingChord: string | null = null;

  for (const part of parts) {
    if (!part) continue;
    const m = part.match(/^\[([^\]]+)\]$/);
    if (m) {
      if (pendingChord !== null) segments.push({ chord: pendingChord, text: '' });
      pendingChord = m[1];
    } else {
      segments.push({ chord: pendingChord, text: part });
      pendingChord = null;
    }
  }
  if (pendingChord !== null) segments.push({ chord: pendingChord, text: '' });
  return segments;
}

interface Props {
  lyrics: string;
  showChords: boolean;
  transpose?: number;
  sizeLevel?: SizeLevel;
  forceDark?: boolean;
}

export default function ChordLyrics({
  lyrics,
  showChords,
  transpose = 0,
  sizeLevel = 1,
  forceDark = false,
}: Props) {
  const theme = useTheme();
  const c = forceDark ? colors.dark : theme.c;
  const s = buildStyles(c, sizeLevel);
  const lines = lyrics.split('\n');

  return (
    <View>
      {lines.map((line, i) => {
        if (line.trim() === '') return <View key={i} style={s.stanzaGap} />;

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

        if (!hasChords || !showChords) {
          return (
            <Text key={i} style={s.plainLine}>
              {segments.map((seg) => seg.text).join('')}
            </Text>
          );
        }

        return (
          <View key={i} style={s.lineRow}>
            {segments.map((seg, j) => (
              <View key={j} style={s.segment}>
                <Text style={s.chord}>
                  {seg.chord ? transposeChord(seg.chord, transpose) : ' '}
                </Text>
                <Text style={s.segmentText}>{seg.text}</Text>
              </View>
            ))}
          </View>
        );
      })}
    </View>
  );
}

const buildStyles = (c: Palette, level: SizeLevel) => {
  const z = SIZES[level];
  return StyleSheet.create({
    stanzaGap: { height: level === 1 ? 14 : 28 },
    plainLine: { color: c.text, fontSize: z.lyric, lineHeight: z.lyricLH },
    lineRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'flex-end',
      marginBottom: level === 1 ? 4 : 8,
    },
    segment: { marginRight: 0 },
    chord: { color: c.accent, fontSize: z.chord, fontWeight: '800', lineHeight: z.chordLH },
    segmentText: { color: c.text, fontSize: z.lyric, lineHeight: z.lyricLH },
    tabLine: {
      color: c.accent,
      fontSize: z.tab,
      lineHeight: z.tabLH,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
  });
};