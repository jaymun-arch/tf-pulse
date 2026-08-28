import {
  extractTextFromFile,
  analyzeReportText,
  analyzeReviewSummary,
  generateYeonsungImage,
  planReportDiagram,
  learnStyleFromImage,
  downloadImagesAsPpt,
} from "./ai.js";
import { REPORT_LAYOUTS, downloadReportLayoutPpt, layoutPreviewWireHtml } from "./report-layouts.js";
import { downloadEditableDiagramPpt, diagramPreviewWireHtml } from "./report-diagrams.js";
import { downloadReportArtPackagePpt } from "./report-art-pack.js";
import {
  composeStudioPack,
  buildStudioUsageGuide,
  studioStageHtml,
  animateStudioBuild,
} from "./report-art-studio.js";
import {
  ensureReportStyleLearning,
  getAllLearnedSamples,
  pickSamplesForGeneration,
  buildLearnedStyleGuideBlock,
  learningGalleryHtml,
  ingestStyleSample,
  removeLearnedSample,
  programStats,
  STYLE_PROGRAMS,
  DEFAULT_STYLE_SAMPLES,
  learningLogHtml,
  getStudioLayoutOptions,
  layoutOptionsUpdatedLabel,
} from "./report-style-learning.js";
import {
  DEFAULT_TF_TOPICS,
  computeMilestoneProgress,
  marathonTrackHtml,
  bindMarathonRunner,
  flaticonSearchHtml,
  bindFlaticonSearch,
  legoBuilderHtml,
  bindLegoBuilder,
  downloadLegoDraftPpt,
} from "./tf-redesign.js";

const STORAGE_KEY = "tf-ops-data-v17";
const USER_KEY = "tf-ops-user-v1";
const REMIND_KEY = "tf-ops-schedule-remind-v1";
const TF_TOPIC_KEY = "tf-ops-topic-v1";
const PROCESS_GUIDE_KEY = "tf-process-guide-dismissed-v1";
const REMIND_BEFORE_DAYS = 14;

const BUDGET_CATALOG = {
  areas: ["1. 전략", "2. 고등직업교육", "3. 산학지역", "4. 자율", "5. 사업관리 및 운영"],
  contents: [
    "가. 교육혁신전략",
    "나. 교육혁신의 성공적 추진을 위한 제도 기반",
    "가. 핵심역량 기반 교육과정 체계혁신",
    "나. 산학공동 직무특화 교육 혁신",
    "다. 미래역량 기반 교수학습 혁신",
    "라. 학생상담·진로로드",
    "마. 학생취업·창업로드",
    "바. 학생글로벌 성장지원",
    "가. 지산학연계 교육과정 운영",
    "나. 지산학협력 체계와 기업성장 지원",
    "다. 지역기반 평생직업교육 강화",
    "가. 공유협력 강화",
    "나. 사회적 가치실현",
    "가. 성과관리",
    "나. 성과확산 및 공유",
    "다. 재정관리",
  ],
  expenseTypes: [
    "인건비",
    "장학금",
    "교육·연구 프로그램 개발·운영비",
    "교육·연구환경개선비",
    "실험·실습장비 및 기자재 구입·운영비",
    "그 밖의 사업운영경비",
    "간접비",
  ],
  depts: ["기획처", "교무처", "학생취업처", "입학홍보처", "산학협력처", "국제교류원", "평생교육원", "도서관"],
  workDepts: [
    "IR센터",
    "교무처",
    "교육혁신본부",
    "교양교육혁신센터",
    "교수학습혁신센터",
    "학생취업처",
    "마음건강상담센터",
    "입학홍보처",
    "창업지원센터",
    "현장실습지원센터",
    "지산학협력혁신센터",
    "산학협력처",
    "국제교류원",
    "평생교육원",
    "도서관",
    "기획처",
    "ESG봉사단",
    "대학인권센터",
  ],
};

const VIEW_META = {
  dashboard: { title: "TF 요약", desc: "지금 열린 단계만, 내 파트만 하면 됩니다" },
  "my-work": { title: "요청", desc: "관리자가 등록한 업무" },
  "tf-all": { title: "모아보기", desc: "보고서·예산·성과지표 통합" },
  parts: { title: "목차·할당", desc: "목차와 파트 분량" },
  collections: { title: "보고서 통합", desc: "차수별 제출·분량 분석" },
  review: { title: "윤독", desc: "검토사항 기록" },
  requests: { title: "요청", desc: "작업 요청·진행" },
  budget: { title: "예산", desc: "예산을 입력·제출하고 영역별로 구성합니다" },
  schedule: { title: "TF 일정", desc: "마감 순 타임라인에서 일정을 작성합니다" },
  drive: { title: "드라이브", desc: "지침·서식·스타일가이드를 올리고 할 일에 연결합니다" },
  resources: { title: "양식", desc: "공통양식·가이드" },
  food: { title: "식사", desc: "메뉴 돌림판·투표" },
  members: { title: "구성원", desc: "TF 멤버" },
  "ai-art": { title: "그림", desc: "영역 · 레이아웃 · 내용만 정하면 됩니다" },
  kpi: { title: "지표", desc: "성과지표를 입력·제출하고 영역별로 구성합니다" },
  guide: { title: "사용방법", desc: "처음 사용자도 순서대로 따라갈 수 있습니다" },
};

/** 상단: TF요약 · 내업무 · 모아보기 · 사용방법 (+ Setting) */
const NAV_GROUPS = {
  home: {
    label: "TF 요약",
    views: ["dashboard"],
    defaultView: "dashboard",
  },
  mywork: {
    label: "내업무",
    views: ["my-work", "ai-art", "kpi", "budget", "food", "requests"],
    labels: {
      "my-work": "받은 요청",
      "ai-art": "그림",
      kpi: "지표",
      budget: "예산",
      food: "식사",
      requests: "요청",
    },
    hideTabs: ["requests"],
    defaultView: "ai-art",
  },
  tfall: {
    label: "모아보기",
    views: ["collections", "budget", "kpi"],
    labels: {
      collections: "보고서 통합",
      budget: "예산 통합",
      kpi: "성과지표 통합",
    },
    defaultView: "collections",
  },
  guide: {
    label: "사용방법",
    views: ["guide"],
    defaultView: "guide",
  },
  setup: {
    label: "Setting",
    adminOnly: true,
    views: ["schedule", "members", "parts", "drive"],
    labels: { schedule: "TF 일정", members: "구성원", parts: "목차·할당", drive: "드라이브" },
    defaultView: "schedule",
  },
};

const VIEW_TO_NAV = Object.fromEntries(
  Object.entries(NAV_GROUPS).flatMap(([navId, g]) => g.views.map((v) => [v, navId]))
);

let activeNavId = "home";
let activeViewName = "dashboard";
const lastViewByNav = {};

let state = null;
let activeRound = 1;
let modalHandler = null;
let sessionUser = null;

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function uid(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function pagesOf(part) {
  return Math.max(0, (part.pageEnd ?? 0) - (part.pageStart ?? 0) + 1);
}

function memberById(id) {
  return state.members.find((m) => m.id === id);
}

function memberByName(name) {
  return state.members.find((m) => m.name === name);
}

function currentMember() {
  return sessionUser ? memberByName(sessionUser) : null;
}

function isAdmin() {
  return currentMember()?.role === "admin";
}

function myWorkRequestTabLabel() {
  return isAdmin() ? "보낸요청" : "받은 요청";
}

function navLabelForView(viewName, group) {
  if (viewName === "my-work") return myWorkRequestTabLabel();
  return group?.labels?.[viewName] || VIEW_META[viewName]?.title || viewName;
}

function isAdminRegisteredWork(s) {
  const owner = String(s?.owner || s?.createdBy || "").trim();
  if (!owner) return true;
  const member = memberByName(owner);
  if (member) return member.role === "admin";
  return owner === (state.meta?.adminName || "");
}

function isBudgetManager() {
  return currentMember()?.role === "budget";
}

function isKpiManager() {
  return currentMember()?.role === "kpi";
}

function canManageKpi() {
  return isAdmin() || isKpiManager();
}

function isFoodManager() {
  return currentMember()?.role === "food";
}

function canManageBudget() {
  return isAdmin() || isBudgetManager();
}

function roleLabel(role) {
  return {
    admin: "관리자",
    budget: "예산담당자",
    kpi: "성과지표담당자",
    food: "식사담당",
    member: "대상자",
  }[role] || "대상자";
}

function myPartIds() {
  const me = currentMember();
  if (!me) return [];
  return state.parts.filter((p) => p.assigneeId === me.id).map((p) => p.id);
}

function myAssignedParts() {
  const ids = new Set(myPartIds());
  return (state.parts || []).filter((p) => ids.has(p.id));
}

function myAssignedPartsLine() {
  const parts = myAssignedParts();
  if (!parts.length) return "담당 영역 미배정";
  const bits = parts.slice(0, 3).map((p) => {
    const name = `${p.section || ""} ${p.title || ""}`.replace(/\s+/g, " ").trim();
    const pages = pagesOf(p);
    return pages ? `${name} ${pages}p` : name;
  });
  return bits.join(" · ") + (parts.length > 3 ? ` 외 ${parts.length - 3}` : "");
}

function canEditSubmission(partId) {
  return isAdmin() || myPartIds().includes(partId);
}

function partById(id) {
  return state.parts.find((p) => p.id === id);
}

function allocatedTotal() {
  return state.parts.reduce((sum, p) => sum + pagesOf(p), 0);
}

/** 취합 진도: 미제출 / 제출 */
function submissionBoardStatus(sub) {
  if (!sub) return { id: "todo", label: "미제출", cls: "pending" };
  if (sub.status === "submitted" || sub.partDone) {
    return { id: "done", label: "제출", cls: "ok" };
  }
  return { id: "todo", label: "미제출", cls: "pending" };
}

function latestCollection() {
  if (!state.collections?.length) return null;
  const maxRound = Math.max(...state.collections.map((c) => c.round));
  return state.collections.find((c) => c.round === maxRound) || state.collections[0];
}

/** 취합 차수: 최신(라운드 큰 순)이 앞 */
function collectionsNewestFirst() {
  return [...(state.collections || [])].sort((a, b) => (Number(b.round) || 0) - (Number(a.round) || 0));
}

/** 홈·할 일용: 내 미완 작업 */
function buildMyActionItems() {
  const items = [];
  const mine = myPartIds();
  const col = latestCollection();
  if (col && mine.length) {
    col.submissions
      .filter((s) => mine.includes(s.partId))
      .forEach((s) => {
        const st = submissionBoardStatus(s);
        if (st.id === "done") return;
        const p = partById(s.partId);
        items.push({
          id: `col-${col.round}-${s.partId}`,
          kind: "collection",
          title: `${p ? `${p.section}. ${p.title}` : s.partId} · ${st.label}`,
          meta: `${col.name} 취합`,
          goto: "collections",
          urgent: st.id === "todo",
        });
      });
  }

  ensureRequests();
  myPendingRequests().forEach((r) => {
    const days = r.dueDate ? daysUntil(r.dueDate) : null;
    items.push({
      id: `req-${r.id}`,
      kind: "request",
      title: r.title || "공통 요청",
      meta: r.dueDate
        ? `마감 ${r.dueDate}${days != null ? ` · ${timingLabel(days)}` : ""}`
        : "마감 미지정",
      goto: "requests",
      urgent: days != null && days <= 2,
      requestId: r.id,
    });
  });

  ensureBudget();
  const me = currentMember();
  const mode = getBudgetInputMode();
  const meta = budgetModeMeta(mode);
  if (me) {
    state.budget.items
      .filter((i) => i.assigneeId === me.id && !budgetCalcOf(i, mode))
      .forEach((i) => {
        items.push({
          id: `bud-${i.id}`,
          kind: "budget",
          title: `${i.no ? `${i.no}. ` : ""}${i.activity || i.title || "예산 항목"} · ${meta.short} 미입력`,
          meta: meta.tabLabel,
          goto: "budget",
          urgent: true,
        });
      });
  }
  return items;
}

/** 팀 취합 진도 (최신 차수) */
function buildTeamCollectionBoard(col = latestCollection()) {
  if (!col) return [];
  return col.submissions.map((s) => {
    const p = partById(s.partId);
    const m = p ? memberById(p.assigneeId) : null;
    const st = submissionBoardStatus(s);
    return {
      partId: s.partId,
      section: p?.section || "",
      title: p?.title || s.partId,
      assignee: m?.name || "미지정",
      pages: Number(s.pageCount) || 0,
      alloc: p ? pagesOf(p) : 0,
      status: st,
      isMine: myPartIds().includes(s.partId),
    };
  });
}

function collectionSummary(round) {
  const col = state.collections.find((c) => c.round === round);
  if (!col) return { submitted: 0, pending: 0, pages: 0, allocPages: 0, totalParts: 0 };
  const submitted = col.submissions.filter((s) => submissionBoardStatus(s).id === "done").length;
  const allocPages = col.submissions.reduce((sum, s) => {
    const p = partById(s.partId);
    return sum + (p ? pagesOf(p) : 0);
  }, 0);
  const pages = col.submissions.reduce((sum, s) => {
    if (submissionBoardStatus(s).id !== "done") return sum;
    const p = partById(s.partId);
    return sum + (p ? pagesOf(p) : Number(s.pageCount) || 0);
  }, 0);
  return {
    submitted,
    pending: col.submissions.length - submitted,
    pages,
    allocPages,
    totalParts: col.submissions.length,
  };
}

function submissionsInPartOrder(col) {
  return [...(col?.submissions || [])].sort((a, b) => {
    const pa = partById(a.partId);
    const pb = partById(b.partId);
    return String(pa?.section || "").localeCompare(String(pb?.section || ""), "ko", { numeric: true });
  });
}

function markPartSubmitted(sub) {
  if (!sub) return;
  const p = partById(sub.partId);
  sub.pageCount = p ? pagesOf(p) : Number(sub.pageCount) || 0;
  sub.status = "submitted";
  sub.submittedAt = today();
  sub.partDone = true;
  sub.submittedBy = sessionUser || memberById(p?.assigneeId)?.name || "";
}

function safeZipFileName(text, fallback = "파트") {
  const raw = String(text || fallback).replace(/[\\/:*?"<>|]/g, "_").replace(/\s+/g, "_");
  return raw.slice(0, 60) || fallback;
}

function orderedCollectionHangulFiles(col) {
  const files = [];
  submissionsInPartOrder(col).forEach((s, i) => {
    const p = partById(s.partId);
    const hangul = normalizeCheckFiles(s).filter((f) => isHangulFileName(f.name) && f.dataUrl);
    hangul.forEach((f, j) => {
      const n = String(i + 1).padStart(2, "0");
      const extra = hangul.length > 1 ? `_${j + 1}` : "";
      const ext = (f.name.match(/\.(hwp|hwpx)$/i) || ["", "hwp"])[1].toLowerCase();
      const base = safeZipFileName(p ? `${p.section}_${p.title}` : s.partId);
      files.push({
        ...f,
        partLabel: p ? `${p.section}. ${p.title}` : s.partId,
        zipName: `${n}_${base}${extra}.${ext}`,
      });
    });
  });
  return files;
}

async function downloadMergedHangulZip(col) {
  if (!col) return;
  const files = orderedCollectionHangulFiles(col);
  if (!files.length) {
    alert("이 기기에서 올린 한글 파일이 없습니다. 담당자가 내업무에서 파일을 올리면 목차 순서대로 묶을 수 있습니다.");
    return;
  }
  try {
    const JSZip = (await import("https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm")).default;
    const zip = new JSZip();
    const indexLines = [`${col.name || "취합"} 한글 파일 순서`, ""];
    files.forEach((f, i) => {
      const b64 = String(f.dataUrl || "").split(",")[1];
      if (!b64) return;
      zip.file(f.zipName, b64, { base64: true });
      indexLines.push(`${i + 1}. ${f.partLabel} — ${f.name}`);
    });
    zip.file("00_취합순서.txt", indexLines.join("\n"));
    const blob = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${safeZipFileName(col.name, "취합")}_한글취합본.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  } catch (err) {
    alert(err?.message || "파일을 묶지 못했습니다. 네트워크 후 다시 시도해 주세요.");
  }
}

function areaCategory(area) {
  if (!area) return "기타";
  const parts = String(area).split(". ");
  return parts.length > 1 ? parts.slice(1).join(". ") : area;
}

function normalizeBudgetItem(raw = {}) {
  const activity = (raw.activity || raw.title || "").trim();
  const area = (raw.area || "").trim();
  const item = {
    id: raw.id || uid("b"),
    no: String(raw.no ?? ""),
    area,
    content: (raw.content || "").trim(),
    task: (raw.task || "").trim(),
    activity,
    dept: (raw.dept || "").trim(),
    workDept: (raw.workDept || "").trim(),
    planned: Number(raw.planned) || 0,
    spent: Number(raw.spent) || 0,
    assigneeId: raw.assigneeId || "",
    calcText: (raw.calcText || "").trim(),
    actualCalcText: (raw.actualCalcText || "").trim(),
    note: (raw.note || "").trim(),
    expenseType: (raw.expenseType || "").trim(),
    title: activity || (raw.title || "").trim() || "항목",
    category: (raw.category || "").trim() || areaCategory(area),
    partId: raw.partId || "",
    createdById: raw.createdById || "",
    status: raw.status === "submitted" ? "submitted" : raw.status === "draft" ? "draft" : "",
    submittedAt: raw.submittedAt || "",
    submittedBy: raw.submittedBy || "",
    areaOrder: Number(raw.areaOrder) || 0,
  };
  return item;
}

const UNASSIGNED_AREA = "미분류";

function workAreaColumns() {
  return [UNASSIGNED_AREA, ...BUDGET_CATALOG.areas];
}

function workAreaKey(area) {
  const a = String(area || "").trim();
  return BUDGET_CATALOG.areas.includes(a) ? a : UNASSIGNED_AREA;
}

function isBudgetSubmitted(item) {
  if (!item) return false;
  if (item.status === "submitted" || item.submittedAt) return true;
  if (!item.status && !item.createdById) return true;
  return false;
}

function isBudgetMemberDraft(item) {
  return Boolean(item?.createdById && item.status !== "submitted" && !item.submittedAt);
}

function markBudgetSubmitted(item) {
  if (!item) return item;
  item.status = "submitted";
  item.submittedAt = item.submittedAt || today();
  item.submittedBy = sessionUser || item.submittedBy || "";
  return item;
}

function ensureBudget() {
  if (!state.budget || typeof state.budget !== "object") {
    state.budget = { total: 0, note: "", items: [], details: [], expensePlan: [] };
  }
  if (!Array.isArray(state.budget.items)) state.budget.items = [];
  if (!Array.isArray(state.budget.details)) state.budget.details = [];
  if (!Array.isArray(state.budget.expensePlan)) state.budget.expensePlan = [];
  state.budget.items = state.budget.items.map((i) => normalizeBudgetItem(i));
  state.budget.total = Number(state.budget.total) || 0;
  state.budget.note = state.budget.note || "";
  state.budget.yearLabel = state.budget.yearLabel || "당해연도";
  state.budget.inputMode = state.budget.inputMode === "result" ? "result" : "plan";
  if (!state.budget.expensePlan.length) {
    state.budget.expensePlan = BUDGET_CATALOG.expenseTypes.map((name) => ({ name, planned: 0 }));
  }
}

function getBudgetInputMode() {
  ensureBudget();
  return state.budget.inputMode === "result" ? "result" : "plan";
}

function setBudgetInputMode(mode) {
  ensureBudget();
  ensureReportDoc();
  const next = mode === "result" ? "result" : "plan";
  state.budget.inputMode = next;
  state.report.docKind = next;
}

function budgetModeMeta(mode = getBudgetInputMode()) {
  if (mode === "result") {
    return {
      mode: "result",
      tabLabel: "결과보고작성용 (실적)",
      short: "실적",
      amountLabel: "실적금액",
      calcLabel: "실적 산출내역",
      enteredLabel: "현재 실적 합계",
      remainLabel: "미집행·확인 필요",
      filledLabel: "실적 산출 완료",
      tableTitle: "사업비 비목별 실적 입력 현황",
      tableSub: "결과보고 작성 기준 · 실적 입력 현황",
      assigneeTitle: "담당자별 실적 입력 현황",
      detailTitleManage: "실적 항목 상세",
      detailTitleMine: "내 실적 항목",
      bannerLead: "사업비 총액 대비",
      bannerTail: "의 실적·사용처가 더 확인이 필요합니다.",
      requestTitle: "실적을 입력하세요",
      entryHint: "실적금액과 실적 산출내역을 입력한 뒤 저장해 주세요. 편성금액은 참고용입니다.",
    };
  }
  return {
    mode: "plan",
    tabLabel: "운영계획수립용 (예산)",
    short: "예산",
    amountLabel: "편성금액",
    calcLabel: "세부 산출내역",
    enteredLabel: "현재 입력 합계",
    remainLabel: "사용처 확인 필요",
    filledLabel: "산출 입력 완료",
    tableTitle: "사업비 비목별 예산 입력 현황",
    tableSub: "운영계획 수립 기준 · 편성 입력 현황",
    assigneeTitle: "담당자별 예산 입력 현황",
    detailTitleManage: "예산 항목 상세",
    detailTitleMine: "내 예산 항목",
    bannerLead: "사업비 총액 대비",
    bannerTail: "의 사용처가 더 확인이 필요합니다.",
    requestTitle: "예산을 입력하세요",
    entryHint: "편성금액과 세부 산출내역을 선택·입력한 뒤 저장해 주세요.",
  };
}

function budgetAmountOf(item, mode = getBudgetInputMode()) {
  return Number(mode === "result" ? item?.spent : item?.planned) || 0;
}

function budgetCalcOf(item, mode = getBudgetInputMode()) {
  return ((mode === "result" ? item?.actualCalcText : item?.calcText) || "").trim();
}

function budgetExpenseStatus(mode = getBudgetInputMode()) {
  ensureBudget();
  const entered = {};
  state.budget.items.forEach((item) => {
    const key = item.expenseType || "미분류";
    if (!entered[key]) entered[key] = { amount: 0, count: 0, filled: 0 };
    entered[key].amount += budgetAmountOf(item, mode);
    entered[key].count += 1;
    if (budgetCalcOf(item, mode)) entered[key].filled += 1;
  });

  const total = Number(state.budget.total) || 0;
  const names = [
    ...BUDGET_CATALOG.expenseTypes,
    ...Object.keys(entered).filter((k) => !BUDGET_CATALOG.expenseTypes.includes(k)),
  ];
  const rows = names.map((name) => {
    const ent = entered[name] || { amount: 0, count: 0, filled: 0 };
    return {
      name,
      entered: ent.amount,
      count: ent.count,
      filled: ent.filled,
      shareEntered: 0,
      shareOfTotal: 0,
    };
  });
  const enteredTotal = rows.reduce((s, r) => s + r.entered, 0);
  const remain = Math.max(0, total - enteredTotal);
  const enteredPct = total ? Math.round((enteredTotal / total) * 1000) / 10 : 0;
  const remainPct = total ? Math.round((remain / total) * 1000) / 10 : 0;
  rows.forEach((r) => {
    r.shareEntered = enteredTotal ? (r.entered / enteredTotal) * 100 : 0;
    r.shareOfTotal = total ? (r.entered / total) * 100 : 0;
  });
  return { rows, total, enteredTotal, remain, enteredPct, remainPct, mode };
}

function budgetItemLabel(item) {
  if (!item) return "";
  const no = item.no ? `${item.no}. ` : "";
  return `${no}${item.activity || item.title || "항목"}`;
}

function budgetTipHtml(text, className, innerHtml = "") {
  const full = (text || "").trim();
  const body = innerHtml || escapeHtml(full || "-");
  if (!full || full === "-") {
    return `<div class="${className}">${body}</div>`;
  }
  return `<div class="${className} budget-tip" data-budget-tip="${escapeAttr(full)}" tabindex="0">${body}</div>`;
}

function ensureBudgetTipFloat() {
  let floatEl = $("#budgetTipFloat");
  if (floatEl) return floatEl;
  floatEl = document.createElement("div");
  floatEl.id = "budgetTipFloat";
  floatEl.className = "budget-tip-float";
  floatEl.setAttribute("role", "tooltip");
  document.body.appendChild(floatEl);
  return floatEl;
}

function hideBudgetTip() {
  const floatEl = $("#budgetTipFloat");
  if (!floatEl) return;
  floatEl.classList.remove("is-open");
  floatEl.textContent = "";
}

function showBudgetTip(anchor) {
  const text = (anchor.getAttribute("data-budget-tip") || "").trim();
  if (!text) return;
  const floatEl = ensureBudgetTipFloat();
  floatEl.textContent = text;
  floatEl.classList.add("is-open");

  const place = () => {
    const gap = 8;
    const rect = anchor.getBoundingClientRect();
    const tipRect = floatEl.getBoundingClientRect();
    let left = rect.left;
    let top = rect.bottom + gap;
    if (left + tipRect.width > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - tipRect.width - 12);
    }
    if (top + tipRect.height > window.innerHeight - 12) {
      top = Math.max(12, rect.top - tipRect.height - gap);
      floatEl.classList.add("is-above");
    } else {
      floatEl.classList.remove("is-above");
    }
    floatEl.style.left = `${Math.max(12, left)}px`;
    floatEl.style.top = `${top}px`;
  };
  place();
  requestAnimationFrame(place);
}

function bindBudgetTips(root) {
  ensureBudgetTipFloat();
  root.querySelectorAll("[data-budget-tip]").forEach((el) => {
    el.addEventListener("mouseenter", () => showBudgetTip(el));
    el.addEventListener("mouseleave", hideBudgetTip);
    el.addEventListener("focus", () => showBudgetTip(el));
    el.addEventListener("blur", hideBudgetTip);
  });
  root.querySelector(".budget-table-wrap")?.addEventListener("scroll", hideBudgetTip, { passive: true });
}

function datalistOptions(id, values) {
  return `<datalist id="${id}">${values.map((v) => `<option value="${escapeAttr(v)}"></option>`).join("")}</datalist>`;
}

function inputAssignees() {
  return state.members.filter((m) => m.role === "member" || m.role === "food");
}

function canEditBudgetItem(item) {
  if (!item) return false;
  if (canManageBudget()) return true;
  const me = currentMember();
  if (!me) return false;
  return item.assigneeId === me.id || item.createdById === me.id;
}

function ensureRequests() {
  if (!Array.isArray(state.requests)) state.requests = [];
}

function formatWon(n) {
  const v = Number(n) || 0;
  return `${v.toLocaleString("ko-KR")}원`;
}

function budgetSummary() {
  ensureBudget();
  const planned = state.budget.items.reduce((sum, i) => sum + (Number(i.planned) || 0), 0);
  const spent = state.budget.items.reduce((sum, i) => sum + (Number(i.spent) || 0), 0);
  const total = Number(state.budget.total) || 0;
  return {
    total,
    planned,
    spent,
    remainTotal: total - spent,
    remainPlanned: planned - spent,
    unallocated: total - planned,
  };
}

function markDirty(dirty = true) {
  const hint = $("#saveHint");
  const dot = $("#saveDot");
  const wrap = $("#saveDotWrap");
  if (hint) {
    hint.textContent = dirty ? "저장중" : "저장됨";
    hint.classList.toggle("dirty", dirty);
  }
  if (dot) {
    dot.classList.toggle("ok", !dirty);
    dot.classList.toggle("dirty", dirty);
    dot.classList.toggle("busy", dirty);
  }
  if (wrap) {
    wrap.classList.toggle("is-saving", dirty);
    wrap.classList.toggle("is-saved", !dirty);
    wrap.classList.toggle("is-shared", !dirty);
    wrap.title = dirty ? "데이터 저장 중" : "데이터 저장 완료";
  }
}

let persistScheduled = false;

function flushPersist() {
  state.meta.updatedAt = new Date().toISOString();
  let level = 0;
  for (;;) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      markDirty(false);
      return true;
    } catch (err) {
      const quota =
        err?.name === "QuotaExceededError" ||
        err?.code === 22 ||
        /quota|exceeded/i.test(String(err?.message || err));
      if (!quota || level >= 5) {
        console.warn("persist failed", err);
        markDirty(true);
        return false;
      }
      level += 1;
      pruneHeavyAiPayloads(level);
    }
  }
}

function persist() {
  markDirty(true);
  if (persistScheduled) return;
  persistScheduled = true;
  queueMicrotask(() => {
    persistScheduled = false;
    flushPersist();
  });
}

function pruneHeavyAiPayloads(level = 0) {
  ensureAiBriefs();
  ensureAiArts();
  if (level >= 1) {
    // 오래된 그림부터 제거
    state.aiArts = state.aiArts.slice(0, Math.max(0, 8 - level * 2));
  }
  if (level >= 3) {
    // 그래도 부족하면 base64 제거(메타만 유지) → 화면에는 빈 카드 대신 정리
    state.aiArts = [];
  }
  if (level >= 2) {
    ensureReportStyleLearning(state);
    state.reportStyleLearning.samples = (state.reportStyleLearning.samples || [])
      .filter((s) => s.source !== "upload" || s.thumbDataUrl)
      .slice(0, Math.max(6, 16 - level * 3));
  }
  if (level >= 2) {
    ensureReviewSession();
    state.reviewSession.comments = (state.reviewSession.comments || []).map((c, i) =>
      i < 40 ? c : { ...c, photoDataUrl: "", thumbOnly: true }
    );
  }
  if (level >= 3) {
    ensureReviewSession();
    state.reviewSession.comments = (state.reviewSession.comments || []).slice(0, 30).map((c) => ({
      ...c,
      photoDataUrl: "",
    }));
  }
  if (level >= 4) {
    state.aiBriefs = state.aiBriefs.slice(0, 3).map((b) => ({
      ...b,
      sourceText: (b.sourceText || "").slice(0, 2000),
    }));
  }
}

function saveAndRender(view) {
  persistScheduled = false;
  markDirty(true);
  flushPersist();
  if (view) renderView(view);
  else renderAll();
}

async function loadSeed() {
  if (window.__TF_SEED__ && typeof window.__TF_SEED__ === "object") {
    return structuredClone
      ? structuredClone(window.__TF_SEED__)
      : JSON.parse(JSON.stringify(window.__TF_SEED__));
  }
  try {
    const res = await fetch("./data/tf-data.json", { cache: "no-store" });
    if (!res.ok) throw new Error("샘플 JSON을 불러오지 못했습니다.");
    return res.json();
  } catch (err) {
    if (window.__TF_SEED__) {
      return JSON.parse(JSON.stringify(window.__TF_SEED__));
    }
    throw err;
  }
}

async function initState() {
  const cached = localStorage.getItem(STORAGE_KEY);
  if (cached) {
    try {
      state = JSON.parse(cached);
      if (!state.budget) {
        const seed = await loadSeed();
        state.budget = seed.budget;
      }
      if (!state.requests) {
        const seed = await loadSeed();
        state.requests = seed.requests || [];
      }
      ensureBudget();
      ensureReportDoc();
      ensureRequests();
      ensureFoodPolls();
      ensureFoodCatalog();
      ensureFoodHistory();
      ensureAiBriefs();
      ensureAiArts();
      ensureReviewDocs();
      ensureReviewSession();
      ensureTfTopics();
      ensureCollectionPhases();
      ensureKpis();
      ensureSharedResources();
      persist();
      return;
    } catch {
      /* fall through */
    }
  }
  state = await loadSeed();
  ensureBudget();
  ensureReportDoc();
  ensureRequests();
  ensureFoodPolls();
  ensureFoodCatalog();
  ensureFoodHistory();
  ensureAiBriefs();
  ensureAiArts();
  ensureReviewDocs();
  ensureReviewSession();
  ensureTfTopics();
  ensureCollectionPhases();
  ensureKpis();
  ensureSharedResources();
  persist();
}

function ensureTfTopics() {
  if (!Array.isArray(state.tfTopics) || !state.tfTopics.length) {
    state.tfTopics = DEFAULT_TF_TOPICS.map((t) => ({
      ...t,
      memberIds: (state.members || []).map((m) => m.id),
    }));
  }
  state.tfTopics = state.tfTopics.map((t) => {
    let name = String(t.name || "TF").trim();
    name = name.replace(/^연어회\s*·\s*/, "");
    if (t.id === "yeonu-2026") name = "혁신지원사업 수정사업계획서";
    return {
      id: t.id || uid("tf"),
      name: name || "TF",
      desc: t.desc || "",
      memberIds: Array.isArray(t.memberIds) && t.memberIds.length
        ? t.memberIds
        : (state.members || []).map((m) => m.id),
    };
  });
  if (!state.activeTfTopicId || !state.tfTopics.some((t) => t.id === state.activeTfTopicId)) {
    state.activeTfTopicId = state.tfTopics[0]?.id || "";
  }
}

function activeTfTopic() {
  ensureTfTopics();
  return state.tfTopics.find((t) => t.id === state.activeTfTopicId) || state.tfTopics[0] || null;
}

function membersForActiveTopic() {
  const topic = activeTfTopic();
  if (!topic) return state.members || [];
  const set = new Set(topic.memberIds || []);
  const filtered = (state.members || []).filter((m) => set.has(m.id));
  return filtered.length ? filtered : state.members || [];
}

function liveTfMilestones() {
  const defaults = [
    { id: "kickoff", short: "킥오프", label: "TF 킥오프", date: "2026-07-15", tip: "서식·지침 공유" },
    { id: "round1", short: "1차", label: "1차 원고취합", date: "2026-08-20", tip: "1차 초안 취합" },
    { id: "round2", short: "2차", label: "2차 원고취합", date: "2026-09-05", tip: "리뷰 반영본 취합" },
    { id: "budget", short: "예산", label: "예산 조정", date: "2026-09-08", tip: "편성·산출근거" },
    { id: "kpi", short: "성과", label: "성과지표 수정", date: "2026-09-10", tip: "목표·산식" },
    { id: "final", short: "최종", label: "수정계획서 제출", date: "2026-09-15", tip: "최종 제출" },
  ];
  const dueOf = (s, fallback) => (s ? scheduleDueIso(s) || fallback : fallback);
  const forms = typeof tfScheduleForGuide === "function" ? tfScheduleForGuide("forms") : null;
  const r1 = scheduleForCollectionRound(1);
  const r2 = scheduleForCollectionRound(2);
  const r3 =
    scheduleForCollectionRound(3) ||
    (state.schedule || []).find((s) => scheduleGroupOf(s) === "collect" && /최종|제출/.test(s.title || ""));
  const budget = typeof tfScheduleForGuide === "function" ? tfScheduleForGuide("budget") : null;
  const kpi = typeof tfScheduleForGuide === "function" ? tfScheduleForGuide("kpi") : null;
  const pick = (s, def) => ({
    ...def,
    date: dueOf(s, def.date),
    label: s?.title || def.label,
    tip: s?.goal || s?.note || s?.askMessage || def.tip,
  });
  return [
    pick(forms, defaults[0]),
    pick(r1, defaults[1]),
    pick(r2, defaults[2]),
    pick(budget, defaults[3]),
    pick(kpi, defaults[4]),
    pick(r3, defaults[5]),
  ];
}

function reportDeadlineIso() {
  const miles = liveTfMilestones();
  return miles[miles.length - 1]?.date || "2026-09-15";
}

function reportDeadlineDate() {
  const iso = reportDeadlineIso();
  const d = new Date(`${iso}T16:00:00+09:00`);
  return Number.isNaN(d.getTime()) ? new Date("2026-09-15T16:00:00+09:00") : d;
}

function formatReportDeadlineWhen(iso = reportDeadlineIso()) {
  const d = parseIsoDate(iso) || reportDeadlineDate();
  if (!d) return "제출일 미정";
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 오후 4시`;
}

function milestoneProgressFromState() {
  ensureBudget();
  ensureKpis();
  const cols = state.collections || [];
  const r1 = cols.find((c) => c.round === 1);
  const r2 = cols.find((c) => c.round === 2);
  const r3 = cols.find((c) => c.round === 3);
  const roundDone = (col) => {
    if (!col?.submissions?.length) return false;
    return col.submissions.every((s) => submissionBoardStatus(s).id === "done");
  };
  const finalDone = roundDone(r3);
  const roundSummary = (col, emptyLabel) => {
    if (!col?.submissions?.length) return emptyLabel;
    const done = col.submissions.filter((s) => submissionBoardStatus(s).id === "done").length;
    return `${col.name || "취합"} · 제출 ${done}/${col.submissions.length}`;
  };
  const mode = getBudgetInputMode();
  const budItems = state.budget?.items || [];
  const budgetDone =
    budItems.length > 0 && budItems.every((i) => !!budgetCalcOf(i, mode));
  const budgetFilled = budItems.filter((i) => !!budgetCalcOf(i, mode)).length;
  const totalBudget = Number(state.budget?.total) || 0;
  const kpis = state.kpis || [];
  const kpiDone =
    kpis.length > 0 &&
    kpis.every((k) => Number(k.target) > 0 && Number(k.actual) >= Number(k.target) * 0.8);
  const kpiHit = kpis.filter((k) => Number(k.target) > 0 && Number(k.actual) >= Number(k.target) * 0.8).length;
  const miles = liveTfMilestones();
  const todayIso = typeof today === "function" ? today() : new Date().toISOString().slice(0, 10);
  return computeMilestoneProgress({
    hasKickoff: true,
    round1Done: roundDone(r1),
    round2Done: roundDone(r2),
    budgetDone,
    kpiDone,
    finalDone,
    todayIso,
    milestones: miles,
    summaries: {
      kickoff: "역할·일정·서식 공유 완료",
      round1: roundSummary(r1, "1차 취합 대기"),
      round2: roundSummary(r2, "2차 취합 대기"),
      budget: `총 ${totalBudget ? `${Math.round(totalBudget / 1e8)}억` : "—"} · 산출근거 ${budgetFilled}/${budItems.length}`,
      kpi: `지표 ${kpiHit}/${kpis.length} 목표 80% 이상`,
      final: finalDone ? "최종 통합 제출 완료" : `최종 제출일 ${formatMileDateSafe(miles[5]?.date)} 오후 4시`,
    },
  });
}

function formatMileDateSafe(iso) {
  if (!iso || String(iso).length < 10) return "—";
  const [, m, d] = String(iso).split("-");
  return `${Number(m)}/${Number(d)}`;
}

function ensureAiBriefs() {
  if (!Array.isArray(state.aiBriefs)) state.aiBriefs = [];
}

function ensureAiArts() {
  if (!Array.isArray(state.aiArts)) state.aiArts = [];
}

/** 윤독 회의용: 목차·할당과 동일한 파트 목록 (+ 맨 끝 종합) */
function reviewPartNavItems() {
  const parts = Array.isArray(state.parts) ? state.parts : [];
  const items = parts.map((p, i) => {
    const m = memberById(p.assigneeId);
    return {
      id: p.id,
      index: i + 1,
      section: p.section || "",
      title: p.title || "",
      label: `${p.section || ""}. ${p.title || ""}`.replace(/^\.\s*/, ""),
      assigneeName: m?.name || "미배정",
      pageLabel: `${p.pageStart ?? "?"}–${p.pageEnd ?? "?"}p`,
      note: p.note || "",
      isPart: true,
    };
  });
  items.push({
    id: "__overall__",
    index: items.length + 1,
    section: "",
    title: "종합 의견 · 후속 일정",
    label: "종합 의견 · 후속 일정",
    assigneeName: "전체",
    pageLabel: "",
    note: "파트별 윤독 후 공통 판정·수정 마감·재취합",
    isPart: false,
  });
  return items;
}

function ensureReviewDocs() {
  if (!Array.isArray(state.reviewDocs)) state.reviewDocs = [];
}

function ensureReviewSession() {
  if (!state.reviewSession || typeof state.reviewSession !== "object") {
    state.reviewSession = {
      title: "전체 취합본 윤독",
      date: today(),
      activePartId: "",
      comments: [],
      notes: "",
    };
  }
  if (!Array.isArray(state.reviewSession.comments)) state.reviewSession.comments = [];
  // 예전 회의흐름(stepId) 코멘트 → partId 없으면 종합으로 이전
  state.reviewSession.comments.forEach((c) => {
    if (!c.partId && c.stepId) c.partId = "__overall__";
  });
  const nav = reviewPartNavItems();
  const validIds = new Set(nav.map((n) => n.id));
  if (!state.reviewSession.activePartId || !validIds.has(state.reviewSession.activePartId)) {
    state.reviewSession.activePartId = nav[0]?.id || "__overall__";
  }
  if (!state.reviewSession.title) state.reviewSession.title = "전체 취합본 윤독";
  if (!state.reviewSession.date) state.reviewSession.date = today();
  if (typeof state.reviewSession.notes !== "string") state.reviewSession.notes = "";
  delete state.reviewSession.agenda;
  delete state.reviewSession.activeStep;
}

function isCollectionFullySubmitted(col) {
  if (!col?.submissions?.length) return false;
  return col.submissions.every((s) => submissionBoardStatus(s).id === "done");
}

function ensureCollectionPhases() {
  (state.collections || []).forEach((col) => {
    if (col.requestPhase === "planned" || col.requestPhase === "open" || col.requestPhase === "closed") return;
    const started = (col.submissions || []).some((s) => submissionBoardStatus(s).id !== "todo");
    if (isCollectionFullySubmitted(col)) col.requestPhase = "closed";
    else if (started) col.requestPhase = "open";
    else col.requestPhase = "planned";
  });
}

function collectionPhaseOf(col) {
  if (!col) return "planned";
  ensureCollectionPhases();
  return col.requestPhase || "planned";
}

function isCollectionRequestOpened(col) {
  const phase = collectionPhaseOf(col);
  return phase === "open" || phase === "closed";
}

function isFinalCollection(col) {
  if (!col) return false;
  const name = String(col.name || "");
  if (/최종/.test(name)) return true;
  const rounds = [...(state.collections || [])].map((c) => Number(c.round) || 0);
  const max = rounds.length ? Math.max(...rounds) : 0;
  return Number(col.round) === max && max > 1;
}

function collectionWaitingMessage(col) {
  if (isFinalCollection(col)) {
    return "아직 관리자가 금번 회차의 최종제출 요청을 하지 않았습니다.";
  }
  const name = col?.name || "이번 차수";
  return `아직 관리자가 ${name} 제출 요청을 하지 않았습니다.`;
}

function previousCollection(col) {
  if (!col) return null;
  const sorted = [...(state.collections || [])].sort((a, b) => (Number(a.round) || 0) - (Number(b.round) || 0));
  const idx = sorted.findIndex((c) => c.round === col.round);
  return idx > 0 ? sorted[idx - 1] : null;
}

function canOpenCollectionRequest(col) {
  const prev = previousCollection(col);
  if (!prev) return { ok: true };
  const prevPhase = collectionPhaseOf(prev);
  if (prevPhase === "closed" || isCollectionFullySubmitted(prev)) return { ok: true };
  return {
    ok: false,
    reason: `${prev.name} 취합이 마감된 뒤에 ${col.name} 제출 요청을 등록할 수 있습니다.`,
  };
}

function collectScheduleRound(s) {
  const explicit = Number(s?.collectionRound);
  if (explicit) return explicit;
  const title = String(s?.title || "");
  if (/1차/.test(title)) return 1;
  if (/2차/.test(title)) return 2;
  if (/최종|3차/.test(title)) {
    const rounds = (state.collections || []).map((c) => Number(c.round) || 0);
    return rounds.length ? Math.max(...rounds) : 3;
  }
  const due = (s?.endDate || s?.date || "").slice(0, 10);
  const hit = (state.collections || []).find((c) => (c.dueDate || "") === due);
  return hit?.round || null;
}

function collectionBySchedule(s) {
  const round = collectScheduleRound(s);
  if (!round) return null;
  return (state.collections || []).find((c) => Number(c.round) === Number(round)) || null;
}

function scheduleForCollectionRound(round) {
  return (state.schedule || []).find(
    (s) => scheduleGroupOf(s) === "collect" && Number(collectScheduleRound(s)) === Number(round)
  );
}

const COLLECT_FLOW_STEPS = [
  { id: "planned", n: 1, label: "일정 수립" },
  { id: "open", n: 2, label: "제출 요청" },
  { id: "upload", n: 3, label: "업로드 취합" },
  { id: "closed", n: 4, label: "마감" },
];

function collectFlowIndex(col) {
  const phase = collectionPhaseOf(col);
  if (phase === "planned") return 0;
  if (phase === "closed") return 3;
  const uploading = (col?.submissions || []).some((s) => submissionBoardStatus(s).id !== "todo");
  return uploading ? 2 : 1;
}

function collectFlowLabel(col) {
  return COLLECT_FLOW_STEPS[collectFlowIndex(col)]?.label || "일정 수립";
}

function collectStepperHtml(col, { compact = false } = {}) {
  if (!col) return "";
  const idx = collectFlowIndex(col);
  return `
    <ol class="collect-stepper ${compact ? "is-compact" : ""}" aria-label="${escapeAttr(col.name)} 취합 절차">
      ${COLLECT_FLOW_STEPS.map((st, i) => {
        const stateCls = i < idx ? "is-done" : i === idx ? "is-now" : "is-todo";
        return `<li class="${stateCls}"><em>${st.n}</em><span>${escapeHtml(st.label)}</span></li>`;
      }).join("")}
    </ol>`;
}

function collectPipelineHtml() {
  ensureCollectionPhases();
  const rounds = [...(state.collections || [])].sort((a, b) => (Number(a.round) || 0) - (Number(b.round) || 0));
  if (!rounds.length) return "";
  return `
    <div class="collect-pipeline" aria-label="취합 차수 진행">
      ${rounds
        .map((col, i) => {
          const idx = collectFlowIndex(col);
          const phase = collectionPhaseOf(col);
          return `
          <div class="collect-pipeline-item is-${escapeAttr(phase)}">
            <strong>${escapeHtml(col.name)}</strong>
            <span>${escapeHtml(COLLECT_FLOW_STEPS[idx].label)}</span>
          </div>
          ${i < rounds.length - 1 ? `<span class="collect-pipeline-arrow" aria-hidden="true">→</span>` : ""}`;
        })
        .join("")}
    </div>
    <p class="collect-pipeline-note muted">전체 일정표는 마감일을 수립하는 단계입니다. 참여자 업로드는 관리자가 해당 차수 <strong>제출 요청</strong>을 등록한 뒤에만 열립니다.</p>`;
}

function openCollectionRequestModal(round) {
  if (!isAdmin()) return;
  const col = (state.collections || []).find((c) => Number(c.round) === Number(round));
  if (!col) return;
  const gate = canOpenCollectionRequest(col);
  if (!gate.ok) {
    alert(gate.reason);
    return;
  }
  const linked = scheduleForCollectionRound(round);
  const defaultAsk =
    (linked?.askMessage || "").trim() ||
    (Number(round) === 1
      ? "관리자가 할당받은 보고서의 페이지를 작성하여 1차 업로드를 요청했어요!"
      : Number(round) === 2
        ? "관리자가 보완·수정한 원고를 2차 업로드하도록 요청했어요!"
        : "관리자가 최종 통합본 확인 및 보고서 제출을 요청했어요!");
  openModal({
    kicker: "취합 공지",
    title: `${col.name} 공지를 올립니다.`,
    submitLabel: "공지 올리기",
    bodyHtml: `
      <p class="schedule-comment-lead">담당자는 <strong>내업무</strong>에서 한글 파일을 올립니다. 영역·분량은 이미 할당되어 있어 제출하면 취합 현황이 자동으로 집계됩니다.</p>
      <label class="wp-field" style="margin-top:12px">
        <span class="wp-label">담당자에게 보이는 요청 말풍선</span>
        <textarea name="askMessage" rows="3" class="wp-input">${escapeHtml(defaultAsk)}</textarea>
      </label>
    `,
    onSubmit: (fd) => {
      const ask = (fd.get("askMessage") || "").toString().trim() || defaultAsk;
      col.requestPhase = "open";
      col.requestOpenedAt = new Date().toISOString();
      col.requestOpenedBy = sessionUser || "";
      col.requestMessage = ask;
      if (linked) {
        linked.askMessage = ask;
        if ((linked.status || "준비") === "준비") linked.status = "진행";
        linked.collectionRound = col.round;
      }
      persist();
      activeRound = col.round;
      if (activeViewName === "collections") renderCollections();
      else refreshActiveScheduleSurface();
      return true;
    },
  });
}

function closeCollectionRequest(round) {
  if (!isAdmin()) return;
  const col = (state.collections || []).find((c) => Number(c.round) === Number(round));
  if (!col) return;
  if (!confirm(`${col.name} 취합을 마감할까요? 마감 후 참여자는 파일을 올릴 수 없고, 다음 차수 제출 요청을 등록할 수 있습니다.`)) {
    return;
  }
  col.requestPhase = "closed";
  col.requestClosedAt = new Date().toISOString();
  col.requestClosedBy = sessionUser || "";
  const linked = scheduleForCollectionRound(round);
  if (linked) linked.status = "완료";
  persist();
  if (activeViewName === "collections") renderCollections();
  else refreshActiveScheduleSurface();
}

function partReviewComments(partId, round = activeRound) {
  ensureReviewSession();
  const r = Number(round);
  return (state.reviewSession.comments || []).filter(
    (c) => c.partId === partId && (c.round == null || Number(c.round) === r)
  );
}

function reviewRatingLabel(rating) {
  if (rating === "need") return "보완 필요";
  if (rating === "hold") return "보류";
  return "양호";
}

async function compressReviewPhoto(file, maxBytes = 680 * 1024) {
  if (!file?.type?.startsWith("image/")) throw new Error("사진(PNG·JPG)만 첨부할 수 있습니다.");
  const dataUrl = await readFileAsDataUrl(file);
  if (dataUrl.length <= maxBytes * 1.37) {
    return { dataUrl, name: file.name || "photo.jpg" };
  }
  const img = await new Promise((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("사진을 읽지 못했습니다."));
    el.src = dataUrl;
  });
  const canvas = document.createElement("canvas");
  const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
  let quality = 0.88;
  let out = canvas.toDataURL("image/jpeg", quality);
  while (out.length > maxBytes * 1.37 && quality > 0.45) {
    quality -= 0.08;
    out = canvas.toDataURL("image/jpeg", quality);
  }
  return { dataUrl: out, name: (file.name || "photo.jpg").replace(/\.\w+$/, ".jpg") };
}

function renderReviewCommentCardHtml(c, { admin = false, largePhoto = false } = {}) {
  const hasPhoto = Boolean(c.photoDataUrl);
  const photoLarge = largePhoto || hasPhoto;
  return `
    <article class="review-comment-card rating-${escapeAttr(c.rating || "good")} ${hasPhoto ? "has-photo" : ""} ${photoLarge ? "photo-emphasis" : ""}">
      <header>
        <span class="review-rating-badge">${escapeHtml(reviewRatingLabel(c.rating))}</span>
        <span class="muted">${escapeHtml(c.by || "")} · ${escapeHtml((c.createdAt || "").slice(0, 16).replace("T", " "))}</span>
        ${admin ? `<button type="button" class="btn btn-sm btn-danger" data-del-comment="${escapeAttr(c.id)}">삭제</button>` : ""}
      </header>
      <p>${escapeHtml(c.text || "")}</p>
      ${
        hasPhoto
          ? `<figure class="review-comment-photo ${photoLarge ? "is-large" : ""}">
              <img src="${escapeAttr(c.photoDataUrl)}" alt="${escapeAttr(c.photoName || "회의 첨부")}" loading="lazy" />
              <figcaption class="muted">${escapeHtml(c.photoCaption || "회의·현장 참고 사진 · 해당 영역 그림은 크게 반영")}</figcaption>
            </figure>`
          : ""
      }
    </article>`;
}

function bindReviewCommentDeletes(root) {
  root?.querySelectorAll("[data-del-comment]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!isAdmin()) return;
      if (!confirm("이 코멘트를 삭제할까요?")) return;
      ensureReviewSession();
      state.reviewSession.comments = state.reviewSession.comments.filter((c) => c.id !== btn.dataset.delComment);
      persist();
      renderCollections();
      renderReview();
    });
  });
}

async function addReviewCommentEntry({ partId, round, text, rating, photoFile, photoCaption }) {
  ensureReviewSession();
  let photoDataUrl = "";
  let photoName = "";
  if (photoFile && photoFile.size > 0) {
    const compressed = await compressReviewPhoto(photoFile);
    photoDataUrl = compressed.dataUrl;
    photoName = compressed.name;
  }
  state.reviewSession.comments.unshift({
    id: uid("rc"),
    partId,
    round: Number(round) || activeRound,
    text,
    rating: rating || "good",
    by: sessionUser || "",
    createdAt: new Date().toISOString(),
    photoDataUrl,
    photoName,
    photoCaption: photoCaption || (photoDataUrl ? "회의·현장 참고 사진 · 해당 영역 그림은 크게 반영" : ""),
  });
  state.reviewSession.comments = state.reviewSession.comments.slice(0, 200);
  persist();
}

function openPartReviewCommentModal(partId, round = activeRound) {
  const col = state.collections.find((c) => c.round === round);
  if (!col || !isCollectionFullySubmitted(col)) {
    alert("전 파트 제출이 완료된 후 리뷰회의 코멘트를 남길 수 있습니다.");
    return;
  }
  const part = partById(partId);
  const assignee = part ? memberById(part.assigneeId) : null;
  const comments = partReviewComments(partId, round);
  const admin = isAdmin();
  const isMine = myPartIds().includes(partId);

  openModal({
    kicker: "리뷰회의 정리",
    title: part ? `${part.section}. ${part.title}` : partId,
    submitLabel: admin ? "코멘트 등록" : "닫기",
    hideFooter: !admin,
    bodyHtml: `
      <p class="schedule-comment-lead">
        ${escapeHtml(col.name)} 제출 완료 · 담당 <strong>${escapeHtml(assignee?.name || "-")}</strong>
        ${isMine ? " · 내 담당 파트" : ""}
      </p>
      <p class="muted" style="margin-top:-6px;font-size:var(--text-sm)">
        회의에서 논의된 정리사항을 코멘트로 남깁니다. 모바일에서 사진을 찍어 첨부하면 해당 영역 그림을 <strong>더 크게</strong> 넣기로 한 내용도 함께 기록할 수 있습니다.
      </p>
      ${
        admin
          ? `<div class="review-comment-form modal-review-form">
            <label class="field full">정리 코멘트
              <textarea id="partReviewCommentText" rows="4" placeholder="예: IV. 성과분석 — KPI 표를 1페이지 확대, ICC 매트릭스는 회의 사진 참고하여 그림 비중 확대"></textarea>
            </label>
            <label class="field">판정
              <select id="partReviewCommentRating">
                <option value="good">양호</option>
                <option value="need">보완 필요</option>
                <option value="hold">보류·추가논의</option>
              </select>
            </label>
            <label class="field full">사진 첨부 (모바일 촬영)
              <input type="file" id="partReviewCommentPhoto" accept="image/*" capture="environment" />
              <span class="muted" style="display:block;margin-top:4px">화이트보드·인쇄본·PPT 화면 등 — 첨부 시 아래에 크게 표시됩니다.</span>
            </label>
            <label class="field full">사진·그림 관련 메모 (선택)
              <input id="partReviewCommentPhotoCaption" placeholder="예: 이 부분 그림을 더 크게 넣기로 함" />
            </label>
          </div>`
          : ""
      }
      <div class="review-comment-list review-comment-list-modal">
        ${
          comments.length
            ? comments.map((c) => renderReviewCommentCardHtml(c, { admin, largePhoto: true })).join("")
            : `<div class="empty">아직 리뷰회의 코멘트가 없습니다.${admin ? " 위에서 첫 코멘트를 등록해 주세요." : ""}</div>`
        }
      </div>
    `,
    onSubmit: admin
      ? async (fd) => {
          const text = ($("#partReviewCommentText")?.value || fd.get("text") || "").trim();
          const photoFile = $("#partReviewCommentPhoto")?.files?.[0];
          if (!text && !(photoFile && photoFile.size)) {
            alert("코멘트 또는 사진 중 하나는 입력해 주세요.");
            return false;
          }
          await addReviewCommentEntry({
            partId,
            round,
            text: text || "(사진 첨부)",
            rating: $("#partReviewCommentRating")?.value || "good",
            photoFile,
            photoCaption: ($("#partReviewCommentPhotoCaption")?.value || "").trim(),
          });
          closeModal();
          renderCollections();
          return true;
        }
      : null,
  });

  bindReviewCommentDeletes($("#modalBody"));
}

function navGroupOf(viewName, preferredNav = activeNavId) {
  const hits = Object.entries(NAV_GROUPS)
    .filter(([, g]) => (g.views || []).includes(viewName))
    .map(([id]) => id);
  if (preferredNav && hits.includes(preferredNav)) return preferredNav;
  if (hits.length) return hits[0];
  return VIEW_TO_NAV[viewName] || "home";
}

function resolveViewName(name) {
  if (!name) return "dashboard";
  if (name === "ai-brief") return "collections";
  // 제거된 하위메뉴 → 통합 화면으로 흡수
  if (name === "tf-all") return "collections";
  if (name === "schedule" && !isAdmin()) return "ai-art";
  if (name === "review") return "collections";
  if (name === "resources") return "collections";
  // 그룹 id로 들어오면 기본(또는 마지막) 뷰로
  if (NAV_GROUPS[name]) {
    const g = NAV_GROUPS[name];
    if (name === "setup") return g.defaultView || "schedule";
    const remembered = lastViewByNav[name];
    if (
      remembered &&
      g.views.includes(remembered) &&
      !(g.hideTabs || []).includes(remembered)
    ) {
      return remembered;
    }
    return g.defaultView;
  }
  return name;
}

function renderSubNav(navId, viewName) {
  const bar = $("#subNav");
  if (!bar) return;
  const group = NAV_GROUPS[navId];
  if (!group || group.views.length <= 1) {
    bar.hidden = true;
    bar.classList.remove("has-area-tabs");
    bar.innerHTML = "";
    return;
  }
  const adminOnlyViews = new Set(group.adminViews || []);
  const hiddenTabs = new Set(group.hideTabs || []);
  const views = group.views.filter(
    (v) => !hiddenTabs.has(v) && (!adminOnlyViews.has(v) || isAdmin())
  );
  if (views.length <= 1) {
    bar.hidden = true;
    bar.classList.remove("has-area-tabs");
    bar.innerHTML = "";
    return;
  }
  bar.hidden = false;
  bar.classList.add("has-area-tabs");
  bar.innerHTML = views
    .map((v) => {
      const label = navLabelForView(v, group);
      const on = v === viewName;
      const area =
        v === "collections"
          ? "area-report"
          : v === "my-work"
            ? "area-request"
          : v === "budget" || v === "kpi" || v === "ai-art" || v === "food"
            ? `area-${v}`
            : navId === "setup"
              ? "area-setup"
              : "";
      return `<button type="button" class="sub-tab-btn ${on ? "active" : ""} ${area}" data-view="${escapeAttr(v)}" aria-pressed="${on ? "true" : "false"}">${escapeHtml(label)}</button>`;
    })
    .join("");
  bar.querySelectorAll("[data-view]").forEach((btn) => {
    btn.addEventListener("click", () => setView(btn.dataset.view));
  });
}

function setView(name) {
  const groupHint = NAV_GROUPS[name] ? name : activeNavId;
  let viewName = resolveViewName(name);
  if (!isAdmin() && (viewName === "parts" || viewName === "members" || viewName === "schedule")) {
    viewName = "dashboard";
  }
  let navId = navGroupOf(viewName, groupHint);
  const groupProbe = NAV_GROUPS[navId];
  if (groupProbe?.adminViews?.includes(viewName) && !isAdmin()) {
    viewName = groupProbe.defaultView || "dashboard";
    navId = navGroupOf(viewName, groupHint);
  }
  if (!isAdmin() && navGroupOf(viewName, groupHint) === "setup") {
    viewName = "dashboard";
  }
  navId = navGroupOf(viewName, groupHint);
  if (NAV_GROUPS[navId]?.adminOnly && !isAdmin()) {
    viewName = "dashboard";
    navId = "home";
  }
  const resolvedNav = navGroupOf(viewName, groupHint);
  activeNavId = resolvedNav;
  activeViewName = viewName;
  lastViewByNav[resolvedNav] = viewName;

  $$("#mainNav .tab-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.nav === resolvedNav);
  });
  renderSubNav(resolvedNav, viewName);
  $$(".view").forEach((el) => el.classList.toggle("active", el.id === `view-${viewName}`));

  const group = NAV_GROUPS[resolvedNav];
  const meta = VIEW_META[viewName] || { title: viewName, desc: "" };
  const tabLabel = navLabelForView(viewName, group);
  const showGroupTitle = group && group.views.filter((v) => !(group.hideTabs || []).includes(v)).length > 1;
  const title = showGroupTitle ? `${group.label} · ${tabLabel}` : tabLabel || group?.label || viewName;
  let desc = meta.desc;
  if (viewName === "collections") {
    desc = isAdmin()
      ? "취합 현황을 보고, 리뷰를 남기고, 한글 파일을 목차 순서로 묶습니다."
      : "담당 영역은 내업무에서 올리고, 여기서 현황과 리뷰를 확인합니다.";
  }
  if (viewName === "dashboard") {
    desc = "지금 열린 단계만, 내 파트만 하면 됩니다.";
  }
  if (viewName === "ai-art") {
    desc = "영역 · 레이아웃 · 내용만 정하면 됩니다.";
  }
  if (viewName === "food") {
    desc = "메뉴를 고르고 투표·공지합니다.";
  }
  if (viewName === "guide") {
    desc = "칸을 누르면 해당 화면으로 바로 이동합니다.";
  }
  if (viewName === "schedule") {
    desc = "마감 순 타임라인에서 일정을 작성합니다. 요청업무 등록 시 날짜와 내용이 이 기준으로 채워집니다.";
  }
  if (viewName === "drive") {
    desc = "지침·서식·스타일가이드를 올리고, 할 일에 연결 문서로 붙입니다.";
  }
  if (viewName === "budget") {
    const modeMeta = budgetModeMeta();
    if (canManageBudget()) {
      desc = "제출된 예산을 영역 칸으로 끌어 구성합니다.";
    } else {
      desc = `${modeMeta.amountLabel}·${modeMeta.calcLabel}을 입력한 뒤 제출합니다.`;
    }
  }
  if (viewName === "kpi") {
    desc = canManageKpi()
      ? "제출된 성과지표를 영역 칸으로 끌어 구성합니다."
      : "성과지표를 입력한 뒤 제출합니다.";
  }
  if (viewName === "my-work") {
    desc = isAdmin() ? "Setting에서 등록한 업무입니다." : "관리자가 등록한 업무입니다.";
  }
  $("#viewTitle").textContent = title;
  $("#viewDesc").textContent = desc;
  const hero = $("#pageHero");
  if (hero) {
    hero.hidden = true;
    hero.classList.add("is-merged-away");
  }
  const processHost = $("#pageHeroProcess");
  if (processHost) processHost.innerHTML = "";
  const remindHost = $("#pageHeroRemind");
  if (remindHost) remindHost.innerHTML = "";
  document.body.classList.toggle("view-home", viewName === "dashboard");
  $("#userRoleBadge")?.classList.toggle("is-on", resolvedNav === "setup");
  renderView(viewName);
}

function currentUserName() {
  return sessionUser || state.meta.adminName || "사용자";
}

function applyRoleUi() {
  const admin = isAdmin();
  const budgetMgr = isBudgetManager();
  const kpiMgr = isKpiManager();
  const foodMgr = isFoodManager();
  document.body.classList.toggle("is-admin", admin);
  document.body.classList.toggle("is-budget", budgetMgr);
  document.body.classList.toggle("is-kpi", kpiMgr);
  document.body.classList.toggle("is-food", foodMgr);
  document.body.classList.toggle("is-member", !admin && !budgetMgr && !kpiMgr && !foodMgr);
  const badge = $("#userRoleBadge");
  const label = $("#userNameLabel");
  if (badge) {
    badge.hidden = !admin;
    badge.textContent = "관리";
    badge.classList.toggle("is-admin", admin);
    badge.classList.toggle("is-budget", false);
    badge.classList.toggle("is-food", false);
  }
  if (label) label.textContent = sessionUser || "";
}

function weatherKindFromCode(code) {
  const n = Number(code);
  if ([71, 73, 75, 77, 85, 86].includes(n)) return "snow";
  if (
    [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(n)
  ) {
    return "rain";
  }
  return "sun";
}

async function applyLoginWeather() {
  const gate = $("#loginGate");
  if (!gate) return;
  const badge = $("#loginWeatherBadge");
  const setKind = (kind, note = "") => {
    gate.classList.remove("weather-sun", "weather-rain", "weather-snow");
    gate.classList.add(`weather-${kind}`);
    gate.dataset.weather = kind;
    const labels = { sun: "맑음", rain: "비", snow: "눈" };
    const icons = { sun: "☀", rain: "🌧", snow: "❄" };
    const label = labels[kind] || kind;
    gate.title = `로그인 배경 · 현재 날씨: ${label}`;
    if (badge) {
      const iconEl = badge.querySelector(".wx-badge-icon");
      const textEl = badge.querySelector(".wx-badge-text");
      const text = `${label}${note ? ` · ${note}` : " · 안양"}`;
      if (iconEl && textEl) {
        iconEl.textContent = icons[kind] || "☁";
        textEl.textContent = text;
      } else {
        badge.textContent = `${icons[kind] || "☁"} ${text}`;
      }
    }
  };
  try {
    // 안양 인근 (Open-Meteo, API 키 불필요)
    const url =
      "https://api.open-meteo.com/v1/forecast?latitude=37.3943&longitude=126.9568&current=weather_code&timezone=Asia%2FSeoul";
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("weather fetch failed");
    const data = await res.json();
    setKind(weatherKindFromCode(data?.current?.weather_code));
  } catch {
    // 네트워크 실패 시 계절 추정
    const month = new Date().getMonth() + 1;
    if (month === 12 || month <= 2) setKind("snow", "추정");
    else if (month >= 6 && month <= 9) setKind("rain", "추정");
    else setKind("sun", "추정");
  }
}

function downloadSrsDocument() {
  const fileName = `TF-Pulse_SRS_v1.0_${today()}.md`;
  const tryUrls = ["docs/SRS-TF-Pulse.md", "SRS-TF-Pulse.md"];
  const saveBlob = (text) => {
    const blob = new Blob(["\uFEFF" + text], { type: "text/markdown;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const fetchNext = (i) => {
    if (i >= tryUrls.length) {
      alert("SRS 문서를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }
    fetch(tryUrls[i], { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error("missing");
        return r.text();
      })
      .then((text) => saveBlob(text))
      .catch(() => fetchNext(i + 1));
  };
  fetchNext(0);
}

function showLoginGate() {
  $("#loginGate").hidden = false;
  $("#appShell").hidden = true;
  applyLoginWeather();
  ensureTfTopics();

  const topicSel = $("#loginTfTopic");
  const topicDesc = $("#loginTfTopicDesc");
  const savedTopic = localStorage.getItem(TF_TOPIC_KEY);
  if (savedTopic && state.tfTopics.some((t) => t.id === savedTopic)) {
    state.activeTfTopicId = savedTopic;
  }
  if (topicSel) {
    topicSel.innerHTML = state.tfTopics
      .map(
        (t) =>
          `<option value="${escapeAttr(t.id)}" ${t.id === state.activeTfTopicId ? "selected" : ""}>${escapeHtml(t.name)}</option>`
      )
      .join("");
    topicSel.onchange = () => {
      state.activeTfTopicId = topicSel.value;
      localStorage.setItem(TF_TOPIC_KEY, topicSel.value);
      renderLoginMembers();
      if (topicDesc) {
        const desc = activeTfTopic()?.desc || "";
        topicDesc.textContent = desc;
        topicDesc.hidden = !desc;
      }
    };
  }
  if (topicDesc) {
    const desc = activeTfTopic()?.desc || "";
    topicDesc.textContent = desc;
    topicDesc.hidden = !desc;
  }
  renderLoginMembers();
  updateReportDeadline();
  if (!deadlineTimer) {
    deadlineTimer = window.setInterval(updateReportDeadline, 30000);
  }
}

function renderLoginMembers() {
  const list = $("#loginMemberList");
  if (!list) return;
  const members = membersForActiveTopic();
  list.innerHTML = members.length
    ? members
        .map(
          (m) => `
      <button type="button" class="member-btn ${m.role === "admin" ? "is-admin" : ""} ${m.role === "budget" ? "is-budget" : ""} ${m.role === "kpi" ? "is-kpi" : ""} ${m.role === "food" ? "is-food" : ""}" data-login="${escapeAttr(m.name)}">
        <span class="member-name">${escapeHtml(m.name)}</span>
        <span class="role">${roleLabel(m.role)}</span>
      </button>`
        )
        .join("")
    : `<p class="empty">이 TF주제에 등록된 참가자가 없습니다.</p>`;
  list.querySelectorAll("[data-login]").forEach((btn) => {
    btn.addEventListener("click", () => enterAs(btn.dataset.login));
  });
}

function enterAs(name) {
  const member = memberByName(name);
  if (!member) return;
  sessionUser = name;
  localStorage.setItem(USER_KEY, name);
  $("#loginGate").hidden = true;
  $("#appShell").hidden = false;
  applyRoleUi();
  renderAll();
  setView("dashboard");
  window.setTimeout(() => {
    openUnifiedAlarmPopup({ mode: "unified", browseAll: false });
  }, 280);
}

function logout() {
  sessionUser = null;
  localStorage.removeItem(USER_KEY);
  updateAlarmButtons();
  showLoginGate();
}

function fillUserSelect() {
  /* legacy no-op — 이름 선택은 로그인 게이트에서 처리 */
}

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttr(str = "") {
  return escapeHtml(str)
    .replaceAll("'", "&#39;")
    .replaceAll("\n", "&#10;")
    .replaceAll("\r", "");
}

function monthLabel(year, month) {
  return `${year}년 ${month + 1}월`;
}

function eventsOnDate(isoDate) {
  return state.schedule.filter((s) => {
    const start = s.date;
    const end = s.endDate || s.date;
    return isoDate >= start && isoDate <= end;
  });
}

const HEAT_RANGE_STEPS = ["week", "fortnight", "month", "twoMonth", "threeMonth"];
const HEAT_RANGE_META = {
  week: { label: "1주", hint: "이번 주 집중", months: 0 },
  fortnight: { label: "2주", hint: "가까운 2주", months: 0 },
  month: { label: "1개월", hint: "한 달 로드", months: 1 },
  twoMonth: { label: "2개월", hint: "중기 전망", months: 2 },
  threeMonth: { label: "3개월", hint: "분기 전망", months: 3 },
};
const HEAT_DOW = ["월", "화", "수", "목", "금", "토", "일"];

function parseIsoDate(iso) {
  const [y, m, d] = String(iso || "")
    .slice(0, 10)
    .split("-")
    .map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function toIsoDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function startOfWeekMon(d) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const pad = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - pad);
  return x;
}

function addDaysDate(d, n) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() + n);
  return x;
}

function addMonthsDate(d, n) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function eachDayInclusive(start, end) {
  const out = [];
  let cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  while (cur <= last) {
    out.push(new Date(cur));
    cur = addDaysDate(cur, 1);
  }
  return out;
}

function getHeatVisibleRange(mode, cursor) {
  if (mode === "week") {
    const start = startOfWeekMon(cursor);
    return { start, end: addDaysDate(start, 6) };
  }
  if (mode === "fortnight") {
    const start = startOfWeekMon(cursor);
    return { start, end: addDaysDate(start, 13) };
  }
  const months = HEAT_RANGE_META[mode]?.months || 1;
  const start = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const endMonth = addMonthsDate(start, months - 1);
  const end = new Date(endMonth.getFullYear(), endMonth.getMonth() + 1, 0);
  return { start, end };
}

function heatRangeCaption(mode, cursor) {
  const { start, end } = getHeatVisibleRange(mode, cursor);
  if (mode === "week" || mode === "fortnight") {
    return `${start.getMonth() + 1}.${start.getDate()} – ${end.getMonth() + 1}.${end.getDate()}`;
  }
  if (mode === "month") return monthLabel(cursor.getFullYear(), cursor.getMonth());
  const endMonth = addMonthsDate(new Date(cursor.getFullYear(), cursor.getMonth(), 1), (HEAT_RANGE_META[mode]?.months || 1) - 1);
  return `${cursor.getFullYear()}.${cursor.getMonth() + 1} – ${endMonth.getFullYear()}.${endMonth.getMonth() + 1}`;
}

function isInHeatFocusMonths(day, mode, cursor) {
  if (mode === "week" || mode === "fortnight") return true;
  const months = HEAT_RANGE_META[mode]?.months || 1;
  for (let i = 0; i < months; i++) {
    const m = addMonthsDate(new Date(cursor.getFullYear(), cursor.getMonth(), 1), i);
    if (day.getFullYear() === m.getFullYear() && day.getMonth() === m.getMonth()) return true;
  }
  return false;
}

function dayHeatBand(dayTasks) {
  const open = (dayTasks || []).filter((s) => (s.status || "") !== "완료");
  if (!open.length) return "none";
  if (open.length >= 3) return "urgent";
  const urgencies = open.map((s) => scheduleUrgency(s));
  if (urgencies.includes("urgent")) return "urgent";
  if (urgencies.includes("warn")) return "warn";
  if (urgencies.includes("check")) return "check";
  return "gray";
}

function heatBandStyle(band) {
  switch (band) {
    case "urgent":
      return "background:rgba(255,59,48,.22);border-color:rgba(255,59,48,.45);color:#8b1a14";
    case "warn":
      return "background:rgba(255,204,0,.28);border-color:rgba(200,150,0,.4);color:#7a5a00";
    case "check":
      return "background:rgba(52,199,89,.2);border-color:rgba(40,160,70,.4);color:#1d6b35";
    case "gray":
      return "background:rgba(142,142,147,.16);border-color:rgba(120,120,128,.28)";
    default:
      return "background:var(--bg-elevated,#fff);border-color:transparent";
  }
}

function heatBandRank(band) {
  return { urgent: 4, warn: 3, check: 2, gray: 1, none: 0 }[band] || 0;
}

function eventsEndingOnDate(isoDate) {
  return state.schedule.filter((s) => (s.endDate || s.date) === isoDate);
}

function matchCollectionRoundFromText(text) {
  const m = String(text || "").match(/([123])\s*차/);
  if (m) return Number(m[1]);
  if (/취합|제출|업로드|드라이브/.test(String(text || ""))) {
    return latestCollection()?.round || null;
  }
  return null;
}

function collectionForDayContext(schedules) {
  const rounds = schedules
    .map((s) => matchCollectionRoundFromText(`${s.title || ""} ${s.note || ""}`))
    .filter((n) => n != null);
  const round = rounds[0];
  if (round == null) return null;
  const col = state.collections?.find((c) => c.round === round) || latestCollection();
  if (!col) return null;
  return { col, rows: buildTeamCollectionBoard(col) };
}

function requestGroupsDueOn(isoDate) {
  ensureRequests();
  const due = (state.requests || []).filter((r) => (r.dueDate || "") === isoDate);
  if (!due.length) return [];
  const map = new Map();
  due.forEach((r) => {
    const key = r.groupId || r.id;
    if (!map.has(key)) {
      map.set(key, { title: r.title || "요청", rows: [] });
    }
    map.get(key).rows.push(r);
  });
  return [...map.values()];
}

function dayDeadlineContext(isoDate) {
  const due = eventsEndingOnDate(isoDate).filter((s) => (s.status || "") !== "완료");
  const ongoing = eventsOnDate(isoDate).filter((s) => (s.status || "") !== "완료");
  const schedules = due.length ? due : ongoing;
  const collection = collectionForDayContext(schedules);
  const requestGroups = requestGroupsDueOn(isoDate);
  return { iso: isoDate, schedules, collection, requestGroups };
}

function dayDeadlineDetailTarget(ctx) {
  if (ctx.collection?.col) {
    return { view: "collections", round: ctx.collection.col.round };
  }
  if (ctx.requestGroups.length) return { view: "requests" };
  if (ctx.schedules.length) {
    return { view: "schedule", scheduleId: ctx.schedules[0].id };
  }
  return { view: "schedule" };
}

function openDayDeadlineDetail(isoDate) {
  const ctx = dayDeadlineContext(isoDate);
  state._calSelected = isoDate;
  if (isoDate) state._calCursor = `${isoDate.slice(0, 7)}-01`;
  const target = dayDeadlineDetailTarget(ctx);
  if (target.round != null) activeRound = target.round;
  if (target.view === "schedule" && target.scheduleId) {
    if (isAdmin()) {
      setView("schedule");
      queueMicrotask(() => openScheduleModal(target.scheduleId));
    } else {
      setView("my-work");
    }
    return;
  }
  setView(target.view);
}

function heatDayTipHtml(ctx) {
  const { iso, schedules, collection, requestGroups } = ctx;
  if (!schedules.length && !collection && !requestGroups.length) {
    return `<p class="heat-tip-empty">${escapeHtml(formatKorDate(iso))} · 등록된 마감 없음</p>`;
  }

  const scheduleBlock = schedules.length
    ? `<div class="heat-tip-block">
        <p class="heat-tip-label">마감까지 할 일</p>
        <ul class="heat-tip-list">
          ${schedules
            .map((s) => {
              const due = s.endDate || s.date;
              const days = daysUntil(due);
              return `<li>
                <strong>${escapeHtml(s.title || "일정")}</strong>
                <span>${escapeHtml(typeLabel(s.type))} · ${escapeHtml(scheduleStatusLabel(s.status))} · ${escapeHtml(timingLabel(days))}</span>
                ${s.note ? `<em>${escapeHtml(s.note)}</em>` : ""}
              </li>`;
            })
            .join("")}
        </ul>
      </div>`
    : "";

  const collectionBlock = collection
    ? (() => {
        const rows = collection.rows || [];
        const done = rows.filter((r) => r.status.id === "done");
        const pending = rows.filter((r) => r.status.id !== "done");
        return `<div class="heat-tip-block">
          <p class="heat-tip-label">${escapeHtml(collection.col.name || `${collection.col.round}차 취합`)} · 제출 ${done.length}/${rows.length}</p>
          ${
            done.length
              ? `<p class="heat-tip-people is-done"><span>완료</span>${done.map((r) => escapeHtml(r.assignee)).join(", ")}</p>`
              : `<p class="heat-tip-people is-done"><span>완료</span>없음</p>`
          }
          ${
            pending.length
              ? `<p class="heat-tip-people is-wait"><span>미제출</span>${pending
                  .map((r) => `${escapeHtml(r.assignee)}(${escapeHtml(r.status.label)})`)
                  .join(", ")}</p>`
              : ""
          }
        </div>`;
      })()
    : "";

  const requestBlock = requestGroups.length
    ? `<div class="heat-tip-block">
        <p class="heat-tip-label">요청 마감</p>
        ${requestGroups
          .map((g) => {
            const done = g.rows.filter((r) => r.status === "완료");
            const open = g.rows.filter((r) => r.status !== "완료");
            return `<div class="heat-tip-req">
              <strong>${escapeHtml(g.title)}</strong>
              <span>완료 ${done.length}/${g.rows.length}</span>
              ${
                done.length
                  ? `<p class="heat-tip-people is-done"><span>완료</span>${done.map((r) => escapeHtml(r.recipient || "?")).join(", ")}</p>`
                  : ""
              }
              ${
                open.length
                  ? `<p class="heat-tip-people is-wait"><span>미완료</span>${open.map((r) => escapeHtml(r.recipient || "?")).join(", ")}</p>`
                  : ""
              }
            </div>`;
          })
          .join("")}
      </div>`
    : "";

  return `
    <div class="heat-tip-head">
      <strong>${escapeHtml(formatKorDate(iso))}</strong>
      <span>클릭하면 아래 일정</span>
    </div>
    ${scheduleBlock}
    ${collectionBlock}
    ${requestBlock}`;
}

function ensureHeatDayTip() {
  let tip = $("#heatDayTip");
  if (tip) return tip;
  tip = document.createElement("div");
  tip.id = "heatDayTip";
  tip.className = "heat-day-tip";
  tip.hidden = true;
  tip.setAttribute("role", "tooltip");
  document.body.appendChild(tip);
  tip.addEventListener("mouseenter", () => {
    tip.dataset.sticky = "1";
  });
  tip.addEventListener("mouseleave", () => {
    tip.dataset.sticky = "";
    hideHeatDayTip(true);
  });
  tip.addEventListener("click", () => {
    const iso = tip.dataset.iso;
    if (!iso) return;
    hideHeatDayTip(true);
    if (activeViewName === "dashboard") {
      state._calSelected = iso;
      if (iso) state._calCursor = `${iso.slice(0, 7)}-01`;
      renderDashboard();
      return;
    }
    openDayDeadlineDetail(iso);
  });
  if (!window.__heatTipChromeBound) {
    window.__heatTipChromeBound = true;
    window.addEventListener("scroll", () => hideHeatDayTip(true), true);
    window.addEventListener("resize", () => hideHeatDayTip(true));
  }
  return tip;
}

function hideHeatDayTip(force = false) {
  const tip = $("#heatDayTip");
  if (!tip) return;
  if (!force && tip.dataset.sticky === "1") return;
  tip.dataset.sticky = "";
  tip.hidden = true;
  tip.dataset.iso = "";
}

function showHeatDayTip(cell, iso) {
  const ctx = dayDeadlineContext(iso);
  if (!ctx.schedules.length && !ctx.collection && !ctx.requestGroups.length) {
    hideHeatDayTip(true);
    return;
  }
  const tip = ensureHeatDayTip();
  tip.dataset.sticky = "";
  tip.dataset.iso = iso;
  tip.innerHTML = heatDayTipHtml(ctx);
  tip.hidden = false;

  const rect = cell.getBoundingClientRect();
  const tipW = Math.min(320, window.innerWidth - 16);
  tip.style.width = `${tipW}px`;
  tip.style.left = "0px";
  tip.style.top = "0px";
  const tw = tip.offsetWidth || tipW;
  const th = tip.offsetHeight || 120;
  let left = rect.left + rect.width / 2 - tw / 2;
  left = Math.max(8, Math.min(left, window.innerWidth - tw - 8));
  let top = rect.bottom + 8;
  if (top + th > window.innerHeight - 8) {
    top = Math.max(8, rect.top - th - 8);
  }
  tip.style.left = `${left}px`;
  tip.style.top = `${top}px`;
}

function bindHeatDayInteractions(root, { onEmptyClick, onDayClick } = {}) {
  let hideTimer = null;
  const clearHide = () => {
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
  };
  root.querySelectorAll("[data-cal-day]").forEach((btn) => {
    btn.addEventListener("mouseenter", () => {
      clearHide();
      showHeatDayTip(btn, btn.dataset.calDay);
    });
    btn.addEventListener("mouseleave", () => {
      clearHide();
      hideTimer = setTimeout(() => hideHeatDayTip(), 120);
    });
    btn.addEventListener("focus", () => showHeatDayTip(btn, btn.dataset.calDay));
    btn.addEventListener("blur", () => {
      clearHide();
      hideTimer = setTimeout(() => hideHeatDayTip(), 120);
    });
    btn.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "touch" && e.pointerType !== "pen") return;
      clearHide();
      showHeatDayTip(btn, btn.dataset.calDay);
    });
    btn.addEventListener("click", () => {
      const iso = btn.dataset.calDay;
      hideHeatDayTip();
      if (typeof onDayClick === "function") {
        onDayClick(iso);
        return;
      }
      const ctx = dayDeadlineContext(iso);
      if (ctx.schedules.length || ctx.collection || ctx.requestGroups.length) {
        openDayDeadlineDetail(iso);
        return;
      }
      if (typeof onEmptyClick === "function") onEmptyClick(iso);
    });
  });
}

function countOpenByUrgencyInRange(startIso, endIso) {
  const counts = { urgent: 0, warn: 0, check: 0, gray: 0, total: 0 };
  state.schedule.forEach((s) => {
    if ((s.status || "") === "완료") return;
    const due = (s.endDate || s.date || "").slice(0, 10);
    if (!due || due < startIso || due > endIso) return;
    counts.total += 1;
    const u = scheduleUrgency(s);
    if (u === "urgent") counts.urgent += 1;
    else if (u === "warn") counts.warn += 1;
    else if (u === "check") counts.check += 1;
    else counts.gray += 1;
  });
  return counts;
}

function buildHeatCalendarHtml(cursor, { mode = "month", selectedIso = "", bandFilter = null } = {}) {
  const todayIso = today();
  const { start, end } = getHeatVisibleRange(mode, cursor);
  const allDays = eachDayInclusive(start, end);
  const compact = mode === "twoMonth" || mode === "threeMonth";
  const agenda = mode === "week" || mode === "fortnight";
  const splitEdges = mode === "month" || mode === "twoMonth" || mode === "threeMonth";
  const focusDays = splitEdges ? allDays.filter((d) => isInHeatFocusMonths(d, mode, cursor)) : allDays;
  const weekdayIndex = (d) => (d.getDay() + 6) % 7;

  const renderCell = (day, idx) => {
    const iso = toIsoDate(day);
    const dayTasks = eventsOnDate(iso).filter((s) => (s.status || "") !== "완료");
    const dueTasks = eventsEndingOnDate(iso).filter((s) => (s.status || "") !== "완료");
    const showTasks = dueTasks.length ? dueTasks : dayTasks;
    const band = dayHeatBand(showTasks);
    const isToday = iso === todayIso;
    const isSelected = !bandFilter && iso === selectedIso;
    const outside = !isInHeatFocusMonths(day, mode, cursor);
    const dimmed = bandFilter && bandFilter !== "all" && band !== "none" && band !== bandFilter;
    const monthStart = mode !== "week" && day.getDate() === 1;
    const holiday = KR_HOLIDAYS[iso] || "";
    const dow = day.getDay();
    const red = dow === 0 || !!holiday;
    const sat = dow === 6 && !holiday;
    const hot = band === "urgent";

    return `
      <button type="button" class="heat-cell ${isToday ? "today" : ""} ${isSelected ? "selected" : ""} ${
        outside && !splitEdges ? "outside" : ""
      } ${dimmed ? "dimmed" : ""} ${hot ? "critical" : ""} ${agenda ? "tall" : ""} ${
        monthStart ? "month-start" : ""
      } ${holiday ? "holiday" : ""} ${red ? "red-day" : ""} ${sat ? "sat-day" : ""}"
        style="${heatBandStyle(band)};animation-delay:${Math.min(idx, 42) * 8}ms"
        data-cal-day="${iso}"
        title="${showTasks.length ? "마감 미리보기 · 클릭 시 상세" : ""}"
        aria-label="${day.getMonth() + 1}월 ${day.getDate()}일 업무 ${showTasks.length}건">
        ${
          monthStart
            ? `<span class="month-rail" aria-hidden="true"><span class="month-rail-label">${day.getMonth() + 1}월</span></span>`
            : ""
        }
        <div class="heat-top">
          <span class="heat-num">${day.getDate()}</span>
          ${showTasks.length ? `<span class="heat-count ${hot ? "is-hot" : ""}">${showTasks.length}</span>` : ""}
        </div>
        ${holiday && !agenda ? `<span class="heat-holiday">${escapeHtml(holiday)}</span>` : ""}
        ${
          agenda
            ? showTasks
                .slice(0, 3)
                .map((t) => `<span class="heat-task-chip">${escapeHtml(t.title)}</span>`)
                .join("") +
              (showTasks.length > 3 ? `<span class="heat-more">+${showTasks.length - 3}</span>` : "")
            : band !== "none"
              ? `<span class="heat-level-mark ${band}" aria-hidden="true"></span>`
              : ""
        }
      </button>`;
  };

  let cells = [];
  if (splitEdges) {
    const first = focusDays[0];
    if (first) {
      for (let i = 0; i < weekdayIndex(first); i++) {
        cells.push(`<div class="heat-cell focus-pad" aria-hidden="true"></div>`);
      }
    }
    focusDays.forEach((d, i) => cells.push(renderCell(d, i)));
    const last = focusDays[focusDays.length - 1];
    if (last) {
      for (let i = weekdayIndex(last) + 1; i < 7; i++) {
        cells.push(`<div class="heat-cell focus-pad" aria-hidden="true"></div>`);
      }
    }
  } else {
    cells = allDays.map((d, i) => renderCell(d, i));
  }

  return `
    <div class="heat-dow-row" aria-hidden="true">
      ${HEAT_DOW.map(
        (d) => `<div class="cal-dow ${d === "토" ? "sat" : d === "일" ? "sun" : ""}">${d}</div>`
      ).join("")}
    </div>
    <div class="heat-grid ${compact ? "compact" : ""} ${agenda ? "agenda" : ""}">${cells.join("")}</div>`;
}

function buildScheduleRiskChartHtml(items = state.schedule) {
  const open = items.filter((s) => (s.status || "") !== "완료");
  const start = parseIsoDate(today());
  const days = 180;
  const counts = [];
  let max = 1;
  for (let i = 0; i < days; i++) {
    const iso = toIsoDate(addDaysDate(start, i));
    const n = open.filter((s) => {
      const a = (s.date || "").slice(0, 10);
      const b = (s.endDate || s.date || "").slice(0, 10);
      return iso >= a && iso <= b;
    }).length;
    counts.push(n);
    if (n > max) max = n;
  }
  const w = 640;
  const h = 120;
  const pad = 8;
  const pts = counts
    .map((n, i) => {
      const x = pad + (i / (days - 1)) * (w - pad * 2);
      const y = h - pad - (n / max) * (h - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const area = `${pad},${h - pad} ${pts} ${w - pad},${h - pad}`;
  const peakIdx = counts.indexOf(Math.max(...counts));
  const peakDay = addDaysDate(start, peakIdx);
  return `
    <section class="panel risk-chart">
      <button type="button" class="risk-chart-head" id="riskChartToggle" aria-expanded="true">
        <div>
          <h2 class="panel-title">일정 마감 밀도</h2>
          <p class="panel-desc">오늘 기준 · 향후 6개월 미완료 일정이 하루에 겹치는 정도</p>
        </div>
        <span class="risk-chart-toggle" aria-hidden="true">⌃</span>
      </button>
      <div class="risk-chart-body" id="riskChartBody">
        <p class="risk-chart-summary">피크 ${peakDay.getMonth() + 1}월 ${peakDay.getDate()}일 · 하루 최대 ${max}건</p>
        <div class="risk-chart-plot">
          <svg viewBox="0 0 ${w} ${h}" role="img" aria-label="마감 밀도 차트">
            <polygon points="${area}" fill="rgba(0,113,227,.12)"></polygon>
            <polyline points="${pts}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"></polyline>
          </svg>
        </div>
        <p class="risk-chart-foot">막대가 높을수록 그날 진행 중인 일정이 많습니다.</p>
      </div>
    </section>`;
}

function scheduleUrgency(item) {
  const days = daysUntil(item.endDate || item.date);
  if ((item.status || "") === "완료") return "ok";
  if (days < 0) return "urgent";
  if (days === 0) return "urgent";
  if (days <= 7) return "warn";
  if (days <= 31) return "check";
  return "ok";
}

function scheduleBucket(item) {
  const days = daysUntil(item.endDate || item.date);
  if ((item.status || "") === "완료") return "done";
  if (days < 0) return "overdue";
  if (days === 0) return "today";
  if (days <= 7) return "week";
  if (days <= 31) return "month";
  return "later";
}

function scheduleStatusLabel(s) {
  return { 준비: "준비", 진행: "진행", 완료: "완료" }[s] || s || "준비";
}

const KR_HOLIDAYS = {
  "2026-01-01": "신정",
  "2026-02-16": "설날",
  "2026-02-17": "설날",
  "2026-02-18": "설날",
  "2026-03-01": "삼일절",
  "2026-05-05": "어린이날",
  "2026-05-24": "석가탄신일",
  "2026-06-06": "현충일",
  "2026-08-15": "광복절",
  "2026-09-24": "추석",
  "2026-09-25": "추석",
  "2026-09-26": "추석",
  "2026-10-03": "개천절",
  "2026-10-09": "한글날",
  "2026-12-25": "크리스마스",
};

function countScheduleByUrgency(items = state.schedule) {
  const counts = { urgent: 0, warn: 0, check: 0 };
  items.forEach((s) => {
    const u = scheduleUrgency(s);
    if (counts[u] != null) counts[u] += 1;
  });
  return counts;
}

function nearestDeadlineItem(items = state.schedule) {
  return (
    [...items]
      .filter((s) => (s.status || "") !== "완료")
      .map((s) => ({ ...s, daysUntil: daysUntil(s.endDate || s.date) }))
      .filter((s) => s.daysUntil >= -60)
      .sort((a, b) => a.daysUntil - b.daysUntil || a.date.localeCompare(b.date))[0] || null
  );
}

function formatKorDate(iso) {
  if (!iso) return "";
  const [, m, d] = iso.split("-").map(Number);
  return `${m}월 ${d}일`;
}

/* ---------- Schedule / comment alarm popup ---------- */

const ALARM_AUTO_WAIT_SEC = 5;
let alarmPopupMode = "unified";
let alarmPopupPhase = "unified";
let alarmPopupBrowseAll = false;
let alarmPhaseTransitionTimer = null;

function loadRemindState() {
  try {
    return JSON.parse(localStorage.getItem(REMIND_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveRemindState(map) {
  localStorage.setItem(REMIND_KEY, JSON.stringify(map));
}

function daysUntil(isoDate) {
  const t0 = new Date(`${today()}T00:00:00`);
  const t1 = new Date(`${isoDate}T00:00:00`);
  return Math.round((t1 - t0) / 86400000);
}

function timingLabel(days) {
  if (days < 0) return `${Math.abs(days)}일 지남`;
  if (days === 0) return "오늘";
  if (days === 1) return "내일";
  return `${days}일 남음`;
}

function timingClass(days) {
  if (days < 0) return "is-overdue";
  if (days <= 2) return "is-urgent";
  if (days <= 7) return "is-warn";
  return "is-soon";
}

function getUpcomingReminders({ includeDismissed = false } = {}) {
  const map = loadRemindState();
  const todayIso = today();
  return [...state.schedule]
    .map((s) => {
      const days = daysUntil(s.endDate || s.date);
      return { ...s, daysUntil: days };
    })
    .filter((s) => (s.status || "") !== "완료")
    .filter((s) => s.daysUntil >= -30 && s.daysUntil <= REMIND_BEFORE_DAYS)
    .filter((s) => {
      if (includeDismissed) return true;
      if (map[`dismiss:${s.id}`]) return false;
      if (map[`snooze:${s.id}`] === todayIso) return false;
      if (map.hideToday === todayIso) return false;
      return true;
    })
    .sort((a, b) => a.daysUntil - b.daysUntil || a.date.localeCompare(b.date));
}

function updateRemindBell() {
  const bell = $("#btnRemindBell");
  const countEl = $("#remindBellCount");
  if (!bell) return;
  if (!sessionUser) {
    bell.hidden = true;
    bell.classList.remove("has-pending", "nudge");
    return;
  }
  const groups = reminderGroups();
  const pending = groups.overdue.length + groups.today.length + groups.week.length;
  if (pending > 0) {
    bell.hidden = false;
    bell.classList.add("nudge");
    bell.classList.toggle("has-pending", groups.overdue.length > 0);
    if (countEl) countEl.textContent = String(pending);
    bell.setAttribute("aria-label", `지연·일주일 안 일정 ${pending}건`);
  } else {
    bell.hidden = true;
    bell.classList.remove("has-pending", "nudge");
  }
}

function updateCommentBell() {
  const btn = $("#btnRequestPlane");
  const countEl = $("#requestPlaneCount");
  if (!btn) return;
  if (!sessionUser) {
    btn.hidden = true;
    btn.classList.remove("nudge");
    return;
  }
  const comments = myCommentFeedItems().length;
  const received = (state.schedule || []).filter(
    (s) => (s.status || "") !== "완료" && scheduleOriginOf(s).kind === "received"
  ).length;
  const pending = comments + received;
  if (pending > 0) {
    btn.hidden = false;
    btn.classList.add("nudge");
    if (countEl) countEl.textContent = String(pending);
    btn.setAttribute("aria-label", `요청·코멘트 ${pending}건`);
  } else {
    btn.hidden = true;
    btn.classList.remove("nudge");
  }
}

function updateAlarmButtons() {
  updateRemindBell();
  updateCommentBell();
}

function remindFromOwnerHtml(s, who = sessionUser) {
  const origin = scheduleOriginOf(s, who);
  const assignees = scheduleAssigneesOf(s);
  const owner = s.owner || s.createdBy || "";
  const assignedOthers = assignees.some((name) => name && name !== who);
  if (origin.kind === "sent" && assignedOthers) {
    return `<span class="from-owner is-offered">내가요청</span>`;
  }
  if (owner === who && (!assignees.length || assignees.every((name) => name === who))) {
    return `<span class="from-owner is-solo">나혼자</span>`;
  }
  if (owner && owner !== who) {
    return `<span class="from-owner">${escapeHtml(owner)}으로부터</span>`;
  }
  return origin.kind === "sent"
    ? `<span class="from-owner is-offered">내가요청</span>`
    : `<span class="from-owner is-solo">나혼자</span>`;
}

function remindDeptOwnerTagsHtml(s) {
  const dept = s.dept || s.division || "";
  const owner = s.owner || s.createdBy || "";
  return `${
    dept ? `<span class="kind-tag dept-tag">${escapeHtml(dept)}</span>` : ""
  }${owner ? `<span class="kind-tag owner-tag">${escapeHtml(owner)}</span>` : ""}`;
}

function scheduleYoyHint(s) {
  const last = String(s?.lastYearDueDate || "").slice(0, 10);
  if (last) {
    const due = parseIsoDate(scheduleDueIso(s));
    const prev = parseIsoDate(last);
    if (due && prev) {
      const projected = new Date(due.getFullYear(), prev.getMonth(), prev.getDate());
      if (projected.getMonth() !== prev.getMonth()) projected.setDate(0);
      const drift = Math.round((due - projected) / 86400000);
      if (drift > 0) return { text: `작년 이맘때보다 ${drift}일 지연`, tone: "is-late" };
      if (drift < 0) return { text: `작년 이맘때보다 ${Math.abs(drift)}일 미리 처리`, tone: "is-early" };
      return { text: "작년과 같은 시기", tone: "" };
    }
  }
  return { text: "작년 대비 자료 없음", tone: "" };
}

function formatKorDateTime(iso) {
  const raw = String(iso || "").trim();
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return formatCommentStamp(raw);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function remindTaskCardHtml(s) {
  const yoy = scheduleYoyHint(s);
  const due = scheduleDueIso(s);
  const program = typeLabel(s.type) || "일반업무";
  return `
    <button type="button" class="remind-item" data-goto-schedule="${escapeAttr(s.id)}">
      <span class="remind-from-row">${remindFromOwnerHtml(s)}</span>
      <strong>${escapeHtml(s.title)}${remindDeptOwnerTagsHtml(s)}</strong>
      <span class="remind-item-meta">${escapeHtml(formatKorDate(due))} · ${escapeHtml(program)} · <span class="remind-yoy ${yoy.tone}">${escapeHtml(yoy.text)}</span></span>
    </button>`;
}

function remindScheduleCommentCardHtml(s) {
  const comments = scheduleCommentsOf(s);
  const latest = [...comments].sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))[0];
  const author = latest?.author || latest?.by || "작성자";
  const preview = String(latest?.text || latest?.body || "").replace(/\s+/g, " ").trim();
  return `
    <button type="button" class="remind-item remind-comment-item" data-goto-schedule-comment="${escapeAttr(s.id)}">
      <span class="remind-from-row">
        ${remindFromOwnerHtml(s)}
        <span class="origin-tag comment">코멘트</span>
      </span>
      <strong>${escapeHtml(s.title)}${remindDeptOwnerTagsHtml(s)}<span class="remind-comment-badge">코멘트 ${comments.length}</span></strong>
      ${
        latest
          ? `<span class="remind-item-meta remind-comment-preview">${escapeHtml(author)} · ${escapeHtml(formatKorDateTime(latest.createdAt))} · ${escapeHtml(preview || "(내용 없음)")}</span>`
          : `<span class="remind-item-meta">코멘트가 있습니다.</span>`
      }
    </button>`;
}

function remindFeedCardHtml(r) {
  const preview = String(r.memo || "").replace(/\s+/g, " ").trim();
  const gotoAttr = r.requestId
    ? `data-goto-request="${escapeAttr(r.requestId)}"`
    : `data-goto-view="${escapeAttr(r.goto || "my-work")}"`;
  return `
    <button type="button" class="remind-item remind-comment-item" ${gotoAttr}>
      <span class="remind-from-row">
        <span class="from-owner">${escapeHtml(r.requester || "관리자")}으로부터</span>
        <span class="origin-tag comment">코멘트</span>
      </span>
      <strong>${escapeHtml(r.title)}<span class="remind-comment-badge">코멘트</span></strong>
      <span class="remind-item-meta remind-comment-preview">${escapeHtml(r.requester || "관리자")}${
        r.dueDate ? ` · ${escapeHtml(formatKorDate(r.dueDate))}` : ""
      }${preview ? ` · ${escapeHtml(preview.slice(0, 80))}` : ""}</span>
    </button>`;
}

function bindRemindListActions(root) {
  root?.querySelectorAll("[data-goto-schedule]").forEach((el) => {
    el.addEventListener("click", () => {
      cancelRemindPopupAutoClose();
      clearAlarmPhaseTransitionTimer();
      closeRemindPopup();
      setView("my-work");
    });
  });
  root?.querySelectorAll("[data-goto-request]").forEach((el) => {
    el.addEventListener("click", () => {
      cancelRemindPopupAutoClose();
      clearAlarmPhaseTransitionTimer();
      closeRemindPopup();
      setView("requests");
    });
  });
  root?.querySelectorAll("[data-goto-view]").forEach((el) => {
    el.addEventListener("click", () => {
      cancelRemindPopupAutoClose();
      clearAlarmPhaseTransitionTimer();
      closeRemindPopup();
      setView(el.dataset.gotoView || "my-work");
    });
  });
}

function renderScheduleRemindList(root, items = getUpcomingReminders()) {
  renderUnifiedRemindList(root, items, []);
}

function renderCommentRemindList(root, feed = myCommentFeedItems()) {
  renderUnifiedRemindList(root, [], feed);
}

function renderUnifiedRemindList(root, scheduleItems = getUpcomingReminders(), commentItems = myCommentFeedItems()) {
  if (!root) return;
  const overdue = scheduleItems.filter((s) => s.daysUntil < 0);
  const todayItems = scheduleItems.filter((s) => s.daysUntil === 0);
  const soon = scheduleItems.filter((s) => s.daysUntil > 0 && s.daysUntil <= 7);
  const overdueNote = "빨리 처리하거나, 처리 일정을 재수립하거나, 완료 여부를 점검하세요";

  const section = (tone, title, count, cards, { glow = false, note = "" } = {}) => {
    if (!cards.length) return "";
    const titleHtml = glow
      ? `<span class="remind-title-glow">${escapeHtml(title)}</span>`
      : `<span class="remind-section-label">${escapeHtml(title)}</span>`;
    return `
      <section class="remind-section is-${escapeAttr(tone)}">
        <h3>${titleHtml}<span class="remind-count">${count}건</span></h3>
        ${note ? `<p class="remind-note">${note}</p>` : ""}
        ${cards.join("")}
      </section>`;
  };

  const commentCards = commentItems.slice(0, 8).map((r) => remindFeedCardHtml(r));
  root.innerHTML = [
    section(
      "overdue",
      "지연",
      overdue.length,
      overdue.map((s) =>
        remindTaskCardHtml(s, s.createdBy === sessionUser ? "내가요청" : s.createdBy || "일정")
      ),
      { glow: true, note: overdue.length ? overdueNote : "" }
    ),
    section(
      "urgent",
      "오늘까지 반드시",
      todayItems.length,
      todayItems.map((s) =>
        remindTaskCardHtml(s, s.createdBy === sessionUser ? "내가요청" : s.createdBy || "일정")
      ),
      { glow: true }
    ),
    section(
      "soon",
      "이번주",
      soon.length,
      soon.slice(0, 5).map((s) => remindTaskCardHtml(s, s.createdBy || "일정"))
    ),
    commentCards.length ? commentCards.join("") : "",
  ]
    .filter(Boolean)
    .join("");

  if (!root.innerHTML.trim()) {
    root.innerHTML = `<div class="empty">지금 확인할 알림이 없습니다.</div>`;
  }
  bindRemindListActions(root);
}

function updateAlarmPopupChrome() {
  const hint = $("#remindPhaseHint");
  const hideOpts = document.querySelector("#remindBackdrop .remind-hide-opts");
  const goBtn = $("#remindGoSchedule");
  if (goBtn) goBtn.textContent = "내 업무 보기";
  if (hideOpts) hideOpts.hidden = false;
  if (hint) {
    hint.hidden = true;
    hint.textContent = "";
  }
}

function renderRemindList() {
  const root = $("#remindList");
  if (!root) return;
  renderUnifiedRemindList(
    root,
    getUpcomingReminders({ includeDismissed: alarmPopupBrowseAll }),
    myCommentFeedItems()
  );
}

function dismissReminder(id) {
  const map = loadRemindState();
  map[`dismiss:${id}`] = new Date().toISOString();
  saveRemindState(map);
  updateAlarmButtons();
}

function snoozeReminder(id) {
  const map = loadRemindState();
  map[`snooze:${id}`] = today();
  saveRemindState(map);
  updateAlarmButtons();
}

let remindPopupCountdownTimer = null;

function clearAlarmPhaseTransitionTimer() {
  if (alarmPhaseTransitionTimer) {
    window.clearInterval(alarmPhaseTransitionTimer);
    alarmPhaseTransitionTimer = null;
  }
}

function setRemindConfirmCountdown(left) {
  const el = $("#remindConfirmCount");
  if (!el) return;
  const n = Math.max(0, Number(left) || 0);
  if (!n) {
    el.hidden = true;
    el.textContent = "";
    el.classList.remove("is-urgent");
    return;
  }
  el.hidden = false;
  el.textContent = String(n);
  el.classList.toggle("is-urgent", n <= 2);
}

function clearRemindPopupAutoClose() {
  if (remindPopupCountdownTimer) {
    window.clearInterval(remindPopupCountdownTimer);
    remindPopupCountdownTimer = null;
  }
  const countEl = $("#remindAutoCloseCount");
  if (countEl) {
    countEl.hidden = true;
    countEl.textContent = "";
    countEl.classList.remove("is-urgent");
  }
  setRemindConfirmCountdown(0);
}

function cancelRemindPopupAutoClose() {
  clearRemindPopupAutoClose();
  clearAlarmPhaseTransitionTimer();
}

function startRemindPopupAutoClose({ dismissScheduleOnClose = false } = {}) {
  clearRemindPopupAutoClose();
  const countEl = $("#remindAutoCloseCount");
  if (countEl) {
    countEl.hidden = true;
    countEl.textContent = "";
  }
  let left = ALARM_AUTO_WAIT_SEC;
  setRemindConfirmCountdown(left);
  remindPopupCountdownTimer = window.setInterval(() => {
    left -= 1;
    if (left <= 0) {
      clearRemindPopupAutoClose();
      if (dismissScheduleOnClose) {
        getUpcomingReminders().forEach((s) => dismissReminder(s.id));
      }
      closeRemindPopup({ skipHideOpts: false });
      return;
    }
    setRemindConfirmCountdown(left);
  }, 1000);
}

function showAlarmPhase(_phase, { browseAll = false, auto = false } = {}) {
  showUnifiedAlarm({ browseAll, auto });
}

function showUnifiedAlarm({ browseAll = false, auto = false } = {}) {
  alarmPopupMode = "unified";
  alarmPopupPhase = "unified";
  alarmPopupBrowseAll = browseAll;
  const scheduleItems = getUpcomingReminders({ includeDismissed: browseAll });
  const commentItems = myCommentFeedItems();
  updateAlarmPopupChrome({
    scheduleCount: scheduleItems.length,
    commentCount: commentItems.length,
  });
  renderUnifiedRemindList($("#remindList"), scheduleItems, commentItems);

  const hideToday = $("#remindHideToday");
  if (hideToday) hideToday.checked = false;

  $("#remindBackdrop").hidden = false;
  updateAlarmButtons();

  clearRemindPopupAutoClose();
  clearAlarmPhaseTransitionTimer();
  if (auto) {
    startRemindPopupAutoClose({ dismissScheduleOnClose: true });
  }
}

function openUnifiedAlarmPopup({ browseAll = false } = {}) {
  alarmPopupMode = "unified";
  clearAlarmPhaseTransitionTimer();
  clearRemindPopupAutoClose();

  const scheduleItems = getUpcomingReminders({ includeDismissed: browseAll });
  const commentItems = myCommentFeedItems();

  const map = loadRemindState();
  if (!browseAll) {
    if (map.hideToday === today()) return;
    if (!scheduleItems.length && !commentItems.length) {
      closeRemindPopup({ skipHideOpts: true });
      updateAlarmButtons();
      return;
    }
  }

  showUnifiedAlarm({ browseAll, auto: !browseAll });
}

function openRemindPopup(browseAll = false) {
  openUnifiedAlarmPopup({ mode: browseAll ? "schedule" : "unified", browseAll });
}

function closeRemindPopup({ skipHideOpts = false } = {}) {
  clearRemindPopupAutoClose();
  clearAlarmPhaseTransitionTimer();
  if (!skipHideOpts) {
    const map = loadRemindState();
    delete map.hideForever;
    if ($("#remindHideToday")?.checked) map.hideToday = today();
    saveRemindState(map);
  }
  $("#remindBackdrop").hidden = true;
  const hint = $("#remindPhaseHint");
  if (hint) {
    hint.hidden = true;
    hint.textContent = "";
  }
  updateAlarmButtons();
}

function myPendingRequests() {
  ensureRequests();
  if (!sessionUser) return [];
  return state.requests.filter(
    (r) => r.recipient === sessionUser && r.status !== "완료"
  );
}

/** 파일·예산·성과지표·윤독 코멘트 피드 */
function myCommentFeedItems() {
  if (!sessionUser) return [];
  const items = [];
  const mine = new Set(myPartIds());
  const me = currentMember();

  (state.reviewSession?.comments || []).forEach((c) => {
    if (!c?.text && !c?.photoDataUrl) return;
    if (mine.has(c.partId) || c.partId === "__overall__") {
      const part = partById(c.partId);
      const photoNote = c.photoDataUrl ? " · 📷 사진 첨부" : "";
      items.push({
        id: `rev-${c.id}`,
        title: part ? `리뷰회의 · ${part.section}. ${part.title}` : "윤독 코멘트",
        memo: `${c.text || ""}${photoNote}`.trim(),
        requester: c.by || "관리자",
        dueDate: null,
        goto: "collections",
        kind: "review",
      });
    }
  });

  myPendingRequests().forEach((r) => {
    const blob = `${r.title || ""} ${r.memo || ""}`;
    let goto = "requests";
    let kind = "request";
    if (/예산/.test(blob)) {
      goto = "budget";
      kind = "budget";
    } else if (/성과|KPI|지표/.test(blob)) {
      goto = "kpi";
      kind = "kpi";
    } else if (/취합|원고|파일|업로드|점검/.test(blob)) {
      goto = "collections";
      kind = "file";
    }
    items.push({
      id: `req-${r.id}`,
      title: r.title || "요청 코멘트",
      memo: r.memo || "",
      requester: r.requester || "관리자",
      dueDate: r.dueDate || null,
      goto,
      kind,
      requestId: r.id,
    });
  });

  if (me) {
    (state.budget?.items || []).forEach((i) => {
      if (i.assigneeId === me.id && i.adminNote) {
        items.push({
          id: `budnote-${i.id}`,
          title: `예산 코멘트 · ${i.program || i.area || "항목"}`,
          memo: i.adminNote,
          requester: "예산·관리자",
          dueDate: null,
          goto: "budget",
          kind: "budget",
        });
      }
    });
    (state.kpis || []).forEach((k) => {
      if (k.note && (k.ownerId === me.id || !k.ownerId)) {
        items.push({
          id: `kpinote-${k.id}`,
          title: `성과지표 코멘트 · ${k.name || ""}`,
          memo: k.note,
          requester: "관리자",
          dueDate: null,
          goto: "kpi",
          kind: "kpi",
        });
      }
    });
  }

  return items.slice(0, 12);
}

function updateRequestPlane() {
  updateCommentBell();
}

function renderRequestPopupList(items) {
  renderUnifiedRemindList($("#requestList"), [], items);
}

function completeRequest(id) {
  ensureRequests();
  const row = state.requests.find((r) => r.id === id);
  if (!row) return;
  if (!isAdmin() && row.recipient !== sessionUser) return;
  row.status = "완료";
  row.completedAt = today();
  persist();
  updateRequestPlane();
  if (activeViewName === "requests") renderRequests();
}

function openRequestPopup(force = false) {
  openUnifiedAlarmPopup({ mode: "comment", browseAll: force });
}

function closeRequestPopup() {
  closeRemindPopup();
}

function cancelRequestPopupAutoClose() {
  cancelRemindPopupAutoClose();
}

/** 홈 진행률 바용 지표 */
function statusOfPct(pct) {
  if (pct >= 100) return "done";
  if (pct > 0) return "doing";
  return "todo";
}

function buildHomeProgressItems() {
  const admin = isAdmin();
  const me = currentMember();
  ensureBudget();
  ensureRequests();
  ensureKpis();

  const board = buildTeamCollectionBoard(latestCollection());
  const colDone = board.filter((r) => r.status.id === "done").length;
  const colTotal = board.length;
  const colPct = colTotal ? Math.round((colDone / colTotal) * 100) : 0;

  const partsTotal = state.parts?.length || 0;
  const partsAssigned = (state.parts || []).filter((p) => p.assigneeId).length;
  const partsPct = partsTotal ? Math.round((partsAssigned / partsTotal) * 100) : 0;
  const pageTarget = Number(state.meta?.totalTargetPages) || 0;
  const pageAlloc = allocatedTotal();
  const pagePct = pageTarget ? Math.min(100, Math.round((pageAlloc / pageTarget) * 100)) : partsPct;

  const reqs = admin
    ? state.requests || []
    : (state.requests || []).filter((r) => r.recipient === sessionUser);
  const reqDone = reqs.filter((r) => r.status === "완료").length;
  const reqTotal = reqs.length;
  const reqPct = reqTotal ? Math.round((reqDone / reqTotal) * 100) : 100;

  const mode = getBudgetInputMode();
  const budItems = admin
    ? state.budget.items || []
    : (state.budget.items || []).filter((i) => me && i.assigneeId === me.id);
  const budDone = budItems.filter((i) => !!budgetCalcOf(i, mode)).length;
  const budTotal = budItems.length;
  const budPct = budTotal ? Math.round((budDone / budTotal) * 100) : 100;

  const sched = state.schedule || [];
  const schedDone = sched.filter((s) => (s.status || "") === "완료").length;
  const schedTotal = sched.length;
  const schedPct = schedTotal ? Math.round((schedDone / schedTotal) * 100) : 100;

  const kpis = state.kpis || [];
  let kpiPct = 0;
  if (kpis.length) {
    const rates = kpis.map((k) => {
      const t = Number(k.target) || 0;
      if (t <= 0) return 0;
      return Math.max(0, Math.min(100, ((Number(k.actual) || 0) / t) * 100));
    });
    kpiPct = Math.round(rates.reduce((a, b) => a + b, 0) / rates.length);
  }

  const raw = admin
    ? [
        { label: "목차", pct: pagePct, goto: "parts" },
        { label: "요청", pct: reqPct, goto: "requests" },
        { label: "보고서", pct: colPct, goto: "collections" },
        { label: "예산", pct: budPct, goto: "budget" },
        { label: "성과", pct: kpiPct, goto: "kpi" },
        { label: "일정", pct: schedPct, goto: "my-work" },
      ]
    : [
        { label: "보고서", pct: colPct, goto: "collections" },
        { label: "요청", pct: reqPct, goto: "requests" },
        { label: "예산", pct: budPct, goto: "budget" },
        { label: "성과", pct: kpiPct, goto: "kpi" },
        { label: "일정", pct: schedPct, goto: "my-work" },
      ];

  const items = raw.map((it) => ({ ...it, status: statusOfPct(it.pct) }));
  const doneCount = items.filter((i) => i.status === "done").length;
  return { doneCount, total: items.length, items };
}

function homeStatusStripHtml({ doneCount, total, items }) {
  const mark = { done: "✓", doing: "…", todo: "·" };
  const label = { done: "완료", doing: "진행", todo: "대기" };
  return `
    <section class="home-status" aria-label="영역별 완료 여부">
      <div class="home-status-head">
        <strong>진행</strong>
        <span>완료 ${doneCount}/${total}</span>
      </div>
      <div class="home-status-chips">
        ${items
          .map(
            (it) => `
          <button type="button" class="home-status-chip is-${it.status}" data-goto="${escapeAttr(it.goto)}" title="${escapeAttr(label[it.status])}">
            <i aria-hidden="true">${mark[it.status]}</i>
            <span>${escapeHtml(it.label)}</span>
          </button>`
          )
          .join("")}
      </div>
    </section>`;
}

/* ---------- Renderers ---------- */

function processGuideDismissed() {
  try {
    return localStorage.getItem(PROCESS_GUIDE_KEY) === "1";
  } catch {
    return false;
  }
}

function processStepsForRole() {
  if (isAdmin()) {
    return [
      { n: "1", title: "일정 수립", desc: "Setting에서 TF 일정을 넣습니다", view: "schedule" },
      { n: "2", title: "취합 공지", desc: "보고서 통합에서 차수 공지를 올립니다", view: "collections" },
      { n: "3", title: "취합·리뷰", desc: "제출을 확인하고 리뷰회의를 남깁니다", view: "collections" },
      { n: "4", title: "사용방법", desc: "역할별 권한·메뉴를 확인합니다", view: "guide" },
    ];
  }
  return [
    { n: "1", title: "내업무 확인", desc: "요청받은 일과 말풍선을 봅니다", view: "my-work" },
    { n: "2", title: "작성·업로드", desc: "제출 요청이 열리면 파일을 올립니다", view: "collections" },
    { n: "3", title: "제출 확인", desc: "보고서 통합에서 상태를 확인합니다", view: "collections" },
    { n: "4", title: "사용방법", desc: "막히면 여기 그림 안내를 봅니다", view: "guide" },
  ];
}

function processRailHtml({ compact = false, currentView = "", dismissible = true } = {}) {
  if (dismissible && !compact && processGuideDismissed()) return "";
  const steps = processStepsForRole();
  const kicker = isAdmin() ? "관리자 진행 순서" : "처음이라면 이 순서로";
  const title = isAdmin()
    ? "일정 → 취합 공지 → 묶기"
    : "내업무 확인 → 업로드 → 제출";
  return `
    <section class="process-rail ${compact ? "is-compact" : ""}" aria-label="${escapeAttr(kicker)}">
      <div class="process-rail-head">
        <div>
          <p class="process-rail-kicker">${escapeHtml(kicker)}</p>
          <p class="process-rail-title">${escapeHtml(title)}</p>
        </div>
        ${
          dismissible && !compact
            ? `<button type="button" class="process-rail-dismiss" id="processGuideDismiss">안내 숨기기</button>`
            : ""
        }
      </div>
      <ol class="process-rail-steps">
        ${steps
          .map((step, i) => {
            const on =
              step.view === currentView || (currentView === "dashboard" && i === 0);
            return `<li>
              <button type="button" class="process-step ${on ? "is-current" : ""}" data-process-view="${escapeAttr(step.view)}">
                <em>${escapeHtml(step.n)}</em>
                <strong>${escapeHtml(step.title)}</strong>
                <span>${escapeHtml(step.desc)}</span>
              </button>
            </li>`;
          })
          .join("")}
      </ol>
    </section>`;
}

function bindProcessRail(root) {
  if (!root) return;
  root.querySelectorAll("[data-process-view]").forEach((btn) => {
    btn.addEventListener("click", () => setView(btn.dataset.processView));
  });
  $("#processGuideDismiss", root)?.addEventListener("click", () => {
    try {
      localStorage.setItem(PROCESS_GUIDE_KEY, "1");
    } catch {
      /* ignore */
    }
    const rail = root.querySelector(".process-rail:not(.is-compact)");
    if (rail) rail.remove();
  });
}

const REMIND_CARD_META = [
  { id: "overdue", label: "지연", hint: "마감 지남 · 미완료", tone: "later" },
  { id: "today", label: "오늘까지 반드시 처리", hint: "오늘 마감", tone: "today" },
  { id: "week", label: "이번주 내 처리", hint: "7일 이내", tone: "week" },
  { id: "month", label: "이번달 내 처리", hint: "한 달 이내", tone: "earlier" },
];

function scheduleDueIso(s) {
  return (s?.endDate || s?.date || "").slice(0, 10);
}

function reminderBucketOf(s) {
  if ((s?.status || "") === "완료") return "later";
  const due = scheduleDueIso(s);
  if (!due) return "later";
  const days = daysUntil(due);
  if (days < 0) return "overdue";
  if (days === 0) return "today";
  if (days <= 7) return "week";
  if (days <= 31) return "month";
  return "later";
}

function reminderGroups() {
  const who = sessionUser;
  const groups = { overdue: [], today: [], week: [], month: [] };
  (state.schedule || [])
    .filter((s) => (s.status || "") !== "완료" && scheduleVisibleToUser(s, who))
    .forEach((s) => {
      const bucket = reminderBucketOf(s);
      if (groups[bucket]) groups[bucket].push(s);
    });
  Object.keys(groups).forEach((key) => {
    groups[key].sort((a, b) => scheduleDueIso(a).localeCompare(scheduleDueIso(b)));
  });
  return groups;
}

function processRemindHtml() {
  const groups = reminderGroups();
  const preview = [...groups.overdue, ...groups.today, ...groups.week];
  const detailOpen = Boolean(state._remindDetailOpen);
  return `
    <section class="yoy-board" aria-label="처리 리마인더">
      <div class="yoy-board-head">
        <h2 class="yoy-board-title">처리 리마인더</h2>
        <p class="muted">마감이 지났는데 완료가 아니면 지연으로 모입니다.</p>
      </div>
      <div class="yoy-stat-cards remind-stat-cards">
        ${REMIND_CARD_META.map((card) => {
          const items = groups[card.id] || [];
          return `
          <button type="button" class="yoy-stat ${card.tone}" data-remind-pick="${card.id}" title="${escapeAttr(card.label)}">
            <p class="yoy-stat-label">${escapeHtml(card.label)}</p>
            <p class="yoy-stat-value"><strong>${items.length}</strong><span>건</span></p>
            <p class="yoy-stat-desc">${escapeHtml(card.hint)}</p>
          </button>`;
        }).join("")}
      </div>
      ${
        preview.length
          ? `<div class="remind-detail">
              <button type="button" class="btn btn-ghost btn-sm remind-detail-toggle" id="remindDetailToggle" aria-expanded="${detailOpen ? "true" : "false"}">
                ${detailOpen ? "상세 접기" : `상세 보기 ${preview.length}건`}
              </button>
              ${
                detailOpen
                  ? `<ul class="remind-detail-list">
                      ${preview
                        .map((s) => {
                          const bucket = reminderBucketOf(s);
                          const meta = REMIND_CARD_META.find((c) => c.id === bucket);
                          return `<li>
                            <button type="button" class="remind-detail-row" data-remind-open="${escapeAttr(s.id)}">
                              <span class="yoy-stat-label ${meta?.tone || ""}">${escapeHtml(meta?.label || "")}</span>
                              <strong>${escapeHtml(s.title || "일정")}</strong>
                              <span>${escapeHtml(formatKorDate(scheduleDueIso(s)))}</span>
                            </button>
                          </li>`;
                        })
                        .join("")}
                    </ul>`
                  : ""
              }
            </div>`
          : ""
      }
    </section>`;
}

function bindProcessRemind(root) {
  if (!root) return;
  root.querySelectorAll("[data-remind-pick]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state._remindFocus = btn.dataset.remindPick;
      setView("my-work");
    });
  });
  $("#remindDetailToggle", root)?.addEventListener("click", () => {
    state._remindDetailOpen = !state._remindDetailOpen;
    const host = $("#pageHeroRemind");
    if (host) {
      host.innerHTML = processRemindHtml();
      bindProcessRemind(host);
    }
  });
  root.querySelectorAll("[data-remind-open]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = (state.schedule || []).find((s) => s.id === btn.dataset.remindOpen);
      setView("my-work");
      window.setTimeout(() => openScheduleUploadForItem(item), 80);
    });
  });
}

function renderDashboard() {
  const el = $("#view-dashboard");
  ensureReportDoc();
  ensureBudget();
  ensureRequests();
  const admin = isAdmin();

  if (!state._calCursor) state._calCursor = today().slice(0, 7) + "-01";
  if (!state._calSelected) state._calSelected = today();
  if (!state._calRange) state._calRange = "month";
  const cursor = parseIsoDate(state._calCursor);
  const mode = state._calRange;
  const stepIndex = HEAT_RANGE_STEPS.indexOf(mode);
  const selected = state._calSelected;
  const dayItems = selected
    ? eventsOnDate(selected).filter((s) => (s.status || "") !== "완료")
    : [];
  const mile = milestoneProgressFromState();

  el.innerHTML = `
    <section class="yeonu-hero yeonu-hero-simple" aria-label="TF 요약">
      <div class="yeonu-hero-brand">
        <img class="yeonu-hero-mark" src="assets/yeonuhue-login.png" alt="연어회(硏語會)" width="72" height="72" />
        <div class="yeonu-hero-copyblock">
          <p class="yeonu-tagline">연(硏)성에서 우리의 말(語)이 모이면(會) 풀지 못할일이 없다.</p>
          <p class="yeonu-nowline">${escapeHtml(nowStageAndPartLine())}</p>
          ${
            admin
              ? ""
              : `<button type="button" class="btn btn-sm yeonu-now-go" id="homeGoMyWork">오늘 할 일 보기</button>`
          }
        </div>
      </div>
      <aside class="yeonu-hero-aside report-deadline" aria-live="polite">
        <p class="deadline-label">보고서 제출일시</p>
        <p class="deadline-when">${escapeHtml(formatReportDeadlineWhen())}</p>
        <p class="deadline-remain">
          잔여
          <strong id="homeDeadlineRemain">—</strong>
        </p>
      </aside>
    </section>

    ${marathonTrackHtml(mile, escapeHtml)}

    <section class="panel heatmap-panel home-cal-panel">
      <div class="range-navigator">
        <div class="range-zoom">
          <button type="button" class="btn btn-sm zoom-btn" id="homeCalMinus" ${stepIndex <= 0 ? "disabled" : ""} aria-label="기간 줄이기">−</button>
          <div class="range-track" role="group" aria-label="기간 설정">
            ${HEAT_RANGE_STEPS.map(
              (step, i) =>
                `<button type="button" class="range-step ${mode === step ? "active" : ""} ${i < stepIndex ? "passed" : ""}" data-home-range="${step}">${HEAT_RANGE_META[step].label}</button>`
            ).join("")}
          </div>
          <button type="button" class="btn btn-sm zoom-btn" id="homeCalPlus" ${
            stepIndex >= HEAT_RANGE_STEPS.length - 1 ? "disabled" : ""
          } aria-label="기간 늘리기">+</button>
        </div>
        <div class="cal-nav">
          <button type="button" class="btn btn-sm" id="homeCalPrev" aria-label="한 달 전">‹</button>
          <div class="cal-range">
            ${escapeHtml(heatRangeCaption(mode, cursor))}
            <span class="range-hint">${escapeHtml(HEAT_RANGE_META[mode].hint)}</span>
          </div>
          <button type="button" class="btn btn-sm" id="homeCalNext" aria-label="한 달 후">›</button>
          <button type="button" class="btn btn-sm" id="homeCalToday">오늘</button>
        </div>
      </div>
      ${buildHeatCalendarHtml(cursor, { mode, selectedIso: selected, bandFilter: null })}
    </section>

    <section class="panel">
      <div class="panel-head">
        <h2 class="panel-title">${escapeHtml(formatKorDate(selected))} 일정</h2>
      </div>
      ${
        dayItems.length
          ? `<div class="work-feed">${dayItems.map((s) => workFeedRowHtml(s, admin)).join("")}</div>`
          : `<p class="muted" style="margin:0">이 날 등록된 일정이 없습니다.</p>`
      }
    </section>
  `;

  const tickHomeDeadline = () => {
    updateReportDeadline();
  };
  tickHomeDeadline();
  bindMarathonRunner(el);
  $("#homeGoMyWork")?.addEventListener("click", () => setView("my-work"));

  el.querySelectorAll("[data-goto]").forEach((btn) => {
    btn.addEventListener("click", () => setView(btn.dataset.goto));
  });

  const shiftMonth = (delta) => {
    state._calCursor = toIsoDate(addMonthsDate(parseIsoDate(state._calCursor), delta));
    renderDashboard();
  };
  $("#homeCalPrev")?.addEventListener("click", () => shiftMonth(-1));
  $("#homeCalNext")?.addEventListener("click", () => shiftMonth(1));
  $("#homeCalToday")?.addEventListener("click", () => {
    state._calCursor = `${today().slice(0, 7)}-01`;
    state._calSelected = today();
    renderDashboard();
  });
  el.querySelectorAll("[data-home-range]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state._calRange = btn.dataset.homeRange;
      renderDashboard();
    });
  });
  $("#homeCalMinus")?.addEventListener("click", () => {
    const i = Math.max(0, HEAT_RANGE_STEPS.indexOf(state._calRange) - 1);
    state._calRange = HEAT_RANGE_STEPS[i];
    renderDashboard();
  });
  $("#homeCalPlus")?.addEventListener("click", () => {
    const i = Math.min(HEAT_RANGE_STEPS.length - 1, HEAT_RANGE_STEPS.indexOf(state._calRange) + 1);
    state._calRange = HEAT_RANGE_STEPS[i];
    renderDashboard();
  });
  bindHeatDayInteractions(el, {
    onDayClick: (iso) => {
      state._calSelected = iso;
      renderDashboard();
    },
  });
  bindScheduleFeedActions(
    el,
    () => {
      renderDashboard();
      updateAlarmButtons();
    },
    { onOpenItem: () => setView("my-work") }
  );
}

function renderParts() {
  if (!isAdmin()) {
    setView("dashboard");
    return;
  }
  const el = $("#view-parts");
  el.innerHTML = `
    <div class="panel parts-master-banner">
      <div class="panel-head" style="margin-bottom:0">
        <div>
          <h2 class="panel-title">팀 기준 원본 · 목차·할당</h2>
          <p class="muted" style="margin:4px 0 0">이 표가 취합·홈 진도의 기준입니다. 수정 내용은 이 기기 브라우저에 자동 저장됩니다.</p>
        </div>
        <div class="row">
          <button class="btn btn-sm" id="editMeta">기본정보</button>
          <button class="btn btn-primary" id="addPart">파트 추가</button>
        </div>
      </div>
    </div>
    <div class="panel">
      <div class="panel-head">
        <div>
          <h2 class="panel-title">사업보고서 목차 · 페이지 할당</h2>
          <p class="muted">파트 · 담당자 · 페이지 범위를 항상 최신으로 유지합니다.</p>
        </div>
      </div>
      <p class="muted" style="margin-top:-0.2rem;margin-bottom:0.8rem">
        목표 ${state.meta.totalTargetPages || 0}p · 현재 할당 ${allocatedTotal()}p · ${escapeHtml(state.meta.reportTitle || "")}
      </p>
      <div class="table-wrap">
        <table class="parts-master-table">
          <thead>
            <tr>
              <th>구분</th>
              <th>제목</th>
              <th>담당자</th>
              <th>시작</th>
              <th>끝</th>
              <th>할당량</th>
              <th>비고</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${state.parts
              .map((p) => {
                const m = memberById(p.assigneeId);
                return `
                <tr data-id="${p.id}">
                  <td><strong>${escapeHtml(p.section)}</strong></td>
                  <td>${escapeHtml(p.title)}</td>
                  <td>${escapeHtml(m?.name || "미지정")}</td>
                  <td class="page-range">${p.pageStart}</td>
                  <td class="page-range">${p.pageEnd}</td>
                  <td><span class="badge">${pagesOf(p)}p</span></td>
                  <td class="muted">${escapeHtml(p.note || "")}</td>
                  <td>
                    <div class="row">
                      <button class="btn btn-sm" data-edit="${p.id}">수정</button>
                      <button class="btn btn-sm btn-danger" data-del="${p.id}">삭제</button>
                    </div>
                  </td>
                </tr>`;
              })
              .join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;

  $("#editMeta")?.addEventListener("click", () => openMetaModal());
  $("#addPart")?.addEventListener("click", () => openPartModal());
  el.querySelectorAll("[data-edit]").forEach((btn) =>
    btn.addEventListener("click", () => openPartModal(btn.dataset.edit))
  );
  el.querySelectorAll("[data-del]").forEach((btn) =>
    btn.addEventListener("click", () => {
      if (!confirm("이 파트를 삭제할까요? 취합 데이터에서도 제거됩니다.")) return;
      const id = btn.dataset.del;
      state.parts = state.parts.filter((p) => p.id !== id);
      state.collections.forEach((c) => {
        c.submissions = c.submissions.filter((s) => s.partId !== id);
      });
      saveAndRender("parts");
    })
  );
}

function normalizeCheckImages(sub) {
  if (!Array.isArray(sub.checkImages)) sub.checkImages = [];
  sub.checkImages = sub.checkImages.filter(Boolean).slice(0, 3);
  return sub.checkImages;
}

function normalizeCheckFiles(sub) {
  if (!Array.isArray(sub.checkFiles)) sub.checkFiles = [];
  sub.checkFiles = sub.checkFiles.filter((f) => f && f.name && f.dataUrl).slice(0, 3);
  return sub.checkFiles;
}

function formatFileSize(bytes) {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n}B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)}KB`;
  return `${(n / (1024 * 1024)).toFixed(1)}MB`;
}

function fileToCompressedDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type?.startsWith("image/")) {
      reject(new Error("이미지만 가능합니다."));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("파일을 읽지 못했습니다."));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxW = 1280;
        const scale = Math.min(1, maxW / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.78));
      };
      img.onerror = () => reject(new Error("이미지 변환 실패"));
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("파일을 읽지 못했습니다."));
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

function isHangulFileName(name = "") {
  return /\.(hwp|hwpx)$/i.test(name);
}

function checkRequestSummary(sub) {
  const files = normalizeCheckFiles(sub).filter((f) => isHangulFileName(f.name));
  if (files.length) return `한글 ${files.length}개`;
  return "미업로드";
}

function partAssignmentLine(part) {
  if (!part) return "";
  const range =
    part.pageStart != null && part.pageEnd != null ? `${part.pageStart}–${part.pageEnd}쪽` : "";
  const pages = pagesOf(part);
  return [`${part.section || ""}. ${part.title || ""}`.replace(/^\.\s*/, "").trim(), range, pages ? `${pages}p` : "", part.note || ""]
    .filter(Boolean)
    .join(" · ");
}

function openCheckRequestModal(partId, editable = true) {
  const col = state.collections.find((c) => c.round === activeRound);
  if (!col) return;
  if (!Array.isArray(col.submissions)) col.submissions = [];
  let sub = col.submissions.find((s) => s.partId === partId);
  if (!sub) {
    sub = {
      partId,
      pageCount: 0,
      status: "pending",
      submittedAt: "",
      memo: "",
      checkImages: [],
      checkFiles: [],
      partDone: false,
    };
    col.submissions.push(sub);
  }
  const part = partById(partId);
  let files = normalizeCheckFiles(sub)
    .filter((f) => isHangulFileName(f.name))
    .map((f) => ({ ...f }));
  const MAX_FILE_BYTES = 30 * 1024 * 1024;

  const renderFiles = () => {
    const host = $("#checkFileList");
    if (!host) return;
    if (!files.length) {
      host.innerHTML = `<div class="empty" style="padding:12px">아직 업로드된 한글 파일이 없습니다.</div>`;
      return;
    }
    host.innerHTML = files
      .map(
        (f, i) => `
        <div class="check-file-item">
          <div class="check-file-meta">
            <strong>${escapeHtml(f.name)}</strong>
            <span class="muted">${escapeHtml(formatFileSize(f.size))}</span>
          </div>
          <div class="row">
            <a class="btn btn-sm" href="${f.dataUrl}" download="${escapeAttr(f.name)}">다운</a>
            ${
              editable
                ? `<button type="button" class="btn btn-sm btn-danger" data-del-file="${i}">삭제</button>`
                : ""
            }
          </div>
        </div>`
      )
      .join("");
    host.querySelectorAll("[data-del-file]").forEach((btn) => {
      btn.addEventListener("click", () => {
        files.splice(Number(btn.dataset.delFile), 1);
        renderFiles();
        updateFileCount();
      });
    });
  };

  const updateFileCount = () => {
    const el = $("#checkFileCount");
    if (el) el.textContent = `${files.length}/3`;
  };

  const addDocFiles = async (fileList) => {
    if (!editable) return;
    for (const file of [...fileList]) {
      if (!isHangulFileName(file.name)) {
        alert(`"${file.name}"은(는) 한글 파일(.hwp, .hwpx)만 업로드할 수 있습니다.`);
        continue;
      }
      if (files.length >= 3) {
        alert("한글 파일은 최대 3개까지 업로드할 수 있습니다.");
        break;
      }
      if (file.size > MAX_FILE_BYTES) {
        alert(`"${file.name}"은(는) 30MB를 초과합니다.`);
        continue;
      }
      try {
        const dataUrl = await readFileAsDataUrl(file);
        files.push({
          id: uid("cf"),
          name: file.name,
          type: file.type || "application/octet-stream",
          size: file.size,
          dataUrl,
        });
      } catch (err) {
        alert(err.message || "파일 업로드에 실패했습니다.");
      }
    }
    renderFiles();
    updateFileCount();
  };

  openModal({
    title: `한글 파일 올리기 · ${part ? `${part.section}. ${part.title}` : partId}`,
    submitLabel: editable ? "올리고 제출" : "닫기",
    bodyHtml: `
      <div class="check-pane active" data-check-pane="file">
        <p class="schedule-comment-lead">목차·할당 ${escapeHtml(partAssignmentLine(part) || partId)}</p>
        <div class="check-paste ${editable ? "" : "is-readonly"}" id="checkFileZone">
          <strong>담당 영역 한글 파일을 올리세요</strong>
          <span class="muted">.hwp / .hwpx · 개당 30MB · 최대 3개 · <span id="checkFileCount">${files.length}/3</span></span>
          ${
            editable
              ? `<input type="file" id="checkDocFile" multiple hidden accept=".hwp,.hwpx,application/x-hwp,application/haansofthwp" />
                 <button type="button" class="btn btn-sm btn-primary" id="checkDocPick">한글 파일 선택</button>`
              : ""
          }
        </div>
        <div class="check-file-list" id="checkFileList"></div>
        <p class="muted" style="margin:10px 0 0">올리면 할당 분량(${part ? pagesOf(part) : 0}p)으로 자동 제출되고, 보고서 통합에서 집계됩니다.</p>
      </div>
    `,
    onSubmit: () => {
      if (!editable) return true;
      if (!files.length) {
        alert("한글 파일을 올려 주세요.");
        return false;
      }
      sub.checkFiles = files.slice(0, 3);
      sub.altSubmit = false;
      sub.checkImages = [];
      markPartSubmitted(sub);
      saveAndRender(activeViewName === "my-work" ? "my-work" : "collections");
      return true;
    },
  });

  renderFiles();
  $("#checkDocPick")?.addEventListener("click", () => $("#checkDocFile")?.click());
  $("#checkDocFile")?.addEventListener("change", (e) => {
    addDocFiles(e.target.files || []);
    e.target.value = "";
  });
}

function renderCollections() {
  const el = $("#view-collections");
  if (!state.collections.find((c) => c.round === activeRound)) {
    activeRound = latestCollection()?.round || state.collections[0]?.round || 1;
  }
  const rounds = collectionsNewestFirst();
  const col = state.collections.find((c) => c.round === activeRound);
  const summary = collectionSummary(activeRound);
  const allSubmitted = col ? isCollectionFullySubmitted(col) : false;
  const phase = col ? collectionPhaseOf(col) : "planned";
  const phaseOpen = phase === "open";
  const showBoard = col && isCollectionRequestOpened(col);
  const showReview = showBoard && (allSubmitted || phase === "closed");
  const submitPct = summary.totalParts ? Math.round((summary.submitted / summary.totalParts) * 100) : 0;
  const ordered = col ? submissionsInPartOrder(col) : [];
  const hangulReady = col ? orderedCollectionHangulFiles(col).length : 0;

  el.innerHTML = `
    ${tfallHubBarHtml()}
    <div class="round-tabs">
      ${rounds
        .map((c) => {
          const s = collectionSummary(c.round);
          const opened = isCollectionRequestOpened(c);
          const waiting = !opened;
          const on = c.round === activeRound;
          const label = waiting ? "공지 전" : `${s.submitted}/${s.totalParts}`;
          return `<button type="button" class="round-tab ${on ? "active" : ""} ${waiting ? "is-waiting" : ""} ${opened ? "is-opened" : ""}" data-round="${c.round}">
            ${escapeHtml(c.name)} · ${escapeHtml(label)}
          </button>`;
        })
        .join("")}
    </div>

    ${
      col && phase === "planned"
        ? `<div class="collect-phase-banner is-planned collect-waiting-panel">
            <div>
              <p class="collect-waiting-kicker">${escapeHtml(col.name)}</p>
              <strong>${escapeHtml(collectionWaitingMessage(col))}</strong>
              <p class="muted">관리자가 취합 공지를 올리면 담당자는 <strong>내업무</strong>에서 한글 파일을 올립니다.</p>
            </div>
            ${isAdmin() ? `<button type="button" class="btn btn-primary" id="openCollectRequest">취합 공지 올리기</button>` : ""}
          </div>`
        : ""
    }
    ${
      col && phase === "open"
        ? `<div class="collect-phase-banner is-open">
            <div>
              <strong>취합 중 · ${summary.submitted}/${summary.totalParts} 제출</strong>
              <p class="muted">${escapeHtml(col.requestMessage || "담당자는 내업무에서 한글 파일을 올리면 됩니다.")}</p>
            </div>
            ${isAdmin() ? `<button type="button" class="btn" id="closeCollectRequest">취합 마감</button>` : ""}
          </div>`
        : ""
    }
    ${
      col && phase === "closed"
        ? `<div class="collect-phase-banner is-closed">
            <div>
              <strong>취합 마감</strong>
              <p class="muted">아래 현황·리뷰를 확인하고, 한글 파일을 목차 순서로 묶을 수 있습니다.</p>
            </div>
          </div>`
        : ""
    }

    ${
      !col
        ? `<div class="empty">취합 차수가 없습니다.</div>`
        : !showBoard
        ? ""
        : `
      <section class="collect-progress panel">
        <div class="collect-progress-head">
          <strong>취합 현황</strong>
          <span>제출 ${summary.submitted}/${summary.totalParts} · 할당 ${summary.pages}/${summary.allocPages}p</span>
        </div>
        <div class="progress collect-progress-bar"><span style="width:${submitPct}%"></span></div>
      </section>

      <div class="collect-board">
        ${ordered
          .map((s) => {
            const p = partById(s.partId);
            const m = p ? memberById(p.assigneeId) : null;
            const alloc = p ? pagesOf(p) : 0;
            const editable = canEditSubmission(s.partId);
            const canUpload = editable && phaseOpen;
            const isMine = myPartIds().includes(s.partId);
            const boardSt = submissionBoardStatus(s);
            const reviewComments = showReview ? partReviewComments(s.partId, activeRound) : [];
            return `
            <article class="collect-row is-${boardSt.id} ${isMine ? "is-mine" : ""}">
              <div class="collect-row-main">
                <strong>${escapeHtml(p ? `${p.section}. ${p.title}` : s.partId)}</strong>
                <span>${escapeHtml(m?.name || "미지정")} · 할당 ${alloc}p${isMine ? " · 내 담당" : ""}</span>
              </div>
              <span class="badge ${boardSt.cls}">${escapeHtml(boardSt.label)}</span>
              <button type="button" class="btn btn-sm ${canUpload ? "btn-primary" : ""}" data-check="${s.partId}" data-editable="${canUpload ? "1" : "0"}">
                ${canUpload ? "파일 올리기" : escapeHtml(checkRequestSummary(s))}
              </button>
              ${
                showReview
                  ? `<button type="button" class="btn btn-sm ${reviewComments.length ? "btn-primary" : ""}" data-part-review="${s.partId}">
                      ${reviewComments.length ? `리뷰 ${reviewComments.length}` : "리뷰"}
                    </button>`
                  : ""
              }
            </article>`;
          })
          .join("")}
      </div>

      <section class="collect-merge-bar">
        <div>
          <strong>한글 파일 묶기</strong>
          <p class="muted">목차 순서대로 하나의 ZIP으로 내려받습니다. 이 기기에서 올린 파일만 포함됩니다.</p>
        </div>
        <button type="button" class="btn btn-primary" id="mergeHangulZip" ${hangulReady ? "" : "disabled"}>${hangulReady ? `순서대로 묶기 (${hangulReady})` : "묶을 파일 없음"}</button>
      </section>

      ${
        showReview
          ? `<div class="panel collection-review-panel">
        <div class="panel-head">
          <div>
            <h2>회의 리뷰</h2>
            <p class="muted">전체 취합본을 보고 영역별로 정리합니다.</p>
          </div>
        </div>
        <div class="collection-review-grid">
          ${ordered
            .map((s) => {
              const p = partById(s.partId);
              const m = p ? memberById(p.assigneeId) : null;
              const comments = partReviewComments(s.partId, activeRound);
              return `
            <article class="collection-review-part ${comments.some((c) => c.photoDataUrl) ? "has-photo-note" : ""}">
              <header>
                <strong>${escapeHtml(p ? `${p.section}. ${p.title}` : s.partId)}</strong>
                <span class="muted">담당 ${escapeHtml(m?.name || "-")}</span>
                ${isAdmin() ? `<button type="button" class="btn btn-sm" data-part-review="${escapeAttr(s.partId)}">+ 코멘트</button>` : ""}
              </header>
              <div class="review-comment-list">
                ${
                  comments.length
                    ? comments.map((c) => renderReviewCommentCardHtml(c, { admin: isAdmin(), largePhoto: true })).join("")
                    : `<p class="muted empty-inline">아직 리뷰가 없습니다</p>`
                }
              </div>
            </article>`;
            })
            .join("")}
        </div>
      </div>`
          : ""
      }`
    }
  `;

  bindTfallHubBar(el);
  el.querySelectorAll("[data-round]").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeRound = Number(btn.dataset.round);
      renderCollections();
    });
  });

  $("#openCollectRequest")?.addEventListener("click", () => openCollectionRequestModal(activeRound));
  $("#closeCollectRequest")?.addEventListener("click", () => closeCollectionRequest(activeRound));
  $("#mergeHangulZip")?.addEventListener("click", () => downloadMergedHangulZip(col));

  el.querySelectorAll("[data-part-review]").forEach((btn) => {
    btn.addEventListener("click", () => openPartReviewCommentModal(btn.dataset.partReview, activeRound));
  });

  bindReviewCommentDeletes(el);

  el.querySelectorAll("[data-check]").forEach((btn) => {
    btn.addEventListener("click", () => {
      openCheckRequestModal(btn.dataset.check, btn.dataset.editable === "1");
    });
  });
}

function isSchedulePast(item) {
  const end = (item.endDate || item.date || "").slice(0, 10);
  if (!end) return false;
  return end < today();
}

function renderSchedule() {
  const el = $("#view-schedule");
  if (!el) return;
  if (!isAdmin()) return;
  const rows = unifiedTfScheduleRows();
  const todayIso = today();
  const applyStatusTone = (row, status) => {
    const tone = tfStatusTone(status);
    row.classList.remove("tone-done", "tone-active", "tone-planned");
    row.classList.add(`tone-${tone}`);
    const sel = row.querySelector("[data-tf-status]");
    if (sel) {
      sel.classList.remove("status-done", "status-active", "status-planned");
      sel.classList.add(`status-${tone}`);
    }
  };
  const rowHtml = (item, index) => {
    const { s, tpl, due } = item;
    const prev = rows[index - 1];
    const monthKey = due ? due.slice(0, 7) : "";
    const prevMonth = prev?.due ? prev.due.slice(0, 7) : prev ? "" : null;
    const showMonth = index === 0 || monthKey !== prevMonth;
    const status = s?.status || "준비";
    const tone = tfStatusTone(status);
    const days = due ? daysUntil(due) : null;
    const timing = days == null ? "" : timingLabel(days);
    const overdue = status !== "완료" && due && due < todayIso;
    const owner = s?.owner || s?.createdBy || "";
    const dept = s?.dept || s?.division || tpl?.division || "";
    const stepLabel = tpl
      ? `${tpl.step ? `${tpl.step} ` : ""}${tpl.short}`
      : scheduleGroupLabel(scheduleGroupOf(s));
    const stepHtml = tpl
      ? `<span class="tf-sched-step">${tpl.step ? `<em>${escapeHtml(tpl.step)}</em>` : ""}${escapeHtml(tpl.short)}</span>`
      : `<span class="tf-sched-step">${escapeHtml(stepLabel)}</span>`;
    return `
      <li>
        ${showMonth ? `<p class="tf-timeline-month">${escapeHtml(formatKorYearMonth(due))}</p>` : ""}
        <div class="tf-timeline-row tone-${tone}${overdue ? " is-overdue" : ""}${s ? " is-editable" : ""}" data-tf-row data-guide="${escapeAttr(tpl?.id || "")}" data-sched="${escapeAttr(s?.id || "")}"${s ? ` role="button" tabindex="0" aria-label="${escapeAttr(s.title || tpl?.title || "업무")} 수정"` : ""}>
          <span class="tf-timeline-rail" aria-hidden="true"><i></i></span>
          <span class="tf-timeline-due">
            <em>마감일정</em>
            <label class="tf-timeline-due-face">
              <strong data-tf-date-label>${escapeHtml(due ? formatKorDate(due) : "날짜 선택")}</strong>
              <input class="tf-timeline-date" type="date" data-tf-date value="${escapeAttr(due)}" aria-label="마감일" />
            </label>
            ${timing ? `<span class="tf-sched-timing">${escapeHtml(timing)}</span>` : ""}
          </span>
          <span class="tf-timeline-title">
            <em>업무명</em>
            <input data-tf-title value="${escapeAttr(s?.title || tpl?.title || "")}" placeholder="업무명" aria-label="업무명" />
            ${s ? scheduleLinkedDocsHtml(s, { compact: true }) : ""}
          </span>
          <span class="tf-timeline-people">
            <span class="tf-timeline-meta">
              <em>단계</em>
              ${stepHtml}
            </span>
            <span class="tf-timeline-meta">
              <em>담당</em>
              ${escapeHtml(owner || dept || "—")}
              ${owner && dept ? `<span class="tf-timeline-dept">${escapeHtml(dept)}</span>` : ""}
            </span>
          </span>
          <span class="tf-timeline-status">
            <em>진행현황</em>
            <select class="status-select status-${tone}" data-tf-status aria-label="진행현황">
              ${["준비", "진행", "완료"]
                .map((st) => `<option value="${st}" ${status === st ? "selected" : ""}>${st}</option>`)
                .join("")}
            </select>
          </span>
          <span class="tf-timeline-actions">
            <button type="button" class="btn btn-sm btn-primary" data-tf-save>저장</button>
            ${s ? `<button type="button" class="btn btn-sm" data-tf-edit="${escapeAttr(s.id)}">상세</button>` : ""}
          </span>
        </div>
      </li>`;
  };

  el.innerHTML = `
    <div class="tf-sched-page">
      <header class="tf-timeline-hero tf-sched-hero">
        <div class="tf-sched-hero-main">
          <h2>마감 순으로 등록된 일정을 봅니다</h2>
          <p>기본·추가를 나누지 않고 한 목록에서 작성합니다. 단계별 마감을 넣으면 요청업무 등록 시 날짜·내용이 기본값으로 채워집니다.</p>
        </div>
        <div class="tf-sched-hero-actions">
          <button type="button" class="btn btn-primary" id="addSchedule">일정 추가</button>
        </div>
      </header>
      <section class="panel tf-timeline-panel">
        ${
          rows.length
            ? `<ol class="tf-timeline">${rows.map(rowHtml).join("")}</ol>`
            : `<p class="empty">아직 일정이 없습니다. 「일정 추가」로 마감을 넣어 주세요.</p>`
        }
      </section>
    </div>
  `;

  const saveRow = (row) => {
    const guideId = row.dataset.guide;
    const schedId = row.dataset.sched;
    const title = (row.querySelector("[data-tf-title]")?.value || "").trim();
    const endDate = row.querySelector("[data-tf-date]")?.value || "";
    const status = row.querySelector("[data-tf-status]")?.value || "준비";
    if (!endDate) {
      alert("마감일을 입력해 주세요.");
      return;
    }
    if (guideId) {
      upsertTfGuideSchedule(guideId, { title, endDate, status });
    } else if (schedId) {
      const item = state.schedule.find((x) => x.id === schedId);
      if (!item) return;
      item.title = title || item.title;
      item.endDate = endDate;
      item.date = endDate;
      item.status = status;
    }
    persist();
    renderSchedule();
    updateAlarmButtons();
  };

  el.querySelectorAll("[data-tf-row]").forEach((row) => {
    const openRowEdit = () => {
      const schedId = row.dataset.sched;
      if (schedId) {
        openScheduleModal(schedId);
        return;
      }
      const guideId = row.dataset.guide;
      if (guideId) {
        const existing = tfScheduleForGuide(guideId);
        if (existing) openScheduleModal(existing.id);
      }
    };
    row.querySelector("[data-tf-save]")?.addEventListener("click", (e) => {
      e.stopPropagation();
      saveRow(row);
    });
    row.querySelector("[data-tf-status]")?.addEventListener("change", (e) => {
      e.stopPropagation();
      applyStatusTone(row, e.target.value);
    });
    row.querySelector("[data-tf-date]")?.addEventListener("change", (e) => {
      e.stopPropagation();
      const iso = e.target.value;
      const label = row.querySelector("[data-tf-date-label]");
      if (label) label.textContent = iso ? formatKorDate(iso) : "날짜 선택";
      const status = row.querySelector("[data-tf-status]")?.value || "준비";
      row.classList.toggle("is-overdue", status !== "완료" && Boolean(iso) && iso < todayIso);
      const timingEl = row.querySelector(".tf-sched-timing");
      if (iso) {
        const text = timingLabel(daysUntil(iso));
        if (timingEl) timingEl.textContent = text;
        else {
          const span = document.createElement("span");
          span.className = "tf-sched-timing";
          span.textContent = text;
          row.querySelector(".tf-timeline-due")?.appendChild(span);
        }
      } else if (timingEl) {
        timingEl.remove();
      }
    });
    row.querySelectorAll("input, select, button, a, label").forEach((el) => {
      el.addEventListener("click", (e) => e.stopPropagation());
    });
    if (row.dataset.sched || row.dataset.guide) {
      row.addEventListener("click", openRowEdit);
      row.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          if (e.target.closest("input, select, button, a")) return;
          e.preventDefault();
          openRowEdit();
        }
      });
    }
  });
  el.querySelectorAll("[data-tf-edit]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      openScheduleModal(btn.dataset.tfEdit);
    });
  });
  $("#addSchedule")?.addEventListener("click", () => openScheduleModal());
}

function canEditScheduleItem(s) {
  if (!s) return false;
  if (isAdmin()) return true;
  // 본인이 등록한 일정만 수정·삭제 가능. 타인(요청) 일정은 관리자만.
  return Boolean(s.createdBy) && s.createdBy === sessionUser;
}

function denySchedulePermission(message = "권한이 없습니다. 요청 업무 수정·삭제는 관리자만 가능합니다.") {
  try {
    if (navigator.vibrate) navigator.vibrate([28, 40, 28]);
  } catch {
    /* ignore */
  }
  const root = document.body;
  root.classList.remove("shake-deny");
  void root.offsetWidth;
  root.classList.add("shake-deny");
  window.setTimeout(() => root.classList.remove("shake-deny"), 420);
  alert(message);
}

function openScheduleUploadForItem(s) {
  if (!s) return;
  const group = scheduleGroupOf(s);
  if (group === "forms" || /킥오프|kickoff/i.test(`${s.title || ""} ${s.note || ""}`)) {
    openSharedMaterialsModal(s);
    return;
  }
  if (group === "kpi") {
    setView("kpi");
    return;
  }
  if (group === "budget") {
    setView("budget");
    return;
  }
  if (group === "collect") {
    const col = collectionBySchedule(s);
    if (!col) {
      setView("collections");
      return;
    }
    activeRound = col.round;
    const phase = collectionPhaseOf(col);
    if (isAdmin()) {
      if (phase === "planned") {
        openCollectionRequestModal(col.round);
        return;
      }
      setView("collections");
      return;
    }
    openMyAssignedUpload(col);
    return;
  }
  setView("collections");
}

function openMyAssignedUpload(col) {
  if (!col) return;
  activeRound = col.round;
  const phase = collectionPhaseOf(col);
  if (phase === "planned") {
    alert("관리자가 취합 공지를 올리면 한글 파일을 올릴 수 있습니다.");
    return;
  }
  const mine = myAssignedParts();
  if (!mine.length) {
    alert("목차·할당에서 담당 영역이 아직 없습니다.");
    return;
  }
  const editable = phase === "open" || phase === "closed";
  if (mine.length === 1) {
    const part = mine[0];
    if (!canEditSubmission(part.id)) {
      alert("배정된 영역만 올릴 수 있습니다.");
      return;
    }
    openCheckRequestModal(part.id, editable);
    return;
  }
  const dueIso = col.dueDate || scheduleDueIso(scheduleForCollectionRound(col.round));
  openModal({
    kicker: col.name || "취합",
    title: "내 담당 영역 올리기",
    submitLabel: "닫기",
    hideFooter: true,
    bodyHtml: `
      <p class="schedule-comment-lead">${
        dueIso ? `마감 ${escapeHtml(formatKorDate(dueIso))} · ` : ""
      }목차·할당에서 배정된 영역만 보입니다.</p>
      <div class="my-part-upload-list">
        ${mine
          .map((p) => {
            const sub = (col.submissions || []).find((row) => row.partId === p.id);
            const st = submissionBoardStatus(sub);
            return `<button type="button" class="my-part-upload-item" data-upload-part="${escapeAttr(p.id)}">
              <strong>${escapeHtml(`${p.section || ""}. ${p.title || ""}`.replace(/^\.\s*/, "").trim())}</strong>
              <span>${escapeHtml(partAssignmentLine(p))}</span>
              <em>${escapeHtml(st.label)}</em>
            </button>`;
          })
          .join("")}
      </div>
    `,
    onSubmit: () => true,
  });
  $("#modalBody")
    ?.querySelectorAll("[data-upload-part]")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        openCheckRequestModal(btn.dataset.uploadPart, editable && canEditSubmission(btn.dataset.uploadPart));
      });
    });
}

/** 일정(서식 및 지침확인) 업로드 탭 */
const SCHEDULE_FORM_UPLOAD_CATS = [
  { id: "지침", label: "지침", resourceCategory: "지침" },
  { id: "서식", label: "서식", resourceCategory: "서식" },
  { id: "집행기준", label: "집행기준", resourceCategory: "집행기준" },
  { id: "스타일가이드", label: "스타일가이드", resourceCategory: "스타일" },
];

const SCHEDULE_FORM_UPLOAD_TITLES = {
  지침: "작성 지침",
  서식: "공통 서식",
  집행기준: "집행기준",
  스타일가이드: "스타일 가이드",
};

function scheduleFormUploadSectionHtml(item) {
  if (!isAdmin()) return "";
  const files = item?.sharedFiles || {};
  return `
    <section class="schedule-form-upload" id="scheduleFormUploadSection" hidden>
      <p class="schedule-form-upload-alert" role="alert">* 이 업무에서는 공통양식(서식)을 함께 공유합니다.</p>
      <p class="wp-form-hint">지침·서식·집행기준·스타일가이드를 업로드하면 참여자 킥오프 화면에 자동으로 공유됩니다.</p>
      <div class="schedule-form-upload-tabs sub-tab-bar" role="tablist" aria-label="공통양식 업로드">
        ${SCHEDULE_FORM_UPLOAD_CATS.map(
          (c, i) => `
          <button type="button" class="sub-tab-btn schedule-form-upload-tab ${i === 0 ? "active" : ""}" role="tab" data-form-tab="${escapeAttr(c.id)}" aria-selected="${i === 0 ? "true" : "false"}">${escapeHtml(c.label)}</button>`
        ).join("")}
      </div>
      <div class="schedule-form-upload-panels">
        ${SCHEDULE_FORM_UPLOAD_CATS.map(
          (c, i) => {
            const existing = files[c.id];
            return `
          <div class="schedule-form-upload-panel ${i === 0 ? "is-active" : ""}" data-form-panel="${escapeAttr(c.id)}" role="tabpanel">
            <label class="wp-field">
              <span class="wp-label">${escapeHtml(c.label)} 파일</span>
              <input type="file" name="sharedFile_${escapeAttr(c.id)}" class="wp-input" accept=".pdf,.doc,.docx,.xls,.xlsx,.hwp,.hwpx,.ppt,.pptx" />
              ${
                existing?.dataUrl || existing?.fileName
                  ? `<span class="muted schedule-form-upload-current">등록됨: ${escapeHtml(existing.fileName || "첨부 파일")}${existing.uploadedAt ? ` · ${escapeHtml(existing.uploadedAt)}` : ""}</span>`
                  : `<span class="muted schedule-form-upload-current">아직 등록된 ${escapeHtml(c.label)} 파일이 없습니다.</span>`
              }
            </label>
          </div>`;
          }
        ).join("")}
      </div>
    </section>`;
}

function bindScheduleFormUploadTabs() {
  $$(".schedule-form-upload-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      const id = tab.dataset.formTab;
      $$(".schedule-form-upload-tab").forEach((t) => {
        const on = t === tab;
        t.classList.toggle("active", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
      });
      $$(".schedule-form-upload-panel").forEach((p) => p.classList.toggle("is-active", p.dataset.formPanel === id));
    });
  });
}

function syncScheduleUploadsToResources(scheduleItem, sharedFiles = {}) {
  if (!scheduleItem?.id || !sharedFiles || typeof sharedFiles !== "object") return;
  if (!Array.isArray(state.resources)) state.resources = [];
  const scheduleTitle = scheduleItem.title || "킥오프 공유";

  SCHEDULE_FORM_UPLOAD_CATS.forEach((cat) => {
    const file = sharedFiles[cat.id];
    if (!file?.dataUrl) return;
    const resourceCategory = cat.resourceCategory || cat.id;
    const existingIdx = state.resources.findIndex((r) => r.scheduleId === scheduleItem.id && r.uploadSlot === cat.id);
    const entry = normalizeResourceEntry({
      title: SCHEDULE_FORM_UPLOAD_TITLES[cat.id] || cat.label,
      category: resourceCategory,
      fileName: file.fileName,
      dataUrl: file.dataUrl,
      url: file.dataUrl,
      uploadedAt: file.uploadedAt || today(),
      note: `${scheduleTitle} · 자동 공유`,
      scheduleId: scheduleItem.id,
      uploadSlot: cat.id,
    });
    if (existingIdx >= 0) Object.assign(state.resources[existingIdx], entry);
    else state.resources.push({ id: uid("r"), ...entry });
  });
}

function bindScheduleFormUploadSection(currentGroup) {
  const section = $("#scheduleFormUploadSection");
  const workGroupEl = $("#schedWorkGroup");
  if (!section || !workGroupEl) return;

  let formsAlertShown = false;

  const refresh = () => {
    const isForms = workGroupEl.value === "forms";
    section.hidden = !isForms || !isAdmin();
    const collectField = $("#schedCollectRoundField");
    if (collectField) collectField.hidden = workGroupEl.value !== "collect";
    if (isForms && isAdmin() && !formsAlertShown) {
      formsAlertShown = true;
      alert("* 이 업무에서는 공통양식(서식)을 함께 공유합니다.");
    }
  };

  workGroupEl.addEventListener("change", refresh);
  refresh();
  bindScheduleFormUploadTabs();
}

const RESOURCE_FILE_MAX_BYTES = 30 * 1024 * 1024;
const SHARED_MATERIAL_CATS = ["지침", "서식", "집행기준", "스타일"];

function extractGoogleDriveFileId(url = "") {
  const u = String(url).trim();
  if (!u) return "";
  const byPath = u.match(/\/file\/d\/([^/?#]+)/);
  if (byPath) return byPath[1];
  const byQuery = u.match(/[?&]id=([^&]+)/);
  if (byQuery) return byQuery[1];
  return "";
}

function isGoogleDriveFolderUrl(url = "") {
  return /\/drive\/(?:u\/\d+\/)?folders\//i.test(String(url));
}

function resourceDownloadMeta(resource = {}) {
  const fileName = String(resource.fileName || resource.title || "download").trim() || "download";
  if (resource.dataUrl) {
    return { href: resource.dataUrl, download: fileName };
  }
  const url = String(resource.url || "").trim();
  if (!url) return { href: "#", download: "" };
  if (isGoogleDriveFolderUrl(url)) {
    return { href: url, download: "", external: true };
  }
  const fileId = extractGoogleDriveFileId(url);
  if (fileId) {
    return {
      href: `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`,
      download: fileName,
    };
  }
  if (/^data:/i.test(url)) {
    return { href: url, download: fileName };
  }
  return { href: url, download: fileName };
}

function resourceDownloadLinkHtml(resource, label = "다운로드", className = "btn btn-sm btn-primary") {
  const meta = resourceDownloadMeta(resource);
  const dl = meta.download ? ` download="${escapeAttr(meta.download)}"` : "";
  const ext = meta.external ? ` target="_blank" rel="noopener noreferrer"` : "";
  return `<a class="${className}" href="${escapeAttr(meta.href)}"${dl}${ext}>${escapeHtml(label)}</a>`;
}

function normalizeResourceEntry(resource = {}) {
  if (!resource || typeof resource !== "object") return resource;
  if (resource.dataUrl && !resource.url) resource.url = resource.dataUrl;
  if (!resource.fileName && resource.title) resource.fileName = resource.title;
  return resource;
}

function bindResourceFileAutofill() {
  const fileInput = $("#modalBody")?.querySelector('input[name="file"]');
  if (!fileInput || fileInput.dataset.bound) return;
  fileInput.dataset.bound = "1";
  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    const form = $("#modalForm");
    const titleInput = form?.querySelector('[name="title"]');
    const fileNameInput = form?.querySelector('[name="fileName"]');
    const baseName = file.name.replace(/\.[^.]+$/, "");
    if (titleInput && !titleInput.value.trim()) titleInput.value = baseName;
    if (fileNameInput && !fileNameInput.value.trim()) fileNameInput.value = file.name;
  });
}

function ensureSharedResources() {
  if (!Array.isArray(state.resources)) state.resources = [];
  state.resources = state.resources.map((r) => normalizeResourceEntry(r));
  const hasDef = state.resources.some((r) => r.category === "정의서" || /정의서/.test(r.title || ""));
  if (!hasDef) {
    state.resources.push({
      id: uid("r"),
      title: "용어·지표 정의서",
      category: "정의서",
      url: "https://drive.google.com/file/d/example-glossary",
      fileName: "용어_지표_정의서.pdf",
      uploadedAt: today(),
      note: "핵심 용어·성과지표 정의",
    });
  }
}

function sharedSetupResources() {
  ensureSharedResources();
  const order = Object.fromEntries(SHARED_MATERIAL_CATS.map((c, i) => [c, i]));
  return [...state.resources]
    .filter((r) => {
      const c = String(r.category || "");
      if (SHARED_MATERIAL_CATS.includes(c)) return true;
      return /지침|가이드|서식|정의|집행|스타일/i.test(`${r.title || ""} ${r.note || ""} ${c}`);
    })
    .sort((a, b) => (order[a.category] ?? 99) - (order[b.category] ?? 99) || String(a.title).localeCompare(String(b.title), "ko"));
}

const DRIVE_LIBRARY_CATS = ["지침", "서식", "스타일", "집행기준", "기타"];

function libraryResources() {
  ensureSharedResources();
  const order = Object.fromEntries(DRIVE_LIBRARY_CATS.map((c, i) => [c, i]));
  return [...state.resources].sort(
    (a, b) =>
      (order[a.category] ?? 99) - (order[b.category] ?? 99) ||
      String(a.title || "").localeCompare(String(b.title || ""), "ko")
  );
}

function scheduleLinkedIds(s) {
  return Array.isArray(s?.linkedResourceIds) ? s.linkedResourceIds.map(String).filter(Boolean) : [];
}

function scheduleLinkedResources(s) {
  const ids = new Set(scheduleLinkedIds(s));
  if (!ids.size) return [];
  ensureSharedResources();
  return state.resources.filter((r) => ids.has(String(r.id)));
}

function scheduleLinkedDocsHtml(s, { compact = false } = {}) {
  const docs = scheduleLinkedResources(s);
  if (!docs.length) return "";
  return `
    <div class="tf-linked-docs ${compact ? "is-compact" : ""}" data-linked-docs>
      ${docs
        .map(
          (r) =>
            `${resourceDownloadLinkHtml(r, compact ? r.category || "문서" : r.title || "열람", "tf-linked-doc")}`
        )
        .join("")}
    </div>`;
}

function driveDocPickerHtml(selectedIds = []) {
  const selected = new Set((selectedIds || []).map(String));
  const rows = libraryResources();
  if (!rows.length) {
    return `<p class="muted wp-form-hint">아직 올린 자료가 없습니다. Setting · 드라이브에서 지침·서식·스타일가이드를 먼저 올려 주세요.</p>`;
  }
  return `
    <div class="drive-doc-picker" id="driveDocPicker">
      ${rows
        .map(
          (r) => `
        <label class="drive-doc-pick ${selected.has(String(r.id)) ? "is-on" : ""}">
          <input type="checkbox" name="linkedResources" value="${escapeAttr(r.id)}" ${
            selected.has(String(r.id)) ? "checked" : ""
          } />
          <span class="badge">${escapeHtml(r.category || "자료")}</span>
          <strong>${escapeHtml(r.title || r.fileName || "자료")}</strong>
        </label>`
        )
        .join("")}
    </div>`;
}

function bindDriveDocPicker(root = document) {
  root.querySelectorAll(".drive-doc-pick").forEach((label) => {
    const box = label.querySelector('input[name="linkedResources"]');
    const sync = () => label.classList.toggle("is-on", Boolean(box?.checked));
    box?.addEventListener("change", sync);
    label.addEventListener("click", (e) => e.stopPropagation());
  });
}

function openSharedMaterialsModal(scheduleItem) {
  const items = sharedSetupResources();
  const byCat = {};
  SHARED_MATERIAL_CATS.forEach((c) => {
    byCat[c] = [];
  });
  items.forEach((r) => {
    const c = SHARED_MATERIAL_CATS.includes(r.category) ? r.category : "서식";
    if (!byCat[c]) byCat[c] = [];
    byCat[c].push(r);
  });

  openModal({
    kicker: "킥오프 공유 자료",
    title: scheduleItem?.title || "서식 · 지침 · 집행기준 · 스타일",
    hideFooter: true,
    bodyHtml: `
      <p class="schedule-comment-lead">관리자가 공유한 지침·서식·집행기준·스타일 가이드입니다. 바로 다운로드해 확인하세요.</p>
      <div class="shared-materials">
        ${SHARED_MATERIAL_CATS.map((cat) => {
          const rows = byCat[cat] || [];
          return `
            <section class="shared-mat-block">
              <h3 class="shared-mat-cat">${escapeHtml(cat)}</h3>
              ${
                rows.length
                  ? `<ul class="shared-mat-list">${rows
                      .map(
                        (r) => `
                    <li class="shared-mat-item">
                      <div class="shared-mat-copy">
                        <strong>${escapeHtml(r.title)}</strong>
                        <span class="muted">${escapeHtml(r.fileName || "")}${r.note ? ` · ${escapeHtml(r.note)}` : ""}</span>
                        ${
                          r.dataUrl || extractGoogleDriveFileId(r.url)
                            ? `<span class="shared-mat-ready muted"> · 다운로드 링크 자동 제공</span>`
                            : ""
                        }
                      </div>
                      ${resourceDownloadLinkHtml(r)}
                    </li>`
                      )
                      .join("")}</ul>`
                  : `<p class="shared-mat-empty muted">등록된 ${escapeHtml(cat)} 자료가 없습니다.</p>`
              }
            </section>`;
        }).join("")}
      </div>
    `,
    onSubmit: null,
  });
}

function scheduleCommentsOf(s) {
  if (!s) return [];
  if (!Array.isArray(s.comments)) s.comments = [];
  return s.comments;
}

function formatCommentStamp(iso) {
  const raw = String(iso || "").trim();
  if (!raw) return "";
  return raw.slice(0, 16).replace("T", " ");
}

function openScheduleCommentModal(scheduleId) {
  const item = state.schedule.find((s) => s.id === scheduleId);
  if (!item) return;
  const who = currentUserName();

  const bodyHtml = () => {
    const comments = scheduleCommentsOf(item);
    return `
      <p class="schedule-comment-lead">${escapeHtml(who)}님 이름으로 의견을 남깁니다. 로그인 사용자 모두 작성·답변할 수 있습니다.</p>
      <div class="schedule-comment-thread" id="scheduleCommentThread">
        ${
          comments.length
            ? comments
                .map(
                  (c) => `
            <article class="schedule-comment-card">
              <header>
                <strong>${escapeHtml(c.author || "사용자")}</strong>
                <time>${escapeHtml(formatCommentStamp(c.createdAt))}</time>
              </header>
              <p>${escapeHtml(c.text || "")}</p>
              ${
                isAdmin() || c.author === who
                  ? `<button type="button" class="btn btn-sm btn-ghost" data-del-sched-comment="${escapeAttr(c.id)}">삭제</button>`
                  : ""
              }
            </article>`
                )
                .join("")
            : `<div class="schedule-comment-empty">아직 코멘트가 없습니다. 아래에서 의견을 남겨 주세요.</div>`
        }
      </div>
      <div class="schedule-comment-composer">
        <textarea id="scheduleCommentInput" class="wp-input" rows="3" placeholder="의견을 입력하세요"></textarea>
        <button type="button" class="btn btn-primary schedule-comment-post" id="scheduleCommentPost">등록</button>
      </div>
    `;
  };

  const wire = () => {
    $("#scheduleCommentPost")?.addEventListener("click", () => {
      const input = $("#scheduleCommentInput");
      const text = (input?.value || "").trim();
      if (!text) {
        alert("의견을 입력해 주세요.");
        return;
      }
      scheduleCommentsOf(item).unshift({
        id: uid("sc"),
        author: who,
        text,
        createdAt: new Date().toISOString(),
      });
      item.comments = item.comments.slice(0, 100);
      persist();
      $("#modalBody").innerHTML = bodyHtml();
      wire();
      refreshActiveScheduleSurface();
    });
    $$("#modalBody [data-del-sched-comment]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!confirm("이 코멘트를 삭제할까요?")) return;
        item.comments = scheduleCommentsOf(item).filter((c) => c.id !== btn.dataset.delSchedComment);
        persist();
        $("#modalBody").innerHTML = bodyHtml();
        wire();
        refreshActiveScheduleSurface();
      });
    });
  };

  openModal({
    title: item.title || "일정",
    kicker: "일정 코멘트",
    hideFooter: true,
    bodyHtml: bodyHtml(),
    onSubmit: null,
  });
  wire();
}

function scheduleByMonth(items) {
  const byMonth = {};
  (items || []).forEach((s) => {
    const key = (scheduleDueIso(s) || "").slice(0, 7);
    if (!key) {
      if (!byMonth.__none) byMonth.__none = [];
      byMonth.__none.push(s);
      return;
    }
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(s);
  });
  return byMonth;
}

function scheduleByDept(items) {
  const map = new Map();
  (items || []).forEach((s) => {
    const key = String(s.dept || s.division || "미분류").trim() || "미분류";
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(s);
  });
  map.forEach((rows) => {
    rows.sort((a, b) => {
      const da = scheduleDueIso(a);
      const db = scheduleDueIso(b);
      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      return da.localeCompare(db);
    });
  });
  const order = [...new Set([...(BUDGET_CATALOG.depts || []), ...(BUDGET_CATALOG.workDepts || [])])];
  const keys = [...map.keys()].sort((a, b) => {
    const ia = order.indexOf(a);
    const ib = order.indexOf(b);
    if (ia >= 0 && ib >= 0) return ia - ib;
    if (ia >= 0) return -1;
    if (ib >= 0) return 1;
    if (a === "미분류") return 1;
    if (b === "미분류") return -1;
    return a.localeCompare(b, "ko");
  });
  return { map, keys };
}

function scheduleByGroup(items) {
  const map = {};
  SCHEDULE_GROUP_OPTIONS.forEach((g) => {
    map[g.id] = [];
  });
  items.forEach((s) => {
    const gid = scheduleGroupOf(s);
    if (!map[gid]) map[gid] = [];
    map[gid].push(s);
  });
  return map;
}

const NEXT_ACT_META = [
  { id: "confirm", label: "확인", hint: "지침·할당·요청" },
  { id: "submit", label: "제출", hint: "열린 취합 업로드" },
  { id: "reflect", label: "반영", hint: "피드백·코멘트" },
  { id: "attend", label: "참석", hint: "킥오프·리뷰회의" },
];

function scheduleHasOthersComment(s, who = sessionUser) {
  return scheduleCommentsOf(s).some((c) => (c.author || "") && c.author !== who);
}

function memberNextActionOf(s, who = sessionUser) {
  if (!s || (s.status || "") === "완료") return "";
  const group = scheduleGroupOf(s);
  const title = String(s.title || "");
  if (scheduleHasOthersComment(s, who)) return "reflect";
  if (group === "collect") {
    const phase = collectionPhaseOf(collectionBySchedule(s));
    if (phase === "open") return "submit";
    if (phase === "closed") return "reflect";
    return "confirm";
  }
  if (group === "forms") {
    if (s.type === "meeting" || /킥오프|회의/.test(title)) return "attend";
    return "confirm";
  }
  if (group === "review" || group === "committee" || s.type === "meeting") return "attend";
  if (group === "budget" || group === "kpi") return "confirm";
  if (scheduleOriginOf(s, who).kind === "received") return "confirm";
  return "confirm";
}

function myPartSummaryLine() {
  if (isAdmin()) return "전체 현황을 봅니다";
  const ids = myPartIds();
  if (!ids.length) return "담당 파트를 배정받는 중";
  const parts = ids.map((id) => partById(id)).filter(Boolean);
  const labels = parts
    .slice(0, 2)
    .map((p) => `${p.section || ""}. ${p.title || ""}`.replace(/^\.\s*/, "").trim());
  const extra = parts.length > 2 ? ` 외 ${parts.length - 2}` : "";
  return `내 파트 ${labels.join(" · ")}${extra}`;
}

function nowStageAndPartLine() {
  const mile = milestoneProgressFromState();
  const now = (mile.points || []).find((p) => p.state === "now");
  const stage = now?.label || now?.short || "일정 준비";
  return `${formatReportDeadlineWhen()}까지 · 지금 열린 단계 ${stage} · ${myPartSummaryLine()}`;
}

function emptyMyWorkCopy(admin, act) {
  if (act === "submit") return "아직 취합 공지가 열리지 않았습니다. 공지가 열리면 여기에 제출이 생깁니다.";
  if (act === "reflect") return "반영할 피드백이 없습니다.";
  if (act === "attend") return "참석할 회의가 없습니다.";
  if (act === "confirm") return "지금 확인할 요청이 없습니다.";
  return admin
    ? "보낸 요청이 없습니다. Setting · TF 일정에서 등록하세요."
    : "받은 요청이 없습니다.";
}

function todayActBarHtml(who, items) {
  const act = state._myWorkAct || "all";
  const counts = { confirm: 0, submit: 0, reflect: 0, attend: 0 };
  items.forEach((s) => {
    const k = memberNextActionOf(s, who);
    if (k && counts[k] != null) counts[k] += 1;
  });
  const reqN = myPendingRequests().length;
  counts.confirm += reqN;
  const reviewN = myCommentFeedItems().filter((i) => i.kind === "review").length;
  counts.reflect += reviewN;
  const extras = [];
  if ((act === "all" || act === "confirm") && reqN) {
    extras.push(
      `<button type="button" class="today-act-jump" data-goto="requests">받은 요청 ${reqN}건 확인</button>`
    );
  }
  if ((act === "all" || act === "reflect") && reviewN) {
    extras.push(
      `<button type="button" class="today-act-jump" data-goto="collections">내 파트 리뷰 ${reviewN}건 보기</button>`
    );
  }
  return `
    <div class="today-act" aria-label="오늘 할 일">
      <p class="today-act-kicker">오늘 나, 뭘 하면 되지?</p>
      <p class="today-act-line">${escapeHtml(nowStageAndPartLine())}</p>
      <div class="today-act-chips" role="group" aria-label="할 일 종류">
        ${NEXT_ACT_META.map((m) => {
          const n = counts[m.id] || 0;
          const on = act === m.id;
          return `<button type="button" class="today-act-chip ${on ? "is-on" : ""} ${n ? "has-n" : ""}" data-work-act="${m.id}" title="${escapeAttr(m.hint)}">${escapeHtml(m.label)} <em>${n}</em></button>`;
        }).join("")}
      </div>
      ${extras.length ? `<div class="today-act-extras">${extras.join("")}</div>` : ""}
    </div>`;
}

function myWorkTimelineRowHtml(s, index, rows) {
  const due = scheduleDueIso(s);
  const prev = rows[index - 1];
  const monthKey = due ? due.slice(0, 7) : "";
  const prevMonth = prev ? (scheduleDueIso(prev) || "").slice(0, 7) : null;
  const showMonth = index === 0 || monthKey !== prevMonth;
  const status = s.status || "준비";
  const tone = tfStatusTone(status);
  const overdue = status !== "완료" && due && due < today();
  const groupId = scheduleGroupOf(s);
  const partsLine = groupId === "collect" && !isAdmin() ? myAssignedPartsLine() : "";
  const days = due ? daysUntil(due) : null;
  const timing = days == null ? "" : timingLabel(days);
  return `
    <li>
      ${showMonth ? `<p class="tf-timeline-month">${escapeHtml(formatKorYearMonth(due))}</p>` : ""}
      <div class="tf-timeline-row is-work tone-${tone}${overdue ? " is-overdue" : ""}" data-open-upload="${escapeAttr(s.id)}" role="button" tabindex="0">
        <span class="tf-timeline-rail" aria-hidden="true"><i></i></span>
        <span class="tf-timeline-due">
          <em>마감일정</em>
          <strong>${escapeHtml(due ? formatKorDate(due) : "날짜 미정")}</strong>
          ${timing ? `<span class="tf-sched-timing">${escapeHtml(timing)}</span>` : ""}
        </span>
        <span class="tf-timeline-title">
          <em>업무명</em>
          <strong>${escapeHtml(s.title)}</strong>
          ${partsLine ? `<span class="tf-timeline-dept">${escapeHtml(partsLine)}</span>` : ""}
          ${scheduleLinkedDocsHtml(s, { compact: true })}
        </span>
        <span class="tf-timeline-status">
          <em>진행현황</em>
          <span class="status-select status-${tone}">${escapeHtml(status)}</span>
        </span>
      </div>
    </li>`;
}

function scheduleFeedPanelHtml(who, admin, items) {
  const sorted = [...(items || [])].sort((a, b) => {
    const da = scheduleDueIso(a);
    const db = scheduleDueIso(b);
    if (!da && !db) return 0;
    if (!da) return 1;
    if (!db) return -1;
    return da.localeCompare(db);
  });
  const { map: byDept, keys: deptKeys } = scheduleByDept(sorted);

  const deptSections = deptKeys
    .map((dept) => {
      const rows = byDept.get(dept) || [];
      if (!rows.length) return "";
      const byMonth = scheduleByMonth(rows);
      const months = Object.keys(byMonth)
        .filter((k) => k !== "__none")
        .sort((a, b) => b.localeCompare(a));
      const monthHtml = months
        .map((ym) => {
          const monthLabel = formatKorYearMonth(`${ym}-01`);
          return `
          <div class="work-month-chunk">
            <p class="work-month-label">${escapeHtml(monthLabel)}</p>
            <div class="work-feed">${byMonth[ym].map((s) => workFeedRowHtml(s, admin)).join("")}</div>
          </div>`;
        })
        .join("");
      const undated =
        byMonth.__none?.length
          ? `<div class="work-month-chunk">
              <p class="work-month-label">날짜 미정</p>
              <div class="work-feed">${byMonth.__none.map((s) => workFeedRowHtml(s, admin)).join("")}</div>
            </div>`
          : "";
      return `
      <article class="work-group-card">
        <header class="work-group-card-head">
          <h3>${escapeHtml(dept)}</h3>
          <span class="muted">${rows.length}건 · ${escapeHtml(dept)}</span>
        </header>
        <div class="work-group-card-body">
          ${monthHtml}${undated}
        </div>
      </article>`;
    })
    .join("");

  return `
    <section class="panel work-feed-panel mywork-schedule-panel">
      <header class="tf-timeline-hero">
        <h2>${escapeHtml(admin ? `${who}님이 보낸 요청입니다` : `${who}님, 받은 요청입니다`)}</h2>
        ${
          admin
            ? `<button type="button" class="request-add-btn" id="addSchedule" title="업무 등록하기" aria-label="업무 등록하기">
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                  <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm17.71-10.21a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                </svg>
              </button>`
            : ""
        }
      </header>
      ${
        sorted.length
          ? `<div class="work-group-stack">${deptSections}</div>`
          : `<div class="empty">${escapeHtml(emptyMyWorkCopy(admin, "all"))}</div>`
      }
    </section>`;
}

function bindScheduleFeedActions(root, onRefresh, { onOpenItem } = {}) {
  root.querySelector("#addSchedule")?.addEventListener("click", () => {
    if (!isAdmin()) {
      denySchedulePermission("보고서 업무 추가는 관리자만 가능합니다.");
      return;
    }
    openScheduleModal();
  });

  root.querySelectorAll("[data-work-act]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const next = btn.dataset.workAct || "all";
      state._myWorkAct = state._myWorkAct === next ? "all" : next;
      onRefresh?.();
    });
  });
  root.querySelectorAll("[data-goto]").forEach((btn) => {
    btn.addEventListener("click", () => setView(btn.dataset.goto));
  });

  root.querySelectorAll("[data-work-group]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state._myWorkGroup = btn.dataset.workGroup || "all";
      onRefresh?.();
    });
  });
  root.querySelectorAll("[data-work-collab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state._myWorkCollab = btn.dataset.workCollab || "all";
      onRefresh?.();
    });
  });

  root.querySelectorAll("[data-edit]").forEach((btn) =>
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const item = state.schedule.find((s) => s.id === btn.dataset.edit);
      if (!canEditScheduleItem(item)) {
        denySchedulePermission();
        return;
      }
      openScheduleModal(btn.dataset.edit);
    })
  );
  root.querySelectorAll("[data-del]").forEach((btn) =>
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const item = state.schedule.find((s) => s.id === btn.dataset.del);
      if (!canEditScheduleItem(item)) {
        denySchedulePermission();
        return;
      }
      if (!confirm("삭제하시겠습니까?")) return;
      state.schedule = state.schedule.filter((s) => s.id !== btn.dataset.del);
      persist();
      onRefresh?.();
    })
  );
  root.querySelectorAll("[data-status]").forEach((sel) => {
    sel.addEventListener("change", () => {
      const item = state.schedule.find((s) => s.id === sel.dataset.status);
      if (!item) return;
      item.status = sel.value;
      persist();
      onRefresh?.();
    });
  });

  root.querySelectorAll("[data-comment]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      openScheduleCommentModal(btn.dataset.comment);
    });
  });

  root.querySelectorAll(".swipe-row[data-schedule-id]").forEach((row) => {
    bindScheduleSwipeRow(row, onRefresh, onOpenItem);
  });

  root.querySelectorAll("[data-linked-docs] a").forEach((a) => {
    a.addEventListener("click", (e) => e.stopPropagation());
  });

  root.querySelectorAll(".task-row.is-simple[data-open-upload], .tf-timeline-row[data-open-upload]").forEach((el) => {
    const open = () => {
      const item = state.schedule.find((s) => s.id === el.dataset.openUpload);
      if (typeof onOpenItem === "function") {
        onOpenItem(item);
        return;
      }
      openScheduleUploadForItem(item);
    };
    el.addEventListener("click", (e) => {
      if (e.target.closest("[data-linked-docs]")) return;
      open();
    });
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    });
  });
}

function bindScheduleSwipeRow(row, onRefresh, onOpenItem) {
  const id = row.dataset.scheduleId;
  const front = row.querySelector(".swipe-front");
  const task = row.querySelector(".task-row");
  if (!front || !task) return;

  let startX = 0;
  let startY = 0;
  let dx = 0;
  let dragging = false;
  let locked = null; // 'h' | 'v'
  const THRESH = 78;
  const MAX = 128;

  const setOffset = (x) => {
    dx = Math.max(-MAX, Math.min(MAX, x));
    front.style.transform = `translateX(${dx}px)`;
    row.classList.toggle("is-swiping-edit", dx > 10);
    row.classList.toggle("is-swiping-delete", dx < -10);
    row.classList.toggle("is-armed-edit", dx >= THRESH);
    row.classList.toggle("is-armed-delete", dx <= -THRESH);
  };
  const reset = () => {
    front.style.transition = "transform 180ms ease";
    setOffset(0);
    window.setTimeout(() => {
      front.style.transition = "";
    }, 200);
    row.classList.remove("is-swiping-edit", "is-swiping-delete", "is-armed-edit", "is-armed-delete");
  };

  const openEdit = () => {
    const item = state.schedule.find((s) => s.id === id);
    if (!canEditScheduleItem(item)) {
      denySchedulePermission();
      return;
    }
    openScheduleModal(id);
  };
  const openDelete = () => {
    const item = state.schedule.find((s) => s.id === id);
    if (!canEditScheduleItem(item)) {
      denySchedulePermission();
      return;
    }
    if (!confirm("삭제하시겠습니까?")) return;
    state.schedule = state.schedule.filter((s) => s.id !== id);
    persist();
    onRefresh?.();
  };

  const onPointerDown = (e) => {
    if (e.target.closest("select, button, a, input")) return;
    startX = e.clientX;
    startY = e.clientY;
    dx = 0;
    dragging = true;
    locked = null;
    front.style.transition = "none";
    try {
      front.setPointerCapture?.(e.pointerId);
    } catch {
      /* ignore */
    }
  };
  const onPointerMove = (e) => {
    if (!dragging) return;
    const mx = e.clientX - startX;
    const my = e.clientY - startY;
    if (!locked) {
      if (Math.abs(mx) < 6 && Math.abs(my) < 6) return;
      locked = Math.abs(mx) > Math.abs(my) ? "h" : "v";
      if (locked === "v") {
        dragging = false;
        reset();
        return;
      }
    }
    if (locked !== "h") return;
    e.preventDefault();
    setOffset(mx);
  };
  const onPointerUp = (e) => {
    if (!dragging && locked !== "h") {
      dragging = false;
      return;
    }
    dragging = false;
    const item = state.schedule.find((s) => s.id === id);
    const moved = Math.abs(dx);
    const wasTap = moved < 12 && Math.abs((e.clientY || startY) - startY) < 12;

    if (dx >= THRESH) {
      reset();
      openEdit();
      return;
    }
    if (dx <= -THRESH) {
      reset();
      openDelete();
      return;
    }

    reset();
    if (wasTap && locked !== "v") {
      if (typeof onOpenItem === "function") onOpenItem(item);
      else openScheduleUploadForItem(item);
    }
  };

  front.addEventListener("pointerdown", onPointerDown);
  front.addEventListener("pointermove", onPointerMove);
  front.addEventListener("pointerup", onPointerUp);
  front.addEventListener("pointercancel", () => {
    dragging = false;
    reset();
  });
}

function refreshActiveScheduleSurface() {
  updateAlarmButtons();
  if (activeViewName === "my-work") renderMyWork();
  else if (activeViewName === "schedule") renderSchedule();
  else if (activeViewName === "dashboard") renderDashboard();
  else renderView(activeViewName || "my-work");
}

function scheduleCommentBubbleText(s) {
  const comments = scheduleCommentsOf(s);
  if (!comments.length) return "";
  const latest = comments[0];
  const author = latest.author || "관리자";
  const preview = String(latest.text || "").trim().replace(/\s+/g, " ").slice(0, 42);
  if (preview) return `${author}가 코멘트를 남겼어요! ${preview}${String(latest.text || "").trim().length > 42 ? "…" : ""}`;
  return `${author}가 코멘트 확인을 요청했어요!`;
}

function workFeedRowHtml(s, admin) {
  const canManage = canEditScheduleItem(s);
  const days = daysUntil(s.endDate || s.date);
  const bucket = scheduleBucket(s);
  const urgency = scheduleUrgency(s);
  const glowLabel =
    bucket === "overdue" ? "지연" : bucket === "today" ? "오늘까지" : bucket === "week" ? "이번주" : "";
  const origin = scheduleOriginOf(s, sessionUser);
  const people = scheduleAssigneesOf(s);
  const collabNames = people.length ? `협업 ${people.slice(0, 4).join(", ")}${people.length > 4 ? " 외" : ""}` : "";
  const yoy = scheduleYoyHint(s);
  const metaBits = [
    glowLabel || (bucket === "month" ? "이번달" : "일정"),
    yoy.text && yoy.text !== "작년 대비 자료 없음" ? yoy.text : "",
    collabNames || "협업 미지정",
    days < 0 ? `${Math.abs(days)}일 지남` : days === 0 ? "오늘" : `${days}일 남음`,
  ].filter(Boolean);
  const statusTone =
    (s.status || "준비") === "완료" ? "done" : (s.status || "준비") === "진행" ? "active" : "planned";
  const commentCount = scheduleCommentsOf(s).length;
  const typeName = typeLabel(s.type);
  const groupId = scheduleGroupOf(s);
  const groupName = scheduleGroupLabel(groupId);
  const timing =
    days < 0 ? `${Math.abs(days)}일 지남` : days === 0 ? "오늘" : `${days}일 남음`;

  if (!isAdmin()) {
    const partsLine = groupId === "collect" ? myAssignedPartsLine() : "";
    return `
    <div class="work-task-wrap">
      <article class="task-row is-simple tone-${statusTone}" data-open-upload="${escapeAttr(s.id)}" role="button" tabindex="0">
        <div class="task-row-main">
          <p class="task-title"><span class="task-title-text">${escapeHtml(s.title)}</span></p>
          <p class="task-meta">${escapeHtml([partsLine, timing].filter(Boolean).join(" · "))}</p>
        </div>
        <span class="due-cluster ${glowLabel === "지연" ? "is-overdue" : ""}">
          ${glowLabel ? `<span class="remind-title-glow due-glow">${escapeHtml(glowLabel)}</span>` : ""}
          <span class="due-badge">${escapeHtml(formatKorDate(s.endDate || s.date))}</span>
        </span>
      </article>
    </div>`;
  }

  return `
    <div class="work-task-wrap">
    <div class="swipe-row has-edit-handle has-delete-handle can-manage" data-schedule-id="${escapeAttr(s.id)}">
      <div class="swipe-action swipe-action-edit" aria-hidden="true">
        <span class="swipe-action-main">수정하기</span>
      </div>
      <div class="swipe-action swipe-action-delete" aria-hidden="true">
        <span class="swipe-action-main">삭제</span>
      </div>
      <div class="swipe-front">
        <button type="button" class="swipe-edge swipe-edge-edit" data-edit="${s.id}" title="오른쪽으로 밀어 수정" aria-label="수정">
          <span class="swipe-edge-arrow" aria-hidden="true">›</span>
          <span class="swipe-edge-label">수정</span>
        </button>
        <article class="task-row tone-${statusTone}" data-open-upload="${escapeAttr(s.id)}" role="button" tabindex="0">
          <span class="origin-stack">
            ${origin.from ? `<span class="from-owner">${escapeHtml(origin.from)}</span>` : ""}
            <span class="origin-tag ${origin.tone}">${escapeHtml(origin.tag)}</span>
          </span>
          <div class="task-row-main">
            <p class="task-title">
              <span class="task-title-text">${escapeHtml(s.title)}</span>
              ${s.dept ? `<span class="kind-tag pill-blue">${escapeHtml(s.dept)}</span>` : ""}
              ${s.owner || s.createdBy ? `<span class="kind-tag pill-blue">${escapeHtml(s.owner || s.createdBy)}</span>` : ""}
              ${s.project ? `<span class="kind-tag pill-blue">${escapeHtml(s.project)}</span>` : ""}
              <span class="kind-tag pill-violet">${escapeHtml(groupName)}</span>
              <span class="kind-tag pill-violet">${escapeHtml(typeName)}</span>
              ${
                urgency === "check"
                  ? `<span class="kind-tag check-tag">✓ 체크</span>`
                  : urgency === "warn"
                    ? `<span class="kind-tag warn-tag">주의</span>`
                    : ""
              }
            </p>
            <p class="task-meta">${escapeHtml(metaBits.join(" · "))}</p>
          </div>
          <span class="due-cluster ${glowLabel === "지연" ? "is-overdue" : ""}">
            ${
              glowLabel
                ? `<span class="remind-title-glow due-glow">${escapeHtml(glowLabel)}</span>`
                : ""
            }
            <span class="due-badge">${escapeHtml(formatKorDate(s.endDate || s.date))}</span>
          </span>
          <select class="status-select status-${statusTone}" data-status="${s.id}">
            ${["준비", "진행", "완료"]
              .map((st) => `<option value="${st}" ${(s.status || "준비") === st ? "selected" : ""}>${st}</option>`)
              .join("")}
          </select>
          <button type="button" class="task-comment-btn ${commentCount ? "has-count" : ""}" data-comment="${escapeAttr(s.id)}" title="코멘트" aria-label="코멘트 ${commentCount}개">
            <span class="task-comment-icon" aria-hidden="true"></span>
            <span class="task-comment-count">${commentCount || "0"}</span>
          </button>
        </article>
        <button type="button" class="swipe-edge swipe-edge-delete" data-del="${s.id}" title="왼쪽으로 밀어 삭제" aria-label="삭제">
          <span class="swipe-edge-arrow" aria-hidden="true">‹</span>
          <span class="swipe-edge-label">삭제</span>
        </button>
      </div>
    </div>
    </div>`;
}

function renderDrive() {
  const el = $("#view-drive");
  if (!el) return;
  ensureSharedResources();
  const filter = DRIVE_LIBRARY_CATS.includes(state._driveLibFilter) ? state._driveLibFilter : "all";
  state._driveLibFilter = filter;
  const lib = libraryResources();
  const shown = filter === "all" ? lib : lib.filter((r) => r.category === filter);
  const admin = isAdmin();

  el.innerHTML = `
    <div class="drive-page">
      <div class="panel">
        <div class="panel-head">
          <div>
            <h2 class="panel-title">지침 · 서식 · 스타일가이드</h2>
            <p class="muted" style="margin:4px 0 0">여기에 올려 두면 할 일 입력 때 꺼내 연결하고, 담당자가 바로 열람할 수 있습니다.</p>
          </div>
          ${admin ? `<button type="button" class="btn btn-primary" id="addResource">자료 올리기</button>` : ""}
        </div>
        <div class="drive-lib-tabs" role="tablist" aria-label="자료 분류">
          <button type="button" class="kpi-scope-tab ${filter === "all" ? "is-on" : ""}" data-drive-filter="all">전체 <em>${lib.length}</em></button>
          ${DRIVE_LIBRARY_CATS.map((c) => {
            const n = lib.filter((r) => r.category === c).length;
            return `<button type="button" class="kpi-scope-tab ${filter === c ? "is-on" : ""}" data-drive-filter="${escapeAttr(c)}">${escapeHtml(c === "스타일" ? "스타일가이드" : c)} <em>${n}</em></button>`;
          }).join("")}
        </div>
        <div class="grid grid-2">
          ${
            shown.length
              ? shown
                  .map(
                    (r) => `
            <article class="resource-card">
              <div class="row">
                <span class="badge">${escapeHtml(r.category === "스타일" ? "스타일가이드" : r.category || "자료")}</span>
                <span class="muted">${escapeHtml(r.uploadedAt || "")}</span>
              </div>
              <strong>${escapeHtml(r.title)}</strong>
              <p class="muted">${escapeHtml(r.fileName || "")}${r.note ? ` · ${escapeHtml(r.note)}` : ""}</p>
              <div class="card-meta">
                ${resourceDownloadLinkHtml(r, "열람")}
                ${
                  admin
                    ? `<div class="row">
                  <button type="button" class="btn btn-sm" data-res-edit="${escapeAttr(r.id)}">수정</button>
                  <button type="button" class="btn btn-sm btn-danger" data-res-del="${escapeAttr(r.id)}">삭제</button>
                </div>`
                    : ""
                }
              </div>
            </article>`
                  )
                  .join("")
              : `<div class="empty" style="grid-column:1/-1">${
                  filter === "all" ? "올린 자료가 없습니다. 「자료 올리기」로 지침·서식·스타일가이드를 등록하세요." : "이 분류의 자료가 없습니다."
                }</div>`
          }
        </div>
      </div>

      <div class="panel">
        <div class="panel-head">
          <h2 class="panel-title">구글드라이브 바로가기</h2>
          ${admin ? `<button type="button" class="btn btn-primary" id="addDrive">링크 등록</button>` : ""}
        </div>
        <div class="grid grid-3">
          ${
            state.driveLinks.length
              ? state.driveLinks
                  .map(
                    (d) => `
              <div class="link-card">
                <span class="badge">${escapeHtml(d.category || "링크")}</span>
                <a href="${escapeAttr(d.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(d.title)}</a>
                <p class="muted">${escapeHtml(d.note || "")}</p>
                <div class="card-meta">
                  <a class="btn btn-sm btn-primary" href="${escapeAttr(d.url)}" target="_blank" rel="noopener noreferrer">열기</a>
                  ${
                    admin
                      ? `<div class="row">
                    <button type="button" class="btn btn-sm" data-edit="${escapeAttr(d.id)}">수정</button>
                    <button type="button" class="btn btn-sm btn-danger" data-del="${escapeAttr(d.id)}">삭제</button>
                  </div>`
                      : ""
                  }
                </div>
              </div>`
                  )
                  .join("")
              : `<div class="empty" style="grid-column:1/-1">등록된 드라이브 링크가 없습니다.</div>`
          }
        </div>
      </div>
    </div>
  `;

  el.querySelectorAll("[data-drive-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state._driveLibFilter = btn.dataset.driveFilter;
      renderDrive();
    });
  });
  $("#addResource")?.addEventListener("click", () => openResourceModal());
  el.querySelectorAll("[data-res-edit]").forEach((btn) =>
    btn.addEventListener("click", () => openResourceModal(btn.dataset.resEdit))
  );
  el.querySelectorAll("[data-res-del]").forEach((btn) =>
    btn.addEventListener("click", () => {
      if (!confirm("이 자료를 삭제할까요?")) return;
      state.resources = state.resources.filter((r) => r.id !== btn.dataset.resDel);
      saveAndRender("drive");
    })
  );
  $("#addDrive")?.addEventListener("click", () => openDriveModal());
  el.querySelectorAll("[data-edit]").forEach((btn) =>
    btn.addEventListener("click", () => openDriveModal(btn.dataset.edit))
  );
  el.querySelectorAll("[data-del]").forEach((btn) =>
    btn.addEventListener("click", () => {
      if (!confirm("이 링크를 삭제할까요?")) return;
      state.driveLinks = state.driveLinks.filter((d) => d.id !== btn.dataset.del);
      saveAndRender("drive");
    })
  );
}

function renderResources() {
  const el = $("#view-resources");
  el.innerHTML = `
    <div class="panel">
      <div class="panel-head">
        <h2>공통 서식 · 지침 · 스타일 가이드</h2>
        <button class="btn btn-primary admin-only" id="addResource">자료 등록</button>
      </div>
      <p class="muted" style="margin-top:-0.35rem;margin-bottom:1rem">
        관리자가 올린 파일은 다운로드 링크가 자동으로 생성됩니다. 참여자는 별도 요청 없이 바로 받을 수 있습니다.
      </p>
      <div class="grid grid-2">
        ${
          state.resources.length
            ? state.resources
                .map(
                  (r) => `
            <div class="resource-card">
              <div class="row">
                <span class="badge">${escapeHtml(r.category || "자료")}</span>
                <span class="muted">${escapeHtml(r.uploadedAt || "")}</span>
              </div>
              <a href="${escapeAttr(r.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(r.title)}</a>
              <p class="muted">${escapeHtml(r.fileName || "")}${r.note ? ` · ${escapeHtml(r.note)}` : ""}</p>
              <div class="card-meta">
                ${resourceDownloadLinkHtml(r, "다운로드")}
                <div class="row admin-only">
                  <button class="btn btn-sm" data-edit="${r.id}">수정</button>
                  <button class="btn btn-sm btn-danger" data-del="${r.id}">삭제</button>
                </div>
              </div>
            </div>`
                )
                .join("")
            : `<div class="empty" style="grid-column:1/-1">등록된 공통 자료가 없습니다.</div>`
        }
      </div>
    </div>
  `;

  $("#addResource")?.addEventListener("click", () => openResourceModal());
  el.querySelectorAll("[data-edit]").forEach((btn) =>
    btn.addEventListener("click", () => openResourceModal(btn.dataset.edit))
  );
  el.querySelectorAll("[data-del]").forEach((btn) =>
    btn.addEventListener("click", () => {
      if (!confirm("이 자료를 삭제할까요?")) return;
      state.resources = state.resources.filter((r) => r.id !== btn.dataset.del);
      saveAndRender("resources");
    })
  );
}

function renderMembers() {
  if (!isAdmin()) {
    setView("dashboard");
    return;
  }
  const el = $("#view-members");
  el.innerHTML = `
    <div class="panel">
      <div class="panel-head">
        <div>
          <h2 class="panel-title">작성 대상자 관리</h2>
          <p class="muted">관리자 화면에서 보고서 작성 참여 대상자를 등록합니다.</p>
        </div>
        <div class="row">
          <button class="btn btn-ghost btn-sm" id="btnReset">샘플 복원</button>
          <button class="btn btn-primary" id="addMember">대상자 추가</button>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>이름</th>
              <th>역할</th>
              <th>담당 파트</th>
              <th>연락</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${state.members
              .map(
                (m) => `
              <tr>
                <td><strong>${escapeHtml(m.name)}</strong></td>
                <td><span class="badge ${m.role === "admin" ? "admin" : m.role === "budget" ? "meeting" : m.role === "kpi" ? "ok" : m.role === "food" ? "ok" : ""}">${roleLabel(m.role)}</span></td>
                <td>${escapeHtml(m.part || "-")}</td>
                <td class="muted">${escapeHtml(m.contact || "-")}</td>
                <td>
                  <div class="row">
                    <button class="btn btn-sm" data-edit="${m.id}">수정</button>
                    <button class="btn btn-sm btn-danger" data-del="${m.id}">삭제</button>
                  </div>
                </td>
              </tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;

  $("#addMember")?.addEventListener("click", () => openMemberModal());
  el.querySelectorAll("[data-edit]").forEach((btn) =>
    btn.addEventListener("click", () => openMemberModal(btn.dataset.edit))
  );
  el.querySelectorAll("[data-del]").forEach((btn) =>
    btn.addEventListener("click", () => {
      if (!confirm("이 구성원을 삭제할까요?")) return;
      state.members = state.members.filter((m) => m.id !== btn.dataset.del);
      saveAndRender("members");
    })
  );
}

function detailsOfItem(itemId) {
  ensureBudget();
  return state.budget.details.filter((d) => d.itemId === itemId);
}

function detailSumOfItem(itemId) {
  return detailsOfItem(itemId).reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
}

function syncItemSpentFromDetails(itemId) {
  const item = state.budget.items.find((i) => i.id === itemId);
  if (!item) return;
  const details = detailsOfItem(itemId);
  if (details.length) item.spent = detailSumOfItem(itemId);
}

function myRelatedBudgetItems() {
  ensureBudget();
  if (canManageBudget()) return state.budget.items;
  const me = currentMember();
  if (!me) return [];
  return state.budget.items.filter((i) => i.assigneeId === me.id || i.createdById === me.id);
}

function budgetDetailStats(mode = getBudgetInputMode()) {
  ensureBudget();
  const byMember = {};
  const byArea = {};
  const byItem = {};
  state.budget.items.forEach((item) => {
    const assignee = item.assigneeId ? memberById(item.assigneeId) : null;
    const who = assignee?.name || "미지정";
    const amount = budgetAmountOf(item, mode);
    if (!byMember[who]) byMember[who] = 0;
    byMember[who] += amount;
    const area = item.area || item.category || "기타";
    if (!byArea[area]) byArea[area] = { planned: 0, filled: 0 };
    byArea[area].planned += amount;
    if (budgetCalcOf(item, mode)) byArea[area].filled += 1;
    const key = budgetItemLabel(item);
    byItem[key] = amount;
  });
  const filled = state.budget.items.filter((i) => budgetCalcOf(i, mode)).length;
  return {
    byMember,
    byArea,
    byItem,
    filled,
    total: state.budget.items.reduce((s, i) => s + budgetAmountOf(i, mode), 0),
    mode,
  };
}

function csvEscape(value) {
  const s = String(value ?? "");
  return `"${s.replace(/"/g, '""')}"`;
}

function downloadBudgetExcel({ mineOnly = false } = {}) {
  ensureBudget();
  if (mineOnly) {
    if (!currentMember()) return;
  } else if (!canManageBudget()) {
    return;
  }
  const mode = getBudgetInputMode();
  const meta = budgetModeMeta(mode);
  const items = mineOnly ? myRelatedBudgetItems() : state.budget.items;
  const lines = [];
  if (!mineOnly) {
    const expenseStatus = budgetExpenseStatus(mode);
    lines.push([`[${meta.tabLabel} 입력 요약]`].map(csvEscape).join(","));
    lines.push(
      [
        "사업비총액",
        meta.enteredLabel,
        "입력비율(%)",
        meta.remainLabel,
        "확인필요비율(%)",
      ]
        .map(csvEscape)
        .join(",")
    );
    lines.push(
      [
        expenseStatus.total,
        expenseStatus.enteredTotal,
        expenseStatus.enteredPct,
        expenseStatus.remain,
        expenseStatus.remainPct,
      ]
        .map(csvEscape)
        .join(",")
    );
    lines.push("");
    lines.push([`[${meta.tableTitle}]`].map(csvEscape).join(","));
    lines.push(["비목", "현재입력액", "입력비중(%)", "총액대비(%)", "산출완료", "항목수"].map(csvEscape).join(","));
    expenseStatus.rows
      .filter((row) => row.entered > 0 || row.count > 0)
      .forEach((row) => {
        lines.push(
          [
            row.name,
            row.entered,
            row.shareEntered.toFixed(1),
            row.shareOfTotal.toFixed(1),
            row.filled,
            row.count,
          ]
            .map(csvEscape)
            .join(",")
        );
      });
    lines.push("");
  } else {
    lines.push([`[${sessionUser || "내"} ${meta.short} 항목]`].map(csvEscape).join(","));
  }
  lines.push(
    [
      "연번",
      "영역",
      "세부내용명",
      "세부과제명",
      "세부프로그램(Activity)",
      "비목",
      "담당부서",
      "실무부서",
      "편성금액",
      "세부 산출내역",
      "실적금액",
      "실적 산출내역",
      "입력담당자",
      "메모",
    ]
      .map(csvEscape)
      .join(",")
  );
  items.forEach((item) => {
    const assignee = item.assigneeId ? memberById(item.assigneeId) : null;
    lines.push(
      [
        item.no,
        item.area,
        item.content,
        item.task,
        item.activity || item.title,
        item.expenseType || "",
        item.dept,
        item.workDept,
        Number(item.planned) || 0,
        item.calcText || "",
        Number(item.spent) || 0,
        item.actualCalcText || "",
        assignee?.name || "",
        item.note || "",
      ]
        .map(csvEscape)
        .join(",")
    );
  });

  const blob = excelBlobFromLines(lines);
  const modeTag = mode === "result" ? "실적" : "예산";
  triggerBlobDownload(blob, mineOnly ? `내${modeTag}항목_${today()}.xls` : `${modeTag}_입력현황_${today()}.xls`);
}

function excelBlobFromLines(lines) {
  return new Blob(["\uFEFF" + (lines || []).join("\n")], {
    type: "application/vnd.ms-excel;charset=utf-8;",
  });
}

function triggerBlobDownload(blob, fileName) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

function appAccessUrl() {
  const loc = window.location;
  if (loc?.origin && loc.origin !== "null") {
    const path = loc.pathname && loc.pathname !== "/" ? loc.pathname.replace(/\/index\.html$/i, "/") : "/";
    return `${loc.origin}${path === "/" ? "/" : path}`;
  }
  return "https://tf-pulse.vercel.app";
}

let cachedAccessQr = "";

async function accessQrDataUrl() {
  if (cachedAccessQr) return cachedAccessQr;
  const url = appAccessUrl();
  try {
    const QRCode = (await import("https://cdn.jsdelivr.net/npm/qrcode@1.5.4/+esm")).default;
    cachedAccessQr = await QRCode.toDataURL(url, {
      width: 240,
      margin: 1,
      color: { dark: "#1d1d1f", light: "#ffffff" },
    });
  } catch {
    cachedAccessQr = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(url)}`;
  }
  return cachedAccessQr;
}

function kpiExcelLines() {
  ensureKpis();
  const lines = [["구분", "지표명", "영역", "기준값", "목표", "실적", "단위", "달성률(%)", "담당", "상태"].map(csvEscape).join(",")];
  (state.kpis || []).forEach((raw) => {
    const k = kpiSimRow(raw);
    const assignee = k.assigneeId ? memberById(k.assigneeId) : null;
    lines.push(
      [
        kpiScopeMeta(k.scope).label,
        k.name,
        k.area || "미분류",
        k.baseline,
        k.target,
        k.actual,
        k.unit || "",
        k.rate != null ? k.rate.toFixed(1) : "",
        assignee?.name || k.submittedBy || "",
        isKpiSubmitted(k) ? "제출" : "입력중",
      ]
        .map(csvEscape)
        .join(",")
    );
  });
  return lines;
}

function collectionStatusExcelLines(col = latestCollection()) {
  const board = col ? buildTeamCollectionBoard(col) : [];
  const lines = [[`${col?.name || "취합"} 보고서 현황`].map(csvEscape).join(",")];
  lines.push(["파트", "담당", "작성p", "할당p", "상태"].map(csvEscape).join(","));
  board.forEach((r) => {
    lines.push([`${r.section}. ${r.title}`, r.assignee, r.pages, r.alloc || "", r.status?.label || ""].map(csvEscape).join(","));
  });
  return lines;
}

function scheduleStatusExcelLines() {
  const lines = [["마감", "업무명", "단계", "담당", "상태"].map(csvEscape).join(",")];
  unifiedTfScheduleRows().forEach(({ s, tpl, due }) => {
    if (!s && !tpl) return;
    lines.push(
      [
        due || "",
        s?.title || tpl?.title || "",
        tpl ? `${tpl.step || ""} ${tpl.short || ""}`.trim() : scheduleGroupLabel(scheduleGroupOf(s)),
        s?.owner || s?.createdBy || "",
        s?.status || "준비",
      ]
        .map(csvEscape)
        .join(",")
    );
  });
  return lines;
}

function tfallHubBarHtml() {
  if (activeNavId !== "tfall") return "";
  return `
    <section class="hub-pack-bar">
      <div>
        <strong>모아보기 자료</strong>
        <p class="muted">보고서·예산·성과지표가 모이면 한 번에 받고, 평가회의 요약표로 출력합니다.</p>
      </div>
      <div class="row hub-pack-actions">
        <button type="button" class="btn" id="printEvalBrief">요약표 출력</button>
        <button type="button" class="btn btn-primary" id="downloadHubPack">일괄 다운로드</button>
      </div>
    </section>`;
}

function bindTfallHubBar(root = document) {
  root.querySelector("#downloadHubPack")?.addEventListener("click", () => downloadHubPack());
  root.querySelector("#printEvalBrief")?.addEventListener("click", () => openEvalBriefPrint());
}

async function downloadHubPack() {
  ensureBudget();
  ensureKpis();
  const col = latestCollection();
  const hangul = col ? orderedCollectionHangulFiles(col) : [];
  try {
    const JSZip = (await import("https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm")).default;
    const zip = new JSZip();
    zip.file(`1_보고서현황_${today()}.xls`, excelBlobFromLines(collectionStatusExcelLines(col)));
    hangul.forEach((f) => {
      const b64 = String(f.dataUrl || "").split(",")[1];
      if (!b64) return;
      zip.file(`보고서_한글/${f.zipName}`, b64, { base64: true });
    });
    zip.file(`2_예산현황_${today()}.xls`, excelBlobFromLines(budgetExcelLines()));
    zip.file(`3_성과지표현황_${today()}.xls`, excelBlobFromLines(kpiExcelLines()));
    zip.file(`4_주요일정현황_${today()}.xls`, excelBlobFromLines(scheduleStatusExcelLines()));
    const blob = await zip.generateAsync({ type: "blob" });
    triggerBlobDownload(blob, `모아보기_일괄_${safeZipFileName(state.meta?.tfName || "TF", "TF")}_${today()}.zip`);
  } catch (err) {
    alert(err?.message || "일괄 파일을 만들지 못했습니다. 네트워크 후 다시 시도해 주세요.");
  }
}

function budgetExcelLines() {
  ensureBudget();
  const mode = getBudgetInputMode();
  const items = state.budget.items || [];
  const lines = [["연번", "영역", "세부프로그램", "비목", "편성금액", "실적금액", "산출내역", "담당", "상태"].map(csvEscape).join(",")];
  items.forEach((item) => {
    const assignee = item.assigneeId ? memberById(item.assigneeId) : null;
    lines.push(
      [
        item.no,
        item.area,
        item.activity || item.title,
        item.expenseType || "",
        Number(item.planned) || 0,
        Number(item.spent) || 0,
        item.calcText || "",
        assignee?.name || "",
        isBudgetSubmitted(item) ? "제출" : "입력중",
      ]
        .map(csvEscape)
        .join(",")
    );
  });
  return lines;
}

async function openEvalBriefPrint() {
  ensureBudget();
  ensureKpis();
  const col = latestCollection();
  const board = col ? buildTeamCollectionBoard(col) : [];
  const items = state.budget.items || [];
  const kpis = (state.kpis || []).map(kpiSimRow);
  const sched = unifiedTfScheduleRows();
  const qr = await accessQrDataUrl();
  const url = appAccessUrl();
  const tfName = state.meta?.tfName || state.meta?.reportTitle || "TF Pulse";
  const win = window.open("", "_blank", "noopener,noreferrer,width=980,height=820");
  if (!win) {
    alert("팝업이 차단되었습니다. 팝업을 허용한 뒤 다시 눌러 주세요.");
    return;
  }
  const table = (head, rows) =>
    `<table><thead><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${
      rows.length ? rows.join("") : `<tr><td colspan="${head.length}">자료 없음</td></tr>`
    }</tbody></table>`;
  win.document.write(`<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8" /><title>평가회의 요약표</title>
    <style>
      body{font-family:Pretendard,Apple SD Gothic Neo,sans-serif;color:#1d1d1f;margin:24px;font-size:13px}
      h1{font-size:22px;margin:0 0 6px} .sub{color:#6e6e73;margin:0 0 18px}
      h2{font-size:15px;margin:22px 0 8px;border-bottom:1px solid #ddd;padding-bottom:4px}
      table{width:100%;border-collapse:collapse;margin-bottom:8px}
      th,td{border:1px solid #ccc;padding:6px 8px;text-align:left}
      th{background:#f4f4f5}
      .qr{margin-top:28px;text-align:center}
      .qr img{width:140px;height:140px}
      .qr p{margin:6px 0 0;font-size:12px;color:#6e6e73}
      @media print{body{margin:12mm} button{display:none}}
    </style></head><body>
    <button type="button" onclick="window.print()">인쇄</button>
    <h1>${escapeHtml(tfName)} 평가회의 요약표</h1>
    <p class="sub">${escapeHtml(today())} · 주요 일정 및 현황</p>
    <h2>1. 주요 일정 및 현황</h2>
    ${table(
      ["마감", "업무명", "단계", "담당", "상태"],
      sched.map(({ s, tpl, due }) => {
        const title = s?.title || tpl?.title || "";
        if (!title) return "";
        return `<tr><td>${escapeHtml(due ? formatKorDate(due) : "-")}</td><td>${escapeHtml(title)}</td><td>${escapeHtml(
          tpl ? `${tpl.step || ""} ${tpl.short || ""}`.trim() : scheduleGroupLabel(scheduleGroupOf(s))
        )}</td><td>${escapeHtml(s?.owner || s?.createdBy || "-")}</td><td>${escapeHtml(s?.status || "준비")}</td></tr>`;
      }).filter(Boolean)
    )}
    <h2>2. 보고서 통합${col ? ` · ${escapeHtml(col.name)}` : ""}</h2>
    ${table(
      ["파트", "담당", "페이지", "상태"],
      board.map(
        (r) =>
          `<tr><td>${escapeHtml(`${r.section}. ${r.title}`)}</td><td>${escapeHtml(r.assignee)}</td><td>${r.pages}/${r.alloc || "?"}p</td><td>${escapeHtml(r.status?.label || "")}</td></tr>`
      )
    )}
    <h2>3. 예산 통합</h2>
    ${table(
      ["영역", "프로그램", "비목", "편성", "실적", "담당"],
      items.map((i) => {
        const m = i.assigneeId ? memberById(i.assigneeId) : null;
        return `<tr><td>${escapeHtml(i.area || "미분류")}</td><td>${escapeHtml(i.activity || i.title || "")}</td><td>${escapeHtml(
          i.expenseType || ""
        )}</td><td>${formatWon(i.planned)}</td><td>${formatWon(i.spent)}</td><td>${escapeHtml(m?.name || "-")}</td></tr>`;
      })
    )}
    <h2>4. 성과지표 통합</h2>
    ${table(
      ["구분", "지표명", "기준", "목표", "실적", "달성"],
      kpis.map(
        (k) =>
          `<tr><td>${escapeHtml(kpiScopeMeta(k.scope).label)}</td><td>${escapeHtml(k.name)}</td><td>${escapeHtml(String(k.baseline))}${escapeHtml(
            k.unit || ""
          )}</td><td>${escapeHtml(String(k.target))}${escapeHtml(k.unit || "")}</td><td>${escapeHtml(String(k.actual))}${escapeHtml(
            k.unit || ""
          )}</td><td>${k.rate != null ? `${k.rate.toFixed(1)}%` : "—"}</td></tr>`
      )
    )}
    <div class="qr">
      <img src="${qr}" alt="접속 QR" />
      <p>웹앱 접속 · ${escapeHtml(url)}</p>
    </div>
    <script>window.addEventListener("load",()=>setTimeout(()=>window.print(),200));</script>
    </body></html>`);
  win.document.close();
}

function sendBudgetInputRequest(itemId, { silent = false, mode = getBudgetInputMode() } = {}) {
  if (!canManageBudget() && !isAdmin()) return false;
  ensureRequests();
  const meta = budgetModeMeta(mode);
  const item = state.budget.items.find((i) => i.id === itemId);
  if (!item?.assigneeId) {
    if (!silent) alert("입력담당자를 먼저 지정해 주세요.");
    return false;
  }
  const assignee = memberById(item.assigneeId);
  if (!assignee || assignee.role === "admin" || assignee.role === "budget") {
    if (!silent) alert("대상자(입력담당자)만 지정할 수 있습니다.");
    return false;
  }
  const exists = state.requests.some(
    (r) =>
      r.recipient === assignee.name &&
      r.status === "대기" &&
      r.title === meta.requestTitle &&
      (r.memo || "").includes(item.id)
  );
  if (exists) {
    if (!silent) alert(`이미 대기 중인 ${meta.short} 입력 요청이 있습니다.`);
    return false;
  }
  const amountHint =
    mode === "result"
      ? `편성 ${formatWon(item.planned)} · 실적 ${formatWon(item.spent)}`
      : `편성 ${formatWon(item.planned)}`;
  state.requests.push({
    id: uid("req"),
    groupId: uid("g"),
    title: meta.requestTitle,
    memo: `예산 탭 「${meta.tabLabel}」에서 「${budgetItemLabel(item)}」 항목을 선택·입력 후 저장해 주세요. (${amountHint}) [#${item.id}]`,
    requester: sessionUser || state.meta.adminName || "관리자",
    recipient: assignee.name,
    dueDate: "",
    status: "대기",
    createdAt: today(),
  });
  if (!silent) {
    persist();
    updateRequestPlane();
    alert(`${assignee.name}님에게 「${meta.requestTitle}」 요청을 보냈습니다.`);
  }
  return true;
}

function areaBoardHtml(kind, items, cardHtmlFn) {
  const cols = workAreaColumns();
  const sorted = [...items].sort(
    (a, b) => (Number(a.areaOrder) || 0) - (Number(b.areaOrder) || 0) || String(a.id).localeCompare(String(b.id))
  );
  return `
    <div class="area-board" data-area-board="${escapeAttr(kind)}">
      ${cols
        .map((col) => {
          const rows = sorted.filter((i) => workAreaKey(i.area) === col);
          const sum =
            kind === "budget" ? rows.reduce((s, i) => s + budgetAmountOf(i), 0) : 0;
          return `
          <section class="area-col ${rows.length ? "" : "is-empty"}" data-area="${escapeAttr(col)}">
            <header class="area-col-head">
              <h3>${escapeHtml(col)}</h3>
              <span class="area-col-count">${rows.length}${
                kind === "budget" && sum ? ` · ${formatWon(sum)}` : ""
              }</span>
            </header>
            <div class="area-col-body" data-drop-area="${escapeAttr(col)}">
              ${
                rows.length
                  ? rows.map((row) => cardHtmlFn(row)).join("")
                  : `<p class="area-col-empty muted">여기로 끌어다 놓으세요</p>`
              }
            </div>
          </section>`;
        })
        .join("")}
    </div>`;
}

function bindAreaBoard(root, { kind, onMove }) {
  if (!root) return;
  let draggingId = "";
  root.querySelectorAll("[data-area-card]").forEach((card) => {
    card.addEventListener("dragstart", (e) => {
      draggingId = card.dataset.areaCard || "";
      card.classList.add("is-dragging");
      e.dataTransfer?.setData("text/plain", `${kind}:${draggingId}`);
      if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
    });
    card.addEventListener("dragend", () => {
      card.classList.remove("is-dragging");
      draggingId = "";
      root.querySelectorAll(".area-col.is-over").forEach((c) => c.classList.remove("is-over"));
    });
  });
  root.querySelectorAll("[data-drop-area]").forEach((zone) => {
    const col = zone.closest(".area-col");
    zone.addEventListener("dragover", (e) => {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
      col?.classList.add("is-over");
    });
    zone.addEventListener("dragleave", (e) => {
      if (!zone.contains(e.relatedTarget)) col?.classList.remove("is-over");
    });
    zone.addEventListener("drop", (e) => {
      e.preventDefault();
      col?.classList.remove("is-over");
      const raw = e.dataTransfer?.getData("text/plain") || "";
      const prefix = `${kind}:`;
      const id = raw.startsWith(prefix) ? raw.slice(prefix.length) : draggingId;
      if (!id) return;
      onMove(id, zone.dataset.dropArea || UNASSIGNED_AREA);
    });
  });
}

function budgetBoardCardHtml(item) {
  const mode = getBudgetInputMode();
  const assignee = item.assigneeId ? memberById(item.assigneeId) : null;
  const amount = budgetAmountOf(item, mode);
  const filled = Boolean(budgetCalcOf(item, mode));
  return `
    <article class="area-card ${filled ? "is-done" : "is-todo"}" data-area-card="${escapeAttr(item.id)}" data-budget-open="${escapeAttr(item.id)}" draggable="true" role="button" tabindex="0">
      <strong>${escapeHtml(item.activity || item.title || "항목")}</strong>
      <span class="area-card-meta">${escapeHtml(item.expenseType || "비목")} · ${formatWon(amount)}</span>
      <span class="area-card-who">${escapeHtml(assignee?.name || item.submittedBy || "미지정")}</span>
      <span class="badge ${isBudgetSubmitted(item) ? "ok" : "pending"}">${isBudgetSubmitted(item) ? "제출" : "대기"}</span>
    </article>`;
}

function kpiBoardCardHtml(row) {
  const sim = kpiSimRow(row);
  const assignee = row.assigneeId ? memberById(row.assigneeId) : null;
  const scope = kpiScopeMeta(row.scope);
  return `
    <article class="area-card ${isKpiSubmitted(row) ? "is-done" : "is-todo"}" data-area-card="${escapeAttr(row.id)}" data-kpi-open="${escapeAttr(row.id)}" draggable="true" role="button" tabindex="0">
      <span class="kpi-scope-badge is-${escapeAttr(row.scope || "core")}">${escapeHtml(scope.label)}</span>
      <strong>${escapeHtml(row.name || "성과지표")}</strong>
      <span class="area-card-meta">목표 ${escapeHtml(String(row.target || 0))}${escapeHtml(row.unit || "")} · 실적 ${escapeHtml(String(row.actual || 0))}${escapeHtml(row.unit || "")}</span>
      <span class="area-card-who">${escapeHtml(assignee?.name || row.submittedBy || row.createdBy || "미지정")}</span>
      <span class="badge ${isKpiSubmitted(row) ? "ok" : "pending"}">${
        isKpiSubmitted(row)
          ? sim.rate != null
            ? `제출 · ${sim.rate.toFixed(0)}%`
            : "제출"
          : "대기"
      }</span>
    </article>`;
}

function moveBudgetItemArea(itemId, area) {
  ensureBudget();
  const item = state.budget.items.find((i) => i.id === itemId);
  if (!item || !canManageBudget()) return;
  const nextArea = area === UNASSIGNED_AREA ? "" : area;
  const siblings = state.budget.items.filter((i) => i.id !== itemId && workAreaKey(i.area) === workAreaKey(nextArea));
  item.area = nextArea;
  item.category = areaCategory(nextArea);
  item.areaOrder = siblings.reduce((m, i) => Math.max(m, Number(i.areaOrder) || 0), 0) + 1;
  saveAndRender("budget");
}

function moveKpiItemArea(itemId, area) {
  ensureKpis();
  const row = state.kpis.find((k) => k.id === itemId);
  if (!row || !canManageKpi()) return;
  const nextArea = area === UNASSIGNED_AREA ? "" : area;
  const siblings = state.kpis.filter((k) => k.id !== itemId && workAreaKey(k.area) === workAreaKey(nextArea));
  row.area = nextArea;
  row.areaOrder = siblings.reduce((m, k) => Math.max(m, Number(k.areaOrder) || 0), 0) + 1;
  persist();
  renderKpi();
}

function renderBudget() {
  ensureBudget();
  const el = $("#view-budget");
  const mode = getBudgetInputMode();
  const meta = budgetModeMeta(mode);
  const sum = budgetSummary();
  const detailStats = budgetDetailStats(mode);
  const manage = canManageBudget();
  const admin = isAdmin();
  const myItems = myRelatedBudgetItems();
  const visibleItems = manage ? state.budget.items : myItems;
  const expenseStatus = budgetExpenseStatus(mode);
  const yearLabel = state.budget.yearLabel || "당해연도";
  const enteredPctLabel = Number.isInteger(expenseStatus.enteredPct)
    ? `${expenseStatus.enteredPct}`
    : Number(expenseStatus.enteredPct || 0).toFixed(1);
  const remainPctLabel = Number.isInteger(expenseStatus.remainPct)
    ? `${expenseStatus.remainPct}`
    : Number(expenseStatus.remainPct || 0).toFixed(1);

  const myFilled = myItems.filter((i) => budgetCalcOf(i, mode)).length;

  const byAssignee = {};
  state.budget.items.forEach((item) => {
    const m = item.assigneeId ? memberById(item.assigneeId) : null;
    const key = m?.name || "미지정";
    if (!byAssignee[key]) byAssignee[key] = { amount: 0, count: 0, filled: 0 };
    byAssignee[key].amount += budgetAmountOf(item, mode);
    byAssignee[key].count += 1;
    if (budgetCalcOf(item, mode)) byAssignee[key].filled += 1;
  });

  const incompleteOnly = state._budgetShowIncomplete === true;
  const boardItems = (manage ? state.budget.items.filter((i) => !isBudgetMemberDraft(i)) : myItems).filter(
    (i) => !incompleteOnly || !budgetCalcOf(i, mode)
  );
  const submittedN = boardItems.filter((i) => isBudgetSubmitted(i)).length;

  el.innerHTML = `
    <div class="budget-page">
      ${tfallHubBarHtml()}
      <div class="budget-mode-tabs" role="tablist" aria-label="예산 입력 구분">
        <button type="button" class="budget-mode-tab ${mode === "plan" ? "active" : ""}" data-budget-mode="plan">운영계획 (예산)</button>
        <button type="button" class="budget-mode-tab ${mode === "result" ? "active" : ""}" data-budget-mode="result">결과보고 (실적)</button>
      </div>
      <p class="budget-mode-desc muted">${
        mode === "plan"
          ? "편성금액·세부 산출내역을 입력합니다. 홈의 작성 기준과 같습니다."
          : "실적금액·실적 산출내역을 입력합니다. 편성금액은 참고입니다."
      }</p>

      <div class="metrics budget-metrics">
        <div class="stat accent">
          <div class="label">사업비 총액</div>
          <div class="value" style="font-size:1.1rem">${formatWon(sum.total)}</div>
          <div class="sub">${escapeHtml(yearLabel)}</div>
        </div>
        <div class="stat">
          <div class="label">${escapeHtml(meta.enteredLabel)}</div>
          <div class="value" style="font-size:1.1rem">${formatWon(expenseStatus.enteredTotal)}</div>
          <div class="sub">총액 대비 ${enteredPctLabel}%</div>
        </div>
        <div class="stat">
          <div class="label">${escapeHtml(meta.remainLabel)}</div>
          <div class="value" style="font-size:1.1rem">${formatWon(expenseStatus.remain)}</div>
          <div class="sub">${remainPctLabel}%</div>
        </div>
        <div class="stat">
          <div class="label">${escapeHtml(meta.filledLabel)}</div>
          <div class="value" style="font-size:1.1rem">${detailStats.filled}<small>/${state.budget.items.length}</small></div>
          <div class="sub">${!manage ? `내 배정 ${myItems.length} · 완료 ${myFilled}` : `담당 지정 ${state.budget.items.filter((i) => i.assigneeId).length}`}</div>
        </div>
      </div>

      <div class="panel budget-summary-banner">
        <p class="budget-summary-text">
          ${escapeHtml(meta.bannerLead)} <strong>${enteredPctLabel}%</strong>가 입력되었고,
          <strong>${formatWon(expenseStatus.remain)}(${remainPctLabel}%)</strong>${escapeHtml(meta.bannerTail)}
        </p>
        <div class="progress budget-summary-progress" title="입력 ${enteredPctLabel}%">
          <span style="width:${Math.min(100, expenseStatus.enteredPct)}%"></span>
        </div>
      </div>

      <div class="panel budget-list-panel">
        <div class="panel-head">
          <div>
            <h2 class="panel-title">${escapeHtml(manage ? "영역별 예산 구성" : "내 예산 입력")}</h2>
            <p class="muted" style="margin:4px 0 0">${
              manage
                ? `제출 ${submittedN}건 · 카드를 영역 칸으로 끌어 배치합니다.`
                : "입력한 뒤 제출하면 예산담당자 화면으로 모입니다."
            }</p>
          </div>
          <div class="row budget-toolbar">
            <button type="button" class="btn btn-sm ${incompleteOnly ? "btn-primary" : ""}" id="budgetIncompleteToggle">${
              incompleteOnly ? "전체 보기" : "미입력만"
            }</button>
            ${manage ? `<button class="btn btn-sm" id="downloadBudgetExcel">엑셀</button>` : `<button class="btn btn-sm" id="downloadBudgetExcel2">내 엑셀</button>`}
            ${admin ? `<button class="btn btn-sm" id="bulkBudgetUpload">일괄 업로드</button>` : ""}
            ${manage ? `<button class="btn btn-sm" id="editBudgetTotal">총액</button>` : ""}
            ${manage ? `<button class="btn btn-primary" id="addBudgetItem">항목 추가</button>` : `<button class="btn btn-primary" id="composeBudgetItem">예산 입력</button>`}
          </div>
        </div>
        ${
          manage
            ? areaBoardHtml("budget", boardItems, budgetBoardCardHtml)
            : `<div class="budget-card-list">
              ${
                boardItems.length
                  ? boardItems
                      .map((item) => {
                        const calcPreview = budgetCalcOf(item, mode);
                        const amount = budgetAmountOf(item, mode);
                        const submitted = isBudgetSubmitted(item);
                        return `
                        <article class="budget-item-card ${submitted ? "is-done" : "is-todo"} is-clickable" data-budget-open="${escapeAttr(item.id)}" role="button" tabindex="0">
                          <span class="budget-item-kicker">${escapeHtml(item.expenseType || "비목")}</span>
                          <div class="budget-item-main">
                            <strong class="budget-item-title">${escapeHtml(item.activity || item.title || "항목")}</strong>
                            <span class="budget-item-meta muted">${escapeHtml(workAreaKey(item.area))}${
                              calcPreview ? ` · ${escapeHtml(String(calcPreview).slice(0, 42))}` : ""
                            }</span>
                          </div>
                          <span class="budget-item-amount">${formatWon(amount)}</span>
                          <span class="badge ${submitted ? "ok" : "pending"}">${submitted ? "제출됨" : "입력 중"}</span>
                          ${
                            submitted
                              ? ""
                              : `<button type="button" class="btn btn-sm btn-primary" data-budget-submit="${escapeAttr(item.id)}">제출</button>`
                          }
                        </article>`;
                      })
                      .join("")
                  : `<div class="empty">「예산 입력」으로 항목을 만든 뒤 제출하세요.</div>`
              }
            </div>`
        }
      </div>
    </div>
  `;

  el.querySelectorAll("[data-budget-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const next = btn.dataset.budgetMode === "result" ? "result" : "plan";
      if (next === getBudgetInputMode()) return;
      setBudgetInputMode(next);
      persist();
      setView("budget");
    });
  });
  $("#budgetIncompleteToggle")?.addEventListener("click", () => {
    state._budgetShowIncomplete = !state._budgetShowIncomplete;
    renderBudget();
  });
  $("#editBudgetTotal")?.addEventListener("click", () => openBudgetTotalModal());
  $("#addBudgetItem")?.addEventListener("click", () => openBudgetItemModal());
  $("#composeBudgetItem")?.addEventListener("click", () => openMemberBudgetCompose());
  $("#bulkBudgetUpload")?.addEventListener("click", () => openBudgetBulkUploadModal());
  bindTfallHubBar(el);
  $("#downloadBudgetExcel")?.addEventListener("click", () => downloadBudgetExcel());
  $("#downloadBudgetExcel2")?.addEventListener("click", () =>
    downloadBudgetExcel({ mineOnly: !manage })
  );
  el.querySelectorAll("[data-budget-submit]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      submitBudgetItem(btn.dataset.budgetSubmit);
    });
  });
  let budgetDragged = false;
  el.querySelectorAll("[data-budget-open]").forEach((card) => {
    const open = () => {
      if (budgetDragged) {
        budgetDragged = false;
        return;
      }
      openBudgetCard(card.dataset.budgetOpen);
    };
    card.addEventListener("dragstart", () => {
      budgetDragged = true;
    });
    card.addEventListener("click", open);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    });
  });
  if (manage) {
    bindAreaBoard(el, { kind: "budget", onMove: moveBudgetItemArea });
  }
  bindBudgetTips(el);
}

function openBudgetCard(itemId) {
  ensureBudget();
  const item = state.budget.items.find((i) => i.id === itemId);
  if (!item) return;
  if (canManageBudget()) {
    openBudgetItemModal(itemId);
    return;
  }
  if (canEditBudgetItem(item)) {
    openBudgetEntryModal(itemId);
    return;
  }
  denySchedulePermission("권한이 없습니다. 배정된 항목만 입력할 수 있습니다.");
}

function submitBudgetItem(itemId) {
  ensureBudget();
  const item = state.budget.items.find((i) => i.id === itemId);
  if (!item || !canEditBudgetItem(item)) return;
  if (!item.activity && !item.title) {
    alert("세부프로그램을 입력한 뒤 제출해 주세요.");
    return;
  }
  markBudgetSubmitted(item);
  if (!item.assigneeId) {
    const me = currentMember();
    if (me) item.assigneeId = me.id;
  }
  saveAndRender("budget");
}

function openMemberBudgetCompose(itemId = null) {
  const me = currentMember();
  if (!me || canManageBudget()) return;
  ensureBudget();
  const item = itemId ? state.budget.items.find((i) => i.id === itemId) : null;
  if (item && !canEditBudgetItem(item)) return;
  const mode = getBudgetInputMode();
  const meta = budgetModeMeta(mode);
  openModal({
    kicker: `${meta.short} 입력`,
    title: "입력한 뒤 제출하면 예산담당자에게 모입니다.",
    submitLabel: "제출",
    bodyHtml: `
      <p class="muted wp-form-hint">영역 배치는 예산담당자가 담당합니다. 프로그램·비목·금액·산출근거만 적으면 됩니다.</p>
      ${budgetFormFieldsHtml(item, { includeAssignee: false, fullEdit: true, mode, memberCompose: true })}
      ${item && !isBudgetSubmitted(item) ? `<p class="muted wp-form-hint">임시저장은 아래 제출 대신, 카드를 다시 열어 이어서 수정하면 됩니다.</p>` : ""}
    `,
    onSubmit: (fd) => {
      const data = readBudgetItemFields(fd, item || {}, { mode });
      data.assigneeId = item?.assigneeId || me.id;
      data.createdById = item?.createdById || me.id;
      if (!data.activity) {
        alert("세부프로그램을 입력해 주세요.");
        return false;
      }
      markBudgetSubmitted(data);
      if (item) Object.assign(item, data, { id: item.id });
      else {
        data.id = uid("b");
        state.budget.items.push(normalizeBudgetItem(data));
      }
      saveAndRender("budget");
      return true;
    },
  });
  bindBudgetFormChips($("#modalBody"));
}

function typeLabel(type) {
  return (
    {
      submit: "제출",
      meeting: "회의",
      deadline: "마감",
      milestone: "마감",
      other: "기타",
    }[type] || type || "기타"
  );
}

const SCHEDULE_TYPE_OPTIONS = [
  { value: "submit", label: "제출" },
  { value: "meeting", label: "회의" },
  { value: "deadline", label: "마감" },
  { value: "other", label: "기타" },
];

/** 내업무 상위 그룹 */
const SCHEDULE_GROUP_OPTIONS = [
  { id: "forms", label: "서식 및 지침확인" },
  { id: "collect", label: "보고서 취합" },
  { id: "review", label: "리뷰회의" },
  { id: "kpi", label: "성과지표관리" },
  { id: "budget", label: "예산관리" },
  { id: "committee", label: "위원회" },
  { id: "other", label: "기타" },
];

const SCHEDULE_PROJECT_OPTIONS = [
  "2026 교육혁신 성과보고서",
  "운영계획",
  "결과보고",
  "예산",
  "성과지표",
  "기타",
];

/** 관리자 신규 일정 등록용 기본 틀 가이드 (스타일·양식·지침 → 취합) */
const SCHEDULE_GUIDE_TEMPLATES = [
  {
    id: "forms",
    step: "1",
    short: "서식·지침",
    hint: "킥오프에서 공통 서식·지침 공유",
    workGroup: "forms",
    type: "meeting",
    title: "TF 킥오프 · 서식·지침 공유",
    division: "총괄",
    goal: "공통 표지·목차 서식과 교육부/교내 작성 지침을 전원에게 공유하고 확인받는다.",
    prep: "서식·지침·정의서 링크 준비 · 공유 폴더 권한 확인",
    carePoints: "필수 확인 항목을 체크리스트로 남기고, 질의는 킥오프에서 모은다.",
    askMessage: "이 단계 지침·양식을 확인해 주세요.",
    dueOffsetDays: 0,
    assignAll: true,
  },
  {
    id: "style",
    step: "2",
    short: "스타일",
    hint: "글꼴·여백·표·그림 규칙",
    workGroup: "forms",
    type: "submit",
    title: "보고서 스타일 가이드 공유·확인",
    division: "공통",
    goal: "본문 톤·글꼴·여백·표·그림 캡션 규칙을 통일하고 확인 회신을 받는다.",
    prep: "스타일 가이드 PDF/드라이브 링크 등록",
    carePoints: "샘플 1페이지 적용 여부를 확인한다.",
    askMessage: "보고서 스타일 가이드를 확인하고 회신해 주세요.",
    dueOffsetDays: 3,
    assignAll: true,
  },
  {
    id: "definition",
    step: "3",
    short: "정의서",
    hint: "용어·지표 정의 공유",
    workGroup: "forms",
    type: "submit",
    title: "용어·지표 정의서 공유",
    division: "공통",
    goal: "핵심 용어·성과지표 정의를 공유해 작성 기준을 맞춘다.",
    prep: "정의서 최신본 업로드",
    carePoints: "지표 산식·단위 해석이 다르면 즉시 질의한다.",
    askMessage: "용어·지표 정의서를 확인해 주세요.",
    dueOffsetDays: 5,
    assignAll: true,
  },
  {
    id: "assign",
    step: "4",
    short: "담당·할당",
    hint: "파트·페이지 배정",
    workGroup: "other",
    type: "meeting",
    title: "보고서 담당 영역·페이지 할당 공유",
    division: "총괄",
    goal: "목차별 담당·페이지 범위를 확정하고 중복·누락을 점검한다.",
    prep: "할당표(엑셀) 갱신",
    carePoints: "이의·조정 요청은 마감 전 회신한다.",
    askMessage: "담당 파트·작성 분량·주요 요구사항을 확인해 주세요.",
    dueOffsetDays: 7,
    assignAll: true,
  },
  {
    id: "collect",
    step: "5",
    short: "취합일정",
    hint: "1·2·최종 취합 마감",
    workGroup: "collect",
    type: "deadline",
    title: "취합일정 공유 및 마감 안내",
    division: "총괄",
    goal: "차수별 취합 마감을 공유하고 담당 파트 초안 업로드를 독려한다.",
    prep: "1·2·최종 취합일·드라이브 경로 안내",
    carePoints: "지연 예상 시 사전에 총괄에게 공유한다.",
    askMessage: "취합 일정이 잡혔습니다. 공지가 열리면 작성분을 올려 주세요.",
    dueOffsetDays: 10,
    assignAll: true,
  },
  {
    id: "review",
    step: "6",
    short: "리뷰회의",
    hint: "중간 검토·윤독",
    workGroup: "review",
    type: "meeting",
    title: "중간 검토·리뷰회의",
    division: "총괄",
    goal: "취합본 중복·누락·톤을 점검하고 수정 포인트를 확정한다.",
    prep: "취합본·체크리스트 준비",
    carePoints: "파트별 수정 기한을 회의에서 합의한다.",
    askMessage: "리뷰 회의에 참석해 주세요. 내 파트 점검·수정을 함께 합니다.",
    dueOffsetDays: 20,
    assignAll: true,
  },
  {
    id: "budget",
    step: "7",
    short: "예산",
    hint: "편성·산출근거 입력",
    workGroup: "budget",
    type: "deadline",
    title: "예산 편성·산출근거 입력",
    division: "예산",
    goal: "예산 통합 화면에 편성금액·산출근거를 입력·확정한다.",
    prep: "총액·비목·담당 항목 배정 확인",
    carePoints: "미입력 항목을 남기지 않는다.",
    askMessage: "담당 Activity의 총액과 대략의 산출내역을 입력해 주세요.",
    dueOffsetDays: 25,
    assignAll: false,
  },
  {
    id: "kpi",
    step: "8",
    short: "성과지표",
    hint: "목표·실적·산식",
    workGroup: "kpi",
    type: "deadline",
    title: "성과지표 목표·실적 입력",
    division: "성과지표",
    goal: "핵심·자율 지표의 목표·실적·산식을 입력·확정한다.",
    prep: "지표 목록·세세부 항목 준비",
    carePoints: "미달 지표는 보완 계획을 메모한다.",
    askMessage: "기준값·산식·목표값을 입력해 주세요. 향상률·달성 가능도는 자동입니다.",
    dueOffsetDays: 30,
    assignAll: true,
  },
];

function pickSoonestSchedule(items) {
  const list = (items || []).filter(Boolean);
  if (!list.length) return null;
  const open = list.filter((s) => (s.status || "") !== "완료");
  const pool = open.length ? open : list;
  return [...pool].sort((a, b) => scheduleDueIso(a).localeCompare(scheduleDueIso(b)))[0];
}

function scheduleMatchesGuideHeuristic(s, guideId) {
  if (!s || s.guideId) return false;
  const title = String(s.title || "");
  const group = scheduleGroupOf(s);
  if (guideId === "forms") return group === "forms" && /킥오프|서식|지침/.test(title) && !/스타일|정의/.test(title);
  if (guideId === "style") return /스타일/.test(title);
  if (guideId === "definition") return /정의서|용어/.test(title);
  if (guideId === "assign") return /할당|담당 영역/.test(title);
  if (guideId === "collect") return group === "collect";
  if (guideId === "review") return group === "review";
  if (guideId === "budget") return group === "budget";
  if (guideId === "kpi") return group === "kpi";
  return false;
}

function tfScheduleForGuide(guideId) {
  const items = state.schedule || [];
  const tagged = items.filter((s) => s.guideId === guideId);
  if (tagged.length) return pickSoonestSchedule(tagged);
  if (guideId === "collect") {
    const collects = items.filter((s) => !s.guideId && scheduleGroupOf(s) === "collect");
    return pickSoonestSchedule(collects);
  }
  return pickSoonestSchedule(items.filter((s) => scheduleMatchesGuideHeuristic(s, guideId)));
}

function extraTfSchedules() {
  const used = new Set(
    SCHEDULE_GUIDE_TEMPLATES.map((t) => tfScheduleForGuide(t.id)?.id).filter(Boolean)
  );
  return (state.schedule || [])
    .filter((s) => !used.has(s.id))
    .sort((a, b) => scheduleDueIso(a).localeCompare(scheduleDueIso(b)));
}

/** 기본 틀 + 추가 일정을 마감일 순 한 목록으로 */
function unifiedTfScheduleRows() {
  const rows = SCHEDULE_GUIDE_TEMPLATES.map((tpl) => {
    const s = tfScheduleForGuide(tpl.id);
    return { s, tpl, due: s ? scheduleDueIso(s) : "" };
  });
  extraTfSchedules().forEach((s) => {
    rows.push({ s, tpl: null, due: scheduleDueIso(s) });
  });
  rows.sort((a, b) => {
    if (!a.due && !b.due) return (a.tpl?.step || "").localeCompare(b.tpl?.step || "");
    if (!a.due) return 1;
    if (!b.due) return -1;
    return a.due.localeCompare(b.due) || (a.tpl?.step || "z").localeCompare(b.tpl?.step || "z");
  });
  return rows;
}

function tfStatusTone(status) {
  if (status === "완료") return "done";
  if (status === "진행") return "active";
  return "planned";
}

function formatKorYearMonth(iso) {
  if (!iso) return "날짜 미정";
  const [y, m] = iso.split("-").map(Number);
  if (!y || !m) return "날짜 미정";
  return `${y}년 ${m}월`;
}

function tfScheduleForProcess(processId) {
  if (processId === "collect") {
    const collects = (state.schedule || []).filter((s) => scheduleGroupOf(s) === "collect");
    const next = pickSoonestSchedule(collects.filter((s) => (s.status || "") !== "완료")) || pickSoonestSchedule(collects);
    if (next) return next;
  }
  return tfScheduleForGuide(processId);
}

function upsertTfGuideSchedule(guideId, patch = {}) {
  const tpl = SCHEDULE_GUIDE_TEMPLATES.find((t) => t.id === guideId);
  if (!tpl) return null;
  const due = patch.endDate || today();
  const existing = tfScheduleForGuide(guideId);
  if (existing) {
    existing.endDate = due;
    existing.date = due;
    existing.guideId = guideId;
    if (patch.title) existing.title = patch.title;
    if (patch.status) existing.status = patch.status;
    return existing;
  }
  const assignees = tpl.assignAll ? (state.members || []).map((m) => m.name) : [];
  const created = {
    id: uid("s"),
    guideId,
    title: patch.title || tpl.title,
    owner: sessionUser || state.meta?.adminName || "",
    createdBy: sessionUser || "",
    workGroup: tpl.workGroup,
    status: patch.status || "준비",
    type: tpl.type,
    division: tpl.division,
    date: due,
    endDate: due,
    goal: tpl.goal,
    note: tpl.goal,
    askMessage: tpl.askMessage || "",
    prep: tpl.prep || "",
    carePoints: tpl.carePoints || "",
    assignees,
  };
  state.schedule.push(created);
  return created;
}

function addDaysIso(iso, days) {
  const d = parseIsoDate(iso) || new Date();
  d.setDate(d.getDate() + (Number(days) || 0));
  return toIsoDate(d);
}

const SCHEDULE_DIVISION_OPTIONS = [
  "총괄",
  "서론",
  "현황분석",
  "추진실적",
  "성과분석",
  "향후계획",
  "예산",
  "성과지표",
  "공통",
];

function scheduleGroupMeta(id) {
  return SCHEDULE_GROUP_OPTIONS.find((g) => g.id === id) || SCHEDULE_GROUP_OPTIONS[SCHEDULE_GROUP_OPTIONS.length - 1];
}

function scheduleGroupOf(s) {
  const raw = String(s?.workGroup || s?.group || "").trim();
  if (SCHEDULE_GROUP_OPTIONS.some((g) => g.id === raw)) return raw;
  const blob = `${s?.title || ""} ${s?.project || ""} ${s?.division || ""} ${s?.type || ""} ${s?.note || ""} ${s?.goal || ""}`.toLowerCase();
  if (/서식|지침|스타일|가이드/.test(blob)) return "forms";
  if (/성과|지표|kpi/.test(blob)) return "kpi";
  if (/예산|편성|비목/.test(blob)) return "budget";
  if (/취합|원고|제출|업로드/.test(blob) || s?.type === "submit") return "collect";
  if (/리뷰|윤독|회의/.test(blob) || s?.type === "meeting") return "review";
  if (/위원회|위원/.test(blob)) return "committee";
  if (s?.type === "deadline") return "collect";
  return "other";
}

function scheduleGroupLabel(id) {
  return scheduleGroupMeta(id).label;
}

/** 협업 구분: 내가 요청 | 요청받음 만 */
function scheduleOriginOf(s, who = sessionUser) {
  const owner = s?.owner || s?.createdBy || "";
  if (owner && owner === who) {
    return { tag: "내가 요청", tone: "offered", kind: "sent", from: "" };
  }
  return {
    tag: "요청받음",
    tone: "requested",
    kind: "received",
    from: owner ? `${owner}으로부터` : "",
  };
}

/** 담당자에게 보이는 관리자 요청 말풍선 */
function scheduleAskMessage(s) {
  const custom = String(s?.askMessage || "").trim();
  if (custom) return custom;
  const group = scheduleGroupOf(s);
  const title = String(s?.title || "");
  const blob = `${title} ${s?.note || ""} ${s?.goal || ""}`;
  if (group === "forms" || /서식|지침|스타일|가이드|킥오프/.test(blob)) {
    if (/킥오프|회의/.test(blob) || s?.type === "meeting") {
      return "킥오프 회의에 참석해 주세요. 지침·양식도 함께 확인합니다.";
    }
    return "이 단계 지침·양식을 확인해 주세요.";
  }
  if (group === "collect" || /취합|업로드|제출/.test(blob)) {
    const col = collectionBySchedule(s);
    const phase = collectionPhaseOf(col);
    if (phase === "planned" || !col) {
      return isAdmin()
        ? "취합 마감만 잡혀 있습니다. 제출 요청을 등록하면 참여자가 파일을 올립니다."
        : "취합 일정이 잡혔습니다. 공지가 열리면 작성분을 올려 주세요.";
    }
    if (phase === "closed") {
      return "취합이 마감되었습니다. 내 파트 피드백을 확인하고 반영해 주세요.";
    }
    if (/1차/.test(title)) return col.requestMessage || "1차 작성분을 제출해 주세요.";
    if (/2차/.test(title)) return col.requestMessage || "2차 작성분을 일정 안에 제출해 주세요.";
    if (/최종/.test(title)) return col.requestMessage || "최종본을 확인하고 리뷰 회의에 참석해 주세요.";
    return col.requestMessage || "담당 파트 작성분을 제출해 주세요.";
  }
  if (group === "review" || /리뷰|윤독|검토회의/.test(blob)) {
    return "리뷰 회의에 참석해 주세요. 내 파트 점검·수정을 함께 합니다.";
  }
  if (group === "budget" || /예산/.test(blob)) {
    return "담당 Activity의 총액과 대략의 산출내역을 입력해 주세요.";
  }
  if (group === "kpi" || /성과|지표/.test(blob)) {
    return "기준값·산식·목표값을 입력해 주세요. 향상률·달성 가능도는 자동입니다.";
  }
  if (group === "committee") {
    return "위원회에 참석해 주세요. 안건을 미리 확인합니다.";
  }
  const note = String(s?.goal || s?.note || "").trim();
  if (note) return `관리자가 ${note}을(를) 요청했어요!`;
  return title ? `관리자가 「${title}」 업무 처리를 요청했어요!` : "";
}

function scheduleDeptOptions() {
  const set = new Set([...(BUDGET_CATALOG.depts || []), ...(BUDGET_CATALOG.workDepts || [])]);
  return [...set];
}

function scheduleOwnerOptions() {
  return membersForActiveTopic();
}

function normalizeScheduleType(type) {
  if (type === "milestone") return "deadline";
  if (SCHEDULE_TYPE_OPTIONS.some((t) => t.value === type)) return type;
  if (type === "제출") return "submit";
  if (type === "회의") return "meeting";
  if (type === "마감") return "deadline";
  if (type === "기타") return "other";
  return "other";
}

function scheduleAssigneesOf(s) {
  if (Array.isArray(s?.assignees) && s.assignees.length) {
    return s.assignees.map((n) => String(n).trim()).filter(Boolean);
  }
  return [];
}

function scheduleVisibleToUser(s, who = sessionUser) {
  if (isAdmin()) return true;
  if (!who) return true;
  if (s.createdBy === who) return true;
  return scheduleAssigneesOf(s).includes(who);
}

function renderRequests() {
  ensureRequests();
  if (!isAdmin()) {
    setView("my-work");
    return;
  }
  const el = $("#view-requests");
  const sentGroups = new Map();
  state.requests.forEach((r) => {
    const key = r.groupId || r.id;
    if (!sentGroups.has(key)) {
      sentGroups.set(key, {
        groupId: key,
        title: r.title,
        memo: r.memo,
        dueDate: r.dueDate,
        requester: r.requester,
        processId: r.processId || "",
        checks: Array.isArray(r.checks) ? r.checks : [],
        rows: [],
      });
    }
    sentGroups.get(key).rows.push(r);
  });
  const sentList = [...sentGroups.values()].sort((a, b) =>
    String(b.dueDate || "").localeCompare(String(a.dueDate || ""))
  );
  const sentOpenGroups = sentList.filter((g) => g.rows.some((r) => r.status !== "완료")).length;
  const all = state.requests.length;
  const done = state.requests.filter((r) => r.status === "완료").length;

  el.innerHTML = `
    <div class="request-admin-page">
      <section class="panel">
        <div class="panel-head">
          <div>
            <h2 class="panel-title">보고서 주요업무 요청</h2>
            <p class="muted" style="margin:4px 0 0">Setting 「TF 일정」을 고르면 마감이 기본값으로 들어갑니다. 프로세스를 고른 뒤 대상·문구만 다듬어 발송합니다.</p>
          </div>
          <button type="button" class="btn btn-primary" id="addRequest">요청 등록</button>
        </div>
        <div class="request-process-grid" aria-label="기본 프로세스">
          ${REQUEST_PROCESS_TEMPLATES.map(
            (t) => `
            <button type="button" class="request-process-card" data-process-new="${escapeAttr(t.id)}">
              <strong>${escapeHtml(t.short)}</strong>
              <span>${escapeHtml(t.label.replace(/^\d+\.\s*/, ""))}</span>
            </button>`
          ).join("")}
        </div>
      </section>

      <div class="metrics" style="margin-bottom:10px;grid-template-columns:repeat(3,1fr)">
        <div class="stat accent">
          <div class="label">진행 중 요청</div>
          <div class="value">${sentOpenGroups}</div>
          <div class="sub">그룹 기준</div>
        </div>
        <div class="stat">
          <div class="label">전체 발송 그룹</div>
          <div class="value">${sentList.length}</div>
          <div class="sub">보낸 요청</div>
        </div>
        <div class="stat">
          <div class="label">대상자 완료율</div>
          <div class="value">${all ? `${Math.round((done / all) * 100)}%` : "—"}</div>
          <div class="sub">개별 요청 기준</div>
        </div>
      </div>

      <section class="panel">
        <div class="panel-head">
          <h2 class="panel-title">보낸 요청</h2>
          <p class="muted" style="margin:0">카드를 누르면 수정 팝업이 열립니다.</p>
        </div>
        <div class="request-sent-list">
          ${
            sentList.length
              ? sentList
                  .map((g) => {
                    const doneN = g.rows.filter((r) => r.status === "완료").length;
                    const overdue = g.dueDate && daysUntil(g.dueDate) < 0 && doneN < g.rows.length;
                    const proc = requestProcessById(g.processId);
                    return `
                    <article class="request-sent-card ${overdue ? "is-overdue" : ""}" data-edit-group="${escapeAttr(g.groupId)}" role="button" tabindex="0">
                      <div class="request-sent-top">
                        <div>
                          ${proc ? `<span class="request-process-tag">${escapeHtml(proc.short)}</span>` : ""}
                          <h3>${escapeHtml(g.title)}</h3>
                          <p class="muted">${escapeHtml((g.memo || "").split("\n")[0] || "세부 내용 없음")}</p>
                        </div>
                        <span class="badge ${doneN === g.rows.length ? "ok" : "warn"}">${doneN}/${g.rows.length}</span>
                      </div>
                      <div class="request-sent-meta">
                        <span>마감 ${escapeHtml(g.dueDate || "-")}${overdue ? " · 지남" : ""}</span>
                        <span>${g.rows.map((r) => escapeHtml(r.recipient)).join(", ")}</span>
                      </div>
                    </article>`;
                  })
                  .join("")
              : `<div class="empty">보낸 요청이 없습니다. 위 프로세스를 눌러 등록하세요.</div>`
          }
        </div>
      </section>
    </div>
  `;

  $("#addRequest")?.addEventListener("click", () => openRequestModal());
  el.querySelectorAll("[data-process-new]").forEach((btn) => {
    btn.addEventListener("click", () => openRequestModal(null, btn.dataset.processNew));
  });
  el.querySelectorAll("[data-edit-group]").forEach((card) => {
    const open = () => openRequestModal(card.dataset.editGroup);
    card.addEventListener("click", open);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    });
  });
}

/** 보고서 작성 관련 기본 요청 프로세스 + AI 초안 */
const REQUEST_PROCESS_TEMPLATES = [
  {
    id: "forms",
    short: "서식·지침",
    label: "1. 서식, 지침, 일정 공유",
    dueOffsetDays: 5,
    title: "서식·지침·일정 공유 확인",
    memo: (ctx) =>
      `${ctx.tfName} 공통 서식·작성 지침·운영 일정을 공유합니다.\n` +
      `· 공통 표지·목차 서식 위치를 확인하세요.\n` +
      `· 교육부/교내 작성 지침의 필수 항목을 숙지하세요.\n` +
      `· 킥오프~최종 제출(${ctx.deadlineLabel}) 일정을 개인 캘린더에 반영하세요.`,
    checks: ["공통 서식 위치 확인", "작성 지침 필수항목 숙지", "전체 일정 캘린더 반영", "질의 사항 회신"],
  },
  {
    id: "style",
    short: "스타일",
    label: "2. 스타일 가이드 공유",
    dueOffsetDays: 7,
    title: "보고서 스타일 가이드 확인 후 회신",
    memo: (ctx) =>
      `보고서 톤·글꼴·여백·표·그림 규칙을 통일하기 위한 스타일 가이드를 공유합니다.\n` +
      `· 본문 글꼴·자간·문단 규칙을 확인하세요.\n` +
      `· 표·그림 캡션 형식을 맞추세요.\n` +
      `· 확인 후 「확인 완료」로 회신해 주세요. (${ctx.tfName})`,
    checks: ["글꼴·여백 규칙 확인", "표·그림 캡션 형식 확인", "샘플 페이지 1장 적용", "확인 완료 회신"],
  },
  {
    id: "collect",
    short: "취합일정",
    label: "3. 취합일정 공유",
    dueOffsetDays: 10,
    title: "취합일정 공유 및 마감 준수 안내",
    memo: (ctx) =>
      `차수별 취합 마감을 공유합니다. 최종 제출일은 ${ctx.deadlineLabel}입니다.\n` +
      `· 1·2·최종 취합 일정을 확인하세요.\n` +
      `· 담당 파트 초안을 마감 전까지 드라이브에 업로드하세요.\n` +
      `· 지연이 예상되면 사전에 총괄(${ctx.adminName})에게 공유하세요.`,
    checks: ["취합 차수·마감일 확인", "담당 파트 업로드 경로 확인", "초안 분량 점검", "지연 시 사전 공유"],
  },
  {
    id: "assign",
    short: "담당·할당",
    label: "4. 보고서 담당 영역 및 할당 공유",
    dueOffsetDays: 7,
    title: "보고서 담당 영역·페이지 할당 확인",
    memo: (ctx) =>
      `${ctx.tfName} 목차별 담당·페이지 할당을 공유합니다.\n` +
      `· 본인 담당 파트(영역)와 페이지 범위를 확인하세요.\n` +
      `· 중복·누락이 있으면 즉시 회신하세요.\n` +
      `· 할당 확정 후 작성 일정에 반영하세요.`,
    checks: ["담당 파트·페이지 확인", "중복·누락 여부 점검", "작성 일정 반영", "이의·질의 회신"],
  },
  {
    id: "budget",
    short: "예산",
    label: "5. 예산 편성 입력요청",
    dueOffsetDays: 14,
    title: "예산 편성·산출근거 입력 요청",
    memo: (ctx) =>
      `예산 통합 화면에 편성금액·산출근거를 입력해 주세요.\n` +
      `· 총 사업비 기준(${ctx.budgetLabel})에 맞춰 담당 항목을 입력합니다.\n` +
      `· 비목·부서·산출내역을 빠짐없이 작성하세요.\n` +
      `· 입력 후 저장하고, 미입력 항목은 남겨 두지 마세요.`,
    checks: ["배정 예산 항목 확인", "편성금액 입력", "산출근거 작성", "저장 및 미입력 점검"],
  },
  {
    id: "kpi",
    short: "성과지표",
    label: "6. 성과지표 입력요청",
    dueOffsetDays: 14,
    title: "성과지표 목표·실적 입력 요청",
    memo: (ctx) =>
      `성과지표(핵심·자율)의 목표·실적·산식을 입력·갱신해 주세요.\n` +
      `· 지표별 기준값·목표·실적을 확인하세요.\n` +
      `· 달성률이 낮은 지표는 사유·보완계획을 메모하세요.\n` +
      `· 최종 제출(${ctx.deadlineLabel}) 전까지 수치를 확정하세요.`,
    checks: ["지표 목록 확인", "목표·실적 수치 입력", "산식·단위 점검", "미달 지표 보완 메모"],
  },
];

function requestProcessById(id) {
  return REQUEST_PROCESS_TEMPLATES.find((t) => t.id === id) || null;
}

function requestAiContext() {
  const total = Number(state.budget?.total) || 0;
  const finalDue =
    tfScheduleForProcess("collect") ||
    (state.schedule || []).find((s) => /제출|최종/.test(s.title || "")) ||
    null;
  const dueIso = finalDue ? scheduleDueIso(finalDue) : "";
  return {
    tfName: state.meta?.tfName || "TF",
    adminName: state.meta?.adminName || sessionUser || "관리자",
    deadlineLabel: dueIso ? formatKorDate(dueIso) : "최종 제출일",
    budgetLabel: total ? `${Math.round(total / 1e8)}억` : "총액 기준",
    today: today(),
  };
}

function buildRequestAiDraft(processId, overrides = {}) {
  const tpl = requestProcessById(processId) || REQUEST_PROCESS_TEMPLATES[0];
  const ctx = requestAiContext();
  const sched = tfScheduleForProcess(tpl.id);
  const due = sched
    ? scheduleDueIso(sched)
    : toIsoDate(addDaysDate(parseIsoDate(ctx.today), tpl.dueOffsetDays || 7));
  const baseMemo = overrides.memo ?? (typeof tpl.memo === "function" ? tpl.memo(ctx) : tpl.memo);
  const schedNote = sched
    ? `\n\n· TF 일정 기준 마감: ${formatKorDate(due)}${sched.goal || sched.note ? `\n· ${sched.goal || sched.note}` : ""}`
    : "";
  return {
    processId: tpl.id,
    title: overrides.title ?? (sched?.title || tpl.title),
    memo: String(baseMemo || "") + (overrides.memo != null ? "" : schedNote),
    checks: overrides.checks ?? [...(tpl.checks || [])],
    dueDate: overrides.dueDate ?? due,
    fromSchedule: Boolean(sched),
  };
}

function requestBaseSchedules() {
  return [...(state.schedule || [])].sort((a, b) =>
    scheduleDueIso(a).localeCompare(scheduleDueIso(b))
  );
}

function processIdFromSchedule(s) {
  if (!s) return REQUEST_PROCESS_TEMPLATES[0].id;
  if (s.guideId && requestProcessById(s.guideId)) return s.guideId;
  const group = scheduleGroupOf(s);
  const map = { forms: "forms", collect: "collect", budget: "budget", kpi: "kpi", other: "assign", review: "collect" };
  return requestProcessById(map[group])?.id || REQUEST_PROCESS_TEMPLATES[0].id;
}

function requestTargetMembers() {
  return membersForActiveTopic();
}

function openRequestModal(groupId = null, processId = null) {
  if (!isAdmin()) return;
  ensureRequests();
  const members = requestTargetMembers();
  const existing = groupId
    ? state.requests.filter((r) => (r.groupId || r.id) === groupId)
    : [];
  const head = existing[0] || null;
  const initialProcess =
    processId || head?.processId || REQUEST_PROCESS_TEMPLATES[0].id;
  const draft = head
    ? {
        processId: initialProcess,
        title: head.title || "",
        memo: head.memo || "",
        checks: Array.isArray(head.checks) && head.checks.length ? [...head.checks] : [],
        dueDate: head.dueDate || today(),
      }
    : buildRequestAiDraft(initialProcess);
  if (head && !draft.checks.length) {
    draft.checks = [...(requestProcessById(draft.processId)?.checks || [])];
  }
  const selected = new Set(existing.map((r) => r.recipient).filter(Boolean));
  if (!existing.length) members.forEach((m) => selected.add(m.name));
  const allOn = members.length > 0 && members.every((m) => selected.has(m.name));
  const schedules = requestBaseSchedules();
  const matchedSched =
    (head?.scheduleId && schedules.find((s) => s.id === head.scheduleId)) ||
    tfScheduleForProcess(draft.processId) ||
    (!head ? schedules.find((s) => (s.status || "") !== "완료") : null) ||
    null;
  if (!head && matchedSched) {
    draft.title = matchedSched.title || draft.title;
    draft.dueDate = scheduleDueIso(matchedSched) || draft.dueDate;
    draft.fromSchedule = true;
    const pid = processIdFromSchedule(matchedSched);
    if (!processId) draft.processId = pid;
  }

  openModal({
    kicker: head ? "요청 수정" : "요청 등록",
    title: head ? "주요업무 요청을 수정합니다." : "주요업무 요청을 등록합니다.",
    submitLabel: head ? "저장" : "요청 발송",
    bodyHtml: `
      <div class="wp-form request-modal-form">
        <label class="wp-field">
          <span class="wp-label">일정 기반 요청</span>
          <select name="scheduleId" id="requestScheduleSelect" class="wp-input wp-select">
            <option value="">직접 입력</option>
            ${schedules
              .map((s) => {
                const due = scheduleDueIso(s);
                const done = (s.status || "") === "완료" ? " · 완료" : "";
                return `<option value="${escapeAttr(s.id)}" ${matchedSched?.id === s.id ? "selected" : ""}>${escapeHtml(s.title || "일정")} · ${escapeHtml(formatKorDate(due) || due)}${done}</option>`;
              })
              .join("")}
          </select>
          <span class="muted" style="display:block;margin-top:4px;font-size:var(--text-xs)">${
            schedules.length
              ? "Setting 「TF 일정」에서 넣은 일정을 고르면 제목·마감이 채워집니다."
              : "아직 TF 일정이 없습니다. Setting → TF 일정에서 마감을 먼저 넣으세요."
          }</span>
        </label>
        <div class="wp-field">
          <span class="wp-label">기본 프로세스</span>
          <div class="request-process-pick" role="radiogroup" aria-label="기본 프로세스">
            ${REQUEST_PROCESS_TEMPLATES.map(
              (t) => `
              <label class="request-process-option">
                <input type="radio" name="processId" value="${escapeAttr(t.id)}" ${
                  draft.processId === t.id ? "checked" : ""
                } />
                <span><strong>${escapeHtml(t.short)}</strong><em>${escapeHtml(
                  t.label.replace(/^\d+\.\s*/, "")
                )}</em></span>
              </label>`
            ).join("")}
          </div>
        </div>
        <div class="request-ai-bar">
          <p class="muted">${
            draft.fromSchedule
              ? "TF 일정의 마감·제목이 채워졌습니다. 필요한 문구만 수정하세요."
              : "아직 연결할 TF 일정이 없습니다. Setting에서 마감을 넣거나, AI 초안을 사용하세요."
          }</p>
          <button type="button" class="btn btn-sm" id="requestAiFill">AI 자동완성</button>
        </div>
        <label class="wp-field">
          <span class="wp-label">요청 제목</span>
          <input name="title" id="requestTitleInput" class="wp-input" required value="${escapeAttr(draft.title)}" />
        </label>
        <label class="wp-field">
          <span class="wp-label">마감일</span>
          <input name="dueDate" id="requestDueInput" type="date" class="wp-input" value="${escapeAttr(draft.dueDate)}" />
          ${
            draft.fromSchedule
              ? `<span class="muted" style="display:block;margin-top:4px;font-size:var(--text-xs)">TF 일정 기준</span>`
              : ""
          }
        </label>
        <label class="wp-field">
          <span class="wp-label">주요 요청사항</span>
          <textarea name="memo" id="requestMemoInput" rows="5" class="wp-input">${escapeHtml(draft.memo)}</textarea>
        </label>
        <label class="wp-field">
          <span class="wp-label">점검사항 (줄마다 1개 · 추가 가능)</span>
          <textarea name="checksText" id="requestChecksInput" rows="4" class="wp-input" placeholder="점검사항을 한 줄에 하나씩">${escapeHtml(
            (draft.checks || []).join("\n")
          )}</textarea>
        </label>
        <fieldset class="wp-field schedule-assignee-field">
          <legend class="wp-label">대상자</legend>
          <p class="muted schedule-assignee-hint">ALL 또는 TF 참여자를 복수 선택합니다.</p>
          <div class="schedule-assignee-grid">
            <label class="schedule-assignee-chip is-all">
              <input type="checkbox" id="requestAssigneeAll" ${allOn ? "checked" : ""} />
              <span>ALL</span>
            </label>
            ${members
              .map(
                (m) => `
              <label class="schedule-assignee-chip">
                <input type="checkbox" name="recipients" value="${escapeAttr(m.name)}" ${
                  selected.has(m.name) ? "checked" : ""
                } />
                <span>${escapeHtml(m.name)}</span>
              </label>`
              )
              .join("")}
          </div>
        </fieldset>
        ${
          head
            ? `<div class="budget-modal-extra">
                <button type="button" class="btn btn-sm btn-danger" id="requestDeleteGroup">이 요청 삭제</button>
              </div>`
            : ""
        }
      </div>
    `,
    onSubmit: (fd) => {
      const title = fd.get("title").trim();
      const memo = (fd.get("memo") || "").toString().trim();
      const dueDate = fd.get("dueDate") || "";
      const process = normalizeRequestProcess(fd.get("processId"));
      const scheduleId = String(fd.get("scheduleId") || "").trim();
      const checks = String(fd.get("checksText") || "")
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);
      let recipients = fd.getAll("recipients").map((v) => String(v).trim()).filter(Boolean);
      if (!recipients.length) recipients = members.map((m) => m.name);
      if (!title || !recipients.length) {
        alert("제목과 대상자를 확인해 주세요.");
        return false;
      }
      const stamp = today();
      if (head) {
        const gid = groupId;
        const prevByRecipient = new Map(existing.map((r) => [r.recipient, r]));
        state.requests = state.requests.filter((r) => (r.groupId || r.id) !== gid);
        recipients.forEach((name) => {
          const prev = prevByRecipient.get(name);
          state.requests.push({
            id: prev?.id || uid("req"),
            groupId: gid,
            title,
            memo,
            checks,
            processId: process,
            scheduleId,
            requester: prev?.requester || sessionUser,
            recipient: name,
            dueDate,
            status: prev?.status || "대기",
            createdAt: prev?.createdAt || stamp,
          });
        });
      } else {
        const newGid = uid("g");
        recipients.forEach((name) => {
          state.requests.push({
            id: uid("req"),
            groupId: newGid,
            title,
            memo,
            checks,
            processId: process,
            scheduleId,
            requester: sessionUser,
            recipient: name,
            dueDate,
            status: "대기",
            createdAt: stamp,
          });
        });
      }
      saveAndRender("requests");
      updateRequestPlane();
      return true;
    },
  });

  const fillFromProcess = (pid) => {
    const built = buildRequestAiDraft(pid);
    const titleEl = $("#requestTitleInput");
    const memoEl = $("#requestMemoInput");
    const checksEl = $("#requestChecksInput");
    const dueEl = $("#requestDueInput");
    if (titleEl) titleEl.value = built.title;
    if (memoEl) memoEl.value = built.memo;
    if (checksEl) checksEl.value = (built.checks || []).join("\n");
    if (dueEl) dueEl.value = built.dueDate;
    const sel = $("#requestScheduleSelect");
    const match = tfScheduleForProcess(pid);
    if (sel && match) sel.value = match.id;
  };

  const fillFromScheduleId = (id) => {
    const sched = (state.schedule || []).find((s) => s.id === id);
    if (!sched) return;
    const pid = processIdFromSchedule(sched);
    const radio = $$("[name='processId']", $("#modalBody") || document).find((r) => r.value === pid);
    if (radio) radio.checked = true;
    const titleEl = $("#requestTitleInput");
    const memoEl = $("#requestMemoInput");
    const dueEl = $("#requestDueInput");
    const checksEl = $("#requestChecksInput");
    const built = buildRequestAiDraft(pid);
    if (titleEl) titleEl.value = sched.title || built.title;
    if (dueEl) dueEl.value = scheduleDueIso(sched) || built.dueDate;
    if (memoEl) {
      const extra = [sched.askMessage, sched.goal || sched.note].filter(Boolean).join("\n");
      memoEl.value = extra ? `${built.memo.replace(/\n\n· TF 일정[\s\S]*$/, "").trim()}\n\n· TF 일정 기준 마감: ${formatKorDate(scheduleDueIso(sched))}${extra ? `\n· ${extra}` : ""}` : built.memo;
    }
    if (checksEl && !(checksEl.value || "").trim()) checksEl.value = (built.checks || []).join("\n");
  };

  $$("[name='processId']", $("#modalBody") || document).forEach((radio) => {
    radio.addEventListener("change", () => {
      if (radio.checked) fillFromProcess(radio.value);
    });
  });
  $("#requestScheduleSelect")?.addEventListener("change", (e) => {
    const id = e.target.value;
    if (id) fillFromScheduleId(id);
  });
  $("#requestAiFill")?.addEventListener("click", (e) => {
    e.preventDefault();
    const pid =
      ($("#modalBody")?.querySelector("[name='processId']:checked") || {}).value ||
      draft.processId;
    fillFromProcess(pid);
  });

  const allBox = $("#requestAssigneeAll");
  const boxes = () => $$("[name='recipients']", $("#modalBody") || document);
  const syncAll = () => {
    if (!allBox) return;
    const list = boxes();
    allBox.checked = list.length > 0 && list.every((b) => b.checked);
  };
  allBox?.addEventListener("change", () => {
    const on = Boolean(allBox.checked);
    boxes().forEach((b) => {
      b.checked = on;
    });
  });
  boxes().forEach((b) => b.addEventListener("change", syncAll));

  $("#requestDeleteGroup")?.addEventListener("click", (e) => {
    e.preventDefault();
    if (!groupId || !confirm("이 요청을 모든 대상자에게서 삭제할까요?")) return;
    state.requests = state.requests.filter((r) => (r.groupId || r.id) !== groupId);
    closeModal();
    saveAndRender("requests");
    updateRequestPlane();
  });
}

function normalizeRequestProcess(id) {
  return requestProcessById(id)?.id || REQUEST_PROCESS_TEMPLATES[0].id;
}

/* ---------- 오늘 뭐먹지 ---------- */

const FOOD_MENUS = {
  lunch: {
    label: "점심",
    items: ["김치찌개", "비빔밥", "제육볶음", "돈까스", "칼국수", "짜장면"],
  },
  dinner: {
    label: "저녁",
    items: ["삼겹살", "치킨", "피자", "족발", "찜닭", "마라탕"],
  },
  snack: {
    label: "간식",
    items: ["떡볶이", "붕어빵", "카페·빵", "아이스크림"],
  },
  late: {
    label: "야식",
    items: ["야식라면", "치킨", "족발·보쌈", "피자", "곱창", "떡볶이"],
  },
};

/** 안양 3동 인근 · 배민 고평점 기준 샘플 (메뉴당 2~3곳) */
const FOOD_TRIED_KEY = 'tf-ops-food-tried-v1';

const FOOD_PLACES = [
  // 김치찌개
  { id: 'p_kimchi1', name: '본가김치찌개(안양3동)', meals: ['lunch'], tags: ['김치찌개'], taste: 5, speed: 4, menus: ['김치찌개정식', '계란말이', '공기밥'], tip: '안양3동 배민 한식 상위권. 국물 진함.' },
  { id: 'p_kimchi2', name: '찌개마을 범계점', meals: ['lunch'], tags: ['김치찌개'], taste: 4, speed: 5, menus: ['김치찌개', '된장찌개', '제육추가'], tip: '배달 빠름. 점심 피크에도 비교적 정시.' },
  { id: 'p_kimchi3', name: '열정김치찌개', meals: ['lunch'], tags: ['김치찌개'], taste: 4, speed: 4, menus: ['직화김치찌개', '라면사리'], tip: '맵기 조절 가능. TF 점심 단골 후보.' },
  // 비빔밥
  { id: 'p_bibim1', name: '돌솥비빔당(안양)', meals: ['lunch'], tags: ['비빔밥'], taste: 5, speed: 4, menus: ['돌솥비빔밥', '야채비빔밥', '육회비빔밥'], tip: '배민 평점 높은 비빔밥 전문.' },
  { id: 'p_bibim2', name: '한그릇비빔', meals: ['lunch'], tags: ['비빔밥'], taste: 4, speed: 5, menus: ['열무비빔밥', '참치비빔밥'], tip: '포장·배달 모두 깔끔.' },
  { id: 'p_bibim3', name: '나물향비빔밥', meals: ['lunch'], tags: ['비빔밥'], taste: 4, speed: 3, menus: ['나물비빔밥', '고추장비빔밥'], tip: '건강한 맛. 양 적당.' },
  // 제육
  { id: 'p_jeyuk1', name: '제육의정석 안양점', meals: ['lunch'], tags: ['제육볶음'], taste: 5, speed: 4, menus: ['제육덮밥', '제육정식', '계란찜'], tip: '안양3동 근처 배달 많음. 양념 진함.' },
  { id: 'p_jeyuk2', name: '매콤제육하우스', meals: ['lunch'], tags: ['제육볶음'], taste: 4, speed: 5, menus: ['제육볶음', '쌈채소세트'], tip: '스피드 좋음. 점심 추천.' },
  { id: 'p_jeyuk3', name: '고기의신 제육', meals: ['lunch'], tags: ['제육볶음'], taste: 4, speed: 3, menus: ['직화제육', '된장찌개'], tip: '불맛 강함. 배민 리뷰 다수.' },
  // 돈까스
  { id: 'p_don1', name: '안양왕돈까스', meals: ['lunch'], tags: ['돈까스'], taste: 5, speed: 4, menus: ['등심돈까스', '치즈돈까스'], tip: '바삭함 유지. 3동 인근 인기.' },
  { id: 'p_don2', name: '카츠공방 평촌', meals: ['lunch'], tags: ['돈까스'], taste: 4, speed: 4, menus: ['히레까스', '커리돈까스'], tip: '평점 안정적. 소스 별미.' },
  { id: 'p_don3', name: '경양식돈까스집', meals: ['lunch'], tags: ['돈까스'], taste: 4, speed: 5, menus: ['경양식돈까스', '함박스테이크'], tip: '배달 빠름. 가성비.' },
  // 칼국수
  { id: 'p_kal1', name: '바지락칼국수골목', meals: ['lunch'], tags: ['칼국수'], taste: 5, speed: 3, menus: ['바지락칼국수', '왕만두'], tip: '국물 시원. 배민 한식 상위.' },
  { id: 'p_kal2', name: '면면칼국수 안양', meals: ['lunch'], tags: ['칼국수'], taste: 4, speed: 4, menus: ['들깨칼국수', '김치칼국수'], tip: '든든한 한 끼. 비 오는 날 특효.' },
  { id: 'p_kal3', name: '손칼국수명가', meals: ['lunch'], tags: ['칼국수'], taste: 4, speed: 5, menus: ['손칼국수', '보쌈정식'], tip: '배달 스피드 좋음.' },
  // 짜장면
  { id: 'p_jja1', name: '중국요리 영흥관', meals: ['lunch', 'dinner', 'late'], tags: ['짜장면'], taste: 3, speed: 5, menus: ['짜장면', '고기짬뽕밥', '탕수육'], tip: '안양3동 배달 단골. 양 많고 빠름.' },
  { id: 'p_jja2', name: '홍콩반점0410 안양점', meals: ['lunch'], tags: ['짜장면'], taste: 4, speed: 5, menus: ['짜장면', '짬뽕', '탕수육'], tip: '배민 중식 평점 상위. 스피드 강점.' },
  { id: 'p_jja3', name: '현지맛짜장', meals: ['lunch'], tags: ['짜장면'], taste: 4, speed: 4, menus: ['간짜장', '삼선짬뽕'], tip: '불맛 나는 짜장. 리뷰 좋음.' },
  // 삼겹살
  { id: 'p_sam1', name: '삼겹의품격(안양)', meals: ['dinner'], tags: ['삼겹살'], taste: 5, speed: 3, menus: ['삼겹살', '목살', '된장찌개'], tip: '저녁 배민 고기 상위. 두툼함.' },
  { id: 'p_sam2', name: '돼지야저녁', meals: ['dinner'], tags: ['삼겹살'], taste: 4, speed: 4, menus: ['삼겹살세트', '항정살'], tip: '배달 포장 깔끔.' },
  { id: 'p_sam3', name: '고기굽는집 3동', meals: ['dinner'], tags: ['삼겹살'], taste: 4, speed: 2, menus: ['삼겹살', '비빔면'], tip: '맛 우선. 배달은 다소 여유.' },
  // 치킨
  { id: 'p_chi1', name: 'BBQ 안양호계점', meals: ['dinner', 'late'], tags: ['치킨'], taste: 5, speed: 4, menus: ['황금올리브', '양념치킨'], tip: '안양 인근 배민 치킨 상위권.' },
  { id: 'p_chi2', name: '교촌치킨 안양3동', meals: ['dinner', 'late'], tags: ['치킨'], taste: 4, speed: 4, menus: ['허니콤보', '레드콤보'], tip: '야근 단골. 순살 옵션.' },
  { id: 'p_chi3', name: '굽네치킨 평촌', meals: ['dinner', 'late'], tags: ['치킨'], taste: 4, speed: 5, menus: ['고추바사삭', '갈비천왕'], tip: '배달 빠름. 오븐구이.' },
  // 피자
  { id: 'p_piz1', name: '도미노피자 안양점', meals: ['dinner', 'late', 'snack'], tags: ['피자'], taste: 4, speed: 5, menus: ['페퍼로니', '슈퍼슈프림'], tip: '배민 피자 스피드·평점 안정.' },
  { id: 'p_piz2', name: '피자헛 범계', meals: ['dinner', 'late'], tags: ['피자'], taste: 4, speed: 4, menus: ['미트미트', '슈퍼슈프림'], tip: '세트 구성 좋음.' },
  { id: 'p_piz3', name: '반올림피자 안양', meals: ['dinner', 'late', 'snack'], tags: ['피자'], taste: 5, speed: 4, menus: ['불고기피자', '포테이토'], tip: '가성비·평점 높은 로컬 인기.' },
  // 족발
  { id: 'p_jok1', name: '가장맛있는족발 안양', meals: ['dinner', 'late'], tags: ['족발', '족발·보쌈'], taste: 5, speed: 3, menus: ['앞다리족발', '보쌈', '막국수'], tip: '배민 족발 상위. 야식 강추.' },
  { id: 'p_jok2', name: '원할머니보쌈 평촌', meals: ['dinner', 'late'], tags: ['족발', '족발·보쌈'], taste: 4, speed: 4, menus: ['보쌈정식', '족발세트'], tip: '양 푸짐. 배달 무난.' },
  { id: 'p_jok3', name: '장충동왕족발 3동', meals: ['dinner', 'late'], tags: ['족발', '족발·보쌈'], taste: 4, speed: 3, menus: ['왕족발', '쟁반국수'], tip: '야근 야식 단골 후보.' },
  // 찜닭
  { id: 'p_jjim1', name: '둘둘치킨아님 안동찜닭', meals: ['dinner', 'late'], tags: ['찜닭'], taste: 5, speed: 3, menus: ['안동찜닭', '순살찜닭'], tip: '안양 인근 찜닭 평점 상위.' },
  { id: 'p_jjim2', name: '찜닭의신 범계', meals: ['dinner'], tags: ['찜닭'], taste: 4, speed: 4, menus: ['찜닭', '당면사리', '떡사리'], tip: '매운맛 단계 조절.' },
  { id: 'p_jjim3', name: '청년찜닭 안양', meals: ['dinner', 'late'], tags: ['찜닭'], taste: 4, speed: 4, menus: ['치즈찜닭', '순살'], tip: 'TF 여럿이 먹기 좋음.' },
  // 마라탕
  { id: 'p_ma1', name: '마라탕전문점 신야', meals: ['dinner', 'late'], tags: ['마라탕'], taste: 5, speed: 4, menus: ['마라탕', '마라샹궈'], tip: '배민 중식/아시안 상위. 맵기 조절.' },
  { id: 'p_ma2', name: '양꼬치&마라 안양', meals: ['dinner', 'late'], tags: ['마라탕'], taste: 4, speed: 4, menus: ['마라탕', '꿔바로우'], tip: '야식도 가능. 리뷰 많음.' },
  { id: 'p_ma3', name: '마라공방 평촌', meals: ['dinner'], tags: ['마라탕'], taste: 4, speed: 5, menus: ['마라탕', '빙수'], tip: '배달 스피드 좋음.' },
  // 떡볶이
  { id: 'p_tteok1', name: '신전떡볶이 안양3동', meals: ['snack', 'late', 'lunch'], tags: ['떡볶이'], taste: 4, speed: 5, menus: ['떡볶이', '튀김세트', '라볶이'], tip: '간식·야식 배민 단골.' },
  { id: 'p_tteok2', name: '엽기떡볶이 평촌', meals: ['snack', 'late'], tags: ['떡볶이'], taste: 4, speed: 4, menus: ['엽기떡볶이', '주먹김밥'], tip: '매운맛. 평점 안정.' },
  { id: 'p_tteok3', name: '국대떡볶이 안양', meals: ['snack', 'late'], tags: ['떡볶이'], taste: 5, speed: 4, menus: ['국대떡볶이', '튀김'], tip: '로컬 고평점. 양 좋음.' },
  // 붕어빵
  { id: 'p_bung1', name: '호호붕어빵 안양역', meals: ['snack'], tags: ['붕어빵'], taste: 5, speed: 5, menus: ['붕어빵', '계란빵'], tip: '따뜻한 간식. 픽업 추천.' },
  { id: 'p_bung2', name: '겨울간식카트(3동)', meals: ['snack'], tags: ['붕어빵'], taste: 4, speed: 5, menus: ['붕어빵', '호떡'], tip: '근처 포장 빠름.' },
  { id: 'p_bung3', name: '달달붕어빵', meals: ['snack'], tags: ['붕어빵'], taste: 4, speed: 4, menus: ['슈크림붕어빵', '피자붕어빵'], tip: '배민 간식 리뷰 좋음.' },
  // 카페빵
  { id: 'p_cafe1', name: '메가커피 안양3동', meals: ['snack'], tags: ['카페·빵'], taste: 4, speed: 5, menus: ['아메리카노', '쿠키'], tip: '보고서 쓰며 먹기 좋음. 배달 빠름.' },
  { id: 'p_cafe2', name: '파리바게뜨 호계', meals: ['snack'], tags: ['카페·빵'], taste: 4, speed: 4, menus: ['크루아상', '샌드위치'], tip: '빵·디저트. 평점 무난.' },
  { id: 'p_cafe3', name: '컴포즈커피 범계', meals: ['snack'], tags: ['카페·빵'], taste: 3, speed: 5, menus: ['아메리카노', '스콘'], tip: '가성비 커피. 스피드.' },
  // 아이스크림
  { id: 'p_ice1', name: '배스킨라빈스 안양', meals: ['snack'], tags: ['아이스크림'], taste: 5, speed: 4, menus: ['파인트', '싱글레귤러'], tip: '디저트 배민 상위.' },
  { id: 'p_ice2', name: '설빙 평촌점', meals: ['snack'], tags: ['아이스크림'], taste: 4, speed: 3, menus: ['인절미설빙', '치즈설빙'], tip: '빙수·아이스크림. 여럿이.' },
  { id: 'p_ice3', name: '나뚜루픽업 안양', meals: ['snack'], tags: ['아이스크림'], taste: 4, speed: 5, menus: ['파인트', '컵'], tip: '배달·픽업 빠름.' },
  // 야식라면
  { id: 'p_ram1', name: '야식라면공장 3동', meals: ['late'], tags: ['야식라면'], taste: 4, speed: 5, menus: ['짜파구리', '비빔면세트', '만두'], tip: '자정 이후 가능. 스피드 최강.' },
  { id: 'p_ram2', name: '포장마차라면야식', meals: ['late'], tags: ['야식라면'], taste: 3, speed: 5, menus: ['라면', '김밥', '튀김'], tip: '급할 때. 배민 야식.' },
  { id: 'p_ram3', name: '심야라면연구소', meals: ['late'], tags: ['야식라면'], taste: 4, speed: 4, menus: ['차돌라면', '계란추가'], tip: '야근러 추천.' },
  // 곱창
  { id: 'p_gop1', name: '곱창마을 안양', meals: ['late', 'dinner'], tags: ['곱창'], taste: 5, speed: 3, menus: ['모둠곱창', '막창', '볶음밥'], tip: '야식 끝판왕. 배민 평점 높음.' },
  { id: 'p_gop2', name: '하루곱창 평촌', meals: ['late'], tags: ['곱창'], taste: 4, speed: 3, menus: ['곱창전골', '모둠'], tip: '양 많음. 여럿이.' },
  { id: 'p_gop3', name: '불곱창명가', meals: ['late', 'dinner'], tags: ['곱창'], taste: 4, speed: 4, menus: ['곱창구이', '대창'], tip: '배달 무난. 맛 안정.' },
];

const WHEEL_COLORS = ["#FF6B6B", "#FFA94D", "#FFD43B", "#69DB7C", "#4DABF7", "#9775FA", "#F783AC", "#20C997"];

let foodSpinning = false;
let foodMealKey = "lunch";
let foodRotation = 0;
let foodHighlight = "";
let foodPick = null;

function starsHtml(n, max = 5) {
  const filled = "★".repeat(Math.max(0, Math.min(max, n)));
  const empty = "☆".repeat(Math.max(0, max - n));
  return `<span class="food-stars" aria-label="${n}점">${filled}<span class="food-stars-empty">${empty}</span></span>`;
}

function loadFoodTried() {
  try {
    const raw = localStorage.getItem(FOOD_TRIED_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveFoodTried(set) {
  localStorage.setItem(FOOD_TRIED_KEY, JSON.stringify([...set]));
}

function isPlaceTried(placeId) {
  return loadFoodTried().has(placeId);
}

function setPlaceTried(placeId, tried) {
  const set = loadFoodTried();
  if (tried) set.add(placeId);
  else set.delete(placeId);
  saveFoodTried(set);
}

function placeMatch(place, menu) {
  if (!menu) return false;
  return (
    place.tags.some((t) => menu.includes(t) || t.includes(menu)) ||
    place.menus.some((m) => menu.includes(m) || m.includes(menu))
  );
}

/** 메뉴당 배민 고평점 순으로 N곳 */
function placesForMenu(mealKey, menu, limit = 3) {
  if (!menu) return [];
  return FOOD_PLACES.filter((p) => p.meals.includes(mealKey) && placeMatch(p, menu))
    .sort((a, b) => b.taste + b.speed - (a.taste + a.speed) || b.taste - a.taste)
    .slice(0, limit);
}

function canManageFoodAnnounce() {
  return isAdmin() || isFoodManager();
}

function foodEmojiFor(category = "", menu = "") {
  const s = `${category} ${menu}`.toLowerCase();
  if (/치킨|chicken|후라이드|양념치킨/.test(s)) return "🍗";
  if (/피자|pizza/.test(s)) return "🍕";
  if (/햄버거|버거|hamburger/.test(s)) return "🍔";
  if (/초밥|스시|회|사시미/.test(s)) return "🍣";
  if (/돈까스|돈가스|까스|카레/.test(s)) return "🍱";
  if (/칼국수|국수|우동|라면|면/.test(s)) return "🍜";
  if (/짜장|짬뽕|탕수|중식|중국/.test(s)) return "🥡";
  if (/삼겹|목살|고기|갈비|스테이크|제육/.test(s)) return "🍖";
  if (/비빔|덮밥|돌솥/.test(s)) return "🍚";
  if (/김치|찌개|된장|국밥|설렁/.test(s)) return "🥘";
  if (/파스타|스파게티|이탈리/.test(s)) return "🍝";
  if (/샐러드|샌드|브런치/.test(s)) return "🥗";
  if (/빵|베이커|케이크|디저트|간식/.test(s)) return "🧁";
  if (/커피|카페|음료/.test(s)) return "☕";
  return "🍽️";
}

function ensureFoodHistory() {
  if (!Array.isArray(state.foodHistory)) state.foodHistory = [];
}

function pushFoodHistory(entry) {
  ensureFoodHistory();
  const category = (entry.category || entry.menu || "").trim();
  const vendorName = (entry.vendorName || "").trim();
  const dish = (entry.dish || entry.topMenu || "").trim();
  const date = entry.date || today();
  const dup = state.foodHistory.find(
    (h) => h.date === date && h.category === category && h.vendorName === vendorName
  );
  if (dup) {
    if (dish) dup.dish = dish;
    dup.emoji = foodEmojiFor(category, dish || category);
    return;
  }
  state.foodHistory.unshift({
    id: uid("fh"),
    date,
    mealLabel: entry.mealLabel || "",
    category,
    vendorName,
    dish,
    emoji: foodEmojiFor(category, dish || category),
  });
  state.foodHistory = state.foodHistory.slice(0, 48);
}

function syncFoodHistoryFromPolls() {
  ensureFoodPolls();
  ensureFoodHistory();
  [...(state.foodPolls || [])]
    .filter((p) => p.status === "open" || p.status === "closed" || p.status === "done")
    .sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")))
    .forEach((p) => {
      const top = foodPollTally(p)[0];
      pushFoodHistory({
        date: p.date,
        mealLabel: p.mealLabel,
        category: p.category || p.menu,
        vendorName: p.vendorName,
        dish: top?.count ? top.place?.name || "" : "",
      });
    });
}

function ensureFoodPolls() {
  if (!Array.isArray(state.foodPolls)) state.foodPolls = [];
}

function defaultFoodCatalog() {
  return [
    { id: "fv1", category: "김치찌개", name: "본가김치찌개(안양3동)", menus: ["김치찌개정식", "계란말이", "공기밥", "된장찌개", "제육추가"], mealTypes: ["lunch", "dinner"] },
    { id: "fv2", category: "비빔밥", name: "돌솥비빔당(안양)", menus: ["돌솥비빔밥", "야채비빔밥", "육회비빔밥", "열무비빔밥", "고추장비빔밥"], mealTypes: ["lunch"] },
    { id: "fv3", category: "제육볶음", name: "제육의정석 안양점", menus: ["제육덮밥", "제육정식", "계란찜", "쌈채소세트", "된장찌개"], mealTypes: ["lunch", "dinner"] },
    { id: "fv4", category: "돈까스", name: "안양왕돈까스", menus: ["등심돈까스", "치즈돈까스", "히레까스", "커리돈까스", "함박스테이크"], mealTypes: ["lunch"] },
    { id: "fv5", category: "칼국수", name: "바지락칼국수골목", menus: ["바지락칼국수", "왕만두", "들깨칼국수", "김치칼국수", "보쌈정식"], mealTypes: ["lunch"] },
    { id: "fv6", category: "짜장면", name: "홍콩반점0410 안양점", menus: ["짜장면", "짬뽕", "탕수육", "간짜장", "삼선짬뽕"], mealTypes: ["lunch", "dinner", "late"] },
    { id: "fv7", category: "삼겹살", name: "삼겹의품격(안양)", menus: ["삼겹살", "목살", "된장찌개", "항정살", "비빔면"], mealTypes: ["dinner"] },
    { id: "fv8", category: "치킨", name: "BBQ 안양호계점", menus: ["황금올리브", "양념치킨", "허니콤보", "레드콤보", "고추바사삭"], mealTypes: ["dinner", "late"] },
  ];
}

function ensureFoodCatalog() {
  if (!Array.isArray(state.foodCatalog)) state.foodCatalog = [];
  if (!state.foodCatalog.length) {
    state.foodCatalog = defaultFoodCatalog();
  }
  state.foodCatalog = state.foodCatalog.map((v) => ({
    id: v.id || uid("fv"),
    category: (v.category || "").trim() || "기타",
    name: (v.name || "").trim() || "업체",
    menus: (Array.isArray(v.menus) ? v.menus : String(v.menus || "").split(","))
      .map((m) => String(m).trim())
      .filter(Boolean)
      .slice(0, 5),
    mealTypes: Array.isArray(v.mealTypes) && v.mealTypes.length ? v.mealTypes : ["lunch", "dinner", "snack", "late"],
    photoUrl: v.photoUrl || "",
    photoDataUrl: v.photoDataUrl || "",
  }));
}

function foodCategoriesForMeal(mealKey) {
  ensureFoodCatalog();
  const set = new Set();
  state.foodCatalog.forEach((v) => {
    if (!mealKey || (v.mealTypes || []).includes(mealKey)) set.add(v.category);
  });
  return [...set];
}

function foodVendorsInCategory(category, mealKey) {
  ensureFoodCatalog();
  return state.foodCatalog.filter(
    (v) => v.category === category && (!mealKey || (v.mealTypes || []).includes(mealKey))
  );
}

function pickRandomFoodVendor(category, mealKey) {
  const list = foodVendorsInCategory(category, mealKey);
  if (!list.length) return null;
  return list[Math.floor(Math.random() * list.length)];
}

function foodPollShareUrl(pollId) {
  const u = new URL(location.href.split("#")[0].split("?")[0], location.href);
  u.searchParams.set("foodPoll", pollId);
  return u.toString();
}

function parseFoodPollIdFromLocation() {
  const q = new URLSearchParams(location.search).get("foodPoll");
  if (q) return q;
  const hash = location.hash.replace(/^#/, "");
  const m = hash.match(/^food-poll[=/](.+)$/);
  return m ? decodeURIComponent(m[1]) : "";
}

function defaultFoodDeadlineHour() {
  const h = new Date().getHours();
  if (h < 11) return 11;
  if (h < 17) return 17;
  return 21;
}

function pad2(n) {
  return String(Math.min(99, Math.max(0, Number(n) || 0))).padStart(2, "0");
}

function normalizeFoodDeadline(hour, minute) {
  const h = Math.min(23, Math.max(0, Number(hour) || 0));
  const m = Math.min(59, Math.max(0, Number(minute) || 0));
  return { deadlineHour: h, deadlineMinute: m };
}

function formatFoodDeadline(hour, minute = 0) {
  const { deadlineHour: h, deadlineMinute: m } = normalizeFoodDeadline(hour, minute);
  return `${pad2(h)}시 ${pad2(m)}분`;
}

function foodDeadlineSelectHtml(draft) {
  const { deadlineHour: h, deadlineMinute: m } = normalizeFoodDeadline(
    draft?.deadlineHour,
    draft?.deadlineMinute ?? 0
  );
  const hourOpts = Array.from({ length: 24 }, (_, i) => {
    const v = pad2(i);
    return `<option value="${i}" ${i === h ? "selected" : ""}>${v}시</option>`;
  }).join("");
  const minuteOpts = Array.from({ length: 60 }, (_, i) => {
    const v = pad2(i);
    return `<option value="${i}" ${i === m ? "selected" : ""}>${v}분</option>`;
  }).join("");
  return `
    <div class="field food-deadline-field">
      <span class="food-deadline-label">마감 시각</span>
      <div class="food-deadline-row">
        <select id="foodDeadlineHour" aria-label="마감 시">${hourOpts}</select>
        <select id="foodDeadlineMinute" aria-label="마감 분">${minuteOpts}</select>
      </div>
      <p class="muted" style="margin:6px 0 0">선택 예: ${formatFoodDeadline(h, m)}까지</p>
    </div>`;
}

function buildFoodDraft(pick) {
  const meal = FOOD_MENUS[foodMealKey];
  const deadlineHour = defaultFoodDeadlineHour();
  const deadlineMinute = 0;
  const date = today();
  const category = pick?.category || "";
  const vendor = pick?.vendor;
  const menus = (vendor?.menus || []).slice(0, 5);
  const menuLines = menus.map((m, i) => `${i + 1}. ${m}`).join("\n");
  const until = formatFoodDeadline(deadlineHour, deadlineMinute);
  const body = [
    `오늘 식사 종목은 ${category} 이고, 업체는 ${vendor?.name || "-"} 입니다.`,
    `대표 메뉴는 아래와 같습니다. (아래 ${menus.length || 5}개 중에 고르기)`,
    "",
    menuLines || "(대표 메뉴를 업체 관리에서 등록해 주세요.)",
    "",
    `드시고 싶은 메뉴를 ${until}까지 체크해 주세요.`,
  ].join("\n");
  return {
    id: uid("fp"),
    menu: category,
    category,
    vendorId: vendor?.id || "",
    vendorName: vendor?.name || "",
    mealKey: foodMealKey,
    mealLabel: meal.label,
    date,
    deadlineHour,
    deadlineMinute,
    places: menus.map((m, i) => ({
      id: `${vendor?.id || "m"}_${i}`,
      name: m,
      menus: [m],
      tip: vendor?.name || "",
    })),
    body,
    status: "draft",
  };
}

let foodDraft = null;

function foodAnnounceHtml(draft) {
  if (!draft) return "";
  const options = draft.places
    .map(
      (p, i) => `
      <label class="food-announce-option">
        <span class="food-announce-num">${i + 1}</span>
        <span>
          <strong>${escapeHtml(p.name)}</strong>
          ${p.tip ? `<span class="muted">${escapeHtml(p.tip)}</span>` : ""}
        </span>
      </label>`
    )
    .join("");
  return `
    <section class="panel food-announce-panel food-manage-only" id="foodAnnouncePanel">
      <div class="panel-head">
        <div>
          <h2 class="panel-title">식사 메뉴 공지 초안</h2>
          <p class="muted" style="margin:4px 0 0">${escapeHtml(draft.vendorName || "")} · ${escapeHtml(draft.category || draft.menu || "")} · 확정 시 TF 전체에 메뉴선택 알람이 갑니다.</p>
        </div>
      </div>
      ${foodDeadlineSelectHtml(draft)}
      <textarea class="food-announce-body" id="foodAnnounceBody" rows="10">${escapeHtml(draft.body)}</textarea>
      <div class="food-announce-options">${options || `<div class="empty">대표메뉴를 업체 관리에서 등록해 주세요.</div>`}</div>
      <div class="row" style="margin-top:12px;flex-wrap:wrap;gap:8px">
        <button type="button" class="btn btn-primary" id="foodConfirmBtn">확정 · TF 공지</button>
        <button type="button" class="btn" id="foodKakaoCopyBtn">카톡으로 알리기 (복사)</button>
        <button type="button" class="btn btn-ghost" id="foodKakaoFileBtn">카톡용 URL 파일</button>
      </div>
      <p class="muted" id="foodAnnounceHint" style="margin:10px 0 0">「확정」을 먼저 누르면 투표 링크가 생성됩니다. 이후 카톡 버튼으로 붙여넣기 하세요.</p>
    </section>`;
}

function syncFoodDraftFromForm() {
  if (!foodDraft) return null;
  const hourEl = $("#foodDeadlineHour");
  const minuteEl = $("#foodDeadlineMinute");
  const bodyEl = $("#foodAnnounceBody");
  const next = normalizeFoodDeadline(
    hourEl ? hourEl.value : foodDraft.deadlineHour,
    minuteEl ? minuteEl.value : foodDraft.deadlineMinute ?? 0
  );
  foodDraft.deadlineHour = next.deadlineHour;
  foodDraft.deadlineMinute = next.deadlineMinute;
  if (bodyEl) foodDraft.body = bodyEl.value;
  const until = formatFoodDeadline(foodDraft.deadlineHour, foodDraft.deadlineMinute);
  foodDraft.body = foodDraft.body.replace(
    /드시고 싶은 메뉴를 .+?까지/,
    `드시고 싶은 메뉴를 ${until}까지`
  );
  if (bodyEl) bodyEl.value = foodDraft.body;
  return foodDraft;
}

function confirmFoodPoll() {
  if (!canManageFoodAnnounce() || !foodDraft) return;
  ensureFoodPolls();
  ensureRequests();
  syncFoodDraftFromForm();
  const draft = foodDraft;
  const poll = {
    ...draft,
    status: "open",
    createdBy: sessionUser || "",
    createdAt: new Date().toISOString(),
    votes: [],
  };
  const existing = state.foodPolls.findIndex((p) => p.id === poll.id);
  if (existing >= 0) state.foodPolls[existing] = poll;
  else state.foodPolls.unshift(poll);

  const groupId = uid("g");
  state.members.forEach((m) => {
    state.requests.push({
      id: uid("req"),
      groupId,
      title: "메뉴를 선택해 주세요",
      memo: `${poll.date} ${poll.mealLabel} 「${poll.menu}」 후보 중 투표해 주세요. (${formatFoodDeadline(poll.deadlineHour, poll.deadlineMinute)}까지)\n${foodPollShareUrl(poll.id)}`,
      requester: sessionUser || "식사담당",
      recipient: m.name,
      dueDate: poll.date,
      status: "대기",
      createdAt: today(),
    });
  });

  foodDraft = { ...poll, status: "open" };
  pushFoodHistory({
    date: poll.date,
    mealLabel: poll.mealLabel,
    category: poll.category || poll.menu,
    vendorName: poll.vendorName,
    dish: "",
  });
  persist();
  updateRequestPlane();
  alert(
    `${poll.date} ${poll.mealLabel} 메뉴는 이 후보 중에서 고르는 것으로 공지했습니다.\nTF 전체에 메뉴선택 알람을 보냈습니다.`
  );
  renderFood();
}

function copyFoodPollForKakao() {
  if (!canManageFoodAnnounce() || !foodDraft) return;
  syncFoodDraftFromForm();
  const poll =
    state.foodPolls?.find((p) => p.id === foodDraft.id) ||
    (foodDraft.status === "open" ? foodDraft : null);
  if (!poll || poll.status !== "open") {
    alert("먼저 「확정 · TF 공지」를 눌러 투표 링크를 만들어 주세요.");
    return;
  }
  const url = foodPollShareUrl(poll.id);
  const menuLines = (poll.places || [])
    .map((p, i) => `${i + 1}. ${p.name}`)
    .join("\n");
  const text = [
    `🍽 [연어회 TF 식사 투표]`,
    `${poll.date} ${poll.mealLabel}`,
    "",
    poll.body || "",
    "",
    "▼ 후보 메뉴",
    menuLines || "(메뉴 확인)",
    "",
    "▶ 투표하러 가기 (이름 선택 후 메뉴 체크)",
    url,
    "",
    "※ 선택하면 성명·메뉴가 TF Pulse에 자동 취합됩니다.",
  ].join("\n");
  navigator.clipboard.writeText(text).then(
    () => alert("카톡에 붙여넣을 안내 문구와 링크를 복사했습니다."),
    () => {
      prompt("복사해서 카톡에 붙여넣으세요:", text);
    }
  );
}

function downloadFoodPollUrlFile() {
  if (!canManageFoodAnnounce() || !foodDraft) return;
  syncFoodDraftFromForm();
  const poll = state.foodPolls?.find((p) => p.id === foodDraft.id);
  if (!poll || poll.status !== "open") {
    alert("먼저 「확정 · TF 공지」를 눌러 주세요.");
    return;
  }
  const url = foodPollShareUrl(poll.id);
  const content = [
    `[InternetShortcut]`,
    `URL=${url}`,
    "",
    `TF 식사 투표: ${poll.menu}`,
    url,
  ].join("\n");
  const blob = new Blob(["\uFEFF" + content], { type: "text/plain;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `TF식사투표_${poll.date}.url.txt`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function bindFoodAnnouncePanel() {
  if (!canManageFoodAnnounce()) return;
  $("#foodConfirmBtn")?.addEventListener("click", () => confirmFoodPoll());
  $("#foodKakaoCopyBtn")?.addEventListener("click", () => copyFoodPollForKakao());
  $("#foodKakaoFileBtn")?.addEventListener("click", () => downloadFoodPollUrlFile());
  $("#foodDeadlineHour")?.addEventListener("change", () => syncFoodDraftFromForm());
  $("#foodDeadlineMinute")?.addEventListener("change", () => syncFoodDraftFromForm());
}

function foodPollById(id) {
  ensureFoodPolls();
  return state.foodPolls.find((p) => p.id === id);
}

function voteFoodPoll(pollId, placeId, voterName) {
  ensureFoodPolls();
  const poll = foodPollById(pollId);
  if (!poll || poll.status !== "open") {
    alert("진행 중인 투표가 없습니다.");
    return false;
  }
  const name = (voterName || sessionUser || "").trim();
  if (!name) {
    alert("투표자 이름을 선택해 주세요.");
    return false;
  }
  poll.votes = (poll.votes || []).filter((v) => v.by !== name);
  poll.votes.push({ by: name, placeId, at: new Date().toISOString() });
  const top = foodPollTally(poll)[0];
  pushFoodHistory({
    date: poll.date,
    mealLabel: poll.mealLabel,
    category: poll.category || poll.menu,
    vendorName: poll.vendorName,
    dish: top?.place?.name || "",
  });
  persist();
  return true;
}

function foodPollTally(poll) {
  const map = {};
  (poll.places || []).forEach((p) => {
    map[p.id] = { place: p, count: 0, voters: [] };
  });
  (poll.votes || []).forEach((v) => {
    if (!map[v.placeId]) return;
    map[v.placeId].count += 1;
    map[v.placeId].voters.push(v.by);
  });
  return Object.values(map).sort((a, b) => b.count - a.count);
}

function renderFoodPollVoteOverlay(pollId) {
  ensureFoodPolls();
  const poll = foodPollById(pollId);
  if (!poll) {
    alert("투표 링크가 올바르지 않거나 만료되었습니다.");
    return;
  }
  let host = $("#foodPollOverlay");
  if (!host) {
    host = document.createElement("div");
    host.id = "foodPollOverlay";
    host.className = "food-poll-overlay";
    document.body.appendChild(host);
  }
  host.onclick = (e) => {
    if (e.target === host) host.hidden = true;
  };
  const tally = foodPollTally(poll);
  const myVote = (poll.votes || []).find((v) => v.by === sessionUser);
  host.hidden = false;
  host.innerHTML = `
    <div class="food-poll-card">
      <div class="panel-head">
        <div>
          <h2 class="panel-title">${escapeHtml(poll.date)} ${escapeHtml(poll.mealLabel)} 메뉴 투표</h2>
          <p class="muted">메뉴: <strong>${escapeHtml(poll.menu)}</strong> · ${escapeHtml(formatFoodDeadline(poll.deadlineHour, poll.deadlineMinute))}까지</p>
        </div>
        <button type="button" class="btn btn-ghost btn-sm" id="foodPollClose">닫기</button>
      </div>
      <pre class="food-poll-body">${escapeHtml(poll.body)}</pre>
      <div class="food-poll-vote-list">
        ${(poll.places || [])
          .map((p) => {
            const row = tally.find((t) => t.place.id === p.id);
            const checked = myVote?.placeId === p.id ? "checked" : "";
            return `<label class="food-poll-vote-item">
              <input type="radio" name="foodVotePlace" value="${escapeAttr(p.id)}" ${checked} />
              <span>
                <strong>${escapeHtml(p.name)}</strong>
                <span class="muted">${escapeHtml((p.menus || []).join(", "))}</span>
                <span class="food-poll-count">${row?.count || 0}표 ${row?.voters?.length ? `(${escapeHtml(row.voters.join(", "))})` : ""}</span>
              </span>
            </label>`;
          })
          .join("")}
      </div>
      ${
        !sessionUser
          ? `<label class="field">이름 선택
              <select id="foodPollVoter">
                <option value="">선택</option>
                ${state.members.map((m) => `<option value="${escapeAttr(m.name)}">${escapeHtml(m.name)}</option>`).join("")}
              </select>
            </label>`
          : `<p class="muted">${escapeHtml(sessionUser)}님으로 투표합니다.</p>`
      }
      <div class="row" style="margin-top:12px">
        <button type="button" class="btn btn-primary" id="foodPollSubmit">투표 저장</button>
      </div>
    </div>
  `;
  $("#foodPollClose")?.addEventListener("click", () => {
    host.hidden = true;
  });
  $("#foodPollSubmit")?.addEventListener("click", () => {
    const placeId = host.querySelector('input[name="foodVotePlace"]:checked')?.value;
    const voter = sessionUser || $("#foodPollVoter")?.value || "";
    if (!placeId) {
      alert("메뉴(맛집)를 선택해 주세요.");
      return;
    }
    if (voteFoodPoll(poll.id, placeId, voter)) {
      alert("투표가 반영되었습니다.");
      renderFoodPollVoteOverlay(poll.id);
      if ($("#view-food")?.classList.contains("active")) renderFood();
    }
  });
}

function openFoodPollFromLocation() {
  const id = parseFoodPollIdFromLocation();
  if (!id) return;
  ensureFoodPolls();
  if (!foodPollById(id)) return;
  window.setTimeout(() => renderFoodPollVoteOverlay(id), 400);
}

function renderPlaceCards(mealKey, highlightMenu = "") {
  if (foodPick?.vendor) {
    const v = foodPick.vendor;
    return `
      <article class="place-card is-hit">
        <header class="place-card-head">
          <h3 class="place-name">${escapeHtml(v.name)}</h3>
          <div class="place-card-badges">
            <span class="badge">${escapeHtml(foodPick.category)}</span>
            <span class="badge ok">선정</span>
          </div>
        </header>
        <p class="place-menus"><strong>대표메뉴</strong> ${escapeHtml((v.menus || []).join(", ") || "-")}</p>
      </article>`;
  }
  return `<div class="empty">돌림판을 돌려 종목·업체를 선정해 주세요.</div>`;
}

function renderFoodCatalogPanel() {
  if (!canManageFoodAnnounce()) return "";
  ensureFoodCatalog();
  const rows = state.foodCatalog
    .map(
      (v) => `
    <tr data-vendor-id="${escapeAttr(v.id)}">
      <td>${escapeHtml(v.category)}</td>
      <td>${escapeHtml(v.name)}</td>
      <td class="muted">${escapeHtml((v.menus || []).join(", "))}${
        v.photoDataUrl || v.photoUrl
          ? ` · <span class="food-photo-tag">메뉴판</span>`
          : ""
      }</td>
      <td class="muted">${escapeHtml((v.mealTypes || []).map((k) => FOOD_MENUS[k]?.label || k).join(", "))}</td>
      <td>
        <div class="row">
          <button type="button" class="btn btn-sm" data-edit-vendor="${escapeAttr(v.id)}">수정</button>
          <button type="button" class="btn btn-sm btn-danger" data-del-vendor="${escapeAttr(v.id)}">삭제</button>
        </div>
      </td>
    </tr>`
    )
    .join("");
  return `
    <section class="food-tried-admin panel food-catalog-panel food-manage-only">
      <div class="panel-head">
        <div>
          <h3 class="section-title">종목·업체·대표메뉴 관리 (${isFoodManager() ? "식사담당" : "관리자"})</h3>
          <p class="food-catalog-notice">이 화면은 식사 담당과 관리자만 보이는 화면입니다.</p>
          <p class="muted" style="margin:4px 0 0">돌림판은 등록된 종목을 돌리고, 해당 종목의 업체를 랜덤으로 고릅니다.</p>
        </div>
        <button type="button" class="btn btn-primary btn-sm" id="addFoodVendor">업체 추가</button>
      </div>
      <div class="table-wrap">
        <table class="food-catalog-table">
          <thead>
            <tr>
              <th>종목</th>
              <th>업체</th>
              <th>대표메뉴(최대5)</th>
              <th>식사구분</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${rows || `<tr><td colspan="5"><div class="empty">등록된 업체가 없습니다.</div></td></tr>`}
          </tbody>
        </table>
      </div>
    </section>`;
}

function openFoodVendorModal(id) {
  if (!canManageFoodAnnounce()) return;
  ensureFoodCatalog();
  const item = id ? state.foodCatalog.find((v) => v.id === id) : null;
  const mealChecks = Object.entries(FOOD_MENUS)
    .map(([key, m]) => {
      const checked = item ? (item.mealTypes || []).includes(key) : key === "lunch" || key === "dinner";
      return `<label class="alt-submit-check"><input type="checkbox" name="mealTypes" value="${key}" ${checked ? "checked" : ""} /><span>${m.label}</span></label>`;
    })
    .join("");
  const menus = [...(item?.menus || []), "", "", "", "", ""].slice(0, 5);
  openModal({
    title: item ? "업체 수정" : "업체 추가",
    bodyHtml: `
      <div class="form-grid two">
        <label class="field">종목
          <input name="category" list="foodCategoryList" required value="${escapeAttr(item?.category || "")}" placeholder="예: 제육볶음, 중식" />
          <datalist id="foodCategoryList">
            ${foodCategoriesForMeal().map((c) => `<option value="${escapeAttr(c)}"></option>`).join("")}
          </datalist>
        </label>
        <label class="field">업체명
          <input name="name" required value="${escapeAttr(item?.name || "")}" placeholder="예: 제육의정석 안양점" />
        </label>
        ${menus
          .map(
            (m, i) => `
        <label class="field ${i === 0 ? "full" : ""}">대표메뉴 ${i + 1}${i < 3 ? " *" : ""}
          <input name="menu${i}" value="${escapeAttr(m)}" placeholder="메뉴명 (3~5개 권장)" />
        </label>`
          )
          .join("")}
        <label class="field full">메뉴판 사진 URL
          <input name="photoUrl" value="${escapeAttr(item?.photoUrl || "")}" placeholder="https://… (선택)" />
        </label>
        <label class="field full">메뉴판 사진 파일
          <input type="file" name="photoFile" accept="image/*" />
          ${item?.photoDataUrl ? `<span class="muted" style="display:block;margin-top:4px">등록된 사진 있음</span>` : ""}
        </label>
        <div class="field full">
          <span class="muted">식사구분</span>
          <div class="row" style="margin-top:6px;flex-wrap:wrap;gap:8px">${mealChecks}</div>
        </div>
      </div>
    `,
    onSubmit: async (fd) => {
      const category = fd.get("category").toString().trim();
      const name = fd.get("name").toString().trim();
      const menuList = [0, 1, 2, 3, 4]
        .map((i) => (fd.get(`menu${i}`) || "").toString().trim())
        .filter(Boolean)
        .slice(0, 5);
      const mealTypes = fd.getAll("mealTypes").map(String);
      const photoUrl = (fd.get("photoUrl") || "").toString().trim();
      if (!category || !name) {
        alert("종목과 업체명을 입력해 주세요.");
        return false;
      }
      if (menuList.length < 3) {
        alert("대표메뉴를 3~5개 입력해 주세요.");
        return false;
      }
      let photoDataUrl = item?.photoDataUrl || "";
      const file = fd.get("photoFile");
      if (file && file instanceof File && file.size > 0) {
        if (file.size > 2.5 * 1024 * 1024) {
          alert("메뉴판 사진은 2.5MB 이하로 올려 주세요.");
          return false;
        }
        photoDataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ""));
          reader.onerror = () => reject(new Error("읽기 실패"));
          reader.readAsDataURL(file);
        }).catch(() => "");
      }
      const data = {
        category,
        name,
        menus: menuList,
        mealTypes: mealTypes.length ? mealTypes : ["lunch", "dinner", "snack", "late"],
        photoUrl,
        photoDataUrl,
      };
      if (item) Object.assign(item, data);
      else state.foodCatalog.push({ id: uid("fv"), ...data });
      persist();
      renderFood();
      return true;
    },
  });
}

function bindFoodCatalogPanel(root) {
  if (!canManageFoodAnnounce()) return;
  $("#addFoodVendor")?.addEventListener("click", () => openFoodVendorModal());
  root.querySelectorAll("[data-edit-vendor]").forEach((btn) =>
    btn.addEventListener("click", () => openFoodVendorModal(btn.dataset.editVendor))
  );
  root.querySelectorAll("[data-del-vendor]").forEach((btn) =>
    btn.addEventListener("click", () => {
      if (!canManageFoodAnnounce()) return;
      if (!confirm("이 업체를 삭제할까요?")) return;
      state.foodCatalog = state.foodCatalog.filter((v) => v.id !== btn.dataset.delVendor);
      persist();
      renderFood();
    })
  );
}

function showFoodPlaces(menu) {
  const panel = $("#foodPlaces");
  const list = $("#placeList");
  const sub = $("#foodPlacesSub");
  if (!panel || !list) return;
  list.innerHTML = renderPlaceCards(foodMealKey, menu);
  if (sub) {
    sub.textContent = foodPick
      ? `종목 ${foodPick.category} · 업체 ${foodPick.vendor?.name || "-"}`
      : `「${menu}」 선정 결과`;
  }
  panel.hidden = false;
  panel.classList.remove("pop-in");
  void panel.offsetWidth;
  panel.classList.add("pop-in");
}

function hideFoodPlaces() {
  const panel = $("#foodPlaces");
  if (!panel) return;
  panel.hidden = true;
  panel.classList.remove("pop-in");
}

function renderFood() {
  ensureFoodCatalog();
  const el = $("#view-food");
  const meal = FOOD_MENUS[foodMealKey];
  const items = foodCategoriesForMeal(foodMealKey);
  const wheelItems = items.length ? items : ["등록필요"];
  const slice = 360 / wheelItems.length;
  const gradient = wheelItems
    .map((_, i) => `${WHEEL_COLORS[i % WHEEL_COLORS.length]} ${i * slice}deg ${(i + 1) * slice}deg`)
    .join(", ");
  const labelRadius = wheelItems.length <= 4 ? 100 : 112;

  el.innerHTML = `
    <div class="food-page">
      <p class="food-lead">담당자가 음식·식당·대표메뉴(3~5)·메뉴판 사진을 등록하면, 돌림판이 종목·업체를 랜덤 배정합니다. 투표 링크를 카톡으로 보내면 성명·메뉴가 자동 취합됩니다.</p>
      <div class="food-meal-tabs">
        ${Object.entries(FOOD_MENUS)
          .map(
            ([key, m]) =>
              `<button type="button" class="food-meal-btn ${key === foodMealKey ? "active" : ""}" data-meal="${key}">${m.label}</button>`
          )
          .join("")}
      </div>

      <div class="food-layout ${foodPick ? "has-result" : ""} ${canManageFoodAnnounce() && foodDraft ? "has-draft" : ""}">
        <div class="food-wheel-col">
          <div class="wheel-stage">
            <div class="wheel-pointer" aria-hidden="true"></div>
            <div class="wheel" id="foodWheel" style="background: conic-gradient(${gradient}); transform: rotate(${foodRotation}deg)">
              ${wheelItems
                .map((name, i) => {
                  const angle = i * slice + slice / 2;
                  return `<span class="wheel-label" style="transform: rotate(${angle}deg) translateY(-${labelRadius}px) rotate(${-angle}deg)">${escapeHtml(name)}</span>`;
                })
                .join("")}
            </div>
          </div>
          <button type="button" class="btn btn-primary food-spin-btn" id="foodSpinBtn" ${items.length ? "" : "disabled"}>돌리기</button>
          <div class="food-result" id="foodResult" aria-live="polite"></div>
        </div>

        ${
          canManageFoodAnnounce() && foodDraft
            ? foodAnnounceHtml(foodDraft)
            : `<aside class="food-places" id="foodPlaces" ${foodPick ? "" : "hidden"}>
          <div class="food-places-head">
            <h2 class="panel-title">선정 업체</h2>
            <p class="muted" id="foodPlacesSub">${
              foodPick
                ? `종목 ${escapeHtml(foodPick.category)} · ${escapeHtml(foodPick.vendor?.name || "")}`
                : "돌림판 결과가 여기 표시됩니다"
            }</p>
          </div>
          <div class="place-list" id="placeList">
            ${foodPick ? renderPlaceCards(foodMealKey, foodPick.category) : ""}
          </div>
        </aside>`
        }
      </div>
      ${renderOpenFoodPollSummary()}
      ${renderFoodHistory()}
      ${renderFoodCatalogPanel()}
    </div>
  `;

  if (foodPick) {
    const result = $("#foodResult");
    if (result) {
      result.className = "food-result is-win";
      result.innerHTML = `오늘의 <strong>${escapeHtml(meal.label)}</strong><br />
        <span class="food-win-name">${escapeHtml(foodPick.category)}</span>
        <div class="muted" style="margin-top:6px;font-size:0.95rem">업체 · <strong>${escapeHtml(foodPick.vendor?.name || "-")}</strong></div>`;
    }
    $("#foodPlaces")?.classList.add("pop-in");
  }

  el.querySelectorAll("[data-meal]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (foodSpinning) return;
      foodMealKey = btn.dataset.meal;
      foodRotation = 0;
      foodHighlight = "";
      foodPick = null;
      foodDraft = null;
      renderFood();
    });
  });

  $("#foodSpinBtn")?.addEventListener("click", () => spinFoodWheel());
  bindFoodAnnouncePanel();
  bindFoodCatalogPanel(el);
  el.querySelectorAll("[data-open-poll]").forEach((btn) =>
    btn.addEventListener("click", () => renderFoodPollVoteOverlay(btn.dataset.openPoll))
  );
}

function renderOpenFoodPollSummary() {
  ensureFoodPolls();
  const openPolls = state.foodPolls.filter((p) => p.status === "open").slice(0, 3);
  if (!openPolls.length) return "";
  return `
    <section class="panel" style="margin-top:12px">
      <div class="panel-head"><h2 class="panel-title">진행 중 식사 투표</h2></div>
      <div class="bar-list">
        ${openPolls
          .map((p) => {
            const top = foodPollTally(p)[0];
            const label = p.vendorName ? `${p.menu} · ${p.vendorName}` : p.menu;
            return `<div class="bar-item">
              <div class="meta">
                <strong>${escapeHtml(p.date)} ${escapeHtml(p.mealLabel)} · ${escapeHtml(label)}</strong>
                <span>${(p.votes || []).length}표 · 1위 ${escapeHtml(top?.place?.name || "-")} (${top?.count || 0})</span>
              </div>
              <button type="button" class="btn btn-sm" data-open-poll="${escapeAttr(p.id)}">투표·현황</button>
            </div>`;
          })
          .join("")}
      </div>
    </section>`;
}

function renderFoodHistory() {
  syncFoodHistoryFromPolls();
  ensureFoodHistory();
  const items = state.foodHistory.slice(0, 24);
  return `
    <section class="panel food-history-panel">
      <div class="panel-head">
        <div>
          <h2 class="panel-title">우리 그동안 요 음식들을 먹었었네요.</h2>
          <p class="muted" style="margin:4px 0 0">식사담당이 공지·확정한 식사 기록이 여기에 쌓입니다.</p>
        </div>
      </div>
      ${
        items.length
          ? `<div class="food-history-grid">
              ${items
                .map(
                  (h) => `
                <article class="food-history-card" title="${escapeAttr(
                  [h.date, h.mealLabel, h.vendorName, h.dish].filter(Boolean).join(" · ")
                )}">
                  <span class="food-history-emoji" aria-hidden="true">${h.emoji || "🍽️"}</span>
                  <div class="food-history-body">
                    <strong>${escapeHtml(h.category || h.dish || "식사")}</strong>
                    <span class="muted">${escapeHtml(
                      [h.date, h.mealLabel, h.vendorName || h.dish].filter(Boolean).join(" · ")
                    )}</span>
                  </div>
                </article>`
                )
                .join("")}
            </div>`
          : `<div class="empty">아직 기록된 식사가 없습니다. 식사담당이 메뉴를 확정하면 여기에 표시됩니다.</div>`
      }
    </section>`;
}

function spinFoodWheel() {
  if (foodSpinning) return;
  ensureFoodCatalog();
  const meal = FOOD_MENUS[foodMealKey];
  const items = foodCategoriesForMeal(foodMealKey);
  if (!items.length) {
    alert(
      canManageFoodAnnounce()
        ? "이 식사구분에 등록된 종목·업체가 없습니다. 아래에서 먼저 추가해 주세요."
        : "등록된 종목·업체가 아직 없습니다. 식사담당에게 등록을 요청해 주세요."
    );
    return;
  }
  if (!canManageFoodAnnounce()) {
    alert("돌려볼 수는 있지만 메뉴 결정은 식사담당만 가능합니다!");
  }
  const n = items.length;
  const slice = 360 / n;
  const winIndex = Math.floor(Math.random() * n);
  const center = winIndex * slice + slice / 2;
  const currentMod = ((foodRotation % 360) + 360) % 360;
  const desiredMod = (360 - center) % 360;
  let delta = (desiredMod - currentMod + 360) % 360;
  delta += (5 + Math.floor(Math.random() * 3)) * 360;
  const finalRotation = foodRotation + delta;

  foodSpinning = true;
  hideFoodPlaces();
  foodHighlight = "";
  foodPick = null;
  foodDraft = null;
  const layout = document.querySelector(".food-layout");
  layout?.classList.remove("has-result");

  const btn = $("#foodSpinBtn");
  const wheel = $("#foodWheel");
  const result = $("#foodResult");
  if (btn) btn.disabled = true;
  if (result) {
    result.className = "food-result";
    result.textContent = `${meal.label} 종목·업체 고르는 중…`;
  }

  if (wheel) {
    wheel.style.transition = "transform 4.2s cubic-bezier(0.12, 0.75, 0.12, 1)";
    wheel.style.transform = `rotate(${finalRotation}deg)`;
  }

  window.setTimeout(() => {
    foodRotation = finalRotation % 360;
    foodSpinning = false;
    const category = items[winIndex];
    const vendor = pickRandomFoodVendor(category, foodMealKey);
    foodHighlight = category;
    foodPick = { category, vendor };
    if (btn) btn.disabled = false;
    if (wheel) {
      wheel.style.transition = "none";
      wheel.style.transform = `rotate(${foodRotation}deg)`;
    }
    if (result) {
      result.className = "food-result is-win";
      result.innerHTML = `오늘의 <strong>${escapeHtml(meal.label)}</strong><br />
        <span class="food-win-name">${escapeHtml(category)}</span>
        <div class="muted" style="margin-top:6px;font-size:0.95rem">업체 · <strong>${escapeHtml(vendor?.name || "-")}</strong></div>`;
    }
    layout?.classList.add("has-result");
    showFoodPlaces(category);
    if (canManageFoodAnnounce() && vendor) {
      foodDraft = buildFoodDraft(foodPick);
      renderFood();
      $("#foodAnnouncePanel")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, 4300);
}


const GUIDE_SECTIONS = [
  {
    id: "direction",
    title: "이 시스템이 향하는 방향",
    body: [
      "TF Pulse는 여러 명이 보고서를 함께 쓸 때, 내 할 일·팀 진도·작성 기준(운영계획/결과보고)을 맞추는 운영 허브입니다.",
      "홈에서 할 일과 진도를 보고, 취합·요청·예산·목차 할당으로 이어집니다.",
      "이름은 선택해 접속하고 데이터는 이 기기 브라우저에 저장됩니다. 관리자는 JSON 내보내기·가져오기로 팀 원본을 맞춥니다.",
    ],
  },
  {
    id: "roles",
    title: "역할로 보는 권한",
    body: [
      "관리자: 목차·할당, 대상자, 공통 요청, 취합 현황의 AI 분석, JSON 백업 등 전체 설정",
      "예산·성과지표담당자: 제출된 항목을 영역별로 끌어 배치하고 엑셀로 내려받습니다.",
      "식사담당: 종목·업체·대표메뉴 등록, 돌림판 후 TF 공지·투표 링크",
      "대상자: 담당 파트 취합 입력, 받은 요청 처리, 배정 예산 산출 입력, 보고서 만들기 활용",
    ],
  },
];

const GUIDE_MENU = [
  {
    tab: "dashboard",
    name: "TF 요약",
    how: "제출일시·잔여기간, 달력, 마라톤 진도(킥오프→최종)를 한눈에 봅니다.",
  },
  {
    tab: "ai-art",
    name: "내업무 · 그림",
    how: "영역 · 레이아웃 · 내용을 고르면 보고서 그림을 만듭니다.",
  },
  {
    tab: "kpi",
    name: "내업무 · 지표",
    how: "성과지표를 입력·제출하면 담당자 화면에서 영역별로 끌어 배치합니다.",
  },
  {
    tab: "budget",
    name: "내업무 · 예산",
    how: "예산을 입력·제출하면 예산담당자 화면에서 영역별로 끌어 배치합니다.",
  },
  {
    tab: "collections",
    name: "모아보기",
    how: "보고서 통합 · 예산 통합 · 성과지표 통합만 봅니다. 일괄 다운로드와 평가회의 요약표 출력을 쓸 수 있습니다.",
  },
  {
    tab: "food",
    name: "내업무 · 식사",
    how: "업체·대표메뉴 등록 후 돌림판·투표·카톡 공유합니다.",
  },
  {
    tab: "guide",
    name: "사용방법",
    how: "메뉴 구성과 역할별 사용 팁을 안내합니다.",
  },
  {
    tab: "members",
    name: "Setting",
    how: "관리자 전용. 구성원·목차·할당·드라이브(지침·서식·스타일가이드)를 관리합니다.",
    adminOnly: true,
  },
];

const GUIDE_TIPS = [
  "상단 메뉴는 TF 요약 · 내업무 · 모아보기 · 사용방법 네 칸입니다. 관리자는 Setting이 추가됩니다.",
  "내업무는 그림 · 지표 · 예산 · 식사만 둡니다. 제출한 예산·지표는 담당자가 영역별로 배치합니다.",
  "접속할 때마다 이름 선택 화면부터 시작합니다. TF주제 리스트에서 TF를 고른 뒤 참가자를 선택하세요.",
  "상단 알람(빨간·파란)을 누르면 일정과 코멘트가 한 창에 같이 보입니다.",
  "「식사」는 내업무 안에 있습니다. 확정 후 카톡 문구·링크로 배포하면 성명·메뉴가 자동 취합됩니다.",
];

function renderGuide() {
  const el = $("#view-guide");
  if (!el) return;
  const menus = GUIDE_MENU.filter((m) => !m.adminOnly || isAdmin());
  el.innerHTML = `
    <div class="overview-page">
      ${GUIDE_SECTIONS.map(
        (sec) => `
        <section class="panel overview-panel">
          <h2 class="panel-title">${escapeHtml(sec.title)}</h2>
          <ul class="overview-list">
            ${sec.body.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}
          </ul>
          ${
            sec.id === "roles"
              ? `<div class="overview-swatches" aria-hidden="true">
                  <span class="ov-swatch admin">관리자</span>
                  <span class="ov-swatch budget">예산</span>
                  <span class="ov-swatch food">식사</span>
                  <span class="ov-swatch member">대상자</span>
                </div>`
              : ""
          }
        </section>`
      ).join("")}

      <section class="panel overview-panel">
        <h2 class="panel-title">메뉴별 사용법</h2>
        <p class="panel-desc">각 항목을 누르면 해당 화면으로 이동합니다.</p>
        <div class="overview-menu-grid">
          ${menus
            .map(
              (m) => `
            <button type="button" class="overview-menu-card" data-goto="${escapeAttr(m.tab)}">
              <strong>${escapeHtml(m.name)}</strong>
              <span>${escapeHtml(m.how)}</span>
            </button>`
            )
            .join("")}
        </div>
      </section>

      <section class="panel overview-panel">
        <h2 class="panel-title">알아두면 좋은 팁</h2>
        <ul class="overview-list">
          ${GUIDE_TIPS.map((t) => `<li>${escapeHtml(t)}</li>`).join("")}
        </ul>
        <div class="overview-cta">
          <button type="button" class="btn btn-primary" data-goto="dashboard">홈으로 시작하기</button>
          <button type="button" class="btn" id="btnDownloadSrsGuide">SRS 문서 다운로드</button>
        </div>
      </section>
    </div>
  `;

  el.querySelectorAll("[data-goto]").forEach((btn) => {
    btn.addEventListener("click", () => setView(btn.dataset.goto));
  });
  $("#btnDownloadSrsGuide")?.addEventListener("click", () => downloadSrsDocument());
}

function checklistStatusBadge(status) {
  const map = {
    ok: { label: "충족", cls: "ok" },
    partial: { label: "부분", cls: "partial" },
    missing: { label: "미비", cls: "missing" },
  };
  const m = map[status] || map.missing;
  return `<span class="ai-check-badge ${m.cls}">${m.label}</span>`;
}

function renderAiBriefCard(item) {
  const a = item.analysis || {};
  const score = Number(a.coverageScore) || 0;
  const checklist = Array.isArray(a.checklist) ? a.checklist : [];
  return `
    <article class="ai-brief-card" data-brief-id="${escapeAttr(item.id)}">
      <header class="ai-brief-card-head">
        <div>
          <p class="ai-brief-kicker">${escapeHtml(item.roundName || "-")} · ${escapeHtml(item.partTitle || "전체")} · 틀 충족 ${score}%</p>
          <h3>${escapeHtml(a.adminBrief || item.fileName || "분석 결과")}</h3>
          <p class="muted">${escapeHtml(a.frame || "연성대 자율혁신계획서 핵심사업 틀")} · ${escapeHtml(item.fileName || "")} · ${escapeHtml((item.createdAt || "").slice(0, 16).replace("T", " "))}</p>
        </div>
        <div class="ai-score-ring" title="틀 충족도 ${score}%"><strong>${score}</strong><span>%</span></div>
      </header>
      <div class="ai-coverage-bar" aria-hidden="true"><span style="width:${Math.min(100, score)}%"></span></div>
      ${
        a.projectName
          ? `<p class="ai-project-name"><strong>핵심사업</strong> ${escapeHtml(a.projectName)}</p>`
          : ""
      }
      <p class="ai-brief-summary">${escapeHtml(a.summary || "")}</p>

      ${
        checklist.length
          ? `<div class="ai-checklist">
              <h4>취합 검증 양식 (자율혁신계획서 틀)</h4>
              <ul>
                ${checklist
                  .map(
                    (c) => `<li>
                      ${checklistStatusBadge(c.status)}
                      <strong>${escapeHtml(c.label || c.id || "")}</strong>
                      <span class="muted">${escapeHtml(c.note || "")}</span>
                    </li>`
                  )
                  .join("")}
              </ul>
            </div>`
          : ""
      }

      <div class="ai-brief-grid">
        <div>
          <h4>현황분석</h4>
          <ul>${(a.statusAnalysis || []).map((x) => `<li>${escapeHtml(x)}</li>`).join("") || "<li class='muted'>없음</li>"}</ul>
          <h4>추진필요성</h4>
          <ul>${(a.necessity || []).map((x) => `<li>${escapeHtml(x)}</li>`).join("") || "<li class='muted'>없음</li>"}</ul>
          <h4>개요·추진체계</h4>
          <p class="muted" style="margin:0;font-size:var(--text-sm);line-height:1.45">${escapeHtml(a.overviewModel || "-")}</p>
        </div>
        <div>
          <h4>3개년·세부계획</h4>
          <ul>${[...(a.plan3y || []), ...(a.planDetail || [])].slice(0, 8).map((x) => `<li>${escapeHtml(x)}</li>`).join("") || "<li class='muted'>없음</li>"}</ul>
          <h4>기대효과 (정량/정성)</h4>
          <ul>${[...(a.effectsQuant || []).map((x) => `[정량] ${x}`), ...(a.effectsQual || []).map((x) => `[정성] ${x}`)]
            .slice(0, 8)
            .map((x) => `<li>${escapeHtml(x)}</li>`)
            .join("") || "<li class='muted'>없음</li>"}</ul>
          <h4>보완 포인트</h4>
          <ul>${(a.gaps || []).map((x) => `<li>${escapeHtml(x)}</li>`).join("") || "<li class='muted'>없음</li>"}</ul>
        </div>
      </div>
      <div class="ai-chip-row" style="margin-top:10px">
        ${(a.themes || []).map((t) => `<span class="ai-chip">${escapeHtml(t)}</span>`).join("")}
        ${
          a.suggestedDiagram
            ? `<span class="ai-chip suggest">추천도식 · ${escapeHtml(a.suggestedDiagram)}</span>`
            : ""
        }
      </div>
      <div class="row" style="margin-top:10px">
        ${
          a.suggestedDiagram
            ? `<button type="button" class="btn btn-sm" data-goto-art="${escapeAttr(item.id)}">보고서 그림으로 이어가기</button>`
            : ""
        }
        <button type="button" class="btn btn-sm btn-danger" data-del-brief="${escapeAttr(item.id)}">삭제</button>
      </div>
    </article>`;
}

function renderAiBriefSectionHtml(defaultRound) {
  if (!isAdmin()) return "";
  ensureAiBriefs();
  const rounds = collectionsNewestFirst();
  const parts = state.parts || [];
  const briefs = [...state.aiBriefs].sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  const roundDefault = defaultRound || activeRound;

  return `
    <div class="ai-page" id="aiBriefSection" style="margin-top:12px">
      <section class="panel ai-upload-panel ai-brief-callout">
        <div class="panel-head">
          <div>
            <h2 class="panel-title">AI 취합검증 · 브리핑</h2>
            <p class="muted" style="margin:4px 0 0">연성대 3주기 자율혁신계획서 핵심사업 틀(선정사유·현황/필요성·개요도·3개년 계획·기대효과)으로 검증합니다. (.txt .docx .hwpx · .hwp는 붙여넣기) · 관리자 전용</p>
          </div>
        </div>
        <div class="form-grid two">
          <label class="field">취합 차수
            <select id="aiBriefRound">
              ${rounds
                .map(
                  (c) =>
                    `<option value="${c.round}" ${c.round === roundDefault ? "selected" : ""}>${escapeHtml(c.name)}</option>`
                )
                .join("")}
            </select>
          </label>
          <label class="field">관련 파트 (선택)
            <select id="aiBriefPart">
              <option value="">전체 / 미지정</option>
              ${parts.map((p) => `<option value="${escapeAttr(p.id)}">${escapeHtml(`${p.section}. ${p.title}`)}</option>`).join("")}
            </select>
          </label>
          <label class="field full">문서 파일
            <input type="file" id="aiBriefFile" accept=".txt,.md,.docx,.hwpx,.hwp,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document" />
          </label>
          <label class="field full">또는 본문 붙여넣기
            <textarea id="aiBriefText" rows="7" placeholder="한글에서 복사한 보고서 본문을 붙여넣으세요."></textarea>
          </label>
        </div>
        <div class="row" style="margin-top:12px;gap:8px;flex-wrap:wrap">
          <button type="button" class="btn btn-primary" id="aiBriefRun">AI 분석 실행</button>
          <span class="muted" id="aiBriefStatus"></span>
        </div>
      </section>

      <section class="panel">
        <div class="panel-head">
          <h2 class="panel-title">검증 브리핑 보드</h2>
          <span class="muted">${briefs.length}건 · 틀 체크리스트 포함</span>
        </div>
        <div class="ai-brief-list">
          ${briefs.length ? briefs.map(renderAiBriefCard).join("") : `<div class="empty">아직 분석 결과가 없습니다. 위에서 문서를 분석해 보세요.</div>`}
        </div>
      </section>
    </div>`;
}

function bindAiBriefPanel(root = document) {
  if (!isAdmin()) return;
  const rounds = state.collections || [];
  $("#aiBriefRun", root)?.addEventListener("click", async () => {
    const status = $("#aiBriefStatus", root);
    const btn = $("#aiBriefRun", root);
    const roundVal = Number($("#aiBriefRound", root)?.value || activeRound);
    const col = rounds.find((c) => c.round === roundVal);
    const partId = $("#aiBriefPart", root)?.value || "";
    const part = partId ? partById(partId) : null;
    let text = ($("#aiBriefText", root)?.value || "").trim();
    let fileName = "붙여넣기 텍스트";
    const file = $("#aiBriefFile", root)?.files?.[0];

    try {
      if (btn) btn.disabled = true;
      if (status) status.textContent = "문서 읽는 중…";
      if (file) {
        fileName = file.name;
        text = await extractTextFromFile(file);
        const ta = $("#aiBriefText", root);
        if (ta) ta.value = text.slice(0, 20000);
      }
      if (text.length < 40) throw new Error("분석할 텍스트가 부족합니다.");
      if (status) status.textContent = "AI 분석 중… (수십 초 걸릴 수 있습니다)";
      const data = await analyzeReportText({
        text,
        fileName,
        roundName: col?.name || `${roundVal}차`,
        partTitle: part ? `${part.section}. ${part.title}` : "",
        tfName: state.meta?.tfName || "",
      });
      ensureAiBriefs();
      state.aiBriefs.unshift({
        id: uid("aib"),
        round: roundVal,
        roundName: col?.name || "",
        partId: partId || "",
        partTitle: part ? `${part.section}. ${part.title}` : "",
        fileName,
        by: sessionUser || "",
        createdAt: new Date().toISOString(),
        analysis: data.analysis,
      });
      state.aiBriefs = state.aiBriefs.slice(0, 40);
      persist();
      if (status) status.textContent = "완료";
      renderCollections();
      $("#aiBriefSection")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err) {
      if (status) status.textContent = "";
      alert(err.message || "분석에 실패했습니다.");
    } finally {
      if (btn) btn.disabled = false;
    }
  });

  root.querySelectorAll("[data-del-brief]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!confirm("이 분석 결과를 삭제할까요?")) return;
      state.aiBriefs = state.aiBriefs.filter((b) => b.id !== btn.dataset.delBrief);
      persist();
      renderCollections();
      $("#aiBriefSection")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  root.querySelectorAll("[data-goto-art]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const brief = state.aiBriefs.find((b) => b.id === btn.dataset.gotoArt);
      if (brief?.analysis?.suggestedDiagram) {
        const hit = REPORT_ART_TYPES.find(
          (t) =>
            brief.analysis.suggestedDiagram.includes(t.name) ||
            t.name.includes(brief.analysis.suggestedDiagram.replace(/모형|도$/g, ""))
        );
        if (hit) state._aiArtType = hit.id;
      }
      state._aiArtBriefId = btn.dataset.gotoArt;
      setView("ai-art");
    });
  });
}

/** 보고서 대구분 — 관리자가 선택하면 이후 틀·도식·GPT 기획이 이 방향을 따름 */
const REPORT_DOC_KINDS = [
  {
    id: "plan",
    name: "운영계획서",
    short: "계획",
    desc: "목표·추진체계·세부계획·기대효과 중심. 「앞으로 무엇을 할지」를 설득하는 도식.",
    focus:
      "목표·추진필요성·체계·프로세스·연도별 계획·정량 목표치·기대효과를 전면에 두고, 실적·달성률 문구는 쓰지 마세요.",
    tone: "계획·설계·추진·목표 설정",
    icon: "fi-rr-clipboard-list-check",
    preferTypes: ["overview", "governance", "certification", "roadmap", "platform"],
  },
  {
    id: "result",
    name: "결과보고서",
    short: "실적",
    desc: "실적·달성·확산·환류 중심. 「무엇을 했고 어떤 성과인가」를 보여주는 도식.",
    focus:
      "실적·달성률·성과지표 향상·공유·확산·개선(환류)을 전면에 두고, 앞으로의 계획 문구만으로 채우지 마세요.",
    tone: "실적·성과·확산·환류",
    icon: "fi-rr-chart-histogram",
    preferTypes: ["improvement", "diffusion", "overview", "icc-matrix", "platform"],
  },
];

function ensureReportDoc() {
  if (!state.report || typeof state.report !== "object") state.report = {};
  state.report.docKind = state.report.docKind === "result" ? "result" : "plan";
}

function getReportDocKind() {
  ensureReportDoc();
  return state.report.docKind === "result" ? "result" : "plan";
}

function setReportDocKind(kind) {
  ensureReportDoc();
  ensureBudget();
  const next = kind === "result" ? "result" : "plan";
  state.report.docKind = next;
  state.budget.inputMode = next;
}

function reportDocKindById(id) {
  return REPORT_DOC_KINDS.find((k) => k.id === id) || REPORT_DOC_KINDS[0];
}

function reportDocKindMeta(kind = getReportDocKind()) {
  return reportDocKindById(kind);
}

/** 보고서 작성 방향 틀 (그룹 선택지) — docKind에 따라 가이드·기본 도식이 달라짐 */
const REPORT_FRAME_GROUPS = [
  {
    id: "core-project",
    name: "핵심사업 기술틀",
    desc: "선정사유 → 현황/필요성 → 개요도 → 3개년·세부 → 효과/실적",
    icon: "fi-rr-diagram-project",
    contextGuidePlan:
      "【보고서 구분】운영계획서\n【작성 방향】핵심사업 페이지 구조로 정리\n1) 핵심사업명·목표\n2) 선정사유\n3) 현황분석 / 추진필요성\n4) 개요(추진체계·프로세스)\n5) 3개년 정량 목표(2025–2027)\n6) 해당연도 세부추진 계획\n7) 기대효과(정량·정성)\n\n【표현할 내용】",
    contextGuideResult:
      "【보고서 구분】결과보고서\n【작성 방향】핵심사업 실적·성과 구조로 정리\n1) 핵심사업명·목표 대비 실적\n2) 추진 경과·주요 산출\n3) 정량 지표 목표 대비 달성\n4) 정성 성과·사례\n5) 확산·환류·개선 사항\n\n【표현할 내용】",
    defaultTypePlan: "overview",
    defaultTypeResult: "improvement",
  },
  {
    id: "edu-innovation",
    name: "교육혁신 방향",
    desc: "전공트랙·마이크로전공·AI+X·유연학사 등 교육과정 혁신",
    icon: "fi-rr-graduation-cap",
    contextGuidePlan:
      "【보고서 구분】운영계획서\n【작성 방향】교육혁신 계획\n- 전공선택권·융합전공·트랙/마이크로전공 설계\n- AI+X·DX 연계 교과·PBL/캡스톤 추진 계획\n- AA(지도)·학습경로·취업·역량 목표 지표\n\n【표현할 내용】",
    contextGuideResult:
      "【보고서 구분】결과보고서\n【작성 방향】교육혁신 실적\n- 개설·운영 실적(트랙/마이크로/융합)\n- AI+X·PBL/캡스톤 참여·산출 성과\n- 역량·취업 연계 지표 달성\n\n【표현할 내용】",
    defaultTypePlan: "overview",
    defaultTypeResult: "diffusion",
  },
  {
    id: "industry",
    name: "지산학·ICC 방향",
    desc: "지산학 거버넌스, ICC 특성화, 기업협력·성과공유",
    icon: "fi-rr-industry-alt",
    contextGuidePlan:
      "【보고서 구분】운영계획서\n【작성 방향】지산학협력·ICC 추진 계획\n- 거버넌스·협의체·다자협약 구축 계획\n- ICC 특성화(시장확장×직무심화) 배치\n- 테크클리닉·R&BD·재직자교육·포럼 일정\n\n【표현할 내용】",
    contextGuideResult:
      "【보고서 구분】결과보고서\n【작성 방향】지산학협력·ICC 실적\n- 협의체·협약·기업 참여 실적\n- ICC·프로그램 운영 성과\n- 성과포럼·확산·환류 결과\n\n【표현할 내용】",
    defaultTypePlan: "icc-matrix",
    defaultTypeResult: "platform",
  },
  {
    id: "performance",
    name: "성과관리·확산 방향",
    desc: "성과지표 향상, 공유·확산, 환류(PDCA)",
    icon: "fi-rr-chart-line-up",
    contextGuidePlan:
      "【보고서 구분】운영계획서\n【작성 방향】성과관리·확산 계획\n- 정량 KPI(연도별 목표치)\n- 성과공유·포럼·확산 계획\n- 점검→개선 환류(PDCA) 체계\n\n【표현할 내용】",
    contextGuideResult:
      "【보고서 구분】결과보고서\n【작성 방향】성과관리·확산 실적\n- 정량 KPI 목표 대비 실적\n- 성과공유·포럼·확산 실적\n- 점검→개선 환류 사례\n\n【표현할 내용】",
    defaultTypePlan: "diffusion",
    defaultTypeResult: "improvement",
  },
  {
    id: "roadmap",
    name: "단계별 추진 방향",
    desc: "연도·단계 마일스톤과 추진 일정 중심",
    icon: "fi-rr-roadmap",
    contextGuidePlan:
      "【보고서 구분】운영계획서\n【작성 방향】단계별 추진 계획\n- 2025 / 2026 / 2027 마일스톤(계획)\n- 단계별 핵심활동·산출물(예정)\n- 담당·협력주체·점검 시점\n\n【표현할 내용】",
    contextGuideResult:
      "【보고서 구분】결과보고서\n【작성 방향】단계별 추진 실적\n- 연도·단계별 완료 활동·산출물\n- 마일스톤 달성 여부\n- 지연·보완·차기 환류\n\n【표현할 내용】",
    defaultTypePlan: "roadmap",
    defaultTypeResult: "roadmap",
  },
];

function frameContextGuide(frame, kind = getReportDocKind()) {
  const f = frame || reportFrameById(state._aiArtFrame || "core-project");
  if (kind === "result") {
    return f.contextGuideResult || f.contextGuidePlan || f.contextGuide || "";
  }
  return f.contextGuidePlan || f.contextGuide || "";
}

function frameDefaultType(frame, kind = getReportDocKind()) {
  const f = frame || reportFrameById(state._aiArtFrame || "core-project");
  if (kind === "result") return f.defaultTypeResult || f.defaultTypePlan || f.defaultType || "overview";
  return f.defaultTypePlan || f.defaultType || "overview";
}

/** 연성대 도식 기본 스타일 가이드 (수정 가능, API에 전달) — 흑백 보고서 톤 */
const YEONSUNG_STYLE_GUIDE_DEFAULT = `【연성대 혁신지원사업 보고서 도식 기본 요구사항】
1. 인쇄용 흑백·회색 톤 보고서 도식 (공공문서 양식)
2. 색: 검정·회색·흰색만 (#1A1A1A/#333/#4A4A4A/#777/#CCC/#F0F0F0/#FFF). 네이비·블루·컬러·그라데이션 금지
3. 레이아웃 규칙(참고 양식 학습):
   - 상단 회색 타이틀 바 + 좌측 진한 세로 액센트
   - 섹션 번호(1, 2)로 상·하 구분
   - 진한 회색 헤더 바(흰 글씨) + 중첩 사각 박스 그리드
   - 패널 간 두꺼운 블록 화살표(→)로 흐름 표시
   - 단계 번호는 원형 배지(①②③)
   - 매트릭스·허브-스포크·상승 막대·3개년 표 등 구조형 도식
4. 금지: 어두운 배경, 화려한 인포그래픽, 3D·네온·사진·로고·워터마크
5. 구도: 흰 바탕 가로형(16:9), 한글 보고서(HWP)에 삽입해도 이질감 없는 절제된 레이아웃
6. 참고: 숫자·문구를 자주 고칠 도식은 AI 이미지가 아니라「편집용 PPT 도식」을 사용`;

/** 연성대 자율혁신계획서 도식 양식에 맞춘 그림 타입 */
const REPORT_ART_TYPES = [
  {
    id: "overview",
    group: "structure",
    groupLabel: "사업 구조",
    name: "핵심사업 개요도",
    desc: "선정사유·트랙·교과·산업연계가 한눈에 보이는 개요 플로우",
    icon: "fi-rr-overview",
    visual:
      "grayscale academic report overview, section numbers 1 and 2, nested gray header bars, four-column nested boxes, three bordered process panels with block arrows, white background, no color",
  },
  {
    id: "governance",
    group: "structure",
    groupLabel: "사업 구조",
    name: "추진체계도",
    desc: "거버넌스·위원회·협력 단계가 연결되는 추진체계",
    icon: "fi-rr-organization-chart",
    visual:
      "grayscale governance ascending process bars numbered 1-5, vertical timeline with circular nodes and horizontal rows, institutional report style, white background",
  },
  {
    id: "certification",
    group: "structure",
    groupLabel: "사업 구조",
    name: "인증단계모형",
    desc: "기본·품질·혁신 등 단계형 인증 배지 구조",
    icon: "fi-rr-diploma",
    visual:
      "grayscale three certification stage panels basic quality innovation with large circles and block arrows between panels, report style, white background",
  },
  {
    id: "icc-matrix",
    group: "coop",
    groupLabel: "협력·특성화",
    name: "ICC 특성화 매트릭스",
    desc: "시장확장×직무역량 축에 ICC·특성화를 배치한 매트릭스",
    icon: "fi-rr-grid",
    visual:
      "grayscale 2x2 strategy matrix with axis labels market expansion vs competency depth, labeled dots, stacked strategy boxes on right, academic report, white background",
  },
  {
    id: "platform",
    group: "coop",
    groupLabel: "협력·특성화",
    name: "플랫폼 순환도",
    desc: "중앙 플랫폼과 주변 프로그램이 순환하는 구조",
    icon: "fi-rr-chart-network",
    visual:
      "grayscale hub and spoke platform diagram, dark center hexagon card, four surrounding program cards with circular icons and arrows toward center, white background",
  },
  {
    id: "diffusion",
    group: "outcome",
    groupLabel: "성과·일정",
    name: "성과확산모형",
    desc: "성과공유·포럼·확산을 나타내는 확산 구조",
    icon: "fi-rr-share",
    visual:
      "grayscale four process panels with numbered circles and block arrows left to right, performance diffusion report diagram, white background",
  },
  {
    id: "improvement",
    group: "outcome",
    groupLabel: "성과·일정",
    name: "성과향상모형",
    desc: "지표·역량이 연도별로 올라가는 향상 구조",
    icon: "fi-rr-arrow-trend-up",
    visual:
      "grayscale ascending year bars 2025-2027 with capsule totals, comparison bars for university vs averages, monochrome chart report style, white background",
  },
  {
    id: "roadmap",
    group: "outcome",
    groupLabel: "성과·일정",
    name: "3개년 추진 로드맵",
    desc: "2025–2027 마일스톤·활동 타임라인",
    icon: "fi-rr-roadmap",
    visual:
      "grayscale hierarchical vision goal strategy bars, three pillars, three-year roadmap table with dark headers, academic report layout, white background",
  },
];

function flaticonIcon(name, extraClass = "") {
  const cls = String(name || "fi-rr-picture").replace(/[^\w-]/g, "");
  const extra = String(extraClass || "").replace(/[^\w\s-]/g, "");
  return `<i class="fi ${cls}${extra ? ` ${extra}` : ""}" aria-hidden="true"></i>`;
}

function reportArtTypeById(id) {
  return REPORT_ART_TYPES.find((t) => t.id === id) || REPORT_ART_TYPES[0];
}

function reportFrameById(id) {
  const areas = reportAreaOptions();
  return areas.find((g) => g.id === id) || areas[0] || REPORT_FRAME_GROUPS[0];
}

function inferPartVisualHint(title = "", note = "") {
  const blob = `${title} ${note}`;
  if (/예산|비목|사업비/.test(blob)) return "예산·비목 구조와 배분 흐름";
  if (/성과|지표|KPI/.test(blob)) return "핵심 지표·목표 대비 실적";
  if (/개요|배경|목적/.test(blob)) return "사업 개요·추진 배경";
  if (/추진|계획|로드맵|연차/.test(blob)) return "단계별 추진 일정·3개년 계획";
  if (/여건|진단|SWOT|현황/.test(blob)) return "현황 분석·여건 변화·시사점";
  if (/조직|체계|거버넌스/.test(blob)) return "추진체계·거버넌스";
  return note || "이 목차에 맞는 핵심 메시지";
}

function buildPartContextGuide(part, kind = getReportDocKind()) {
  const doc = reportDocKindMeta(kind);
  const label = `${part.section || ""}. ${part.title || ""}`.replace(/^\.\s*/, "");
  const hint = inferPartVisualHint(part.title, part.note);
  if (kind === "result") {
    return `【보고서 구분】${doc.name}\n【목차】${label}\n【작성 방향】${part.note || hint}\n【표현할 내용】${hint} · 실적·성과 중심`;
  }
  return `【보고서 구분】${doc.name}\n【목차】${label}\n【작성 방향】${part.note || hint}\n【표현할 내용】${hint}`;
}

function reportAreasFromParts() {
  const parts = (state.parts || []).filter((p) => p.title || p.section);
  if (!parts.length) return null;
  return parts.map((p) => {
    const m = memberById(p.assigneeId);
    const pages =
      p.pageStart != null && p.pageEnd != null ? `${p.pageStart}–${p.pageEnd}p` : "";
    const meta = [p.note || inferPartVisualHint(p.title, p.note), pages, m?.name].filter(Boolean);
    return {
      id: `part:${p.id}`,
      partId: p.id,
      name: `${p.section || ""}. ${p.title || "파트"}`.replace(/^\.\s*/, ""),
      desc: meta.join(" · "),
      section: p.section,
      title: p.title,
      note: p.note,
      icon: "fi-rr-book",
      contextGuidePlan: buildPartContextGuide(p, "plan"),
      contextGuideResult: buildPartContextGuide(p, "result"),
    };
  });
}

function reportAreaOptions() {
  return reportAreasFromParts() || REPORT_FRAME_GROUPS;
}

function partFromAreaFrame(frameId) {
  if (!String(frameId || "").startsWith("part:")) return null;
  return partById(frameId.slice(5));
}

function partDirectionSeed(frame) {
  if (!frame) return "";
  const kind = getReportDocKind();
  return kind === "result"
    ? frame.contextGuideResult || frame.contextGuidePlan || ""
    : frame.contextGuidePlan || frame.contextGuideResult || "";
}

function ensureAiArtFrameSelection() {
  const areas = reportAreaOptions();
  const valid = new Set(areas.map((a) => a.id));
  if (!valid.has(state._aiArtFrame)) {
    state._aiArtFrame = areas[0]?.id || "core-project";
  }
}

function openArtStudioCompleteModal({ pack, guide, frame, direction, plan }) {
  const type = reportArtTypeById(pack.typeId);
  const previewHtml = studioStageHtml({
    layoutIds: pack.layoutIds,
    diagramTypeId: pack.typeId,
    visibleCount: pack.layoutIds.length,
    phase: 5,
    variant: pack.variant,
  });
  const layoutName = REPORT_LAYOUTS.find((l) => l.id === pack.layoutIds[0])?.name || "레이아웃";
  openModal({
    kicker: "완성",
    title: `${frame?.name || "보고서"} · ${type.name}`,
    submitLabel: "PPT 다운로드",
    bodyHtml: `
      <div class="art-complete-modal">
        <div class="art-complete-preview">${previewHtml}</div>
        <p class="art-complete-summary">${escapeHtml(guide?.summary || plan?.purpose || "선택한 영역·레이아웃으로 그림을 구성했습니다.")}</p>
        ${
          guide?.reasoning
            ? `<p class="muted art-complete-reason">${escapeHtml(guide.reasoning)}</p>`
            : ""
        }
        <ul class="art-complete-meta">
          <li><strong>영역</strong> ${escapeHtml(frame?.name || "-")}</li>
          <li><strong>레이아웃</strong> ${escapeHtml(layoutName)} · ${escapeHtml(guide?.variantLabel || pack.variant?.label || "")}</li>
        </ul>
        <p class="muted art-complete-hint">PPT를 받아 수치·문장만 바꾼 뒤 한글 보고서에 넣으면 됩니다.</p>
      </div>`,
    onSubmit: async () => {
      const doc = reportDocKindMeta(getReportDocKind());
      await downloadReportArtPackagePpt({
        layoutIds: pack.layoutIds,
        typeId: pack.typeId,
        title: `${frame?.name || "보고서"} · ${type.name}`,
        labels: plan?.labels || {},
        fileName: `${frame?.name || "보고서"}_${type.name}`.replace(/[\\/:*?"<>|]/g, "_"),
        docKindName: doc.name,
      });
      return true;
    },
  });
}

function artTypesByGroup() {
  const map = new Map();
  REPORT_ART_TYPES.forEach((t) => {
    if (!map.has(t.group)) map.set(t.group, { id: t.group, label: t.groupLabel, types: [] });
    map.get(t.group).types.push(t);
  });
  return [...map.values()];
}

function buildYeonsungStyleGuide(type, frame, kind = getReportDocKind()) {
  const t = type || reportArtTypeById(state._aiArtType);
  const f = frame || reportFrameById(state._aiArtFrame || "core-project");
  const doc = reportDocKindMeta(kind);
  return `${YEONSUNG_STYLE_GUIDE_DEFAULT}

【보고서 대구분】${doc.name} (${doc.tone})
${doc.focus}

【선택 작성 방향】${f.name}
${f.desc}

【선택 도식 타입】${t.name}
${t.desc}
시각 구조: ${t.visual}`;
}

function renderAiArt() {
  const el = $("#view-ai-art");
  if (!el) return;
  ensureAiArts();
  ensureReportStyleLearning(state);
  ensureAiArtFrameSelection();
  if (!state._aiArtContextSeed && partFromAreaFrame(state._aiArtFrame)) {
    state._aiArtContextSeed = partDirectionSeed(reportFrameById(state._aiArtFrame));
  }

  const who = sessionUser || "작성자";
  const artTab = state._aiArtTab === "learn" ? "learn" : "create";
  state._aiArtTab = artTab;
  const areaOptions = reportAreaOptions();
  const fromParts = Boolean(reportAreasFromParts());
  const selectedFrame = state._aiArtFrame || areaOptions[0]?.id || "core-project";
  const frame = reportFrameById(selectedFrame);
  const selectedLayout = state._aiArtLayoutId || "kpi";
  const seed = state._artStudioSeed || Date.now();
  const allLearned = getAllLearnedSamples(state);
  const learnLogs = state.reportStyleLearning?.logs || [];
  const history = Array.isArray(state._artStudioHistory) ? state._artStudioHistory : [];
  const directionValue = state._aiArtContextSeed || "";
  const layoutOptions = getStudioLayoutOptions(state, {
    themeId: selectedFrame,
    direction: directionValue,
    limit: 10,
  });
  if (!layoutOptions.some((l) => l.id === selectedLayout) && layoutOptions[0]) {
    state._aiArtLayoutId = layoutOptions[0].id;
  }
  const layoutIdNow = state._aiArtLayoutId || layoutOptions[0]?.id || "kpi";
  const lastPack =
    state._artStudioPack ||
    composeStudioPack({
      themeId: selectedFrame,
      direction: directionValue,
      seed,
      preferLayoutId: layoutIdNow,
      part: partFromAreaFrame(selectedFrame),
      learnedSamples: pickSamplesForGeneration(state, {
        themeId: selectedFrame,
        direction: directionValue,
        limit: 4,
      }),
    });
  const lastGuide = state._artStudioGuide || null;
  const liveComplete = Boolean(lastGuide);

  el.innerHTML = `
    <div class="ai-page report-make art-studio is-simple">
      <nav class="art-studio-subtabs sub-tab-bar" role="tablist" aria-label="보고서 그림">
        <button type="button" class="sub-tab-btn ${artTab === "create" ? "active" : ""}" data-art-tab="create">그림 만들기</button>
        <button type="button" class="sub-tab-btn ${artTab === "learn" ? "active" : ""}" data-art-tab="learn">양식학습 ${learnLogs.length ? `<span class="badge">${learnLogs.length}</span>` : ""}</button>
      </nav>

      <div data-art-tab-panel="create" ${artTab === "create" ? "" : "hidden"}>
        <section class="panel art-simple-panel">
          <ol class="art-simple-steps">
            <li>
              <p class="wp-label">1. 보고서 영역</p>
              <p class="muted art-area-hint">${fromParts ? "목차·할당 기준으로 영역을 제안합니다" : "목차가 없어 기본 영역을 제안합니다 · Setting · 목차·할당에서 등록하세요"}</p>
              <div class="ai-type-grid ai-frame-grid art-studio-themes" role="radiogroup">
                ${areaOptions
                  .map(
                    (g) => `
                  <button type="button" class="ai-type-card ai-frame-card ${g.id === selectedFrame ? "active" : ""}" data-art-frame="${escapeAttr(g.id)}" aria-pressed="${g.id === selectedFrame ? "true" : "false"}">
                    <strong>${escapeHtml(g.name)}</strong>
                    <span>${escapeHtml(g.desc)}</span>
                  </button>`
                  )
                  .join("")}
              </div>
            </li>
            <li>
              <p class="wp-label">2. 비슷한 레이아웃</p>
              <p class="muted art-layout-hint">${escapeHtml(layoutOptionsUpdatedLabel(state))}</p>
              <div class="art-layout-pick" role="radiogroup">
                ${layoutOptions
                  .map(
                    (l) => `
                  <button type="button" class="art-layout-card ${l.id === layoutIdNow ? "active" : ""} ${l.learned ? "is-learned" : ""}" data-art-layout="${escapeAttr(l.id)}" aria-pressed="${l.id === layoutIdNow ? "true" : "false"}" title="${escapeAttr(l.learnedTitle || l.desc || "")}">
                    <div class="art-layout-thumb">${layoutPreviewWireHtml(l.id)}</div>
                    <strong>${escapeHtml(l.name)}</strong>
                    ${l.learned ? `<span class="art-layout-learned">학습</span>` : ""}
                  </button>`
                  )
                  .join("")}
              </div>
            </li>
            <li>
              <p class="wp-label">3. 넣고 싶은 내용</p>
              <textarea id="artStudioDirection" rows="6" class="wp-input" placeholder="보고서에 담고 싶은 내용을 적어 주세요. 예: ICC 참여 기업 수, 프로그램 운영 실적, 환류 사례">${escapeHtml(directionValue)}</textarea>
            </li>
          </ol>
          <div class="art-studio-actions">
            <button type="button" class="btn btn-primary btn-lg" id="artStudioCreate">만들기</button>
            <div class="art-studio-reroll">
              <button type="button" class="btn btn-lg art-studio-dice" id="artStudioDice" title="전체 틀은 유지하고 표현만 조금 바꿉니다" ${lastGuide ? "" : "disabled"} aria-label="조금만 다르게 다시">🎲</button>
              <span class="art-studio-reroll-label">조금만 다르게 다시</span>
            </div>
            ${
              history.length
                ? `<button type="button" class="btn" id="artStudioUndo">직전 그림 불러오기</button>`
                : ""
            }
          </div>
        </section>

        <section class="panel art-studio-live-panel ${liveComplete ? "is-complete" : ""}">
          <div class="ai-art-progress diagram-build-progress" id="artStudioProgress" hidden>
            <div class="ai-art-progress-meta">
              <span class="muted" id="artStudioStatus">준비</span>
              <span class="ai-art-progress-pct" id="artStudioPct">0%</span>
            </div>
            <div class="ai-art-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100">
              <div class="ai-art-progress-fill" id="artStudioFill"></div>
            </div>
            <p class="ai-art-progress-step muted" id="artStudioStep"></p>
          </div>
          <div class="art-studio-live">
            ${studioStageHtml({
              layoutIds: lastPack.layoutIds,
              diagramTypeId: lastPack.typeId,
              visibleCount: liveComplete ? lastPack.layoutIds.length : lastGuide ? lastPack.layoutIds.length : 1,
              phase: liveComplete ? 5 : lastGuide ? 5 : 0,
              variant: lastPack.variant,
            })}
          </div>
          ${
            liveComplete
              ? `<div class="art-studio-complete-bar">
                  <p><strong>완성</strong> · ${escapeHtml(lastGuide?.variantLabel || lastPack.variant?.label || "")}</p>
                  <button type="button" class="btn btn-primary btn-sm" id="artStudioRedownload">PPT 다운로드</button>
                </div>`
              : ""
          }
        </section>

        <section class="panel art-studio-result" id="artStudioResult" ${lastGuide ? "" : "hidden"}>
          <h2 class="panel-title">왜 이렇게 그렸나</h2>
          <p class="art-studio-reasoning" id="artStudioWhy">${escapeHtml(lastGuide?.reasoning || lastGuide?.summary || "")}</p>
          <h3 class="art-studio-contents-title">담을 수 있는 내용</h3>
          <ul class="art-studio-messages" id="artStudioContents">
            ${(lastGuide?.contents || lastGuide?.keyMessages || []).map((m) => `<li>${escapeHtml(m)}</li>`).join("")}
          </ul>
        </section>
      </div>

      <section class="panel style-learn-panel is-simple" data-art-tab-panel="learn" ${artTab === "learn" ? "" : "hidden"}>
        <h2 class="panel-title">양식학습</h2>
        <p class="panel-desc">보고서 그림을 올리면 누가 학습을 시켰는지 기록되고, API가 유형을 분석해 그림 만들기에 반영합니다.</p>
        <label class="style-learn-drop" id="styleLearnDrop">
          <input type="file" id="styleLearnFile" accept="image/png,image/jpeg,image/webp" hidden />
          <strong>그림을 올리거나 여기에 놓으세요</strong>
          <span>PNG · JPG · 학습 담당자 ${escapeHtml(who)}</span>
        </label>
        <p class="muted" id="styleLearnStatus"></p>
        <h3 class="art-studio-contents-title">학습 로그</h3>
        ${learningLogHtml(learnLogs)}
        <div id="styleLearnGallery">${learningGalleryHtml(allLearned.filter((s) => s.source === "upload"), { filter: "all" })}</div>
      </section>
    </div>
  `;

  const setStudioProgress = (pct, step, label) => {
    const wrap = $("#artStudioProgress");
    const fill = $("#artStudioFill");
    const pctEl = $("#artStudioPct");
    const stepEl = $("#artStudioStep");
    const status = $("#artStudioStatus");
    const n = Math.max(0, Math.min(100, Math.round(pct)));
    if (wrap) {
      wrap.hidden = false;
      wrap.classList.toggle("is-done", n >= 100);
    }
    if (fill) fill.style.width = `${n}%`;
    if (pctEl) pctEl.textContent = `${n}%`;
    if (stepEl && step) stepEl.textContent = step;
    if (status && label != null) status.textContent = label;
  };

  const renderGuideDom = (guide) => {
    const why = $("#artStudioWhy");
    const list = $("#artStudioContents");
    if (why) why.textContent = guide.reasoning || guide.summary || "";
    if (list) {
      list.innerHTML = (guide.contents || guide.keyMessages || []).map((m) => `<li>${escapeHtml(m)}</li>`).join("");
    }
  };

  const snapshotNow = () => ({
    pack: state._artStudioPack ? { ...state._artStudioPack } : null,
    guide: state._artStudioGuide ? { ...state._artStudioGuide } : null,
    plan: state._lastDiagramPlan || null,
    seed: state._artStudioSeed,
    layoutId: state._aiArtLayoutId,
    frame: state._aiArtFrame,
  });

  const applySnapshot = (snap) => {
    if (!snap) return;
    state._artStudioPack = snap.pack;
    state._artStudioGuide = snap.guide;
    state._lastDiagramPlan = snap.plan;
    state._artStudioSeed = snap.seed;
    if (snap.layoutId) state._aiArtLayoutId = snap.layoutId;
    if (snap.frame) state._aiArtFrame = snap.frame;
    persist();
    renderAiArt();
  };

  el.querySelectorAll("[data-art-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state._aiArtTab = btn.dataset.artTab;
      persist();
      renderAiArt();
    });
  });

  el.querySelectorAll("[data-art-frame]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state._aiArtFrame = btn.dataset.artFrame;
      const area = reportFrameById(state._aiArtFrame);
      if (partFromAreaFrame(state._aiArtFrame)) {
        state._aiArtContextSeed = partDirectionSeed(area);
      }
      persist();
      renderAiArt();
    });
  });

  el.querySelectorAll("[data-art-layout]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state._aiArtLayoutId = btn.dataset.artLayout;
      persist();
      renderAiArt();
    });
  });

  const bounceDice = () => {
    const diceBtn = $("#artStudioDice");
    if (!diceBtn) return;
    diceBtn.classList.remove("is-bounce");
    void diceBtn.offsetWidth;
    diceBtn.classList.add("is-bounce");
  };

  const runStudioCreate = async ({ reroll = false } = {}) => {
    const direction = ($("#artStudioDirection")?.value || "").trim();
    if (!direction) {
      alert("넣고 싶은 내용을 적어 주세요.");
      return;
    }
    state._aiArtContextSeed = direction;
    if (reroll && state._artStudioGuide) {
      bounceDice();
      const hist = Array.isArray(state._artStudioHistory) ? state._artStudioHistory : [];
      hist.push(snapshotNow());
      state._artStudioHistory = hist.slice(-8);
    }
    if (!reroll) state._artStudioSeed = Date.now();
    else state._artStudioSeed = (state._artStudioSeed || Date.now()) + 997 + Math.floor(Math.random() * 9000);

    const themeId = state._aiArtFrame || selectedFrame;
    const layoutId = state._aiArtLayoutId || layoutIdNow;
    const frameNow = reportFrameById(themeId);
    const partNow = partFromAreaFrame(themeId);
    const learnedForRun = pickSamplesForGeneration(state, { themeId, direction, limit: 4 });
    const pack = composeStudioPack({
      themeId,
      direction,
      seed: state._artStudioSeed,
      learnedSamples: learnedForRun,
      preferLayoutId: layoutId,
      reroll,
      part: partNow,
    });
    state._artStudioPack = pack;
    if (pack.layoutIds?.[0]) state._aiArtLayoutId = pack.layoutIds[0];
    state._aiArtType = pack.typeId;

    const live = el.querySelector(".art-studio-live");
    if (live) {
      live.innerHTML = studioStageHtml({
        layoutIds: pack.layoutIds,
        diagramTypeId: pack.typeId,
        visibleCount: 0,
        phase: 0,
        variant: pack.variant,
      });
    }

    $("#artStudioResult")?.removeAttribute("hidden");
    const createBtn = $("#artStudioCreate");
    const diceBtn = $("#artStudioDice");
    if (createBtn) createBtn.disabled = true;
    if (diceBtn) diceBtn.disabled = true;

    const type = reportArtTypeById(pack.typeId);
    const styleGuide =
      buildYeonsungStyleGuide(type, frameNow) +
      (learnedForRun.length ? `\n\n${buildLearnedStyleGuideBlock(learnedForRun)}` : "");
    const title = type.name;
    const extraPrompt = reroll
      ? `${pack.variant?.hint || ""} · 전체 틀과 목차 방향은 유지하고 레이아웃·표현만 한 단계만 다르게`
      : `${pack.variant?.hint || ""} · ${frameNow.name} 영역에 맞춰 ${partNow?.note || "목차 방향"}을 반영`;

    const planPromise = planReportDiagram({
      title,
      context: direction,
      prompt: extraPrompt,
      styleGuide,
      reportFrame: frameNow.id,
      reportFrameName: frameNow.name,
      reportType: type.id,
      reportTypeName: type.name,
      reportTypeDesc: type.desc,
      reportTypeVisual: type.visual,
    });

    try {
      const plan = await animateStudioBuild({
        root: el,
        layoutIds: pack.layoutIds,
        diagramTypeId: pack.typeId,
        variant: pack.variant,
        learnedSamples: learnedForRun,
        onProgress: (pct, label) => setStudioProgress(pct, label, reroll ? "다른 형태로 그리는 중…" : "그리는 중…"),
        onStep: () => {},
        planPromise,
      });
      state._lastDiagramPlan = plan || null;
      const guide = buildStudioUsageGuide({
        layoutIds: pack.layoutIds,
        plan,
        theme: frameNow,
        direction,
        variant: pack.variant,
        learnedSamples: learnedForRun,
      });
      state._artStudioGuide = guide;
      renderGuideDom(guide);

      const livePanel = el.querySelector(".art-studio-live-panel");
      const liveInner = el.querySelector(".art-studio-live");
      if (liveInner) {
        liveInner.innerHTML = studioStageHtml({
          layoutIds: pack.layoutIds,
          diagramTypeId: pack.typeId,
          visibleCount: pack.layoutIds.length,
          phase: 5,
          variant: pack.variant,
        });
      }
      livePanel?.classList.add("is-complete");
      $("#artStudioProgress")?.setAttribute("hidden", "");
      persist();
      openArtStudioCompleteModal({ pack, guide, frame: frameNow, direction, plan });
      if (reroll) renderAiArt();
    } catch (err) {
      alert(err.message || "그림 생성에 실패했습니다.");
    } finally {
      const c = $("#artStudioCreate");
      const d = $("#artStudioDice");
      if (c) c.disabled = false;
      if (d) d.disabled = false;
    }
  };

  $("#artStudioCreate")?.addEventListener("click", () => runStudioCreate({ reroll: false }));
  $("#artStudioDice")?.addEventListener("click", () => runStudioCreate({ reroll: true }));
  $("#artStudioRedownload")?.addEventListener("click", async () => {
    const pack = state._artStudioPack;
    const guide = state._artStudioGuide;
    const plan = state._lastDiagramPlan;
    if (!pack) return;
    const frameNow = reportFrameById(state._aiArtFrame);
    const type = reportArtTypeById(pack.typeId);
    const doc = reportDocKindMeta(getReportDocKind());
    try {
      await downloadReportArtPackagePpt({
        layoutIds: pack.layoutIds,
        typeId: pack.typeId,
        title: `${frameNow?.name || "보고서"} · ${type.name}`,
        labels: plan?.labels || {},
        fileName: `${frameNow?.name || "보고서"}_${type.name}`.replace(/[\\/:*?"<>|]/g, "_"),
        docKindName: doc.name,
      });
    } catch (err) {
      alert(err.message || "PPT 다운로드에 실패했습니다.");
    }
  });
  $("#artStudioUndo")?.addEventListener("click", () => {
    const hist = Array.isArray(state._artStudioHistory) ? state._artStudioHistory : [];
    const prev = hist.pop();
    state._artStudioHistory = hist;
    applySnapshot(prev);
  });

  const drop = $("#styleLearnDrop");
  const fileInput = $("#styleLearnFile");
  const statusEl = $("#styleLearnStatus");
  const ingestFile = async (file) => {
    if (!file) return;
    if (statusEl) statusEl.textContent = "그림을 분석·학습하는 중…";
    try {
      const sample = await ingestStyleSample(state, file, {
        uid,
        manager: who,
      });
      try {
        const analysis = await learnStyleFromImage({
          imageDataUrl: sample.thumbDataUrl || sample.dataUrl,
          fileName: file.name,
          manager: who,
        });
        if (analysis?.ok || analysis?.title) {
          sample.program = analysis.program || sample.program;
          sample.title = analysis.title || sample.title;
          sample.layoutRef = analysis.layoutRef || sample.layoutRef;
          if (Array.isArray(analysis.cues) && analysis.cues.length) sample.cues = analysis.cues;
          sample.summary = analysis.summary || sample.summary;
          const log = (state.reportStyleLearning.logs || []).find((l) => l.sampleId === sample.id);
          if (log) {
            log.title = sample.title;
            log.program = sample.program;
            log.layoutRef = sample.layoutRef;
            log.summary = sample.summary;
          }
        }
      } catch {
        /* 업로드는 유지하고 분석만 생략 */
      }
      persist();
      state._aiArtTab = "learn";
      renderAiArt();
    } catch (err) {
      alert(err.message || "업로드 실패");
      if (statusEl) statusEl.textContent = "";
    }
  };
  drop?.addEventListener("click", () => fileInput?.click());
  drop?.addEventListener("dragover", (e) => {
    e.preventDefault();
    drop.classList.add("is-over");
  });
  drop?.addEventListener("dragleave", () => drop.classList.remove("is-over"));
  drop?.addEventListener("drop", (e) => {
    e.preventDefault();
    drop.classList.remove("is-over");
    ingestFile(e.dataTransfer?.files?.[0]);
  });
  fileInput?.addEventListener("change", (e) => {
    ingestFile(e.target.files?.[0]);
    e.target.value = "";
  });

  el.querySelectorAll("[data-del-sample]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!confirm("이 학습 양식을 삭제할까요?")) return;
      removeLearnedSample(state, btn.dataset.delSample);
      persist();
      renderAiArt();
    });
  });
}

const REVIEW_TAG_PRESETS = [
  "수치 근거 보강",
  "계획 구체화",
  "환류(PDCA) 보완",
  "성과·실적 상세",
  "표·도식 추가",
  "용어·문장 다듬기",
];

function reviewListCells(items, empty = "—") {
  if (!items?.length) return `<span class="muted">${escapeHtml(empty)}</span>`;
  return `<ul class="review-mini-list">${items
    .slice(0, 6)
    .map((t) => `<li>${escapeHtml(t)}</li>`)
    .join("")}</ul>`;
}

function renderReviewDocCard(doc) {
  const s = doc.summary || {};
  const tags = Array.isArray(doc.reviewTags) ? doc.reviewTags : [];
  const openTags = tags.filter((t) => t.status !== "done");
  const admin = isAdmin();
  const metricsHtml = (s.metrics || []).length
    ? `<table class="review-metric-table"><thead><tr><th>지표</th><th>수치</th><th>비고</th></tr></thead><tbody>${(
        s.metrics || []
      )
        .map(
          (m) =>
            `<tr><td>${escapeHtml(m.label)}</td><td>${escapeHtml(m.value)}</td><td class="muted">${escapeHtml(
              m.note || ""
            )}</td></tr>`
        )
        .join("")}</tbody></table>`
    : `<span class="muted">제시된 수치 없음</span>`;

  const guideHtml = (s.adminGuide || []).length
    ? `<ul class="review-guide-list">${(s.adminGuide || [])
        .map(
          (g) => `
        <li class="priority-${escapeAttr(g.priority || "mid")}">
          <strong>${escapeHtml(g.item)}</strong>
          <span>${escapeHtml(g.hint || "")}</span>
        </li>`
        )
        .join("")}</ul>`
    : `<p class="muted">가이드 없음</p>`;

  const tagChips = tags.length
    ? tags
        .map(
          (t) => `
      <span class="review-tag ${t.status === "done" ? "is-done" : ""}" data-tag-id="${escapeAttr(t.id)}">
        #${escapeHtml(t.label)}
        ${admin ? `<button type="button" class="review-tag-toggle" data-toggle-tag="${escapeAttr(doc.id)}" data-tag="${escapeAttr(t.id)}" title="완료 토글">✓</button>
        <button type="button" class="review-tag-del" data-del-tag="${escapeAttr(doc.id)}" data-tag="${escapeAttr(t.id)}" title="삭제">×</button>` : ""}
      </span>`
        )
        .join("")
    : `<span class="muted">리뷰 태그 없음</span>`;

  return `
    <article class="review-doc-card" data-doc-id="${escapeAttr(doc.id)}">
      <header class="review-doc-head">
        <div>
          <p class="review-doc-kicker">${escapeHtml(doc.partTitle || "파트 미지정")} · ${escapeHtml(doc.by || "")}</p>
          <h3>${escapeHtml(doc.fileName || "문서")}</h3>
          <p class="muted">${escapeHtml((doc.createdAt || "").slice(0, 16).replace("T", " "))}
            ${openTags.length ? ` · <strong class="review-open-count">열린 태그 ${openTags.length}</strong>` : ""}</p>
        </div>
        <div class="review-score" title="포함도">
          <strong>${escapeHtml(String(s.coverageScore ?? "—"))}</strong>
          <span>점</span>
        </div>
      </header>
      <p class="review-oneliner">${escapeHtml(s.oneLiner || "요약 없음")}</p>
      <div class="review-summary-grid">
        <div>
          <h4>주요 포함사항</h4>
          ${reviewListCells(s.keyItems)}
        </div>
        <div>
          <h4>수치 제시</h4>
          ${metricsHtml}
        </div>
        <div>
          <h4>계획 방향</h4>
          ${reviewListCells(s.plans)}
        </div>
        <div>
          <h4>환류 방향</h4>
          ${reviewListCells(s.feedbackLoop)}
        </div>
      </div>
      ${
        admin
          ? `<details class="review-admin-block" open>
        <summary>관리자 확인 가이드</summary>
        <p class="muted review-guide-lead">보고서에 무엇이 들어갔는지 아래 항목으로 점검하세요. 상세가 더 필요하면 리뷰 태그를 달아 주세요.</p>
        ${guideHtml}
      </details>`
          : ""
      }
      <div class="review-tags-block">
        <div class="row review-tags-head">
          <h4>리뷰 태그</h4>
          ${admin ? `<span class="muted">상세 보완 요청용</span>` : ""}
        </div>
        <div class="review-tag-row">${tagChips}</div>
        ${
          admin
            ? `<div class="review-tag-add row">
          <select data-tag-preset="${escapeAttr(doc.id)}">
            <option value="">태그 선택…</option>
            ${REVIEW_TAG_PRESETS.map((p) => `<option value="${escapeAttr(p)}">${escapeHtml(p)}</option>`).join("")}
            ${(s.suggestedReviewTags || [])
              .map((p) => `<option value="${escapeAttr(p)}">추천 · ${escapeHtml(p)}</option>`)
              .join("")}
          </select>
          <input type="text" data-tag-custom="${escapeAttr(doc.id)}" placeholder="직접 입력" />
          <button type="button" class="btn btn-sm btn-primary" data-add-tag="${escapeAttr(doc.id)}">태그 달기</button>
        </div>`
            : ""
        }
      </div>
      ${
        canEditSubmission(doc.partId) || isAdmin()
          ? `<div class="row" style="margin-top:10px">
          <button type="button" class="btn btn-sm btn-danger" data-del-doc="${escapeAttr(doc.id)}">문서 삭제</button>
        </div>`
          : ""
      }
    </article>`;
}

function renderReview() {
  const el = $("#view-review");
  if (!el) return;
  ensureReviewDocs();
  ensureReviewSession();
  const tab = state._reviewTab || "summary";
  const admin = isAdmin();
  const me = currentMember();
  const myParts = isAdmin()
    ? state.parts || []
    : (state.parts || []).filter((p) => p.assigneeId === me?.id);
  const allParts = state.parts || [];
  const docs = [...state.reviewDocs];
  const docsByPart = (partId) =>
    docs
      .filter((d) => d.partId === partId)
      .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  const session = state.reviewSession;
  const partNav = reviewPartNavItems();
  const activeNav =
    partNav.find((n) => n.id === session.activePartId) || partNav[0] || null;
  const partComments = (session.comments || []).filter((c) => c.partId === activeNav?.id);
  const activePartDocs = activeNav?.isPart ? docsByPart(activeNav.id) : [];
  const boardRows = allParts.map((p) => {
    const m = memberById(p.assigneeId);
    const partDocs = docsByPart(p.id);
    const latest = partDocs[0];
    return { part: p, member: m, latest, partDocs };
  });

  el.innerHTML = `
    <div class="review-page">
      <div class="review-subtabs" role="tablist">
        <button type="button" class="review-subtab ${tab === "summary" ? "active" : ""}" data-review-tab="summary">① 업로드·요약표</button>
        <button type="button" class="review-subtab ${tab === "session" ? "active" : ""}" data-review-tab="session">② 윤독 회의</button>
      </div>

      ${
        tab === "summary"
          ? `
      <section class="panel">
        <div class="panel-head">
          <div>
            <h2 class="panel-title">담당자 PDF 업로드</h2>
            <p class="muted" style="margin:4px 0 0">목차·할당에 등록된 파트 기준으로 올립니다. PDF → 주요 포함사항·수치·계획·환류 요약표 (.pdf · .docx · .hwpx · 텍스트)</p>
          </div>
        </div>
        ${
          myParts.length
            ? `<div class="form-grid two">
          <label class="field">담당 파트 <span class="muted">(목차·할당 구분)</span>
            <select id="reviewPart">
              ${myParts
                .map((p) => `<option value="${escapeAttr(p.id)}">${escapeHtml(`${p.section}. ${p.title}`)}</option>`)
                .join("")}
            </select>
          </label>
          <label class="field">파일
            <input type="file" id="reviewFile" accept=".pdf,.txt,.md,.docx,.hwpx,application/pdf" />
          </label>
          <label class="field full">또는 본문 붙여넣기 (스캔 PDF일 때)
            <textarea id="reviewText" rows="5" placeholder="PDF 텍스트 추출이 안 되면 여기에 붙여넣으세요."></textarea>
          </label>
        </div>
        <div class="row" style="margin-top:12px;gap:8px;flex-wrap:wrap">
          <button type="button" class="btn btn-primary" id="reviewUploadRun">업로드 · 요약표 생성</button>
          <span class="muted" id="reviewUploadStatus"></span>
        </div>`
            : `<div class="empty">배정된 파트가 없어 업로드할 수 없습니다. 관리자에게 목차·할당을 요청하세요.</div>`
        }
      </section>

      <section class="panel">
        <div class="panel-head">
          <h2 class="panel-title">요약표 보드</h2>
          <span class="muted">목차·할당 순서 · ${allParts.length}개 파트 · 업로드 ${docs.length}건</span>
        </div>
        ${
          allParts.length
            ? `<div class="table-wrap review-board-table-wrap">
          <table class="data-table review-board-table">
            <thead>
              <tr>
                <th>할당 파트</th>
                <th>담당</th>
                <th>주요 포함사항</th>
                <th>수치</th>
                <th>계획</th>
                <th>환류</th>
                <th>점수</th>
                <th>태그</th>
              </tr>
            </thead>
            <tbody>
              ${boardRows
                .map(({ part: p, member: m, latest }) => {
                  const s = latest?.summary || {};
                  const open = (latest?.reviewTags || []).filter((t) => t.status !== "done").length;
                  return `<tr data-scroll-doc="${escapeAttr(latest?.id || "")}" data-goto-part="${escapeAttr(p.id)}" class="review-board-row ${latest ? "" : "is-empty"}">
                    <td>
                      <strong>${escapeHtml(`${p.section}. ${p.title}`)}</strong><br />
                      <span class="muted">${escapeHtml(p.pageStart ?? "?")}–${escapeHtml(String(p.pageEnd ?? "?"))}p${p.note ? ` · ${escapeHtml(p.note)}` : ""}</span>
                    </td>
                    <td>${escapeHtml(m?.name || "미배정")}</td>
                    <td>${latest ? reviewListCells(s.keyItems, "—") : `<span class="muted">미업로드</span>`}</td>
                    <td>${
                      latest && (s.metrics || []).length
                        ? (s.metrics || [])
                            .slice(0, 3)
                            .map((x) => `<div><strong>${escapeHtml(x.value)}</strong> <span class="muted">${escapeHtml(x.label)}</span></div>`)
                            .join("")
                        : "—"
                    }</td>
                    <td>${latest ? reviewListCells(s.plans, "—") : "—"}</td>
                    <td>${latest ? reviewListCells(s.feedbackLoop, "—") : "—"}</td>
                    <td>${latest ? `<strong>${escapeHtml(String(s.coverageScore ?? "—"))}</strong>` : "—"}</td>
                    <td>${open ? `<span class="badge warn">열림 ${open}</span>` : latest ? `<span class="muted">없음</span>` : "—"}</td>
                  </tr>`;
                })
                .join("")}
            </tbody>
          </table>
        </div>
        <div class="review-doc-list">
          ${boardRows
            .flatMap(({ partDocs }) => partDocs)
            .map(renderReviewDocCard)
            .join("") || `<div class="empty">담당자가 PDF를 올리면 파트별로 상세 요약이 쌓입니다.</div>`}
        </div>`
            : `<div class="empty">목차·할당에 등록된 파트가 없습니다. 관리자가 먼저 보고서 할당을 설정해 주세요.</div>`
        }
      </section>`
          : `
      <section class="panel">
        <div class="panel-head">
          <div>
            <h2 class="panel-title">윤독 회의</h2>
            <p class="muted" style="margin:4px 0 0">왼쪽은 <strong>목차·할당</strong>과 같은 파트 구분입니다. 할당 순서대로 윤독하며 평가 코멘트를 남깁니다.${admin ? " (코멘트는 관리자)" : " (조회는 전원)"}</p>
          </div>
        </div>
        <div class="form-grid two">
          <label class="field">회의 제목
            <input id="reviewSessionTitle" value="${escapeAttr(session.title || "")}" ${admin ? "" : "readonly"} />
          </label>
          <label class="field">일자
            <input type="date" id="reviewSessionDate" value="${escapeAttr(session.date || today())}" ${admin ? "" : "readonly"} />
          </label>
        </div>
      </section>

      <div class="review-session-layout">
        <aside class="panel review-agenda">
          <h3 class="panel-title" style="font-size:1rem">할당 파트</h3>
          <p class="muted" style="margin:4px 0 0;font-size:var(--text-xs)">목차·할당 설정 순</p>
          <ol class="review-agenda-list">
            ${
              partNav.length
                ? partNav
                    .map((nav) => {
                      const count = (session.comments || []).filter((c) => c.partId === nav.id).length;
                      const hasDoc = nav.isPart && docsByPart(nav.id).length > 0;
                      const on = nav.id === activeNav?.id;
                      return `<li>
                  <button type="button" class="review-agenda-btn ${on ? "active" : ""} ${nav.isPart ? "" : "is-overall"}" data-review-part="${escapeAttr(nav.id)}">
                    <span class="review-agenda-num">${nav.index}</span>
                    <span>
                      <strong>${escapeHtml(nav.label)}</strong>
                      <small>${escapeHtml(nav.isPart ? `${nav.assigneeName} · ${nav.pageLabel}` : nav.note)}</small>
                      ${hasDoc ? `<em class="review-has-doc">요약표 있음</em>` : nav.isPart ? `<em>미업로드</em>` : ""}
                      ${count ? `<em>코멘트 ${count}</em>` : ""}
                    </span>
                  </button>
                </li>`;
                    })
                    .join("")
                : `<li class="empty">할당된 파트가 없습니다.</li>`
            }
          </ol>
        </aside>

        <section class="panel review-session-main">
          <div class="panel-head">
            <div>
              <h2 class="panel-title">${escapeHtml(activeNav?.label || "파트")}</h2>
              <p class="muted" style="margin:4px 0 0">
                ${
                  activeNav?.isPart
                    ? `담당 ${escapeHtml(activeNav.assigneeName)} · ${escapeHtml(activeNav.pageLabel)}${activeNav.note ? ` · ${escapeHtml(activeNav.note)}` : ""}`
                    : escapeHtml(activeNav?.note || "")
                }
              </p>
            </div>
          </div>

          ${
            activeNav?.isPart
              ? `<div class="review-part-summary">
            ${
              activePartDocs.length
                ? activePartDocs
                    .map((d) => {
                      const s = d.summary || {};
                      return `<div class="review-ref-card">
                  <strong>${escapeHtml(d.fileName)}</strong>
                  <p>${escapeHtml(s.oneLiner || "")}</p>
                  <div class="review-summary-grid" style="margin-top:8px">
                    <div><h4>주요 포함</h4>${reviewListCells(s.keyItems)}</div>
                    <div><h4>수치</h4>${
                      (s.metrics || []).length
                        ? (s.metrics || [])
                            .slice(0, 4)
                            .map((x) => `<div><strong>${escapeHtml(x.value)}</strong> ${escapeHtml(x.label)}</div>`)
                            .join("")
                        : `<span class="muted">—</span>`
                    }</div>
                    <div><h4>계획</h4>${reviewListCells(s.plans)}</div>
                    <div><h4>환류</h4>${reviewListCells(s.feedbackLoop)}</div>
                  </div>
                </div>`;
                    })
                    .join("")
                : `<div class="empty">이 파트의 요약표가 아직 없습니다. ① 업로드·요약표에서 담당자가 PDF를 올리면 여기에 표시됩니다.</div>`
            }
          </div>`
              : `<div class="review-part-summary">
            <p class="muted">파트별 윤독을 마친 뒤 공통 의견·수정 마감·재취합 일정을 정리합니다.</p>
            <div class="review-session-ref">
              ${boardRows
                .map(({ part: p, latest }) => {
                  const s = latest?.summary || {};
                  const cCount = (session.comments || []).filter((c) => c.partId === p.id).length;
                  return `<div class="review-ref-card">
                  <strong>${escapeHtml(`${p.section}. ${p.title}`)}</strong>
                  <p>${latest ? escapeHtml(s.oneLiner || "") : "미업로드"}</p>
                  <p class="muted">코멘트 ${cCount} · 점수 ${latest?.summary?.coverageScore ?? "—"}</p>
                </div>`;
                })
                .join("")}
            </div>
          </div>`
          }

          ${
            admin
              ? `<div class="review-comment-form">
            <label class="field full">평가 코멘트 <span class="muted">(${escapeHtml(activeNav?.label || "선택 파트")})</span>
              <textarea id="reviewCommentText" rows="3" placeholder="이 할당 파트에 대한 의견·판정·후속 조치를 적어 주세요."></textarea>
            </label>
            <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:8px;align-items:end">
              <label class="field" style="min-width:140px">판정
                <select id="reviewCommentRating">
                  <option value="good">양호</option>
                  <option value="need">보완 필요</option>
                  <option value="hold">보류·추가논의</option>
                </select>
              </label>
              <label class="field" style="min-width:180px">사진 (모바일 촬영)
                <input type="file" id="reviewCommentPhoto" accept="image/*" capture="environment" />
              </label>
              <label class="field" style="flex:1;min-width:200px">사진·그림 메모
                <input id="reviewCommentPhotoCaption" placeholder="예: 이 부분 그림을 더 크게" />
              </label>
              <button type="button" class="btn btn-primary" id="reviewCommentAdd">코멘트 추가</button>
            </div>
          </div>`
              : ""
          }

          <div class="review-comment-list">
            ${
              partComments.length
                ? partComments.map((c) => renderReviewCommentCardHtml(c, { admin, largePhoto: true })).join("")
                : `<div class="empty">이 파트에 대한 코멘트가 아직 없습니다.</div>`
            }
          </div>

          <label class="field full" style="margin-top:16px">전체 메모 (회의 공통)
            <textarea id="reviewSessionNotes" rows="4" placeholder="윤독 전체에서 공유할 메모" ${admin ? "" : "readonly"}>${escapeHtml(
              session.notes || ""
            )}</textarea>
          </label>
          ${admin ? `<div class="row" style="margin-top:8px"><button type="button" class="btn" id="reviewSessionSave">회의 정보 저장</button></div>` : ""}
        </section>
      </div>`
      }
    </div>
  `;

  el.querySelectorAll("[data-review-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state._reviewTab = btn.dataset.reviewTab;
      renderReview();
    });
  });

  $("#reviewUploadRun")?.addEventListener("click", async () => {
    const status = $("#reviewUploadStatus");
    const btn = $("#reviewUploadRun");
    const partId = $("#reviewPart")?.value || "";
    const part = partById(partId);
    if (!part) {
      alert("파트를 선택해 주세요.");
      return;
    }
    if (!canEditSubmission(partId) && !isAdmin()) {
      alert("담당 파트만 업로드할 수 있습니다.");
      return;
    }
    let text = ($("#reviewText")?.value || "").trim();
    let fileName = "붙여넣기 텍스트";
    const file = $("#reviewFile")?.files?.[0];
    try {
      if (btn) btn.disabled = true;
      if (status) status.textContent = "문서 읽는 중…";
      if (file) {
        fileName = file.name;
        text = await extractTextFromFile(file);
        if ($("#reviewText")) $("#reviewText").value = text.slice(0, 12000);
      }
      if (text.length < 40) throw new Error("분석할 텍스트가 부족합니다.");
      if (status) status.textContent = "요약표 생성 중… (수십 초 걸릴 수 있습니다)";
      const data = await analyzeReviewSummary({
        text,
        fileName,
        partTitle: `${part.section}. ${part.title}`,
        uploader: sessionUser || "",
        tfName: state.meta?.tfName || "",
      });
      ensureReviewDocs();
      state.reviewDocs.unshift({
        id: uid("rev"),
        partId,
        partTitle: `${part.section}. ${part.title}`,
        fileName,
        by: sessionUser || "",
        createdAt: new Date().toISOString(),
        textPreview: text.slice(0, 800),
        summary: data.summary,
        reviewTags: [],
      });
      state.reviewDocs = state.reviewDocs.slice(0, 30);
      persist();
      if (status) status.textContent = "완료";
      renderReview();
    } catch (err) {
      if (status) status.textContent = "";
      alert(err.message || "요약 생성에 실패했습니다.");
    } finally {
      if (btn) btn.disabled = false;
    }
  });

  el.querySelectorAll("[data-scroll-doc]").forEach((row) => {
    row.addEventListener("click", () => {
      const id = row.dataset.scrollDoc;
      if (!id) return;
      const card = el.querySelector(`[data-doc-id="${id}"]`);
      card?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  el.querySelectorAll("[data-goto-part]").forEach((row) => {
    row.addEventListener("dblclick", () => {
      ensureReviewSession();
      state.reviewSession.activePartId = row.dataset.gotoPart;
      state._reviewTab = "session";
      persist();
      renderReview();
    });
  });

  el.querySelectorAll("[data-del-doc]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!confirm("이 문서 요약을 삭제할까요?")) return;
      state.reviewDocs = state.reviewDocs.filter((d) => d.id !== btn.dataset.delDoc);
      persist();
      renderReview();
    });
  });

  el.querySelectorAll("[data-add-tag]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!isAdmin()) return;
      const id = btn.dataset.addTag;
      const doc = state.reviewDocs.find((d) => d.id === id);
      if (!doc) return;
      const preset = el.querySelector(`[data-tag-preset="${id}"]`)?.value || "";
      const custom = (el.querySelector(`[data-tag-custom="${id}"]`)?.value || "").trim();
      const label = custom || preset;
      if (!label) {
        alert("태그를 선택하거나 입력해 주세요.");
        return;
      }
      if (!Array.isArray(doc.reviewTags)) doc.reviewTags = [];
      doc.reviewTags.push({
        id: uid("tag"),
        label,
        by: sessionUser || "",
        createdAt: new Date().toISOString(),
        status: "open",
      });
      persist();
      renderReview();
    });
  });

  el.querySelectorAll("[data-toggle-tag]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!isAdmin()) return;
      const doc = state.reviewDocs.find((d) => d.id === btn.dataset.toggleTag);
      const tag = doc?.reviewTags?.find((t) => t.id === btn.dataset.tag);
      if (!tag) return;
      tag.status = tag.status === "done" ? "open" : "done";
      persist();
      renderReview();
    });
  });

  el.querySelectorAll("[data-del-tag]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!isAdmin()) return;
      const doc = state.reviewDocs.find((d) => d.id === btn.dataset.delTag);
      if (!doc) return;
      doc.reviewTags = (doc.reviewTags || []).filter((t) => t.id !== btn.dataset.tag);
      persist();
      renderReview();
    });
  });

  el.querySelectorAll("[data-review-part]").forEach((btn) => {
    btn.addEventListener("click", () => {
      ensureReviewSession();
      state.reviewSession.activePartId = btn.dataset.reviewPart;
      persist();
      renderReview();
    });
  });

  $("#reviewCommentAdd")?.addEventListener("click", async () => {
    if (!isAdmin()) return;
    const text = ($("#reviewCommentText")?.value || "").trim();
    const photoFile = $("#reviewCommentPhoto")?.files?.[0];
    if (!text && !(photoFile && photoFile.size)) {
      alert("코멘트 또는 사진 중 하나는 입력해 주세요.");
      return;
    }
    try {
      await addReviewCommentEntry({
        partId: state.reviewSession.activePartId,
        round: activeRound,
        text: text || "(사진 첨부)",
        rating: $("#reviewCommentRating")?.value || "good",
        photoFile,
        photoCaption: ($("#reviewCommentPhotoCaption")?.value || "").trim(),
      });
      renderReview();
    } catch (err) {
      alert(err.message || "코멘트 저장에 실패했습니다.");
    }
  });

  bindReviewCommentDeletes(el);

  $("#reviewSessionSave")?.addEventListener("click", () => {
    if (!isAdmin()) return;
    ensureReviewSession();
    state.reviewSession.title = ($("#reviewSessionTitle")?.value || "").trim() || "전체 취합본 윤독";
    state.reviewSession.date = $("#reviewSessionDate")?.value || today();
    state.reviewSession.notes = $("#reviewSessionNotes")?.value || "";
    persist();
    alert("윤독 회의 정보를 저장했습니다.");
  });

  $("#reviewSessionNotes")?.addEventListener("change", () => {
    if (!isAdmin()) return;
    ensureReviewSession();
    state.reviewSession.notes = $("#reviewSessionNotes").value || "";
    persist();
  });
}

const KPI_SCOPES = [
  { id: "core", label: "핵심", hint: "필수·공통 성과지표" },
  { id: "autonomy", label: "자율", hint: "대학 자율 설정 지표" },
];

/** 성과지표 선택 목록 (핵심 / 자율) */
const KPI_CATALOG = [
  { id: "emp-rate", scope: "core", name: "재학생 취업률", unit: "%", formula: "actual / target * 100", baselineNote: "전년도 공시 취업률" },
  { id: "fill-rate", scope: "core", name: "신입생 충원율", unit: "%", formula: "actual / target * 100", baselineNote: "전년도 충원율" },
  { id: "retain-rate", scope: "core", name: "재학생 충원율", unit: "%", formula: "actual / target * 100", baselineNote: "전년도 재학생 충원율" },
  { id: "edu-sat", scope: "core", name: "교육만족도", unit: "점", formula: "actual / target * 100", baselineNote: "전년도 만족도 조사" },
  { id: "extra-curr", scope: "autonomy", name: "비교과 프로그램 이수자 수", unit: "명", formula: "actual", baselineNote: "전년도 이수 실적" },
  { id: "industry", scope: "autonomy", name: "산학협력 참여 기업 수", unit: "개", formula: "actual", baselineNote: "전년도 협력기업 수" },
  { id: "global", scope: "autonomy", name: "글로벌 프로그램 참여 학생 수", unit: "명", formula: "actual", baselineNote: "전년도 참여 실적" },
  { id: "counsel", scope: "autonomy", name: "진로·상담 이용 학생 수", unit: "명", formula: "actual", baselineNote: "전년도 이용 실적" },
  { id: "custom", scope: "autonomy", name: "직접 입력", unit: "%", formula: "actual / target * 100", baselineNote: "", custom: true },
];

function kpiScopeMeta(scope) {
  return KPI_SCOPES.find((s) => s.id === scope) || KPI_SCOPES[0];
}

function kpiCatalogById(id) {
  return KPI_CATALOG.find((c) => c.id === id) || null;
}

function normalizeKpiPart(raw = {}, index = 0) {
  const name = String(raw.name || "").trim() || `항목 ${index + 1}`;
  const key = String(raw.key || `p${index + 1}`).replace(/[^a-zA-Z0-9_]/g, "") || `p${index + 1}`;
  return {
    id: raw.id || uid("kp"),
    key,
    name,
    value: Number(raw.value) || 0,
  };
}

function normalizeKpi(raw = {}) {
  const catalogId = raw.catalogId || "";
  const fromCat = catalogId ? kpiCatalogById(catalogId) : null;
  let scope = raw.scope === "autonomy" || raw.scope === "core" ? raw.scope : "";
  if (!scope && fromCat) scope = fromCat.scope;
  if (!scope) scope = "core";
  const parts = (Array.isArray(raw.parts) ? raw.parts : []).map((p, i) => normalizeKpiPart(p, i));
  const formulaTokens = Array.isArray(raw.formulaTokens)
    ? raw.formulaTokens.map((t) => String(t)).filter(Boolean)
    : [];
  return {
    id: raw.id || uid("kpi"),
    name: (raw.name || fromCat?.name || "").trim() || "성과지표",
    scope,
    catalogId: catalogId || (fromCat && !fromCat.custom ? fromCat.id : catalogId || ""),
    baseline: Number(raw.baseline) || 0,
    baselineNote: String(raw.baselineNote || "").trim(),
    formula: String(raw.formula || "actual / target * 100").trim(),
    formulaTokens,
    parts,
    target: Number(raw.target) || 0,
    actual: Number(raw.actual) || 0,
    unit: String(raw.unit || fromCat?.unit || "%").trim() || "%",
    area: String(raw.area || "").trim(),
    assigneeId: raw.assigneeId || "",
    createdBy: raw.createdBy || "",
    status: raw.status === "submitted" ? "submitted" : raw.status === "draft" ? "draft" : "",
    submittedAt: raw.submittedAt || "",
    submittedBy: raw.submittedBy || "",
    areaOrder: Number(raw.areaOrder) || 0,
  };
}

function isKpiSubmitted(row) {
  if (!row) return false;
  if (row.status === "submitted" || row.submittedAt) return true;
  if (!row.status && !row.createdBy) return true;
  return false;
}

function isKpiMemberDraft(row) {
  return Boolean(row?.createdBy && row.status !== "submitted" && !row.submittedAt);
}

function markKpiSubmitted(row) {
  if (!row) return row;
  row.status = "submitted";
  row.submittedAt = row.submittedAt || today();
  row.submittedBy = sessionUser || row.submittedBy || "";
  return row;
}

function canEditKpi(row) {
  if (!row) return false;
  if (canManageKpi()) return true;
  const me = currentMember();
  if (!me) return false;
  return row.assigneeId === me.id || row.createdBy === me.id || row.createdBy === sessionUser;
}

function myRelatedKpis() {
  ensureKpis();
  if (canManageKpi()) return state.kpis;
  const me = currentMember();
  if (!me) return [];
  return state.kpis.filter(
    (k) => k.assigneeId === me.id || k.createdBy === me.id || k.createdBy === sessionUser
  );
}

function ensureKpis() {
  if (!Array.isArray(state.kpis)) state.kpis = [];
  if (!state.kpis.length) {
    state.kpis = [
      normalizeKpi({
        catalogId: "emp-rate",
        scope: "core",
        name: "재학생 취업률",
        baseline: 62,
        baselineNote: "전년도 공시 취업률",
        formula: "actual / target * 100",
        target: 70,
        actual: 0,
        unit: "%",
      }),
      normalizeKpi({
        catalogId: "extra-curr",
        scope: "autonomy",
        name: "비교과 프로그램 이수자 수",
        baseline: 1200,
        baselineNote: "전년도 이수 실적",
        formula: "actual",
        target: 1500,
        actual: 0,
        unit: "명",
      }),
    ];
  } else {
    state.kpis = state.kpis.map((k) => normalizeKpi(k));
  }
}

/** 허용 산식: actual/target/baseline/세세부(pN) + 사칙연산 */
function evalKpiFormula(formula, vars = {}) {
  const src = String(formula || "actual / target * 100").trim();
  if (!src) return { ok: false, error: "산식이 비어 있습니다." };
  const keys = Object.keys(vars)
    .filter((k) => /^[a-z_][a-z0-9_]*$/i.test(k))
    .sort((a, b) => b.length - a.length);
  let probe = src;
  keys.forEach((k) => {
    probe = probe.replace(new RegExp(`\\b${k}\\b`, "gi"), "1");
  });
  if (!/^[\d\s.+\-*/()]+$/.test(probe)) {
    return { ok: false, error: "산식에는 세세부 항목·actual·target·baseline과 사칙연산만 쓸 수 있습니다." };
  }
  let expr = src;
  keys.forEach((k) => {
    expr = expr.replace(new RegExp(`\\b${k}\\b`, "gi"), String(Number(vars[k]) || 0));
  });
  try {
    // eslint-disable-next-line no-new-func
    const value = Function(`"use strict"; return (${expr});`)();
    if (!Number.isFinite(value)) return { ok: false, error: "계산 결과가 유효하지 않습니다." };
    return { ok: true, value };
  } catch {
    return { ok: false, error: "산식을 계산할 수 없습니다." };
  }
}

function kpiFormulaVars(k, overrides = {}) {
  const vars = {
    actual: Number(overrides.actual ?? k.actual) || 0,
    target: Number(overrides.target ?? k.target) || 0,
    baseline: Number(overrides.baseline ?? k.baseline) || 0,
  };
  (k.parts || []).forEach((p, i) => {
    const key = p.key || `p${i + 1}`;
    vars[key] = Number(p.value) || 0;
  });
  return vars;
}

function kpiSimRow(k) {
  const sim = evalKpiFormula(k.formula, kpiFormulaVars(k));
  const rate =
    Number(k.target) > 0 ? ((Number(k.actual) || 0) / Number(k.target)) * 100 : null;
  return { ...k, sim, rate };
}

function tokenizeKpiFormula(formula) {
  const src = String(formula || "").trim();
  if (!src) return [];
  const tokens = src.match(/[a-z_][a-z0-9_]*|\d+(?:\.\d+)?|[+\-*/()]/gi);
  return tokens || [];
}

function kpiPartsFromForm() {
  const rows = $$("#kpiPartsList .kpi-part-row");
  return rows.map((row, i) =>
    normalizeKpiPart(
      {
        id: row.dataset.partId,
        name: row.querySelector('[name="partName"]')?.value,
        value: row.querySelector('[name="partValue"]')?.value,
        key: `p${i + 1}`,
      },
      i
    )
  );
}

function kpiPartRowHtml(part, index) {
  const p = normalizeKpiPart(part, index);
  return `
    <div class="kpi-part-row" data-part-id="${escapeAttr(p.id)}" draggable="false">
      <span class="kpi-part-key" title="산식 변수">${escapeHtml(p.key || `p${index + 1}`)}</span>
      <input name="partName" class="wp-input" value="${escapeAttr(p.name)}" placeholder="세세부 항목명" />
      <input name="partValue" class="wp-input" type="number" step="any" value="${escapeAttr(String(p.value ?? 0))}" placeholder="값" />
      <button type="button" class="btn btn-sm btn-danger" data-del-part title="삭제">삭제</button>
    </div>`;
}

const KPI_FORMULA_OPS = [
  { token: "+", label: "+" },
  { token: "-", label: "−" },
  { token: "*", label: "×" },
  { token: "/", label: "÷" },
  { token: "(", label: "(" },
  { token: ")", label: ")" },
  { token: "100", label: "100" },
];

const KPI_FORMULA_SYS = [
  { token: "actual", label: "실적(actual)" },
  { token: "target", label: "목표(target)" },
  { token: "baseline", label: "기준(baseline)" },
];

function renderKpi() {
  const el = $("#view-kpi");
  if (!el) return;
  ensureKpis();
  const manage = canManageKpi();
  const filter = ["all", "core", "autonomy"].includes(state._kpiFilter) ? state._kpiFilter : "all";
  state._kpiFilter = filter;
  const mine = myRelatedKpis();
  const source = manage ? state.kpis.filter((k) => !isKpiMemberDraft(k)) : mine;
  const allRows = source.map(kpiSimRow);
  const rows = filter === "all" ? allRows : allRows.filter((k) => k.scope === filter);
  const coreCount = allRows.filter((k) => k.scope === "core").length;
  const autoCount = allRows.filter((k) => k.scope === "autonomy").length;
  const submittedN = rows.filter((k) => isKpiSubmitted(k)).length;

  el.innerHTML = `
    ${tfallHubBarHtml()}
    <div class="panel">
      <div class="panel-head">
        <div>
          <h2 class="panel-title">${manage ? "영역별 성과지표 구성" : "내 성과지표 입력"}</h2>
          <p class="muted" style="margin:4px 0 0">${
            manage
              ? `제출 ${submittedN}건 · 카드를 영역 칸으로 끌어 배치합니다.`
              : "입력한 뒤 제출하면 성과지표담당자 화면으로 모입니다."
          }</p>
        </div>
        ${
          manage
            ? `<button type="button" class="btn btn-primary" id="addKpi">지표 추가</button>`
            : `<button type="button" class="btn btn-primary" id="composeKpi">지표 입력</button>`
        }
      </div>
      <div class="kpi-scope-tabs" role="tablist" aria-label="지표 구분">
        <button type="button" class="kpi-scope-tab ${filter === "all" ? "is-on" : ""}" data-kpi-filter="all">전체 <em>${allRows.length}</em></button>
        <button type="button" class="kpi-scope-tab ${filter === "core" ? "is-on" : ""}" data-kpi-filter="core">핵심 <em>${coreCount}</em></button>
        <button type="button" class="kpi-scope-tab ${filter === "autonomy" ? "is-on" : ""}" data-kpi-filter="autonomy">자율 <em>${autoCount}</em></button>
      </div>
      ${
        manage
          ? areaBoardHtml("kpi", rows, kpiBoardCardHtml)
          : `<div class="kpi-grid">
              ${
                rows.length
                  ? rows
                      .map((k) => {
                        const submitted = isKpiSubmitted(k);
                        const scope = kpiScopeMeta(k.scope);
                        return `
                    <article class="kpi-card scope-${escapeAttr(k.scope)} is-clickable" data-kpi-open="${escapeAttr(k.id)}">
                      <header class="kpi-card-head">
                        <div class="kpi-card-title">
                          <span class="kpi-scope-badge is-${escapeAttr(k.scope)}">${escapeHtml(scope.label)}</span>
                          <h3>${escapeHtml(k.name)}</h3>
                        </div>
                        <span class="badge ${submitted ? "ok" : "pending"}">${submitted ? "제출됨" : "입력 중"}</span>
                      </header>
                      <dl class="kpi-meta">
                        <div><dt>기준값</dt><dd>${escapeHtml(String(k.baseline))} ${escapeHtml(k.unit || "")}</dd></div>
                        <div><dt>목표</dt><dd>${escapeHtml(String(k.target))} ${escapeHtml(k.unit || "")}</dd></div>
                        <div><dt>실적</dt><dd>${escapeHtml(String(k.actual))} ${escapeHtml(k.unit || "")}</dd></div>
                      </dl>
                      <p class="kpi-note muted">${escapeHtml(workAreaKey(k.area))}</p>
                      ${
                        submitted
                          ? ""
                          : `<button type="button" class="btn btn-sm btn-primary" data-kpi-submit="${escapeAttr(k.id)}">제출</button>`
                      }
                    </article>`;
                      })
                      .join("")
                  : `<div class="empty">「지표 입력」으로 항목을 만든 뒤 제출하세요.</div>`
              }
            </div>`
      }
    </div>
  `;

  bindTfallHubBar(el);
  el.querySelectorAll("[data-kpi-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state._kpiFilter = btn.dataset.kpiFilter;
      renderKpi();
    });
  });
  $("#addKpi")?.addEventListener("click", () => openKpiModal());
  $("#composeKpi")?.addEventListener("click", () => openMemberKpiCompose());
  el.querySelectorAll("[data-kpi-submit]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      submitKpiItem(btn.dataset.kpiSubmit);
    });
  });
  let kpiDragged = false;
  el.querySelectorAll("[data-kpi-open]").forEach((card) => {
    const open = () => {
      if (kpiDragged) {
        kpiDragged = false;
        return;
      }
      const id = card.dataset.kpiOpen;
      if (manage) openKpiModal(id);
      else openMemberKpiCompose(id);
    };
    card.addEventListener("dragstart", () => {
      kpiDragged = true;
    });
    card.addEventListener("click", open);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    });
  });
  if (manage) {
    bindAreaBoard(el, { kind: "kpi", onMove: moveKpiItemArea });
  }
}

function submitKpiItem(id) {
  ensureKpis();
  const row = state.kpis.find((k) => k.id === id);
  if (!row || !canEditKpi(row)) return;
  if (!String(row.name || "").trim()) {
    alert("지표명을 입력한 뒤 제출해 주세요.");
    return;
  }
  markKpiSubmitted(row);
  persist();
  renderKpi();
}

function openMemberKpiCompose(id = null) {
  const me = currentMember();
  if (!me || canManageKpi()) return;
  ensureKpis();
  const row = id ? state.kpis.find((k) => k.id === id) : null;
  if (row && !canEditKpi(row)) return;
  const scope0 = row?.scope || "core";
  openModal({
    kicker: row ? "지표 수정" : "지표 입력",
    title: "입력한 뒤 제출하면 성과지표담당자에게 모입니다.",
    submitLabel: "제출",
    bodyHtml: `
      <div class="wp-form">
        <div class="wp-field">
          <span class="wp-label">구분</span>
          <input type="hidden" name="scope" value="${escapeAttr(scope0)}" />
          <div class="wp-chips" role="group">
            ${KPI_SCOPES.map(
              (s) =>
                `<button type="button" class="wp-chip ${s.id === scope0 ? "is-on" : ""}" data-member-kpi-scope="${escapeAttr(s.id)}">${escapeHtml(s.label)}</button>`
            ).join("")}
          </div>
        </div>
        <label class="wp-field">
          <span class="wp-label">성과지표명</span>
          <input name="name" class="wp-input" required value="${escapeAttr(row?.name || "")}" placeholder="예: 재학생 취업률" />
        </label>
        <div class="wp-grid-2">
          <label class="wp-field">
            <span class="wp-label">기준값</span>
            <input name="baseline" class="wp-input" type="number" step="any" value="${escapeAttr(String(row?.baseline ?? 0))}" />
          </label>
          <label class="wp-field">
            <span class="wp-label">단위</span>
            <input name="unit" class="wp-input" value="${escapeAttr(row?.unit || "%")}" />
          </label>
        </div>
        <div class="wp-grid-2">
          <label class="wp-field">
            <span class="wp-label">목표값</span>
            <input name="target" class="wp-input" type="number" step="any" required value="${escapeAttr(String(row?.target ?? 0))}" />
          </label>
          <label class="wp-field">
            <span class="wp-label">실적</span>
            <input name="actual" class="wp-input" type="number" step="any" value="${escapeAttr(String(row?.actual ?? 0))}" />
          </label>
        </div>
        <label class="wp-field">
          <span class="wp-label">근거·메모</span>
          <textarea name="baselineNote" class="wp-input" rows="2" placeholder="전년도 공시·조사 근거">${escapeHtml(row?.baselineNote || "")}</textarea>
        </label>
      </div>
    `,
    onSubmit: (fd) => {
      const payload = normalizeKpi({
        ...(row || {}),
        name: fd.get("name"),
        scope: fd.get("scope") || scope0,
        baseline: fd.get("baseline"),
        unit: fd.get("unit"),
        target: fd.get("target"),
        actual: fd.get("actual"),
        baselineNote: fd.get("baselineNote"),
        assigneeId: row?.assigneeId || me.id,
        createdBy: row?.createdBy || sessionUser || me.id,
        area: row?.area || "",
      });
      markKpiSubmitted(payload);
      if (row) Object.assign(row, payload, { id: row.id });
      else {
        payload.id = uid("kpi");
        state.kpis.push(payload);
      }
      persist();
      renderKpi();
      return true;
    },
  });
  const scopeHidden = $("#modalBody")?.querySelector('[name="scope"]');
  $$("#modalBody [data-member-kpi-scope]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (scopeHidden) scopeHidden.value = btn.dataset.memberKpiScope || "core";
      $$("#modalBody [data-member-kpi-scope]").forEach((b) => b.classList.toggle("is-on", b === btn));
    });
  });
}

function openKpiModal(id = null) {
  if (!canManageKpi()) return;
  ensureKpis();
  const row = id ? state.kpis.find((k) => k.id === id) : null;
  const scope0 = row?.scope || "core";
  const catalog0 = row?.catalogId || (scope0 === "core" ? "emp-rate" : "custom");
  const parts0 =
    row?.parts?.length
      ? row.parts.map((p, i) => normalizeKpiPart(p, i))
      : [normalizeKpiPart({ name: "분자(예: 취업자 수)", value: 0 }, 0), normalizeKpiPart({ name: "분모(예: 졸업생 수)", value: 0 }, 1)];
  let formulaTokens = row?.formulaTokens?.length
    ? [...row.formulaTokens]
    : tokenizeKpiFormula(row?.formula || "actual / target * 100");

  const catalogOptionsHtml = (scope) =>
    KPI_CATALOG.filter((c) => c.scope === scope || c.custom)
      .map((c) => {
        const selected =
          c.id === catalog0 || (catalog0 === "custom" && c.custom) || (!row && c.id === (scope === "core" ? "emp-rate" : "custom"));
        return `<option value="${escapeAttr(c.id)}" ${selected ? "selected" : ""}>${escapeHtml(c.name)}</option>`;
      })
      .join("");

  openModal({
    kicker: row ? "성과지표 수정" : "성과지표 추가",
    title: row ? "지표 내용을 수정합니다." : "핵심·자율 지표를 등록합니다.",
    submitLabel: row ? "저장" : "지표 등록",
    bodyHtml: `
      <div class="wp-form" id="kpiModalForm">
        <div class="wp-field">
          <span class="wp-label">구분</span>
          <input type="hidden" name="scope" id="kpiScopeInput" value="${escapeAttr(scope0)}" />
          <div class="wp-chips" role="group" aria-label="핵심·자율 구분">
            ${KPI_SCOPES.map(
              (s) => `
              <button type="button" class="wp-chip ${s.id === scope0 ? "is-on" : ""}" data-kpi-scope="${escapeAttr(s.id)}" title="${escapeAttr(s.hint)}">${escapeHtml(s.label)}</button>`
            ).join("")}
          </div>
          <p class="muted" style="margin:4px 0 0;font-size:0.72rem" id="kpiScopeHint">${escapeHtml(kpiScopeMeta(scope0).hint)}</p>
        </div>
        <label class="wp-field">
          <span class="wp-label">지표 선택</span>
          <select name="catalogId" id="kpiCatalogSelect" class="wp-input wp-select">
            ${catalogOptionsHtml(scope0)}
          </select>
        </label>
        <label class="wp-field">
          <span class="wp-label">성과지표명</span>
          <input name="name" id="kpiNameInput" class="wp-input" required value="${escapeAttr(row?.name || "")}" placeholder="예: 재학생 취업률" />
        </label>
        <label class="wp-field">
          <span class="wp-label">입력담당자</span>
          <select name="assigneeId" class="wp-input wp-select">
            <option value="">미지정</option>
            ${inputAssignees()
              .map(
                (m) =>
                  `<option value="${m.id}" ${row?.assigneeId === m.id ? "selected" : ""}>${escapeHtml(m.name)}</option>`
              )
              .join("")}
          </select>
        </label>
        <div class="wp-grid-2">
          <label class="wp-field">
            <span class="wp-label">기준값</span>
            <input name="baseline" id="kpiBaselineInput" class="wp-input" type="number" step="any" required value="${escapeAttr(String(row?.baseline ?? 0))}" />
          </label>
          <label class="wp-field">
            <span class="wp-label">단위</span>
            <input name="unit" id="kpiUnitInput" class="wp-input" value="${escapeAttr(row?.unit || "%")}" />
          </label>
        </div>
        <label class="wp-field">
          <span class="wp-label">기준값 근거</span>
          <textarea name="baselineNote" id="kpiNoteInput" class="wp-input" rows="2" placeholder="전년도 공시·조사 근거">${escapeHtml(row?.baselineNote || "")}</textarea>
        </label>
        <div class="wp-grid-2">
          <label class="wp-field">
            <span class="wp-label">목표값</span>
            <input name="target" id="kpiTargetInput" class="wp-input" type="number" step="any" required value="${escapeAttr(String(row?.target ?? 0))}" />
          </label>
          <label class="wp-field">
            <span class="wp-label">현재 실적</span>
            <input name="actual" id="kpiActualInput" class="wp-input" type="number" step="any" value="${escapeAttr(String(row?.actual ?? 0))}" />
          </label>
        </div>

        <section class="kpi-parts-block" aria-label="세세부 항목">
          <div class="kpi-parts-head">
            <span class="wp-label">세세부 항목</span>
            <button type="button" class="btn btn-sm" id="kpiPartAdd">항목 추가</button>
          </div>
          <p class="muted kpi-builder-hint">지표를 구성하는 세부 수치를 입력하세요. 아래에서 드래그해 산식에 넣습니다.</p>
          <div id="kpiPartsList">${parts0.map((p, i) => kpiPartRowHtml(p, i)).join("")}</div>
        </section>

        <section class="kpi-formula-builder" aria-label="산식 빌더">
          <span class="wp-label">산식 만들기</span>
          <p class="muted kpi-builder-hint">세세부·변수 칩을 드래그(또는 클릭)하고, 연산 버튼을 눌러 산식을 만듭니다.</p>
          <div class="kpi-formula-palette" id="kpiFormulaPalette"></div>
          <div class="kpi-formula-ops" id="kpiFormulaOps" role="group" aria-label="연산">
            ${KPI_FORMULA_OPS.map(
              (op) =>
                `<button type="button" class="kpi-op-chip" data-formula-token="${escapeAttr(op.token)}">${escapeHtml(op.label)}</button>`
            ).join("")}
            <button type="button" class="btn btn-sm" id="kpiFormulaClear">비우기</button>
            <button type="button" class="btn btn-sm" id="kpiFormulaUndo">되돌리기</button>
          </div>
          <div class="kpi-formula-drop" id="kpiFormulaDrop" tabindex="0" aria-label="산식 드롭 영역"></div>
          <input type="hidden" name="formula" id="kpiFormulaInput" value="${escapeAttr(formulaTokens.join(" "))}" required />
          <input type="hidden" name="formulaTokens" id="kpiFormulaTokensInput" value="${escapeAttr(JSON.stringify(formulaTokens))}" />
          <div class="kpi-formula-check-row">
            <code id="kpiFormulaPreview">${escapeHtml(formulaTokens.join(" ") || "—")}</code>
            <button type="button" class="btn btn-primary btn-sm" id="kpiFormulaCheck">산식 확인</button>
            <span id="kpiFormulaCheckResult" class="kpi-formula-check-result"></span>
          </div>
        </section>
      </div>
      ${row ? `<div class="budget-modal-extra"><button type="button" class="btn btn-sm btn-danger" id="kpiDeleteInModal">삭제</button></div>` : ""}
    `,
    onSubmit: (fd) => {
      const parts = kpiPartsFromForm();
      let tokens = [];
      try {
        tokens = JSON.parse(fd.get("formulaTokens") || "[]");
      } catch {
        tokens = tokenizeKpiFormula(fd.get("formula"));
      }
      if (!Array.isArray(tokens) || !tokens.length) {
        alert("산식을 만들어 주세요. 세세부 항목·변수를 드래그하고 연산을 선택하세요.");
        return false;
      }
      const formula = tokens.join(" ");
      const draft = {
        name: fd.get("name"),
        scope: fd.get("scope"),
        catalogId: fd.get("catalogId"),
        assigneeId: fd.get("assigneeId") || row?.assigneeId || "",
        area: row?.area || "",
        createdBy: row?.createdBy || "",
        status: row?.status || "",
        submittedAt: row?.submittedAt || "",
        submittedBy: row?.submittedBy || "",
        baseline: fd.get("baseline"),
        baselineNote: fd.get("baselineNote"),
        target: fd.get("target"),
        actual: fd.get("actual"),
        unit: fd.get("unit"),
        formula,
        formulaTokens: tokens,
        parts,
      };
      const check = evalKpiFormula(formula, kpiFormulaVars(draft));
      if (!check.ok) {
        alert(check.error || "산식을 확인해 주세요.");
        return false;
      }
      const payload = normalizeKpi(draft);
      if (row) Object.assign(row, payload, { id: row.id });
      else state.kpis.push(payload);
      persist();
      renderKpi();
      return true;
    },
  });

  const scopeInput = $("#kpiScopeInput");
  const catalogSel = $("#kpiCatalogSelect");
  const nameInput = $("#kpiNameInput");
  const unitInput = $("#kpiUnitInput");
  const noteInput = $("#kpiNoteInput");
  const formulaInput = $("#kpiFormulaInput");
  const tokensInput = $("#kpiFormulaTokensInput");
  const hint = $("#kpiScopeHint");
  const partsList = $("#kpiPartsList");
  const palette = $("#kpiFormulaPalette");
  const drop = $("#kpiFormulaDrop");
  const preview = $("#kpiFormulaPreview");
  const checkResult = $("#kpiFormulaCheckResult");

  const syncPartKeys = () => {
    $$("#kpiPartsList .kpi-part-row").forEach((rowEl, i) => {
      const keyEl = rowEl.querySelector(".kpi-part-key");
      if (keyEl) keyEl.textContent = `p${i + 1}`;
    });
  };

  const syncFormulaUi = () => {
    const formula = formulaTokens.join(" ");
    if (formulaInput) formulaInput.value = formula;
    if (tokensInput) tokensInput.value = JSON.stringify(formulaTokens);
    if (preview) preview.textContent = formula || "—";
    if (drop) {
      drop.innerHTML = formulaTokens.length
        ? formulaTokens
            .map(
              (t, i) => `
            <span class="kpi-formula-token" draggable="true" data-token-index="${i}" data-token="${escapeAttr(t)}">
              ${escapeHtml(t)}
              <button type="button" class="kpi-token-x" data-remove-token="${i}" aria-label="제거">×</button>
            </span>`
            )
            .join("")
        : `<span class="kpi-formula-drop-empty">여기에 세세부·변수·연산을 놓으세요</span>`;
    }
    if (checkResult) checkResult.textContent = "";
  };

  const renderPalette = () => {
    if (!palette) return;
    const parts = kpiPartsFromForm();
    const partChips = parts
      .map(
        (p, i) =>
          `<button type="button" class="kpi-palette-chip is-part" draggable="true" data-formula-token="${escapeAttr(p.key || `p${i + 1}`)}" title="${escapeAttr(p.name)}">
            <em>${escapeHtml(p.key || `p${i + 1}`)}</em>${escapeHtml(p.name)}
          </button>`
      )
      .join("");
    const sysChips = KPI_FORMULA_SYS.map(
      (s) =>
        `<button type="button" class="kpi-palette-chip is-sys" draggable="true" data-formula-token="${escapeAttr(s.token)}">${escapeHtml(s.label)}</button>`
    ).join("");
    palette.innerHTML = `${partChips}${sysChips}`;
  };

  const pushToken = (token) => {
    if (!token) return;
    formulaTokens.push(token);
    syncFormulaUi();
  };

  const refillCatalog = (scope, preferId) => {
    if (!catalogSel) return;
    const list = KPI_CATALOG.filter((c) => c.scope === scope || c.custom);
    const prefer = preferId && list.some((c) => c.id === preferId) ? preferId : list[0]?.id;
    catalogSel.innerHTML = list
      .map((c) => `<option value="${escapeAttr(c.id)}" ${c.id === prefer ? "selected" : ""}>${escapeHtml(c.name)}</option>`)
      .join("");
  };

  const applyCatalog = (catId, { fillName = true } = {}) => {
    const cat = kpiCatalogById(catId);
    if (!cat) return;
    if (fillName && nameInput) {
      if (cat.custom) {
        if (!nameInput.value.trim()) nameInput.value = "";
        nameInput.placeholder = "직접 입력할 지표명";
      } else {
        nameInput.value = cat.name;
        nameInput.placeholder = "예: 재학생 취업률";
      }
    }
    if (unitInput && cat.unit) unitInput.value = cat.unit;
    if (cat.formula && !row) {
      formulaTokens = tokenizeKpiFormula(cat.formula);
      syncFormulaUi();
    }
    if (noteInput && cat.baselineNote && (!row || !noteInput.value.trim())) {
      noteInput.value = cat.baselineNote;
    }
  };

  $$("[data-kpi-scope]").forEach((chip) => {
    chip.addEventListener("click", () => {
      const scope = chip.dataset.kpiScope;
      if (scopeInput) scopeInput.value = scope;
      $$("[data-kpi-scope]").forEach((c) => c.classList.toggle("is-on", c.dataset.kpiScope === scope));
      if (hint) hint.textContent = kpiScopeMeta(scope).hint;
      refillCatalog(scope, catalogSel?.value);
      applyCatalog(catalogSel?.value, { fillName: !row });
    });
  });

  catalogSel?.addEventListener("change", () => {
    applyCatalog(catalogSel.value, { fillName: true });
  });

  $("#kpiPartAdd")?.addEventListener("click", () => {
    const i = $$("#kpiPartsList .kpi-part-row").length;
    partsList?.insertAdjacentHTML("beforeend", kpiPartRowHtml({ name: "", value: 0 }, i));
    syncPartKeys();
    renderPalette();
  });

  partsList?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-del-part]");
    if (!btn) return;
    btn.closest(".kpi-part-row")?.remove();
    syncPartKeys();
    renderPalette();
  });

  partsList?.addEventListener("input", (e) => {
    if (e.target.matches('[name="partName"], [name="partValue"]')) renderPalette();
  });

  $("#kpiFormulaOps")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-formula-token]");
    if (btn) {
      btn.classList.add("is-on");
      window.setTimeout(() => btn.classList.remove("is-on"), 180);
      pushToken(btn.dataset.formulaToken);
    }
  });

  $("#kpiFormulaClear")?.addEventListener("click", () => {
    formulaTokens = [];
    syncFormulaUi();
  });
  $("#kpiFormulaUndo")?.addEventListener("click", () => {
    formulaTokens.pop();
    syncFormulaUi();
  });

  palette?.addEventListener("click", (e) => {
    const chip = e.target.closest("[data-formula-token]");
    if (chip) pushToken(chip.dataset.formulaToken);
  });

  let dragToken = "";
  let dragFromIndex = -1;

  const onDragStart = (e, token, fromIndex = -1) => {
    dragToken = token;
    dragFromIndex = fromIndex;
    e.dataTransfer?.setData("text/plain", token);
    e.dataTransfer.effectAllowed = "copyMove";
  };

  palette?.addEventListener("dragstart", (e) => {
    const chip = e.target.closest("[data-formula-token]");
    if (!chip) return;
    onDragStart(e, chip.dataset.formulaToken, -1);
  });

  drop?.addEventListener("dragstart", (e) => {
    const tok = e.target.closest(".kpi-formula-token");
    if (!tok) return;
    onDragStart(e, tok.dataset.token, Number(tok.dataset.tokenIndex));
  });

  drop?.addEventListener("dragover", (e) => {
    e.preventDefault();
    drop.classList.add("is-dragover");
  });
  drop?.addEventListener("dragleave", () => drop.classList.remove("is-dragover"));
  drop?.addEventListener("drop", (e) => {
    e.preventDefault();
    drop.classList.remove("is-dragover");
    const token = dragToken || e.dataTransfer?.getData("text/plain");
    if (!token) return;
    const over = e.target.closest(".kpi-formula-token");
    const insertAt = over ? Number(over.dataset.tokenIndex) : formulaTokens.length;
    if (dragFromIndex >= 0) {
      formulaTokens.splice(dragFromIndex, 1);
      const at = dragFromIndex < insertAt ? insertAt - 1 : insertAt;
      formulaTokens.splice(Math.max(0, at), 0, token);
    } else {
      formulaTokens.splice(insertAt, 0, token);
    }
    dragToken = "";
    dragFromIndex = -1;
    syncFormulaUi();
  });

  drop?.addEventListener("click", (e) => {
    const rm = e.target.closest("[data-remove-token]");
    if (!rm) return;
    const idx = Number(rm.dataset.removeToken);
    if (!Number.isFinite(idx)) return;
    formulaTokens.splice(idx, 1);
    syncFormulaUi();
  });

  $("#kpiFormulaCheck")?.addEventListener("click", () => {
    const formula = formulaTokens.join(" ");
    const draft = {
      baseline: Number($("#kpiBaselineInput")?.value) || 0,
      target: Number($("#kpiTargetInput")?.value) || 0,
      actual: Number($("#kpiActualInput")?.value) || 0,
      parts: kpiPartsFromForm(),
    };
    const result = evalKpiFormula(formula, kpiFormulaVars(draft));
    if (!checkResult) return;
    if (result.ok) {
      checkResult.textContent = `확인됨 · 결과 ${Number(result.value).toFixed(2)}`;
      checkResult.className = "kpi-formula-check-result is-ok";
    } else {
      checkResult.textContent = result.error || "오류";
      checkResult.className = "kpi-formula-check-result is-bad";
    }
  });

  syncFormulaUi();
  renderPalette();
  if (!row) applyCatalog(catalogSel?.value || catalog0, { fillName: true });
  $("#kpiDeleteInModal")?.addEventListener("click", (e) => {
    e.preventDefault();
    if (!row || !canManageKpi()) return;
    if (!confirm("이 성과지표를 삭제할까요?")) return;
    state.kpis = state.kpis.filter((k) => k.id !== row.id);
    closeModal();
    persist();
    renderKpi();
  });
}

function renderView(name) {
  const map = {
    dashboard: renderDashboard,
    "my-work": renderMyWork,
    "tf-all": renderTfAll,
    parts: renderParts,
    collections: renderCollections,
    review: renderReview,
    requests: renderRequests,
    budget: renderBudget,
    kpi: renderKpi,
    schedule: renderSchedule,
    drive: renderDrive,
    resources: renderResources,
    food: renderFood,
    members: renderMembers,
    "ai-art": renderAiArt,
    guide: renderGuide,
  };
  try {
    map[name]?.();
  } catch (err) {
    console.error(`[renderView:${name}]`, err);
    const el = document.getElementById(`view-${name}`);
    if (el && !String(el.innerHTML || "").trim()) {
      el.innerHTML = `<section class="panel"><p class="muted">화면을 불러오지 못했습니다. 새로고침해 주세요.</p></section>`;
    }
  }
}

function buildMyWorkChecklist() {
  const items = [];
  const styleGuides = (state.resources || []).filter((r) => r.category === "스타일" || /스타일|가이드/i.test(r.title || ""));
  items.push({
    id: "style",
    done: styleGuides.length > 0,
    title: "관리자의 스타일 가이드를 열람하세요.",
    meta: styleGuides[0]?.title || "양식 메뉴에서 확인",
    goto: "resources",
    overdue: false,
  });

  const mine = myPartIds();
  const col = latestCollection() || (state.collections || [])[0];
  if (col && mine.length) {
    mine.forEach((pid) => {
      const sub = col.submissions.find((s) => s.partId === pid);
      const st = submissionBoardStatus(sub);
      const p = partById(pid);
      items.push({
        id: `col-${pid}`,
        done: st.id === "done",
        title: `${col.name || "취합"} · ${p ? `${p.section}. ${p.title}` : pid} 원고를 작성·업로드하세요.`,
        meta: st.label,
        goto: "collections",
        overdue: st.id !== "done" && col.dueDate && daysUntil(col.dueDate) < 0,
      });
    });
  } else {
    items.push({
      id: "col-none",
      done: false,
      title: "1차 원고를 작성하여 업로드 해주세요.",
      meta: mine.length ? "취합 차수를 확인하세요" : "목차·할당에서 담당 파트를 배정받으세요",
      goto: "collections",
      overdue: false,
    });
  }

  ensureBudget();
  const me = currentMember();
  const mode = getBudgetInputMode();
  const meta = budgetModeMeta(mode);
  const myBud = me
    ? (state.budget.items || []).filter((i) => i.assigneeId === me.id)
    : [];
  const budPending = myBud.filter((i) => !budgetCalcOf(i, mode));
  items.push({
    id: "budget",
    done: myBud.length ? budPending.length === 0 : false,
    title: "예산을 수립하여 입력해 주세요.",
    meta: myBud.length ? `${meta.short} ${myBud.length - budPending.length}/${myBud.length}` : "배정 항목 없음",
    goto: "budget",
    overdue: budPending.length > 0,
  });

  ensureKpis();
  const kpiOpen = (state.kpis || []).filter((k) => Number(k.actual) <= 0);
  items.push({
    id: "kpi",
    done: (state.kpis || []).length > 0 && kpiOpen.length === 0,
    title: "성과지표를 수립하여 입력해 주세요.",
    meta: (state.kpis || []).length ? `실적 미입력 ${kpiOpen.length}건` : "지표 등록 필요",
    goto: "kpi",
    overdue: false,
  });

  myPendingRequests().forEach((r) => {
    const days = r.dueDate ? daysUntil(r.dueDate) : null;
    items.push({
      id: `req-${r.id}`,
      done: false,
      title: r.title || "공통 요청",
      meta: r.dueDate ? `마감 ${r.dueDate}${days != null ? ` · ${timingLabel(days)}` : ""}` : "마감 미지정",
      goto: "requests",
      overdue: days != null && days < 0,
      approaching: days != null && days >= 0 && days <= 3,
    });
  });

  return items;
}

function renderMyWork() {
  const el = $("#view-my-work");
  if (!el) return;
  const who = sessionUser || "작성자";
  const admin = isAdmin();
  const items = [...(state.schedule || [])]
    .filter((s) => isAdminRegisteredWork(s) && scheduleVisibleToUser(s, who))
    .sort((a, b) => a.date.localeCompare(b.date));

  el.innerHTML = `
    <div class="mywork-page">
      ${scheduleFeedPanelHtml(who, admin, items)}
    </div>
  `;

  bindScheduleFeedActions(el, refreshActiveScheduleSurface, {
    onOpenItem: (item) => {
      if (isAdmin()) openScheduleModal(item?.id);
      else openScheduleUploadForItem(item);
    },
  });
}

function renderTfAll() {
  const el = $("#view-tf-all");
  if (!el) return;
  ensureBudget();
  ensureKpis();
  const col = latestCollection();
  const board = col ? buildTeamCollectionBoard(col) : [];
  const pageTarget = Number(state.meta?.totalTargetPages) || allocatedTotal() || 1;
  const pageDone = board.reduce((s, r) => s + (Number(r.pages) || 0), 0);
  const pagePct = Math.min(100, Math.round((pageDone / pageTarget) * 100));
  const doneParts = board.filter((r) => r.status.id === "done").length;

  const mode = getBudgetInputMode();
  const meta = budgetModeMeta(mode);
  const items = state.budget.items || [];
  const totalBudget = Number(state.budget.total) || items.reduce((s, i) => s + (Number(mode === "result" ? i.spent : i.planned) || 0), 0);
  const byArea = {};
  const byExpense = {};
  items.forEach((i) => {
    const key = i.area || "기타";
    const amt = Number(mode === "result" ? i.spent : i.planned) || 0;
    byArea[key] = (byArea[key] || 0) + amt;
    const exp = i.expenseType || i.expense || "기타비목";
    byExpense[exp] = (byExpense[exp] || 0) + amt;
  });
  const areaRows = Object.entries(byArea).sort((a, b) => b[1] - a[1]);
  const expenseRows = Object.entries(byExpense).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const kpis = (state.kpis || []).map(kpiSimRow);
  const avgRate =
    kpis.length && kpis.every((k) => k.rate != null)
      ? kpis.reduce((s, k) => s + k.rate, 0) / kpis.length
      : null;
  const coreN = kpis.filter((k) => k.scope === "core").length;
  const autoN = kpis.filter((k) => k.scope === "autonomy").length;

  el.innerHTML = `
    <div class="tfall-page">
      <section class="panel">
        <div class="panel-head">
          <div>
            <h2 class="panel-title">1. 보고서 통합</h2>
            <p class="muted" style="margin:4px 0 0">목차·분량 대비 제출 현황 · ${escapeHtml(col?.name || "취합 없음")}</p>
          </div>
          <button type="button" class="btn btn-sm" data-goto="collections">상세</button>
        </div>
        <div class="tfall-metrics">
          <div class="stat"><div class="label">제출</div><div class="value">${doneParts}/${board.length || 0}</div></div>
          <div class="stat"><div class="label">작성 페이지</div><div class="value">${pageDone}p</div></div>
          <div class="stat accent"><div class="label">목표 대비</div><div class="value">${pagePct}%</div><div class="sub">목표 ${pageTarget}p</div></div>
        </div>
        <div class="kpi-sim-bar tfall-bar"><i style="width:${pagePct}%"></i></div>
        <div class="table-wrap" style="margin-top:12px">
          <table>
            <thead><tr><th>파트</th><th>담당</th><th>페이지</th><th>상태</th></tr></thead>
            <tbody>
              ${
                board.length
                  ? board
                      .map(
                        (r) => `<tr class="${r.status.id !== "done" ? "row-todo" : ""}">
                    <td>${escapeHtml(r.section)}. ${escapeHtml(r.title)}</td>
                    <td>${escapeHtml(r.assignee)}</td>
                    <td>${r.pages}/${r.alloc || "?"}p</td>
                    <td><span class="badge ${r.status.cls}">${escapeHtml(r.status.label)}</span></td>
                  </tr>`
                      )
                      .join("")
                  : `<tr><td colspan="4" class="muted">목차·할당 후 취합 현황이 표시됩니다.</td></tr>`
              }
            </tbody>
          </table>
        </div>
      </section>

      <section class="panel">
        <div class="panel-head">
          <div>
            <h2 class="panel-title">2. 예산 통합</h2>
            <p class="muted" style="margin:4px 0 0">${escapeHtml(meta.tabLabel)} · 영역·비목 구성비</p>
          </div>
          <button type="button" class="btn btn-sm" data-goto="budget">상세</button>
        </div>
        <div class="tfall-metrics">
          <div class="stat accent"><div class="label">합계</div><div class="value">${totalBudget.toLocaleString("ko-KR")}</div></div>
          <div class="stat"><div class="label">항목</div><div class="value">${items.length}</div></div>
        </div>
        <p class="tfall-subhead">영역별</p>
        <ul class="tfall-ratio-list">
          ${
            areaRows.length
              ? areaRows
                  .map(([name, amt]) => {
                    const pct = totalBudget ? Math.round((amt / totalBudget) * 100) : 0;
                    return `<li>
                      <div class="tfall-ratio-head"><strong>${escapeHtml(name)}</strong><span>${pct}% · ${amt.toLocaleString("ko-KR")}</span></div>
                      <div class="kpi-sim-bar"><i style="width:${pct}%"></i></div>
                    </li>`;
                  })
                  .join("")
              : `<li class="muted">예산 항목이 없습니다.</li>`
          }
        </ul>
        <p class="tfall-subhead">비목별</p>
        <ul class="tfall-ratio-list">
          ${
            expenseRows.length
              ? expenseRows
                  .map(([name, amt]) => {
                    const pct = totalBudget ? Math.round((amt / totalBudget) * 100) : 0;
                    return `<li>
                      <div class="tfall-ratio-head"><strong>${escapeHtml(name)}</strong><span>${pct}% · ${amt.toLocaleString("ko-KR")}</span></div>
                      <div class="kpi-sim-bar"><i style="width:${pct}%"></i></div>
                    </li>`;
                  })
                  .join("")
              : `<li class="muted">비목 데이터가 없습니다.</li>`
          }
        </ul>
      </section>

      <section class="panel">
        <div class="panel-head">
          <div>
            <h2 class="panel-title">3. 성과지표</h2>
            <p class="muted" style="margin:4px 0 0">핵심 ${coreN} · 자율 ${autoN} · 평균 달성 ${avgRate != null ? avgRate.toFixed(1) + "%" : "—"}</p>
          </div>
          <button type="button" class="btn btn-sm" data-goto="kpi">상세</button>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>구분</th><th>지표명</th><th>기준</th><th>목표</th><th>실적</th><th>달성</th></tr></thead>
            <tbody>
              ${
                kpis.length
                  ? kpis
                      .map(
                        (k) => `<tr>
                    <td><span class="kpi-scope-badge is-${escapeAttr(k.scope || "core")}">${escapeHtml(kpiScopeMeta(k.scope).label)}</span></td>
                    <td>${escapeHtml(k.name)}</td>
                    <td>${escapeHtml(String(k.baseline))}${escapeHtml(k.unit || "")}</td>
                    <td>${escapeHtml(String(k.target))}${escapeHtml(k.unit || "")}</td>
                    <td>${escapeHtml(String(k.actual))}${escapeHtml(k.unit || "")}</td>
                    <td>${k.rate != null ? k.rate.toFixed(1) + "%" : "—"}</td>
                  </tr>`
                      )
                      .join("")
                  : `<tr><td colspan="6" class="muted">등록된 성과지표가 없습니다.</td></tr>`
              }
            </tbody>
          </table>
        </div>
        <p class="muted" style="margin-top:10px;font-size:0.78rem">
          달성가능도: ${
            avgRate == null
              ? "실적 입력 후 판단"
              : avgRate >= 90
                ? "양호 — 목표 근접"
                : avgRate >= 70
                  ? "주의 — 추가 실적 필요"
                  : "위험 — 지표 밸런스·목표 재검토 권장"
          }
          ${coreN && autoN ? ` · 핵심/자율 밸런스 ${coreN}:${autoN}` : ""}
        </p>
      </section>
    </div>
  `;

  el.querySelectorAll("[data-goto]").forEach((btn) => {
    btn.addEventListener("click", () => setView(btn.dataset.goto));
  });
}

function renderAll() {
  $("#tfName").textContent = state.meta.tfName || "TF Pulse";
  applyRoleUi();
  updateAlarmButtons();
  renderView(activeViewName || "dashboard");
  renderSubNav(activeNavId || "home", activeViewName || "dashboard");
}

function openMetaModal() {
  if (!isAdmin()) return;
  openModal({
    title: "보고서 기본정보",
    bodyHtml: `
      <div class="form-grid">
        <label class="field">TF 명칭
          <input name="tfName" required value="${escapeAttr(state.meta.tfName || "")}" />
        </label>
        <label class="field">보고서 제목
          <input name="reportTitle" required value="${escapeAttr(state.meta.reportTitle || "")}" />
        </label>
        <label class="field">목표 총 페이지
          <input name="totalTargetPages" type="number" min="1" required value="${state.meta.totalTargetPages || 80}" />
        </label>
      </div>
    `,
    onSubmit: (fd) => {
      state.meta.tfName = fd.get("tfName").trim();
      state.meta.reportTitle = fd.get("reportTitle").trim();
      state.meta.totalTargetPages = Number(fd.get("totalTargetPages")) || 0;
      saveAndRender("parts");
      $("#tfName").textContent = state.meta.tfName;
      return true;
    },
  });
}

/* ---------- Modals ---------- */

function openModal({ title, kicker = "입력", submitLabel = "저장", bodyHtml, onSubmit, hideFooter = false }) {
  const dialog = $("#modal");
  const kickerEl = $("#modalKicker");
  if (kickerEl) kickerEl.textContent = kicker;
  $("#modalTitle").textContent = title;
  $("#modalBody").innerHTML = bodyHtml;
  modalHandler = onSubmit;
  const submitBtn = $("#modalSubmit");
  if (submitBtn) {
    submitBtn.textContent = submitLabel;
    submitBtn.classList.remove("btn-ghost");
  }
  const foot = dialog.querySelector(".modal-foot");
  if (foot) foot.hidden = Boolean(hideFooter);
  dialog.classList.toggle("is-comment-modal", Boolean(hideFooter));
  dialog.showModal();
}

function closeModal() {
  $("#modal").close();
  modalHandler = null;
  const dialog = $("#modal");
  if (dialog) {
    dialog.classList.remove("is-comment-modal");
    const foot = dialog.querySelector(".modal-foot");
    if (foot) foot.hidden = false;
  }
}

function openPartModal(id) {
  if (!isAdmin()) return;
  const part = id ? partById(id) : null;
  openModal({
    title: part ? "파트 수정" : "파트 추가",
    bodyHtml: `
      <div class="form-grid two">
        <label class="field">구분(로마자 등)
          <input name="section" required value="${escapeAttr(part?.section || "")}" />
        </label>
        <label class="field">제목
          <input name="title" required value="${escapeAttr(part?.title || "")}" />
        </label>
        <label class="field">담당자
          <select name="assigneeId">
            <option value="">미지정</option>
            ${state.members
              .map(
                (m) =>
                  `<option value="${m.id}" ${part?.assigneeId === m.id ? "selected" : ""}>${escapeHtml(m.name)}</option>`
              )
              .join("")}
          </select>
        </label>
        <label class="field">비고
          <input name="note" value="${escapeAttr(part?.note || "")}" />
        </label>
        <label class="field">시작 페이지
          <input name="pageStart" type="number" min="1" required value="${part?.pageStart ?? 1}" />
        </label>
        <label class="field">끝 페이지
          <input name="pageEnd" type="number" min="1" required value="${part?.pageEnd ?? 1}" />
        </label>
      </div>
    `,
    onSubmit: (fd) => {
      const data = {
        section: fd.get("section").trim(),
        title: fd.get("title").trim(),
        assigneeId: fd.get("assigneeId"),
        note: fd.get("note").trim(),
        pageStart: Number(fd.get("pageStart")),
        pageEnd: Number(fd.get("pageEnd")),
      };
      if (data.pageEnd < data.pageStart) {
        alert("끝 페이지는 시작 페이지 이상이어야 합니다.");
        return false;
      }
      if (part) Object.assign(part, data);
      else {
        const newId = uid("p");
        state.parts.push({ id: newId, ...data });
        state.collections.forEach((c) => {
          c.submissions.push({
            partId: newId,
            pageCount: 0,
            status: "pending",
            submittedAt: "",
            memo: "",
            checkImages: [],
            checkFiles: [],
            partDone: false,
          });
        });
      }
      saveAndRender("parts");
      return true;
    },
  });
}

function openRoundModal(round) {
  const col = state.collections.find((c) => c.round === round);
  if (!col) return;
  openModal({
    title: "취합 차수 정보",
    bodyHtml: `
      <div class="form-grid">
        <label class="field">이름
          <input name="name" required value="${escapeAttr(col.name)}" />
        </label>
        <label class="field">마감일
          <input name="dueDate" type="date" value="${escapeAttr(col.dueDate || "")}" />
        </label>
        <label class="field">설명
          <input name="description" value="${escapeAttr(col.description || "")}" />
        </label>
      </div>
    `,
    onSubmit: (fd) => {
      col.name = fd.get("name").trim();
      col.dueDate = fd.get("dueDate");
      col.description = fd.get("description").trim();
      saveAndRender("collections");
      return true;
    },
  });
}

function openScheduleModal(id) {
  const item = id ? state.schedule.find((s) => s.id === id) : null;
  if (item && !canEditScheduleItem(item)) {
    denySchedulePermission();
    return;
  }
  if (!item && !isAdmin()) {
    denySchedulePermission("보고서 업무 추가는 관리자만 가능합니다.");
    return;
  }
  const canDelete = Boolean(item) && canEditScheduleItem(item);
  const members = scheduleOwnerOptions();
  const selectedAssignees = new Set(scheduleAssigneesOf(item));
  const noneSelected = selectedAssignees.size === 0;
  const allSelected = !noneSelected && members.length > 0 && members.every((m) => selectedAssignees.has(m.name));
  const currentType = normalizeScheduleType(item?.type || "meeting");
  const currentGroup = scheduleGroupOf(item || { type: currentType });
  const ownerName = item?.owner || item?.createdBy || currentUserName();
  const deptOpts = scheduleDeptOptions();
  const projectOpts = [
    ...new Set([state.meta?.tfName, state.meta?.reportTitle, ...SCHEDULE_PROJECT_OPTIONS].filter(Boolean)),
  ];
  const divisionOpts = [
    ...new Set([
      ...SCHEDULE_DIVISION_OPTIONS,
      ...(state.parts || []).map((p) => p.title).filter(Boolean),
      ...(state.members || []).map((m) => m.part).filter(Boolean),
    ]),
  ];
  const statusNow = item?.status || "준비";
  const dueThisYear = item?.endDate || item?.date || today();
  const dl = uid("sdl");

  openModal({
    kicker: item ? "업무 수정" : "새 일정",
    title: item ? "주요 업무를 수정합니다." : "업무일정을 입력합니다.",
    submitLabel: item ? "저장" : "일정 등록",
    bodyHtml: `
      <div class="wp-form schedule-form">
        <input type="hidden" name="guideId" id="schedGuideId" value="${escapeAttr(item?.guideId || "")}" />
        <label class="wp-field">
          <span class="wp-label">업무명</span>
          <input name="title" id="schedTitleInput" class="wp-input" required value="${escapeAttr(item?.title || "")}" placeholder="예: AID 예산 수정 및 담당자 지정" />
        </label>
        <label class="wp-field">
          <span class="wp-label">상위 그룹</span>
          <select name="workGroup" id="schedWorkGroup" class="wp-input wp-select" required>
            ${SCHEDULE_GROUP_OPTIONS.map(
              (g) =>
                `<option value="${escapeAttr(g.id)}" ${currentGroup === g.id ? "selected" : ""}>${escapeHtml(g.label)}</option>`
            ).join("")}
          </select>
        </label>
        <label class="wp-field" id="schedCollectRoundField" ${currentGroup === "collect" ? "" : "hidden"}>
          <span class="wp-label">연결 취합 차수</span>
          <select name="collectionRound" id="schedCollectRound" class="wp-input wp-select">
            <option value="">제목으로 자동 연결 (1차·2차·최종)</option>
            ${[...(state.collections || [])]
              .sort((a, b) => (Number(a.round) || 0) - (Number(b.round) || 0))
              .map((c) => {
                const selected =
                  Number(item?.collectionRound || collectScheduleRound(item || { title: item?.title, workGroup: "collect" }) || 0) ===
                  Number(c.round);
                return `<option value="${escapeAttr(String(c.round))}" ${selected ? "selected" : ""}>${escapeHtml(c.name)} · 마감 ${escapeHtml(c.dueDate || "-")}</option>`;
              })
              .join("")}
          </select>
          <span class="muted" style="display:block;margin-top:4px;font-size:var(--text-xs)">일정표에는 마감만 수립됩니다. 참여자 파일 업로드는 보고서 통합에서 해당 차수 <strong>제출 요청</strong>을 등록한 뒤에 열립니다.</span>
        </label>

        <div class="wp-grid-2">
          <label class="wp-field">
            <span class="wp-label">담당</span>
            <select name="owner" class="wp-input wp-select">
              ${members
                .map(
                  (m) =>
                    `<option value="${escapeAttr(m.name)}" ${ownerName === m.name ? "selected" : ""}>${escapeHtml(m.name)}</option>`
                )
                .join("")}
              ${
                ownerName && !members.some((m) => m.name === ownerName)
                  ? `<option value="${escapeAttr(ownerName)}" selected>${escapeHtml(ownerName)}</option>`
                  : ""
              }
            </select>
          </label>
          <label class="wp-field">
            <span class="wp-label">부서</span>
            <input name="dept" list="schedDept_${dl}" class="wp-input" value="${escapeAttr(item?.dept || "")}" placeholder="선택 또는 입력" />
          </label>
        </div>

        <div class="wp-grid-2">
          <label class="wp-field">
            <span class="wp-label">관련 사업</span>
            <input name="project" list="schedProject_${dl}" class="wp-input" value="${escapeAttr(
              item?.project || state.meta?.reportTitle || SCHEDULE_PROJECT_OPTIONS[0]
            )}" placeholder="관련 사업" />
          </label>
          <label class="wp-field">
            <span class="wp-label">상태</span>
            <select name="status" class="wp-input wp-select ${statusNow === "준비" ? "is-status-wait" : ""}">
              ${["준비", "진행", "완료"]
                .map((st) => `<option value="${st}" ${statusNow === st ? "selected" : ""}>${st}</option>`)
                .join("")}
            </select>
          </label>
        </div>

        <div class="wp-grid-2">
          <label class="wp-field">
            <span class="wp-label">업무구분</span>
            <select name="type" id="schedTypeSelect" class="wp-input wp-select" required>
              ${SCHEDULE_TYPE_OPTIONS.map(
                (t) =>
                  `<option value="${t.value}" ${currentType === t.value ? "selected" : ""}>${escapeHtml(t.label)}</option>`
              ).join("")}
            </select>
          </label>
          <label class="wp-field">
            <span class="wp-label">업무분장</span>
            <input name="division" id="schedDivisionInput" list="schedDivision_${dl}" class="wp-input" value="${escapeAttr(item?.division || "")}" placeholder="담당 영역" />
          </label>
        </div>

        <label class="wp-field">
          <span class="wp-label">올해 마감</span>
          <input name="endDate" id="schedEndDate" type="date" class="wp-input" required value="${escapeAttr(dueThisYear)}" />
        </label>

        <label class="wp-field">
          <span class="wp-label">담당자에게 보이는 요청 말풍선</span>
          <textarea name="askMessage" id="schedAskInput" rows="2" class="wp-input" placeholder="예: 관리자가 작성지침, 양식, 스타일 가이드 확인을 요청했어요!">${escapeHtml(item?.askMessage || "")}</textarea>
          <span class="muted" style="display:block;margin-top:4px;font-size:var(--text-xs)">비워 두면 업무 그룹·제목에 맞춰 자동으로 안내합니다. 요청받은 담당자의 내 업무에 말풍선으로 표시됩니다.</span>
        </label>
        <label class="wp-field">
          <span class="wp-label">관리 목표값</span>
          <textarea name="goal" id="schedGoalInput" rows="2" class="wp-input" placeholder="관리 목표값">${escapeHtml(item?.goal || item?.note || "")}</textarea>
        </label>
        <label class="wp-field">
          <span class="wp-label">준비사항 · 검토사항</span>
          <input name="prep" id="schedPrepInput" class="wp-input" value="${escapeAttr(item?.prep || "")}" placeholder="준비·검토 항목" />
        </label>
        <label class="wp-field">
          <span class="wp-label">서로 챙길 점</span>
          <textarea name="carePoints" id="schedCareInput" rows="2" class="wp-input" placeholder="서로 챙길 점">${escapeHtml(item?.carePoints || "")}</textarea>
        </label>

        <fieldset class="wp-field schedule-collab-field">
          <legend class="wp-label">협업 대상</legend>
          <div class="schedule-collab-pills" id="scheduleCollabPills">
            <button type="button" class="schedule-collab-pill ${noneSelected ? "is-on" : ""}" data-collab="none">미지정</button>
            <button type="button" class="schedule-collab-pill ${allSelected ? "is-on" : ""}" data-collab="all">ALL</button>
            ${members
              .map(
                (m) => `
              <button type="button" class="schedule-collab-pill ${
                !noneSelected && selectedAssignees.has(m.name) ? "is-on" : ""
              }" data-collab="${escapeAttr(m.name)}">${escapeHtml(m.name)}</button>`
              )
              .join("")}
          </div>
          <div id="scheduleCollabInputs" hidden>
            ${members
              .map(
                (m) =>
                  `<input type="checkbox" name="assignees" value="${escapeAttr(m.name)}" ${
                    !noneSelected && (selectedAssignees.has(m.name) || allSelected) ? "checked" : ""
                  } />`
              )
              .join("")}
          </div>
        </fieldset>

        <label class="wp-field">
          <span class="wp-label">연관 스프레드시트</span>
          <div class="schedule-url-wrap">
            <span class="schedule-url-prefix">https://</span>
            <input name="sheetUrl" class="wp-input" value="${escapeAttr((item?.sheetUrl || "").replace(/^https?:\/\//i, ""))}" placeholder="docs.google.com/spreadsheets/..." />
          </div>
        </label>
        <label class="wp-field">
          <span class="wp-label">구글드라이브 링크</span>
          <input name="driveUrl" class="wp-input" type="url" value="${escapeAttr(item?.driveUrl || "")}" placeholder="https://drive.google.com/..." />
        </label>

        <div class="wp-field">
          <span class="wp-label">연결 문서</span>
          <p class="muted wp-form-hint">드라이브에 올린 지침·서식·스타일가이드를 골라 붙이면 담당자가 할 일에서 바로 열람합니다.</p>
          ${driveDocPickerHtml(scheduleLinkedIds(item))}
        </div>

        ${scheduleFormUploadSectionHtml(item)}

        ${datalistOptions(`schedDept_${dl}`, deptOpts)}
        ${datalistOptions(`schedProject_${dl}`, projectOpts)}
        ${datalistOptions(`schedDivision_${dl}`, divisionOpts)}

        ${
          canDelete
            ? `<button type="button" class="btn btn-danger btn-sm" id="scheduleModalDelete">이 일정 삭제</button>`
            : ""
        }
      </div>
    `,
    onSubmit: async (fd) => {
      const assignees = [...new Set(fd.getAll("assignees").map((v) => String(v).trim()).filter(Boolean))];
      const endDate = fd.get("endDate") || today();
      const sheetRaw = (fd.get("sheetUrl") || "").toString().trim();
      const sheetUrl = sheetRaw
        ? /^https?:\/\//i.test(sheetRaw)
          ? sheetRaw
          : `https://${sheetRaw}`
        : "";
      const owner = (fd.get("owner") || "").toString().trim() || currentUserName();
      const goal = (fd.get("goal") || "").toString().trim();
      const workGroup = scheduleGroupOf({ workGroup: fd.get("workGroup"), title: fd.get("title"), type: fd.get("type") });
      let sharedFiles =
        item?.sharedFiles && typeof item.sharedFiles === "object" ? { ...item.sharedFiles } : {};

      if (workGroup === "forms" && isAdmin()) {
        for (const cat of SCHEDULE_FORM_UPLOAD_CATS) {
          const file = fd.get(`sharedFile_${cat.id}`);
          if (!file || !(file instanceof File) || file.size <= 0) continue;
          if (file.size > RESOURCE_FILE_MAX_BYTES) {
            alert(`${cat.label} 파일은 30MB 이하로 올려 주세요.`);
            return false;
          }
          sharedFiles[cat.id] = {
            fileName: file.name,
            dataUrl: await readFileAsDataUrl(file),
            uploadedAt: today(),
          };
        }
      }

      const data = {
        title: fd.get("title").trim(),
        owner,
        createdBy: owner,
        workGroup,
        guideId: (fd.get("guideId") || item?.guideId || "").toString().trim(),
        dept: (fd.get("dept") || "").toString().trim(),
        project: (fd.get("project") || "").toString().trim(),
        status: fd.get("status") || "준비",
        type: normalizeScheduleType(fd.get("type")),
        division: (fd.get("division") || "").toString().trim(),
        date: endDate,
        endDate,
        goal,
        note: goal,
        askMessage: (fd.get("askMessage") || "").toString().trim(),
        prep: (fd.get("prep") || "").toString().trim(),
        carePoints: (fd.get("carePoints") || "").toString().trim(),
        collectionRound: workGroup === "collect" ? Number(fd.get("collectionRound") || collectScheduleRound({ title: fd.get("title"), workGroup }) || 0) || "" : "",
        assignees,
        sheetUrl,
        driveUrl: (fd.get("driveUrl") || "").toString().trim(),
        linkedResourceIds: fd.getAll("linkedResources").map((v) => String(v).trim()).filter(Boolean),
        sharedFiles,
      };
      if (item) Object.assign(item, data);
      else state.schedule.push({ id: uid("s"), ...data });
      const saved = item || state.schedule[state.schedule.length - 1];
      if (workGroup === "forms" && isAdmin()) syncScheduleUploadsToResources(saved, sharedFiles);
      persist();
      refreshActiveScheduleSurface();
      return true;
    },
  });

  const syncCollabInputs = () => {
    const pills = $$("#scheduleCollabPills [data-collab]");
    const noneOn = pills.find((p) => p.dataset.collab === "none")?.classList.contains("is-on");
    const allOn = pills.find((p) => p.dataset.collab === "all")?.classList.contains("is-on");
    const selected = new Set(
      pills.filter((p) => p.dataset.collab !== "none" && p.dataset.collab !== "all" && p.classList.contains("is-on")).map((p) => p.dataset.collab)
    );
    $$("[name='assignees']", $("#modalBody") || document).forEach((box) => {
      box.checked = !noneOn && (allOn || selected.has(box.value));
    });
  };

  $("#scheduleCollabPills")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-collab]");
    if (!btn) return;
    e.preventDefault();
    const key = btn.dataset.collab;
    const pills = $$("#scheduleCollabPills [data-collab]");
    const noneBtn = pills.find((p) => p.dataset.collab === "none");
    const allBtn = pills.find((p) => p.dataset.collab === "all");
    const personBtns = pills.filter((p) => p.dataset.collab !== "none" && p.dataset.collab !== "all");

    if (key === "none") {
      pills.forEach((p) => p.classList.toggle("is-on", p === noneBtn));
    } else if (key === "all") {
      const turnOn = !allBtn.classList.contains("is-on");
      noneBtn?.classList.remove("is-on");
      allBtn?.classList.toggle("is-on", turnOn);
      personBtns.forEach((p) => p.classList.toggle("is-on", turnOn));
      if (!turnOn) noneBtn?.classList.add("is-on");
    } else {
      noneBtn?.classList.remove("is-on");
      allBtn?.classList.remove("is-on");
      btn.classList.toggle("is-on");
      const any = personBtns.some((p) => p.classList.contains("is-on"));
      if (!any) noneBtn?.classList.add("is-on");
      else if (personBtns.every((p) => p.classList.contains("is-on"))) allBtn?.classList.add("is-on");
    }
    syncCollabInputs();
  });
  syncCollabInputs();

  bindScheduleFormUploadSection(currentGroup);
  bindDriveDocPicker($("#modalBody") || document);

  $("#scheduleModalDelete")?.addEventListener("click", () => {
    if (!item || !confirm("삭제하시겠습니까?")) return;
    state.schedule = state.schedule.filter((s) => s.id !== item.id);
    closeModal();
    persist();
    refreshActiveScheduleSurface();
  });
}

function openDriveModal(id) {
  if (!isAdmin()) return;
  const item = id ? state.driveLinks.find((d) => d.id === id) : null;
  openModal({
    title: item ? "드라이브 링크 수정" : "드라이브 링크 등록",
    bodyHtml: `
      <div class="form-grid">
        <label class="field">제목
          <input name="title" required value="${escapeAttr(item?.title || "")}" />
        </label>
        <label class="field">URL
          <input name="url" type="url" required placeholder="https://drive.google.com/..." value="${escapeAttr(item?.url || "")}" />
        </label>
        <label class="field">분류
          <input name="category" value="${escapeAttr(item?.category || "공유폴더")}" />
        </label>
        <label class="field">비고
          <input name="note" value="${escapeAttr(item?.note || "")}" />
        </label>
      </div>
    `,
    onSubmit: (fd) => {
      const data = {
        title: fd.get("title").trim(),
        url: fd.get("url").trim(),
        category: fd.get("category").trim(),
        note: fd.get("note").trim(),
      };
      if (item) Object.assign(item, data);
      else state.driveLinks.push({ id: uid("d"), ...data });
      saveAndRender("drive");
      return true;
    },
  });
}

function openResourceModal(id) {
  if (!isAdmin()) return;
  const item = id ? state.resources.find((r) => r.id === id) : null;
  openModal({
    title: item ? "자료를 수정합니다." : "지침·서식·스타일가이드를 올립니다.",
    bodyHtml: `
      <div class="form-grid two">
        <label class="field full">제목
          <input name="title" required value="${escapeAttr(item?.title || "")}" />
        </label>
        <label class="field">분류
          <select name="category">
            ${["지침", "서식", "집행기준", "스타일", "기타"]
              .map(
                (c) =>
                  `<option value="${c}" ${item?.category === c ? "selected" : ""}>${c}</option>`
              )
              .join("")}
          </select>
        </label>
        <label class="field full">파일 업로드
          <input type="file" name="file" />
          ${
            item?.dataUrl || item?.url
              ? `<span class="muted" style="display:block;margin-top:4px">등록된 파일: ${escapeHtml(item.fileName || "첨부됨")} · 참여자 다운로드 링크 자동 생성됨</span>`
              : ""
          }
          <span class="muted" style="display:block;margin-top:4px">파일만 올리면 됩니다. 제목·파일명·다운로드 링크는 자동으로 채워집니다. (최대 30MB)</span>
        </label>
        <label class="field full">비고
          <input name="note" value="${escapeAttr(item?.note || "")}" />
        </label>
        <details class="field full">
          <summary class="muted" style="cursor:pointer">외부 링크로 등록 (선택 · 구글드라이브 등)</summary>
          <label class="field full" style="margin-top:8px">링크
            <input name="url" type="url" value="${escapeAttr(item?.url && !String(item.url).startsWith("data:") ? item.url : "")}" placeholder="https://drive.google.com/file/d/..." />
          </label>
          <label class="field full">파일명(표시용)
            <input name="fileName" value="${escapeAttr(item?.fileName || "")}" placeholder="예: 교육부_보고서작성지침.pdf" />
          </label>
        </details>
      </div>
    `,
    onSubmit: async (fd) => {
      const file = fd.get("file");
      let dataUrl = item?.dataUrl || "";
      let fileName = fd.get("fileName").trim();
      let title = fd.get("title").trim();
      let url = fd.get("url").trim();

      if (file && file instanceof File && file.size > 0) {
        if (file.size > RESOURCE_FILE_MAX_BYTES) {
          alert("파일은 30MB 이하로 올려 주세요.");
          return false;
        }
        dataUrl = await readFileAsDataUrl(file);
        if (!fileName) fileName = file.name;
        if (!title) title = file.name.replace(/\.[^.]+$/, "");
      }

      if (!dataUrl && !url && !(item?.dataUrl || item?.url)) {
        alert("파일을 선택해 주세요. (외부 링크만 쓸 경우 아래 「외부 링크로 등록」을 펼쳐 입력)");
        return false;
      }

      if (!dataUrl) dataUrl = item?.dataUrl || "";
      if (!url) url = item?.url && !String(item.url).startsWith("data:") ? item.url : "";

      if (dataUrl) url = dataUrl;
      else if (url && !fileName) fileName = title || "download";

      const data = normalizeResourceEntry({
        title: title || fileName.replace(/\.[^.]+$/, "") || "공통 자료",
        category: fd.get("category"),
        fileName,
        url,
        note: fd.get("note").trim(),
        uploadedAt: item?.uploadedAt || today(),
        dataUrl,
      });
      if (item) Object.assign(item, data);
      else state.resources.push({ id: uid("r"), ...data });
      saveAndRender("drive");
      return true;
    },
  });
  window.setTimeout(bindResourceFileAutofill, 0);
}

function openMemberModal(id) {
  if (!isAdmin()) return;
  const item = id ? memberById(id) : null;
  openModal({
    title: item ? "구성원 수정" : "구성원 추가",
    bodyHtml: `
      <div class="form-grid two">
        <label class="field">이름
          <input name="name" required value="${escapeAttr(item?.name || "")}" />
        </label>
        <label class="field">역할
          <select name="role">
            <option value="member" ${!item || item.role === "member" ? "selected" : ""}>대상자(사업담당)</option>
            <option value="food" ${item?.role === "food" ? "selected" : ""}>식사담당</option>
            <option value="budget" ${item?.role === "budget" ? "selected" : ""}>예산담당자</option>
            <option value="kpi" ${item?.role === "kpi" ? "selected" : ""}>성과지표담당자</option>
            <option value="admin" ${item?.role === "admin" ? "selected" : ""}>관리자</option>
          </select>
        </label>
        <label class="field">담당 파트
          <input name="part" value="${escapeAttr(item?.part || "")}" />
        </label>
        <label class="field">연락처
          <input name="contact" value="${escapeAttr(item?.contact || "")}" />
        </label>
      </div>
    `,
    onSubmit: (fd) => {
      const data = {
        name: fd.get("name").trim(),
        role: fd.get("role"),
        part: fd.get("part").trim(),
        contact: fd.get("contact").trim(),
      };
      if (item) Object.assign(item, data);
      else state.members.push({ id: uid("m"), ...data });
      saveAndRender("members");
      return true;
    },
  });
}

function openBudgetTotalModal() {
  if (!canManageBudget()) return;
  ensureBudget();
  openModal({
    kicker: "총예산",
    title: "사업비 총액을 설정합니다.",
    submitLabel: "저장",
    bodyHtml: `
      <div class="wp-form">
        <label class="wp-field">
          <span class="wp-label">총예산 (원)</span>
          <input name="total" type="number" min="0" step="1000" required class="wp-input wp-amount" value="${state.budget.total}" />
        </label>
        <label class="wp-field">
          <span class="wp-label">비고</span>
          <input name="note" class="wp-input" value="${escapeAttr(state.budget.note || "")}" placeholder="예: 보고서 TF 운영비" />
        </label>
      </div>
    `,
    onSubmit: (fd) => {
      state.budget.total = Number(fd.get("total")) || 0;
      state.budget.note = fd.get("note").trim();
      saveAndRender("budget");
      return true;
    },
  });
}

function budgetFormFieldsHtml(item, { includeAssignee = false, fullEdit = true, mode = "both", memberCompose = false } = {}) {
  const suffix = uid("dl");
  const readOnly = !fullEdit;
  const ro = readOnly ? "readonly" : "";
  const showPlan = true;
  const showResult = mode === "both" || mode === "result";
  const lockPlan = mode === "result";
  const lockMeta = mode === "result" && !includeAssignee;
  const planAmountRo = lockPlan || readOnly ? "readonly" : "";
  const planCalcRo = lockPlan ? "readonly" : "";
  const metaFieldsRo = lockMeta ? "readonly" : ro;
  const metaRequired = fullEdit && !lockMeta;
  const expense = item?.expenseType || "";
  const expenseChips = BUDGET_CATALOG.expenseTypes
    .map(
      (name) =>
        `<button type="button" class="wp-chip ${expense === name ? "is-on" : ""}" data-expense-chip="${escapeAttr(name)}">${escapeHtml(name)}</button>`
    )
    .join("");

  if (memberCompose) {
    return `
      <div class="wp-form">
        <label class="wp-field">
          <span class="wp-label">세부프로그램</span>
          <input name="activity" class="wp-input" required value="${escapeAttr(item?.activity || item?.title || "")}" placeholder="예: AI 교수법 워크숍 운영" />
        </label>
        <label class="wp-field">
          <span class="wp-label">비목</span>
          <input name="expenseType" id="budgetExpenseInput_${suffix}" list="budgetExpense_${suffix}" class="wp-input" required value="${escapeAttr(expense)}" placeholder="선택 또는 직접 입력" />
          <div class="wp-chips" data-expense-chips>${expenseChips}</div>
        </label>
        ${
          showPlan
            ? `<label class="wp-field">
          <span class="wp-label">편성금액 (원)</span>
          <input name="planned" type="number" min="0" step="1000" class="wp-input wp-amount" required value="${item?.planned ?? 0}" />
        </label>
        <label class="wp-field">
          <span class="wp-label">세부 산출내역</span>
          <textarea name="calcText" rows="4" class="wp-input" placeholder="예: 강사료 000원 × N회 + 회의비 ...">${escapeHtml(item?.calcText || "")}</textarea>
        </label>`
            : ""
        }
        ${
          showResult
            ? `<label class="wp-field">
          <span class="wp-label">실적금액 (원)</span>
          <input name="spent" type="number" min="0" step="1000" class="wp-input wp-amount" value="${item?.spent ?? 0}" />
        </label>
        <label class="wp-field">
          <span class="wp-label">실적 산출내역</span>
          <textarea name="actualCalcText" rows="4" class="wp-input" placeholder="예: 실제 집행액·정산 내역 ...">${escapeHtml(item?.actualCalcText || "")}</textarea>
        </label>`
            : ""
        }
        <label class="wp-field">
          <span class="wp-label">메모</span>
          <textarea name="note" rows="2" class="wp-input" placeholder="참고 메모">${escapeHtml(item?.note || "")}</textarea>
        </label>
        <input type="hidden" name="area" value="${escapeAttr(item?.area || "")}" />
        <input type="hidden" name="no" value="${escapeAttr(item?.no || "")}" />
        <input type="hidden" name="content" value="${escapeAttr(item?.content || "")}" />
        <input type="hidden" name="task" value="${escapeAttr(item?.task || "")}" />
        <input type="hidden" name="dept" value="${escapeAttr(item?.dept || "")}" />
        <input type="hidden" name="workDept" value="${escapeAttr(item?.workDept || "")}" />
      </div>
      ${datalistOptions(`budgetExpense_${suffix}`, BUDGET_CATALOG.expenseTypes)}
    `;
  }

  return `
      <div class="wp-form">
        <label class="wp-field">
          <span class="wp-label">세부프로그램</span>
          <input name="activity" class="wp-input" ${metaRequired ? "required" : "readonly"} value="${escapeAttr(item?.activity || item?.title || "")}" placeholder="예: AI 교수법 워크숍 운영" />
        </label>

        <label class="wp-field">
          <span class="wp-label">비목</span>
          <input name="expenseType" id="budgetExpenseInput_${suffix}" list="budgetExpense_${suffix}" class="wp-input" ${lockMeta ? "readonly" : "required"} value="${escapeAttr(expense)}" placeholder="선택 또는 직접 입력" />
          ${lockMeta ? "" : `<div class="wp-chips" data-expense-chips>${expenseChips}</div>`}
        </label>

        <div class="wp-grid-2">
          <label class="wp-field">
            <span class="wp-label">영역</span>
            <input name="area" list="budgetAreas_${suffix}" class="wp-input" ${metaRequired ? "required" : "readonly"} value="${escapeAttr(item?.area || "")}" placeholder="예: 2. 고등직업교육" />
          </label>
          <label class="wp-field">
            <span class="wp-label">연번</span>
            <input name="no" class="wp-input" ${metaFieldsRo} value="${escapeAttr(item?.no || "")}" placeholder="예: 14" />
          </label>
        </div>

        <label class="wp-field">
          <span class="wp-label">세부내용명</span>
          <input name="content" list="budgetContents_${suffix}" class="wp-input" ${metaFieldsRo} value="${escapeAttr(item?.content || "")}" />
        </label>

        <label class="wp-field">
          <span class="wp-label">세부과제명</span>
          <input name="task" class="wp-input" ${metaFieldsRo} value="${escapeAttr(item?.task || "")}" />
        </label>

        <div class="wp-grid-2">
          <label class="wp-field">
            <span class="wp-label">담당부서</span>
            <input name="dept" list="budgetDepts_${suffix}" class="wp-input" ${metaFieldsRo} value="${escapeAttr(item?.dept || "")}" />
          </label>
          <label class="wp-field">
            <span class="wp-label">실무부서</span>
            <input name="workDept" list="budgetWorkDepts_${suffix}" class="wp-input" ${metaFieldsRo} value="${escapeAttr(item?.workDept || "")}" />
          </label>
        </div>

        ${
          includeAssignee
            ? `<label class="wp-field">
            <span class="wp-label">입력담당자</span>
            <select name="assigneeId" class="wp-input wp-select">
              <option value="">미지정</option>
              ${inputAssignees()
                .map(
                  (m) =>
                    `<option value="${m.id}" ${item?.assigneeId === m.id ? "selected" : ""}>${escapeHtml(m.name)}</option>`
                )
                .join("")}
            </select>
          </label>`
            : ""
        }

        ${
          showPlan
            ? `<div class="wp-grid-2">
          <label class="wp-field">
            <span class="wp-label">편성금액 (원)</span>
            <input name="planned" type="number" min="0" step="1000" class="wp-input wp-amount" ${planAmountRo || (fullEdit ? "required" : "readonly")} value="${item?.planned ?? 0}" />
          </label>
          <label class="wp-field wp-check-inline">
            <span class="wp-label">상태</span>
            <span class="wp-status-pill ${(item?.calcText || "").trim() ? "is-ok" : "is-wait"}">${(item?.calcText || "").trim() ? "산출 완료" : "입력 대기"}</span>
          </label>
        </div>
        <label class="wp-field">
          <span class="wp-label">세부 산출내역 · 운영계획</span>
          <textarea name="calcText" rows="4" class="wp-input" ${planCalcRo} placeholder="예: 강사료 000원 × N회 + 회의비 ...">${escapeHtml(item?.calcText || "")}</textarea>
        </label>`
            : ""
        }

        ${
          showResult
            ? `<label class="wp-field">
            <span class="wp-label">실적금액 (원)</span>
            <input name="spent" type="number" min="0" step="1000" class="wp-input wp-amount" value="${item?.spent ?? 0}" />
          </label>
          <label class="wp-field">
            <span class="wp-label">실적 산출내역 · 결과보고</span>
            <textarea name="actualCalcText" rows="4" class="wp-input" placeholder="예: 실제 집행액·정산 내역 ...">${escapeHtml(item?.actualCalcText || "")}</textarea>
          </label>`
            : ""
        }

        <label class="wp-field">
          <span class="wp-label">메모</span>
          <textarea name="note" rows="2" class="wp-input" placeholder="참고 메모">${escapeHtml(item?.note || "")}</textarea>
        </label>
      </div>
      ${datalistOptions(`budgetAreas_${suffix}`, BUDGET_CATALOG.areas)}
      ${datalistOptions(`budgetContents_${suffix}`, BUDGET_CATALOG.contents)}
      ${datalistOptions(`budgetDepts_${suffix}`, BUDGET_CATALOG.depts)}
      ${datalistOptions(`budgetWorkDepts_${suffix}`, BUDGET_CATALOG.workDepts)}
      ${datalistOptions(`budgetExpense_${suffix}`, BUDGET_CATALOG.expenseTypes)}
  `;
}

function readBudgetItemFields(fd, prev = {}, { mode = "both" } = {}) {
  const activity = (fd.get("activity") || "").toString().trim();
  const area = (fd.get("area") || "").toString().trim();
  const next = {
    ...prev,
    no: (fd.get("no") || "").toString().trim(),
    area,
    content: (fd.get("content") || "").toString().trim(),
    task: (fd.get("task") || "").toString().trim(),
    activity,
    dept: (fd.get("dept") || "").toString().trim(),
    workDept: (fd.get("workDept") || "").toString().trim(),
    note: (fd.get("note") || "").toString().trim(),
    expenseType: (fd.get("expenseType") || "").toString().trim(),
    assigneeId: fd.has("assigneeId") ? fd.get("assigneeId") || "" : prev.assigneeId || "",
    partId: prev.partId || "",
    createdById: prev.createdById || "",
    status: prev.status || "",
    submittedAt: prev.submittedAt || "",
    submittedBy: prev.submittedBy || "",
    areaOrder: prev.areaOrder || 0,
    id: prev.id,
  };
  if (mode === "both" || mode === "plan") {
    next.planned = Number(fd.get("planned")) || 0;
    next.calcText = (fd.get("calcText") || "").toString().trim();
  } else {
    next.planned = Number(prev.planned) || 0;
    next.calcText = (prev.calcText || "").trim();
  }
  if (mode === "both" || mode === "result") {
    next.spent = Number(fd.get("spent")) || 0;
    next.actualCalcText = (fd.get("actualCalcText") || "").toString().trim();
  } else {
    next.spent = Number(prev.spent) || 0;
    next.actualCalcText = (prev.actualCalcText || "").trim();
  }
  return normalizeBudgetItem(next);
}

function bindBudgetFormChips(root = document) {
  const input = root.querySelector("[name='expenseType']");
  root.querySelectorAll("[data-expense-chip]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!input || input.readOnly) return;
      input.value = btn.dataset.expenseChip || "";
      root.querySelectorAll("[data-expense-chip]").forEach((b) => {
        b.classList.toggle("is-on", b === btn);
      });
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
  });
  input?.addEventListener("input", () => {
    const v = input.value.trim();
    root.querySelectorAll("[data-expense-chip]").forEach((b) => {
      b.classList.toggle("is-on", b.dataset.expenseChip === v);
    });
  });
}

function openBudgetItemModal(id) {
  if (!canManageBudget()) return;
  ensureBudget();
  const item = id ? state.budget.items.find((i) => i.id === id) : null;
  const prevAssignee = item?.assigneeId || "";
  const modeMeta = budgetModeMeta();
  openModal({
    kicker: item ? "예산 수정" : "새 예산",
    title: item ? "예산 항목을 수정합니다." : "예산 항목을 입력합니다.",
    submitLabel: item ? "저장" : "항목 등록",
    bodyHtml: `
      ${budgetFormFieldsHtml(item, { includeAssignee: true, fullEdit: true, mode: "both" })}
      <p class="muted wp-form-hint">입력담당자를 지정하면 「${escapeHtml(modeMeta.requestTitle)}」 요청이 자동 발송됩니다.</p>
      ${
        item
          ? `<div class="budget-modal-extra">
              <button type="button" class="btn btn-sm" id="budgetAskInModal">입력 요청</button>
              <button type="button" class="btn btn-sm btn-danger" id="budgetDeleteInModal">삭제</button>
            </div>`
          : ""
      }
    `,
    onSubmit: (fd) => {
      const data = readBudgetItemFields(fd, item || {}, { mode: "both" });
      if (!data.activity) {
        alert("세부프로그램을 입력해 주세요.");
        return false;
      }
      const nextAssignee = data.assigneeId || "";
      if (item) Object.assign(item, data);
      else {
        data.id = uid("b");
        state.budget.items.push(data);
      }
      const target = item || data;
      if (nextAssignee && nextAssignee !== prevAssignee) {
        sendBudgetInputRequest(target.id, { silent: true });
        persist();
        updateRequestPlane();
      }
      saveAndRender("budget");
      if (nextAssignee && nextAssignee !== prevAssignee) {
        const m = memberById(nextAssignee);
        if (m) alert(`${m.name}님에게 「${modeMeta.requestTitle}」 요청을 보냈습니다.`);
      }
      return true;
    },
  });
  bindBudgetFormChips($("#modalBody"));
  $("#budgetAskInModal")?.addEventListener("click", (e) => {
    e.preventDefault();
    if (!item) return;
    sendBudgetInputRequest(item.id);
  });
  $("#budgetDeleteInModal")?.addEventListener("click", (e) => {
    e.preventDefault();
    if (!item || !canManageBudget()) return;
    if (!confirm("이 예산 항목을 삭제할까요?")) return;
    state.budget.items = state.budget.items.filter((i) => i.id !== item.id);
    state.budget.details = (state.budget.details || []).filter((d) => d.itemId !== item.id);
    closeModal();
    saveAndRender("budget");
  });
}

function openBudgetEntryModal(itemId) {
  ensureBudget();
  const item = state.budget.items.find((i) => i.id === itemId);
  if (!item || !canEditBudgetItem(item)) return;
  const keepAssignee = item.assigneeId || "";
  const mode = getBudgetInputMode();
  const meta = budgetModeMeta(mode);
  const submitted = isBudgetSubmitted(item);
  openModal({
    kicker: `${meta.short} 입력`,
    title: submitted ? "제출한 예산을 수정합니다." : "입력한 뒤 제출하면 예산담당자에게 모입니다.",
    submitLabel: "제출",
    bodyHtml: `
      <p class="muted wp-form-hint">${escapeHtml(meta.entryHint || "프로그램·금액·산출근거를 입력하세요.")}</p>
      ${budgetFormFieldsHtml(item, {
        includeAssignee: false,
        fullEdit: true,
        mode,
        memberCompose: true,
      })}
    `,
    onSubmit: (fd) => {
      const data = readBudgetItemFields(fd, item, { mode });
      if (!canManageBudget()) data.assigneeId = keepAssignee || currentMember()?.id || "";
      markBudgetSubmitted(data);
      Object.assign(item, data, { id: item.id });
      saveAndRender("budget");
      return true;
    },
  });
  bindBudgetFormChips($("#modalBody"));
}

function openBudgetBulkUploadModal() {
  if (!isAdmin()) return;
  ensureBudget();
  const modeMeta = budgetModeMeta();
  openModal({
    kicker: "일괄 업로드",
    title: "예산 항목을 일괄 등록합니다.",
    submitLabel: "업로드",
    bodyHtml: `
      <p class="muted wp-form-hint">CSV 한 줄에 한 항목 (권장):<br>
      <code>연번,영역,세부내용명,세부과제명,세부프로그램,담당부서,실무부서,편성금액,세부산출내역,실적금액,실적산출내역,입력담당자,메모</code></p>
      <p class="muted">기존 11열 형식(실적 열 없음)도 그대로 받을 수 있습니다. 입력담당자는 대상자 이름. 헤더 행은 자동 건너뜁니다.</p>
      <div class="wp-form">
        <label class="wp-field">
          <span class="wp-label">CSV 내용</span>
          <textarea name="csv" rows="10" class="wp-input" placeholder="14,2. 고등직업교육,가. 핵심역량...,1) ...,가) ...,교무처,교육혁신본부,9483680,,,0,,김남인,"></textarea>
        </label>
        <label class="alt-submit-check">
          <input type="checkbox" name="replaceAll" />
          <span>기존 예산 항목을 모두 지우고 새로 업로드</span>
        </label>
        <label class="alt-submit-check">
          <input type="checkbox" name="notifyAssignees" checked />
          <span>새로 지정된 담당자에게 「${escapeHtml(modeMeta.requestTitle)}」 요청 보내기</span>
        </label>
      </div>
    `,
    onSubmit: (fd) => {
      const raw = (fd.get("csv") || "").toString().trim();
      if (!raw) {
        alert("CSV 내용을 입력해 주세요.");
        return false;
      }
      const replaceAll = Boolean(fd.get("replaceAll"));
      const notifyAssignees = Boolean(fd.get("notifyAssignees"));
      const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      const parsed = [];
      const notifyIds = [];
      const toNum = (v) => Number(String(v ?? "").replace(/[^\d.-]/g, "")) || 0;
      for (const line of lines) {
        if (/^연번\s*,/.test(line) || /^영역\s*,/.test(line)) continue;
        const cols = line.split(",").map((c) => c.trim());
        if (cols.length < 8) {
          alert(`형식 오류(열 부족): ${line}`);
          return false;
        }
        const [no, area, content, task, activity, dept, workDept, plannedStr] = cols;
        let calcText = "";
        let spent = 0;
        let actualCalcText = "";
        let assigneeName = "";
        let note = "";
        if (cols.length >= 13) {
          calcText = cols[8] || "";
          spent = toNum(cols[9]);
          actualCalcText = cols[10] || "";
          assigneeName = cols[11] || "";
          note = cols[12] || "";
        } else {
          calcText = cols[8] || "";
          assigneeName = cols[9] || "";
          note = cols[10] || "";
        }
        const assignee = assigneeName ? memberByName(assigneeName) : null;
        const row = normalizeBudgetItem({
          id: uid("b"),
          no,
          area,
          content,
          task,
          activity: activity || "항목",
          dept,
          workDept,
          planned: toNum(plannedStr),
          calcText,
          spent,
          actualCalcText,
          note,
          assigneeId: assignee?.id || "",
        });
        parsed.push(row);
        if (notifyAssignees && row.assigneeId) notifyIds.push(row.id);
      }
      if (!parsed.length) {
        alert("업로드할 항목이 없습니다.");
        return false;
      }
      if (replaceAll) {
        state.budget.items = parsed;
        state.budget.details = [];
      } else {
        state.budget.items.push(...parsed);
      }
      notifyIds.forEach((id) => sendBudgetInputRequest(id, { silent: true }));
      persist();
      updateRequestPlane();
      saveAndRender("budget");
      if (notifyIds.length) alert(`${notifyIds.length}명(건)에게 ${modeMeta.short} 입력 요청을 보냈습니다.`);
      return true;
    },
  });
}

/* ---------- Import / Export ---------- */

function exportJson() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `tf-data-${today()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function importJson(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!data.meta || !Array.isArray(data.parts)) throw new Error("형식이 올바르지 않습니다.");
      state = {
        members: [],
        parts: [],
        collections: [],
        schedule: [],
        driveLinks: [],
        resources: [],
        budget: { total: 0, note: "", items: [], details: [] },
        requests: [],
        foodPolls: [],
        foodCatalog: [],
        foodHistory: [],
        aiBriefs: [],
        aiArts: [],
        ...data,
      };
      ensureBudget();
      ensureRequests();
      ensureFoodPolls();
      ensureFoodCatalog();
      ensureFoodHistory();
      ensureAiBriefs();
      ensureAiArts();
      persist();
      renderAll();
      alert("JSON을 가져왔습니다.");
    } catch (err) {
      alert(`가져오기 실패: ${err.message}`);
    }
  };
  reader.readAsText(file);
}

async function resetSample() {
  if (!confirm("브라우저에 저장된 데이터를 지우고 샘플 JSON으로 복원할까요?")) return;
  localStorage.removeItem(STORAGE_KEY);
  state = await loadSeed();
  ensureBudget();
  ensureRequests();
  ensureFoodPolls();
  ensureFoodCatalog();
  ensureFoodHistory();
  ensureAiBriefs();
  ensureAiArts();
  ensureReviewSession();
  ensureCollectionPhases();
  persist();
  if (sessionUser && memberByName(sessionUser)) {
    renderAll();
    setView("members");
  } else {
    logout();
  }
}

/* ---------- Boot ---------- */

const REPORT_DEADLINE = new Date("2026-09-15T16:00:00+09:00");
let deadlineTimer = null;

function currentReportDeadline() {
  try {
    return reportDeadlineDate();
  } catch {
    return REPORT_DEADLINE;
  }
}

function formatDeadlineRemain(ms) {
  if (ms <= 0) return { text: "0일 0시간 0분", over: true };
  const totalMin = Math.floor(ms / 60000);
  const days = Math.floor(totalMin / (60 * 24));
  const hours = Math.floor((totalMin % (60 * 24)) / 60);
  const mins = totalMin % 60;
  return {
    text: `${String(days).padStart(2, "0")}일 ${String(hours).padStart(2, "0")}시간 ${String(mins).padStart(2, "0")}분`,
    over: false,
  };
}

function updateReportDeadline() {
  const remain = currentReportDeadline().getTime() - Date.now();
  const text = remain <= 0 ? null : formatDeadlineRemain(remain).text;
  const whenText = formatReportDeadlineWhen();
  document.querySelectorAll(".deadline-when, .login-deadline-when").forEach((el) => {
    el.textContent = whenText;
  });
  document.querySelectorAll(".deadline-base").forEach((el) => {
    el.textContent = `최종 제출일 ${formatMileDateSafe(reportDeadlineIso())} 오후 4시 기준`;
  });
  const homeStrong = document.querySelector("#homeDeadlineRemain");
  const lines = document.querySelectorAll(".deadline-remain");

  if (remain <= 0) {
    lines.forEach((line) => {
      line.classList.add("is-over");
      line.textContent = "보고서 제출일이 지났습니다.";
    });
    if (deadlineTimer) {
      window.clearInterval(deadlineTimer);
      deadlineTimer = null;
    }
    return;
  }
  if (homeStrong) {
    homeStrong.textContent = text;
    homeStrong.closest(".deadline-remain")?.classList.remove("is-over");
  }
  const loginStrong = document.querySelector("#loginDeadlineRemain");
  if (loginStrong) {
    loginStrong.textContent = text;
    loginStrong.closest(".deadline-remain")?.classList.remove("is-over");
  }
  lines.forEach((line) => {
    if (line.querySelector("#homeDeadlineRemain") || line.querySelector("#loginDeadlineRemain")) return;
    line.classList.remove("is-over");
    let strong = line.querySelector("strong");
    if (!strong) {
      line.innerHTML = `보고서 제출까지 <strong id="deadlineRemain">00일 00시간 00분</strong> 남았습니다.`;
      strong = line.querySelector("strong");
    }
    if (strong) strong.textContent = text;
  });
}

function startReportDeadlineClock() {
  updateReportDeadline();
  if (deadlineTimer) window.clearInterval(deadlineTimer);
  deadlineTimer = window.setInterval(updateReportDeadline, 30000);
}

async function boot() {
  await initState();
  markDirty(false);
  startReportDeadlineClock();
  window.addEventListener("pagehide", () => flushPersist());
  window.addEventListener("beforeunload", () => flushPersist());

  // 링크 접속 시마다 권한(이름) 선택 화면부터 시작
  sessionUser = null;
  localStorage.removeItem(USER_KEY);
  $("#appShell").hidden = true;
  showLoginGate();

  openFoodPollFromLocation();

  $$("#mainNav .tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => setView(btn.dataset.nav || btn.dataset.view));
  });

  $("#btnHome")?.addEventListener("click", () => setView("home"));
  $("#btnLogout")?.addEventListener("click", logout);
  $("#userRoleBadge")?.addEventListener("click", () => {
    if (!isAdmin()) return;
    setView(activeNavId === "setup" ? "home" : "setup");
  });
  $("#btnRemindBell")?.addEventListener("click", () => openUnifiedAlarmPopup({ browseAll: true }));
  $("#btnRequestPlane")?.addEventListener("click", () => openUnifiedAlarmPopup({ browseAll: true }));
  $("#remindCloseTop")?.addEventListener("click", () => {
    cancelRemindPopupAutoClose();
    closeRemindPopup();
  });
  $("#remindGoSchedule")?.addEventListener("click", () => {
    cancelRemindPopupAutoClose();
    closeRemindPopup();
    setView("my-work");
  });
  $("#requestCloseTop")?.addEventListener("click", () => {
    cancelRemindPopupAutoClose();
    closeRemindPopup();
  });
  $("#requestClose")?.addEventListener("click", () => {
    cancelRemindPopupAutoClose();
    closeRemindPopup();
  });
  $("#requestGoTab")?.addEventListener("click", () => {
    cancelRemindPopupAutoClose();
    closeRemindPopup();
    setView(isAdmin() ? "requests" : "my-work");
  });
  $("#remindBackdrop .remind-card")?.addEventListener(
    "pointerdown",
    () => {
      cancelRemindPopupAutoClose();
      clearAlarmPhaseTransitionTimer();
    },
    { capture: true }
  );
  $("#requestBackdrop .remind-card")?.addEventListener(
    "pointerdown",
    () => {
      cancelRemindPopupAutoClose();
    },
    { capture: true }
  );
  $("#remindDismissAll")?.addEventListener("click", () => {
    cancelRemindPopupAutoClose();
    clearAlarmPhaseTransitionTimer();
    getUpcomingReminders({ includeDismissed: true }).forEach((s) => dismissReminder(s.id));
    closeRemindPopup();
  });
  $("#remindBackdrop")?.addEventListener("click", (e) => {
    if (e.target === e.currentTarget) {
      cancelRemindPopupAutoClose();
      closeRemindPopup();
    }
  });
  $("#requestBackdrop")?.addEventListener("click", (e) => {
    if (e.target === e.currentTarget) {
      cancelRequestPopupAutoClose();
      closeRequestPopup();
    }
  });
  $("#btnExport")?.addEventListener("click", exportJson);
  $("#btnImport")?.addEventListener("change", (e) => {
    if (!isAdmin()) return;
    const file = e.target.files?.[0];
    if (file) importJson(file);
    e.target.value = "";
  });

  document.addEventListener("click", (e) => {
    const resetBtn = e.target.closest?.("#btnReset");
    if (resetBtn) {
      if (!isAdmin()) return;
      void resetSample();
    }
  });

  $("#modalClose").addEventListener("click", closeModal);
  $("#modalCancel").addEventListener("click", closeModal);
  $("#modalForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!modalHandler) return;
    const fd = new FormData(e.target);
    try {
      const ok = await modalHandler(fd);
      if (ok !== false) closeModal();
    } catch (err) {
      alert(err?.message || "저장에 실패했습니다.");
    }
  });
}

boot().catch((err) => {
  console.error(err);
  const msg = escapeHtml(err?.message || String(err));
  document.body.innerHTML = `<div style="padding:2rem;font-family:sans-serif;max-width:36rem">
    <h1>앱을 불러오지 못했습니다</h1>
    <p>${msg}</p>
    <p>해결 방법:</p>
    <ol>
      <li><strong>http://127.0.0.1:5174/</strong> 로 접속 (파일 직접 열기 X)</li>
      <li>프로젝트 폴더에서 <code>npm start</code> 실행</li>
      <li>저장 용량 오류면 아래 버튼으로 로컬 데이터를 비운 뒤 새로고침</li>
    </ol>
    <p>
      <button type="button" id="tfClearStorage" style="padding:8px 14px;cursor:pointer">
        로컬 저장 데이터 초기화
      </button>
    </p>
  </div>`;
  document.getElementById("tfClearStorage")?.addEventListener("click", () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {
      /* ignore */
    }
    location.reload();
  });
});
