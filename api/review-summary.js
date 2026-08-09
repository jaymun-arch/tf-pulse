import { json, readJsonBody, openaiChat } from "./_lib/openai.mjs";

/**
 * PDF/문서 업로드 후 요약표용 분석
 * - 주요 포함사항 / 수치제시 / 계획 / 환류 방향
 * - 관리자 확인 가이드
 */
export default async function handler(req, res) {
  if (req.method === "OPTIONS") return json(res, 204, {});
  if (req.method !== "POST") return json(res, 405, { error: "POST only" });

  try {
    const body = typeof req.body === "object" && req.body ? req.body : await readJsonBody(req);
    const text = String(body.text || "").trim();
    const fileName = String(body.fileName || "문서");
    const partTitle = String(body.partTitle || "");
    const uploader = String(body.uploader || "");
    const tfName = String(body.tfName || "혁신지원사업 성과보고서");

    if (text.length < 40) {
      return json(res, 400, {
        error: "분석할 본문이 너무 짧습니다. PDF에서 텍스트가 추출됐는지 확인해 주세요.",
      });
    }

    const clipped = text.slice(0, 18000);
    const system = `당신은 전문대학 혁신지원사업 성과보고서 취합·윤독 지원 AI입니다.
담당자가 올린 PDF/문서를 보고, 관리자가 한눈에 확인할 요약표를 만듭니다.
반드시 JSON만 출력하세요. 근거 없는 수치·계획은 넣지 마세요.`;

    const user = `보고서 요약표 작성 요청
- TF: ${tfName}
- 파트: ${partTitle || "-"}
- 업로드: ${uploader || "-"}
- 파일: ${fileName}

다음 JSON 스키마로 응답:
{
  "oneLiner": "관리자용 한줄 판정",
  "keyItems": ["주요 포함사항(프로그램·사업·성과 등) 4~8개"],
  "metrics": [
    {"label":"지표명","value":"수치·단위","note":"연도·비교 등 짧은 보충"}
  ],
  "plans": ["향후 계획·추진 방향 포인트"],
  "feedbackLoop": ["점검→환류→개선(PDCA) 방향 포인트"],
  "adminGuide": [
    {"item":"확인 항목","hint":"관리자가 보고서에서 볼 위치·판단 기준","priority":"high|mid|low"}
  ],
  "suggestedReviewTags": ["상세 보완이 필요해 보이는 주제 태그 후보"],
  "coverageScore": 0
}

coverageScore: 주요내용·수치·계획·환류가 얼마나 갖춰졌는지 0~100.
metrics는 문서에 실제로 나온 것만 (최대 10).
adminGuide는 관리자 확인용 5~8개.

문서 본문:
"""
${clipped}
"""`;

    const content = await openaiChat({ system, user, jsonMode: true });
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = {
        oneLiner: "요약 파싱에 실패했습니다.",
        keyItems: [],
        metrics: [],
        plans: [],
        feedbackLoop: [],
        adminGuide: [],
        suggestedReviewTags: [],
        coverageScore: 0,
      };
    }

    const metrics = (Array.isArray(parsed.metrics) ? parsed.metrics : [])
      .slice(0, 10)
      .map((m) => ({
        label: String(m?.label || "").trim(),
        value: String(m?.value || "").trim(),
        note: String(m?.note || "").trim(),
      }))
      .filter((m) => m.label || m.value);

    const adminGuide = (Array.isArray(parsed.adminGuide) ? parsed.adminGuide : [])
      .slice(0, 10)
      .map((g) => ({
        item: String(g?.item || "").trim(),
        hint: String(g?.hint || "").trim(),
        priority: ["high", "mid", "low"].includes(g?.priority) ? g.priority : "mid",
      }))
      .filter((g) => g.item);

    return json(res, 200, {
      ok: true,
      summary: {
        oneLiner: parsed.oneLiner || "",
        keyItems: Array.isArray(parsed.keyItems) ? parsed.keyItems.map(String).slice(0, 10) : [],
        metrics,
        plans: Array.isArray(parsed.plans) ? parsed.plans.map(String).slice(0, 10) : [],
        feedbackLoop: Array.isArray(parsed.feedbackLoop)
          ? parsed.feedbackLoop.map(String).slice(0, 10)
          : [],
        adminGuide,
        suggestedReviewTags: Array.isArray(parsed.suggestedReviewTags)
          ? parsed.suggestedReviewTags.map(String).slice(0, 8)
          : [],
        coverageScore: Math.min(100, Math.max(0, Number(parsed.coverageScore) || 0)),
      },
    });
  } catch (err) {
    return json(res, err.status || 500, { error: err.message || "요약 분석 실패" });
  }
}
