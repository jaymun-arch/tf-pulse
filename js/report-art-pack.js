/**
 * 보고서 그림 전체 재료 패키지 PPT
 * - 양식 레이아웃(표·조직·SWOT·타임라인·예산 등) + 도식 키트(8종)를 한 파일로
 */
import { REPORT_LAYOUTS, appendLayoutDeck } from "./report-layouts.js";
import { appendDiagramMaterialsDeck, DIAGRAM_MATERIALS } from "./report-diagrams.js";

async function loadPptx() {
  const PptxGenJS = (await import("https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/+esm")).default;
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "LAYOUT_16x9", width: 10, height: 5.625 });
  pptx.layout = "LAYOUT_16x9";
  pptx.author = "TF Pulse";
  pptx.subject = "연성대 보고서 그림 재료 패키지";
  return pptx;
}

/**
 * @param {{
 *  layoutIds?: string[],
 *  chapterNo?: string,
 *  typeId?: string,
 *  title?: string,
 *  labels?: object,
 *  fileName?: string,
 *  docKindName?: string,
 * }} opts
 */
export async function downloadReportArtPackagePpt(opts = {}) {
  const layoutIds =
    Array.isArray(opts.layoutIds) && opts.layoutIds.length
      ? opts.layoutIds
      : REPORT_LAYOUTS.map((l) => l.id);
  const typeId = opts.typeId || "overview";
  const title = opts.title || "보고서 그림 재료";
  const pptx = await loadPptx();
  pptx.title = title;

  const cover = pptx.addSlide();
  cover.addShape("rect", { x: 0, y: 0, w: 10, h: 5.625, fill: { color: "FFFFFF" } });
  cover.addShape("rect", { x: 0, y: 0, w: 0.18, h: 5.625, fill: { color: "333333" } });
  cover.addText("연성대학교 · TF Pulse", {
    x: 0.7,
    y: 1.15,
    w: 8.5,
    h: 0.35,
    fontSize: 13,
    color: "777777",
    fontFace: "Malgun Gothic",
  });
  cover.addText("보고서 그림 전체 재료 패키지", {
    x: 0.7,
    y: 1.6,
    w: 8.5,
    h: 0.55,
    fontSize: 26,
    bold: true,
    color: "1A1A1A",
    fontFace: "Malgun Gothic",
  });
  cover.addText(
    `${opts.docKindName || "운영계획서/결과보고서"}용 기본 재료\n양식 레이아웃 ${layoutIds.length}종 + 도식 ${DIAGRAM_MATERIALS.length}종\n담당자는 슬라이드를 골라 수치·문장만 바꿔 상세 그림을 완성합니다.`,
    {
      x: 0.7,
      y: 2.4,
      w: 8.3,
      h: 1.4,
      fontSize: 14,
      color: "444444",
      fontFace: "Malgun Gothic",
    }
  );
  cover.addText("흐름  ① 양식 레이아웃  →  ② 도식 재료  →  ③ 상세 수정 후 한글 삽입", {
    x: 0.7,
    y: 4.2,
    w: 8.5,
    h: 0.35,
    fontSize: 12,
    bold: true,
    color: "333333",
    fontFace: "Malgun Gothic",
  });

  const flow = pptx.addSlide();
  flow.addShape("rect", { x: 0, y: 0, w: 10, h: 5.625, fill: { color: "FFFFFF" } });
  flow.addText("한눈에 보는 작업 흐름", {
    x: 0.5,
    y: 0.35,
    w: 9,
    h: 0.4,
    fontSize: 20,
    bold: true,
    color: "1A1A1A",
    fontFace: "Malgun Gothic",
  });
  const steps = [
    { n: "1", t: "양식 고르기", d: "표·요약·조직·SWOT\n타임라인·예산 레이아웃" },
    { n: "2", t: "도식 고르기", d: "개요·거버넌스·매트릭스\n플랫폼·로드맵 등" },
    { n: "3", t: "내용 채우기", d: "수치·문장·담당\n실제 데이터로 교체" },
    { n: "4", t: "한글 삽입", d: "슬라이드 복사 또는\n그림 내보내기" },
  ];
  steps.forEach((st, i) => {
    const x = 0.4 + i * 2.4;
    flow.addShape("roundRect", {
      x,
      y: 1.3,
      w: 2.2,
      h: 2.8,
      fill: { color: "F5F5F5" },
      line: { color: "BDBDBD", width: 1 },
      rectRadius: 0.08,
    });
    flow.addShape("ellipse", {
      x: x + 0.75,
      y: 1.55,
      w: 0.7,
      h: 0.7,
      fill: { color: "333333" },
      line: { color: "333333" },
    });
    flow.addText(st.n, {
      x: x + 0.75,
      y: 1.55,
      w: 0.7,
      h: 0.7,
      align: "center",
      valign: "middle",
      bold: true,
      fontSize: 18,
      color: "FFFFFF",
      fontFace: "Malgun Gothic",
    });
    flow.addText(st.t, {
      x: x + 0.1,
      y: 2.45,
      w: 2.0,
      h: 0.4,
      align: "center",
      bold: true,
      fontSize: 14,
      color: "1A1A1A",
      fontFace: "Malgun Gothic",
    });
    flow.addText(st.d, {
      x: x + 0.1,
      y: 2.95,
      w: 2.0,
      h: 0.9,
      align: "center",
      fontSize: 11,
      color: "555555",
      fontFace: "Malgun Gothic",
    });
    if (i < steps.length - 1) {
      flow.addText("→", {
        x: x + 2.05,
        y: 2.4,
        w: 0.35,
        h: 0.4,
        align: "center",
        fontSize: 18,
        bold: true,
        color: "777777",
      });
    }
  });

  const partA = pptx.addSlide();
  partA.addShape("rect", { x: 0, y: 0, w: 10, h: 5.625, fill: { color: "F0F0F0" } });
  partA.addText("PART A", {
    x: 0.5,
    y: 2.0,
    w: 9,
    h: 0.35,
    align: "center",
    fontSize: 14,
    color: "777777",
    fontFace: "Malgun Gothic",
  });
  partA.addText("양식 레이아웃 재료", {
    x: 0.5,
    y: 2.45,
    w: 9,
    h: 0.55,
    align: "center",
    bold: true,
    fontSize: 28,
    color: "1A1A1A",
    fontFace: "Malgun Gothic",
  });
  partA.addText(`${layoutIds.length}종 · 장번호·표·요약박스 스타일`, {
    x: 0.5,
    y: 3.15,
    w: 9,
    h: 0.35,
    align: "center",
    fontSize: 13,
    color: "555555",
    fontFace: "Malgun Gothic",
  });

  appendLayoutDeck(pptx, {
    layoutIds,
    chapterNo: opts.chapterNo || "3",
    withIndex: true,
    withHowTo: true,
    sectionDividers: true,
  });

  const partB = pptx.addSlide();
  partB.addShape("rect", { x: 0, y: 0, w: 10, h: 5.625, fill: { color: "F0F0F0" } });
  partB.addText("PART B", {
    x: 0.5,
    y: 2.0,
    w: 9,
    h: 0.35,
    align: "center",
    fontSize: 14,
    color: "777777",
    fontFace: "Malgun Gothic",
  });
  partB.addText("도식 재료 키트", {
    x: 0.5,
    y: 2.45,
    w: 9,
    h: 0.55,
    align: "center",
    bold: true,
    fontSize: 28,
    color: "1A1A1A",
    fontFace: "Malgun Gothic",
  });
  partB.addText(`${DIAGRAM_MATERIALS.length}종 · 흑백 편집용 도형`, {
    x: 0.5,
    y: 3.15,
    w: 9,
    h: 0.35,
    align: "center",
    fontSize: 13,
    color: "555555",
    fontFace: "Malgun Gothic",
  });

  appendDiagramMaterialsDeck(pptx, {
    typeId,
    title: opts.title || DIAGRAM_MATERIALS.find((d) => d.id === typeId)?.name || "도식",
    labels: opts.labels || {},
    includeAll: true,
    withCover: false,
    withPurpose: true,
    withTip: true,
  });

  const safe = (opts.fileName || "연성대_보고서_그림_전체재료").replace(/[\\/:*?"<>|]/g, "_");
  await pptx.writeFile({ fileName: `${safe}.pptx` });
  return {
    ok: true,
    layouts: layoutIds.length,
    diagrams: DIAGRAM_MATERIALS.length,
  };
}
