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
import { BlockWorld, BLOCKS, blockLayout } from "../src/lib/blockPhysics";
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

// Exercise actual collision and drag behavior independently of the browser renderer.
for (const [width, height] of [
  [1264, 360],
  [335, 180],
  [280, 110],
]) {
  const world = new BlockWorld(width, height);
  for (let frame = 0; frame < 600; frame++) world.step();
  assert.equal(
    world.blocks.filter((b) => b.spawned).length,
    BLOCKS.length,
    "Every block enters the scene",
  );
  for (const { body } of world.blocks) {
    assert.ok(
      Number.isFinite(body.position.x) && Number.isFinite(body.angle),
      "Physics stays finite",
    );
    assert.ok(
      body.bounds.min.x >= -3 && body.bounds.max.x <= width + 3,
      "Throws stay inside horizontal bounds",
    );
    assert.ok(
      body.bounds.max.y <= world.floor + 3,
      "Blocks stay above the floor",
    );
    assert.ok(body.bounds.max.y > 0, "Blocks remain visible");
  }
  assert.equal(
    world.needsFrame,
    false,
    "Settled blocks let the frame loop sleep",
  );
  const target = { x: width * 0.65, y: height * 0.25 };
  assert.ok(world.beginDrag(0, world.blocks[0].body.position));
  world.moveDrag(target);
  for (let frame = 0; frame < 90; frame++) world.step();
  assert.ok(
    Math.abs(world.blocks[0].body.position.x - target.x) < width * 0.15,
    "Dragging follows the target",
  );
  world.endDrag();
  assert.equal(world.dragging, null, "Release removes the drag constraint");
  world.dispose();
}
const quiet = new BlockWorld(335, 180, true);
const home = blockLayout(335, 180);
for (let i = 0; i < 90; i++) quiet.step();
assert.ok(
  quiet.blocks.every(
    (block, i) => Math.abs(block.body.position.x - home[i].x) < 1,
  ),
  "Reduced motion stays at rest",
);
quiet.beginDrag(0, { x: 100, y: 60 });
quiet.moveDrag({ x: 130, y: 65 });
assert.equal(
  quiet.blocks[0].body.position.x,
  130,
  "Reduced motion permits direct dragging",
);
quiet.endDrag();
quiet.dispose();
console.log(
  "PASS: search, 7 views, 9 samples, responsive physics, dragging, and reduced motion",
);
