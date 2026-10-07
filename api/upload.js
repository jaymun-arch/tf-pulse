/**
 * 파일 올리기 허가증 발급 — Vercel Blob(파일 저장소)
 *
 * GET  /api/upload → { enabled }  (저장소가 연결됐는지 화면에서 확인)
 * POST /api/upload ← @vercel/blob/client 의 upload() 가 보내는 요청
 *      → { type, clientToken }  (브라우저가 이 허가증으로 저장소에 바로 올린다)
 *
 * 저장소 연결: Vercel 대시보드 → Storage → Blob 만들기 → 이 프로젝트에 연결
 * (BLOB_READ_WRITE_TOKEN 이 자동으로 들어온다)
 */
import { generateClientTokenFromReadWriteToken } from "@vercel/blob/client";
import { readJsonBody } from "./_lib/openai.mjs";

const ALLOWED_EXT = /\.(hwp|hwpx|pdf|png|jpe?g|gif|webp)$/i;
const MAX_BYTES = 50 * 1024 * 1024; // 한 파일 50MB

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

export default async function handler(req, res) {
  const enabled = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

  if (req.method === "GET") return json(res, 200, { enabled });
  if (req.method !== "POST") return json(res, 405, { error: "GET/POST only" });
  if (!enabled) {
    return json(res, 503, {
      error: "파일 저장소가 아직 연결되지 않았습니다. Vercel 대시보드에서 Storage → Blob 을 이 프로젝트에 연결해 주세요.",
    });
  }

  try {
    const body = typeof req.body === "object" && req.body ? req.body : await readJsonBody(req);

    // 업로드가 끝났다는 알림 (지금은 따로 할 일이 없다)
    if (body?.type === "blob.upload-completed") return json(res, 200, { response: "ok" });

    if (body?.type !== "blob.generate-client-token") return json(res, 400, { error: "알 수 없는 요청입니다." });

    const pathname = String(body.payload?.pathname || "");
    if (!pathname.startsWith("tfpulse/") || pathname.includes("..") || !ALLOWED_EXT.test(pathname)) {
      return json(res, 400, { error: "한글(hwp·hwpx), PDF, 그림(png·jpg·gif·webp) 파일만 올릴 수 있습니다." });
    }

    const clientToken = await generateClientTokenFromReadWriteToken({
      pathname,
      maximumSizeInBytes: MAX_BYTES,
      addRandomSuffix: true,
      validUntil: Date.now() + 10 * 60 * 1000,
    });
    return json(res, 200, { type: "blob.generate-client-token", clientToken });
  } catch (err) {
    return json(res, 500, { error: err.message || "파일 올리기 준비에 실패했습니다." });
  }
}
