import { json, readJsonBody, openaiImage, openaiChat } from "./_lib/openai.mjs";

/** 연성대 자율혁신계획서 도식 스타일 */
const YEONSUNG_REPORT_DIAGRAM_STYLE = `
연성대학교 전문대학 혁신지원사업 자율혁신계획서에 실린 공식 도식 스타일.
레이아웃: 보고서용 개념도·추진체계도·프로세스 플로우. SmartArt처럼 정돈된 박스·화살표·번호 원(①②③).
색: 딥 네이비(#0B2C5F) 헤더/강조, 라이트 블루(#D6E6F5) 박스, 쿨 그레이 라인, 화이트 여백. 과한 그라데이션·네온·3D 금지.
요소: 둥근 모서리 사각형 모듈, 방향 화살표, 단계 원형 배지, 아이콘은 미니멀 라인/심플 픽토그램.
금지: 본문 글자·표·로고·워터마크·손글씨·사진 콜라주. 라벨이 필요하면 아주 짧은 영문/기호만 허용하되 한글 문장은 넣지 말 것.
완성도: PPT 슬라이드에 바로 넣을 수 있는 가로형 와이드, 여백 균형, 인쇄해도 선명한 선과 대비.
`.replace(/\s+/g, " ").trim();

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return json(res, 204, {});
  if (req.method !== "POST") return json(res, 405, { error: "POST only" });

  try {
    const body = typeof req.body === "object" && req.body ? req.body : await readJsonBody(req);
    let prompt = String(body.prompt || "").trim();
    const context = String(body.context || "").trim().slice(0, 4000);
    const title = String(body.title || "성과 하이라이트").trim();
    const reportFrameName = String(body.reportFrameName || "").trim();
    const reportTypeName = String(body.reportTypeName || "핵심사업 개요도").trim();
    const reportTypeDesc = String(body.reportTypeDesc || "").trim();
    const reportTypeVisual = String(body.reportTypeVisual || "").trim();
    const styleGuide = String(body.styleGuide || "").trim().slice(0, 2500);
    const styleBlock = styleGuide || YEONSUNG_REPORT_DIAGRAM_STYLE;

    const typeGuide = [
      reportFrameName ? `작성 방향 틀: ${reportFrameName}` : "",
      `보고서 도식 타입: ${reportTypeName}`,
      reportTypeDesc ? `타입 설명: ${reportTypeDesc}` : "",
      reportTypeVisual ? `시각 구조: ${reportTypeVisual}` : "",
      "연성대 자율혁신계획서의 개요·추진체계 도식처럼 구조가 한눈에 보이게 표현.",
    ]
      .filter(Boolean)
      .join("\n");

    if (!prompt || context) {
      const brief = await openaiChat({
        system:
          "대학 혁신지원사업 계획서용 공식 도식 이미지 프롬프트를 만듭니다. 박스·화살표·단계번호가 있는 보고서 다이어그램이어야 합니다. JSON {\"prompt\":\"...\"}만 반환. 이미지에 한글 문장은 넣지 말라고 명시. 사용자가 준 스타일 가이드를 충실히 반영.",
        user: `슬라이드 제목: ${title}
${typeGuide}

스타일·생성 가이드:
${styleBlock}

보고서 요약/내용:
${context || "(내용 없음 — 타입 구조 중심으로 표현)"}

추가 연출: ${prompt || "없음"}

자율혁신계획서 핵심사업 '개요' 도식 톤으로, 구조가 분명한 장면 프롬프트를 한 문단으로 작성하세요.`,
        jsonMode: true,
      });
      try {
        prompt = JSON.parse(brief).prompt || brief;
      } catch {
        prompt = brief;
      }
    }

    if (!prompt) {
      return json(res, 400, { error: "생성할 주제(prompt) 또는 보고서 내용(context)이 필요합니다." });
    }

    const fullPrompt = `${prompt}\n\nDiagram type: ${reportTypeName}. ${reportTypeVisual}\n\nStyle guide:\n${styleBlock}`;
    const b64 = await openaiImage({ prompt: fullPrompt, size: "1536x1024" });

    return json(res, 200, {
      ok: true,
      title,
      reportTypeName,
      reportFrameName: reportFrameName || undefined,
      prompt: fullPrompt.slice(0, 500),
      imageBase64: b64,
      mime: "image/png",
    });
  } catch (err) {
    return json(res, err.status || 500, { error: err.message || "이미지 생성 실패" });
  }
}
