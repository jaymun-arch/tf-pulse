import { json, readJsonBody, openaiImage, openaiChat } from "./_lib/openai.mjs";

/** 연성대 자율혁신계획서 도식 스타일 — 흑백·공공보고서 톤 */
const YEONSUNG_REPORT_DIAGRAM_STYLE = `
연성대학교 전문대학 혁신지원사업 자율혁신계획서에 실린 공식 도식 스타일.
레이아웃: 인쇄용 흑백 보고서 개념도·추진체계도. 섹션번호, 중첩 사각 박스, 블록 화살표, 단계 원배지.
색: 블랙·화이트·그레이만 (#1A1A1A, #333, #4A4A4A, #777, #CCC, #F0F0F0, #FFF). 네이비·블루·컬러·그라데이션·네온·3D 금지.
요소: 직각/약한 라운드 박스, 얇은 검정 외곽선, 회색 헤더 바(흰 글씨). 아이콘은 단색 라인만.
금지: 사진, 화려한 인포그래픽, 어두운 배경, 컬러 강조, 로고·워터마크, 긴 문장 텍스트.
완성도: 한글 보고서(HWP)에 붙일 수 있는 절제된 공공문서 도식. 가로형, 흰 배경, 높은 대비.
`.replace(/\s+/g, " ").trim();

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return json(res, 204, {});
  if (req.method !== "POST") return json(res, 405, { error: "POST only" });

  try {
    const body = typeof req.body === "object" && req.body ? req.body : await readJsonBody(req);
    let prompt = String(body.prompt || "").trim();
    const plannedPrompt = String(body.plannedPrompt || body.imagePrompt || "").trim();
    const context = String(body.context || "").trim().slice(0, 4000);
    const title = String(body.title || "성과 하이라이트").trim();
    const purpose = String(body.purpose || "").trim();
    const keyMessages = Array.isArray(body.keyMessages) ? body.keyMessages.slice(0, 5) : [];
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
      purpose ? `도식 목적: ${purpose}` : "",
      keyMessages.length ? `핵심 메시지: ${keyMessages.join(" / ")}` : "",
      "연성대 자율혁신계획서의 개요·추진체계 도식처럼 구조가 한눈에 보이게 표현.",
    ]
      .filter(Boolean)
      .join("\n");

    // 이미 기획된 프롬프트가 있으면 재사용, 없으면 GPT로 구조 사고 후 프롬프트 생성
    if (plannedPrompt) {
      prompt = plannedPrompt;
    } else if (!prompt || context || purpose) {
      const brief = await openaiChat({
        system: `대학 혁신지원사업 계획서용 흑백(그레이스케일) 공식 도식 이미지 프롬프트를 만듭니다.
사고: 목적→핵심요소→레이아웃→금칙 점검 순으로 생각한 뒤 프롬프트를 작성하세요.
컬러·네이비 배경 금지. 흰 바탕에 검정/회색 박스·블록화살표·원형 단계배지만.
이미지에 긴 한글 문장 금지(짧은 라벨만). JSON {"prompt":"...","focus":"한줄 초점"}만 반환.`,
        user: `슬라이드 제목: ${title}
${typeGuide}

스타일·생성 가이드:
${styleBlock}

보고서 요약/내용:
${context || "(내용 없음 — 타입 구조 중심으로 표현)"}

추가 연출: ${prompt || "없음"}

자율혁신계획서 핵심사업 도식 톤으로, 구조가 분명한 장면 프롬프트를 영어로 한 문단 작성하세요.`,
        jsonMode: true,
        temperature: 0.35,
      });
      try {
        const parsed = JSON.parse(brief);
        prompt = parsed.prompt || brief;
      } catch {
        prompt = brief;
      }
    }

    if (!prompt) {
      return json(res, 400, { error: "생성할 주제(prompt) 또는 보고서 내용(context)이 필요합니다." });
    }

    const fullPrompt = [
      prompt,
      `Diagram type: ${reportTypeName}. ${reportTypeVisual}`,
      purpose ? `Purpose: ${purpose}` : "",
      keyMessages.length ? `Key labels to emphasize: ${keyMessages.join("; ")}` : "",
      `Style guide:\n${styleBlock}`,
      "Strictly monochrome grayscale institutional report diagram on white background. No color, no navy, no 3D, no photos, no watermarks.",
    ]
      .filter(Boolean)
      .join("\n\n");

    const b64 = await openaiImage({ prompt: fullPrompt, size: "1536x1024" });

    return json(res, 200, {
      ok: true,
      title,
      reportTypeName,
      reportFrameName: reportFrameName || undefined,
      purpose: purpose || undefined,
      prompt: fullPrompt.slice(0, 600),
      imageBase64: b64,
      mime: "image/png",
    });
  } catch (err) {
    return json(res, err.status || 500, { error: err.message || "이미지 생성 실패" });
  }
}
