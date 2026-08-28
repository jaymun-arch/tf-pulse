/**
 * Local static + API server.
 * Loads OPENAI_API_KEY from project .env or %USERPROFILE%/Documents/api/.env
 */
import http from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadOpenAIKey } from "../api/_lib/openai.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const PORT = Number(process.env.PORT) || 5174;

loadOpenAIKey();

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".csv": "text/csv; charset=utf-8",
};

async function runApi(name, req, res) {
  const mod = await import(pathToFileURL(join(ROOT, "api", `${name}.js`)).href);
  return mod.default(req, res);
}

function sendFile(res, filePath) {
  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    res.statusCode = 404;
    res.end("Not found");
    return;
  }
  const ext = extname(filePath).toLowerCase();
  res.statusCode = 200;
  res.setHeader("Content-Type", MIME[ext] || "application/octet-stream");
  res.end(readFileSync(filePath));
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://127.0.0.1:${PORT}`);
    const path = url.pathname;

    if (path === "/api/analyze") return runApi("analyze", req, res);
    if (path === "/api/generate-image") return runApi("generate-image", req, res);
    if (path === "/api/review-summary") return runApi("review-summary", req, res);
    if (path === "/api/plan-diagram") return runApi("plan-diagram", req, res);
    if (path === "/api/learn-style") return runApi("learn-style", req, res);

    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS, GET");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
      return res.end();
    }

    let rel = decodeURIComponent(path === "/" ? "/index.html" : path);
    rel = normalize(rel).replace(/^(\.\.[/\\])+/, "").replace(/^[/\\]+/, "");
    const filePath = resolve(ROOT, rel);
    const rootWithSep = ROOT.endsWith("\\") || ROOT.endsWith("/") ? ROOT : ROOT + (process.platform === "win32" ? "\\" : "/");
    if (filePath !== ROOT && !filePath.startsWith(rootWithSep)) {
      res.statusCode = 403;
      return res.end("Forbidden");
    }
    sendFile(res, filePath);
  } catch (err) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ error: err.message || "server error" }));
  }
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`포트 ${PORT}가 이미 사용 중입니다. 기존 서버를 종료하거나 PORT를 바꿔 주세요.`);
  } else {
    console.error(err);
  }
  process.exit(1);
});

server.listen(PORT, "0.0.0.0", () => {
  const hasKey = Boolean(process.env.OPENAI_API_KEY);
  console.log(`TF Pulse → http://127.0.0.1:${PORT}/`);
  console.log(`OpenAI key: ${hasKey ? "loaded" : "MISSING (set .env)"}`);
});
