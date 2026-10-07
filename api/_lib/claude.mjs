import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";

/** Claude 모델 (Vercel 환경변수 CLAUDE_MODEL 로 바꿀 수 있음) */
export const CLAUDE_MODEL = process.env.CLAUDE_MODEL || "claude-opus-5-5";

let client = null;

export function hasClaudeKey() {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim() || process.env.ANTHROPIC_AUTH_TOKEN?.trim());
}

function getClient() {
  if (!hasClaudeKey()) {
    const err = new Error("ANTHROPIC_API_KEY가 없습니다. Vercel 환경변수에 Claude API 키를 설정해 주세요.");
    err.status = 503;
    throw err;
  }
  if (!client) client = new Anthropic();
  return client;
}

/**
 * zod 스키마로 구조화된 JSON 응답을 받는다.
 * 안전 분류기가 거절하면 서버 측 fallbacks("default")가 다른 모델로 이어서 응답한다.
 */
export async function claudeJson({ system, content, schema, effort = "medium", maxTokens = 16000 }) {
  let response;
  try {
    response = await getClient().beta.messages.parse({
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort, format: betaZodOutputFormat(schema) },
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content }],
    });
  } catch (err) {
    throw toFriendlyError(err);
  }

  if (response.stop_reason === "refusal") {
    const err = new Error("Claude가 이 요청을 처리하지 않았습니다. 내용을 조정해 다시 시도해 주세요.");
    err.status = 422;
    throw err;
  }
  if (response.stop_reason === "max_tokens") {
    const err = new Error("그림이 너무 복잡해 응답이 잘렸습니다. 내용을 줄여 다시 시도해 주세요.");
    err.status = 422;
    throw err;
  }
  if (!response.parsed_output) {
    const err = new Error("Claude 응답을 해석하지 못했습니다. 다시 시도해 주세요.");
    err.status = 502;
    throw err;
  }
  return response.parsed_output;
}

function toFriendlyError(err) {
  if (err?.status === 503 && !(err instanceof Anthropic.APIError)) return err;
  let out;
  if (err instanceof Anthropic.AuthenticationError) {
    out = new Error("Claude API 키가 올바르지 않습니다. Vercel 환경변수 ANTHROPIC_API_KEY를 확인해 주세요.");
    out.status = 500;
  } else if (err instanceof Anthropic.RateLimitError) {
    out = new Error("Claude 요청이 많습니다. 잠시 후 다시 시도해 주세요.");
    out.status = 429;
  } else if (err instanceof Anthropic.BadRequestError) {
    out = new Error(`Claude 요청 오류: ${err.message}`);
    out.status = 400;
  } else if (err instanceof Anthropic.APIError) {
    out = new Error(`Claude 서버 오류 (${err.status ?? "연결 실패"}). 잠시 후 다시 시도해 주세요.`);
    out.status = 502;
  } else {
    return err;
  }
  return out;
}

/** data:image/...;base64,xxx → Claude image 블록 (지원 형식만) */
export function imageBlockFromDataUrl(dataUrl) {
  const m = /^data:(image\/(?:png|jpeg|jpg|gif|webp));base64,([A-Za-z0-9+/=\s]+)$/i.exec(String(dataUrl || ""));
  if (!m) return null;
  const mediaType = m[1].toLowerCase() === "image/jpg" ? "image/jpeg" : m[1].toLowerCase();
  return { type: "image", source: { type: "base64", media_type: mediaType, data: m[2].replace(/\s+/g, "") } };
}
