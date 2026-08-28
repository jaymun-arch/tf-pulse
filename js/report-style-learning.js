/**
 * 보고서 그림 양식 학습 — 전문대·RISE·신산업 등 공공사업 보고서 도식 레퍼런스
 */

import { REPORT_LAYOUTS, layoutPreviewWireHtml } from "./report-layouts.js";
import { diagramPreviewWireHtml } from "./report-diagrams.js";

export const STYLE_PROGRAMS = [
  {
    id: "innovation",
    label: "전문대학 혁신지원사업",
    desc: "자율혁신계획·운영계획·성과보고 흑백 도식",
  },
  { id: "rise", label: "RISE 사업", desc: "지역혁신·거버넌스·성과지표·확산 도식" },
  { id: "new-industry", label: "신산업", desc: "ICC·산학·플랫폼·매트릭스형 보고서" },
  { id: "icc", label: "ICC·지산학", desc: "특성화 매트릭스·협력체계·실적표" },
  { id: "edu", label: "교육혁신·대학혁신", desc: "트랙·마이크로전공·AI+X 과정 도식" },
];

const PROGRAM_LABEL = Object.fromEntries(STYLE_PROGRAMS.map((p) => [p.id, p.label]));

/** 내장 학습 샘플(실무에서 자주 쓰이는 유형) */
export const DEFAULT_STYLE_SAMPLES = [
  {
    id: "seed-innovation-overview",
    program: "innovation",
    title: "자율혁신 핵심사업 개요도",
    layoutRef: "process",
    diagramRef: "overview",
    cues: ["4열 중첩박스", "회색 헤더바", "블록화살표", "단계 원배지", "흑백 공공문서"],
    source: "builtin",
    learnedAt: "2025-06-01",
  },
  {
    id: "seed-innovation-kpi",
    program: "innovation",
    title: "혁신지원 KPI·3개년 목표표",
    layoutRef: "kpi",
    diagramRef: "improvement",
    cues: ["수치 카드 3~4개", "목표·실적 열", "회색 표 헤더", "달성률 강조"],
    source: "builtin",
    learnedAt: "2025-06-01",
  },
  {
    id: "seed-rise-governance",
    program: "rise",
    title: "RISE 거버넌스·추진체계",
    layoutRef: "org",
    diagramRef: "governance",
    cues: ["3단 조직", "위원회-실무-현장", "세로 타임라인", "역할 라벨"],
    source: "builtin",
    learnedAt: "2025-07-01",
  },
  {
    id: "seed-rise-roadmap",
    program: "rise",
    title: "RISE 단계별 마일스톤",
    layoutRef: "timeline",
    diagramRef: "roadmap",
    cues: ["가로 타임라인", "분기 마커", "산출물 박스", "연도 구분"],
    source: "builtin",
    learnedAt: "2025-07-01",
  },
  {
    id: "seed-newindustry-matrix",
    program: "new-industry",
    title: "신산업 ICC 2×2 매트릭스",
    layoutRef: "matrix",
    diagramRef: "icc-matrix",
    cues: ["2축 매트릭스", "4분면 라벨", "전략 화살표", "핵심 키워드"],
    source: "builtin",
    learnedAt: "2025-08-01",
  },
  {
    id: "seed-newindustry-platform",
    program: "new-industry",
    title: "산학협력 플랫폼 허브",
    layoutRef: "process",
    diagramRef: "platform",
    cues: ["중앙 허브", "방사형 노드", "프로그램 카드", "연결선"],
    source: "builtin",
    learnedAt: "2025-08-01",
  },
  {
    id: "seed-icc-org",
    program: "icc",
    title: "지산학 협의체·ICC 거버넌스",
    layoutRef: "org",
    diagramRef: "governance",
    cues: ["다자 협의", "ICC 특성화", "실무 TF", "화살표 흐름"],
    source: "builtin",
    learnedAt: "2025-05-01",
  },
  {
    id: "seed-edu-track",
    program: "edu",
    title: "교육과정 트랙·융합 구조",
    layoutRef: "matrix",
    diagramRef: "overview",
    cues: ["트랙 분기", "마이크로전공", "역량 연결", "PBL·캡스톤"],
    source: "builtin",
    learnedAt: "2025-09-01",
  },
  {
    id: "seed-innovation-swot",
    program: "innovation",
    title: "현황·SWOT·시사점",
    layoutRef: "swot",
    diagramRef: "overview",
    cues: ["4분면 SWOT", "시사점 요약박스", "회색 톤", "불릿 정리"],
    source: "builtin",
    learnedAt: "2025-06-15",
  },
  {
    id: "seed-rise-budget",
    program: "rise",
    title: "사업비·비목 구조",
    layoutRef: "budget",
    diagramRef: "improvement",
    cues: ["비목 표", "비중 막대", "총액 요약", "연도별 배분"],
    source: "builtin",
    learnedAt: "2025-07-15",
  },
];

const MAX_UPLOAD_BYTES = 480 * 1024;
const MAX_UPLOADS = 24;

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

function programLabel(id) {
  return PROGRAM_LABEL[id] || id || "기타";
}

function thumbHtml(sample) {
  if (sample.thumbDataUrl || sample.dataUrl) {
    return `<img src="${escapeAttr(sample.thumbDataUrl || sample.dataUrl)}" alt="" loading="lazy" />`;
  }
  if (sample.layoutRef) {
    return layoutPreviewWireHtml(sample.layoutRef);
  }
  if (sample.diagramRef) {
    return diagramPreviewWireHtml(sample.diagramRef);
  }
  return `<div class="style-learn-wire-placeholder">양식</div>`;
}

export function ensureReportStyleLearning(state) {
  if (!state.reportStyleLearning) {
    state.reportStyleLearning = { samples: [], logs: [], updatedAt: null };
  }
  if (!Array.isArray(state.reportStyleLearning.samples)) {
    state.reportStyleLearning.samples = [];
  }
  if (!Array.isArray(state.reportStyleLearning.logs)) {
    state.reportStyleLearning.logs = [];
  }
  const existing = new Set(state.reportStyleLearning.samples.map((s) => s.id));
  DEFAULT_STYLE_SAMPLES.forEach((seed) => {
    if (!existing.has(seed.id)) {
      state.reportStyleLearning.samples.push({ ...seed });
    }
  });
  state.reportStyleLearning.samples.sort(
    (a, b) => String(b.learnedAt || "").localeCompare(String(a.learnedAt || "")) || String(a.title).localeCompare(String(b.title), "ko")
  );
  return state.reportStyleLearning.samples;
}

export function getAllLearnedSamples(state) {
  return ensureReportStyleLearning(state);
}

export function pickSamplesForGeneration(state, { themeId = "", direction = "", limit = 5 } = {}) {
  const all = getAllLearnedSamples(state);
  const blob = `${direction} ${themeId}`.toLowerCase();
  const themeProgramMap = {
    "core-project": ["innovation", "rise"],
    "edu-innovation": ["edu", "innovation"],
    industry: ["icc", "new-industry"],
    performance: ["rise", "innovation"],
    roadmap: ["rise", "new-industry"],
  };
  let preferred = themeProgramMap[themeId] || ["innovation", "rise", "new-industry"];
  if (String(themeId).startsWith("part:")) {
    const partId = themeId.slice(5);
    const part = (state.parts || []).find((p) => p.id === partId);
    const hint = `${part?.title || ""} ${part?.note || ""} ${direction}`;
    if (/예산|비목/.test(hint)) preferred = ["innovation", "rise"];
    else if (/성과|지표|KPI/.test(hint)) preferred = ["rise", "innovation"];
    else if (/ICC|지산학|산학/.test(hint)) preferred = ["icc", "new-industry"];
    else if (/교육|트랙|과정/.test(hint)) preferred = ["edu", "innovation"];
    else preferred = ["innovation", "rise", "new-industry"];
  }

  const scored = all.map((s) => {
    let score = preferred.includes(s.program) ? 8 : 2;
    if (/rise|지역|혁신/.test(blob) && s.program === "rise") score += 6;
    if (/신산업|icc|산학/.test(blob) && (s.program === "new-industry" || s.program === "icc")) score += 6;
    if (/혁신|자율|전문대/.test(blob) && s.program === "innovation") score += 5;
    if (/교육|트랙|과정/.test(blob) && s.program === "edu") score += 5;
    (s.cues || []).forEach((c) => {
      if (blob.includes(String(c).slice(0, 2))) score += 1;
    });
    if (s.source === "upload") score += 2;
    return { sample: s, score };
  });
  scored.sort((a, b) => b.score - a.score || (b.sample.source === "upload" ? 1 : 0) - (a.sample.source === "upload" ? 1 : 0));
  return scored.slice(0, limit).map((x) => x.sample);
}

export function buildLearnedStyleGuideBlock(samples = []) {
  if (!samples.length) return "";
  const lines = [
    "【양식 학습 레퍼런스 — 아래 실무 보고서 도식 톤을 우선 반영】",
    ...samples.map(
      (s, i) =>
        `${i + 1}) ${programLabel(s.program)} · ${s.title}\n   - 시각 특징: ${(s.cues || []).join(", ")}\n   - ${s.source === "upload" ? "TF 업로드 학습본" : "내장 학습본"}`
    ),
    "위 학습 양식과 동일한 흑백·회색 톤, 박스·표·화살표 밀도, 여백 규칙을 유지하며 더 정교하고 세밀하게 설계하세요.",
  ];
  return lines.join("\n");
}

export function boostLayoutsFromLearning(layoutIds, samples = []) {
  const refs = new Set(samples.map((s) => s.layoutRef).filter(Boolean));
  const boosted = [...layoutIds];
  refs.forEach((ref) => {
    if (ref && !boosted.includes(ref)) boosted.unshift(ref);
  });
  return [...new Set(boosted)].slice(0, Math.max(layoutIds.length, 5));
}

const LAYOUT_KEYWORDS = {
  competency: /역량|현황|분석|여건|진단/,
  "section-cover": /개요|요약|장|도입|표지/,
  "three-year": /3개년|개년|연차|연도|2025|2026|2027/,
  process: /체계|프로세스|추진|단계|순환/,
  kpi: /지표|성과|KPI|달성|목표/,
  matrix: /매트릭스|ICC|비교|2축|특성화/,
  org: /조직|거버넌스|위원|협의|체계/,
  swot: /SWOT|강점|약점|기회|시사/,
  timeline: /일정|타임|마일스톤|분기|로드맵/,
  budget: /예산|비목|사업비/,
};

function scoreLayoutForStudio(layout, { direction = "", themeId = "" } = {}) {
  const blob = `${direction} ${themeId}`.toLowerCase();
  let score = 1;
  const kw = LAYOUT_KEYWORDS[layout.id];
  if (kw?.test(blob)) score += 8;
  if (new RegExp(layout.name.replace(/[·\s]/g, "|"), "i").test(direction || "")) score += 4;
  return score;
}

/** 양식학습 + 목차 방향을 반영해 레이아웃 추천 순 정렬 */
export function getStudioLayoutOptions(state, { themeId = "", direction = "", limit = 10 } = {}) {
  const samples = pickSamplesForGeneration(state, { themeId, direction, limit: 24 });
  const recentUploads = samples.filter((s) => s.source === "upload");
  const scored = REPORT_LAYOUTS.map((layout) => {
    let score = scoreLayoutForStudio(layout, { direction, themeId });
    samples.forEach((s, i) => {
      if (s.layoutRef === layout.id) score += 14 - Math.min(i, 8);
      if (s.source === "upload" && s.layoutRef === layout.id) score += 4;
    });
    const learnedFrom = samples.find((s) => s.layoutRef === layout.id);
    return {
      ...layout,
      score,
      learned: Boolean(learnedFrom),
      learnedTitle: learnedFrom?.title || "",
    };
  });
  scored.sort((a, b) => b.score - a.score || (b.learned ? 1 : 0) - (a.learned ? 1 : 0));
  const top = scored.slice(0, limit);
  const rest = scored.slice(limit).filter((l) => !top.some((t) => t.id === l.id));
  return [...top, ...rest.slice(0, Math.max(0, limit - top.length))].slice(0, limit);
}

export function layoutOptionsUpdatedLabel(state) {
  const n = getAllLearnedSamples(state).filter((s) => s.source === "upload").length;
  const total = getAllLearnedSamples(state).length;
  if (!total) return "기본 양식 · 학습 데이터를 올리면 추천이 갱신됩니다";
  return `학습 ${total}건 반영${n ? ` · 업로드 ${n}건` : ""} · 추천 순 자동 갱신`;
}

export function learningBannerHtml(samples = [], { compact = false } = {}) {
  if (!samples.length) {
    return `<p class="style-learn-banner muted">학습된 양식이 없습니다. 「양식학습」 탭에서 보고서 그림을 추가해 주세요.</p>`;
  }
  const chips = samples
    .slice(0, compact ? 4 : 8)
    .map(
      (s) => `
    <span class="style-learn-chip" title="${escapeAttr(s.title)}">
      <span class="style-learn-chip-thumb">${thumbHtml(s)}</span>
      <span>${escapeHtml(programLabel(s.program))}</span>
    </span>`
    )
    .join("");
  return `
    <div class="style-learn-banner ${compact ? "is-compact" : ""}">
      <div class="style-learn-banner-head">
        <strong>${samples.length}건 학습 양식 반영 중</strong>
        <span class="muted">전문대 혁신·RISE·신산업 등 실무 보고서 톤 기반</span>
      </div>
      <div class="style-learn-chip-row">${chips}${samples.length > (compact ? 4 : 8) ? `<span class="muted">+${samples.length - (compact ? 4 : 8)}</span>` : ""}</div>
    </div>`;
}

export function learningGalleryHtml(samples, { filter = "all", uid = () => "s" } = {}) {
  const rows =
    filter === "all" ? samples : samples.filter((s) => s.program === filter);
  if (!rows.length) {
    return `<div class="empty">해당 분류의 학습 양식이 없습니다.</div>`;
  }
  return `
    <div class="style-learn-grid">
      ${rows
        .map(
          (s) => `
        <article class="style-learn-card ${s.source === "upload" ? "is-upload" : "is-builtin"}" data-sample-id="${escapeAttr(s.id)}">
          <div class="style-learn-card-thumb">${thumbHtml(s)}</div>
          <div class="style-learn-card-body">
            <span class="badge">${escapeHtml(programLabel(s.program))}</span>
            <strong>${escapeHtml(s.title)}</strong>
            <p class="muted">${escapeHtml((s.cues || []).slice(0, 4).join(" · "))}</p>
            <span class="style-learn-meta">${s.source === "upload" ? "업로드" : "내장"} · ${escapeHtml(String(s.learnedAt || "").slice(0, 10))}</span>
          </div>
          ${s.source === "upload" ? `<button type="button" class="btn btn-sm btn-danger style-learn-del" data-del-sample="${escapeAttr(s.id)}">삭제</button>` : ""}
        </article>`
        )
        .join("")}
    </div>`;
}

async function compressImageFile(file, maxBytes = MAX_UPLOAD_BYTES) {
  if (!file.type.startsWith("image/")) throw new Error("PNG·JPG 이미지만 업로드할 수 있습니다.");
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("이미지를 읽지 못했습니다."));
    reader.readAsDataURL(file);
  });
  if (dataUrl.length <= maxBytes * 1.37) {
    return { dataUrl, thumbDataUrl: dataUrl };
  }
  const img = await new Promise((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("이미지 미리보기 실패"));
    el.src = dataUrl;
  });
  const canvas = document.createElement("canvas");
  let w = img.width;
  let h = img.height;
  const scale = Math.min(1, 1200 / Math.max(w, h));
  w = Math.round(w * scale);
  h = Math.round(h * scale);
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, w, h);
  let quality = 0.88;
  let out = canvas.toDataURL("image/jpeg", quality);
  while (out.length > maxBytes * 1.37 && quality > 0.45) {
    quality -= 0.08;
    out = canvas.toDataURL("image/jpeg", quality);
  }
  const thumbCanvas = document.createElement("canvas");
  const tw = 240;
  const th = Math.round((h / w) * tw);
  thumbCanvas.width = tw;
  thumbCanvas.height = th;
  thumbCanvas.getContext("2d").drawImage(img, 0, 0, tw, th);
  return { dataUrl: out, thumbDataUrl: thumbCanvas.toDataURL("image/jpeg", 0.82) };
}

export async function ingestStyleSample(state, file, { program, title, layoutRef, diagramRef, uid, manager, analysis } = {}) {
  if (!file?.size) throw new Error("파일을 선택해 주세요.");
  const uploads = getAllLearnedSamples(state).filter((s) => s.source === "upload");
  if (uploads.length >= MAX_UPLOADS) throw new Error(`업로드 학습본은 최대 ${MAX_UPLOADS}건까지입니다.`);

  const { dataUrl, thumbDataUrl } = await compressImageFile(file);
  const baseName = (file.name || "보고서양식").replace(/\.[^.]+$/, "");
  const who = String(manager || "").trim() || "관리자";
  const sample = {
    id: uid("style"),
    program: analysis?.program || program || "innovation",
    title: String(analysis?.title || title || baseName).trim().slice(0, 80),
    layoutRef: analysis?.layoutRef || layoutRef || "",
    diagramRef: diagramRef || "",
    cues: Array.isArray(analysis?.cues) && analysis.cues.length
      ? analysis.cues
      : [
          programLabel(program || analysis?.program),
          "업로드 도식",
          "흑백·회색 공공보고서",
        ],
    dataUrl,
    thumbDataUrl,
    fileName: file.name,
    source: "upload",
    manager: who,
    summary: analysis?.summary || "",
    learnedAt: new Date().toISOString().slice(0, 10),
  };
  ensureReportStyleLearning(state);
  state.reportStyleLearning.samples.unshift(sample);
  state.reportStyleLearning.logs.unshift({
    id: uid("slog"),
    sampleId: sample.id,
    manager: who,
    title: sample.title,
    program: sample.program,
    layoutRef: sample.layoutRef,
    summary: sample.summary,
    at: new Date().toISOString(),
  });
  state.reportStyleLearning.logs = state.reportStyleLearning.logs.slice(0, 80);
  state.reportStyleLearning.updatedAt = new Date().toISOString();
  return sample;
}

export function learningLogHtml(logs = []) {
  if (!logs.length) {
    return `<p class="empty">아직 학습 기록이 없습니다. 그림을 올리면 담당자와 시각이 쌓입니다.</p>`;
  }
  return `
    <ol class="style-learn-log">
      ${logs
        .slice(0, 40)
        .map(
          (l) => `
        <li>
          <div class="style-learn-log-head">
            <strong>${escapeHtml(l.manager || "관리자")}</strong>
            <time>${escapeHtml(String(l.at || "").slice(0, 16).replace("T", " "))}</time>
          </div>
          <em>${escapeHtml(l.title || "양식")}</em>
          ${l.summary ? `<p>${escapeHtml(l.summary)}</p>` : ""}
        </li>`
        )
        .join("")}
    </ol>`;
}

export function removeLearnedSample(state, id) {
  const samples = getAllLearnedSamples(state);
  const hit = samples.find((s) => s.id === id);
  if (!hit || hit.source !== "upload") return false;
  state.reportStyleLearning.samples = samples.filter((s) => s.id !== id);
  state.reportStyleLearning.updatedAt = new Date().toISOString();
  return true;
}

export function programStats(samples) {
  const map = {};
  STYLE_PROGRAMS.forEach((p) => {
    map[p.id] = 0;
  });
  samples.forEach((s) => {
    map[s.program] = (map[s.program] || 0) + 1;
  });
  return map;
}
