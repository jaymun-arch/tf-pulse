/**
 * 보고서 그림 — 테마·방향 기반 원클릭 생성 + 시뮬레이션
 */

import { REPORT_LAYOUTS, layoutPreviewWireHtml } from "./report-layouts.js";
import { diagramPreviewWireHtml } from "./report-diagrams.js";
import { boostLayoutsFromLearning } from "./report-style-learning.js";

const THEME_LAYOUT_WEIGHTS = {
  "core-project": {
    must: ["section-cover", "competency", "process", "three-year"],
    pool: ["kpi", "swot", "org", "timeline", "matrix", "budget"],
    types: ["overview", "governance", "improvement"],
  },
  "edu-innovation": {
    must: ["section-cover", "matrix", "process", "kpi"],
    pool: ["three-year", "timeline", "competency", "swot"],
    types: ["overview", "platform", "certification"],
  },
  industry: {
    must: ["org", "matrix", "process", "timeline"],
    pool: ["section-cover", "kpi", "platform", "competency"],
    types: ["icc-matrix", "platform", "governance"],
  },
  performance: {
    must: ["kpi", "three-year", "section-cover", "matrix"],
    pool: ["timeline", "swot", "competency", "budget"],
    types: ["improvement", "diffusion", "overview"],
  },
  roadmap: {
    must: ["timeline", "three-year", "section-cover", "process"],
    pool: ["kpi", "org", "matrix", "competency"],
    types: ["roadmap", "overview", "governance"],
  },
};

const LAYOUT_USAGE = {
  competency: "현황·역량 분석 장에 배치. 좌측 표·우측 추이로 근거를 제시합니다.",
  "section-cover": "장 도입·핵심요약. 심사위원이 먼저 읽는 한 페이지 메시지입니다.",
  "three-year": "3개년 추진계획 표. 연도별 활동·지표를 한눈에 정리합니다.",
  process: "추진체계·프로세스. 단계·주체·산출 흐름을 설명합니다.",
  kpi: "성과지표 대시보드. 목표·실적·달성률을 카드+표로 보여줍니다.",
  matrix: "2축 비교·ICC 매트릭스. 전략 포지셔닝에 적합합니다.",
  org: "추진 조직·거버넌스. 위원회·실무·현장 3단 구조입니다.",
  swot: "SWOT·시사점. 강점·약점·기회·위협과 시사점을 정리합니다.",
  timeline: "추진 타임라인. 분기·월별 마일스톤을 가로로 배치합니다.",
  budget: "예산·비목 요약. 사업비 구조와 비중을 표로 제시합니다.",
};

const VARIANTS = [
  { id: "formal", label: "공공문서형", hint: "회색 톤·표 중심·절제된 여백" },
  { id: "flow", label: "흐름 강조형", hint: "프로세스·화살표·단계 배지 강조" },
  { id: "data", label: "지표 중심형", hint: "KPI·표·수치 카드 비중 확대" },
  { id: "story", label: "내러티브형", hint: "장 표지·요약·SWOT로 설득 흐름" },
];

export function seededRandom(seed) {
  let s = Math.abs(Number(seed) || 1) % 2147483647;
  if (s === 0) s = 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function layoutById(id) {
  return REPORT_LAYOUTS.find((l) => l.id === id);
}

function scoreLayout(layout, themeId, direction) {
  const blob = `${direction || ""}`.toLowerCase();
  const weights = THEME_LAYOUT_WEIGHTS[themeId] || THEME_LAYOUT_WEIGHTS["core-project"];
  let score = weights.must.includes(layout.id) ? 10 : 0;
  const keywords = {
    competency: /역량|현황|분석/,
    "section-cover": /요약|개요|장|도입/,
    "three-year": /3개년|개년|연도|2025|2026|2027/,
    process: /체계|프로세스|추진|단계/,
    kpi: /지표|성과|KPI|달성|목표/,
    matrix: /매트릭스|ICC|비교|2축/,
    org: /조직|거버넌스|위원|협의/,
    swot: /SWOT|강점|약점|기회/,
    timeline: /일정|타임|마일스톤|분기/,
    budget: /예산|비목|사업비/,
  };
  if (keywords[layout.id]?.test(blob)) score += 6;
  if (new RegExp(layout.name.replace(/[·\s]/g, "|"), "i").test(direction || "")) score += 4;
  return score;
}

export function composeStudioPack({ themeId = "core-project", direction = "", seed = Date.now(), learnedSamples = [] }) {
  const rng = seededRandom(seed);
  const weights = THEME_LAYOUT_WEIGHTS[themeId] || THEME_LAYOUT_WEIGHTS["core-project"];
  const must = [...weights.must];
  const pool = [...weights.pool];
  const targetCount = 4 + Math.floor(rng() * 3);

  const scored = REPORT_LAYOUTS.map((l) => ({
    ...l,
    score: scoreLayout(l, themeId, direction) + rng() * 2.5,
  }))
    .filter((l) => !must.includes(l.id))
    .sort((a, b) => b.score - a.score);

  const extras = [];
  while (must.length + extras.length < targetCount && scored.length) {
    const pick = scored.shift();
    if (pick && !extras.includes(pick.id)) extras.push(pick.id);
  }

  let layoutIds = [...must, ...extras].slice(0, targetCount);
  if (learnedSamples.length) layoutIds = boostLayoutsFromLearning(layoutIds, learnedSamples);
  if (rng() > 0.55) layoutIds = [...layoutIds].sort(() => rng() - 0.5);

  const typePool = weights.types || ["overview"];
  let typeId = typePool[Math.floor(rng() * typePool.length)] || "overview";
  const learnedDiagram = learnedSamples.find((s) => s.diagramRef)?.diagramRef;
  if (learnedDiagram && rng() > 0.35) typeId = learnedDiagram;

  const variant = VARIANTS[Math.floor(rng() * VARIANTS.length)] || VARIANTS[0];

  return { layoutIds, typeId, variant, seed, learnedSamples: learnedSamples.slice(0, 5) };
}

export function buildStudioUsageGuide({ layoutIds = [], plan, theme, direction, variant, learnedSamples = [] }) {
  const layouts = layoutIds.map((id) => layoutById(id)).filter(Boolean);
  const items = layouts.map((l, i) => ({
    order: i + 1,
    name: l.name,
    desc: l.desc,
    usage: LAYOUT_USAGE[l.id] || l.desc,
    preview: l.preview,
  }));

  const workflow = [
    `① ${items[0]?.name || "장 표지"}로 해당 장을 열고 핵심 메시지를 고정합니다.`,
    `② ${items.slice(1, 3).map((x) => x.name).join(" · ") || "표·도식"}에 실제 수치·문장을 채웁니다.`,
    `③ ${plan?.title || "핵심 도식"} 슬라이드로 추진체계·성과를 시각화합니다.`,
    "④ 한글 보고서에 붙여넣은 뒤 교육부 지침·TF 스타일 가이드와 톤을 맞춥니다.",
  ];

  return {
    summary:
      plan?.purpose ||
      `${theme?.name || "보고서"} 방향에 맞춘 레이아웃 ${layouts.length}종 + 도식 1세트를 제안합니다.`,
    reasoning: plan?.reasoning || "",
    keyMessages: plan?.keyMessages || [],
    variantLabel: variant?.label || "공공문서형",
    variantHint: variant?.hint || "",
    items,
    workflow,
    directionEcho: (direction || "").slice(0, 120),
    learnedSamples: learnedSamples.map((s) => ({
      title: s.title,
      program: s.program,
      cues: s.cues || [],
      source: s.source,
    })),
  };
}

export function studioStageHtml({ layoutIds = [], diagramTypeId = "overview", visibleCount = 0, phase = 0, variant }) {
  const layouts = layoutIds.map((id) => layoutById(id)).filter(Boolean);
  return `
    <div class="art-studio-stage ${phase ? `phase-${phase}` : ""}" id="artStudioStage">
      <div class="art-studio-stage-head">
        <span class="art-studio-variant">${variant?.label ? `스타일 · ${variant.label}` : "레이아웃 조합"}</span>
        <span class="muted" id="artStudioStageHint">테마와 방향을 분석합니다…</span>
      </div>
      <div class="art-studio-grid" id="artStudioGrid">
        ${layouts
          .map(
            (l, i) => `
          <article class="art-studio-tile ${i < visibleCount ? "is-in is-live" : ""}" data-layout-tile="${escapeAttr(l.id)}" style="--i:${i}">
            <div class="art-studio-tile-thumb">${layoutPreviewWireHtml(l.id)}</div>
            <strong>${escapeHtml(l.name)}</strong>
            <span>${escapeHtml(l.preview || "")}</span>
          </article>`
          )
          .join("")}
      </div>
      <div class="art-studio-diagram-wrap ${visibleCount >= layouts.length ? "is-on" : ""}" id="artStudioDiagramWrap">
        <p class="art-studio-diagram-label">핵심 도식</p>
        <div class="art-studio-diagram diagram-canvas ${phase >= 5 ? "is-done" : phase >= 4 ? "is-building phase-4" : ""}" id="artStudioDiagram">
          ${diagramPreviewWireHtml(diagramTypeId)}
        </div>
      </div>
    </div>`;
}

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(str = "") {
  return escapeHtml(str).replace(/'/g, "&#39;");
}

export async function animateStudioBuild({
  root,
  layoutIds,
  diagramTypeId,
  variant,
  learnedSamples = [],
  onProgress,
  onStep,
  planPromise,
}) {
  const layouts = layoutIds.map((id) => layoutById(id)).filter(Boolean);
  const stage = root?.querySelector("#artStudioStage");
  const hint = root?.querySelector("#artStudioStageHint");
  const tiles = [...(root?.querySelectorAll("[data-layout-tile]") || [])];
  const diagramWrap = root?.querySelector("#artStudioDiagramWrap");
  const diagram = root?.querySelector("#artStudioDiagram");

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  onProgress?.(5, "테마·방향 분석");
  onStep?.("GPT가 보고서 목적과 키워드를 해석합니다");
  if (learnedSamples.length) {
    onStep?.(`학습 양식 ${learnedSamples.length}건 반영 · ${learnedSamples.map((s) => s.title).slice(0, 2).join(", ")}${learnedSamples.length > 2 ? " …" : ""}`);
  }
  if (hint) hint.textContent = learnedSamples.length ? `학습 ${learnedSamples.length}건 기반 조합` : "테마·방향 분석 중…";
  if (stage) stage.className = "art-studio-stage phase-1";
  await sleep(420);

  for (let i = 0; i < layouts.length; i++) {
    const pct = 12 + Math.round(((i + 1) / layouts.length) * 52);
    onProgress?.(pct, `레이아웃 ${i + 1}/${layouts.length} 배치`);
    onStep?.(`「${layouts[i].name}」 양식을 조합합니다`);
    if (hint) hint.textContent = `${layouts[i].name} · ${layouts[i].preview || "레이아웃"}`;
    tiles[i]?.classList.add("is-in");
    await sleep(320);
    tiles[i]?.classList.add("is-live");
    if (stage) stage.className = `art-studio-stage phase-${Math.min(3, 2 + Math.floor(i / 2))}`;
  }

  onProgress?.(72, "핵심 도식 구조 설계");
  onStep?.("도식 칸에 메시지·라벨을 매핑합니다");
  if (diagramWrap) diagramWrap.classList.add("is-on");
  if (diagram) {
    diagram.classList.add("is-building", "phase-2");
    await sleep(280);
    diagram.className = "art-studio-diagram diagram-canvas is-building phase-4";
  }
  await sleep(360);

  onProgress?.(84, "GPT 도식 기획");
  onStep?.("연결 API로 활용 가이드·라벨을 생성합니다");
  let plan = null;
  try {
    plan = await planPromise;
  } catch (err) {
    onStep?.(`기획 API: ${err.message || "로컬 가이드로 계속"}`);
  }

  onProgress?.(94, "패키지 마무리");
  onStep?.("다운로드용 PPT·활용 설명을 정리합니다");
  if (diagram) diagram.className = "art-studio-diagram diagram-canvas is-done phase-5";
  if (stage) stage.className = "art-studio-stage phase-5 is-complete";
  if (hint) hint.textContent = plan?.purpose ? plan.purpose : `${variant?.label || "조합"} 완료`;
  await sleep(280);

  onProgress?.(100, "완료");
  return plan;
}

export { VARIANTS, LAYOUT_USAGE };
