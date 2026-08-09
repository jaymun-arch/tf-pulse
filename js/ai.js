/** Client helpers for AI analyze / art / PPT */

const API_BASE = "";

export async function callAiApi(path, payload) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `API 오류 (${res.status})`);
  return data;
}

export async function extractTextFromFile(file) {
  const name = file.name || "";
  const lower = name.toLowerCase();

  if (/\.(txt|md|csv)$/i.test(lower)) {
    return file.text();
  }

  if (/\.docx$/i.test(lower)) {
    const mammoth = await import("https://cdn.jsdelivr.net/npm/mammoth@1.8.0/+esm");
    const buf = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: buf });
    return (result.value || "").trim();
  }

  if (/\.hwpx$/i.test(lower)) {
    const JSZip = (await import("https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm")).default;
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const parts = [];
    const xmlFiles = Object.keys(zip.files).filter((p) => /Contents\/section\d+\.xml$/i.test(p) || /content\.xml$/i.test(p));
    for (const path of xmlFiles.sort()) {
      const xml = await zip.file(path).async("string");
      const text = xml
        .replace(/<[^>]+>/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/\s+/g, " ")
        .trim();
      if (text) parts.push(text);
    }
    return parts.join("\n\n").trim();
  }

  if (/\.pdf$/i.test(lower)) {
    return extractTextFromPdf(file);
  }

  if (/\.hwp$/i.test(lower)) {
    throw new Error(
      ".hwp(바이너리)는 브라우저에서 직접 추출이 어렵습니다. 한글에서 텍스트를 복사해 붙여넣거나 .hwpx/.docx/PDF로 저장 후 업로드해 주세요."
    );
  }

  // fallback: try utf-8 text
  const raw = await file.text();
  if (raw && /[가-힣A-Za-z]{20,}/.test(raw)) return raw;
  throw new Error("지원 형식: .pdf .txt .md .docx .hwpx (또는 텍스트 붙여넣기). .hwp는 텍스트 붙여넣기를 이용해 주세요.");
}

async function extractTextFromPdf(file) {
  const pdfjsLib = await import("https://cdn.jsdelivr.net/npm/pdfjs-dist@4.6.82/build/pdf.min.mjs");
  if (pdfjsLib.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.6.82/build/pdf.worker.min.mjs";
  }
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const maxPages = Math.min(pdf.numPages || 0, 40);
  const parts = [];
  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const line = (content.items || []).map((it) => it.str || "").join(" ");
    if (line.trim()) parts.push(line);
  }
  const text = parts.join("\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  if (text.length < 40) {
    throw new Error(
      "PDF에서 텍스트를 거의 추출하지 못했습니다. 스캔본이면 OCR 후 업로드하거나, 본문을 붙여넣어 주세요."
    );
  }
  return text;
}

export async function analyzeReportText(payload) {
  return callAiApi("/api/analyze", payload);
}

export async function analyzeReviewSummary(payload) {
  return callAiApi("/api/review-summary", payload);
}

export async function generateYeonsungImage(payload) {
  return callAiApi("/api/generate-image", payload);
}

export async function downloadImagesAsPpt({ title, slides }) {
  const PptxGenJS = (await import("https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/+esm")).default;
  const pptx = new PptxGenJS();
  pptx.author = "TF Pulse";
  pptx.title = title || "연성대 테마 보고서 그림";
  pptx.subject = "혁신지원사업 성과보고서 시각자료";

  slides.forEach((slide, i) => {
    const s = pptx.addSlide();
    s.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: "100%",
      h: "100%",
      fill: { color: "0B2C5F" },
    });
    s.addText(slide.title || `슬라이드 ${i + 1}`, {
      x: 0.4,
      y: 0.25,
      w: 9.2,
      h: 0.45,
      fontSize: 16,
      bold: true,
      color: "FFFFFF",
      fontFace: "Arial",
    });
    if (slide.imageBase64) {
      s.addImage({
        data: `image/png;base64,${slide.imageBase64}`,
        x: 0.5,
        y: 0.85,
        w: 9,
        h: 4.5,
      });
    }
    s.addText("연성대학교 테마 · TF Pulse 자동생성 · 수정하여 활용하세요", {
      x: 0.4,
      y: 5.45,
      w: 9.2,
      h: 0.3,
      fontSize: 10,
      color: "A8C4E8",
    });
  });

  const safe = (title || "tf-yeonsung-art").replace(/[\\/:*?"<>|]/g, "_");
  await pptx.writeFile({ fileName: `${safe}.pptx` });
}
