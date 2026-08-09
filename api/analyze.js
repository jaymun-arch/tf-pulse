import { json, readJsonBody, openaiChat } from "./_lib/openai.mjs";

/** 연성대 자율혁신계획서 핵심사업 페이지 틀 (검증 기준) */
const FRAME_HINT = `
연성대학교 「전문대학 혁신지원사업 3주기 자율혁신계획서」 핵심사업 기술 틀을 기준으로 검증하세요.
필수 구성 항목:
1) 핵심사업명
2) 선정사유
3) 현황분석
4) 추진필요성
5) 개요(추진체계·모형도·프로세스 설명)
6) 3개년 추진계획(연도별 활동·정량지표)
7) 해당연도 세부추진계획(추진내용·방법)
8) 기대효과_정량
9) 기대효과_정성
`.trim();

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return json(res, 204, {});
  if (req.method !== "POST") return json(res, 405, { error: "POST only" });

  try {
    const body = typeof req.body === "object" && req.body ? req.body : await readJsonBody(req);
    const text = String(body.text || "").trim();
    const fileName = String(body.fileName || "문서");
    const roundName = String(body.roundName || "");
    const partTitle = String(body.partTitle || "");
    const tfName = String(body.tfName || "혁신지원사업 성과보고서");

    if (text.length < 40) {
      return json(res, 400, {
        error: "분석할 본문이 너무 짧습니다. 텍스트를 붙여넣거나 문서를 확인해 주세요.",
      });
    }

    const clipped = text.slice(0, 16000);
    const system = `당신은 전문대학 혁신지원사업·자율혁신계획서 취합 검증 담당 AI입니다.
연성대학교 3주기 자율혁신계획서의 핵심사업 기술 틀에 맞춰, 관리자가 누락·보완점을 바로 알 수 있게 한국어로 정리합니다.
반드시 JSON만 출력하세요.`;

    const user = `취합 문서 검증·브리핑 요청
- TF: ${tfName}
- 취합차수: ${roundName || "-"}
- 파트: ${partTitle || "-"}
- 파일명: ${fileName}

${FRAME_HINT}

다음 JSON 스키마로 응답:
{
  "adminBrief": "관리자용 한줄 판정 (예: 핵심사업 틀 70% 충족, 3개년 지표 보완 필요)",
  "summary": "3~6문장 요약",
  "projectName": "문서에서 파악한 핵심사업명(없으면 빈문자)",
  "selectionReason": "선정사유 요약(없으면 빈문자)",
  "statusAnalysis": ["현황분석 포인트"],
  "necessity": ["추진필요성 포인트"],
  "overviewModel": "개요·추진체계·모형 설명 요약",
  "plan3y": ["3개년 계획·연도별 지표 포인트"],
  "planDetail": ["해당연도 세부추진 포인트"],
  "effectsQuant": ["기대효과 정량"],
  "effectsQual": ["기대효과 정성"],
  "checklist": [
    {"id":"projectName","label":"핵심사업명","status":"ok|partial|missing","note":"근거 한줄"},
    {"id":"selectionReason","label":"선정사유","status":"ok|partial|missing","note":""},
    {"id":"statusAnalysis","label":"현황분석","status":"ok|partial|missing","note":""},
    {"id":"necessity","label":"추진필요성","status":"ok|partial|missing","note":""},
    {"id":"overview","label":"개요·추진체계도","status":"ok|partial|missing","note":""},
    {"id":"plan3y","label":"3개년 추진계획·정량지표","status":"ok|partial|missing","note":""},
    {"id":"planDetail","label":"세부추진계획","status":"ok|partial|missing","note":""},
    {"id":"effectsQuant","label":"기대효과(정량)","status":"ok|partial|missing","note":""},
    {"id":"effectsQual","label":"기대효과(정성)","status":"ok|partial|missing","note":""}
  ],
  "coverageScore": 0,
  "themes": ["핵심 주제"],
  "keywords": ["키워드"],
  "achievements": ["성과·실적 포인트"],
  "gaps": ["보완·확인이 필요한 점"],
  "suggestedDiagram": "이 내용에 맞는 추천 그림 타입(핵심사업개요도|추진체계도|인증단계모형|ICC매트릭스|플랫폼순환도|성과확산모형|성과향상모형|추진로드맵)",
  "tone": "서술 톤 한줄"
}

coverageScore는 checklist 충족도(0~100, ok=100/항목 partial=50 missing=0 평균).

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
        adminBrief: "요약 파싱에 실패했습니다.",
        summary: content.slice(0, 800),
        checklist: [],
        coverageScore: 0,
        themes: [],
        keywords: [],
        achievements: [],
        gaps: [],
      };
    }

    const checklist = Array.isArray(parsed.checklist) ? parsed.checklist.slice(0, 12) : [];
    let coverage = Number(parsed.coverageScore);
    if (!Number.isFinite(coverage) && checklist.length) {
      const map = { ok: 100, partial: 50, missing: 0 };
      coverage = Math.round(
        checklist.reduce((s, c) => s + (map[c.status] ?? 0), 0) / checklist.length
      );
    }

    return json(res, 200, {
      ok: true,
      analysis: {
        adminBrief: parsed.adminBrief || "",
        summary: parsed.summary || "",
        projectName: parsed.projectName || "",
        selectionReason: parsed.selectionReason || "",
        statusAnalysis: Array.isArray(parsed.statusAnalysis) ? parsed.statusAnalysis.slice(0, 8) : [],
        necessity: Array.isArray(parsed.necessity) ? parsed.necessity.slice(0, 8) : [],
        overviewModel: parsed.overviewModel || "",
        plan3y: Array.isArray(parsed.plan3y) ? parsed.plan3y.slice(0, 8) : [],
        planDetail: Array.isArray(parsed.planDetail) ? parsed.planDetail.slice(0, 8) : [],
        effectsQuant: Array.isArray(parsed.effectsQuant) ? parsed.effectsQuant.slice(0, 8) : [],
        effectsQual: Array.isArray(parsed.effectsQual) ? parsed.effectsQual.slice(0, 8) : [],
        checklist,
        coverageScore: Math.min(100, Math.max(0, coverage || 0)),
        themes: Array.isArray(parsed.themes) ? parsed.themes.slice(0, 10) : [],
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 16) : [],
        achievements: Array.isArray(parsed.achievements) ? parsed.achievements.slice(0, 10) : [],
        gaps: Array.isArray(parsed.gaps) ? parsed.gaps.slice(0, 8) : [],
        suggestedDiagram: parsed.suggestedDiagram || "",
        tone: parsed.tone || "",
        frame: "연성대 3주기 자율혁신계획서 핵심사업 틀",
      },
    });
  } catch (err) {
    return json(res, err.status || 500, { error: err.message || "분석 실패" });
  }
}
