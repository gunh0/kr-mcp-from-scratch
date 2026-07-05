// capture-pdf.mjs
// MCP 야호~! 학습자료(web/index.html)의 각 <section>(슬라이드)을 PNG로 캡처한 뒤,
// 캡처된 이미지를 한 장씩 담은 페이지로 구성해 하나의 PDF로 인쇄(export)한다.
//
// 실행 환경: mcr.microsoft.com/playwright Docker 이미지 (Makefile의 `make pdf` 참고)

import { chromium } from "playwright";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webDir = path.resolve(__dirname, ".."); // web/
const distDir = path.resolve(__dirname, "..", "..", "dist"); // <repo>/dist
const slidesDir = path.join(distDir, "slides");

// 이전 실행의 슬라이드(구버전 번호)가 섞이지 않도록 비우고 시작한다.
fs.rmSync(slidesDir, { recursive: true, force: true });
fs.mkdirSync(slidesDir, { recursive: true });

const VIEWPORT = { width: 1600, height: 1000 };
const PDF_FILENAME = "mcp-ya-ho-lecture.pdf";

async function main() {
  const browser = await chromium.launch();

  // ---- 1) 섹션별 PNG 캡처 ----
  const page = await browser.newPage({
    viewport: VIEWPORT,
    deviceScaleFactor: 2, // 고해상도 캡처
  });

  const indexUrl = "file://" + path.join(webDir, "index.html");
  await page.goto(indexUrl, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200); // Three.js 히어로 애니메이션 워밍업 대기

  const sectionIds = await page.$$eval("section", (els) =>
    els.map((el, i) => el.id || `section-${i}`)
  );

  const shots = [];
  for (let i = 0; i < sectionIds.length; i++) {
    const id = sectionIds[i];

    // 섹션으로 즉시 스크롤 + 등장 애니메이션 강제 활성화(IntersectionObserver 타이밍 보정)
    await page.evaluate((sel) => {
      const el = document.getElementById(sel);
      if (el) {
        el.scrollIntoView({ behavior: "instant", block: "start" });
        el.classList.add("in-view");
      }
    }, id);
    await page.waitForTimeout(3200); // 순차 발현(스태거+언락 팝) 애니메이션이 모두 끝날 때까지 대기

    const fileName = `${String(i).padStart(2, "0")}-${id}.png`;
    const filePath = path.join(slidesDir, fileName);
    await page.screenshot({
      path: filePath,
      clip: { x: 0, y: 0, width: VIEWPORT.width, height: VIEWPORT.height },
    });
    shots.push(filePath);
    console.log(`✔ captured: ${fileName}`);
  }
  await page.close();

  // ---- 2) 캡처된 PNG를 한 장씩 담은 페이지로 구성해 PDF로 인쇄 ----
  // 주의: page.setContent()로 만든 페이지는 about:blank 오리진이라 file:// 이미지
  // 로드가 차단된다. 반드시 실제 HTML 파일로 저장한 뒤 file://로 열어야 한다.
  const imgsHtml = shots
    .map((p) => `<div class="slide"><img src="file://${p}"></div>`)
    .join("\n");
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    * { margin:0; padding:0; }
    body { background:#06070d; }
    .slide { width:${VIEWPORT.width}px; height:${VIEWPORT.height}px; page-break-after: always; overflow:hidden; }
    .slide img { width:100%; height:100%; object-fit:cover; display:block; }
  </style></head><body>${imgsHtml}</body></html>`;

  const combineHtmlPath = path.join(distDir, "_combine.html");
  fs.writeFileSync(combineHtmlPath, html, "utf-8");

  const printPage = await browser.newPage({ viewport: VIEWPORT });
  await printPage.goto("file://" + combineHtmlPath, { waitUntil: "networkidle" });

  const pdfPath = path.join(distDir, PDF_FILENAME);
  await printPage.pdf({
    path: pdfPath,
    width: `${VIEWPORT.width}px`,
    height: `${VIEWPORT.height}px`,
    printBackground: true,
    margin: { top: 0, bottom: 0, left: 0, right: 0 },
  });

  fs.unlinkSync(combineHtmlPath);
  await browser.close();
  console.log(`\n▶ PDF 생성 완료: ${pdfPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
