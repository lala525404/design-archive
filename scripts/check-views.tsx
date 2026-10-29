import React from "react";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import {
  INITIAL_ASSETS as assets,
  INITIAL_SAN_DOLL_FONTS as fonts,
} from "../src/data/sampleAssets";
import { LandingView } from "../src/views/LandingView";
import { SearchView } from "../src/views/SearchView";
import { DetailView } from "../src/views/DetailView";
import { UploadView } from "../src/views/UploadView";
import { PromptStudioView } from "../src/views/PromptStudioView";
import { LicenseManagementView } from "../src/views/LicenseManagementView";
import { NamingRuleView } from "../src/views/NamingRuleView";
import { SERVICES, guessType, normalizeTool } from "../src/lib/taxonomy";
import { buildFolderName, parseDeliverable, parseProjectFolder } from "../src/lib/naming";
import {
  findSameWork,
  nextVersion,
  parseNasPath,
  withVersion,
} from "../src/lib/versions";
const noop = () => {};
const search = (query: string, records = assets) =>
  renderToStaticMarkup(
    <SearchView
      assets={records}
      searchQuery={query}
      onSearchChange={noop}
      onSelectAsset={noop}
      onOpenPromptStudio={noop}
      onOpenMenu={noop}
      onNavigateHome={noop}
      initialUnit="file"
    />,
  );
const resultCount = (html: string) =>
  (html.match(/class="asset-item"/g) || []).length;
assert.equal(
  resultCount(search("")),
  assets.length,
  "All original samples remain searchable",
);
assert.equal(
  resultCount(search("색채학 상세페이지")),
  2,
  "Multi-word search matches project and type (PC + MO)",
);
assert.equal(
  resultCount(search("상세페이지 MO")),
  assets.filter((a) => ["상세페이지"].includes(a.type) && a.device === "MO").length,
  "PC/MO is searchable",
);
assert.equal(
  resultCount(search("아이티뱅크")),
  assets.filter((a) => a.service === "02_아이티뱅크").length,
  "Service folder name is searchable",
);
assert.equal(
  resultCount(search("피그마")),
  assets.filter((a) => a.tools.includes("피그마")).length,
  "Tool search",
);
assert.equal(
  resultCount(search("산돌 사용")),
  assets.filter((a) => a.hasSandoll).length,
  "Sandoll quick search",
);
assert.equal(resultCount(search("존재하지않는작업")), 0, "Empty state");
const punctuationAsset = { ...assets[0], title: "색채학 (기초)" };
assert.equal(
  resultCount(search("(", [punctuationAsset])),
  1,
  "Literal punctuation must not cause regex errors",
);
const pages = [
  <LandingView
    assets={assets}
    onSearch={noop}
    onOpenMenu={noop}
    onSelectAsset={noop}
    onNavigateToLicense={noop}
  />,
  <DetailView
    asset={assets[0]}
    onBack={noop}
    onSimilarSearch={noop}
    onOpenPromptStudio={noop}
    onUpdateAsset={noop}
    onOpenMenu={noop}
    userRole="designer"
    allAssets={assets}
    onSelectAsset={noop}
  />,
  <UploadView onBack={noop} onSubmit={noop} />,
  <PromptStudioView
    initialAsset={assets[0]}
    allAssets={assets}
    onBack={noop}
    onOpenMenu={noop}
  />,
  <LicenseManagementView
    fonts={fonts}
    assets={assets}
    onBack={noop}
    onOpenMenu={noop}
    onSelectAsset={noop}
  />,
  <NamingRuleView onBack={noop} onOpenMenu={noop} />,
];
const landing = renderToStaticMarkup(pages[0]);

assert.ok(
  search("").includes("design-thumbnail"),
  "Search keeps the original asset previews",
);
for (const page of pages) {
  const html = renderToStaticMarkup(page);
  assert.ok(html.includes("<main"));
  assert.ok(!/[\u3040-\u30ff]/.test(html), "No Japanese UI copy");
}
for (const asset of assets) {
  const html = renderToStaticMarkup(
    <DetailView
      asset={asset}
      onBack={noop}
      onSimilarSearch={noop}
      onOpenPromptStudio={noop}
      onUpdateAsset={noop}
      onOpenMenu={noop}
      userRole="designer"
      allAssets={assets}
      onSelectAsset={noop}
    />,
  );
  assert.ok(html.includes(asset.title));
  assert.ok(html.includes(asset.fileName));
  assert.ok(html.includes(asset.filePath));
}

// Landing: folder with recent thumbnails, search inside, title, register pill
assert.equal((landing.match(/class="folder-card /g) || []).length, 5, "Five recent cards in the folder");
assert.ok(landing.includes('role="search"'), "Search lives inside the folder");
assert.ok(landing.includes("디자인 자산 아카이브"), "Title");
assert.ok(landing.includes("등록하기"), "Register pill");
assert.ok(landing.includes("둘러보기"), "Browse pill for first-time visitors");
for (const q of ["색채학", "아이티뱅크", "상세페이지 MO", "산돌 사용"]) {
  assert.ok(resultCount(search(q)) > 0, `Suggestion ${q} returns results`);
}
// NAS path parsing and version detection (new naming rule)
const sampleFolder = "260120_15832_색채학 과정_산돌-AI_김다은";
assert.deepEqual(
  (({ service, year, project, requestNo, designer, resources }) => ({ service, year, project, requestNo, designer, resources }))(
    parseNasPath(`\\\\NAS\\디자인\\05_평생\\2026\\${sampleFolder}\\`),
  ),
  { service: "05_평생", year: "2026", project: "색채학 과정", requestNo: "15832", designer: "김다은", resources: ["산돌", "AI"] },
  "Windows NAS path with new project folder",
);
assert.equal(parseNasPath("/09_마케팅/261026_27702_가을 프로모션_산돌-AI_박정은/").year, "2026", "Year from folder date when no year folder");
assert.equal(
  findSameWork(assets, `/05_평생/2026/${sampleFolder}/`, "15832_상세_PC_v04.png")?.id,
  "asset-1",
  "Same folder + same type/device is a new version",
);
assert.equal(
  findSameWork(assets, `/05_평생/2026/${sampleFolder}/`, "15832_상세_MO_v03.png")?.id,
  "asset-2",
  "MO version is tracked separately from PC",
);
assert.equal(
  findSameWork(assets, `/05_평생/2026/${sampleFolder}/`, "15832_배너-서브_PC_v01.png"),
  undefined,
  "A different banner in the same project is a new work",
);
// Real folder names used before the rule (legacy) are still readable
const legacy = [
  ["260102_평생교육이용권 홍보페이지(11340)_산돌,게티,기타라이선스_방수림", "11340", "평생교육이용권 홍보페이지", "산돌-게티-기타", "방수림"],
  ["260108_메인모바일 강사 배너 4종(김기영,이순권,윤관식,김현웅)(12036)_산돌,게티_방수림", "12036", "메인모바일 강사 배너 4종", "산돌-게티", "방수림"],
  ["260805_[평생교육원] 미국변호사 상품 상세페이지_산돌,GPT_박정은", "", "미국변호사 상품 상세페이지", "산돌-AI", "박정은"],
  ["260810_[교육운영팀] 신협중앙회 9월 추천과정 팝업_산돌게티_양현보", "", "신협중앙회 9월 추천과정 팝업", "산돌-게티", "양현보"],
] as const;
for (const [name, req, proj, res, des] of legacy) {
  const f = parseProjectFolder(name);
  assert.equal(f.requestNo, req, name);
  assert.equal(f.project, proj, name);
  assert.equal(f.resources.join("-"), res, name);
  assert.equal(f.designer, des, name);
  assert.equal(f.followsRule, false);
}
assert.equal(
  buildFolderName(parseProjectFolder(legacy[0][0])),
  "260102_11340_평생교육이용권 홍보페이지_산돌-게티-기타_방수림",
  "Legacy name converts to the new rule",
);
assert.deepEqual(
  (({ id, type, label, device, version, followsRule }) => ({ id, type, label, device, version, followsRule }))(parseDeliverable("21076_배너-메인_PC_v01.png")),
  { id: "21076", type: "배너", label: "메인", device: "PC", version: "v01", followsRule: true },
);
assert.equal(parseDeliverable("27651_PPT_v02.pptx").type, "PPT");
assert.equal(parseDeliverable("21076_상세_v01.png").followsRule, false, "PC/MO required for pages");
assert.deepEqual(guessType("2026_색채학_상세페이지MO_피그마_김다은_v01.png"), { type: "상세페이지", device: "MO" });
assert.deepEqual(guessType("2026_HRD_제안서_AI_김다은_v02.pptx"), { type: "PPT", device: undefined });
assert.equal(normalizeTool("Photoshop"), "포토샵");
assert.equal(normalizeTool("GPT"), "AI");
assert.equal(nextVersion("v03"), "v04");
assert.equal(withVersion("a_b_c_d_v03.png", "v04"), "a_b_c_d_v04.png");
assert.equal(resultCount(search("장소 변경")), 1, "Version change reasons are searchable");
for (const service of SERVICES)
  assert.ok(assets.some((a) => a.service === service), `Sample covers ${service}`);
const uploadHtml = renderToStaticMarkup(
  <UploadView assets={assets} onBack={noop} onSubmit={noop} />,
);
assert.ok(uploadHtml.includes("NAS 프로젝트 폴더"), "Upload asks for the NAS path");

console.log(
  "PASS: search, 7 views, 15 samples, naming rule + legacy names, folder landing, services, NAS path, PC/MO, versions",
);
