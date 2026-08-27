import { json, readJsonBody, openaiChat } from "./_lib/openai.mjs";

/** 도식 타입별 labels 스키마 안내 (편집용 PPT 빌더와 1:1) */
const LABEL_SCHEMAS = {
  overview: `{
  "topTitle": "상단 헤더 한 줄",
  "cols": [
    {"h":"열 제목","items":["항목1","항목2","항목3"]},
    {"h":"...","items":["...","...","..."]},
    {"h":"...","items":["...","...","..."]},
    {"h":"...","items":["...","...","..."]}
  ],
  "bottom": "하단 요약 한 줄",
  "p1": {"t":"패널1 제목","d":"설명"},
  "p2": {"t":"패널2 제목","d":"설명","chips":["기반","확산","안착"]},
  "p3": {"t":"패널3 제목","d":"설명"}
}`,
  governance: `{
  "steps": ["단계1","단계2","단계3","단계4","단계5"],
  "timeline": ["경로1","경로2","경로3","경로4","경로5","경로6","경로7"]
}`,
  certification: `{
  "levels": [
    {"t":"기본","d":"설명 한두 줄"},
    {"t":"품질","d":"..."},
    {"t":"혁신","d":"..."}
  ]
}`,
  "icc-matrix": `{
  "cells": [["좌상","우상"],["좌하","우하"]],
  "points": ["포인트1","포인트2","포인트3","포인트4"],
  "strat": ["전략1","전략2","전략3"]
}`,
  platform: `{
  "hub": "중앙 플랫폼명\\n(두 줄 가능)",
  "nodes": [
    {"t":"프로그램1","d":"한 줄 설명"},
    {"t":"프로그램2","d":"..."},
    {"t":"프로그램3","d":"..."},
    {"t":"프로그램4","d":"..."}
  ]
}`,
  diffusion: `{
  "items": ["단계1","단계2","단계3","단계4"]
}`,
  improvement: `{
  "years": [
    {"y":"2025","v":"기반","n":"지표/수치"},
    {"y":"2026","v":"확산","n":"..."},
    {"y":"2027","v":"고도화","n":"..."}
  ],
  "comps": [
    {"t":"본교","v":"수치","dark":true},
    {"t":"전국 평균","v":"수치","dark":false},
    {"t":"수도권 평균","v":"수치","dark":false}
  ]
}`,
  roadmap: `{
  "vision": "비전 한 줄",
  "goal": "목표 한 줄",
  "pillars": [
    {"t":"축1","d":"요약"},
    {"t":"축2","d":"요약"},
    {"t":"축3","d":"요약"}
  ]
}`,
};

const SYSTEM = `당신은 연성대학교 혁신지원사업·자율혁신계획서/성과보고서용 흑백 공식 도식을 설계하는 시니어 컨설턴트입니다.

사고 절차(반드시 준수):
1) 목적 파악: 이 도식이 보고서에서 무엇을 설득·설명해야 하는지 한 문장으로 정리
2) 학습 레퍼런스: styleGuide에 【양식 학습 레퍼런스】가 있으면 해당 톤·밀도·구조를 우선 따른다
3) 핵심 추출: 입력 내용에서 키워드·주체·단계·지표만 골라낸다 (장황한 문장 금지)
4) 구조 매핑: 선택한 도식 타입의 칸에 맞게 배치한다
5) 검증: 칸 수·글자 수·흑백 공공문서 톤에 맞는지 점검

출력 규칙:
- JSON만 반환
- labels의 각 칸은 짧고 구체적(한글 명사·짧은 구 위주, 한 칸 15자 내외 권장)
- 내용이 부족하면 해당 분야에 맞는 합리적 플레이스홀더를 (__ ) 대신 실제 예시 문구로 채운다
- imagePrompt는 영어, 흑백 grayscale institutional report diagram, white background, no navy/color/3D/photo
- 긴 문장·이모지·컬러 지시 금지

JSON 스키마:
{
  "reasoning": "2~4문장 한국어 사고 요약",
  "purpose": "보고서에서의 역할 한 줄",
  "title": "슬라이드 제목",
  "keyMessages": ["메시지1","메시지2","메시지3"],
  "labels": { ... 타입별 스키마 ... },
  "imagePrompt": "영어 이미지 생성 프롬프트 1문단"
}`;

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return json(res, 204, {});
  if (req.method !== "POST") return json(res, 405, { error: "POST only" });

  try {
    const body = typeof req.body === "object" && req.body ? req.body : await readJsonBody(req);
    const title = String(body.title || "").trim().slice(0, 120);
    const context = String(body.context || "").trim().slice(0, 6000);
    const prompt = String(body.prompt || "").trim().slice(0, 800);
    const styleGuide = String(body.styleGuide || "").trim().slice(0, 2500);
    const reportFrameName = String(body.reportFrameName || "").trim();
    const reportType = String(body.reportType || "overview").trim();
    const reportTypeName = String(body.reportTypeName || "").trim();
    const reportTypeDesc = String(body.reportTypeDesc || "").trim();
    const reportTypeVisual = String(body.reportTypeVisual || "").trim();

    const schema = LABEL_SCHEMAS[reportType] || LABEL_SCHEMAS.overview;

    const user = `슬라이드 가제목: ${title || reportTypeName || "도식"}
작성 방향 틀: ${reportFrameName || "(미지정)"}
도식 타입 id: ${reportType}
도식 타입명: ${reportTypeName}
타입 설명: ${reportTypeDesc}
시각 구조: ${reportTypeVisual}

스타일 가이드:
${styleGuide || "(흑백 공공보고서 도식)"}

보고서 내용/요약:
${context || "(내용 부족 — 타입·틀에 맞는 대표 구조로 설계)"}

추가 연출/지시:
${prompt || "없음"}

이 타입의 labels JSON 형태(반드시 이 키 구조를 지키세요):
${schema}

위 절차대로 사고한 뒤 JSON을 작성하세요.`;

    const raw = await openaiChat({
      system: SYSTEM,
      user,
      jsonMode: true,
      temperature: 0.35,
    });

    let plan;
    try {
      plan = JSON.parse(raw);
    } catch {
      const err = new Error("도식 기획 응답을 해석하지 못했습니다.");
      err.status = 502;
      throw err;
    }

    if (!plan || typeof plan !== "object") {
      const err = new Error("도식 기획 결과가 비어 있습니다.");
      err.status = 502;
      throw err;
    }

    const labels = plan.labels && typeof plan.labels === "object" ? plan.labels : {};
    return json(res, 200, {
      ok: true,
      reasoning: String(plan.reasoning || "").slice(0, 800),
      purpose: String(plan.purpose || "").slice(0, 200),
      title: String(plan.title || title || reportTypeName || "보고서 도식").slice(0, 120),
      keyMessages: Array.isArray(plan.keyMessages)
        ? plan.keyMessages.map((m) => String(m).slice(0, 80)).slice(0, 5)
        : [],
      labels,
      imagePrompt: String(plan.imagePrompt || "").slice(0, 1800),
      reportType,
      reportTypeName,
      reportFrameName: reportFrameName || undefined,
    });
  } catch (err) {
    return json(res, err.status || 500, { error: err.message || "도식 기획 실패" });
  }
}
