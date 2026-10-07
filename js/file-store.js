/**
 * 팀 공용 파일 저장소 (Vercel Blob) — 브라우저에서 바로 올린다.
 * 올린 파일은 링크(url)로 팀 데이터에 기록되어 모두가 열어 볼 수 있다.
 */

const CLIENT_CDN = "https://cdn.jsdelivr.net/npm/@vercel/blob@1.1.1/client/+esm";
const PDFJS_CDN = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.6.82/build/pdf.min.mjs";
const PDFJS_WORKER = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.6.82/build/pdf.worker.min.mjs";

let enabledCache = null;

/** 저장소가 연결되어 있는지 (한 번만 확인) */
export async function fileStoreEnabled() {
  if (enabledCache !== null) return enabledCache;
  try {
    const r = await fetch("/api/upload", { cache: "no-store" });
    enabledCache = r.ok ? Boolean((await r.json()).enabled) : false;
  } catch {
    enabledCache = false;
  }
  return enabledCache;
}

function safeName(name = "file") {
  const dot = name.lastIndexOf(".");
  const base = (dot > 0 ? name.slice(0, dot) : name).replace(/[^\w가-힣.\-]+/g, "_").slice(0, 60) || "file";
  const ext = dot > 0 ? name.slice(dot).toLowerCase() : "";
  return `${base}${ext}`;
}

/**
 * @param {File} file
 * @param {string} folder 예: "reports/r2/p1", "reviews"
 * @param {(pct:number)=>void} [onProgress]
 * @returns {Promise<{url:string,name:string,size:number,type:string,uploadedAt:string}>}
 */
export async function uploadTeamFile(file, folder, onProgress) {
  const { upload } = await import(CLIENT_CDN);
  const pathname = `tfpulse/${folder.replace(/[^\w\-/]/g, "_")}/${safeName(file.name)}`;
  const blob = await upload(pathname, file, {
    access: "public",
    handleUploadUrl: "/api/upload",
    multipart: file.size > 8 * 1024 * 1024,
    onUploadProgress: (e) => onProgress?.(Math.round(e.percentage || 0)),
  });
  return {
    url: blob.url,
    name: file.name,
    size: file.size,
    type: file.type || "",
    uploadedAt: new Date().toISOString(),
  };
}

/** PDF 쪽수 세기 (실패하면 0) */
export async function countPdfPages(file) {
  try {
    const pdfjs = await import(PDFJS_CDN);
    if (pdfjs.GlobalWorkerOptions) pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
    const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
    return doc.numPages || 0;
  } catch {
    return 0;
  }
}

export function formatBytes(n = 0) {
  if (n >= 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)}MB`;
  if (n >= 1024) return `${Math.round(n / 1024)}KB`;
  return `${n}B`;
}
