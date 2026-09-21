import { readJsonBody } from "./_lib/openai.mjs";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * 공용 데이터 저장소 API.
 * - 운영(Vercel)에서는 Vercel Storage로 연결한 Upstash Redis(REST)를 사용합니다.
 *   Storage 탭에서 "Upstash for Redis"를 연결하면 아래 환경변수가 자동으로 주입됩니다:
 *   KV_REST_API_URL / KV_REST_API_TOKEN  (또는 UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN)
 * - 로컬 개발(npm start)에서는 이 환경변수가 없으므로, 프로젝트 루트의
 *   data/.local-state.json 파일에 저장해 서버 없이도 흐름을 테스트할 수 있습니다.
 */

const STATE_KEY = "tfpulse:state:v1";
const __dirname = dirname(fileURLToPath(import.meta.url));
const LOCAL_STATE_FILE = resolve(__dirname, "..", "data", ".local-state.json");

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.end(JSON.stringify(body));
}

function redisConfig() {
  const url =
    process.env.KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.REDIS_REST_URL ||
    "";
  const token =
    process.env.KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.REDIS_REST_TOKEN ||
    "";
  return { url, token };
}

async function redisCommand(url, token, command) {
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`redis ${command[0]} 실패 (${resp.status}) ${text.slice(0, 200)}`);
  }
  return resp.json();
}

function readLocalState() {
  if (!existsSync(LOCAL_STATE_FILE)) return null;
  try {
    const raw = readFileSync(LOCAL_STATE_FILE, "utf8");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeLocalState(state) {
  mkdirSync(dirname(LOCAL_STATE_FILE), { recursive: true });
  writeFileSync(LOCAL_STATE_FILE, JSON.stringify(state), "utf8");
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return json(res, 204, {});

  const { url, token } = redisConfig();
  const useRedis = Boolean(url && token);
  const isVercel = Boolean(process.env.VERCEL);

  if (!useRedis && isVercel) {
    return json(res, 500, {
      error:
        "공용 저장소가 연결되지 않았습니다. Vercel 프로젝트의 Storage 탭에서 Upstash for Redis를 연결한 뒤 다시 배포해 주세요.",
    });
  }

  try {
    if (req.method === "GET") {
      if (useRedis) {
        const r = await redisCommand(url, token, ["GET", STATE_KEY]);
        const raw = r?.result;
        return json(res, 200, { state: raw ? JSON.parse(raw) : null, backend: "redis" });
      }
      return json(res, 200, { state: readLocalState(), backend: "local-file" });
    }

    if (req.method === "POST" || req.method === "PUT") {
      const body = typeof req.body === "object" && req.body ? req.body : await readJsonBody(req);
      const state = body?.state;
      if (!state || typeof state !== "object") {
        return json(res, 400, { error: "state가 필요합니다." });
      }
      const payload = JSON.stringify(state);
      if (payload.length > 4_000_000) {
        return json(res, 413, { error: "저장할 데이터가 너무 큽니다 (4MB 초과)." });
      }
      if (useRedis) {
        await redisCommand(url, token, ["SET", STATE_KEY, payload]);
      } else {
        writeLocalState(state);
      }
      return json(res, 200, { ok: true, savedAt: new Date().toISOString(), backend: useRedis ? "redis" : "local-file" });
    }

    return json(res, 405, { error: "GET/POST only" });
  } catch (err) {
    return json(res, 500, { error: err.message || "server error" });
  }
}
