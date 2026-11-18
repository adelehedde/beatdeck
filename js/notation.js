// Gravure de la partition avec VexFlow (police Bravura), mesure par mesure, dans des images mises en cache.
// Chaque note est placée proportionnellement au temps : le curseur passe exactement sur la tête de note.

const VF = window.VexFlow;
const { Renderer, Stave, StaveNote, Beam, Tuplet, Dot, TickContext, Barline } = VF;

export const OFFSET = 0.14; // place de la tête de note dans sa case (en temps)
const STAVE_SPACING = 10; // interligne VexFlow, en unités logiques

export function fontsReady() {
  return document.fonts.load('30px Bravura').catch(() => {});
}

// Valeur écrite d'une durée (dans un triolet, 1/3 de temps s'écrit comme une croche).
function vfDuration(d, tuplet) {
  const v = tuplet ? d * 1.5 : d;
  const table = [
    [4, 'w', 0],
    [3, 'h', 1],
    [2, 'h', 0],
    [1.5, 'q', 1],
    [1, 'q', 0],
    [0.75, '8', 1],
    [0.5, '8', 0],
    [0.375, '16', 1],
    [0.25, '16', 0],
    [0.125, '32', 0],
  ];
  const hit = table.find(([len]) => Math.abs(len - v) < 1e-3) || [0, '16', 0];
  return { dur: hit[1], dots: hit[2] };
}

// Grave une mesure. Retourne l'image et la position de chaque note (en px CSS, relatifs à la mesure).
export function engraveMeasure(m, { width, height, scale, ink = '#f4eaff', colorOf = null, dpr = 1, barline = true, staff = true, center = false }) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(width * dpr);
  canvas.height = Math.ceil(height * dpr);
  const heads = [];
  if (m.countIn || !m.blocs.length) return { canvas, heads };

  const renderer = new Renderer(canvas, Renderer.Backends.CANVAS);
  const ctx = renderer.getContext();
  ctx.scale(dpr * scale, dpr * scale);
  ctx.setFillStyle(ink);
  ctx.setStrokeStyle(ink);
  const W = width / scale;
  const staffY = (height * 0.56) / scale;

  const stave = new Stave(0, 0, W, { spaceAboveStaffLn: 0 });
  const midLine = stave.getYForLine(2);
  stave.setY(staffY - midLine);
  stave.setConfigForLines([0, 1, 2, 3, 4].map((l) => ({ visible: staff && l === 2 })));
  stave.setBegBarType(Barline.type.NONE);
  stave.setEndBarType(barline ? Barline.type.SINGLE : Barline.type.NONE);
  stave.setNoteStartX(0);
  stave.setContext(ctx).draw();

  const bw = W / m.sig;
  const all = [];
  const beams = [];
  const tuplets = [];

  for (const bloc of m.blocs) {
    const fig = bloc.fig;
    const group = [];
    let ni = 0;
    for (const it of fig.items) {
      const { dur, dots } = vfDuration(it.d, fig.tuplet);
      const note = new StaveNote({ keys: ['b/4'], duration: it.rest ? `${dur}r` : dur, stemDirection: 1, dots });
      if (dots) Dot.buildAndAttach([note], { all: true });
      const noteId = it.rest ? null : bloc.noteIds[ni++];
      const c = colorOf && noteId !== null ? colorOf(bloc.startBeat + it.at, fig.tuplet) : ink;
      note.setStyle({ fillStyle: c, strokeStyle: c });
      note.setStave(stave);
      note.setContext(ctx);
      const tc = new TickContext();
      tc.addTickable(note).preFormat();
      // Cible : la tête de note centrée sur sa position dans le temps.
      // « center » (cartes) : la cellule est centrée, ses notes réparties selon leur place dans le temps.
      const target = center
        ? bw * (fig.items.length === 1 ? 0.5 : 0.24 + (0.52 * it.at) / Math.max(...fig.items.map((x) => x.at)))
        : (bloc.startBeat + it.at + OFFSET) * bw;
      tc.setX(0);
      const headW = note.getNoteHeadEndX() - note.getNoteHeadBeginX();
      const dx = target - (note.getNoteHeadBeginX() + headW / 2);
      tc.setX(dx);
      all.push(note);
      group.push({ note, it, noteId });
      if (noteId !== null) heads.push({ id: noteId, x: target * scale, y: staffY * scale });
    }
    const notes = group.filter((g) => !g.it.rest).map((g) => g.note);
    const beamable = fig.beats === 1 && notes.length >= 2 && group.every((g) => g.it.rest || vfDuration(g.it.d, fig.tuplet).dur !== 'q');
    if (beamable) beams.push(new Beam(group.map((g) => g.note).filter((n, i) => !group[i].it.rest || (i > 0 && i < group.length - 1))));
    if (fig.tuplet) {
      tuplets.push(new Tuplet(group.map((g) => g.note), { numNotes: fig.tuplet, notesOccupied: fig.tuplet === 3 ? 2 : 4, bracketed: !beamable, ratioed: false }));
    }
  }

  for (const n of all) n.draw();
  for (const b of beams) b.setContext(ctx).draw();
  for (const t of tuplets) t.setContext(ctx).draw();
  return { canvas, heads };
}
