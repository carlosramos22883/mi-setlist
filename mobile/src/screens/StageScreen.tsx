// ============================================================
// STAGE SCREEN — modo escenario: letra grande, transposición,
// auto-scroll y tema oscuro forzado (para tocar en vivo)
// ============================================================
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Platform, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SongsService from '../services/songs.service';
import * as SetlistsService from '../services/setlists.service';
import type { SetlistSong } from '../services/setlists.service';
import { colors } from '../constants/theme';
import ChordLyrics, { type SizeLevel } from '../components/ChordLyrics';

const c = colors.dark; //  tema forzado: el escenario es oscuro

interface Props {
  songId?: string;
  setlistId?: string;
  groupName?: string;
  onBack: () => void;
}

export default function StageScreen({ songId, setlistId, groupName, onBack }: Props) {
  const [links, setLinks] = useState<SetlistSong[] | null>(null); // modo setlist
  const [soloSong, setSoloSong] = useState<any | null>(null); // modo canción
  const [setlistName, setSetlistName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);

  const [transpose, setTranspose] = useState(0);
  const [sizeLevel, setSizeLevel] = useState<SizeLevel>(2);
  const [showChords, setShowChords] = useState(true);

  const [scrolling, setScrolling] = useState(false);
  const [speed, setSpeed] = useState(2);
  const scrollRef = useRef<ScrollView>(null);
  const offsetRef = useRef(0);

  // Carga: setlist (canciones ordenadas) o canción suelta
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        if (setlistId) {
          const sl = await SetlistsService.getSetlist(setlistId);
          setSetlistName(sl.name);
          setLinks(sl.songs);
        } else if (songId) {
          setSoloSong(await SongsService.getSong(songId));
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [songId, setlistId]);

  // Al cambiar de canción: reset de tono y scroll
  useEffect(() => {
    setTranspose(0);
    setScrolling(false);
    offsetRef.current = 0;
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [index]);

  // Auto-scroll: intervalo que baja el ScrollView
  useEffect(() => {
    if (!scrolling) return;
    const id = setInterval(() => {
      offsetRef.current += speed * 0.6;
      scrollRef.current?.scrollTo({ y: offsetRef.current, animated: false });
    }, 30);
    return () => clearInterval(id);
  }, [scrolling, speed]);

  // Registrar el offset cuando el usuario hace scroll manual
  function handleScroll(e: any) {
    if (!scrolling) offsetRef.current = e.nativeEvent.contentOffset.y;
  }

  // Pantalla completa en web
  function toggleFullscreen() {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen();
  }

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={c.primary} />
      </View>
    );
  }

  const song = links ? links[index]?.song : soloSong;
  const link = links?.[index];

  if (!song) {
    return (
      <View style={s.center}>
        <Text style={s.empty}>Nada que mostrar</Text>
        <TouchableOpacity onPress={onBack} style={{ marginTop: 16 }}>
          <Text style={s.backLink}>← Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const total = links ? links.length : 1;

  return (
    <View style={s.root}>
      {/* Barra superior */}
      <View style={s.topBar}>
        <TouchableOpacity style={s.iconBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={22} color={c.text} />
        </TouchableOpacity>
        <View style={s.titleBox}>
          <Text style={s.title} numberOfLines={1}>{song.title}</Text>
          <Text style={s.subtitle} numberOfLines={1}>
            {setlistName ? `${setlistName} · ${index + 1}/${total}` : groupName ?? ''}
          </Text>
        </View>
        <TouchableOpacity style={s.iconBtn} onPress={() => setShowChords((v) => !v)}>
          <Ionicons
            name={showChords ? 'musical-notes' : 'musical-notes-outline'}
            size={22}
            color={showChords ? c.accent : c.text}
          />
        </TouchableOpacity>
        <TouchableOpacity style={s.iconBtn} onPress={toggleFullscreen}>
          <Ionicons name="expand-outline" size={22} color={c.text} />
        </TouchableOpacity>
      </View>

      {/* Barra de controles */}
      <View style={s.controlBar}>
        <View style={s.controlGroup}>
          <Text style={s.controlLabel}>Tono</Text>
          <TouchableOpacity style={s.miniBtn} onPress={() => setTranspose((t) => Math.max(-6, t - 1))}>
            <Text style={s.miniBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={s.controlValue}>{transpose > 0 ? `+${transpose}` : transpose}</Text>
          <TouchableOpacity style={s.miniBtn} onPress={() => setTranspose((t) => Math.min(6, t + 1))}>
            <Text style={s.miniBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        <View style={s.controlGroup}>
          <Text style={s.controlLabel}>Texto</Text>
          <TouchableOpacity style={s.miniBtn} onPress={() => setSizeLevel((l) => (l > 1 ? ((l - 1) as SizeLevel) : l))}>
            <Text style={s.miniBtnText}>A−</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.miniBtn} onPress={() => setSizeLevel((l) => (l < 3 ? ((l + 1) as SizeLevel) : l))}>
            <Text style={s.miniBtnText}>A+</Text>
          </TouchableOpacity>
        </View>

        <View style={s.controlGroup}>
          <Text style={s.controlLabel}>Scroll</Text>
          <TouchableOpacity style={s.miniBtn} onPress={() => setSpeed((v) => Math.max(1, v - 1))}>
            <Text style={s.miniBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={s.controlValue}>{speed}</Text>
          <TouchableOpacity style={s.miniBtn} onPress={() => setSpeed((v) => Math.min(5, v + 1))}>
            <Text style={s.miniBtnText}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.miniBtn, scrolling && s.miniBtnActive]}
            onPress={() => setScrolling((v) => !v)}
          >
            <Text style={s.miniBtnText}>{scrolling ? '⏸' : '▶'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Letra */}
      <ScrollView
        ref={scrollRef}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={s.lyricsWrap}
      >
        {link?.customKey && (
          <Text style={s.keyHint}>🎵 Tono para este setlist: {link.customKey}</Text>
        )}
        <ChordLyrics
          lyrics={song.lyrics}
          showChords={showChords}
          transpose={transpose}
          sizeLevel={sizeLevel}
          forceDark
        />
        <View style={{ height: 240 }} />
      </ScrollView>

      {/* Barra inferior: navegación de setlist */}
      {total > 1 && (
        <View style={s.bottomBar}>
          <TouchableOpacity
            style={[s.navBtn, index === 0 && s.navDisabled]}
            disabled={index === 0}
            onPress={() => setIndex((i) => i - 1)}
          >
            <Text style={s.navBtnText}>← Anterior</Text>
          </TouchableOpacity>
          <Text style={s.counter}>{index + 1} / {total}</Text>
          <TouchableOpacity
            style={[s.navBtn, index === total - 1 && s.navDisabled]}
            disabled={index === total - 1}
            onPress={() => setIndex((i) => i + 1)}
          >
            <Text style={s.navBtnText}>Siguiente →</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  center: { flex: 1, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center' },
  empty: { color: c.textMuted },
  backLink: { color: c.accent, fontWeight: '700' },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: c.surface,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  titleBox: { flex: 1, alignItems: 'center' },
  title: { color: c.text, fontSize: 17, fontWeight: '800' },
  subtitle: { color: c.textMuted, fontSize: 11 },
  iconBtn: { padding: 8 },

  controlBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: c.surface,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
    flexWrap: 'wrap',
    gap: 8,
  },
  controlGroup: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  controlLabel: { color: c.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  controlValue: { color: c.accent, fontSize: 14, fontWeight: '800', minWidth: 24, textAlign: 'center' },
  miniBtn: {
    backgroundColor: c.surface2,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: c.border,
  },
  miniBtnActive: { backgroundColor: c.primary, borderColor: c.primary },
  miniBtnText: { color: c.text, fontSize: 13, fontWeight: '800' },

  lyricsWrap: { padding: 20 },
  keyHint: { color: c.accent, fontSize: 14, fontWeight: '700', marginBottom: 16 },

  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: c.surface,
    borderTopWidth: 1,
    borderTopColor: c.border,
  },
  navBtn: {
    backgroundColor: c.primary,
    borderRadius: 9999,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  navDisabled: { opacity: 0.35 },
  navBtnText: { color: '#FFFFFF', fontWeight: '700' },
  counter: { color: c.textSecondary, fontWeight: '700' },
});