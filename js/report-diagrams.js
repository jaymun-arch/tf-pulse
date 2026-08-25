/**
 * 연성대 자율혁신계획서 스타일 보고서 도식 (편집용 PPT)
 * - 참고: 흑백·회색 톤, 섹션번호, 중첩 박스, 블록 화살표, 매트릭스, 허브-스포크, 계층 전략도
 * - 박스·표·라벨이 PPT 도형이라 숫자·문구를 바로 수정 가능
 */

const BW = {
  ink: "1A1A1A",
  soft: "333333",
  gray: "555555",
  mid: "777777",
  line: "9A9A9A",
  lineSoft: "C8C8C8",
  fill: "F0F0F0",
  fillSoft: "F7F7F7",
  head: "4A4A4A",
  headDark: "333333",
  white: "FFFFFF",
  chip: "E8E8E8",
};

async function loadPptx() {
  const PptxGenJS = (await import("https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/+esm")).default;
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "LAYOUT_16x9", width: 10, height: 5.625 });
  pptx.layout = "LAYOUT_16x9";
  pptx.author = "TF Pulse";
  pptx.subject = "연성대 보고서 흑백 도식(편집용)";
  return pptx;
}

function slideBase(pptx, title, { dual = false } = {}) {
  const s = pptx.addSlide();
  s.addShape("rect", { x: 0, y: 0, w: 10, h: 5.625, fill: { color: BW.white } });
  // 상단 회색 타이틀 바 (계획서 양식)
  s.addShape("rect", {
    x: 0.28,
    y: 0.18,
    w: 9.44,
    h: 0.42,
    fill: { color: BW.fill },
    line: { color: BW.lineSoft, width: 0.75 },
  });
  s.addShape("rect", { x: 0.28, y: 0.18, w: 0.1, h: 0.42, fill: { color: BW.headDark } });
  s.addText(title || "개요", {
    x: 0.5,
    y: 0.2,
    w: 8.8,
    h: 0.38,
    fontSize: 15,
    bold: true,
    color: BW.ink,
    fontFace: "Malgun Gothic",
    valign: "middle",
  });
  s.addText("흑백 보고서 양식 · 박스·숫자를 직접 수정한 뒤 한글 보고서에 삽입하세요", {
    x: 0.35,
    y: 5.38,
    w: 9.3,
    h: 0.18,
    fontSize: 8,
    color: BW.mid,
    fontFace: "Malgun Gothic",
  });
  if (dual) {
    // 좌측 섹션 번호 1·2 가이드
    sectionNum(s, 0.12, 0.78, "1");
    sectionNum(s, 0.12, 3.05, "2");
  }
  return s;
}

function sectionNum(s, x, y, n) {
  s.addText(String(n), {
    x,
    y,
    w: 0.28,
    h: 0.32,
    fontSize: 16,
    bold: true,
    color: BW.headDark,
    fontFace: "Malgun Gothic",
    align: "center",
  });
}

function box(s, opts) {
  const {
    x,
    y,
    w,
    h,
    text,
    fill = BW.fill,
    color = BW.ink,
    bold = false,
    size = 10,
    align = "center",
    valign = "middle",
    radius = 0,
    lineColor = BW.line,
    lineW = 1,
  } = opts;
  const shape = radius > 0 ? "roundRect" : "rect";
  const shapeOpts = {
    x,
    y,
    w,
    h,
    fill: { color: fill },
    line: { color: lineColor, width: lineW },
  };
  if (radius > 0) shapeOpts.rectRadius = radius;
  s.addShape(shape, shapeOpts);
  if (text != null && text !== "") {
    s.addText(text, {
      x: x + 0.05,
      y: y + 0.04,
      w: w - 0.1,
      h: h - 0.08,
      fontSize: size,
      bold,
      color,
      fontFace: "Malgun Gothic",
      align,
      valign,
    });
  }
}

function headBar(s, { x, y, w, h = 0.32, text, fill = BW.head }) {
  box(s, {
    x,
    y,
    w,
    h,
    text,
    fill,
    color: BW.white,
    bold: true,
    size: 10,
  });
}

function numCircle(s, x, y, n, { dark = true, size = 0.36 } = {}) {
  s.addShape("ellipse", {
    x,
    y,
    w: size,
    h: size,
    fill: { color: dark ? BW.headDark : BW.white },
    line: { color: BW.headDark, width: 1.25 },
  });
  s.addText(String(n), {
    x,
    y,
    w: size,
    h: size,
    align: "center",
    valign: "middle",
    color: dark ? BW.white : BW.ink,
    bold: true,
    fontSize: 10,
    fontFace: "Malgun Gothic",
  });
}

function blockArrow(s, x, y, w = 0.42, h = 0.28) {
  s.addShape("rightArrow", {
    x,
    y,
    w,
    h,
    fill: { color: BW.mid },
    line: { color: BW.mid },
  });
}

function panelFrame(s, { x, y, w, h }) {
  s.addShape("rect", {
    x,
    y,
    w,
    h,
    fill: { color: BW.white },
    line: { color: BW.line, width: 1.35 },
  });
}

/** 1) 핵심사업 개요도 — 상단 중첩그리드 + 하단 3패널 프로세스 */
function buildOverview(pptx, labels = {}) {
  const s = slideBase(pptx, labels.title || "개요", { dual: true });
  const a = {
    topTitle: labels.topTitle || "핵심사업 운영체계 · 추진구조",
    cols: labels.cols || [
      { h: "선정사유", items: ["사회수요", "대학강점", "정책정합성"] },
      { h: "현황·필요성", items: ["진단", "격차", "과제도출"] },
      { h: "추진개요", items: ["목표", "대상", "방법"] },
      { h: "세부계획", items: ["연도활동", "지표", "담당"] },
    ],
    bottom: labels.bottom || "성과관리 · 환류(PDCA) · 기대효과 연계",
    p1: labels.p1 || { t: "인증·단계", d: "① 기본  ② 품질  ③ 혁신\n기준 충족 → 과정 고도화 → 확산" },
    p2: labels.p2 || { t: "추진 프로세스", d: "기획 → 실행 → 점검 → 개선", chips: ["기반", "확산", "안착"] },
    p3: labels.p3 || { t: "기대효과", d: "정량 지표 __\n정성 성과 __" },
  };

  // Section 1
  headBar(s, { x: 0.42, y: 0.78, w: 9.2, text: a.topTitle, fill: BW.head });
  const colW = 2.15;
  a.cols.forEach((c, i) => {
    const x = 0.42 + i * (colW + 0.12);
    box(s, { x, y: 1.18, w: colW, h: 0.34, text: c.h, fill: BW.headDark, color: BW.white, bold: true, size: 10 });
    c.items.forEach((it, j) => {
      box(s, {
        x: x + 0.08,
        y: 1.6 + j * 0.38,
        w: colW - 0.16,
        h: 0.34,
        text: it,
        fill: BW.fillSoft,
        size: 9,
        lineColor: BW.lineSoft,
      });
    });
  });
  box(s, {
    x: 0.42,
    y: 2.78,
    w: 9.2,
    h: 0.28,
    text: a.bottom,
    fill: BW.chip,
    size: 9,
    bold: true,
  });

  // Section 2 — 3 panels + block arrows
  const panels = [a.p1, a.p2, a.p3];
  panels.forEach((p, i) => {
    const x = 0.42 + i * 3.15;
    panelFrame(s, { x, y: 3.25, w: 2.95, h: 1.95 });
    headBar(s, { x: x + 0.08, y: 3.35, w: 2.79, text: p.t, h: 0.3 });
    if (i === 0) {
      [1, 2, 3].forEach((n, j) => {
        numCircle(s, x + 0.25 + j * 0.85, 3.8, n);
        box(s, {
          x: x + 0.18 + j * 0.85,
          y: 4.25,
          w: 0.75,
          h: 0.28,
          text: ["기본", "품질", "혁신"][j],
          fill: BW.fill,
          size: 8,
        });
      });
      box(s, {
        x: x + 0.12,
        y: 4.65,
        w: 2.7,
        h: 0.42,
        text: "과정 고도화 · 확산 연계",
        fill: BW.head,
        color: BW.white,
        size: 9,
      });
    } else if (i === 1) {
      box(s, { x: x + 0.12, y: 3.78, w: 2.7, h: 0.45, text: p.d, size: 9 });
      (p.chips || ["기반", "확산", "안착"]).forEach((c, j) => {
        box(s, {
          x: x + 0.12 + j * 0.9,
          y: 4.4,
          w: 0.82,
          h: 0.55,
          text: c,
          fill: BW.headDark,
          color: BW.white,
          bold: true,
          size: 10,
        });
      });
    } else {
      box(s, {
        x: x + 0.15,
        y: 3.85,
        w: 2.65,
        h: 0.55,
        text: "정량 성과",
        fill: BW.fill,
        size: 10,
        bold: true,
        radius: 0.08,
      });
      box(s, {
        x: x + 0.15,
        y: 4.5,
        w: 2.65,
        h: 0.55,
        text: "정성 성과",
        fill: BW.fill,
        size: 10,
        bold: true,
        radius: 0.08,
      });
    }
    if (i < 2) blockArrow(s, x + 2.98, 4.05, 0.38, 0.32);
  });
}

/** 2) 추진체계도 — 거버넌스 단계 + 성과공유 타임라인 */
function buildGovernance(pptx, labels = {}) {
  const s = slideBase(pptx, labels.title || "추진체계도", { dual: true });
  const steps = labels.steps || [
    "총괄·기획",
    "운영위원회",
    "실행부서",
    "협력기관",
    "점검·환류",
  ];
  const timeline = labels.timeline || [
    "협의체 구성",
    "다자협약",
    "공동기획",
    "실행·지원",
    "성과포럼",
    "환류·개선",
    "확산",
  ];

  headBar(s, { x: 0.42, y: 0.78, w: 9.2, text: "지산학·사업 추진 거버넌스", fill: BW.head });
  steps.forEach((t, i) => {
    const x = 0.45 + i * 1.88;
    const h = 0.9 + i * 0.18;
    const y = 2.55 - h;
    box(s, {
      x,
      y,
      w: 1.55,
      h,
      text: `${i + 1}\n${t}`,
      fill: i === steps.length - 1 ? BW.head : BW.fill,
      color: i === steps.length - 1 ? BW.white : BW.ink,
      bold: true,
      size: 10,
    });
    numCircle(s, x + 0.55, y - 0.42, i + 1, { size: 0.34 });
    if (i < steps.length - 1) blockArrow(s, x + 1.55, 1.85, 0.3, 0.22);
  });
  s.addShape("upArrow", {
    x: 8.85,
    y: 1.0,
    w: 0.55,
    h: 1.5,
    fill: { color: BW.mid },
    line: { color: BW.mid },
  });

  headBar(s, { x: 0.42, y: 3.15, w: 9.2, text: "성과공유·확산 경로", fill: BW.head });
  timeline.forEach((t, i) => {
    const y = 3.55 + i * 0.24;
    s.addShape("ellipse", {
      x: 0.55,
      y: y + 0.02,
      w: 0.16,
      h: 0.16,
      fill: { color: BW.white },
      line: { color: BW.headDark, width: 1.2 },
    });
    if (i < timeline.length - 1) {
      s.addShape("rect", {
        x: 0.61,
        y: y + 0.18,
        w: 0.04,
        h: 0.1,
        fill: { color: BW.line },
      });
    }
    box(s, {
      x: 0.9,
      y,
      w: 8.5,
      h: 0.22,
      text: t,
      fill: i % 2 === 0 ? BW.fill : BW.fillSoft,
      size: 9,
      align: "left",
      lineColor: BW.lineSoft,
    });
  });
}

/** 3) 인증단계모형 */
function buildCertification(pptx, labels = {}) {
  const s = slideBase(pptx, labels.title || "인증단계모형");
  const levels = labels.levels || [
    { t: "기본", d: "기준 충족 · 필수 지표 달성" },
    { t: "품질", d: "과정 고도화 · 환류 체계 운영" },
    { t: "혁신", d: "확산·선도 · 성과 공유" },
  ];
  headBar(s, { x: 0.5, y: 0.85, w: 9.0, text: "단계형 인증·품질 고도화 모형", fill: BW.head });

  levels.forEach((lv, i) => {
    const x = 0.7 + i * 3.05;
    panelFrame(s, { x, y: 1.45, w: 2.85, h: 3.4 });
    s.addShape("ellipse", {
      x: x + 0.75,
      y: 1.7,
      w: 1.35,
      h: 1.35,
      fill: { color: i === 2 ? BW.headDark : BW.fill },
      line: { color: BW.line, width: 1.5 },
    });
    s.addText(lv.t, {
      x: x + 0.75,
      y: 1.7,
      w: 1.35,
      h: 1.35,
      align: "center",
      valign: "middle",
      bold: true,
      color: i === 2 ? BW.white : BW.ink,
      fontSize: 16,
      fontFace: "Malgun Gothic",
    });
    numCircle(s, x + 1.2, 3.2, i + 1, { size: 0.4 });
    box(s, {
      x: x + 0.15,
      y: 3.75,
      w: 2.55,
      h: 0.9,
      text: lv.d,
      fill: BW.fill,
      size: 11,
    });
    if (i < 2) blockArrow(s, x + 2.85, 2.9, 0.4, 0.3);
  });
}

/** 4) ICC 매트릭스 — 2축 + 우측 전략박스 */
function buildIccMatrix(pptx, labels = {}) {
  const s = slideBase(pptx, labels.title || "ICC 특성화 매트릭스");
  headBar(s, {
    x: 0.4,
    y: 0.78,
    w: 9.2,
    text: "Y-ICC 특성화 · 시장확장 × 직무역량",
    fill: BW.head,
  });

  // axes labels
  s.addText("AI·DX\n심화 ↑", {
    x: 0.28,
    y: 2.2,
    w: 0.7,
    h: 0.9,
    fontSize: 9,
    color: BW.soft,
    fontFace: "Malgun Gothic",
    align: "center",
  });
  s.addText("시장·확장 →", {
    x: 3.2,
    y: 4.85,
    w: 2.5,
    h: 0.25,
    fontSize: 9,
    color: BW.soft,
    fontFace: "Malgun Gothic",
    align: "center",
  });

  const cells = labels.cells || [
    ["일반×활용\n(기반 협력)", "전문×활용\n디지털·ICT"],
    ["일반×심화\n바이오·뷰티", "전문×심화\nICC 핵심"],
  ];
  const points = labels.points || ["디지털/ICT", "스마트콘텐츠", "바이오헬스", "뷰티", "푸드"];

  s.addTable(
    [
      [
        { text: "", options: { fill: { color: BW.white } } },
        {
          text: "일반",
          options: { fill: { color: BW.head }, color: BW.white, bold: true, align: "center" },
        },
        {
          text: "전문",
          options: { fill: { color: BW.head }, color: BW.white, bold: true, align: "center" },
        },
      ],
      [
        { text: "심화", options: { fill: { color: BW.fill }, bold: true, align: "center" } },
        { text: cells[1][0], options: { align: "center", valign: "middle" } },
        {
          text: cells[1][1],
          options: { align: "center", valign: "middle", fill: { color: BW.chip }, bold: true },
        },
      ],
      [
        { text: "활용", options: { fill: { color: BW.fill }, bold: true, align: "center" } },
        { text: cells[0][0], options: { align: "center", valign: "middle" } },
        { text: cells[0][1], options: { align: "center", valign: "middle" } },
      ],
    ],
    {
      x: 1.0,
      y: 1.3,
      w: 5.6,
      colW: [0.9, 2.35, 2.35],
      rowH: [0.35, 1.45, 1.45],
      border: [{ pt: 1.1, color: BW.line }],
      fontFace: "Malgun Gothic",
      fontSize: 11,
      color: BW.ink,
    }
  );

  // scatter-like chips
  points.forEach((p, i) => {
    box(s, {
      x: 1.3 + (i % 3) * 1.7,
      y: 4.55 + Math.floor(i / 3) * 0.28,
      w: 1.55,
      h: 0.24,
      text: `● ${p}`,
      fill: BW.white,
      size: 8,
      align: "left",
      lineColor: BW.lineSoft,
    });
  });

  // right strategy stack
  const strat = labels.strat || ["특성화 과제 발굴", "융합 현장실습", "성과공유·확산"];
  strat.forEach((t, i) => {
    box(s, {
      x: 6.95,
      y: 1.35 + i * 1.15,
      w: 2.6,
      h: 0.95,
      text: t,
      fill: BW.fill,
      bold: true,
      size: 12,
    });
  });
}

/** 5) 플랫폼 순환도 — 중앙 허브 + 4방향 카드 */
function buildPlatform(pptx, labels = {}) {
  const s = slideBase(pptx, labels.title || "플랫폼 순환도");
  const hub = labels.hub || "지역산업\n혁신·성장\n플랫폼";
  const nodes = labels.nodes || [
    { t: "테크클리닉", d: "기술지원·자문" },
    { t: "재직자교육", d: "AI+X·직무재교육" },
    { t: "R&BD", d: "공동과제·기술개발" },
    { t: "공유자산", d: "장비·공간 플랫폼" },
  ];

  headBar(s, { x: 0.4, y: 0.78, w: 9.2, text: "지역산업 혁신·성장 플랫폼 운영", fill: BW.head });

  // center hub (hexagon approx via roundRect)
  box(s, {
    x: 3.55,
    y: 2.35,
    w: 2.9,
    h: 1.55,
    text: hub,
    fill: BW.head,
    color: BW.white,
    bold: true,
    size: 13,
    radius: 0.12,
  });

  const pos = [
    { x: 0.5, y: 1.35 },
    { x: 6.9, y: 1.35 },
    { x: 0.5, y: 3.85 },
    { x: 6.9, y: 3.85 },
  ];
  nodes.forEach((n, i) => {
    const p = pos[i];
    panelFrame(s, { x: p.x, y: p.y, w: 2.55, h: 1.35 });
    s.addShape("ellipse", {
      x: p.x + 0.15,
      y: p.y + 0.35,
      w: 0.55,
      h: 0.55,
      fill: { color: BW.fill },
      line: { color: BW.headDark, width: 1.2 },
    });
    s.addText(["💻", "👥", "⚙", "📦"][i], {
      x: p.x + 0.15,
      y: p.y + 0.35,
      w: 0.55,
      h: 0.55,
      align: "center",
      valign: "middle",
      fontSize: 12,
    });
    s.addText(n.t, {
      x: p.x + 0.8,
      y: p.y + 0.25,
      w: 1.6,
      h: 0.4,
      bold: true,
      fontSize: 12,
      color: BW.ink,
      fontFace: "Malgun Gothic",
      valign: "middle",
    });
    s.addText(n.d, {
      x: p.x + 0.8,
      y: p.y + 0.7,
      w: 1.6,
      h: 0.45,
      fontSize: 10,
      color: BW.soft,
      fontFace: "Malgun Gothic",
    });
    // arrow toward center
    const ax = i % 2 === 0 ? p.x + 2.55 : p.x - 0.45;
    blockArrow(s, ax, p.y + 0.5, 0.4, 0.28);
  });
}

/** 6) 성과확산모형 — 수직 노드 타임라인 + 우측 확산 */
function buildDiffusion(pptx, labels = {}) {
  const s = slideBase(pptx, labels.title || "성과확산모형");
  const items = labels.items || ["성과 창출", "공유·포럼", "지역·산업 확산", "환류·개선"];
  headBar(s, { x: 0.4, y: 0.8, w: 9.2, text: "성과공유·확산 · 환류 구조", fill: BW.head });

  items.forEach((t, i) => {
    const x = 0.5 + i * 2.35;
    panelFrame(s, { x, y: 1.5, w: 2.15, h: 3.2 });
    numCircle(s, x + 0.8, 1.75, i + 1, { size: 0.5 });
    box(s, {
      x: x + 0.12,
      y: 2.5,
      w: 1.9,
      h: 0.7,
      text: t,
      fill: BW.headDark,
      color: BW.white,
      bold: true,
      size: 12,
    });
    box(s, {
      x: x + 0.12,
      y: 3.4,
      w: 1.9,
      h: 1.05,
      text: "내용·주체\n(__)",
      fill: BW.fillSoft,
      size: 10,
    });
    if (i < items.length - 1) blockArrow(s, x + 2.12, 2.85, 0.38, 0.3);
  });
}

/** 7) 성과향상 — 상승 막대 + 비교 바 */
function buildImprovement(pptx, labels = {}) {
  const s = slideBase(pptx, labels.title || "성과향상모형");
  const years = labels.years || [
    { y: "2025", v: "기반", n: "(__)" },
    { y: "2026", v: "확산", n: "(__)" },
    { y: "2027", v: "고도화", n: "(__)" },
  ];
  headBar(s, { x: 0.4, y: 0.8, w: 5.5, text: "연도별 성과 향상 추이", fill: BW.head });
  headBar(s, { x: 6.1, y: 0.8, w: 3.5, text: "비교(평균)", fill: BW.head });

  years.forEach((yr, i) => {
    const h = 1.35 + i * 0.65;
    const y = 4.55 - h;
    box(s, {
      x: 0.7 + i * 1.75,
      y,
      w: 1.45,
      h,
      text: `${yr.y}\n\n${yr.v}\n${yr.n}`,
      fill: i === 2 ? BW.headDark : BW.fill,
      color: i === 2 ? BW.white : BW.ink,
      bold: true,
      size: 11,
    });
    // total capsule
    box(s, {
      x: 0.8 + i * 1.75,
      y: y - 0.32,
      w: 1.25,
      h: 0.28,
      text: "총계 __",
      fill: BW.headDark,
      color: BW.white,
      size: 9,
      radius: 0.1,
    });
  });

  const comps = labels.comps || [
    { t: "본교", v: "(__)", dark: true },
    { t: "전국 평균", v: "(__)", dark: false },
    { t: "수도권 평균", v: "(__)", dark: false },
  ];
  comps.forEach((c, i) => {
    const h = 2.4 - i * 0.35;
    box(s, {
      x: 6.35,
      y: 4.55 - h,
      w: 1.1 + (c.dark ? 0.9 : 0.35),
      h: 0.45,
      text: "",
      fill: c.dark ? BW.headDark : BW.mid,
      lineColor: c.dark ? BW.headDark : BW.mid,
    });
    s.addText(`${c.t}  ${c.v}`, {
      x: 6.35,
      y: 1.4 + i * 0.85,
      w: 3.0,
      h: 0.3,
      fontSize: 11,
      bold: true,
      color: BW.ink,
      fontFace: "Malgun Gothic",
    });
  });
}

/** 8) 로드맵 — 비전·목표·전략 계층 + 3개년 표 */
function buildRoadmap(pptx, labels = {}) {
  const s = slideBase(pptx, labels.title || "3개년 추진 로드맵", { dual: true });

  // Section 1: specialization-like hierarchy
  box(s, {
    x: 0.4,
    y: 0.75,
    w: 1.35,
    h: 0.32,
    text: "비전",
    fill: BW.headDark,
    color: BW.white,
    bold: true,
    size: 10,
  });
  box(s, {
    x: 1.85,
    y: 0.75,
    w: 7.75,
    h: 0.32,
    text: labels.vision || "글로컬 평생직업교육의 NeXt-Gen University",
    fill: BW.head,
    color: BW.white,
    bold: true,
    size: 10,
  });
  box(s, {
    x: 0.4,
    y: 1.15,
    w: 1.35,
    h: 0.32,
    text: "목표",
    fill: BW.headDark,
    color: BW.white,
    bold: true,
    size: 10,
  });
  box(s, {
    x: 1.85,
    y: 1.15,
    w: 7.75,
    h: 0.32,
    text: labels.goal || "지속가능한 성장을 이끄는 가치창출형 대학 생태계 혁신",
    fill: BW.fill,
    bold: true,
    size: 10,
  });

  const pillars = labels.pillars || [
    { t: "교육혁신", d: "전공트랙 · AI+X" },
    { t: "지산학협력", d: "ICC · 성과공유" },
    { t: "성과관리", d: "KPI · 환류" },
  ];
  pillars.forEach((p, i) => {
    box(s, {
      x: 0.4 + i * 3.15,
      y: 1.6,
      w: 3.0,
      h: 0.95,
      text: `${p.t}\n${p.d}`,
      fill: BW.fillSoft,
      bold: true,
      size: 11,
      radius: 0.08,
    });
  });

  // funnel hint
  s.addShape("downArrow", {
    x: 4.55,
    y: 2.65,
    w: 0.9,
    h: 0.4,
    fill: { color: BW.mid },
    line: { color: BW.mid },
  });

  // Section 2: year table
  s.addTable(
    [
      [
        { text: "구분", options: { fill: { color: BW.headDark }, color: BW.white, bold: true, align: "center" } },
        { text: "2025", options: { fill: { color: BW.headDark }, color: BW.white, bold: true, align: "center" } },
        { text: "2026", options: { fill: { color: BW.headDark }, color: BW.white, bold: true, align: "center" } },
        { text: "2027", options: { fill: { color: BW.headDark }, color: BW.white, bold: true, align: "center" } },
      ],
      ["핵심활동", "기반 구축\n(__)", "확산\n(__)", "안착·고도화\n(__)"],
      ["정량지표", "__ / 목표 __", "__ / 목표 __", "__ / 목표 __"],
      ["산출물", "__", "__", "__"],
      ["담당·협력", "__", "__", "__"],
    ].map((row, ri) =>
      ri === 0
        ? row
        : row.map((c, ci) =>
            ci === 0
              ? { text: c, options: { fill: { color: BW.fill }, bold: true, align: "center" } }
              : { text: c, options: { align: "center", valign: "middle" } }
          )
    ),
    {
      x: 0.4,
      y: 3.15,
      w: 9.2,
      colW: [1.5, 2.55, 2.55, 2.6],
      border: [{ pt: 1, color: BW.line }],
      fontFace: "Malgun Gothic",
      fontSize: 11,
      color: BW.ink,
      valign: "middle",
    }
  );
}

const BUILDERS = {
  overview: buildOverview,
  governance: buildGovernance,
  certification: buildCertification,
  "icc-matrix": buildIccMatrix,
  platform: buildPlatform,
  diffusion: buildDiffusion,
  improvement: buildImprovement,
  roadmap: buildRoadmap,
};

export const DIAGRAM_MATERIALS = [
  { id: "overview", name: "핵심사업 개요도", desc: "중첩 그리드 + 프로세스 패널" },
  { id: "governance", name: "거버넌스·추진체계", desc: "계층 바 + 단계 타임라인" },
  { id: "certification", name: "인증·단계 체계", desc: "3단계 패널·화살표" },
  { id: "icc-matrix", name: "ICC 매트릭스", desc: "2×2 + 전략 박스" },
  { id: "platform", name: "플랫폼·허브", desc: "중심 허브 + 프로그램" },
  { id: "diffusion", name: "확산 프로세스", desc: "4단계 흐름" },
  { id: "improvement", name: "개선·성과 비교", desc: "연도 막대 + 비교" },
  { id: "roadmap", name: "로드맵", desc: "비전·필러·연도표" },
];

function addDiagramCover(pptx, { title, subtitle } = {}) {
  const s = pptx.addSlide();
  s.addShape("rect", { x: 0, y: 0, w: 10, h: 5.625, fill: { color: BW.white } });
  s.addShape("rect", { x: 0, y: 0, w: 0.16, h: 5.625, fill: { color: BW.headDark } });
  s.addText("연성대학교 · TF Pulse", {
    x: 0.6,
    y: 1.4,
    w: 8.8,
    h: 0.35,
    fontSize: 13,
    color: BW.mid,
    fontFace: "Malgun Gothic",
  });
  s.addText(title || "보고서 도식 재료 키트", {
    x: 0.6,
    y: 1.9,
    w: 8.8,
    h: 0.6,
    fontSize: 26,
    bold: true,
    color: BW.ink,
    fontFace: "Malgun Gothic",
  });
  s.addText(
    subtitle ||
      "흑백 편집용 도식입니다. 박스·표·숫자를 수정해 상세 그림을 완성하고 한글 보고서에 삽입하세요.",
    {
      x: 0.6,
      y: 2.7,
      w: 8.5,
      h: 1.0,
      fontSize: 13,
      color: BW.soft,
      fontFace: "Malgun Gothic",
    }
  );
}

function addDiagramPurposeSlide(pptx, labels = {}) {
  const s = pptx.addSlide();
  s.addShape("rect", { x: 0, y: 0, w: 10, h: 5.625, fill: { color: BW.white } });
  s.addShape("rect", {
    x: 0.35,
    y: 0.3,
    w: 9.3,
    h: 0.45,
    fill: { color: BW.fill },
    line: { color: BW.lineSoft, width: 0.75 },
  });
  s.addText("도식 기획 · 핵심 메시지", {
    x: 0.5,
    y: 0.35,
    w: 9,
    h: 0.35,
    fontSize: 16,
    bold: true,
    color: BW.ink,
    fontFace: "Malgun Gothic",
    valign: "middle",
  });
  box(s, {
    x: 0.4,
    y: 1.0,
    w: 9.2,
    h: 1.2,
    text: `목적\n${labels.purpose || "이 도식으로 전달할 핵심 목적·독자·활용 장면을 적습니다."}`,
    fill: BW.fillSoft,
    align: "left",
    valign: "top",
    size: 13,
  });
  const msgs = Array.isArray(labels.keyMessages) && labels.keyMessages.length
    ? labels.keyMessages
    : ["핵심 메시지 1 (수정)", "핵심 메시지 2 (수정)", "핵심 메시지 3 (수정)"];
  msgs.slice(0, 4).forEach((m, i) => {
    const y = 2.45 + i * 0.55;
    numCircle(s, 0.5, y + 0.05, i + 1);
    box(s, {
      x: 1.05,
      y,
      w: 8.4,
      h: 0.45,
      text: m,
      fill: BW.white,
      align: "left",
      size: 13,
    });
  });
}

function addDiagramIndexSlide(pptx, focusId) {
  const s = pptx.addSlide();
  s.addShape("rect", { x: 0, y: 0, w: 10, h: 5.625, fill: { color: BW.white } });
  s.addText("도식 재료 목차", {
    x: 0.5,
    y: 0.35,
    w: 9,
    h: 0.4,
    fontSize: 20,
    bold: true,
    color: BW.ink,
    fontFace: "Malgun Gothic",
  });
  const rows = DIAGRAM_MATERIALS.map((d, i) => [
    { text: String(i + 1), options: { align: "center" } },
    {
      text: d.name + (d.id === focusId ? " ★" : ""),
      options: { bold: d.id === focusId },
    },
    { text: d.desc, options: {} },
  ]);
  s.addTable(
    [
      [
        { text: "No", options: { fill: { color: BW.head }, color: BW.white, bold: true, align: "center" } },
        { text: "도식", options: { fill: { color: BW.head }, color: BW.white, bold: true, align: "center" } },
        { text: "구성", options: { fill: { color: BW.head }, color: BW.white, bold: true, align: "center" } },
      ],
      ...rows,
    ],
    {
      x: 0.5,
      y: 0.95,
      w: 9,
      colW: [0.7, 3.0, 5.3],
      border: [{ pt: 0.5, color: BW.line }],
      fontFace: "Malgun Gothic",
      fontSize: 12,
      color: BW.ink,
    }
  );
}

function addDiagramTipSlide(pptx) {
  const tip = pptx.addSlide();
  tip.addShape("rect", { x: 0, y: 0, w: 10, h: 5.625, fill: { color: BW.white } });
  tip.addShape("rect", {
    x: 0.4,
    y: 0.9,
    w: 9.2,
    h: 0.5,
    fill: { color: BW.fill },
    line: { color: BW.lineSoft, width: 0.75 },
  });
  tip.addText("한글 보고서 활용 · 상세 그림 완성 안내", {
    x: 0.55,
    y: 0.95,
    w: 8.8,
    h: 0.4,
    fontSize: 18,
    bold: true,
    color: BW.ink,
    fontFace: "Malgun Gothic",
    valign: "middle",
  });
  tip.addText(
    [
      { text: "1. 필요한 도식 슬라이드를 복제하고, 박스·표·숫자를 더블클릭해 실제 내용으로 수정합니다.", options: { breakLine: true } },
      { text: "2. 같은 유형의 '빈 골격' 슬라이드가 있으면 다른 사업·장에 재사용하세요.", options: { breakLine: true } },
      { text: "3. 한글(HWP)에서는 PPT 슬라이드 복사·붙여넣기 또는 그림으로 삽입합니다.", options: { breakLine: true } },
      { text: "4. 흑백·회색 톤·섹션번호·중첩박스는 자율혁신계획서 도식 양식을 따릅니다.", options: { breakLine: true } },
      { text: "5. 수치 수정이 잦으면 AI 비트맵보다 이 편집용 PPT를 기본 재료로 쓰세요.", options: { breakLine: true } },
    ],
    {
      x: 0.7,
      y: 1.7,
      w: 8.5,
      h: 3.0,
      fontSize: 14,
      color: BW.soft,
      fontFace: "Malgun Gothic",
      paraSpacing: 10,
    }
  );
}

/**
 * 도식 재료를 기존 pptx에 추가
 */
export function appendDiagramMaterialsDeck(pptx, opts = {}) {
  const typeId = opts.typeId || "overview";
  const labels = opts.labels || {};
  const title = opts.title || labels.title || "보고서 도식";
  const includeAll = opts.includeAll !== false;

  if (opts.withCover !== false) {
    addDiagramCover(pptx, {
      title: opts.packTitle || "보고서 도식 재료 키트",
      subtitle: opts.packSubtitle,
    });
  }
  if (opts.withPurpose !== false) addDiagramPurposeSlide(pptx, { ...labels, purpose: labels.purpose });
  if (includeAll) addDiagramIndexSlide(pptx, typeId);

  const focusBuilder = BUILDERS[typeId] || buildOverview;
  focusBuilder(pptx, { ...labels, title });

  // 같은 타입 빈 골격(라벨 최소) — 복제·재사용용
  const blankLabels = { title: `${title} (빈 골격 · 수정용)` };
  focusBuilder(pptx, blankLabels);

  if (includeAll) {
    DIAGRAM_MATERIALS.forEach((d) => {
      if (d.id === typeId) return;
      const b = BUILDERS[d.id];
      if (!b) return;
      b(pptx, { title: d.name });
    });
  }

  if (opts.withTip !== false) addDiagramTipSlide(pptx);
}

/** 화면 미리보기·작도 애니메이션용 와이어프레임 (참고도식 구조 반영) */
export function diagramPreviewWireHtml(typeId) {
  const map = {
    overview: `
      <div class="dw-slide dw-rich" data-dw="${typeId}">
        <div class="dw-head"><i></i><b class="dw-late"></b></div>
        <div class="dw-sec">
          <div class="dw-sec-num dw-s1">1</div>
          <div class="dw-grid4 dw-s2">
            <div class="dw-col"><div class="dw-hbar"></div><i></i><i></i><i></i></div>
            <div class="dw-col"><div class="dw-hbar"></div><i></i><i></i><i></i></div>
            <div class="dw-col"><div class="dw-hbar"></div><i></i><i></i><i></i></div>
            <div class="dw-col"><div class="dw-hbar"></div><i></i><i></i><i></i></div>
          </div>
          <div class="dw-band dw-s3"></div>
        </div>
        <div class="dw-sec">
          <div class="dw-sec-num dw-s3">2</div>
          <div class="dw-panels3 dw-s4">
            <div class="dw-panel"></div><span class="dw-block-arr"></span>
            <div class="dw-panel"></div><span class="dw-block-arr"></span>
            <div class="dw-panel"></div>
          </div>
        </div>
      </div>`,
    governance: `
      <div class="dw-slide dw-rich" data-dw="${typeId}">
        <div class="dw-head"><i></i><b class="dw-late"></b></div>
        <div class="dw-bars-asc dw-s2">
          <div class="dw-bar" style="--h:35%"></div>
          <div class="dw-bar" style="--h:50%"></div>
          <div class="dw-bar" style="--h:65%"></div>
          <div class="dw-bar" style="--h:80%"></div>
          <div class="dw-bar" style="--h:95%"></div>
        </div>
        <div class="dw-timeline dw-s4">
          <div></div><div></div><div></div><div></div><div></div>
        </div>
      </div>`,
    certification: `
      <div class="dw-slide dw-rich" data-dw="${typeId}">
        <div class="dw-head"><i></i><b class="dw-late"></b></div>
        <div class="dw-cert3">
          <div class="dw-cert-card dw-s2"><o></o><div class="dw-box"></div></div>
          <span class="dw-block-arr dw-s3"></span>
          <div class="dw-cert-card dw-s3"><o></o><div class="dw-box"></div></div>
          <span class="dw-block-arr dw-s4"></span>
          <div class="dw-cert-card dw-s4"><o class="dark"></o><div class="dw-box dark"></div></div>
        </div>
      </div>`,
    "icc-matrix": `
      <div class="dw-slide dw-rich" data-dw="${typeId}">
        <div class="dw-head"><i></i><b class="dw-late"></b></div>
        <div class="dw-matrix-wrap">
          <div class="dw-matrix dw-s2">
            <div class="dw-s3"></div><div class="dw-s3 on"></div>
            <div class="dw-s4"></div><div class="dw-s4"></div>
          </div>
          <div class="dw-side-stack dw-s4"><i></i><i></i><i></i></div>
        </div>
      </div>`,
    platform: `
      <div class="dw-slide dw-rich" data-dw="${typeId}">
        <div class="dw-head"><i></i><b class="dw-late"></b></div>
        <div class="dw-plat-rich">
          <div class="dw-node dw-s2"></div>
          <div class="dw-node dw-s2"></div>
          <div class="dw-hub dw-s3"></div>
          <div class="dw-node dw-s4"></div>
          <div class="dw-node dw-s4"></div>
        </div>
      </div>`,
    diffusion: `
      <div class="dw-slide dw-rich" data-dw="${typeId}">
        <div class="dw-head"><i></i><b class="dw-late"></b></div>
        <div class="dw-flow-cards">
          <div class="dw-panel dw-s1"></div><span class="dw-block-arr dw-s2"></span>
          <div class="dw-panel dw-s2"></div><span class="dw-block-arr dw-s3"></span>
          <div class="dw-panel dw-s3"></div><span class="dw-block-arr dw-s4"></span>
          <div class="dw-panel dw-s4"></div>
        </div>
      </div>`,
    improvement: `
      <div class="dw-slide dw-rich" data-dw="${typeId}">
        <div class="dw-head"><i></i><b class="dw-late"></b></div>
        <div class="dw-improve">
          <div class="dw-bars">
            <div class="dw-bar dw-s2" style="--h:40%"></div>
            <div class="dw-bar dw-s3" style="--h:65%"></div>
            <div class="dw-bar dw-s4" style="--h:90%"></div>
          </div>
          <div class="dw-comp-bars dw-s4">
            <div style="--w:90%"></div>
            <div style="--w:70%"></div>
            <div style="--w:60%"></div>
          </div>
        </div>
      </div>`,
    roadmap: `
      <div class="dw-slide dw-rich" data-dw="${typeId}">
        <div class="dw-head"><i></i><b class="dw-late"></b></div>
        <div class="dw-vision-row dw-s2"><b></b><i></i></div>
        <div class="dw-pillars dw-s3"><div></div><div></div><div></div></div>
        <div class="dw-table dw-s4">
          <div class="dw-tr head"></div>
          <div class="dw-tr"></div>
          <div class="dw-tr"></div>
          <div class="dw-tr"></div>
        </div>
      </div>`,
  };
  return map[typeId] || map.overview;
}

/**
 * 선택한 도식 타입을 흑백 편집용 PPT로 저장 (표지·메시지·본도식·빈골격·전체 재료·안내)
 */
export async function downloadEditableDiagramPpt({
  typeId = "overview",
  title = "",
  fileName = "",
  labels = {},
  includeAll = true,
} = {}) {
  const pptx = await loadPptx();
  pptx.title = title || "보고서_도식_편집용";
  appendDiagramMaterialsDeck(pptx, {
    typeId,
    title,
    labels,
    includeAll,
    withCover: true,
    withPurpose: true,
    withTip: true,
  });

  const safe = (fileName || title || "보고서_도식_편집용").replace(/[\\/:*?"<>|]/g, "_");
  await pptx.writeFile({ fileName: `${safe}.pptx` });
  return { ok: true };
}
