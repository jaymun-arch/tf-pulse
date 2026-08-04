/**
 * 오늘 뭐먹지 — 구글 시트 / CSV 연동
 *
 * 구글 시트 탭 구성
 * 1) menus  : meal_key, meal_label, items
 * 2) places : name, meals, tags, taste, speed, menus, tip
 *
 * 게시 방법
 * - 파일 > 공유 > 웹에 게시 > CSV
 * - menus / places 각각 CSV URL을 복사해 앱에 붙여넣기
 * - 또는 아래 로컬 CSV를 시트에 가져오기한 뒤 게시
 */
const FOOD_SHEET_KEY = "tf-ops-food-sheet-v1";

const DEFAULT_FOOD_MENUS = {
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

const DEFAULT_FOOD_PLACES = [
  {
    name: "중국요리(영흥관)",
    meals: ["lunch", "dinner", "late"],
    tags: ["중식", "덮밥", "짜장면"],
    taste: 3,
    speed: 5,
    menus: ["짜장면", "고기짬뽕밥", "탕수육"],
    tip: "배달 빠르고 양 많음. 보고서 마감날 단골.",
  },
  {
    name: "김가네 김치찌개",
    meals: ["lunch", "dinner"],
    tags: ["김치찌개", "된장찌개", "한식"],
    taste: 4,
    speed: 4,
    menus: ["김치찌개정식", "된장찌개", "계란말이"],
    tip: "국물 진하고 밥 리필 가능.",
  },
  {
    name: "제육의 신",
    meals: ["lunch", "dinner"],
    tags: ["제육볶음", "덮밥", "쌈밥"],
    taste: 5,
    speed: 3,
    menus: ["제육덮밥", "쌈밥정식", "계란찜"],
    tip: "매콤달콤. 맛은 최고, 웨이팅 있을 수 있음.",
  },
  {
    name: "톤카츠하우스",
    meals: ["lunch", "dinner"],
    tags: ["돈까스"],
    taste: 4,
    speed: 3,
    menus: ["등심돈까스", "치즈돈까스", "히레까스"],
    tip: "바삭함 유지력 좋음. 점심 세트 추천.",
  },
  {
    name: "면면칼국수",
    meals: ["lunch"],
    tags: ["칼국수", "국수"],
    taste: 4,
    speed: 4,
    menus: ["바지락칼국수", "들깨칼국수", "왕만두"],
    tip: "든든한 한 끼. 비 오는 날 특효.",
  },
  {
    name: "비빔당",
    meals: ["lunch"],
    tags: ["비빔밥"],
    taste: 4,
    speed: 5,
    menus: ["돌솥비빔밥", "야채비빔밥", "육회비빔밥"],
    tip: "배달·포장 모두 깔끔. 스피드 강점.",
  },
  {
    name: "고깃집 삼삼",
    meals: ["dinner"],
    tags: ["삼겹살"],
    taste: 5,
    speed: 2,
    menus: ["삼겹살", "목살", "된장찌개"],
    tip: "회식·저녁용. 배달보다 매장 추천.",
  },
  {
    name: "치킨은사랑",
    meals: ["dinner", "late"],
    tags: ["치킨", "야식"],
    taste: 4,
    speed: 4,
    menus: ["후라이드", "양념치킨", "간장치킨"],
    tip: "야근 필수 조합. 순살 옵션 있음.",
  },
  {
    name: "피자코너24",
    meals: ["dinner", "late", "snack"],
    tags: ["피자"],
    taste: 3,
    speed: 5,
    menus: ["페퍼로니", "콤비네이션", "감자피자"],
    tip: "배달 초고속. 가성비 위주.",
  },
  {
    name: "족발명가",
    meals: ["dinner", "late"],
    tags: ["족발", "족발·보쌈", "보쌈"],
    taste: 5,
    speed: 3,
    menus: ["앞다리족발", "보쌈정식", "막국수"],
    tip: "야식·저녁 모두 강추. 양 푸짐.",
  },
  {
    name: "안동찜닭골목",
    meals: ["dinner", "late"],
    tags: ["찜닭"],
    taste: 4,
    speed: 3,
    menus: ["안동찜닭", "순살찜닭", "당면사리"],
    tip: "여럿이 먹기 좋음. TF 회식용.",
  },
  {
    name: "마라킹",
    meals: ["dinner", "late"],
    tags: ["마라탕"],
    taste: 4,
    speed: 4,
    menus: ["마라탕", "마라샹궈", "꿔바로우"],
    tip: "매운맛 단계 조절 가능. 야식도 OK.",
  },
  {
    name: "신전앞떡볶이",
    meals: ["snack", "late", "lunch"],
    tags: ["떡볶이"],
    taste: 4,
    speed: 5,
    menus: ["떡볶이", "튀김세트", "라볶이"],
    tip: "간식·야식 만능. 배달 빠름.",
  },
  {
    name: "호호붕어빵",
    meals: ["snack"],
    tags: ["붕어빵", "호떡"],
    taste: 5,
    speed: 5,
    menus: ["붕어빵", "호떡", "계란빵"],
    tip: "따뜻한 간식. 줄 서도 금방.",
  },
  {
    name: "카페브레드",
    meals: ["snack"],
    tags: ["카페·빵", "아이스크림"],
    taste: 4,
    speed: 4,
    menus: ["아메리카노", "크로와상", "젤라또"],
    tip: "보고서 쓰며 먹기 좋은 디저트.",
  },
  {
    name: "야식라면공장",
    meals: ["late"],
    tags: ["야식라면", "라면"],
    taste: 3,
    speed: 5,
    menus: ["짜파구리", "비빔면세트", "만두추가"],
    tip: "자정 이후에도 가능. 스피드 최강.",
  },
  {
    name: "곱창거리",
    meals: ["late", "dinner"],
    tags: ["곱창", "안주세트"],
    taste: 5,
    speed: 2,
    menus: ["모둠곱창", "막창", "볶음밥"],
    tip: "야식 끝판왕. 맛 우선이면 여기.",
  },
];

/** 런타임에 시트/CSV로 덮어씀 */
let FOOD_MENUS = structuredClone(DEFAULT_FOOD_MENUS);
let FOOD_PLACES = structuredClone(DEFAULT_FOOD_PLACES);
let foodSheetStatus = "기본 데이터";

function loadFoodSheetSettings() {
  try {
    return JSON.parse(localStorage.getItem(FOOD_SHEET_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveFoodSheetSettings(settings) {
  localStorage.setItem(FOOD_SHEET_KEY, JSON.stringify(settings));
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;
  const src = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    const next = src[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (ch === "\r") {
      /* skip */
    } else {
      cell += ch;
    }
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => String(c).trim() !== ""));
}

function csvObjects(text) {
  const rows = parseCsv(text);
  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((cols) => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = (cols[i] ?? "").trim();
    });
    return obj;
  });
}

function splitList(value) {
  return String(value || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function applyMenusFromRows(rows) {
  const next = {};
  rows.forEach((r) => {
    const key = r.meal_key || r.mealKey;
    if (!key) return;
    const items = splitList(r.items);
    if (!items.length) return;
    next[key] = {
      label: r.meal_label || r.mealLabel || key,
      items,
    };
  });
  if (Object.keys(next).length) FOOD_MENUS = next;
}

function applyPlacesFromRows(rows) {
  const next = rows
    .map((r) => ({
      name: r.name,
      meals: splitList(r.meals),
      tags: splitList(r.tags),
      taste: Number(r.taste) || 0,
      speed: Number(r.speed) || 0,
      menus: splitList(r.menus),
      tip: r.tip || "",
    }))
    .filter((p) => p.name);
  if (next.length) FOOD_PLACES = next;
}

async function fetchCsv(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`CSV 로드 실패 (${res.status})`);
  return res.text();
}

async function loadFoodFromSheets(settings = loadFoodSheetSettings()) {
  const menusUrl = settings.menusUrl?.trim();
  const placesUrl = settings.placesUrl?.trim();
  if (!menusUrl && !placesUrl) {
    FOOD_MENUS = structuredClone(DEFAULT_FOOD_MENUS);
    FOOD_PLACES = structuredClone(DEFAULT_FOOD_PLACES);
    foodSheetStatus = "기본 데이터";
    return { ok: true, source: "default" };
  }
  try {
    if (menusUrl) applyMenusFromRows(csvObjects(await fetchCsv(menusUrl)));
    if (placesUrl) applyPlacesFromRows(csvObjects(await fetchCsv(placesUrl)));
    foodSheetStatus = "구글 시트 연결됨";
    return { ok: true, source: "sheet" };
  } catch (err) {
    FOOD_MENUS = structuredClone(DEFAULT_FOOD_MENUS);
    FOOD_PLACES = structuredClone(DEFAULT_FOOD_PLACES);
    foodSheetStatus = `시트 연결 실패 · 기본 데이터 (${err.message})`;
    return { ok: false, error: err };
  }
}

async function loadLocalFoodCsvFallback() {
  try {
    const [menusText, placesText] = await Promise.all([
      fetchCsv("./data/food-menus.csv"),
      fetchCsv("./data/food-places.csv"),
    ]);
    applyMenusFromRows(csvObjects(menusText));
    applyPlacesFromRows(csvObjects(placesText));
    foodSheetStatus = "로컬 CSV";
  } catch {
    /* keep defaults */
  }
}

export {
  FOOD_SHEET_KEY,
  DEFAULT_FOOD_MENUS,
  DEFAULT_FOOD_PLACES,
  loadFoodSheetSettings,
  saveFoodSheetSettings,
  loadFoodFromSheets,
  loadLocalFoodCsvFallback,
  getFoodMenus: () => FOOD_MENUS,
  getFoodPlaces: () => FOOD_PLACES,
  getFoodSheetStatus: () => foodSheetStatus,
};
