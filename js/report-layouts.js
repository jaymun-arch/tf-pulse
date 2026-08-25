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
  {
    id: "org",
    name: "추진 조직·거버넌스",
    desc: "위원회·실무·현장 3단 조직도",
    preview: "조직도",
    icon: "fi-rr-sitemap",
  },
  {
    id: "swot",
    name: "SWOT·시사점",
    desc: "강점·약점·기회·위협 + 시사점 박스",
    preview: "SWOT",
    icon: "fi-rr-chart-tree",
  },
  {
    id: "timeline",
    name: "추진 타임라인",
    desc: "분기·월별 마일스톤 가로 타임라인",
    preview: "타임라인",
    icon: "fi-rr-time-quarter-past",
  },
  {
    id: "budget",
    name: "예산·비목 요약",
    desc: "비목별 예산표와 비중 요약",
    preview: "예산표",
    icon: "fi-rr-chart-pie",
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
    org: `
      <div class="lw-slide">
        <div class="lw-title"><i></i><b></b></div>
        <div class="lw-sub"></div>
        <div class="lw-box short"></div>
        <div class="lw-kpi-row">
          <div class="lw-kpi"></div><div class="lw-kpi"></div><div class="lw-kpi"></div>
        </div>
      </div>`,
    swot: `
      <div class="lw-slide">
        <div class="lw-title"><i></i><b></b></div>
        <div class="lw-matrix">
          <div></div><div></div>
          <div></div><div></div>
        </div>
        <div class="lw-box short"></div>
      </div>`,
    timeline: `
      <div class="lw-slide">
        <div class="lw-title"><i></i><b></b></div>
        <div class="lw-sub"></div>
        <div class="lw-year-grid">
          <div class="lw-year-h"><span></span><span></span><span></span><span></span></div>
          <div class="lw-year-r"></div><div class="lw-year-r"></div>
        </div>
      </div>`,
    budget: `
      <div class="lw-slide">
        <div class="lw-title"><i></i><b></b></div>
        <div class="lw-sub"></div>
        <div class="lw-kpi-row">
          <div class="lw-kpi"></div><div class="lw-kpi"></div><div class="lw-kpi"></div>
        </div>
        <div class="lw-table wide">
          <div class="lw-tr head"></div>
          <div class="lw-tr"></div><div class="lw-tr"></div><div class="lw-tr"></div>
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

function buildOrg(pptx, opts = {}) {
  const s = pptx.addSlide();
  s.addShape("rect", { x: 0, y: 0, w: 10, h: 5.625, fill: { color: YS.white } });
  addChapterTitle(s, { no: opts.chapterNo || "5", title: opts.title || "추진 조직·거버넌스" });
  addSubhead(s, opts.subtitle || "의사결정 · 실무 · 현장 실행", { y: 0.75 });
  addSummaryBox(
    s,
    opts.summaryLines || [
      "· 총괄위원회 → 실무추진단 → 현장 실행조직의 역할·권한·환류 경로를 명시합니다.",
      "· 회의 주기·보고 체계·성과점검 일정을 함께 기재하세요.",
    ],
    { y: 1.1, h: 0.7 }
  );
  const tiers = opts.tiers || [
    { h: "총괄·의사결정", items: ["혁신지원사업 운영위원회", "총장 / 기획처장", "주요 의결·예산 승인"] },
    { h: "실무 조정", items: ["TF 실무추진단", "영역별 책임자", "일정·취합·지표 관리"] },
    { h: "현장 실행", items: ["센터·학과·부서", "프로그램 운영", "성과 데이터 입력"] },
  ];
  tiers.forEach((t, i) => {
    const x = 0.45 + i * 3.15;
    s.addShape("rect", {
      x,
      y: 2.05,
      w: 2.95,
      h: 2.85,
      fill: { color: YS.grayBox },
      line: { color: YS.grayLine, width: 1 },
    });
    s.addShape("rect", {
      x,
      y: 2.05,
      w: 2.95,
      h: 0.42,
      fill: { color: YS.grayHead },
      line: { color: YS.grayHead },
    });
    s.addText(t.h, {
      x: x + 0.08,
      y: 2.08,
      w: 2.8,
      h: 0.36,
      align: "center",
      valign: "middle",
      bold: true,
      fontSize: 12,
      color: YS.white,
      fontFace: "Malgun Gothic",
    });
    s.addText(t.items.map((x) => `· ${x}`).join("\n"), {
      x: x + 0.15,
      y: 2.6,
      w: 2.65,
      h: 2.1,
      fontSize: 12,
      color: YS.inkSoft,
      fontFace: "Malgun Gothic",
      valign: "top",
    });
    if (i < tiers.length - 1) {
      s.addText("→", {
        x: x + 2.85,
        y: 3.2,
        w: 0.35,
        h: 0.4,
        align: "center",
        fontSize: 18,
        bold: true,
        color: YS.grayHead,
      });
    }
  });
  addFooter(s);
}

function buildSwot(pptx, opts = {}) {
  const s = pptx.addSlide();
  s.addShape("rect", { x: 0, y: 0, w: 10, h: 5.625, fill: { color: YS.white } });
  addChapterTitle(s, { no: opts.chapterNo || "2", title: opts.title || "SWOT·시사점" });
  addSubhead(s, opts.subtitle || "진단 결과와 혁신 방향", { y: 0.72 });
  const cells = opts.cells || [
    { t: "Strengths (강점)", d: "· 교육과정 특화\n· 지역 산업 연계\n· (추가 입력)" },
    { t: "Weaknesses (약점)", d: "· 데이터 환류 지연\n· 인력·예산 제약\n· (추가 입력)" },
    { t: "Opportunities (기회)", d: "· 정책·재정 지원\n· 신산업 수요\n· (추가 입력)" },
    { t: "Threats (위협)", d: "· 학령인구 감소\n· 경쟁 심화\n· (추가 입력)" },
  ];
  cells.forEach((c, i) => {
    const x = 0.4 + (i % 2) * 4.7;
    const y = 1.1 + Math.floor(i / 2) * 1.7;
    s.addShape("rect", {
      x,
      y,
      w: 4.5,
      h: 1.55,
      fill: { color: YS.white },
      line: { color: YS.grayLine, width: 1 },
    });
    s.addShape("rect", {
      x,
      y,
      w: 4.5,
      h: 0.36,
      fill: { color: YS.grayHead },
      line: { color: YS.grayHead },
    });
    s.addText(c.t, {
      x: x + 0.1,
      y: y + 0.02,
      w: 4.3,
      h: 0.32,
      bold: true,
      fontSize: 12,
      color: YS.white,
      fontFace: "Malgun Gothic",
      valign: "middle",
    });
    s.addText(c.d, {
      x: x + 0.15,
      y: y + 0.45,
      w: 4.2,
      h: 1.0,
      fontSize: 12,
      color: YS.inkSoft,
      fontFace: "Malgun Gothic",
      valign: "top",
    });
  });
  addSummaryBox(
    s,
    opts.summaryLines || ["· (시사점) 강점×기회를 살리고, 약점·위협을 줄이는 혁신 과제를 2~3개로 정리하세요."],
    { y: 4.55, h: 0.55 }
  );
  addFooter(s);
}

function buildTimeline(pptx, opts = {}) {
  const s = pptx.addSlide();
  s.addShape("rect", { x: 0, y: 0, w: 10, h: 5.625, fill: { color: YS.white } });
  addChapterTitle(s, { no: opts.chapterNo || "4", title: opts.title || "추진 타임라인" });
  addSubhead(s, opts.subtitle || "당해연도 마일스톤", { y: 0.75 });
  addSummaryBox(
    s,
    opts.summaryLines || ["· 분기별 핵심 산출물·점검 시점을 기입하고, 지연 리스크를 표시하세요."],
    { y: 1.1, h: 0.5 }
  );
  s.addShape("rect", {
    x: 0.55,
    y: 2.55,
    w: 8.9,
    h: 0.08,
    fill: { color: YS.grayLine },
    line: { color: YS.grayLine },
  });
  const marks = opts.marks || [
    { m: "1분기", t: "계획 확정\n착수" },
    { m: "2분기", t: "프로그램\n본격 운영" },
    { m: "3분기", t: "중간점검\n보완" },
    { m: "4분기", t: "성과취합\n환류" },
  ];
  marks.forEach((mk, i) => {
    const x = 0.7 + i * 2.3;
    s.addShape("ellipse", {
      x: x + 0.55,
      y: 2.42,
      w: 0.34,
      h: 0.34,
      fill: { color: YS.grayHead },
      line: { color: YS.grayHead },
    });
    s.addText(mk.m, {
      x,
      y: 1.85,
      w: 1.5,
      h: 0.35,
      align: "center",
      bold: true,
      fontSize: 13,
      color: YS.ink,
      fontFace: "Malgun Gothic",
    });
    s.addText(mk.t, {
      x,
      y: 2.95,
      w: 1.5,
      h: 1.1,
      align: "center",
      fontSize: 12,
      color: YS.inkSoft,
      fontFace: "Malgun Gothic",
    });
  });
  s.addTable(
    [
      [
        { text: "마일스톤", options: { fill: { color: YS.grayHead }, color: YS.white, bold: true, align: "center" } },
        { text: "산출물", options: { fill: { color: YS.grayHead }, color: YS.white, bold: true, align: "center" } },
        { text: "담당", options: { fill: { color: YS.grayHead }, color: YS.white, bold: true, align: "center" } },
        { text: "상태", options: { fill: { color: YS.grayHead }, color: YS.white, bold: true, align: "center" } },
      ],
      ["계획 확정", "운영계획·일정표", "TF", "완료/진행"],
      ["중간점검", "점검보고서", "영역 책임자", "진행"],
      ["최종 취합", "성과·예산 취합본", "관리자", "예정"],
    ].map((row, ri) =>
      ri === 0 ? row : row.map((cell) => ({ text: cell, options: { align: "center" } }))
    ),
    {
      x: 0.4,
      y: 4.15,
      w: 9.2,
      colW: [2.2, 3.2, 2.2, 1.6],
      border: [{ pt: 0.5, color: YS.grayLine }],
      fontFace: "Malgun Gothic",
      fontSize: 10,
      color: YS.ink,
    }
  );
  addFooter(s);
}

function buildBudgetLayout(pptx, opts = {}) {
  const s = pptx.addSlide();
  s.addShape("rect", { x: 0, y: 0, w: 10, h: 5.625, fill: { color: YS.white } });
  addChapterTitle(s, { no: opts.chapterNo || "8", title: opts.title || "예산·비목 요약" });
  addSubhead(s, opts.subtitle || "당해연도 예산 구조", { y: 0.75 });
  const cards = opts.cards || [
    { label: "총예산", value: "__백만원", note: "당해연도" },
    { label: "집행액", value: "__백만원", note: "누적" },
    { label: "집행률", value: "__%", note: "목표 대비" },
  ];
  cards.forEach((c, i) => {
    const x = 0.4 + i * 3.15;
    s.addShape("rect", {
      x,
      y: 1.15,
      w: 3.0,
      h: 1.15,
      fill: { color: YS.grayBox },
      line: { color: YS.grayLine, width: 1 },
    });
    s.addText(c.label, {
      x: x + 0.1,
      y: 1.25,
      w: 2.8,
      h: 0.28,
      align: "center",
      fontSize: 11,
      color: YS.gray,
      fontFace: "Malgun Gothic",
    });
    s.addText(c.value, {
      x: x + 0.1,
      y: 1.55,
      w: 2.8,
      h: 0.4,
      align: "center",
      bold: true,
      fontSize: 20,
      color: YS.ink,
      fontFace: "Malgun Gothic",
    });
    s.addText(c.note, {
      x: x + 0.1,
      y: 1.95,
      w: 2.8,
      h: 0.25,
      align: "center",
      fontSize: 10,
      color: YS.inkSoft,
      fontFace: "Malgun Gothic",
    });
  });
  s.addTable(
    [
      [
        { text: "비목", options: { fill: { color: YS.grayHead }, color: YS.white, bold: true, align: "center" } },
        { text: "예산", options: { fill: { color: YS.grayHead }, color: YS.white, bold: true, align: "center" } },
        { text: "집행", options: { fill: { color: YS.grayHead }, color: YS.white, bold: true, align: "center" } },
        { text: "잔액", options: { fill: { color: YS.grayHead }, color: YS.white, bold: true, align: "center" } },
        { text: "비고", options: { fill: { color: YS.grayHead }, color: YS.white, bold: true, align: "center" } },
      ],
      ["인건비", "__", "__", "__", ""],
      ["교육·연구 프로그램", "__", "__", "__", ""],
      ["실험·실습·기자재", "__", "__", "__", ""],
      ["그 밖의 사업운영", "__", "__", "__", ""],
      ["간접비", "__", "__", "__", ""],
    ].map((row, ri) =>
      ri === 0 ? row : row.map((cell) => ({ text: cell, options: { align: "center" } }))
    ),
    {
      x: 0.4,
      y: 2.55,
      w: 9.2,
      colW: [2.6, 1.5, 1.5, 1.5, 2.1],
      border: [{ pt: 0.5, color: YS.grayLine }],
      fontFace: "Malgun Gothic",
      fontSize: 11,
      color: YS.ink,
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
  org: buildOrg,
  swot: buildSwot,
  timeline: buildTimeline,
  budget: buildBudgetLayout,
};

function addLayoutIndexSlide(pptx, ids) {
  const s = pptx.addSlide();
  s.addShape("rect", { x: 0, y: 0, w: 10, h: 5.625, fill: { color: YS.white } });
  s.addText("구성 목차 · 레이아웃 재료", {
    x: 0.55,
    y: 0.4,
    w: 9,
    h: 0.45,
    fontSize: 22,
    bold: true,
    color: YS.ink,
    fontFace: "Malgun Gothic",
  });
  s.addText("담당자는 해당 슬라이드의 박스·표·수치만 바꿔 상세 그림을 완성하면 됩니다.", {
    x: 0.55,
    y: 0.9,
    w: 9,
    h: 0.35,
    fontSize: 12,
    color: YS.inkSoft,
    fontFace: "Malgun Gothic",
  });
  const rows = ids.map((id, i) => {
    const meta = REPORT_LAYOUTS.find((l) => l.id === id);
    return [
      { text: String(i + 1), options: { align: "center" } },
      { text: meta?.name || id, options: { bold: true } },
      { text: meta?.desc || "", options: {} },
    ];
  });
  s.addTable(
    [
      [
        { text: "No", options: { fill: { color: YS.grayHead }, color: YS.white, bold: true, align: "center" } },
        { text: "레이아웃", options: { fill: { color: YS.grayHead }, color: YS.white, bold: true, align: "center" } },
        { text: "용도", options: { fill: { color: YS.grayHead }, color: YS.white, bold: true, align: "center" } },
      ],
      ...rows,
    ],
    {
      x: 0.55,
      y: 1.4,
      w: 8.9,
      colW: [0.7, 2.6, 5.6],
      border: [{ pt: 0.5, color: YS.grayLine }],
      fontFace: "Malgun Gothic",
      fontSize: 11,
      color: YS.ink,
    }
  );
  addFooter(s, "양식 레이아웃 재료 목차");
}

function addLayoutHowToSlide(pptx) {
  const s = pptx.addSlide();
  s.addShape("rect", { x: 0, y: 0, w: 10, h: 5.625, fill: { color: YS.white } });
  s.addText("사용 방법 · 상세 그림 그리기 전 체크", {
    x: 0.55,
    y: 0.45,
    w: 9,
    h: 0.45,
    fontSize: 22,
    bold: true,
    color: YS.ink,
    fontFace: "Malgun Gothic",
  });
  s.addText(
    [
      { text: "1. 필요한 레이아웃 슬라이드만 복제해 장·사업 단위로 확장합니다.", options: { breakLine: true } },
      { text: "2. 회색 요약박스·표 헤더·장번호 배지 톤을 유지한 채 문구·수치만 교체합니다.", options: { breakLine: true } },
      { text: "3. 도식(프로세스·조직·매트릭스)은 도식 재료 PPT와 함께 쓰면 완성도가 높아집니다.", options: { breakLine: true } },
      { text: "4. 한글 보고서에는 슬라이드 복사 또는 고해상도 내보내기 후 삽입합니다.", options: { breakLine: true } },
      { text: "5. 샘플 수치(취업률·만족도 등)는 예시이므로 반드시 실제 데이터로 교체하세요.", options: { breakLine: true } },
    ],
    {
      x: 0.7,
      y: 1.2,
      w: 8.6,
      h: 3.2,
      fontSize: 14,
      color: YS.inkSoft,
      fontFace: "Malgun Gothic",
      paraSpacing: 12,
    }
  );
  addFooter(s);
}

/**
 * 기존 pptx에 양식 레이아웃 덱을 추가
 */
export function appendLayoutDeck(pptx, opts = {}) {
  const ids = Array.isArray(opts.layoutIds) && opts.layoutIds.length
    ? opts.layoutIds
    : REPORT_LAYOUTS.map((l) => l.id);
  if (opts.withIndex !== false) addLayoutIndexSlide(pptx, ids);
  ids.forEach((id) => {
    const builder = BUILDERS[id];
    if (!builder) return;
    if (opts.sectionDividers) {
      const meta = REPORT_LAYOUTS.find((l) => l.id === id);
      const d = pptx.addSlide();
      d.addShape("rect", { x: 0, y: 0, w: 10, h: 5.625, fill: { color: YS.grayBox } });
      d.addText(meta?.preview || "LAYOUT", {
        x: 0.6,
        y: 2.0,
        w: 8.8,
        h: 0.4,
        fontSize: 14,
        color: YS.gray,
        fontFace: "Malgun Gothic",
        align: "center",
      });
      d.addText(meta?.name || id, {
        x: 0.6,
        y: 2.45,
        w: 8.8,
        h: 0.55,
        fontSize: 28,
        bold: true,
        color: YS.ink,
        fontFace: "Malgun Gothic",
        align: "center",
      });
      d.addText(meta?.desc || "", {
        x: 1.2,
        y: 3.15,
        w: 7.6,
        h: 0.5,
        fontSize: 13,
        color: YS.inkSoft,
        fontFace: "Malgun Gothic",
        align: "center",
      });
    }
    builder(pptx, opts);
  });
  if (opts.withHowTo !== false) addLayoutHowToSlide(pptx);
  return ids.length;
}

/**
 * 선택한 레이아웃을 PPT로 다운로드
 * @param {{ layoutIds?: string[], chapterNo?: string, titlePrefix?: string, pack?: boolean }} opts
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

  const cover = pptx.addSlide();
  cover.addShape("rect", { x: 0, y: 0, w: 10, h: 5.625, fill: { color: YS.white } });
  cover.addShape("rect", { x: 0, y: 0, w: 0.18, h: 5.625, fill: { color: YS.grayHead } });
  cover.addText("연성대학교 · TF Pulse", {
    x: 0.7,
    y: 1.35,
    w: 8.5,
    h: 0.35,
    fontSize: 14,
    color: YS.gray,
    fontFace: "Malgun Gothic",
  });
  cover.addText("보고서 양식 레이아웃 재료", {
    x: 0.7,
    y: 1.85,
    w: 8.5,
    h: 0.6,
    fontSize: 28,
    bold: true,
    color: YS.ink,
    fontFace: "Malgun Gothic",
  });
  cover.addText(
    `표·요약박스·조직도·SWOT·타임라인·예산표 등 ${ids.length}종 기본 재료입니다.\n담당자는 플레이스홀더를 실제 수치·문장으로 바꿔 상세 그림을 완성하세요.`,
    {
      x: 0.7,
      y: 2.65,
      w: 8.2,
      h: 1.1,
      fontSize: 13,
      color: YS.inkSoft,
      fontFace: "Malgun Gothic",
    }
  );
  addFooter(cover, "TF Pulse · 보고서 작성 지원 레이아웃");

  appendLayoutDeck(pptx, {
    ...opts,
    layoutIds: ids,
    withIndex: true,
    withHowTo: true,
    sectionDividers: opts.pack || ids.length > 1,
  });

  const safe = (opts.titlePrefix || "연성대_보고서_양식_레이아웃").replace(/[\\/:*?"<>|]/g, "_");
  await pptx.writeFile({ fileName: `${safe}.pptx` });
  return { ok: true, count: ids.length };
}
