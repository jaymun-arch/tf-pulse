/**
 * 연성대 자율혁신계획서 보고서 양식 스타일 레이아웃 PPT
 * - 회색 톤 표·요약박스·장번호 배지 등 공식 보고서 레이아웃을 편집 가능한 PPT로 제공
 */

const YS = {
  ink: "222222",
  inkSoft: "444444",
  gray: "6B6B6B",
  grayMid: "8A8A8A",
  grayHead: "7A7A7A",
  grayCell: "F0F0F0",
  grayLine: "BDBDBD",
  grayBox: "F7F7F7",
  white: "FFFFFF",
  accent: "4A4A4A",
  navy: "0B2C5F",
};

async function loadPptx() {
  const PptxGenJS = (await import("https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/+esm")).default;
  return new PptxGenJS();
}

function addFooter(slide, note = "연성대학교 혁신지원사업 보고서 양식 · TF Pulse · 플레이스홀더를 수정해 사용하세요") {
  slide.addText(note, {
    x: 0.4,
    y: 5.35,
    w: 9.2,
    h: 0.25,
    fontSize: 9,
    color: YS.grayMid,
    fontFace: "Malgun Gothic",
  });
}

/** 장번호 회색 사각 + 제목 */
function addChapterTitle(slide, { no = "3", title = "대학 역량 분석", x = 0.4, y = 0.28 } = {}) {
  slide.addShape("rect", {
    x,
    y,
    w: 0.38,
    h: 0.38,
    fill: { color: YS.grayHead },
    line: { color: YS.grayHead },
  });
  slide.addText(String(no), {
    x,
    y,
    w: 0.38,
    h: 0.38,
    align: "center",
    valign: "middle",
    bold: true,
    fontSize: 14,
    color: YS.white,
    fontFace: "Malgun Gothic",
  });
  slide.addText(title, {
    x: x + 0.48,
    y: y - 0.02,
    w: 8.5,
    h: 0.42,
    bold: true,
    fontSize: 20,
    color: YS.ink,
    fontFace: "Malgun Gothic",
  });
}

/** ▶ 소제목 */
function addSubhead(slide, text, { x = 0.4, y = 0.78, w = 9.2 } = {}) {
  slide.addText(
    [
      { text: "▶ ", options: { color: YS.grayHead, bold: true } },
      { text, options: { color: YS.ink, bold: true } },
    ],
    {
      x,
      y,
      w,
      h: 0.32,
      fontSize: 13,
      fontFace: "Malgun Gothic",
    }
  );
}

/** 요약 박스 */
function addSummaryBox(slide, lines, { x = 0.4, y = 1.12, w = 9.2, h = 0.85 } = {}) {
  slide.addShape("rect", {
    x,
    y,
    w,
    h,
    fill: { color: YS.white },
    line: { color: YS.grayLine, width: 1 },
  });
  const bullets = (lines || []).map((t) => ({
    text: t,
    options: { bullet: false, breakLine: true },
  }));
  slide.addText(
    bullets.length
      ? bullets
      : [{ text: "· 핵심 요약 문장을 여기에 입력하세요.", options: { breakLine: true } }],
    {
      x: x + 0.15,
      y: y + 0.08,
      w: w - 0.3,
      h: h - 0.12,
      fontSize: 11,
      color: YS.inkSoft,
      fontFace: "Malgun Gothic",
      valign: "top",
    }
  );
}

/** 레이아웃 카탈로그 */
export const REPORT_LAYOUTS = [
  {
    id: "competency",
    name: "대학 역량 분석",
    desc: "요약박스 + 좌측 추이표 + 우측 라인차트 (계획서 전형 페이지)",
    preview: "표·그래프 2단",
    icon: "fi-rr-chart-line-up",
  },
  {
    id: "section-cover",
    name: "장 표지·핵심요약",
    desc: "장번호·소제목·요약박스·본문 불릿 구성",
    preview: "요약형",
    icon: "fi-rr-book-open-cover",
  },
  {
    id: "three-year",
    name: "3개년 추진계획",
    desc: "2025–2027 연도별 활동·지표 표 레이아웃",
    preview: "연도 표",
    icon: "fi-rr-calendar-lines",
  },
  {
    id: "process",
    name: "추진체계·프로세스",
    desc: "단계 박스와 화살표로 추진체계를 표현",
    preview: "프로세스",
    icon: "fi-rr-workflow",
  },
  {
    id: "kpi",
    name: "성과지표 대시보드",
    desc: "핵심 수치 카드 + 세부 지표 표",
    preview: "KPI",
    icon: "fi-rr-chart-simple",
  },
  {
    id: "matrix",
    name: "비교·매트릭스",
    desc: "2축 비교표와 해석 요약 박스",
    preview: "매트릭스",
    icon: "fi-rr-grid-alt",
  },
];

/** 카드·플로팅용 대략 레이아웃 와이어프레임 HTML */
export function layoutPreviewWireHtml(id) {
  const wires = {
    competency: `
      <div class="lw-slide">
        <div class="lw-title"><i></i><b></b></div>
        <div class="lw-sub"></div>
        <div class="lw-box"></div>
        <div class="lw-split">
          <div class="lw-table">
            <div class="lw-tr head"></div>
            <div class="lw-tr"></div><div class="lw-tr"></div><div class="lw-tr"></div><div class="lw-tr"></div>
          </div>
          <div class="lw-chart">
            <svg viewBox="0 0 80 50" preserveAspectRatio="none" aria-hidden="true">
              <polyline points="4,40 28,28 52,18 76,22" fill="none" stroke="#0b2c5f" stroke-width="2"/>
              <polyline points="4,36 28,32 52,24 76,30" fill="none" stroke="#8a8a8a" stroke-width="1.5" stroke-dasharray="3 2"/>
            </svg>
          </div>
        </div>
      </div>`,
    "section-cover": `
      <div class="lw-slide">
        <div class="lw-title"><i></i><b></b></div>
        <div class="lw-sub"></div>
        <div class="lw-box tall"></div>
        <div class="lw-bullets"><span></span><span></span><span></span><span></span></div>
      </div>`,
    "three-year": `
      <div class="lw-slide">
        <div class="lw-title"><i></i><b></b></div>
        <div class="lw-sub"></div>
        <div class="lw-box short"></div>
        <div class="lw-year-grid">
          <div class="lw-year-h"><span></span><span></span><span></span><span></span></div>
          <div class="lw-year-r"><span></span><span></span><span></span><span></span></div>
          <div class="lw-year-r"><span></span><span></span><span></span><span></span></div>
          <div class="lw-year-r"><span></span><span></span><span></span><span></span></div>
        </div>
      </div>`,
    process: `
      <div class="lw-slide">
        <div class="lw-title"><i></i><b></b></div>
        <div class="lw-sub"></div>
        <div class="lw-box short"></div>
        <div class="lw-steps">
          <div class="lw-step"><o></o><em></em></div>
          <div class="lw-arrow"></div>
          <div class="lw-step"><o></o><em></em></div>
          <div class="lw-arrow"></div>
          <div class="lw-step"><o></o><em></em></div>
          <div class="lw-arrow"></div>
          <div class="lw-step"><o></o><em></em></div>
        </div>
      </div>`,
    kpi: `
      <div class="lw-slide">
        <div class="lw-title"><i></i><b></b></div>
        <div class="lw-sub"></div>
        <div class="lw-kpi-row">
          <div class="lw-kpi"></div><div class="lw-kpi"></div>
          <div class="lw-kpi"></div><div class="lw-kpi"></div>
        </div>
        <div class="lw-table wide">
          <div class="lw-tr head"></div>
          <div class="lw-tr"></div><div class="lw-tr"></div><div class="lw-tr"></div>
        </div>
      </div>`,
    matrix: `
      <div class="lw-slide">
        <div class="lw-title"><i></i><b></b></div>
        <div class="lw-sub"></div>
        <div class="lw-box short"></div>
        <div class="lw-matrix">
          <div></div><div></div>
          <div></div><div></div>
        </div>
      </div>`,
  };
  return wires[id] || wires.competency;
}

function buildCompetencySlide(pptx, opts = {}) {
  const s = pptx.addSlide();
  s.addShape("rect", { x: 0, y: 0, w: 10, h: 5.625, fill: { color: YS.white } });
  addChapterTitle(s, { no: opts.chapterNo || "3", title: opts.title || "대학 역량 분석" });
  addSubhead(s, opts.subtitle || "대학 경쟁력 비교 분석", { y: 0.72 });
  addSummaryBox(
    s,
    opts.summaryLines || [
      "· (요약) 최근 3년간 핵심 지표의 증감과 전문대학 평균 대비 위치를 정리합니다.",
      "· (해석) 강점 지표와 보완이 필요한 지표를 구분해 기술하세요.",
    ],
    { y: 1.05, h: 0.72 }
  );

  s.addText("▶ 8개 분야 3년간 추이 변화", {
    x: 0.4,
    y: 1.88,
    w: 5.2,
    h: 0.28,
    fontSize: 11,
    bold: true,
    color: YS.ink,
    fontFace: "Malgun Gothic",
  });

  s.addTable(
    [
      [
        { text: "구분", options: { fill: { color: YS.grayHead }, color: YS.white, bold: true, align: "center" } },
        { text: "지표", options: { fill: { color: YS.grayHead }, color: YS.white, bold: true, align: "center" } },
        { text: "2019", options: { fill: { color: YS.grayHead }, color: YS.white, bold: true, align: "center" } },
        { text: "2020", options: { fill: { color: YS.grayHead }, color: YS.white, bold: true, align: "center" } },
        { text: "2021", options: { fill: { color: YS.grayHead }, color: YS.white, bold: true, align: "center" } },
      ],
      [
        { text: "Input", options: { fill: { color: YS.grayCell }, align: "center", bold: true } },
        { text: "신입생충원율(%)", options: { align: "center" } },
        { text: "98.2", options: { align: "center" } },
        { text: "99.1", options: { align: "center" } },
        { text: "100.0", options: { align: "center" } },
      ],
      [
        { text: "Input", options: { fill: { color: YS.grayCell }, align: "center", bold: true } },
        { text: "재학생충원율(%)", options: { align: "center" } },
        { text: "95.0", options: { align: "center" } },
        { text: "96.4", options: { align: "center" } },
        { text: "97.8", options: { align: "center" } },
      ],
      [
        { text: "Process", options: { fill: { color: YS.grayCell }, align: "center", bold: true } },
        { text: "교육만족도(점)", options: { align: "center" } },
        { text: "4.1", options: { align: "center" } },
        { text: "4.2", options: { align: "center" } },
        { text: "4.3", options: { align: "center" } },
      ],
      [
        { text: "Output", options: { fill: { color: YS.grayCell }, align: "center", bold: true } },
        { text: "취업률(%)", options: { align: "center" } },
        { text: "68.5", options: { align: "center" } },
        { text: "70.2", options: { align: "center" } },
        { text: "72.0", options: { align: "center" } },
      ],
    ],
    {
      x: 0.4,
      y: 2.2,
      w: 5.1,
      colW: [0.9, 1.7, 0.83, 0.83, 0.84],
      border: [{ pt: 0.5, color: YS.grayLine }],
      fontFace: "Malgun Gothic",
      fontSize: 10,
      color: YS.ink,
    }
  );

  s.addChart(pptx.charts.LINE, [
    {
      name: "취업률",
      labels: ["2019", "2020", "2021", "전문대평균"],
      values: [68.5, 70.2, 72.0, 69.0],
    },
    {
      name: "교육만족도×20",
      labels: ["2019", "2020", "2021", "전문대평균"],
      values: [82, 84, 86, 80],
    },
  ], {
    x: 5.7,
    y: 2.15,
    w: 3.9,
    h: 2.9,
    showLegend: true,
    legendPos: "b",
    showValue: true,
    lineDataSymbol: "circle",
    chartColors: [YS.navy, YS.grayHead],
    chartArea: { fill: { color: YS.white } },
    valAxisMinValue: 60,
    valAxisMaxValue: 100,
  });

  s.addText("INPUT / PROCESS / OUTPUT", {
    x: 5.7,
    y: 1.88,
    w: 3.9,
    h: 0.25,
    fontSize: 10,
    bold: true,
    color: YS.gray,
    fontFace: "Malgun Gothic",
  });

  addFooter(s);
}

function buildSectionCover(pptx, opts = {}) {
  const s = pptx.addSlide();
  s.addShape("rect", { x: 0, y: 0, w: 10, h: 5.625, fill: { color: YS.white } });
  addChapterTitle(s, { no: opts.chapterNo || "Ⅱ", title: opts.title || "현황분석" });
  addSubhead(s, opts.subtitle || "추진 여건 및 진단", { y: 0.78 });
  addSummaryBox(
    s,
    opts.summaryLines || [
      "· 이 장의 목적과 분석 범위를 2~3문장으로 요약합니다.",
      "· 핵심 진단 결과(강점·약점·기회)를 한 줄씩 적습니다.",
    ],
    { y: 1.2, h: 1.0 }
  );

  const items = opts.bodyItems || [
    "1. 대내외 여건 분석 (정책·산업·지역)",
    "2. 대학 현황 진단 (교육·산학·성과)",
    "3. 시사점 및 혁신 방향 도출",
    "4. (작성) 세부 내용을 불릿으로 보완",
  ];
  slideBullets(s, items, { x: 0.55, y: 2.45, w: 8.8, h: 2.5 });
  addFooter(s);
}

function slideBullets(slide, items, box) {
  slide.addText(
    items.map((t) => ({ text: t, options: { bullet: false, breakLine: true } })),
    {
      ...box,
      fontSize: 14,
      color: YS.inkSoft,
      fontFace: "Malgun Gothic",
      valign: "top",
      paraSpacing: 10,
    }
  );
}

function buildThreeYear(pptx, opts = {}) {
  const s = pptx.addSlide();
  s.addShape("rect", { x: 0, y: 0, w: 10, h: 5.625, fill: { color: YS.white } });
  addChapterTitle(s, { no: opts.chapterNo || "4", title: opts.title || "3개년 추진계획" });
  addSubhead(s, opts.subtitle || "연도별 핵심활동 · 정량지표", { y: 0.75 });
  addSummaryBox(
    s,
    opts.summaryLines || ["· 2025(기반) → 2026(확산) → 2027(고도화) 단계로 기술합니다."],
    { y: 1.12, h: 0.55 }
  );

  s.addTable(
    [
      [
        { text: "구분", options: { fill: { color: YS.grayHead }, color: YS.white, bold: true, align: "center" } },
        { text: "2025", options: { fill: { color: YS.grayHead }, color: YS.white, bold: true, align: "center" } },
        { text: "2026", options: { fill: { color: YS.grayHead }, color: YS.white, bold: true, align: "center" } },
        { text: "2027", options: { fill: { color: YS.grayHead }, color: YS.white, bold: true, align: "center" } },
      ],
      [
        { text: "핵심활동", options: { fill: { color: YS.grayCell }, bold: true } },
        { text: "기반 구축\n(예: 체계·인프라)", options: { align: "center" } },
        { text: "확산·고도화\n(예: 프로그램 확대)", options: { align: "center" } },
        { text: "성과 안착\n(예: 환류·확산)", options: { align: "center" } },
      ],
      [
        { text: "정량지표", options: { fill: { color: YS.grayCell }, bold: true } },
        { text: "지표명 __ / 목표 __", options: { align: "center" } },
        { text: "지표명 __ / 목표 __", options: { align: "center" } },
        { text: "지표명 __ / 목표 __", options: { align: "center" } },
      ],
      [
        { text: "산출물", options: { fill: { color: YS.grayCell }, bold: true } },
        { text: "가이드·시스템 등", options: { align: "center" } },
        { text: "운영 실적·사례", options: { align: "center" } },
        { text: "성과보고서·확산", options: { align: "center" } },
      ],
      [
        { text: "담당", options: { fill: { color: YS.grayCell }, bold: true } },
        { text: "부서/센터", options: { align: "center" } },
        { text: "부서/센터", options: { align: "center" } },
        { text: "부서/센터", options: { align: "center" } },
      ],
    ],
    {
      x: 0.4,
      y: 1.85,
      w: 9.2,
      colW: [1.4, 2.6, 2.6, 2.6],
      border: [{ pt: 0.5, color: YS.grayLine }],
      fontFace: "Malgun Gothic",
      fontSize: 11,
      color: YS.ink,
      valign: "middle",
    }
  );
  addFooter(s);
}

function buildProcess(pptx, opts = {}) {
  const s = pptx.addSlide();
  s.addShape("rect", { x: 0, y: 0, w: 10, h: 5.625, fill: { color: YS.white } });
  addChapterTitle(s, { no: opts.chapterNo || "5", title: opts.title || "추진체계" });
  addSubhead(s, opts.subtitle || "거버넌스 · 실행 · 환류", { y: 0.75 });
  addSummaryBox(
    s,
    opts.summaryLines || ["· 의사결정 → 실행 → 점검 → 환류 단계를 박스에 채워 주세요."],
    { y: 1.12, h: 0.5 }
  );

  const steps = opts.steps || [
    { n: "①", t: "계획·협의", d: "위원회·협의체" },
    { n: "②", t: "실행", d: "프로그램 운영" },
    { n: "③", t: "점검", d: "성과·지표 모니터링" },
    { n: "④", t: "환류", d: "개선·차기 계획" },
  ];
  steps.forEach((st, i) => {
    const x = 0.45 + i * 2.35;
    s.addShape("roundRect", {
      x,
      y: 2.1,
      w: 2.05,
      h: 2.2,
      fill: { color: YS.grayBox },
      line: { color: YS.grayLine, width: 1 },
      rectRadius: 0.08,
    });
    s.addShape("ellipse", {
      x: x + 0.7,
      y: 2.25,
      w: 0.55,
      h: 0.55,
      fill: { color: YS.grayHead },
      line: { color: YS.grayHead },
    });
    s.addText(st.n, {
      x: x + 0.7,
      y: 2.25,
      w: 0.55,
      h: 0.55,
      align: "center",
      valign: "middle",
      color: YS.white,
      bold: true,
      fontSize: 12,
      fontFace: "Malgun Gothic",
    });
    s.addText(st.t, {
      x: x + 0.1,
      y: 2.95,
      w: 1.85,
      h: 0.4,
      align: "center",
      bold: true,
      fontSize: 14,
      color: YS.ink,
      fontFace: "Malgun Gothic",
    });
    s.addText(st.d, {
      x: x + 0.1,
      y: 3.4,
      w: 1.85,
      h: 0.7,
      align: "center",
      fontSize: 11,
      color: YS.inkSoft,
      fontFace: "Malgun Gothic",
    });
    if (i < steps.length - 1) {
      s.addText("→", {
        x: x + 1.95,
        y: 2.9,
        w: 0.4,
        h: 0.4,
        align: "center",
        fontSize: 18,
        color: YS.grayHead,
        bold: true,
      });
    }
  });
  addFooter(s);
}

function buildKpi(pptx, opts = {}) {
  const s = pptx.addSlide();
  s.addShape("rect", { x: 0, y: 0, w: 10, h: 5.625, fill: { color: YS.white } });
  addChapterTitle(s, { no: opts.chapterNo || "6", title: opts.title || "성과지표 현황" });
  addSubhead(s, opts.subtitle || "핵심 성과 · 세부 지표", { y: 0.75 });

  const cards = opts.cards || [
    { label: "취업률", value: "__%", note: "전년 대비 +" },
    { label: "교육만족도", value: "__점", note: "목표 대비" },
    { label: "참여학생", value: "__명", note: "누적" },
    { label: "협력기업", value: "__개", note: "당해연도" },
  ];
  cards.forEach((c, i) => {
    const x = 0.4 + i * 2.35;
    s.addShape("rect", {
      x,
      y: 1.2,
      w: 2.2,
      h: 1.35,
      fill: { color: YS.grayBox },
      line: { color: YS.grayLine, width: 1 },
    });
    s.addText(c.label, {
      x: x + 0.1,
      y: 1.3,
      w: 2.0,
      h: 0.3,
      fontSize: 11,
      color: YS.gray,
      fontFace: "Malgun Gothic",
      align: "center",
    });
    s.addText(c.value, {
      x: x + 0.1,
      y: 1.6,
      w: 2.0,
      h: 0.5,
      fontSize: 22,
      bold: true,
      color: YS.ink,
      fontFace: "Malgun Gothic",
      align: "center",
    });
    s.addText(c.note, {
      x: x + 0.1,
      y: 2.15,
      w: 2.0,
      h: 0.28,
      fontSize: 10,
      color: YS.inkSoft,
      fontFace: "Malgun Gothic",
      align: "center",
    });
  });

  s.addTable(
    [
      [
        { text: "지표명", options: { fill: { color: YS.grayHead }, color: YS.white, bold: true, align: "center" } },
        { text: "목표", options: { fill: { color: YS.grayHead }, color: YS.white, bold: true, align: "center" } },
        { text: "실적", options: { fill: { color: YS.grayHead }, color: YS.white, bold: true, align: "center" } },
        { text: "달성률", options: { fill: { color: YS.grayHead }, color: YS.white, bold: true, align: "center" } },
        { text: "비고", options: { fill: { color: YS.grayHead }, color: YS.white, bold: true, align: "center" } },
      ],
      ["지표 1", "__", "__", "__%", ""],
      ["지표 2", "__", "__", "__%", ""],
      ["지표 3", "__", "__", "__%", ""],
      ["지표 4", "__", "__", "__%", ""],
    ].map((row, ri) =>
      ri === 0
        ? row
        : row.map((cell) => ({ text: cell, options: { align: "center" } }))
    ),
    {
      x: 0.4,
      y: 2.8,
      w: 9.2,
      colW: [2.4, 1.5, 1.5, 1.5, 2.3],
      border: [{ pt: 0.5, color: YS.grayLine }],
      fontFace: "Malgun Gothic",
      fontSize: 11,
      color: YS.ink,
    }
  );
  addFooter(s);
}

function buildMatrix(pptx, opts = {}) {
  const s = pptx.addSlide();
  s.addShape("rect", { x: 0, y: 0, w: 10, h: 5.625, fill: { color: YS.white } });
  addChapterTitle(s, { no: opts.chapterNo || "7", title: opts.title || "비교·특성화 매트릭스" });
  addSubhead(s, opts.subtitle || "축 설정에 따른 포지셔닝", { y: 0.75 });
  addSummaryBox(
    s,
    opts.summaryLines || ["· 가로축·세로축 의미를 정의하고, 각 사분면에 프로그램·성과를 배치하세요."],
    { y: 1.12, h: 0.5 }
  );

  s.addTable(
    [
      [
        { text: "", options: { fill: { color: YS.grayCell } } },
        { text: "축 B 낮음 →", options: { fill: { color: YS.grayHead }, color: YS.white, bold: true, align: "center" } },
        { text: "← 축 B 높음", options: { fill: { color: YS.grayHead }, color: YS.white, bold: true, align: "center" } },
      ],
      [
        { text: "축 A\n높음", options: { fill: { color: YS.grayCell }, bold: true, align: "center" } },
        { text: "Ⅱ\n(내용 입력)", options: { align: "center", valign: "middle" } },
        { text: "Ⅰ\n(내용 입력)", options: { align: "center", valign: "middle" } },
      ],
      [
        { text: "축 A\n낮음", options: { fill: { color: YS.grayCell }, bold: true, align: "center" } },
        { text: "Ⅲ\n(내용 입력)", options: { align: "center", valign: "middle" } },
        { text: "Ⅳ\n(내용 입력)", options: { align: "center", valign: "middle" } },
      ],
    ],
    {
      x: 1.2,
      y: 1.85,
      w: 7.6,
      colW: [1.4, 3.1, 3.1],
      rowH: [0.4, 1.2, 1.2],
      border: [{ pt: 0.8, color: YS.grayLine }],
      fontFace: "Malgun Gothic",
      fontSize: 12,
      color: YS.ink,
      valign: "middle",
    }
  );
  addFooter(s);
}

const BUILDERS = {
  competency: buildCompetencySlide,
  "section-cover": buildSectionCover,
  "three-year": buildThreeYear,
  process: buildProcess,
  kpi: buildKpi,
  matrix: buildMatrix,
};

/**
 * 선택한 레이아웃을 PPT로 다운로드
 * @param {{ layoutIds?: string[], chapterNo?: string, titlePrefix?: string }} opts
 */
export async function downloadReportLayoutPpt(opts = {}) {
  const ids = Array.isArray(opts.layoutIds) && opts.layoutIds.length
    ? opts.layoutIds
    : REPORT_LAYOUTS.map((l) => l.id);

  const pptx = await loadPptx();
  pptx.author = "TF Pulse";
  pptx.title = opts.titlePrefix || "연성대_보고서_양식_레이아웃";
  pptx.subject = "전문대학 혁신지원사업 자율혁신계획서 스타일 레이아웃";
  pptx.defineLayout({ name: "LAYOUT_16x9", width: 10, height: 5.625 });
  pptx.layout = "LAYOUT_16x9";

  // 표지
  const cover = pptx.addSlide();
  cover.addShape("rect", { x: 0, y: 0, w: 10, h: 5.625, fill: { color: YS.white } });
  cover.addShape("rect", { x: 0, y: 0, w: 0.18, h: 5.625, fill: { color: YS.grayHead } });
  cover.addText("연성대학교", {
    x: 0.7,
    y: 1.5,
    w: 8.5,
    h: 0.4,
    fontSize: 14,
    color: YS.gray,
    fontFace: "Malgun Gothic",
  });
  cover.addText("보고서 양식 레이아웃 모음", {
    x: 0.7,
    y: 2.0,
    w: 8.5,
    h: 0.6,
    fontSize: 28,
    bold: true,
    color: YS.ink,
    fontFace: "Malgun Gothic",
  });
  cover.addText(
    "자율혁신계획서·성과보고서 스타일(회색 톤 표·요약박스·장번호)을 편집 가능한 PPT로 제공합니다.\n플레이스홀더 수치·문장을 실제 내용으로 바꿔 사용하세요.",
    {
      x: 0.7,
      y: 2.8,
      w: 8.2,
      h: 1.0,
      fontSize: 13,
      color: YS.inkSoft,
      fontFace: "Malgun Gothic",
    }
  );
  addFooter(cover, "TF Pulse · 보고서 작성 지원 레이아웃");

  ids.forEach((id) => {
    const builder = BUILDERS[id];
    if (builder) builder(pptx, opts);
  });

  const safe = (opts.titlePrefix || "연성대_보고서_양식_레이아웃").replace(/[\\/:*?"<>|]/g, "_");
  await pptx.writeFile({ fileName: `${safe}.pptx` });
  return { ok: true, count: ids.length + 1 };
}
