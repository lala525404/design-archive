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
console.log(
  "PASS: search cases, 7 views, and detail metadata for all 9 samples",
);
