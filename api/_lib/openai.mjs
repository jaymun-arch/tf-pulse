import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));

function parseEnvFile(text) {
  const out = {};
  const cleaned = String(text || "").replace(/^\uFEFF/, "");
  for (const line of cleaned.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const m = t.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[m[1]] = v;
  }
  return out;
}

function applyEnvFile(file) {
  if (!existsSync(file)) return false;
  try {
    const env = parseEnvFile(readFileSync(file, "utf8"));
    let applied = false;
    for (const [k, v] of Object.entries(env)) {
      if (!v) continue;
      if (!process.env[k]) {
        process.env[k] = v;
        applied = true;
      }
    }
    return applied || Boolean(env.OPENAI_API_KEY);
  } catch {
    return false;
  }
}

/** Load OPENAI_API_KEY from process.env, project .env, or Documents/api/.env */
export function loadOpenAIKey() {
  if (process.env.OPENAI_API_KEY?.trim()) {
    return process.env.OPENAI_API_KEY.trim();
  }

  const candidates = [
    resolve(process.cwd(), ".env"),
    resolve(process.cwd(), ".env.local"),
    resolve(__dirname, "../../.env"),
    resolve(__dirname, "../../.env.local"),
    resolve(homedir(), "Documents", "api", ".env"),
    "C:/Users/user/Documents/api/.env",
  ];

  for (const file of candidates) {
    applyEnvFile(file);
    if (process.env.OPENAI_API_KEY?.trim()) {
      return process.env.OPENAI_API_KEY.trim();
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

export async function openaiVision({ system, text, imageDataUrl, jsonMode = true, temperature = 0.2 }) {
  const key = loadOpenAIKey();
  if (!key) {
    const err = new Error("OPENAI_API_KEY가 없습니다. Documents/api/.env 또는 Vercel 환경변수를 설정해 주세요.");
    err.status = 500;
    throw err;
  }
  const body = {
    model: "gpt-4o-mini",
    temperature,
    messages: [
      { role: "system", content: system },
      {
        role: "user",
        content: [
          { type: "text", text },
          { type: "image_url", image_url: { url: imageDataUrl } },
        ],
      },
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

export async function openaiChat({ system, user, jsonMode = true, temperature = 0.3 }) {
  const key = loadOpenAIKey();
  if (!key) {
    const err = new Error("OPENAI_API_KEY가 없습니다. Documents/api/.env 또는 Vercel 환경변수를 설정해 주세요.");
    err.status = 500;
    throw err;
  }
  const body = {
    model: "gpt-4o-mini",
    temperature,
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
    const err = new Error("OPENAI_API_KEY가 없습니다. Documents/api/.env 또는 Vercel 환경변수를 설정해 주세요.");
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
