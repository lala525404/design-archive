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
  1,
  "Multi-word search matches course and type",
);
assert.equal(
  resultCount(search("Figma")),
  assets.filter((a) => a.tools.includes("Figma")).length,
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
  <UploadView onBack={noop} onUploadSuccess={noop} />,
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
for (const q of ["이동건", "색채학 상세페이지", "산돌 사용", "GPT"]) {
  assert.ok(landing.includes(`>${q}<`), `Suggestion ${q} is shown`);
  assert.ok(resultCount(search(q)) > 0, `Suggestion ${q} returns results`);
}
// NAS path parsing and version detection
assert.deepEqual(
  parseNasPath("\\\\NAS\\디자인\\2026\\이동건\\색채학\\상세페이지\\"),
  { year: "2026", professor: "이동건", course: "색채학", type: "상세페이지" },
  "Windows NAS path with share prefix",
);
assert.equal(
  findSameWork(
    assets,
    "/2026/이동건/색채학/상세페이지/",
    "2026_색채학상세페이지_Figma-GPT-산돌_김디자인_v04.png",
  )?.id,
  "asset-1",
  "Same folder + same work name is detected as a new version",
);
assert.equal(
  findSameWork(assets, "/2026/이동건/색채학/상세페이지/", "2026_다른작업_Figma_김디자인_v01.png"),
  undefined,
  "Different work name is a separate work",
);
assert.equal(nextVersion("v03"), "v04");
assert.equal(withVersion("a_b_c_d_v03.png", "v04"), "a_b_c_d_v04.png");
assert.equal(resultCount(search("장소 변경")), 1, "Version change reasons are searchable");
const uploadHtml = renderToStaticMarkup(
  <UploadView assets={assets} onBack={noop} onUploadSuccess={noop} />,
);
assert.ok(uploadHtml.includes("NAS 원본 경로"), "Upload asks for the NAS path");

console.log(
  "PASS: search, 7 views, 9 samples, fixed landing blocks, suggestions, NAS path, versions",
);
