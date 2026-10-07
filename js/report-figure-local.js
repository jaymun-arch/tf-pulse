/**
 * 무료 보고서 그림 — AI 없이 브라우저에서 바로 그린다 (비용 0원).
 * 「넣고 싶은 내용」에서 항목·숫자·연도를 뽑아 고른 레이아웃에 맞는 흑백 SVG 도식을 만든다.
 */

const W = 1600;
const H = 900;
const PAD = 80;
const FONT = "'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif";
const C = {
  ink: "#1A1A1A",
  dark: "#333333",
  mid: "#666666",
  soft: "#8A8A8A",
  line: "#BDBDBD",
  fill: "#F2F2F2",
  fill2: "#E6E6E6",
  white: "#FFFFFF",
};

/* ───────── 내용 읽기 ───────── */

const UNIT_RE = "(%p|%|명|건|개사|개교|개|점|억\\s*원|억|천만\\s*원|백만\\s*원|만\\s*원|원|배|시간|회|과목|팀|학점|곳)";
const NUM_RE = new RegExp(`(-?\\d[\\d,]*(?:\\.\\d+)?)\\s*${UNIT_RE}?`);
const YEAR_RE = /(?:^|[^\d])((?:19|20)\d{2})\s*(?:년|학년도)?(?=[^\d]|$)/;

function cleanLabel(s) {
  return String(s)
    .replace(/^[\s\-–•·*▶▷○●■□◆◇\d]+[.)]\s*/, "")
    .replace(/[:：]\s*$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseItem(raw) {
  let text = cleanLabel(raw);
  let year = "";
  const ym = YEAR_RE.exec(text);
  if (ym) {
    year = ym[1];
    text = text.replace(ym[1], " ").replace(/\s*(년|학년도)\b/, " ");
  }
  let value = "";
  let num = null;
  const nm = NUM_RE.exec(text);
  if (nm) {
    const unit = (nm[2] || "").replace(/\s+/g, "");
    value = `${nm[1]}${unit}`;
    num = Number(nm[1].replace(/,/g, ""));
    text = text.replace(nm[0], " ");
  }
  const label = cleanLabel(text.replace(/[(（]\s*[)）]/g, "").replace(/\s{2,}/g, " ")) || value || year;
  return { raw: cleanLabel(raw), label, value, num: Number.isFinite(num) ? num : null, year };
}

/**
 * 넣고 싶은 내용 → { title, items[] }
 * 줄바꿈·쉼표·화살표·가운뎃점으로 항목을 나눈다.
 */
export function parseDirection(text = "", { fallbackTitle = "" } = {}) {
  const lines = String(text)
    .split(/\r?\n|;/)
    .map((l) => l.trim())
    .filter(Boolean);
  let title = "";
  if (lines.length > 1 && lines[0].length <= 30 && !/\d/.test(lines[0]) && !/[,→:：]/.test(lines[0])) {
    title = cleanLabel(lines.shift());
  }
  const chunks = [];
  lines.forEach((line) => {
    line
      .split(/\s*(?:→|->|⇒|>|,|，|\|)\s*/)
      .map((c) => c.trim())
      .filter((c) => c.length > 0)
      .forEach((c) => chunks.push(c));
  });
  const items = chunks.map(parseItem).filter((it) => it.label || it.value).slice(0, 12);
  return { title: title || fallbackTitle || "보고서 핵심 도식", items };
}

/* ───────── 글자 배치 도우미 ───────── */

function esc(s = "") {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function charW(ch, size) {
  return /[ᄀ-ᇿ　-鿿가-힯＀-￯]/.test(ch) ? size : size * 0.56;
}

function textW(s, size) {
  let w = 0;
  for (const ch of String(s)) w += charW(ch, size);
  return w;
}

/** 박스 너비에 맞게 줄바꿈 (넘치면 마지막 줄 …) */
function wrap(s, size, maxW, maxLines = 2) {
  const words = String(s).split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = "";
  const push = () => {
    if (cur) lines.push(cur);
    cur = "";
  };
  for (const word of words) {
    const next = cur ? `${cur} ${word}` : word;
    if (textW(next, size) <= maxW) {
      cur = next;
      continue;
    }
    push();
    if (textW(word, size) <= maxW) {
      cur = word;
    } else {
      // 띄어쓰기 없는 긴 낱말은 글자 단위로 자른다
      let piece = "";
      for (const ch of word) {
        if (textW(piece + ch, size) > maxW) {
          lines.push(piece);
          piece = ch;
        } else piece += ch;
      }
      cur = piece;
    }
  }
  push();
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    let last = kept[maxLines - 1];
    while (last && textW(`${last}…`, size) > maxW) last = last.slice(0, -1);
    kept[maxLines - 1] = `${last}…`;
    return kept;
  }
  return lines.length ? lines : [""];
}

/** 크기를 줄여 가며 maxLines 안에 들어가게 한다 */
function fit(s, size, maxW, maxLines = 2, minSize = 20) {
  let sz = size;
  while (sz > minSize) {
    const ls = wrap(s, sz, maxW, 99);
    if (ls.length <= maxLines) return { lines: ls, size: sz };
    sz -= 2;
  }
  return { lines: wrap(s, minSize, maxW, maxLines), size: minSize };
}

function text(x, y, s, { size = 22, weight = 400, fill = C.ink, anchor = "start" } = {}) {
  return `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${esc(s)}</text>`;
}

/** 여러 줄 글자를 (cx, cy) 가운데 기준으로 */
function block(cx, cy, lines, { size = 22, weight = 400, fill = C.ink, anchor = "middle", lh = 1.3 } = {}) {
  const total = (lines.length - 1) * size * lh;
  const y0 = cy - total / 2 + size * 0.35;
  return `<text font-family="${FONT}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${lines
    .map((l, i) => `<tspan x="${cx}" y="${Math.round(y0 + i * size * lh)}">${esc(l)}</tspan>`)
    .join("")}</text>`;
}

function rect(x, y, w, h, { fill = C.white, stroke = C.dark, sw = 2, r = 10 } = {}) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
}

function arrow(x1, y1, x2, y2) {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${C.dark}" stroke-width="3" marker-end="url(#arr)"/>`;
}

function frame(title, body, { caption = "" } = {}) {
  const t = fit(title, 44, W - PAD * 2, 1, 30);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${C.dark}"/></marker></defs>
<rect width="${W}" height="${H}" fill="${C.white}"/>
<rect x="${PAD}" y="${PAD - 20}" width="14" height="52" fill="${C.dark}"/>
${text(PAD + 30, PAD + 20, t.lines[0], { size: t.size, weight: 700 })}
<line x1="${PAD}" y1="${PAD + 52}" x2="${W - PAD}" y2="${PAD + 52}" stroke="${C.dark}" stroke-width="3"/>
${body}
${caption ? text(W / 2, H - 34, caption, { size: 20, fill: C.mid, anchor: "middle" }) : ""}
</svg>`;
}

const TOP = PAD + 100; // 본문 시작 y
const BOTTOM = H - 90; // 본문 끝 y

function emptyHint() {
  return block(W / 2, (TOP + BOTTOM) / 2, ["「넣고 싶은 내용」에 항목을 줄바꿈이나 쉼표로 적어 주세요", "예: 기반 구축 → 프로그램 운영 → 성과 확산"], {
    size: 26,
    fill: C.mid,
  });
}

/* ───────── 레이아웃별 그리기 ───────── */

function drawProcess(items) {
  const steps = items.slice(0, 6);
  if (!steps.length) return emptyHint();
  const n = steps.length;
  const gap = 56;
  const bw = Math.min(300, (W - PAD * 2 - gap * (n - 1)) / n);
  const total = bw * n + gap * (n - 1);
  const x0 = (W - total) / 2;
  const by = 330;
  const bh = 200;
  let out = "";
  steps.forEach((it, i) => {
    const x = x0 + i * (bw + gap);
    const last = i === n - 1;
    out += rect(x, by, bw, bh, { fill: last ? C.dark : C.fill, stroke: C.dark });
    out += `<circle cx="${x + bw / 2}" cy="${by}" r="26" fill="${C.white}" stroke="${C.dark}" stroke-width="3"/>`;
    out += text(x + bw / 2, by + 9, String(i + 1), { size: 26, weight: 700, anchor: "middle" });
    const t = fit(it.label, 30, bw - 32, 3, 20);
    out += block(x + bw / 2, by + bh / 2 + 6, t.lines, { size: t.size, weight: 700, fill: last ? C.white : C.ink });
    if (it.value || it.year) {
      out += block(x + bw / 2, by + bh + 52, [[it.year, it.value].filter(Boolean).join(" · ")], { size: 26, weight: 700, fill: C.dark });
    }
    if (!last) out += arrow(x + bw + 8, by + bh / 2, x + bw + gap - 8, by + bh / 2);
  });
  out += `<line x1="${x0}" y1="${by + bh + 100}" x2="${x0 + total}" y2="${by + bh + 100}" stroke="${C.line}" stroke-width="2" stroke-dasharray="8 8"/>`;
  return out;
}

function drawTimeline(items) {
  const steps = items.slice(0, 7);
  if (!steps.length) return emptyHint();
  const n = steps.length;
  const y = 470;
  const x0 = PAD + 60;
  const x1 = W - PAD - 60;
  const step = n > 1 ? (x1 - x0) / (n - 1) : 0;
  let out = `<line x1="${x0 - 30}" y1="${y}" x2="${x1 + 30}" y2="${y}" stroke="${C.dark}" stroke-width="5" marker-end="url(#arr)"/>`;
  const bw = Math.min(260, n > 1 ? step - 16 : 400);
  steps.forEach((it, i) => {
    const x = n > 1 ? x0 + i * step : W / 2;
    const bx = Math.max(PAD, Math.min(W - PAD - bw, x - bw / 2)); // 캔버스 밖으로 나가지 않게
    const up = i % 2 === 0;
    out += `<circle cx="${x}" cy="${y}" r="16" fill="${i === n - 1 ? C.dark : C.white}" stroke="${C.dark}" stroke-width="4"/>`;
    const when = it.year || it.value || `${i + 1}단계`;
    out += text(x, up ? y + 56 : y - 36, when, { size: 26, weight: 700, anchor: "middle", fill: C.dark });
    const t = fit(it.label, 26, bw - 24, 3, 20);
    const bh = 40 + t.lines.length * t.size * 1.3;
    const by = up ? y - 50 - bh : y + 80;
    out += rect(bx, by, bw, bh, { fill: C.fill, stroke: C.line });
    out += `<line x1="${x}" y1="${up ? by + bh : by}" x2="${x}" y2="${up ? y - 16 : y + 16}" stroke="${C.line}" stroke-width="2"/>`;
    out += block(bx + bw / 2, by + bh / 2, t.lines, { size: t.size, weight: 700 });
  });
  return out;
}

function unitOf(it) {
  return String(it.value || "").replace(/^-?[\d,.]+/, "");
}

function drawBars(items, { share = false } = {}) {
  const data = items.filter((it) => it.num != null).slice(0, 7);
  // 단위가 서로 다르면(%, 점, 명 …) 한 막대로 비교하면 오해가 생기므로 카드로 그린다
  const units = new Set(data.map(unitOf));
  if (data.length < 2 || units.size > 1) return drawCards(items);
  const max = Math.max(...data.map((d) => Math.abs(d.num))) || 1;
  const sum = data.reduce((a, d) => a + Math.max(0, d.num), 0) || 1;
  const labelW = 380;
  const chartX = PAD + labelW + 20;
  const chartW = W - PAD - chartX - 220;
  const rowH = Math.min(96, (BOTTOM - TOP) / data.length);
  const barH = Math.min(52, rowH - 26);
  const top = TOP + ((BOTTOM - TOP) - rowH * data.length) / 2;
  let out = `<line x1="${chartX}" y1="${top - 10}" x2="${chartX}" y2="${top + rowH * data.length}" stroke="${C.dark}" stroke-width="2"/>`;
  const maxIdx = data.reduce((m, d, i) => (d.num > data[m].num ? i : m), 0);
  data.forEach((d, i) => {
    const cy = top + i * rowH + rowH / 2;
    const name = [d.label, d.year].filter(Boolean).join(" ");
    const t = fit(name, 26, labelW - 10, 2, 20);
    out += block(chartX - 20, cy, t.lines, { size: t.size, weight: 700, anchor: "end" });
    const bw = Math.max(6, (Math.abs(d.num) / max) * chartW);
    out += `<rect x="${chartX}" y="${cy - barH / 2}" width="${bw}" height="${barH}" fill="${i === maxIdx ? C.dark : C.line}"/>`;
    const label = share ? `${d.value}  (${Math.round((Math.max(0, d.num) / sum) * 100)}%)` : d.value;
    out += text(chartX + bw + 16, cy + 9, label, { size: 26, weight: 700, fill: C.ink });
  });
  return out;
}

function drawCards(items) {
  const cards = items.slice(0, 6);
  if (!cards.length) return emptyHint();
  const cols = cards.length <= 3 ? cards.length : 3;
  const rows = Math.ceil(cards.length / cols);
  const gap = 32;
  const cw = (W - PAD * 2 - gap * (cols - 1)) / cols;
  const ch = Math.min(260, (BOTTOM - TOP - gap * (rows - 1)) / rows);
  const top = TOP + ((BOTTOM - TOP) - (ch * rows + gap * (rows - 1))) / 2;
  let out = "";
  cards.forEach((it, i) => {
    const x = PAD + (i % cols) * (cw + gap);
    const y = top + Math.floor(i / cols) * (ch + gap);
    out += rect(x, y, cw, ch, { fill: C.fill, stroke: C.line });
    out += `<rect x="${x}" y="${y}" width="${cw}" height="10" rx="5" fill="${C.dark}"/>`;
    if (it.value) {
      out += text(x + cw / 2, y + ch * 0.48, it.value, { size: 52, weight: 800, anchor: "middle" });
      const t = fit([it.label, it.year].filter(Boolean).join(" "), 26, cw - 40, 2, 20);
      out += block(x + cw / 2, y + ch * 0.76, t.lines, { size: t.size, fill: C.dark });
    } else {
      const t = fit(it.label, 30, cw - 40, 3, 20);
      out += block(x + cw / 2, y + ch / 2 + 4, t.lines, { size: t.size, weight: 700 });
    }
  });
  return out;
}

function drawThreeYear(items) {
  const years = [...new Set(items.map((it) => it.year).filter(Boolean))].sort().slice(0, 4);
  const cols = years.length >= 2 ? years : ["2025", "2026", "2027"];
  const buckets = cols.map(() => []);
  let rr = 0;
  items.forEach((it) => {
    const idx = cols.indexOf(it.year);
    if (idx >= 0) buckets[idx].push(it);
    else buckets[rr++ % cols.length].push(it);
  });
  const gap = 24;
  const cw = (W - PAD * 2 - gap * (cols.length - 1)) / cols.length;
  const headH = 90;
  const top = TOP + 10;
  let out = "";
  cols.forEach((y, i) => {
    const x = PAD + i * (cw + gap);
    out += `<path d="M${x} ${top} h${cw - 30} l30 ${headH / 2} l-30 ${headH / 2} h-${cw - 30} z" fill="${i === cols.length - 1 ? C.dark : C.mid}"/>`;
    out += text(x + cw / 2 - 15, top + headH / 2 + 12, `${y}년`, { size: 34, weight: 800, fill: C.white, anchor: "middle" });
    const list = buckets[i].slice(0, 4);
    const boxTop = top + headH + 24;
    const boxH = BOTTOM - boxTop;
    out += rect(x, boxTop, cw, boxH, { fill: C.fill, stroke: C.line });
    const rowH = boxH / Math.max(1, list.length);
    list.forEach((it, j) => {
      const cy = boxTop + rowH * j + rowH / 2;
      const s = it.value ? `${it.label} ${it.value}` : it.label;
      const t = fit(`· ${s}`, 26, cw - 40, 3, 20);
      out += block(x + 24, cy, t.lines, { size: t.size, anchor: "start", weight: 600 });
      if (j < list.length - 1) out += `<line x1="${x + 20}" y1="${boxTop + rowH * (j + 1)}" x2="${x + cw - 20}" y2="${boxTop + rowH * (j + 1)}" stroke="${C.line}" stroke-width="1.5"/>`;
    });
    if (!list.length) out += block(x + cw / 2, boxTop + boxH / 2, ["(내용 입력)"], { size: 22, fill: C.soft });
  });
  return out;
}

function quad(labels, cells, { axes = null } = {}) {
  const gx = PAD + (axes ? 60 : 0);
  const gw = W - PAD - gx;
  const gy = TOP;
  const gh = BOTTOM - TOP - (axes ? 50 : 0);
  const gap = 20;
  const cw = (gw - gap) / 2;
  const ch = (gh - gap) / 2;
  let out = "";
  for (let i = 0; i < 4; i++) {
    const x = gx + (i % 2) * (cw + gap);
    const y = gy + Math.floor(i / 2) * (ch + gap);
    const dark = i === 0;
    out += rect(x, y, cw, ch, { fill: dark ? C.dark : C.fill, stroke: C.dark, sw: dark ? 0 : 2 });
    out += text(x + 28, y + 52, labels[i], { size: 32, weight: 800, fill: dark ? C.white : C.ink });
    const list = (cells[i] || []).slice(0, 3);
    list.forEach((it, j) => {
      const s = it.value ? `${it.label} ${it.value}` : it.label;
      const t = fit(`· ${s}`, 26, cw - 60, 1, 20);
      out += text(x + 32, y + 110 + j * 46, t.lines[0], { size: t.size, fill: dark ? C.white : C.dark });
    });
  }
  if (axes) {
    out += arrow(gx - 30, gy + gh, gx - 30, gy);
    out += arrow(gx, gy + gh + 30, gx + gw, gy + gh + 30);
    out += `<text font-family="${FONT}" font-size="22" fill="${C.mid}" transform="translate(${gx - 44} ${gy + gh / 2}) rotate(-90)" text-anchor="middle">${esc(axes[0])}</text>`;
    out += text(gx + gw / 2, gy + gh + 64, axes[1], { size: 22, fill: C.mid, anchor: "middle" });
  }
  return out;
}

function drawSwot(items) {
  const keys = [
    { re: /^(S|강점)\s*[:：)]?\s*/i, i: 0 },
    { re: /^(W|약점)\s*[:：)]?\s*/i, i: 1 },
    { re: /^(O|기회)\s*[:：)]?\s*/i, i: 2 },
    { re: /^(T|위협)\s*[:：)]?\s*/i, i: 3 },
  ];
  const cells = [[], [], [], []];
  const rest = [];
  items.forEach((it) => {
    const k = keys.find((k) => k.re.test(it.raw));
    if (k) cells[k.i].push({ ...it, label: cleanLabel(it.label.replace(k.re, "")) || it.label });
    else rest.push(it);
  });
  // 칸 표시가 없는 항목은 가장 비어 있는 칸부터 채운다
  rest.forEach((it) => {
    const emptiest = cells.reduce((m, c, j) => (c.length < cells[m].length ? j : m), 0);
    cells[emptiest].push(it);
  });
  return quad(["S  강점", "W  약점", "O  기회", "T  위협"], cells);
}

/** "제목: 내용" 형식이면 칸 제목과 내용으로 나눈다 */
function splitHead(it) {
  const m = /^([^:：]{1,16})[:：]\s*(.+)$/.exec(it.raw);
  return m ? { head: m[1].trim(), body: parseItem(m[2]) } : null;
}

function drawMatrix(items) {
  const heads = ["집중 육성", "확대", "유지", "재검토"];
  const cells = [[], [], [], []];
  const headed = items.map(splitHead);
  if (headed.some(Boolean)) {
    // "집중 육성: ICC 연계 교과" → 같은 제목끼리 한 칸에
    const order = [];
    items.forEach((it, i) => {
      const h = headed[i];
      const key = h ? h.head : order[order.length - 1] || heads[0];
      let idx = order.indexOf(key);
      if (idx < 0 && order.length < 4) idx = order.push(key) - 1;
      if (idx < 0) idx = 3;
      cells[idx].push(h ? h.body : it);
    });
    order.forEach((h, i) => (heads[i] = h));
  } else {
    items.slice(0, 12).forEach((it, i) => cells[i % 4].push(it));
  }
  return quad(heads, cells, { axes: ["중요도", "실행 역량"] });
}

function drawOrg(items) {
  const head = items[0];
  const mid = items.slice(1, 4);
  const low = items.slice(4, 8);
  let out = "";
  const hw = 420;
  const hx = (W - hw) / 2;
  out += rect(hx, TOP, hw, 110, { fill: C.dark, stroke: C.dark });
  const ht = fit(head?.label || "TF 총괄", 34, hw - 40, 2, 22);
  out += block(W / 2, TOP + 55, ht.lines, { size: ht.size, weight: 800, fill: C.white });
  const rowY = TOP + 200;
  const drawRow = (list, y, h, fill) => {
    if (!list.length) return "";
    const gap = 36;
    const bw = Math.min(380, (W - PAD * 2 - gap * (list.length - 1)) / list.length);
    const total = bw * list.length + gap * (list.length - 1);
    const x0 = (W - total) / 2;
    let s = `<line x1="${x0 + bw / 2}" y1="${y - 40}" x2="${x0 + total - bw / 2}" y2="${y - 40}" stroke="${C.dark}" stroke-width="2"/>`;
    list.forEach((it, i) => {
      const x = x0 + i * (bw + gap);
      s += `<line x1="${x + bw / 2}" y1="${y - 40}" x2="${x + bw / 2}" y2="${y}" stroke="${C.dark}" stroke-width="2"/>`;
      s += rect(x, y, bw, h, { fill, stroke: C.dark });
      const t = fit(it.value ? `${it.label} (${it.value})` : it.label, 28, bw - 30, 2, 20);
      s += block(x + bw / 2, y + h / 2, t.lines, { size: t.size, weight: 700 });
    });
    return s;
  };
  out += `<line x1="${W / 2}" y1="${TOP + 110}" x2="${W / 2}" y2="${rowY - 40}" stroke="${C.dark}" stroke-width="2"/>`;
  out += drawRow(mid.length ? mid : [{ label: "운영위원회" }, { label: "실무추진단" }], rowY, 120, C.fill);
  if (low.length) out += drawRow(low, rowY + 230, 110, C.white);
  return out;
}

function drawCover(title, items) {
  const msgs = items.slice(0, 3);
  let out = rect(PAD, TOP, W - PAD * 2, 170, { fill: C.dark, stroke: C.dark, r: 14 });
  const lead = items.length ? items.map((i) => i.label).slice(0, 3).join(" · ") : title;
  const lt = fit(lead, 36, W - PAD * 2 - 80, 2, 24);
  out += block(W / 2, TOP + 85, lt.lines, { size: lt.size, weight: 800, fill: C.white });
  if (!msgs.length) return out;
  const gap = 28;
  const bw = (W - PAD * 2 - gap * (msgs.length - 1)) / msgs.length;
  const by = TOP + 220;
  const bh = BOTTOM - by;
  msgs.forEach((it, i) => {
    const x = PAD + i * (bw + gap);
    out += rect(x, by, bw, bh, { fill: C.fill, stroke: C.line });
    out += text(x + 32, by + 70, String(i + 1).padStart(2, "0"), { size: 48, weight: 800, fill: C.dark });
    const t = fit(it.label, 30, bw - 64, 3, 20);
    out += block(x + 32, by + 160, t.lines, { size: t.size, weight: 700, anchor: "start" });
    if (it.value) out += text(x + 32, by + bh - 40, [it.year, it.value].filter(Boolean).join(" "), { size: 34, weight: 800, fill: C.dark });
  });
  return out;
}

/* ───────── 바깥에서 부르는 함수 ───────── */

/**
 * @param {{ layoutId: string, direction: string, title?: string, frameName?: string }} opts
 * @returns {{ svg, title, caption, reasoning, keyMessages, source: "local" }}
 */
export function drawLocalFigure({ layoutId = "process", direction = "", title = "", frameName = "" } = {}) {
  const parsed = parseDirection(direction, { fallbackTitle: title || frameName });
  const figTitle = parsed.title;
  const items = parsed.items;
  let body;
  let how;
  switch (layoutId) {
    case "timeline":
      body = drawTimeline(items);
      how = "시간 순서대로 이어지는 일정이라 가로 타임라인으로 그렸습니다.";
      break;
    case "kpi":
    case "competency":
      body = drawBars(items);
      how = "숫자를 비교하기 쉽도록 막대그래프로 그렸습니다. 가장 큰 값은 진하게 표시했습니다.";
      break;
    case "budget":
      body = drawBars(items, { share: true });
      how = "항목별 금액과 전체에서 차지하는 비율을 막대로 보여 줍니다.";
      break;
    case "three-year":
      body = drawThreeYear(items);
      how = "연도별로 할 일을 나눠 3개년 표로 정리했습니다.";
      break;
    case "matrix":
      body = drawMatrix(items);
      how = "네 칸으로 나눠 서로 비교할 수 있게 그렸습니다.";
      break;
    case "swot":
      body = drawSwot(items);
      how = "강점·약점·기회·위협 네 칸으로 정리했습니다. 내용 앞에 '강점:'처럼 적으면 그 칸에 들어갑니다.";
      break;
    case "org":
      body = drawOrg(items);
      how = "맨 위에 총괄, 아래로 실무 조직이 이어지는 조직도로 그렸습니다. 첫 항목이 맨 위 칸이 됩니다.";
      break;
    case "section-cover":
      body = drawCover(figTitle, items);
      how = "장의 첫 페이지처럼 핵심 메시지 세 가지를 크게 보여 줍니다.";
      break;
    case "process":
    default:
      body = drawProcess(items);
      how = "단계가 차례대로 이어지도록 화살표 흐름도로 그렸습니다.";
  }
  const caption = `[그림] ${figTitle}`;
  return {
    svg: frame(figTitle, body, { caption }),
    title: figTitle,
    caption,
    reasoning: `${how} 적어 주신 내용에서 항목 ${items.length}개를 찾아 넣었습니다.`,
    keyMessages: items.slice(0, 3).map((it) => [it.label, it.value].filter(Boolean).join(" ")),
    source: "local",
  };
}
