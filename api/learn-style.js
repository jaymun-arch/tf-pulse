import { json, readJsonBody, openaiVision } from "./_lib/openai.mjs";

const LAYOUTS = [
  "competency",
  "section-cover",
  "three-year",
  "process",
  "kpi",
  "matrix",
  "org",
  "swot",
  "timeline",
  "budget",
];
const PROGRAMS = ["innovation", "rise", "new-industry", "icc", "edu"];

const SYSTEM = `당신은 전문대학 혁신지원사업·RISE·신산업 보고서 도식을 분류하는 분석가입니다.
업로드된 보고서 그림을 보고 JSON만 반환하세요.
{
  "title": "짧은 양식 제목",
  "program": "innovation|rise|new-industry|icc|edu 중 하나",
  "layoutRef": "competency|section-cover|three-year|process|kpi|matrix|org|swot|timeline|budget 중 하나",
  "cues": ["시각 특징 3~6개"],
  "summary": "이 그림에서 배울 점 두 문장"
}`;

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return json(res, 204, {});
  if (req.method !== "POST") return json(res, 405, { error: "POST only" });

  try {
    const body = typeof req.body === "object" && req.body ? req.body : await readJsonBody(req);
    const imageDataUrl = String(body.imageDataUrl || "").trim();
    const fileName = String(body.fileName || "").trim().slice(0, 120);
    const manager = String(body.manager || "").trim().slice(0, 40);
    if (!imageDataUrl.startsWith("data:image/")) {
      return json(res, 400, { error: "이미지 데이터가 필요합니다." });
    }

    const raw = await openaiVision({
      system: SYSTEM,
      text: `파일명: ${fileName || "(없음)"}\n학습 요청자: ${manager || "(미기재)"}\n이 보고서 그림의 유형·레이아웃·배울 점을 JSON으로 정리하세요.`,
      imageDataUrl,
      jsonMode: true,
      temperature: 0.2,
    });

    let parsed = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {};
    }

    const program = PROGRAMS.includes(parsed.program) ? parsed.program : "innovation";
    const layoutRef = LAYOUTS.includes(parsed.layoutRef) ? parsed.layoutRef : "";
    const cues = Array.isArray(parsed.cues) ? parsed.cues.map((c) => String(c).slice(0, 40)).slice(0, 6) : [];
    return json(res, 200, {
      ok: true,
      title: String(parsed.title || fileName || "학습 양식").slice(0, 80),
      program,
      layoutRef,
      cues,
      summary: String(parsed.summary || "").slice(0, 400),
    });
  } catch (err) {
    return json(res, err.status || 500, { error: err.message || "양식 분석에 실패했습니다." });
  }
}
