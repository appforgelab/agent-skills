#!/usr/bin/env node
// Measures rendered spacing rhythm and alignment on one UI screenshot, from
// any platform: a web page, a desktop app, a phone screen. The output is for
// the orchestrator of a rating run only: raters never see it.
//
// Usage:
//   node measure.mjs <shot.png> [<tree.json|.xml>] [options]
//
// The screenshot alone is enough: it is cut into blocks on its blank rows
// and columns, letters merged into words, cards and filled buttons opened
// up against their own fill. An element tree is optional: any JSON or XML
// whose elements carry rects as {x, y, width, height}, {left, top, right,
// bottom} or "[l,t][r,b]", such as an accessibility snapshot or a DOM
// dump. A tree adds readable names, layout boxes and containers the shot
// alone cannot show; the shot's blocks are still measured either way, so
// ink detail inside a painted box, such as a button's label, is never
// lost by adding one.
//
// Every element's box is trimmed to its ink — the pixels that differ from
// the background behind it — so gaps are what a viewer sees, not layout
// boxes: padding, minimum hit areas and line height drop out.
//
// Options:
//   --scale N         screenshot pixels per layout unit (CSS px, dp, pt): the
//                     device pixel ratio of the capture — 1 for a standard
//                     desktop capture, 2 for HiDPI, about 3 for a phone.
//                     With a tree, it is inferred from the tree when the
//                     tree is in layout units. Without either, values are
//                     in screenshot pixels.
//   --tree-scale N    screenshot pixels per tree unit, if inference fails.
//   --ignore-top U    skip U units at the top (a system bar, browser chrome).
//   --ignore-bottom U skip U units at the bottom.
//   --json FILE       write every measurement and finding as JSON.
//   --overlay FILE    write a copy of the shot with the findings drawn on it.
//   --equal R         gap ratios below R count as equal (default 1.2).
//   --step R          ratios from R up count as a deliberate step (default 1.75).
//   --min-delta U     differences under U units count as equal (default 3).
//   --align U         edges within U units are aligned (default 2).
//   --near U          edges off by more than --align, up to U, are near
//                     misses (default 8).
//   --tolerance N     per-channel colour difference that counts as ink
//                     (default 10, low enough to see a white card on an
//                     off-white page).
//
// Needs Node 18 or later and nothing else.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { deflateSync, inflateSync } from "node:zlib";
import { parseArgs } from "node:util";

const { values: opt, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    scale: { type: "string" },
    "tree-scale": { type: "string" },
    "ignore-top": { type: "string", default: "0" },
    "ignore-bottom": { type: "string", default: "0" },
    json: { type: "string" },
    overlay: { type: "string" },
    equal: { type: "string", default: "1.2" },
    step: { type: "string", default: "1.75" },
    "min-delta": { type: "string", default: "3" },
    align: { type: "string", default: "2" },
    near: { type: "string", default: "8" },
    tolerance: { type: "string", default: "10" },
    help: { type: "boolean", short: "h" },
  },
});

if (opt.help || positionals.length < 1 || positionals.length > 2) {
  const head = readFileSync(new URL(import.meta.url), "utf8").split("\n");
  const end = head.findIndex((line, i) => i > 0 && !line.startsWith("//"));
  console.log(head.slice(1, end).map((line) => line.replace(/^\/\/ ?/, "")).join("\n"));
  process.exit(opt.help ? 0 : 2);
}

const num = (name) => {
  const value = Number(opt[name]);
  if (!Number.isFinite(value) || value < 0) fatal(`--${name} must be a non-negative number`);
  return value;
};
const EQUAL = num("equal");
const STEP = num("step");
const MIN_DELTA = num("min-delta");
const ALIGN = num("align");
const NEAR = num("near");
const TOL = num("tolerance");

function fatal(message) {
  console.error(`measure: ${message}`);
  process.exit(1);
}

function read(path, encoding) {
  try {
    return readFileSync(path, encoding);
  } catch (error) {
    return fatal(`cannot read ${path}: ${error.code ?? error.message}`);
  }
}

// ---------------------------------------------------------------- PNG I/O

function readPng(path) {
  const buf = read(path);
  if (buf.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") fatal(`${path} is not a PNG`);
  let pos = 8;
  let width, height, depth, type, interlace, palette;
  const idat = [];
  while (pos + 8 <= buf.length) {
    const len = buf.readUInt32BE(pos);
    const kind = buf.toString("latin1", pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (kind === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      depth = data[8];
      type = data[9];
      interlace = data[12];
    } else if (kind === "PLTE") palette = data;
    else if (kind === "IDAT") idat.push(data);
    else if (kind === "IEND") break;
    pos += 12 + len;
  }
  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[type];
  if (interlace) fatal(`${path} is interlaced; save it without interlacing`);
  if (!channels || (depth !== 8 && depth !== 16) || (type === 3 && depth !== 8)) {
    fatal(`${path}: unsupported PNG (colour type ${type}, ${depth}-bit)`);
  }
  const step = depth / 8;
  const bpp = channels * step;
  const stride = width * bpp;
  const raw = inflateSync(Buffer.concat(idat));
  const rgb = new Uint8Array(width * height * 3);
  let prev = new Uint8Array(stride);
  for (let y = 0; y < height; y++) {
    const start = y * (stride + 1);
    const filter = raw[start];
    const row = raw.subarray(start + 1, start + 1 + stride);
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? row[i - bpp] : 0;
      const b = prev[i];
      const c = i >= bpp ? prev[i - bpp] : 0;
      let v = row[i];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      } else if (filter !== 0) fatal(`${path}: bad PNG filter ${filter}`);
      row[i] = v & 255;
    }
    for (let x = 0; x < width; x++) {
      const o = (y * width + x) * 3;
      const s = x * bpp;
      if (type === 2 || type === 6) {
        rgb[o] = row[s];
        rgb[o + 1] = row[s + step];
        rgb[o + 2] = row[s + 2 * step];
      } else if (type === 3) {
        const p = row[s] * 3;
        rgb[o] = palette[p];
        rgb[o + 1] = palette[p + 1];
        rgb[o + 2] = palette[p + 2];
      } else {
        rgb[o] = rgb[o + 1] = rgb[o + 2] = row[s];
      }
    }
    prev = row;
  }
  return { width, height, rgb };
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(bytes) {
  let c = 0xffffffff;
  for (const byte of bytes) c = CRC_TABLE[(c ^ byte) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function writePng(path, width, height, rgb) {
  const stride = width * 3;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw.set(rgb.subarray(y * stride, (y + 1) * stride), y * (stride + 1) + 1);
  }
  const chunk = (kind, data) => {
    const body = Buffer.concat([Buffer.from(kind, "latin1"), data]);
    const out = Buffer.alloc(body.length + 8);
    out.writeUInt32BE(data.length, 0);
    body.copy(out, 4);
    out.writeUInt32BE(crc32(body), body.length + 4);
    return out;
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  writeFileSync(
    path,
    Buffer.concat([
      Buffer.from("89504e470d0a1a0a", "hex"),
      chunk("IHDR", ihdr),
      chunk("IDAT", deflateSync(raw)),
      chunk("IEND", Buffer.alloc(0)),
    ]),
  );
}

// ---------------------------------------------------------------- geometry

const LABEL_KEYS = [
  "label", "text", "value", "name", "contentDescription", "content-desc",
  "accessibilityLabel", "title", "alt", "identifier", "resourceId", "resource-id", "id",
];
const ROLE_KEYS = ["role", "type", "elementType", "className", "class", "tag"];
const RECT_KEYS = ["rect", "frame", "bounds", "boundingBox", "box"];
const isNum = (v) => typeof v === "number" && Number.isFinite(v);
const BOUNDS = /\[(-?[\d.]+),(-?[\d.]+)\]\[(-?[\d.]+),(-?[\d.]+)\]/;

function asRect(v) {
  if (typeof v === "string") {
    const m = BOUNDS.exec(v);
    if (!m) return null;
    const [l, t, r, b] = m.slice(1).map(Number);
    return { x: l, y: t, w: r - l, h: b - t };
  }
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  const w = v.width ?? v.w;
  const h = v.height ?? v.h;
  if (isNum(v.x) && isNum(v.y) && isNum(w) && isNum(h)) return { x: v.x, y: v.y, w, h };
  if (isNum(v.left) && isNum(v.top) && isNum(v.right) && isNum(v.bottom)) {
    return { x: v.left, y: v.top, w: v.right - v.left, h: v.bottom - v.top };
  }
  return null;
}

const tidy = (s) => String(s).replace(/\s+/g, " ").trim().slice(0, 40);
const shortName = (s) => tidy(String(s).split(/[/.:]/).pop());

function pick(o, keys, clean) {
  for (const k of keys) {
    if (typeof o[k] === "string" && o[k].trim()) return clean(o[k]);
  }
  return "";
}

function readGeometry(path) {
  const text = read(path, "utf8").trim();
  const nodes = [];
  let width = null;
  if (text.startsWith("<")) {
    const unescape = (s) =>
      s.replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">").replace(/&#10;/g, " ").replace(/&amp;/g, "&");
    for (const m of text.matchAll(/<node\b([^>]*)>/g)) {
      const attrs = {};
      for (const a of m[1].matchAll(/([\w:-]+)="([^"]*)"/g)) attrs[a[1]] = unescape(a[2]);
      const rect = asRect(attrs.bounds ?? "");
      if (!rect) continue;
      nodes.push({
        ...rect,
        label: tidy(attrs.text || attrs["content-desc"] || "") || shortName(attrs["resource-id"] || ""),
        role: shortName(attrs.class || "node"),
      });
    }
  } else {
    let doc;
    try {
      doc = JSON.parse(text);
    } catch (error) {
      fatal(`${path} is neither XML nor JSON: ${error.message}`);
    }
    const top = doc && typeof doc === "object" ? doc : {};
    const w = top.width ?? top.viewport?.width ?? top.viewportWidth;
    if (isNum(w) && w > 0) width = w;
    const walk = (o) => {
      if (Array.isArray(o)) return o.forEach(walk);
      if (!o || typeof o !== "object") return;
      let rect = null;
      for (const k of RECT_KEYS) rect ??= asRect(o[k]);
      if (!rect && o !== top) rect = asRect(o);
      if (rect) {
        nodes.push({
          ...rect,
          label: pick(o, LABEL_KEYS, tidy),
          role: pick(o, ROLE_KEYS, shortName) || "node",
        });
      }
      for (const [k, v] of Object.entries(o)) {
        if (!RECT_KEYS.includes(k) && v && typeof v === "object") walk(v);
      }
    };
    walk(doc);
  }
  if (nodes.length === 0) fatal(`${path}: no element rects found`);
  return { nodes, width };
}

// ---------------------------------------------------------------- pixels

const img = readPng(positionals[0]);
const W = img.width;
const H = img.height;
const PX = img.rgb;

const isInk = (o, bg) =>
  Math.abs(PX[o] - bg[0]) > TOL || Math.abs(PX[o + 1] - bg[1]) > TOL || Math.abs(PX[o + 2] - bg[2]) > TOL;

function modeColour(samples) {
  const counts = new Map();
  let best = null;
  let bestCount = 0;
  for (const o of samples) {
    const key = (PX[o] << 16) | (PX[o + 1] << 8) | PX[o + 2];
    const n = (counts.get(key) ?? 0) + 1;
    counts.set(key, n);
    if (n > bestCount) {
      bestCount = n;
      best = key;
    }
  }
  return best === null ? null : [(best >> 16) & 255, (best >> 8) & 255, best & 255];
}

// The background an element sits on, from a ring just outside its box. A
// neighbour's hairline separator can win that ring, so when the element's
// own edge colour is common in the ring too, that colour is the backdrop.
// A painted element (a filled button, a bordered card) has an edge colour
// its ring lacks, and keeps the ring's commonest colour. A box that fills
// the shot falls back to its own border.
function ringBackground(b) {
  const samples = [];
  const add = (x, y) => {
    if (x >= 0 && y >= 0 && x < W && y < H) samples.push((y * W + x) * 3);
  };
  const reach = Math.max(2, Math.round(1.5 * unit));
  for (let d = 1; d <= reach; d++) {
    for (let x = b.x0 - d; x < b.x1 + d; x++) {
      add(x, b.y0 - d);
      add(x, b.y1 - 1 + d);
    }
    for (let y = b.y0; y < b.y1; y++) {
      add(b.x0 - d, y);
      add(b.x1 - 1 + d, y);
    }
  }
  if (samples.length === 0) return borderBackground(b, 0);
  const ring = modeColour(samples);
  const edge = borderBackground(b, 0);
  if (!edge || colourDiff(edge, ring) <= TOL) return ring;
  const near = samples.filter((o) => colourDiff([PX[o], PX[o + 1], PX[o + 2]], edge) <= TOL).length;
  return near >= 0.2 * samples.length ? edge : ring;
}

function borderBackground(b, inset) {
  const samples = [];
  const x0 = b.x0 + inset;
  const x1 = b.x1 - 1 - inset;
  const y0 = b.y0 + inset;
  const y1 = b.y1 - 1 - inset;
  if (x1 <= x0 || y1 <= y0) return null;
  for (let x = x0; x <= x1; x++) samples.push((y0 * W + x) * 3, (y1 * W + x) * 3);
  for (let y = y0; y <= y1; y++) samples.push((y * W + x0) * 3, (y * W + x1) * 3);
  return modeColour(samples);
}

// Bounding box of the ink inside b, skipping pixels inside any of `skip`.
function inkBox(b, bg, skip = []) {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -1;
  let y1 = -1;
  let count = 0;
  for (let y = b.y0; y < b.y1; y++) {
    const holes = skip.filter((s) => y >= s.y0 && y < s.y1);
    let o = (y * W + b.x0) * 3;
    for (let x = b.x0; x < b.x1; x++, o += 3) {
      if (!isInk(o, bg)) continue;
      if (holes.length && holes.some((s) => x >= s.x0 && x < s.x1)) continue;
      count++;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      y1 = y;
    }
  }
  if (count === 0) return null;
  const box = { x0, y0, x1: x1 + 1, y1: y1 + 1 };
  box.density = count / ((box.x1 - box.x0) * (box.y1 - box.y0));
  return box;
}

const colourDiff = (a, b) =>
  Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2]));

// ---------------------------------------------------------------- segmentation

// Recursive XY cut: split on blank rows, then on blank columns, merging the
// gaps between words; recurse into filled blocks (cards, buttons) against
// their own fill.
function segment(box, bg, depth, unit, out) {
  const runsOf = (len, has) => {
    const runs = [];
    let start = -1;
    for (let i = 0; i <= len; i++) {
      if (i < len && has(i)) {
        if (start < 0) start = i;
      } else if (start >= 0) {
        runs.push([start, i]);
        start = -1;
      }
    }
    return runs;
  };
  const rowHas = (b) => (i) => {
    const y = b.y0 + i;
    for (let x = b.x0, o = (y * W + x) * 3; x < b.x1; x++, o += 3) if (isInk(o, bg)) return true;
    return false;
  };
  const colHas = (b) => (i) => {
    const x = b.x0 + i;
    for (let y = b.y0; y < b.y1; y++) if (isInk((y * W + x) * 3, bg)) return true;
    return false;
  };
  // Rows: merge a sliver (an i dot, an accent) into the run it belongs to.
  let rows = runsOf(box.y1 - box.y0, rowHas(box)).map(([a, b]) => [a + box.y0, b + box.y0]);
  for (let i = 0; i + 1 < rows.length; ) {
    const [a, b] = [rows[i], rows[i + 1]];
    const ha = a[1] - a[0];
    const hb = b[1] - b[0];
    const gap = b[0] - a[1];
    if (Math.min(ha, hb) <= 4 * unit && Math.min(ha, hb) / Math.max(ha, hb) < 0.35 && gap <= 3 * unit) {
      rows.splice(i, 2, [a[0], b[1]]);
    } else i++;
  }
  if (rows.length === 0) return;
  if (rows.length > 1) {
    for (const [y0, y1] of rows) segment({ x0: box.x0, y0, x1: box.x1, y1 }, bg, depth, unit, out);
    return;
  }
  const band = { x0: box.x0, y0: rows[0][0], x1: box.x1, y1: rows[0][1] };
  let pieces = runsOf(band.x1 - band.x0, colHas(band))
    .map(([a, b]) => inkBox({ x0: band.x0 + a, y0: band.y0, x1: band.x0 + b, y1: band.y1 }, bg))
    .filter(Boolean);
  // Merge the gaps between the letters and words of one line; never merge
  // into a painted block such as a button or a card.
  // A tall band is a layout of columns, not a line of text: never merge there.
  const lineHeight = band.y1 - band.y0;
  for (let i = 0; i + 1 < pieces.length && lineHeight <= 64 * unit; ) {
    const [a, b] = [pieces[i], pieces[i + 1]];
    if (b.x0 - a.x1 < 0.6 * lineHeight && !isBlock(a, bg, unit) && !isBlock(b, bg, unit)) {
      pieces.splice(i, 2, inkBox({ x0: a.x0, y0: band.y0, x1: b.x1, y1: band.y1 }, bg));
    } else i++;
  }
  if (pieces.length > 1) {
    for (const p of pieces) segment(p, bg, depth, unit, out);
    return;
  }
  const p = pieces[0];
  if (!p) return;
  // A hairline divider separates content; it is not content itself.
  if (p.y1 - p.y0 <= 1.5 * unit && p.x1 - p.x0 >= 16 * unit) return;
  if (depth < 3 && isBlock(p, bg, unit)) {
    // A container: segment its inside against its own fill, inset past its
    // border and its rounded corners.
    const mid = Math.round((p.y0 + p.y1) / 2);
    const corner = (() => {
      for (let x = p.x0; x < p.x1; x++) if (isInk((p.y0 * W + x) * 3, bg)) return x - p.x0;
      return 0;
    })();
    const core = { x0: p.x0 + corner, y0: p.y0 + Math.round((p.y1 - p.y0) / 4), x1: p.x1 - corner, y1: p.y1 - Math.round((p.y1 - p.y0) / 4) };
    const samples = [];
    for (let y = core.y0; y < core.y1; y += 2) for (let x = core.x0; x < core.x1; x += 2) samples.push((y * W + x) * 3);
    const inner = modeColour(samples);
    if (inner) {
      let edge = 0;
      const cx = Math.round((p.x0 + p.x1) / 2);
      while (p.y0 + edge < mid && colourDiff(pixel((p.y0 + edge) * W + cx), inner) > TOL) edge++;
      const pad = edge + 2;
      out.push({ ...p, container: true });
      segment({ x0: p.x0 + corner + pad, y0: p.y0 + pad, x1: p.x1 - corner - pad, y1: p.y1 - pad }, inner, depth + 1, unit, out);
      return;
    }
  }
  out.push(p);
}

const pixel = (i) => [PX[i * 3], PX[i * 3 + 1], PX[i * 3 + 2]];

// A painted block — a card, a filled button — has a large ink box whose
// outline is mostly ink: a fill or a border.
function isBlock(p, bg, unit) {
  const w = p.x1 - p.x0;
  const h = p.y1 - p.y0;
  if (w < 40 * unit || h < 24 * unit) return false;
  let ink = 0;
  let total = 0;
  for (let x = p.x0; x < p.x1; x++) {
    for (const y of [p.y0, p.y1 - 1]) {
      total++;
      if (isInk((y * W + x) * 3, bg)) ink++;
    }
  }
  for (let y = p.y0; y < p.y1; y++) {
    for (const x of [p.x0, p.x1 - 1]) {
      total++;
      if (isInk((y * W + x) * 3, bg)) ink++;
    }
  }
  return ink / total > 0.6;
}

// ---------------------------------------------------------------- elements

const geometry = positionals[1] ? readGeometry(positionals[1]) : null;
const notes = [];
let rectScale = opt["tree-scale"] ? num("tree-scale") : null;
if (geometry && !rectScale) {
  const width = geometry.width ?? Math.max(...geometry.nodes.map((n) => n.x + n.w));
  rectScale = width > 0 ? W / width : 1;
}
let unit = opt.scale ? num("scale") : geometry ? rectScale : null;
if (!unit) {
  unit = 1;
  notes.push("No --scale: values are in screenshot pixels, and the unit thresholds apply to pixels.");
} else if (Math.abs(unit - 1) < 0.05 && W >= 700 && !opt.scale && H > W) {
  notes.push(
    "The tree looks like it is in screenshot pixels on a high-density capture: values are in pixels. Pass --scale for layout units.",
  );
}
if (!(unit > 0)) fatal("--scale must be above zero");
const U = (px) => Math.round((px / unit) * 10) / 10;

const IGNORE_TOP = Math.round(num("ignore-top") * unit);
const IGNORE_BOTTOM = H - Math.round(num("ignore-bottom") * unit);

const area = (b) => (b.x1 - b.x0) * (b.y1 - b.y0);
const same = (a, b) =>
  Math.max(Math.abs(a.x0 - b.x0), Math.abs(a.y0 - b.y0), Math.abs(a.x1 - b.x1), Math.abs(a.y1 - b.y1)) <=
  Math.max(1, unit / 2);

// Elements come from two sources, merged below. The shot is always cut
// into blocks: they carry the ink detail inside painted boxes, such as a
// button's label. The tree, when given, adds readable names, layout boxes
// and containers the pixels alone cannot show.
const measuredArea = { x0: 0, y0: IGNORE_TOP, x1: W, y1: IGNORE_BOTTOM };
const blocks = [];
segment(measuredArea, borderBackground(measuredArea, 0), 0, unit, blocks);
blocks.sort((a, b) => a.y0 - b.y0 || a.x0 - b.x0);
let elements = blocks.map((p, i) => {
  const rect = { x0: p.x0, y0: p.y0, x1: p.x1, y1: p.y1 };
  return {
    label: `block ${i + 1}`,
    named: false,
    painted: true,
    role: p.container ? "container" : "block",
    rect,
    ink: { ...rect, density: p.density },
  };
});
if (!geometry) {
  notes.push("No tree: elements are blocks numbered top to bottom; the overlay shows which is which.");
} else {
  const boxes = geometry.nodes
    .map((n) => {
      const x0 = Math.max(0, Math.round(n.x * rectScale));
      const y0 = Math.max(0, Math.round(n.y * rectScale));
      const x1 = Math.min(W, Math.round((n.x + n.w) * rectScale));
      const y1 = Math.min(H, Math.round((n.y + n.h) * rectScale));
      return { label: n.label, named: true, role: n.role, rect: { x0, y0, x1, y1 } };
    })
    .filter(({ rect: r }) => {
      const w = r.x1 - r.x0;
      const h = r.y1 - r.y0;
      return w >= unit && h >= unit && w * h < 0.9 * W * H && r.y0 >= IGNORE_TOP && r.y1 <= IGNORE_BOTTOM;
    });
  const nests = (a, b) => a.x0 <= b.x0 && a.y0 <= b.y0 && a.x1 >= b.x1 && a.y1 >= b.y1;
  const overlaps = (a, b) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
  for (const e of boxes) {
    // Pixels inside an overlapping box that is neither ancestor nor
    // descendant belong to someone else.
    const skip = boxes
      .filter((f) => f !== e && overlaps(e.rect, f.rect) && !nests(e.rect, f.rect) && !nests(f.rect, e.rect))
      .map((f) => f.rect);
    const bg = ringBackground(e.rect);
    const ink = bg && inkBox(e.rect, bg, skip);
    // Painted by its own box: a filled button or bordered card, not an
    // invisible layout group. Judged on the tree's own rect, before any
    // merge can widen it with a hit target.
    if (ink) elements.push({ ...e, painted: same(e.rect, ink), ink, bg });
  }
}
if (elements.length === 0) {
  fatal("no visible ink in the measured area; check that the shot and the --ignore options cover the screen meant to be measured");
}

// Merge elements whose ink is the same box (a button and its label), keeping
// the most telling label.
elements.sort((a, b) => area(a.ink) - area(b.ink));
const kept = [];
for (const e of elements) {
  const twin = kept.find((k) => same(k.ink, e.ink));
  if (!twin) kept.push(e);
  // A tree's name says more than the block's number.
  else if (e.named && !twin.named && e.label) {
    twin.label = e.label;
    twin.role = e.role;
    twin.named = true;
  }
  if (twin) {
    twin.rect = unionBox(twin.rect, e.rect);
    // The union widens the rect with hit-area geometry; painting is
    // evidence from either source, not from the widened box.
    twin.painted = twin.painted || e.painted;
  }
}
elements = kept;
function unionBox(a, b) {
  return { x0: Math.min(a.x0, b.x0), y0: Math.min(a.y0, b.y0), x1: Math.max(a.x1, b.x1), y1: Math.max(a.y1, b.y1) };
}

// Containment by ink: the smallest element whose ink holds another's is its
// parent. A parent whose ink fills its own box paints something — a card, a
// filled button — and is visible; the rest are invisible layout groups.
const holds = (a, b) => a.x0 <= b.x0 + 1 && a.y0 <= b.y0 + 1 && a.x1 >= b.x1 - 1 && a.y1 >= b.y1 - 1;
const screen = {
  name: "screen",
  root: true,
  ink: { x0: 0, y0: 0, x1: W, y1: H },
  rect: { x0: 0, y0: 0, x1: W, y1: H },
  children: [],
};
for (const e of elements) e.children = [];
for (const e of elements) {
  let parent = screen;
  for (const p of elements) {
    if (p !== e && area(p.ink) > area(e.ink) && holds(p.ink, e.ink) && area(p.ink) < area(parent.ink)) parent = p;
  }
  e.parent = parent;
  parent.children.push(e);
}
for (const e of elements) {
  e.visible = e.children.length > 0 && e.painted;
}

// Unique names, so findings can name each element. An
// unlabelled container is named after its first child.
const seen = new Map();
for (const e of [...elements].sort((a, b) => area(a.ink) - area(b.ink))) {
  const first = [...e.children].sort((p, q) => p.ink.y0 - q.ink.y0 || p.ink.x0 - q.ink.x0)[0];
  e.base = e.label || (first ? `${e.role || "box"} holding ${first.base}` : e.role || "element");
}
for (const e of [...elements].sort((a, b) => a.ink.y0 - b.ink.y0 || a.ink.x0 - b.ink.x0)) {
  const n = (seen.get(e.base) ?? 0) + 1;
  seen.set(e.base, n);
  e.name = n === 1 ? e.base : `${e.base} #${n}`;
}

// ---------------------------------------------------------------- analysis

const findings = [];
const steps = [];
const measures = [];
const fmt = (v) => v.toFixed(1);
const ratioOf = (a, b) => Math.max(a, b) / Math.min(a, b);

function classify(a, b) {
  const ratio = ratioOf(a, b);
  if (Math.abs(a - b) < MIN_DELTA || ratio < EQUAL) return { ratio, cls: "equal" };
  return { ratio, cls: ratio < STEP ? "uneven" : "step" };
}

function record(kind, key, values, extra) {
  const { ratio, cls } = classify(...values);
  const m = { kind, key, values, ratio: Math.round(ratio * 100) / 100, cls, ...extra };
  measures.push(m);
  if (cls === "uneven") findings.push(m);
  // Steps up to 3× are listed for a deliberate-or-not call; wider ones are
  // plainly deliberate (a label pushing a chevron to the edge, a divider).
  if (cls === "step" && ratio < 3) steps.push(m);
  return m;
}

// Structure: inside each container, a recursive XY cut over the children's
// boxes, at the widest clear gap, horizontal or vertical. Columns —
// a sidebar and its content, the cells of a grid — so keep their own
// rhythm, and a gap that happens to line up across columns doesn't slice
// through them. Cuts in the same direction flatten into one stack or row.
// Every clear cut through items in one direction, as { dir, gap, i, sorted }:
// the items before index i in sorted order lie wholly on one side.
function clearCuts(items, dir) {
  const [a0, a1] = dir === "stack" ? ["y0", "y1"] : ["x0", "x1"];
  const sorted = [...items].sort((p, q) => p.ink[a0] - q.ink[a0]);
  let end = sorted[0].ink[a1];
  const cuts = [];
  for (let i = 1; i < sorted.length; i++) {
    const gap = sorted[i].ink[a0] - end;
    if (gap >= 0) cuts.push({ dir, gap, i, sorted });
    end = Math.max(end, sorted[i].ink[a1]);
  }
  return cuts;
}

function widestCut(items, dir) {
  return clearCuts(items, dir).reduce((best, c) => (!best || c.gap > best.gap ? c : best), null);
}

// Names of the leaves under n: a built cut node, or an element (whose
// children are elements).
function leafNames(n) {
  if (n.leaf) return [n.leaf.name];
  const kids = n.kids ?? (n.children?.length ? n.children : null);
  return kids ? kids.flatMap(leafNames) : [n.name];
}

// Names of the element-tree leaves under n, however it was grouped: the
// level the near-miss pass works at. leafNames stops at a cut node's leaf
// marker, so it can't serve here without changing the names build gives.
function treeLeaves(n) {
  const e = n.leaf ?? n;
  if (e.kids) return e.kids.flatMap(treeLeaves);
  return e.children?.length ? e.children.flatMap(treeLeaves) : [e.name];
}

const joinNames = (names) =>
  names.length <= 3 ? names.join(" + ") : `${names[0]} + … + ${names.at(-1)} (${names.length})`;

// A row's members at the depth of the container's own children: cut
// groups mark that level as their leaves, band nodes hold it in kids.
// Deeper (filled controls split into control and label) would name the
// same row differently per pass and defeat the dedupe.
const members = (n) => (n.span ? n.kids.map((k) => k.name) : leafNames(n)).sort();

// The row boxes of a set of items: split at every clear horizontal cut.
function rowBoxes(items) {
  const cuts = clearCuts(items, "stack");
  if (cuts.length === 0) return [items.map((k) => k.ink).reduce(unionBox)];
  const { sorted } = cuts[0];
  const ends = [0, ...cuts.map((c) => c.i), sorted.length];
  return ends.slice(1).map((e, j) => sorted.slice(ends[j], e).map((k) => k.ink).reduce(unionBox));
}

// Two sides of a vertical cut zigzag when each is a column of rows — two or
// more rows lined up on their left or right edge, within the near-miss
// band — the sides span the same height, and no item on one side shares a
// line with any on the other: the rows alternate sides instead of running
// across. Stacking them would compare each row with the other side's next
// one. Aligned rows (a form, a grid) overlap across the cut; a lone drifted
// row is one row; a staircase's sides don't span the same height; scattered
// items line up on no edge.
function zigzag(v) {
  const [a, b] = [v.sorted.slice(0, v.i), v.sorted.slice(v.i)];
  const column = (side) => {
    const rows = rowBoxes(side);
    const spread = (edge) => U(Math.max(...rows.map(edge)) - Math.min(...rows.map(edge)));
    return rows.length >= 2 && (spread((r) => r.x0) <= NEAR || spread((r) => r.x1) <= NEAR);
  };
  if (!column(a) || !column(b)) return false;
  const span = (side) => side.map((k) => k.ink).reduce(unionBox);
  const [sa, sb] = [span(a), span(b)];
  if (Math.min(sa.y1, sb.y1) <= Math.max(sa.y0, sb.y0)) return false;
  return a.every((p) => b.every((q) => Math.min(p.ink.y1, q.ink.y1) <= Math.max(p.ink.y0, q.ink.y0)));
}

function build(items) {
  const ink = items.map((k) => k.ink).reduce(unionBox);
  const rect = items.map((k) => k.rect).reduce(unionBox);
  if (items.length === 1) return { leaf: items[0], kids: [], ink, rect, name: items[0].name };
  const h = widestCut(items, "stack");
  const v = widestCut(items, "row");
  // A vertical cut whose two sides zigzag — rows alternating left and
  // right, as in a two-sided timeline — wins first, whatever the gap
  // widths: it need not be the widest, since a gap inside a row (an item
  // and its trailing icon) can be wider than the gutter. Otherwise rows first: ragged rows leave
  // accidental vertical gaps, so a vertical cut must be clearly wider (a
  // sidebar, a column gutter) to win.
  const zig = h && v ? clearCuts(items, "row").find(zigzag) : null;
  const cut = zig ?? (h && (!v || v.gap <= 2 * h.gap) ? h : v);
  let node;
  if (cut) {
    const halves = [cut.sorted.slice(0, cut.i), cut.sorted.slice(cut.i)].map(build);
    // Same-direction cuts flatten into one stack or row — never into or out
    // of a zigzag: its sides are separate columns, so neither a cut inside
    // one side (items and an icon rail beside them) nor a row around it (a
    // sidebar beside the zigzag) may join its gutter in one row.
    const flat = (k) => (k.dir === cut.dir && !k.zigzag ? k.kids : [k]);
    node = { dir: cut.dir, zigzag: cut === zig, kids: cut === zig ? halves : halves.flatMap(flat), ink, rect };
  } else {
    // Overlapping items no cut separates: no rhythm to measure among them.
    node = { dir: "pile", kids: items.map((k) => build([k])), ink, rect };
  }
  const names = leafNames(node);
  node.name = joinNames(names);
  return node;
}

const centre = (b) => (b.x0 + b.x1) / 2;

function offCentre(item, frame, frameName, where) {
  const w = item.ink.x1 - item.ink.x0;
  // An item nearly filling its frame has no centre a reader would judge;
  // it is still recorded, so widening past the cutoff cannot delete the
  // key — only change its class.
  const wide = w > 0.8 * (frame.x1 - frame.x0);
  const left = U(item.ink.x0 - frame.x0);
  const right = U(frame.x1 - item.ink.x1);
  const off = Math.abs(left - right) / 2;
  // Flush with an edge means aligned to it, not centred — still recorded,
  // so the key survives a fix that drifts past an edge. Every
  // relationship is kept, however far off, so a re-measure can compare
  // before and after a fix even once it stops being a finding.
  const cls = wide ? "wide" : left <= ALIGN || right <= ALIGN ? "flush" : off <= ALIGN ? "aligned" : off <= NEAR ? "near" : "off";
  const y = (item.ink.y0 + item.ink.y1) / 2;
  const m = {
    kind: "off-centre",
    key: `centre ${frameName} | ${item.name}`,
    values: [left, right],
    off: Math.round(off * 10) / 10,
    cls,
    text: `"${item.name}" is ${fmt(off)} off centre in "${frameName}"${where}: ${fmt(left)} on the left, ${fmt(right)} on the right`,
    draw: [
      { horizontal: true, y, x0: frame.x0, x1: item.ink.x0, ink: left },
      { horizontal: true, y, x0: item.ink.x1, x1: frame.x1, ink: right },
    ],
    y: item.ink.y0,
  };
  measures.push(m);
  if (cls === "near") findings.push(m);
}

const guideSeen = new Set();
// Per guides finding: the rows' members at the container's level and
// whether the band pass made it, so two findings over the same rows
// through different groupings dedupe at the findings stage.
const guideRows = new Map();
// Per guides finding: each row's members, with their boxes and the
// element-tree leaves inside them, so a kept finding can hide the near
// misses it already reports — and only those.
const rowLeaves = new Map();
// How far sideways two things may sit and still be compared: twice the
// vertical reach of a near miss. Far enough that a pair drifting into a
// neighbouring column keeps its key; not across the page.
const SIDE_REACH = 128;

// Two stacked rows should share at least one vertical guide: a left edge,
// centre or right edge. Related rows are of similar height, and close in
// ink or touching as layout boxes; a row of cards above a row of links is
// not a pair. Both passes below can reach the same pair, so its key is
// measured once.
function compareRows(a, b, where) {
  const [ha, hb] = [a.ink.y1 - a.ink.y0, b.ink.y1 - b.ink.y0];
  if (Math.max(ha, hb) > 2 * Math.min(ha, hb)) return;
  if (b.ink.y0 - a.ink.y1 > 4 * Math.min(ha, hb) && b.rect.y0 - a.rect.y1 > unit) return;
  const key = `guides ${a.name} | ${b.name}`;
  if (guideSeen.has(key)) return;
  guideSeen.add(key);
  const edges = (k) => [k.ink.x0, centre(k.ink), k.ink.x1];
  let shared = 0;
  let closest = Infinity;
  for (const p of a.kids) {
    for (const q of b.kids) {
      const [pe, qe] = [edges(p), edges(q)];
      for (let e = 0; e < 3; e++) {
        const d = U(Math.abs(pe[e] - qe[e]));
        if (d <= ALIGN) shared++;
        closest = Math.min(closest, d);
      }
    }
  }
  const cls = shared === 0 ? "no-guide" : "aligned";
  // The overlay guides and sort position follow the rows' real extent,
  // not the comparison boxes: a band's box is its typical member, its
  // members may reach further.
  const [y0, y1] = [(a.span ?? a.ink).y0, (b.span ?? b.ink).y1];
  const m = {
    kind: "guides",
    key,
    shared,
    closest: Math.round(closest * 10) / 10,
    cls,
    text: `rows "${a.name}" and "${b.name}"${where} share no vertical guide: no left edge, centre or right edge lines up (closest pair ${fmt(closest)} apart; rows span ${fmt(U(a.ink.x0))}–${fmt(U(a.ink.x1))} and ${fmt(U(b.ink.x0))}–${fmt(U(b.ink.x1))})`,
    draw: [...a.kids, ...b.kids].flatMap((k) => [
      { guide: true, x: k.ink.x0, y0, y1 },
      { guide: true, x: k.ink.x1 - 1, y0, y1 },
    ]),
    y: y0,
  };
  measures.push(m);
  if (shared === 0) {
    findings.push(m);
    guideRows.set(m, [members(a), members(b), Boolean(a.span)]);
    const row = (n) => n.kids.map((k) => ({ box: k.ink, leaves: new Set(treeLeaves(k)) }));
    rowLeaves.set(m, [row(a), row(b)]);
  }
}

// The widest-gap cut can read two close rows of items as columns when the
// horizontal gutters are wider than the row gap, and then the rows are
// never compared. Bands of children that overlap vertically are compared
// directly, so no gutter width can hide a missing shared guide.
function rowBands(items, where) {
  const bands = [];
  for (const it of [...items].sort((a, b) => a.ink.y0 - b.ink.y0 || a.ink.x0 - b.ink.x0)) {
    const h = it.ink.y1 - it.ink.y0;
    // An item joins a band through a member of similar height it overlaps
    // by more than half the shorter one — a baseline label beside a taller
    // icon qualifies, a sidebar does not. The band must also keep a span
    // common to every member: a control reaching across two rows overlaps
    // each row by more than half the shorter height, yet the two rows
    // share no span, so one band can never hold both.
    const band = bands.find(
      (bd) =>
        Math.min(bd.span1, it.ink.y1) - Math.max(bd.span0, it.ink.y0) > 0 &&
        bd.items.some((m) => {
          const mh = m.ink.y1 - m.ink.y0;
          const overlap = Math.min(m.ink.y1, it.ink.y1) - Math.max(m.ink.y0, it.ink.y0);
          return overlap > 0.5 * Math.min(h, mh) && Math.max(h, mh) <= 2 * Math.min(h, mh);
        })
    );
    if (band) {
      band.items.push(it);
      band.ink = unionBox(band.ink, it.ink);
      band.rect = unionBox(band.rect, it.rect);
      band.span0 = Math.max(band.span0, it.ink.y0);
      band.span1 = Math.min(band.span1, it.ink.y1);
    } else {
      bands.push({ items: [it], ink: it.ink, rect: it.rect, span0: it.ink.y0, span1: it.ink.y1 });
    }
  }
  const rows = bands.filter((bd) => bd.items.length >= 2);
  const bandNode = (bd) => {
    // A member taller than the row — a big button, a control reaching
    // toward the next row — must not stretch the band past the height
    // gates in compareRows and hide the pair; the row's height is its
    // typical member's, centred on the span the members share.
    const heights = bd.items.map((it) => it.ink.y1 - it.ink.y0).sort((a, b) => a - b);
    const h = heights[Math.floor(heights.length / 2)];
    const c = (bd.span0 + bd.span1) / 2;
    return {
      name: joinNames([...bd.items].sort((a, b) => a.ink.x0 - b.ink.x0).map((it) => it.name)),
      kids: bd.items,
      ink: { x0: bd.ink.x0, x1: bd.ink.x1, y0: c - h / 2, y1: c + h / 2 },
      rect: bd.rect,
      // The members' full extent, for overlay guides and sort position.
      span: bd.ink,
    };
  };
  // Each band pair is compared twice: with the typical-member boxes, and
  // with the members' full union. When short members outnumber a taller
  // one — an icon beside two text labels — the median is the label height
  // and can gate the pair out on its own; the union box still compares
  // it, as it did before medians existed. compareRows returns before it
  // records when a pair is gated, so the second call can only compare
  // pairs the first could not, never record one twice.
  const unionNode = (bd) => ({ ...bandNode(bd), ink: bd.ink });
  // Consecutive bands from side-by-side columns with staggered rows belong
  // to different columns: nobody compares their guides, and the cut
  // compares each column's own rows. Two bands that don't overlap sideways
  // are skipped when they sit beyond the sideways reach, or when each has
  // another band above or below it in its own column — one that overlaps
  // it sideways but not the other band: a column, however narrow its
  // gutter. A full-width header or footer overlaps both, so it is nobody's
  // column partner. Columns also interleave: the first band's column goes
  // on below the pair, or the second's began above it. A one-sided header
  // over the first band and a footer under the second frame a staircase,
  // not columns. A lone row that drifted clear of the one above has no
  // partner either way, so it is still compared and its key survives.
  const overlapsX = (p, q) => Math.min(p.ink.x1, q.ink.x1) > Math.max(p.ink.x0, q.ink.x0);
  // Indices of the bands that overlap band i sideways but not band j.
  const partners = (i, j) => rows.flatMap((o, k) => (k !== i && overlapsX(o, rows[i]) && !overlapsX(o, rows[j]) ? [k] : []));
  for (let i = 0; i + 1 < rows.length; i++) {
    const [p, q] = [rows[i], rows[i + 1]];
    if (!overlapsX(p, q)) {
      const apart = U(Math.max(p.ink.x0, q.ink.x0) - Math.min(p.ink.x1, q.ink.x1));
      const [pp, qp] = [partners(i, i + 1), partners(i + 1, i)];
      const columns = pp.length > 0 && qp.length > 0 && (pp.some((k) => k > i + 1) || qp.some((k) => k < i));
      if (apart > SIDE_REACH || columns) continue;
    }
    compareRows(bandNode(rows[i]), bandNode(rows[i + 1]), where);
    compareRows(unionNode(rows[i]), unionNode(rows[i + 1]), where);
  }
}

function analyse(n, c, frame, frameName) {
  const where = c.root ? "" : ` in "${c.name}"`;
  if (n.dir === "stack") {
    const kids = n.kids;
    // Vertical rhythm: the gaps between stacked parts, and each part's
    // balance between the gap above and the gap below.
    const gaps = [];
    for (let i = 0; i + 1 < kids.length; i++) {
      const [a, b] = [kids[i], kids[i + 1]];
      const g = {
        key: `gap ${a.name} | ${b.name}`,
        ink: U(b.ink.y0 - a.ink.y1),
        box: U(b.rect.y0 - a.rect.y1),
        x: (Math.max(a.ink.x0, b.ink.x0) + Math.min(a.ink.x1, b.ink.x1)) / 2,
        y0: a.ink.y1,
        y1: b.ink.y0,
      };
      gaps.push(g);
      measures.push({ kind: "gap", key: g.key, value: g.ink, box: g.box, container: c.name });
    }
    for (let i = 0; i + 1 < gaps.length; i++) {
      const [above, below] = [gaps[i], gaps[i + 1]];
      if (above.ink < 1 || below.ink < 1) continue;
      const part = kids[i + 1];
      const chrome = Math.abs(above.box - above.ink) >= 4 || Math.abs(below.box - below.ink) >= 4
        ? ` (layout boxes ${fmt(above.box)} and ${fmt(below.box)} apart: the rest is padding, hit-area size or line height inside the boxes)`
        : "";
      record("balance", `balance ${part.name}`, [above.ink, below.ink], {
        text: `"${part.name}"${where}: ${fmt(above.ink)} above, ${fmt(below.ink)} below`,
        chrome,
        draw: [above, below],
        y: part.ink.y0,
      });
    }
    // Guides: two stacked rows of several items each should share at least
    // one vertical guide — a left edge, centre or right edge. A zigzag is
    // two columns, not a row of items: its sides' edges are no row's guides.
    for (let i = 0; i + 1 < kids.length; i++) {
      const [a, b] = [kids[i], kids[i + 1]];
      if (a.dir !== "row" || b.dir !== "row" || a.zigzag || b.zigzag) continue;
      compareRows(a, b, where);
    }
    // Centring: a part that sits almost, but not quite, centred.
    for (const k of kids) offCentre(k, frame, frameName, where);
    for (const k of kids) analyse(k, c, k.ink, k.name);
    return;
  }
  if (n.dir === "row" && n.kids.length >= 3) {
    // Horizontal rhythm inside a row of three or more.
    const y = (n.ink.y0 + n.ink.y1) / 2;
    for (let i = 0; i + 2 < n.kids.length; i++) {
      const [a, b, d] = n.kids.slice(i, i + 3);
      const left = U(b.ink.x0 - a.ink.x1);
      const right = U(d.ink.x0 - b.ink.x1);
      if (left < 1 || right < 1) continue;
      record("row-rhythm", `row-rhythm ${b.name}`, [left, right], {
        text: `"${b.name}"${where}: ${fmt(left)} to its left, ${fmt(right)} to its right`,
        draw: [
          { horizontal: true, y, x0: a.ink.x1, x1: b.ink.x0, ink: left },
          { horizontal: true, y, x0: b.ink.x1, x1: d.ink.x0, ink: right },
        ],
        y: n.ink.y0,
      });
    }
  }
  for (const k of n.kids) analyse(k, c, k.ink, k.name);
}

for (const c of [screen, ...elements]) {
  if (c.children.length === 0) continue;
  const top = build(c.children);
  // A painted container's own padding, top against bottom.
  if (c.visible) {
    const above = U(top.ink.y0 - c.ink.y0);
    const below = U(c.ink.y1 - top.ink.y1);
    if (above >= 1 && below >= 1) {
      const x = centre(c.ink);
      record("padding", `padding ${c.name}`, [above, below], {
        text: `"${c.name}": padding ${fmt(above)} at the top, ${fmt(below)} at the bottom`,
        draw: [
          { x, y0: c.ink.y0, y1: top.ink.y0, ink: above },
          { x, y0: top.ink.y1, y1: c.ink.y1, ink: below },
        ],
        y: c.ink.y0,
      });
    }
  }
  const frameName = c.root ? "screen" : c.name;
  if (c.root || c.visible) {
    if (top.dir !== "stack") offCentre(top, c.ink, frameName, "");
  }
  analyse(top, c, c.root || c.visible ? c.ink : top.ink, frameName);
  // Rows of this container's own children, whatever groups the cut made.
  rowBands(c.children, c.root ? "" : ` in "${c.name}"`);
}

// One defect can surface twice when the stack pass and the band pass
// catch the same two rows through different groupings — one keeps a
// spanning control in the row, the other does not — recording it under
// two keys. A band row can also span several columns and cover each
// column's stack record. Keep the band pass's record and drop every stack
// record it covers: the band groups by vertical overlap, not by the cut,
// so its key survives a cut change. Only the records kept here hide near
// misses between their members.
const sameRows = (p, q) =>
  (p[0].every((n) => q[0].includes(n)) || q[0].every((n) => p[0].includes(n))) &&
  (p[1].every((n) => q[1].includes(n)) || q[1].every((n) => p[1].includes(n)));
const bandSigs = findings.map((f) => guideRows.get(f)).filter((s) => s?.[2]);
const covered = (f) => {
  const s = guideRows.get(f);
  return s && !s[2] && bandSigs.some((b) => sameRows(b, s));
};
const keptFindings = findings.filter((f) => !covered(f));
findings.length = 0;
findings.push(...keptFindings);
const keptRows = findings.map((f) => rowLeaves.get(f)).filter(Boolean);

// A near miss is already reported when one kept guide finding has the two
// elements inside members of its two rows, and the elements moved with
// their members: on the near miss's own edge, both sit at the same inset
// in their members, or both are centred in them at the same offset — a
// centred label in a shifted chip lands wherever its text width puts its
// edges. Same offset, signed: two labels each within tolerance of centre
// but on opposite sides of it are a defect of their own. A near miss
// inside one member, or between contents that don't follow their members
// (unequal padding in stacked cards), is a defect of its own.
const EDGE = { "left edges": (b) => b.x0, centres: centre, "right edges": (b) => b.x1 };
function explained(a, b, closest) {
  const edge = EDGE[closest.what];
  const off = (e, mm) => U(centre(e.ink) - centre(mm.box));
  for (const [upper, lower] of keptRows) {
    for (const [ra, rb] of [[upper, lower], [lower, upper]]) {
      const ma = ra.find((mm) => mm.leaves.has(a.name));
      const mb = rb.find((mm) => mm.leaves.has(b.name));
      if (!ma || !mb) continue;
      const sameInset = U(Math.abs(closest.q - closest.p - (edge(mb.box) - edge(ma.box)))) <= ALIGN;
      const [oa, ob] = [off(a, ma), off(b, mb)];
      const centred = Math.abs(oa) <= ALIGN && Math.abs(ob) <= ALIGN && Math.abs(oa - ob) <= ALIGN;
      if (sameInset || centred) return true;
    }
  }
  return false;
}

// Near misses: an element and the nearest element stacked under it whose
// edges almost — but not quite — line up.
const leaves = elements.filter((e) => e.children.length === 0);
for (const a of leaves) {
  let best = null;
  const below = [];
  for (const b of leaves) {
    if (b === a || b.ink.y0 < a.ink.y1 - 1) continue;
    below.push(b);
    if (Math.min(a.ink.x1, b.ink.x1) <= Math.max(a.ink.x0, b.ink.x0)) continue;
    if (!best || b.ink.y0 < best.ink.y0) best = b;
  }
  // Every element below within reach is recorded, however they align.
  // Exclusive pairings — the nearest, the nearest overlapping — can be
  // stolen by an unrelated neighbour the moment a defect drifts
  // sideways, deleting the key the re-measure needs. Only the nearest
  // overlapping pairing can be a finding.
  for (const b of below) {
    if (U(b.ink.y0 - a.ink.y1) > 64) continue;
    // Sideways reach is twice the vertical one: a pair drifting into a
    // neighbouring column is still worth re-measuring, the far side of
    // the page is not, and a dense grid must not pair every leaf with
    // every leaf below it.
    if (U(Math.max(a.ink.x0, b.ink.x0) - Math.min(a.ink.x1, b.ink.x1)) > SIDE_REACH) continue;
    const options = [
      ["left edges", a.ink.x0, b.ink.x0],
      ["centres", (a.ink.x0 + a.ink.x1) / 2, (b.ink.x0 + b.ink.x1) / 2],
      ["right edges", a.ink.x1, b.ink.x1],
    ].map(([what, p, q]) => ({ what, d: U(Math.abs(p - q)), p, q }));
    const closest = options.reduce((m, o) => (o.d < m.d ? o : m));
    // Recorded however it lands, so a re-measure can compare before and
    // after; only the near band is a finding.
    const cls = closest.d <= ALIGN ? "aligned" : closest.d <= NEAR ? "near" : "off";
    const m = {
      kind: "near-miss",
      key: `align ${a.name} | ${b.name}`,
      values: [closest.d],
      cls,
      text: `"${a.name}" and "${b.name}" below it almost align: their ${closest.what} are ${fmt(closest.d)} apart`,
      draw: [
        { guide: true, x: closest.p, y0: a.ink.y0, y1: b.ink.y1 },
        { guide: true, x: closest.q, y0: a.ink.y0, y1: b.ink.y1 },
      ],
      y: a.ink.y0,
    };
    measures.push(m);
    if (b === best && cls === "near" && !explained(a, b, closest)) findings.push(m);
  }
}

findings.sort((a, b) => a.y - b.y);
findings.forEach((f, i) => (f.n = i + 1));

// ---------------------------------------------------------------- output

const describe = (f) => {
  if (f.kind === "guides") return `[no shared guide] ${f.text}`;
  if (f.kind === "near-miss") return `[near miss] ${f.text}`;
  if (f.kind === "off-centre") return `[off centre] ${f.text}`;
  const what = { balance: "uneven gaps", padding: "uneven padding", "row-rhythm": "uneven row gaps" }[f.kind];
  return `[${what}] ${f.text} — ${f.ratio.toFixed(2)}×, neither equal nor a clear step${f.chrome ?? ""}`;
};

const lines = [];
lines.push(`# Measurements: ${positionals[0]}`);
lines.push("");
lines.push(
  `${geometry ? "With tree" : "Screenshot only"} · ${elements.length} elements · ${W}×${H} px · ${fmt(unit)} px per unit · thresholds: equal under ${EQUAL}× or ${MIN_DELTA} units, step from ${STEP}×, aligned within ${ALIGN}, near miss up to ${NEAR}`,
);
for (const note of notes) lines.push(`Note: ${note}`);
lines.push("");
lines.push(findings.length ? "## Findings" : "## Findings: none");
for (const f of findings) lines.push(`${f.n}. ${describe(f)}`);
if (steps.length) {
  lines.push("");
  lines.push("## Steps to confirm as deliberate (a group break should look like one)");
  for (const s of steps) {
    lines.push(`- ${s.text} — ${s.ratio.toFixed(2)}×`);
  }
}
const gapLines = measures.filter((m) => m.kind === "gap");
if (gapLines.length) {
  lines.push("");
  lines.push("## Gaps (ink; layout boxes in brackets)");
  for (const g of gapLines) lines.push(`- ${g.key.slice(4)}: ${fmt(g.value)} [${fmt(g.box)}]`);
}

console.log(lines.join("\n"));

if (opt.json) {
  const strip = ({ draw, ...rest }) => rest;
  mkdirSync(dirname(opt.json), { recursive: true });
  writeFileSync(
    opt.json,
    `${JSON.stringify(
      {
        shot: positionals[0],
        mode: geometry ? "tree" : "screenshot",
        scale: unit,
        thresholds: { equal: EQUAL, step: STEP, minDelta: MIN_DELTA, align: ALIGN, near: NEAR, tolerance: TOL },
        notes,
        findings: findings.map((f) => ({ summary: describe(f), ...strip(f) })),
        measures: measures.map(strip),
        elements: elements.map((e) => ({
          name: e.name,
          role: e.role,
          parent: e.parent.name,
          visible: e.visible,
          ink: [e.ink.x0, e.ink.y0, e.ink.x1, e.ink.y1].map(U),
        })),
      },
      null,
      2,
    )}\n`,
  );
}

// ---------------------------------------------------------------- overlay

if (opt.overlay) {
  const out = new Uint8Array(PX);
  const t = Math.max(1, Math.round(unit / 1.5));
  const put = (x, y, c) => {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const o = (y * W + x) * 3;
    out[o] = c[0];
    out[o + 1] = c[1];
    out[o + 2] = c[2];
  };
  const rect = (x0, y0, x1, y1, c) => {
    for (let y = Math.round(y0); y < Math.round(y1); y++) for (let x = Math.round(x0); x < Math.round(x1); x++) put(x, y, c);
  };
  const frame = (b, c) => {
    rect(b.x0, b.y0, b.x1, b.y0 + 1, c);
    rect(b.x0, b.y1 - 1, b.x1, b.y1, c);
    rect(b.x0, b.y0, b.x0 + 1, b.y1, c);
    rect(b.x1 - 1, b.y0, b.x1, b.y1, c);
  };
  const FONT = {
    0: "111101101101111", 1: "010110010010111", 2: "111001111100111", 3: "111001111001111",
    4: "101101111001001", 5: "111100111001111", 6: "111100111101111", 7: "111001001001001",
    8: "111101111101111", 9: "111101111001111", ".": "000000000000010", "#": "101111101111101",
    x: "000101010101000", "-": "000000111000000", " ": "000000000000000",
  };
  const label = (text, x, y, c, leftOf = false) => {
    const s = Math.max(2, Math.round(unit * 1.6));
    const w = text.length * 4 * s + s;
    const h = 7 * s;
    if (leftOf) x -= w;
    x = Math.min(Math.max(0, Math.round(x)), W - w);
    y = Math.min(Math.max(0, Math.round(y)), H - h);
    rect(x, y, x + w, y + h, c);
    [...text].forEach((ch, i) => {
      const glyph = FONT[ch] ?? FONT[" "];
      for (let gy = 0; gy < 5; gy++) {
        for (let gx = 0; gx < 3; gx++) {
          if (glyph[gy * 3 + gx] === "1") {
            rect(x + s + (i * 4 + gx) * s, y + s + gy * s, x + s + (i * 4 + gx + 1) * s, y + s + (gy + 1) * s, [255, 255, 255]);
          }
        }
      }
    });
  };
  const CYAN = [0, 170, 200];
  const PINK = [220, 0, 120];
  for (const e of elements) frame(e.ink, CYAN);
  for (const f of findings) {
    for (const d of f.draw ?? []) {
      if (d.guide) rect(d.x, d.y0, d.x + t, d.y1, PINK);
      else if (d.horizontal) {
        rect(d.x0, d.y - t / 2, d.x1, d.y + t / 2 + 1, PINK);
        rect(d.x0, d.y - 3 * t, d.x0 + t, d.y + 3 * t, PINK);
        rect(d.x1 - t, d.y - 3 * t, d.x1, d.y + 3 * t, PINK);
        if (d.ink !== undefined) label(fmt(d.ink), (d.x0 + d.x1) / 2, d.y + 4 * t, PINK);
      } else {
        rect(d.x - t / 2, d.y0, d.x + t / 2 + 1, d.y1, PINK);
        rect(d.x - 3 * t, d.y0, d.x + 3 * t, d.y0 + t, PINK);
        rect(d.x - 3 * t, d.y1 - t, d.x + 3 * t, d.y1, PINK);
        if (d.ink !== undefined) label(fmt(d.ink), d.x + 4 * t, (d.y0 + d.y1) / 2 - 3 * unit, PINK);
      }
    }
    const first = f.draw?.[0];
    const x = first ? (first.x0 ?? first.x) : 0;
    label(`#${f.n}`, x - 6 * t, f.y, [90, 0, 160], true);
  }
  mkdirSync(dirname(opt.overlay), { recursive: true });
  writePng(opt.overlay, W, H, out);
}
