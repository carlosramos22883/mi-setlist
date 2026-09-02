// ============================================================
// PDF SERVICE — cancionero profesional con pdfkit
// ============================================================
// La letra usa Courier (monoespaciada) para que los acordes
// queden alineados encima de su sílaba, como en un cancionero.
import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
// 🆕 El TIPO de instancia del documento (la clase es el valor)
type PdfDoc = InstanceType<typeof PDFDocument>;

interface ChordPos {
  col: number;
  text: string;
}
interface ParsedLine {
  text: string;
  chords: ChordPos[];
}

// "[D]Hola [A]mundo" → { text: 'Hola mundo', chords: [{0,'D'},{5,'A'}] }
function parseLine(line: string): ParsedLine {
  const chords: ChordPos[] = [];
  let text = '';
  const regex = /\[([^\]]+)\]/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(line)) !== null) {
    const before = line.slice(last, m.index);
    text += before;
    chords.push({ col: text.length, text: m[1] });
    last = m.index + m[0].length;
  }
  text += line.slice(last);
  return { text, chords };
}

// Parte líneas largas en varias, reubicando los acordes
function wrapLine(line: ParsedLine, maxCols: number): ParsedLine[] {
  if (line.text.length <= maxCols) return [line];
  const out: ParsedLine[] = [];
  let start = 0;
  while (start < line.text.length) {
    const end = Math.min(start + maxCols, line.text.length);
    out.push({
      text: line.text.slice(start, end),
      chords: line.chords
        .filter((ch) => ch.col >= start && ch.col < end)
        .map((ch) => ({ col: ch.col - start, text: ch.text })),
    });
    start = end;
  }
  return out;
}

@Injectable()
export class PdfService {
  // ---------------------------------------------------------
  // PDF de una canción (letra + acordes alineados)
  // ---------------------------------------------------------
  songPdf(song: any): PdfDoc {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    // Encabezado
    doc
      .font('Helvetica-Bold')
      .fontSize(20)
      .fillColor('#1F2937')
      .text(song.title, { align: 'center' });
    const sub = [song.artist, song.author].filter(Boolean).join(' · ');
    if (sub) {
      doc.font('Helvetica').fontSize(11).fillColor('#6B7280')
        .text(sub, { align: 'center' });
    }
    const meta = [
      song.songKey ? `Tono: ${song.songKey}` : null,
      song.bpm ? `${song.bpm} BPM` : null,
      song.genre,
    ].filter(Boolean).join('   ·   ');
    if (meta) {
      doc.fontSize(10).fillColor('#8B5CF6').text(meta, { align: 'center' });
    }
    doc.moveDown(1);

    // Cuerpo: Courier para alinear acordes
    const SIZE = 11;
    const LINE_H = 16;
    const CHORD_H = 13;
    doc.font('Courier').fontSize(SIZE);
    const charW = doc.widthOfString('M');
    const maxCols = Math.floor((doc.page.width - 100) / charW);

    let y = doc.y;
    const lines = (song.lyrics ?? '').split('\n');

    for (const raw of lines) {
      if (raw.trim() === '') {
        y += 10;
        continue;
      }
      const wrapped = wrapLine(parseLine(raw), maxCols);

      for (const ln of wrapped) {
        if (y > doc.page.height - 80) {
          doc.addPage();
          y = 50;
        }

        if (ln.chords.length > 0) {
          doc.font('Courier-Bold').fontSize(SIZE).fillColor('#2563EB');
          for (const ch of ln.chords) {
            doc.text(ch.text, 50 + ch.col * charW, y, { lineBreak: false });
          }
          y += CHORD_H;
          if (y > doc.page.height - 80) {
            doc.addPage();
            y = 50;
          }
        }

        doc.font('Courier').fontSize(SIZE).fillColor('#1F2937');
        doc.text(ln.text || ' ', 50, y, { lineBreak: false });
        y += LINE_H;
      }
    }

    // Pie
    doc.fontSize(8).fillColor('#9CA3AF')
      .text(
        'Mi SetList · Tu repertorio, en tu bolsillo',
        50,
        doc.page.height - 60,
        {
        align: 'center',
      });

    doc.end();
    return doc;
  }

  // ---------------------------------------------------------
  // PDF de un setlist (repertorio ordenado)
  // ---------------------------------------------------------
  setlistPdf(setlist: any): PdfDoc {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    doc
      .font('Helvetica-Bold')
      .fontSize(20)
      .fillColor('#1F2937')
      .text(setlist.name, { align: 'center' });
    if (setlist.description) {
      doc
        .font('Helvetica')
        .fontSize(11)
        .fillColor('#6B7280')
        .text(setlist.description, { align: 'center' });
    }
    doc.moveDown(1.5);

    const songs = [...(setlist.songs ?? [])].sort(
      (a: any, b: any) => a.position - b.position,
    );

    songs.forEach((link: any, i: number) => {
      if (doc.y > doc.page.height - 100) doc.addPage();
      const key = link.customKey ?? link.song?.songKey;
      doc.font('Helvetica-Bold').fontSize(13).fillColor('#1F2937')
        .text(`${i + 1}. ${link.song?.title ?? '—'}`, 60, doc.y, { continued: false });
      const detail = [key ? `Tono: ${key}` : null, link.song?.artist]
        .filter(Boolean).join('   ·   ');
      if (detail) {
        doc.font('Helvetica').fontSize(10).fillColor('#6B7280')
          .text(`     ${detail}`);
      }
      doc.moveDown(0.6);
    });

    doc.fontSize(8).fillColor('#9CA3AF')
      .text(
        'Mi SetList · Tu repertorio, en tu bolsillo',
        50,
        doc.page.height - 60,
        {
        align: 'center',
      });

    doc.end();
    return doc;
  }
}