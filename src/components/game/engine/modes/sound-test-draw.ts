/**
 * Sound-test footer / vote button paint specs (recovered Ri).
 */

export type FooterBtn = {
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
  stroke: string;
  label: string;
  labelColor: string;
  labelX: number;
  labelY: number;
};

export function commentsFooterButtons(opts: {
  mine: number | null;
  y?: number;
}): FooterBtn[] {
  const y = opts.y ?? 360;
  const h = 22;
  const w = 46.5;
  const base = 58;
  const gap = 50.5;
  const mk = (
    i: number,
    fill: string,
    stroke: string,
    label: string,
    labelColor: string,
  ): FooterBtn => {
    const x = base + i * gap;
    return {
      x,
      y,
      w,
      h,
      fill,
      stroke,
      label,
      labelColor,
      labelX: x + w / 2,
      labelY: 366,
    };
  };
  return [
    mk(
      0,
      opts.mine === 1 ? "#204020" : "#152018",
      opts.mine === 1 ? "#88ff88" : "#446644",
      "👍",
      "#ccffcc",
    ),
    mk(
      1,
      opts.mine === -1 ? "#402020" : "#201518",
      opts.mine === -1 ? "#ff8888" : "#664444",
      "👎",
      "#ffcccc",
    ),
    mk(2, "#1a4030", "#66cc88", "✍", "#ccffdd"),
    mk(3, "#203040", "#6688aa", "◀", "#aaccff"),
  ];
}

export function playingFooterButtons(opts: {
  likes: number;
  dislikes: number;
  mine: number | null;
  y?: number;
}): FooterBtn[] {
  const y = opts.y ?? 360;
  const h = 22;
  const w = 196 / 3;
  const base = 58;
  const items: [string, string, string, string][] = [
    [
      opts.mine === 1 ? "#204020" : "#152018",
      opts.mine === 1 ? "#88ff88" : "#446644",
      `👍${opts.likes}`,
      opts.mine === 1 ? "#ccffcc" : "#88aa88",
    ],
    [
      opts.mine === -1 ? "#402020" : "#201518",
      opts.mine === -1 ? "#ff8888" : "#664444",
      `👎 ${opts.dislikes}`,
      opts.mine === -1 ? "#ffcccc" : "#aa8888",
    ],
    ["#1a3028", "#55aa77", "💬感想", "#aaffee"],
  ];
  return items.map(([fill, stroke, label, labelColor], i) => {
    const x = base + i * w;
    return {
      x,
      y,
      w,
      h,
      fill,
      stroke,
      label,
      labelColor,
      labelX: x + w / 2,
      labelY: 366,
    };
  });
}

export function soundTestListTop(
  playing: boolean,
  cardHeight: number,
): { listTop: number; ratingY: number | null; hintY: number | null } {
  if (playing) {
    const e = 38 + cardHeight + 4;
    return { listTop: e + 8, ratingY: e - 2, hintY: null };
  }
  return { listTop: 58, ratingY: null, hintY: 48 };
}
