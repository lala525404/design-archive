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
  !landing.includes("design-thumbnail"),
  "Landing blocks contain no asset thumbnails",
);
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

// Landing blocks are a fixed composition of 7 shortcuts.
assert.equal(
  (landing.match(/class="shape-block /g) || []).length,
  7,
  "Landing shows 7 fixed blocks",
);
assert.ok(!landing.includes("physics"), "No physics playground on landing");
for (const q of ["색채학", "아이티뱅크", "상세페이지 MO", "산돌 사용"]) {
  assert.ok(landing.includes(`>${q}<`), `Suggestion ${q} is shown`);
  assert.ok(resultCount(search(q)) > 0, `Suggestion ${q} returns results`);
}
// NAS path parsing and version detection
assert.deepEqual(
  parseNasPath("\\\\NAS\\디자인\\05_평생\\2026\\색채학\\"),
  { service: "05_평생", year: "2026", project: "색채학" },
  "Windows NAS path with share prefix",
);
assert.deepEqual(
  parseNasPath("/08_인쇄광고물(시디)/2026/지하철광고/파일.png"),
  { service: "08_인쇄광고물(시디)", year: "2026", project: "지하철광고" },
  "Path with file name",
);
assert.equal(
  findSameWork(
    assets,
    "\\\\NAS\\디자인\\05_평생\\2026\\색채학\\",
    "2026_색채학_상세페이지PC_피그마-산돌_양현보_v04.png",
  )?.id,
  "asset-1",
  "Same folder + same project/type/device is a new version even if tools or designer changed",
);
assert.equal(
  findSameWork(assets, "/05_평생/2026/색채학/", "2026_색채학_상세페이지MO_피그마_김다은_v03.png")?.id,
  "asset-2",
  "MO version is tracked separately from PC",
);
assert.equal(
  findSameWork(assets, "/05_평생/2026/색채학/", "2026_색채학_서브배너PC_포토샵_박지원_v01.png"),
  undefined,
  "A different banner in the same project is a new work",
);
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
  "PASS: search, 7 views, 15 samples, fixed landing blocks, suggestions, services, NAS path, PC/MO, versions",
);
