import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Load OPENAI_API_KEY from process.env, local .env, or Documents/api/.env */
export function loadOpenAIKey() {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY.trim();

  const candidates = [
    resolve(process.cwd(), ".env"),
    resolve(__dirname, "../../.env"),
    resolve("C:/Users/user/Documents/api/.env"),
  ];

  for (const file of candidates) {
    try {
      if (!existsSync(file)) continue;
      const text = readFileSync(file, "utf8");
      const m = text.match(/^\s*OPENAI_API_KEY\s*=\s*(.+)\s*$/m);
      if (m) {
        const key = m[1].trim().replace(/^["']|["']$/g, "");
        if (key) {
          process.env.OPENAI_API_KEY = key;
          return key;
        }
      }
    } catch {
      /* continue */
    }
  }
  return "";
}

export function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.end(JSON.stringify(body));
}

export async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  return JSON.parse(raw);
}

export async function openaiChat({ system, user, jsonMode = true }) {
  const key = loadOpenAIKey();
  if (!key) {
    const err = new Error("OPENAI_API_KEY가 없습니다. .env 또는 Vercel 환경변수를 설정해 주세요.");
    err.status = 500;
    throw err;
  }
  const body = {
    model: "gpt-4o-mini",
    temperature: 0.3,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  };
  if (jsonMode) body.response_format = { type: "json_object" };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.error?.message || `OpenAI 오류 (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data.choices?.[0]?.message?.content || "";
}

export async function openaiImage({ prompt, size = "1024x1024" }) {
  const key = loadOpenAIKey();
  if (!key) {
    const err = new Error("OPENAI_API_KEY가 없습니다. .env 또는 Vercel 환경변수를 설정해 주세요.");
    err.status = 500;
    throw err;
  }
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt,
      size,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.error?.message || `이미지 생성 오류 (${res.status})`);
    err.status = res.status;
    throw err;
  }
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) {
    const err = new Error("이미지 데이터가 비어 있습니다.");
    err.status = 502;
    throw err;
  }
  return b64;
}
