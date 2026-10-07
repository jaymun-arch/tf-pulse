/**
 * 내 업무 — 달력 보기 (TF 참여자용, 읽기 전용)
 * 관리자가 등록한 TF 일정을 2개월 달력으로 보여 준다.
 * 날짜가 가까울수록 칸 색이 진해진다: 임박(3일) · 이번 주(7일) · 이번 달(31일)
 */

const DEPT_COLORS = ["#ff9f0a", "#bf5af2", "#34c759", "#0a84ff", "#e0b100", "#a2845e", "#ff375f", "#30b0c7"];
const MAX_CHIPS = 3;

function esc(s = "") {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function iso(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseIso(s) {
  const [y, m, d] = String(s).slice(0, 10).split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function dayDiff(fromIso, toIso) {
  return Math.round((parseIso(toIso) - parseIso(fromIso)) / 86400000);
}

export function deptOf(s) {
  return String(s?.dept || s?.division || "미분류").trim() || "미분류";
}

/** 부서(구분)별 색 — 이름 순서로 고정 */
export function deptColorMap(items) {
  const keys = [...new Set(items.map(deptOf))].sort((a, b) => (a === "미분류") - (b === "미분류") || a.localeCompare(b, "ko"));
  return Object.fromEntries(keys.map((k, i) => [k, DEPT_COLORS[i % DEPT_COLORS.length]]));
}

function startIso(s) {
  return String(s.date || s.endDate || "").slice(0, 10);
}

function endIso(s) {
  const a = startIso(s);
  const b = String(s.endDate || "").slice(0, 10);
  return b && b >= a && dayDiff(a, b) <= 62 ? b : a;
}

function matches(s, query) {
  if (!query) return true;
  const blob = `${s.title || ""} ${s.goal || ""} ${s.note || ""} ${s.prep || ""} ${deptOf(s)}`.toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((w) => blob.includes(w));
}

/** 화면에 보일 일정만 (검색·구분 필터 적용) */
export function filterCalendarItems(items, { query = "", dept = "" } = {}) {
  return items.filter((s) => startIso(s) && matches(s, query) && (!dept || deptOf(s) === dept));
}

function levelOfDay(dayIso, todayIso, events) {
  const open = events.filter((s) => (s.status || "") !== "완료");
  if (!events.length) return "";
  const d = dayDiff(todayIso, dayIso);
  if (d < 0) return open.length ? "lv-urgent" : "lv-past";
  if (!open.length) return "";
  if (d <= 3) return "lv-urgent";
  if (d <= 7) return "lv-week";
  if (d <= 31) return "lv-month";
  return "";
}

function chipHtml(s, color, dayIso) {
  const done = (s.status || "") === "완료";
  const period = endIso(s) !== startIso(s);
  const cont = period && dayIso !== startIso(s);
  return `<button type="button" class="mwc-chip ${period ? "is-period" : ""} ${done ? "is-done" : ""}" style="--c:${color}" data-mwc-item="${esc(s.id)}" title="${esc(`${deptOf(s)} · ${s.title || ""}`)}">
      <span class="mwc-chip-dept">${esc(deptOf(s).slice(0, 4))}</span>
      <span class="mwc-chip-title">${cont ? "↳ " : ""}${esc(s.title || "(제목 없음)")}</span>
    </button>`;
}

/**
 * @param {object} o
 * @param {object[]} o.items     보여 줄 일정 (이미 권한·필터 적용)
 * @param {object[]} o.allItems  구분 칩 개수용 (검색만 적용, 구분 필터 전)
 * @param {string}   o.cursor    첫 달 (YYYY-MM-01)
 * @param {string}   o.todayIso
 * @param {object}   o.holidays  { "YYYY-MM-DD": "추석" }
 * @param {string}   o.query
 * @param {string}   o.dept
 * @param {string}   o.who
 * @param {boolean}  o.showModeToggle
 */
export function myWorkCalendarHtml(o) {
  const { items, allItems, cursor, todayIso, holidays = {}, query = "", dept = "", who = "", showModeToggle = false, canRequest = false } = o;
  const colors = deptColorMap(allItems.length ? allItems : items);
  const first = parseIso(cursor);
  const months = [new Date(first.getFullYear(), first.getMonth(), 1), new Date(first.getFullYear(), first.getMonth() + 1, 1)];
  const rangeStart = iso(months[0]);
  const rangeEnd = iso(new Date(first.getFullYear(), first.getMonth() + 2, 0));

  // 날짜별 일정 모으기 (기간 일정은 매일 표시)
  const byDay = new Map();
  items.forEach((s) => {
    const a = startIso(s);
    const b = endIso(s);
    for (let d = parseIso(a); iso(d) <= b; d.setDate(d.getDate() + 1)) {
      const k = iso(d);
      if (k < rangeStart || k > rangeEnd) continue;
      if (!byDay.has(k)) byDay.set(k, []);
      byDay.get(k).push(s);
    }
  });
  const visibleIds = new Set([...byDay.values()].flat().map((s) => s.id));

  const deptCounts = new Map();
  allItems.forEach((s) => deptCounts.set(deptOf(s), (deptCounts.get(deptOf(s)) || 0) + 1));

  const monthBlock = (m) => {
    const y = m.getFullYear();
    const mo = m.getMonth();
    const last = new Date(y, mo + 1, 0).getDate();
    const lead = (m.getDay() + 6) % 7; // 월요일 시작
    const cells = [];
    for (let i = 0; i < lead; i++) cells.push(`<div class="mwc-day is-out" aria-hidden="true"></div>`);
    for (let d = 1; d <= last; d++) {
      const dayIso = iso(new Date(y, mo, d));
      const evs = (byDay.get(dayIso) || []).sort(
        (a, b) => ((a.status || "") === "완료") - ((b.status || "") === "완료") || startIso(a).localeCompare(startIso(b))
      );
      const lv = levelOfDay(dayIso, todayIso, evs);
      const dow = new Date(y, mo, d).getDay();
      const hol = holidays[dayIso] || "";
      const numCls = dow === 0 || hol ? "is-red" : dow === 6 ? "is-sat" : "";
      const isToday = dayIso === todayIso;
      cells.push(`
        <div class="mwc-day ${lv} ${isToday ? "is-today" : ""} ${evs.length ? "has-events" : ""}" data-mwc-day="${dayIso}">
          <div class="mwc-num">
            ${d === 1 ? `<span class="mwc-month-tag">${mo + 1}월</span>` : ""}
            <span class="mwc-n ${numCls}">${d}</span>
            ${isToday ? `<span class="mwc-today-tag">오늘</span>` : ""}
            ${evs.length ? `<span class="mwc-count ${lv}">${evs.length}</span>` : ""}
          </div>
          ${hol ? `<span class="mwc-holiday">${esc(hol)}</span>` : ""}
          <div class="mwc-events">
            ${evs
              .slice(0, MAX_CHIPS)
              .map((s) => chipHtml(s, colors[deptOf(s)] || DEPT_COLORS[0], dayIso))
              .join("")}
            ${evs.length > MAX_CHIPS ? `<button type="button" class="mwc-more" data-mwc-day-more="${dayIso}">+${evs.length - MAX_CHIPS}건</button>` : ""}
          </div>
        </div>`);
    }
    const tail = (7 - (cells.length % 7)) % 7;
    for (let i = 0; i < tail; i++) cells.push(`<div class="mwc-day is-out" aria-hidden="true"></div>`);
    return `
      <section class="mwc-month">
        <h3 class="mwc-month-label">${y}년 ${mo + 1}월</h3>
        <div class="mwc-grid">${cells.join("")}</div>
      </section>`;
  };

  const m1 = months[0];
  const m2 = months[1];
  const title =
    m1.getFullYear() === m2.getFullYear()
      ? `${m1.getFullYear()}년 ${m1.getMonth() + 1}월 – ${m2.getMonth() + 1}월`
      : `${m1.getFullYear()}년 ${m1.getMonth() + 1}월 – ${m2.getFullYear()}년 ${m2.getMonth() + 1}월`;

  const deptKeys = [...deptCounts.keys()].sort((a, b) => (a === "미분류") - (b === "미분류") || a.localeCompare(b, "ko"));

  return `
    <div class="mwc">
      <div class="mwc-head">
        <h2 class="mwc-title">${esc(who ? `${who}님의 TF 일정` : "TF 일정")}</h2>
        ${canRequest ? `<button type="button" class="mwc-request-btn" data-mwc-request>＋ 업무 요청</button>` : ""}
        ${
          showModeToggle
            ? `<div class="mwc-mode" role="group" aria-label="보기 방식">
                <button type="button" class="active" data-mwc-mode="calendar">달력</button>
                <button type="button" data-mwc-mode="list">목록</button>
              </div>`
            : ""
        }
      </div>

      <div class="mwc-nav">
        <button type="button" class="mwc-round" data-mwc-nav="-1" aria-label="이전 달">‹</button>
        <div class="mwc-nav-title">
          <strong>${title}</strong>
          <span>2개월 보기 · 일정 ${visibleIds.size}건</span>
        </div>
        <button type="button" class="mwc-round" data-mwc-nav="1" aria-label="다음 달">›</button>
        <button type="button" class="mwc-pill" data-mwc-nav="today">오늘</button>
      </div>

      <div class="mwc-legend">
        <span class="mwc-lg lv-urgent">임박·지연</span>
        <span class="mwc-lg lv-week">이번 주</span>
        <span class="mwc-lg lv-month">이번 달</span>
      </div>

      <div class="mwc-filters">
        <label class="mwc-search">
          <span aria-hidden="true">🔍</span>
          <input type="search" id="mwcSearch" placeholder="일정, 구분, 내용 검색" value="${esc(query)}" />
        </label>
        <div class="mwc-depts">
          ${deptKeys
            .map(
              (k) => `<button type="button" class="mwc-dept ${dept === k ? "active" : ""}" style="--c:${colors[k]}" data-mwc-dept="${esc(k)}">
                ${esc(k)} <span>${deptCounts.get(k)}</span>
              </button>`
            )
            .join("")}
          ${dept ? `<button type="button" class="mwc-clear" data-mwc-dept="">전체 보기</button>` : ""}
        </div>
      </div>

      <div class="mwc-weekdays" aria-hidden="true">
        <span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span class="is-sat">토</span><span class="is-sun">일</span>
      </div>
      ${months.map(monthBlock).join("")}
      ${visibleIds.size ? "" : `<p class="mwc-empty">이 기간에 보이는 일정이 없습니다. ‹ › 로 다른 달을 보세요.</p>`}
    </div>`;
}

/** 일정 한 건 상세 (읽기 전용) */
export function scheduleDetailHtml(s, { color = "#0a84ff", statusLabel = "", dateLabel = "", assignees = [] } = {}) {
  const rows = [
    ["할 일", s.goal],
    ["준비할 것", s.prep],
    ["유의할 점", s.carePoints],
    ["요청 메시지", s.askMessage],
    ["메모", s.note],
  ].filter(([, v]) => String(v || "").trim());
  return `
    <div class="mwc-detail" style="--c:${color}">
      <div class="mwc-detail-when">
        <span class="mwc-detail-dot"></span>
        <div>
          <strong>${esc(dateLabel)}</strong>
          <p class="muted">${esc(deptOf(s))} · ${esc(statusLabel)}</p>
        </div>
      </div>
      ${assignees.length ? `<p class="mwc-detail-people"><b>함께하는 사람</b> ${esc(assignees.join(", "))}</p>` : ""}
      ${
        rows.length
          ? `<dl class="mwc-detail-grid">${rows
              .map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`)
              .join("")}</dl>`
          : `<p class="muted">관리자가 적은 설명이 없습니다.</p>`
      }
    </div>`;
}

/** 하루 일정 목록 (+N건 눌렀을 때) */
export function dayListHtml(events, colors) {
  return `<div class="mwc-daylist">${events
    .map(
      (s) => `<button type="button" class="mwc-chip is-full ${(s.status || "") === "완료" ? "is-done" : ""}" style="--c:${colors[deptOf(s)] || DEPT_COLORS[0]}" data-mwc-item="${esc(s.id)}">
        <span class="mwc-chip-dept">${esc(deptOf(s))}</span>
        <span class="mwc-chip-title">${esc(s.title || "")}</span>
      </button>`
    )
    .join("")}</div>`;
}
