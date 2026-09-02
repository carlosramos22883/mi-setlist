// ============================================================
// TRANSPOSE — mover acordes N semitonos (para el escenario)
// ============================================================
// "D" +2 → "E" | "F#m" -1 → "Fm" | "Bb7" +2 → "C7" | "D/F#" +1 → "Eb/G"
const SHARP_SCALE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_SCALE = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

const NOTE_INDEX: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5,
  'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11, Cb: 11,
};

// Transpone todas las notas del acorde (raíz y bajo "D/F#")
export function transposeChord(chord: string, semitones: number): string {
  if (!semitones) return chord;
  const shift = ((semitones % 12) + 12) % 12;
  return chord.replace(/[A-G](?:#|b)?/g, (note) => {
    const idx = NOTE_INDEX[note];
    if (idx === undefined) return note;
    const scale = note.includes('b') ? FLAT_SCALE : SHARP_SCALE;
    return scale[(idx + shift) % 12];
  });
}