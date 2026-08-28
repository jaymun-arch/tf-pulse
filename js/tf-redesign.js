/**
 * PDF 개발요청 반영 — TF요약 / 내업무 / TF모두보기 / 레고 레이아웃 / Flaticon
 */

export const TF_MILESTONES = [
  {
    id: "kickoff",
    label: "TF 킥오프",
    short: "킥오프",
    date: "2026-07-15",
    tip: "수정사업계획서 서식·지침 공유. TF 운영 시작점입니다.",
  },
  {
    id: "round1",
    label: "1차 원고취합",
    short: "1차",
    date: "2026-08-20",
    tip: "수정 목차·분량 확정. 파트별 1차 초안을 취합합니다.",
  },
  {
    id: "round2",
    label: "2차 원고취합",
    short: "2차",
    date: "2026-09-05",
    tip: "리뷰 반영본·수치·그림 취합. 중복·누락을 정리합니다.",
  },
  {
    id: "budget",
    label: "예산 조정",
    short: "예산",
    date: "2026-09-08",
    tip: "비목 재배분·기자재 이관 시나리오를 확정합니다.",
  },
  {
    id: "kpi",
    label: "성과지표 수정",
    short: "성과",
    date: "2026-09-10",
    tip: "핵심·자율 지표의 목표·산식을 재설정합니다.",
  },
  {
    id: "final",
    label: "수정계획서 제출",
    short: "최종",
    date: "2026-09-15",
    tip: "혁신지원사업 수정사업계획서 제출. 9월 15일 오후 4시 기준입니다.",
  },
];

function isoToPct(iso, startIso, endIso) {
  const t = Date.parse(`${iso}T12:00:00+09:00`);
  const a = Date.parse(`${startIso}T12:00:00+09:00`);
  const b = Date.parse(`${endIso}T12:00:00+09:00`);
  if (!Number.isFinite(t) || !Number.isFinite(a) || !Number.isFinite(b) || b <= a) return 0;
  return Math.max(0, Math.min(100, ((t - a) / (b - a)) * 100));
}

function formatMileDate(iso) {
  if (!iso || iso.length < 10) return "";
  const [, m, d] = iso.split("-");
  return `${Number(m)}/${Number(d)}`;
}

export const DEFAULT_TF_TOPICS = [
  {
    id: "yeonu-2026",
    name: "혁신지원사업 수정사업계획서",
    desc: "2026 전문대학 혁신지원사업 수정사업계획 · 9월 15일 제출",
  },
];

/** 레고 조립용 블록 — 샘플 텍스트·수치 포함 */
export const LEGO_BLOCKS = [
  {
    id: "title",
    label: "제목 바",
    sample: { title: "3. 핵심역량 기반 교육과정 체계혁신", sub: "추진체계 · 성과 · 환류" },
  },
  {
    id: "kpi-row",
    label: "KPI 카드 3열",
    sample: {
      items: [
        { name: "비교과 참여율", value: "87.4%", note: "목표 85%" },
        { name: "취업률", value: "72.1%", note: "목표 70%" },
        { name: "만족도", value: "4.32", note: "5점 만점" },
      ],
    },
  },
  {
    id: "process",
    label: "프로세스 화살표",
    sample: { steps: ["계획", "실행", "점검", "개선"] },
  },
  {
    id: "table",
    label: "실적 표",
    sample: {
      headers: ["구분", "2024", "2025", "2026(목표)"],
      rows: [
        ["참여 학생", "1,240", "1,380", "1,500"],
        ["개설 프로그램", "42", "51", "60"],
      ],
    },
  },
  {
    id: "swot",
    label: "SWOT 4칸",
    sample: {
      s: "산학 네트워크 강화",
      w: "성과 환류 주기 부족",
      o: "지역 연계 확대",
      t: "재정·인력 제약",
    },
  },
  {
    id: "note",
    label: "시사점 박스",
    sample: { text: "환류(PDCA)를 분기 단위로 정례화하고, 핵심 KPI 3개를 우선 관리한다." },
  },
  {
    id: "org",
    label: "조직·역할",
    sample: {
      roles: [
        { role: "TF 총괄", who: "관리자" },
        { role: "원고 취합", who: "파트 담당" },
        { role: "예산·KPI", who: "예산·성과 담당" },
      ],
    },
  },
];

export function computeMilestoneProgress(ctx) {
  const {
    hasKickoff = true,
    round1Done = false,
    round2Done = false,
    budgetDone = false,
    kpiDone = false,
    finalDone = false,
    summaries = {},
    milestones: customMiles,
  } = ctx || {};
  const miles =
    Array.isArray(customMiles) && customMiles.length >= 2
      ? customMiles.map((m, i) => ({
          id: m.id || `m${i}`,
          label: m.label || m.short || `일정 ${i + 1}`,
          short: m.short || m.label || `${i + 1}`,
          date: m.date,
          tip: m.tip || "",
        }))
      : TF_MILESTONES;
  const flags = [hasKickoff, round1Done, round2Done, budgetDone, kpiDone, finalDone];
  let done = 0;
  for (let i = 0; i < miles.length; i++) {
    if (flags[i]) done += 1;
    else break;
  }
  const startDate = miles[0].date;
  const endDate = miles[miles.length - 1].date;
  const points = miles.map((m, i) => {
    const state = i < done ? "done" : i === done ? "now" : "todo";
    return {
      ...m,
      index: i,
      state,
      left: isoToPct(m.date, startDate, endDate),
      summary: summaries[m.id] || m.tip || "",
    };
  });
  const nowIso = ctx?.todayIso || new Date().toISOString().slice(0, 10);
  const timePct = isoToPct(nowIso, startDate, endDate);
  const stagePct = Math.round((done / miles.length) * 100);
  const barPct = Math.max(stagePct, Math.round(timePct * 0.35 + stagePct * 0.65));
  const todayPct = Math.min(96, Math.max(4, timePct || 4));
  const runnerLeft = todayPct;
  return {
    doneCount: done,
    total: miles.length,
    pct: stagePct,
    barPct: Math.min(100, barPct),
    currentIndex: Math.min(done, miles.length - 1),
    startDate,
    endDate,
    points,
    runnerLeft,
    todayPct,
    todayIso: nowIso,
  };
}

export function marathonTrackHtml(progress, escapeHtml) {
  const { doneCount, pct, currentIndex, barPct, points, todayPct, startDate, endDate, todayIso } = progress;
  const current = points?.[Math.min(currentIndex, (points?.length || 1) - 1)] || TF_MILESTONES[0];
  const flags = points?.length
    ? points
    : TF_MILESTONES.map((m, i) => ({
        ...m,
        state: i < doneCount ? "done" : i === doneCount ? "now" : "todo",
        left: (i / (TF_MILESTONES.length - 1)) * 100,
        summary: m.tip,
      }));
  const runTo = Number(todayPct ?? progress.runnerLeft ?? pct) || 4;
  const durationSec = Math.max(4.2, Math.min(8.5, 3 + runTo / 16));
  const iso = todayIso || new Date().toISOString().slice(0, 10);
  const [, tm, td] = String(iso).split("-").map(Number);
  const todayLabel = `오늘(${tm || 0}월${td || 0}일)`;
  return `
    <section class="marathon-panel" aria-label="TF 일정 진도">
      <div class="marathon-head">
        <div>
          <strong>TF 일정 진도</strong>
          <p class="marathon-span muted">${escapeHtml(formatMileDate(startDate))} → ${escapeHtml(formatMileDate(endDate))} · 전체 일정 대비 위치</p>
        </div>
        <span class="marathon-pct">${pct}% · ${escapeHtml(current?.label || "")}</span>
      </div>
      <div class="marathon-track" role="img" aria-label="마라톤 진도 ${pct}% · 오늘 위치까지 달린 뒤 정지">
        <div class="marathon-rail">
          <div
            class="marathon-bar is-running"
            style="--run-from:2%;--run-to:${runTo}%;--run-duration:${durationSec}s"
          ><i></i></div>
          <div
            class="marathon-runner is-running"
            style="--run-from:2%;--run-to:${runTo}%;--run-duration:${durationSec}s"
            title="출발 → 오늘 위치까지 달린 뒤 정지"
            aria-hidden="true"
          >
            <span class="marathon-runner-emoji">🏃</span>
            <span class="marathon-runner-today">${escapeHtml(todayLabel)}</span>
          </div>
          ${flags
            .map(
              (m) => `
            <button type="button" class="marathon-flag is-${escapeHtml(m.state || "todo")}" style="left:${Number(m.left) || 0}%" data-mile="${escapeAttrSafe(m.id)}" aria-label="${escapeHtml(m.label)} ${escapeHtml(formatMileDate(m.date))}">
              <span class="marathon-flag-date">${escapeHtml(formatMileDate(m.date))}</span>
              <span class="marathon-peg" aria-hidden="true"></span>
              <span class="marathon-flag-copy">
                <em class="marathon-flag-short">${escapeHtml(m.short)}</em>
                <strong class="marathon-flag-label">${escapeHtml(m.label)}</strong>
              </span>
              <span class="marathon-tip" role="tooltip">
                <strong>${escapeHtml(m.label)}</strong>
                <em>${escapeHtml(formatMileDate(m.date))} · ${m.state === "done" ? "완료" : m.state === "now" ? "진행중" : "예정"}</em>
                <span>${escapeHtml(m.summary || m.tip || "")}</span>
              </span>
            </button>`
            )
            .join("")}
        </div>
      </div>
    </section>`;
}

export function bindMarathonRunner(root = document) {
  bindMarathonFlags(root);
  const runner = root.querySelector?.(".marathon-runner.is-running") || null;
  const bar = root.querySelector?.(".marathon-bar.is-running") || null;
  if (!runner && !bar) return;
  let settled = false;
  const settle = () => {
    if (settled) return;
    settled = true;
    runner?.classList.remove("is-running");
    runner?.classList.add("is-arrived");
    bar?.classList.remove("is-running");
    bar?.classList.add("is-arrived");
  };
  if (!runner) {
    settle();
    return;
  }
  const onEnd = (e) => {
    if (e.animationName && e.animationName !== "marathon-run-leg") return;
    settle();
    runner.removeEventListener("animationend", onEnd);
  };
  runner.addEventListener("animationend", onEnd);
  const dur = Number.parseFloat(getComputedStyle(runner).getPropertyValue("--run-duration")) || 5.5;
  window.setTimeout(settle, Math.ceil(dur * 1000) + 80);
}

function bindMarathonFlags(root = document) {
  const flags = [...(root.querySelectorAll?.(".marathon-flag") || [])];
  if (!flags.length) return;
  flags.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const wasOpen = btn.classList.contains("is-open");
      flags.forEach((f) => f.classList.remove("is-open"));
      if (!wasOpen) btn.classList.add("is-open");
    });
  });
  if (!document.documentElement.dataset.marathonFlagDoc) {
    document.documentElement.dataset.marathonFlagDoc = "1";
    document.addEventListener("pointerdown", (e) => {
      if (e.target.closest?.(".marathon-flag")) return;
      document.querySelectorAll(".marathon-flag.is-open").forEach((f) => f.classList.remove("is-open"));
    });
  }
}

function escapeAttrSafe(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;");
}

export function flaticonSearchHtml() {
  return `
    <section class="panel flaticon-panel">
      <div class="panel-head">
        <div>
          <h2 class="panel-title">그림 검색 (Flaticon)</h2>
          <p class="muted" style="margin:4px 0 0">키워드로 Flaticon에서 아이콘을 찾아 바로 열거나 다운로드하세요.</p>
        </div>
      </div>
      <div class="flaticon-search-row">
        <input type="search" id="flaticonQuery" class="wp-input" placeholder="예: report, chart, education" />
        <button type="button" class="btn btn-primary" id="flaticonSearchBtn">검색</button>
      </div>
      <p class="muted" style="margin-top:8px;font-size:0.75rem">
        검색 결과는 Flaticon 사이트에서 열립니다.
        <a href="https://www.flaticon.com/kr" target="_blank" rel="noopener noreferrer">flaticon.com/kr</a>
      </p>
    </section>`;
}

export function bindFlaticonSearch(root) {
  const go = () => {
    const q = (root.querySelector("#flaticonQuery")?.value || "").trim() || "report";
    const url = `https://www.flaticon.com/kr/search?word=${encodeURIComponent(q)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };
  root.querySelector("#flaticonSearchBtn")?.addEventListener("click", go);
  root.querySelector("#flaticonQuery")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      go();
    }
  });
}

function escape(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function blockPreviewHtml(typeId, sample) {
  const s = sample || LEGO_BLOCKS.find((b) => b.id === typeId)?.sample || {};
  if (typeId === "title") {
    return `<div class="lego-pv lego-pv-title"><strong>${escape(s.title)}</strong><span>${escape(s.sub || "")}</span></div>`;
  }
  if (typeId === "kpi-row") {
    return `<div class="lego-pv lego-pv-kpi">${(s.items || [])
      .map((it) => `<div><em>${escape(it.name)}</em><b>${escape(it.value)}</b><small>${escape(it.note || "")}</small></div>`)
      .join("")}</div>`;
  }
  if (typeId === "process") {
    return `<div class="lego-pv lego-pv-process">${(s.steps || [])
      .map((st, i) => `${i ? "<i>→</i>" : ""}<span>${escape(st)}</span>`)
      .join("")}</div>`;
  }
  if (typeId === "table") {
    return `<div class="lego-pv lego-pv-table"><table><thead><tr>${(s.headers || [])
      .map((h) => `<th>${escape(h)}</th>`)
      .join("")}</tr></thead><tbody>${(s.rows || [])
      .map((r) => `<tr>${r.map((c) => `<td>${escape(c)}</td>`).join("")}</tr>`)
      .join("")}</tbody></table></div>`;
  }
  if (typeId === "swot") {
    return `<div class="lego-pv lego-pv-swot"><div><b>S</b>${escape(s.s || "")}</div><div><b>W</b>${escape(s.w || "")}</div><div><b>O</b>${escape(s.o || "")}</div><div><b>T</b>${escape(s.t || "")}</div></div>`;
  }
  if (typeId === "note") {
    return `<div class="lego-pv lego-pv-note">${escape(s.text || "")}</div>`;
  }
  if (typeId === "org") {
    return `<div class="lego-pv lego-pv-org">${(s.roles || [])
      .map((r) => `<span><em>${escape(r.role)}</em>${escape(r.who)}</span>`)
      .join("")}</div>`;
  }
  return `<div class="lego-pv">${escape(typeId)}</div>`;
}

export function legoBuilderHtml(placedIds = ["title", "kpi-row", "process", "note"]) {
  const placed = placedIds.length ? placedIds : ["title", "kpi-row"];
  return `
    <section class="panel lego-panel" id="legoBuilderPanel">
      <div class="panel-head">
        <div>
          <h2 class="panel-title">레고 조립 · 레이아웃 초안</h2>
          <p class="muted" style="margin:4px 0 0">대학 보고서용 블록을 드래그해 배치하세요. 샘플 수치·문구가 들어 있는 초안입니다.</p>
        </div>
      </div>
      <div class="lego-workspace">
        <aside class="lego-palette" aria-label="블록 팔레트">
          <p class="lego-palette-label">블록</p>
          ${LEGO_BLOCKS.map(
            (b) => `
            <button type="button" class="lego-chip" draggable="true" data-lego-type="${escape(b.id)}" title="드래그하거나 클릭해 추가">
              ${escape(b.label)}
            </button>`
          ).join("")}
        </aside>
        <div class="lego-canvas-wrap">
          <div class="lego-canvas" id="legoCanvas" data-dropzone="1">
            ${placed
              .map((id, idx) => {
                const meta = LEGO_BLOCKS.find((b) => b.id === id) || { label: id, sample: {} };
                return `
                <article class="lego-block" draggable="true" data-lego-placed="${escape(id)}" data-lego-idx="${idx}">
                  <header>
                    <strong>${escape(meta.label)}</strong>
                    <button type="button" class="btn btn-sm btn-ghost" data-lego-remove="${idx}" aria-label="제거">×</button>
                  </header>
                  ${blockPreviewHtml(id, meta.sample)}
                </article>`;
              })
              .join("")}
          </div>
          <div class="lego-compose form-grid two">
            <label class="field">보고서 영역
              <input id="legoArea" value="핵심역량 기반 교육과정" />
            </label>
            <label class="field">주요 내용
              <input id="legoFocus" value="추진체계 · KPI · 환류(PDCA)" />
            </label>
          </div>
          <div class="report-make-actions" style="margin-top:10px">
            <button type="button" class="btn btn-primary" id="legoComposeBtn">작성 · PPT 받기</button>
            <span class="muted" id="legoComposeStatus"></span>
          </div>
          <div class="lego-progress" id="legoProgress" hidden>
            <div class="ai-art-progress-bar"><div class="ai-art-progress-fill" id="legoProgressFill"></div></div>
            <p class="muted" id="legoProgressStep">초안 구성 중…</p>
          </div>
        </div>
      </div>
    </section>`;
}

export function readLegoPlaced(root) {
  return [...(root.querySelectorAll("[data-lego-placed]") || [])].map((el) => el.dataset.legoPlaced);
}

export function bindLegoBuilder(root, { onCompose } = {}) {
  const canvas = root.querySelector("#legoCanvas");
  if (!canvas) return;

  const rerender = (ids) => {
    const html = legoBuilderHtml(ids);
    const wrap = root.querySelector("#legoBuilderPanel");
    if (!wrap) return;
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    const next = tmp.firstElementChild;
    wrap.replaceWith(next);
    bindLegoBuilder(root, { onCompose });
  };

  root.querySelectorAll(".lego-chip").forEach((chip) => {
    chip.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/lego-type", chip.dataset.legoType);
      e.dataTransfer.effectAllowed = "copy";
    });
    chip.addEventListener("click", () => {
      const ids = readLegoPlaced(root);
      ids.push(chip.dataset.legoType);
      rerender(ids);
    });
  });

  canvas.addEventListener("dragover", (e) => {
    e.preventDefault();
    canvas.classList.add("is-dragover");
  });
  canvas.addEventListener("dragleave", () => canvas.classList.remove("is-dragover"));
  canvas.addEventListener("drop", (e) => {
    e.preventDefault();
    canvas.classList.remove("is-dragover");
    const type = e.dataTransfer.getData("text/lego-type");
    const fromIdx = e.dataTransfer.getData("text/lego-idx");
    let ids = readLegoPlaced(root);
    if (fromIdx !== "") {
      const i = Number(fromIdx);
      const [moved] = ids.splice(i, 1);
      if (moved) ids.push(moved);
    } else if (type) {
      ids.push(type);
    }
    rerender(ids);
  });

  root.querySelectorAll(".lego-block").forEach((block) => {
    block.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/lego-idx", block.dataset.legoIdx || "");
      e.dataTransfer.effectAllowed = "move";
    });
  });

  root.querySelectorAll("[data-lego-remove]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.legoRemove);
      const ids = readLegoPlaced(root).filter((_, i) => i !== idx);
      rerender(ids.length ? ids : ["title"]);
    });
  });

  root.querySelector("#legoComposeBtn")?.addEventListener("click", async () => {
    if (typeof onCompose === "function") {
      await onCompose({
        blocks: readLegoPlaced(root),
        area: root.querySelector("#legoArea")?.value || "",
        focus: root.querySelector("#legoFocus")?.value || "",
        statusEl: root.querySelector("#legoComposeStatus"),
        progressEl: root.querySelector("#legoProgress"),
        fillEl: root.querySelector("#legoProgressFill"),
        stepEl: root.querySelector("#legoProgressStep"),
      });
    }
  });
}

/** 레고 초안 → PPT 다운로드 */
export async function downloadLegoDraftPpt({ blocks, area, focus, fileName }) {
  const PptxGenJS = (await import("https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/+esm")).default;
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "WIDE", width: 10, height: 5.625 });
  pptx.layout = "WIDE";
  const slide = pptx.addSlide();
  slide.addText(area || "보고서 레이아웃 초안", {
    x: 0.4,
    y: 0.25,
    w: 9.2,
    h: 0.4,
    fontSize: 20,
    bold: true,
    fontFace: "Malgun Gothic",
    color: "222222",
  });
  if (focus) {
    slide.addText(focus, {
      x: 0.4,
      y: 0.65,
      w: 9.2,
      h: 0.28,
      fontSize: 12,
      fontFace: "Malgun Gothic",
      color: "555555",
    });
  }
  let y = 1.05;
  for (const id of blocks || []) {
    const meta = LEGO_BLOCKS.find((b) => b.id === id);
    const s = meta?.sample || {};
    slide.addText(meta?.label || id, {
      x: 0.4,
      y,
      w: 9.2,
      h: 0.26,
      fontSize: 11,
      bold: true,
      fontFace: "Malgun Gothic",
      color: "0B2C5F",
    });
    y += 0.28;
    let body = "";
    if (id === "title") body = `${s.title || ""}\n${s.sub || ""}`;
    else if (id === "kpi-row")
      body = (s.items || []).map((it) => `${it.name}: ${it.value} (${it.note || ""})`).join("  |  ");
    else if (id === "process") body = (s.steps || []).join(" → ");
    else if (id === "table")
      body = [(s.headers || []).join(" | "), ...(s.rows || []).map((r) => r.join(" | "))].join("\n");
    else if (id === "swot") body = `S ${s.s || ""}\nW ${s.w || ""}\nO ${s.o || ""}\nT ${s.t || ""}`;
    else if (id === "note") body = s.text || "";
    else if (id === "org") body = (s.roles || []).map((r) => `${r.role}: ${r.who}`).join("  ·  ");
    else body = JSON.stringify(s);
    const lines = Math.min(4, Math.max(1, String(body).split("\n").length));
    slide.addText(body, {
      x: 0.5,
      y,
      w: 9,
      h: 0.28 * lines,
      fontSize: 11,
      fontFace: "Malgun Gothic",
      color: "333333",
      valign: "top",
    });
    y += 0.28 * lines + 0.12;
    if (y > 5.1) break;
  }
  slide.addText("TF Pulse · 레고 레이아웃 초안 · 수치·문구를 수정해 사용하세요", {
    x: 0.4,
    y: 5.25,
    w: 9.2,
    h: 0.25,
    fontSize: 9,
    color: "888888",
    fontFace: "Malgun Gothic",
  });
  await pptx.writeFile({ fileName: `${fileName || "연성대_레고레이아웃_초안"}.pptx` });
}
