/**
 * POST /api/draw-diagram — Claude가 보고서 핵심 도식을 SVG로 직접 그린다.
 *
 * 요청: {
 *   direction,               // 넣고 싶은 내용 (필수)
 *   frameName, frameDesc,    // 보고서 영역
 *   layoutName, layoutDesc,  // 고른 레이아웃
 *   typeName, typeDesc, typeVisual, // 도식 유형
 *   variantLabel, variantHint, docKindName,
 *   styleGuide,              // 연성대 스타일 가이드 + 학습 레퍼런스 텍스트
 *   references: [{ title, cues, summary, imageDataUrl }], // 양식학습 이미지 (최대 3)
 *   previousSvg, feedback    // 고쳐 그리기
 * }
 * 응답: { svg, title, caption, purpose, reasoning, keyMessages, model }
 */
import { z } from "zod";
import { json, readJsonBody } from "./_lib/openai.mjs";
import { claudeJson, imageBlockFromDataUrl, hasClaudeKey, CLAUDE_MODEL } from "./_lib/claude.mjs";

const Figure = z.object({
  title: z.string(),
  purpose: z.string(),
  reasoning: z.string(),
  keyMessages: z.array(z.string()),
  caption: z.string(),
  svg: z.string(),
});

const SYSTEM = `당신은 대학 재정지원사업(전문대학 혁신지원사업·RISE·신산업 등) 계획서·결과보고서의 도식을 그리는 수석 편집 디자이너입니다.
담당자가 적은 내용을 한글 보고서에 바로 넣을 수 있는 완성 도식 한 장으로 그립니다. 결과물은 SVG 코드입니다.

## 그리는 순서
1. 이 그림이 심사위원에게 설득해야 할 한 가지를 정합니다(purpose).
2. 내용에서 주체·단계·지표·수치만 뽑습니다. 문장은 짧은 명사구로 줄입니다.
3. 고른 레이아웃·도식 유형의 구조에 배치합니다. 위계(제목 → 핵심 → 세부)가 한눈에 보이게 합니다.
4. 양식학습 레퍼런스 그림이 있으면 그 톤·선 굵기·박스 모양·밀도·여백을 가장 우선해서 따라 합니다.
5. 다 그린 뒤 글자 겹침, 박스 밖으로 넘친 글자, 정렬 어긋남을 점검하고 고칩니다.

## SVG 규칙 (반드시)
- 루트: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="1600" height="900">. 첫 요소로 흰 배경 rect.
- 색: 흑백·회색만(#000000~#FFFFFF). 강조는 진한 회색(#1A1A1A, #333333) 채움 + 흰 글자, 보조는 연회색(#F2F2F2, #E6E6E6) 채움.
- 글꼴: font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif". 제목 40~48, 박스 제목 26~32, 본문 20~24. 20보다 작은 글자 금지.
- 글자는 <text>/<tspan>만 사용. 긴 문구는 tspan으로 줄바꿈하고, 한 줄이 들어갈 박스 너비를 글자 수 × 글자 크기로 계산해 넘치지 않게 합니다.
- 화살표는 <defs><marker>로 정의해 재사용. 선 굵기 2~4.
- 금지: <script>, <foreignObject>, <image>, <iframe>, 외부 링크·href, on으로 시작하는 속성, CSS @import, 웹폰트, 그라데이션 애니메이션.
- 여백: 바깥 여백 최소 60px. 요소끼리 최소 16px 간격.
- 맨 위에 그림 제목(title)과 얇은 구분선. 맨 아래에 출처·주석 한 줄이 필요하면 회색 20px.

## 내용 규칙
- 담당자가 적은 사실과 수치만 씁니다. 수치가 없으면 지어내지 말고 "○○%", "○○명"처럼 빈칸으로 둡니다.
- 한국어 공공보고서 문체(명사형 종결: ~강화, ~구축, ~확대).
- caption: 보고서 그림 아래에 붙일 캡션 한 줄(예: "[그림 Ⅲ-2] 3개년 성과지표 달성 경로").
- reasoning: 왜 이 구조로 그렸는지 2문장. keyMessages: 그림이 전달하는 핵심 3개(각 20자 내외).`;

const MAX_REFS = 3;

function str(v, max) {
  return String(v ?? "").trim().slice(0, max);
}

/** 혹시 섞여 들어온 실행 요소를 제거한다. (화면에서는 <img>로만 보여 주므로 이중 안전장치) */
export function sanitizeSvg(raw) {
  let svg = String(raw || "").trim();
  svg = svg.replace(/^```(?:svg|xml)?\s*/i, "").replace(/```\s*$/i, "").trim();
  const start = svg.indexOf("<svg");
  const end = svg.lastIndexOf("</svg>");
  if (start < 0 || end < 0) return "";
  svg = svg.slice(start, end + 6);
  svg = svg
    .replace(/<script[\s\S]*?<\/script\s*>/gi, "")
    .replace(/<script[^>]*\/>/gi, "")
    .replace(/<foreignObject[\s\S]*?<\/foreignObject\s*>/gi, "")
    .replace(/<(iframe|image|a)\b[^>]*\/>/gi, "")
    .replace(/<(iframe|image|a)\b[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*')/gi, "")
    .replace(/\s(?:xlink:)?href\s*=\s*("(?!#)[^"]*"|'(?!#)[^']*')/gi, "")
    .replace(/@import[^;]*;/gi, "");
  if (!/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/.test(svg)) {
    svg = svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  return svg;
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return json(res, 204, {});
  // 화면이 「AI로 더 잘 그리기」 버튼을 보여 줄지 확인용 (키 값은 절대 내보내지 않음)
  if (req.method === "GET") return json(res, 200, { enabled: hasClaudeKey() });
  if (req.method !== "POST") return json(res, 405, { error: "POST only" });

  try {
    const body = typeof req.body === "object" && req.body ? req.body : await readJsonBody(req);
    const direction = str(body.direction, 6000);
    if (direction.length < 4) return json(res, 400, { error: "넣고 싶은 내용을 적어 주세요." });

    const refs = (Array.isArray(body.references) ? body.references : []).slice(0, MAX_REFS);
    const content = [];

    refs.forEach((r, i) => {
      const img = imageBlockFromDataUrl(r?.imageDataUrl);
      if (!img) return;
      content.push({
        type: "text",
        text: `[양식학습 레퍼런스 ${i + 1}] ${str(r.title, 80)}\n시각 특징: ${(Array.isArray(r.cues) ? r.cues : []).slice(0, 6).join(", ")}${r.summary ? `\n배울 점: ${str(r.summary, 300)}` : ""}`,
      });
      content.push(img);
    });

    const previousSvg = sanitizeSvg(body.previousSvg).slice(0, 60000);
    const feedback = str(body.feedback, 1500);

    const brief = [
      `보고서 종류: ${str(body.docKindName, 40) || "운영계획서"}`,
      `보고서 영역: ${str(body.frameName, 80) || "-"}${body.frameDesc ? ` — ${str(body.frameDesc, 200)}` : ""}`,
      `레이아웃: ${str(body.layoutName, 60) || "-"}${body.layoutDesc ? ` — ${str(body.layoutDesc, 200)}` : ""}`,
      `도식 유형: ${str(body.typeName, 60) || "-"}${body.typeDesc ? ` — ${str(body.typeDesc, 200)}` : ""}`,
      body.typeVisual ? `도식 시각 구조: ${str(body.typeVisual, 300)}` : "",
      `스타일: ${str(body.variantLabel, 30) || "공공문서형"}${body.variantHint ? ` (${str(body.variantHint, 120)})` : ""}`,
      body.styleGuide ? `\n<스타일 가이드>\n${str(body.styleGuide, 6000)}\n</스타일 가이드>` : "",
      `\n<넣고 싶은 내용>\n${direction}\n</넣고 싶은 내용>`,
    ]
      .filter(Boolean)
      .join("\n");

    content.push({ type: "text", text: brief });

    if (previousSvg && feedback) {
      content.push({
        type: "text",
        text: `<이전 그림>\n${previousSvg}\n</이전 그림>\n\n<고칠 점>\n${feedback}\n</고칠 점>\n\n이전 그림의 좋은 부분은 유지하고, 고칠 점을 반영해 다시 그려 주세요.`,
      });
    } else {
      content.push({ type: "text", text: "위 내용으로 보고서 핵심 도식 한 장을 그려 주세요." });
    }

    const out = await claudeJson({ system: SYSTEM, content, schema: Figure, effort: "medium", maxTokens: 20000 });
    const svg = sanitizeSvg(out.svg);
    if (!svg) return json(res, 502, { error: "그림(SVG)을 만들지 못했습니다. 다시 시도해 주세요." });

    return json(res, 200, {
      svg,
      title: str(out.title, 120),
      caption: str(out.caption, 160),
      purpose: str(out.purpose, 300),
      reasoning: str(out.reasoning, 600),
      keyMessages: (out.keyMessages || []).slice(0, 5).map((m) => str(m, 60)),
      references: refs.length,
      model: CLAUDE_MODEL,
    });
  } catch (err) {
    return json(res, err.status || 500, { error: err.message || "그림 생성 실패" });
  }
}
