import React, { useState } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { DesignAsset } from "../types";
import { ShapeGallery } from "../components/ShapeGallery";
import { SearchBox } from "../components/Chrome";
interface Props {
  assets: DesignAsset[];
  onSearch: (q: string) => void;
  onOpenMenu: () => void;
  onSelectAsset: (id: string) => void;
  onNavigateToLicense: () => void;
}
export function LandingView({
  assets,
  onSearch,
  onSelectAsset,
  onNavigateToLicense,
}: Props) {
  const [query, setQuery] = useState("");
  return (
    <main className="landing page-shell">
      <section className="landing-search" aria-label="자산 검색">
        <SearchBox
          value={query}
          onChange={setQuery}
          onSubmit={() => onSearch(query.trim())}
        />
        <div className="suggestions">
          <span>바로 찾기</span>
          {["이동건", "색채학", "Figma", "산돌 사용"].map((q) => (
            <button key={q} onClick={() => onSearch(q)}>
              {q}
              <ArrowUpRight size={12} />
            </button>
          ))}
        </div>
      </section>
      <ShapeGallery
        assets={assets}
        onSelectAsset={onSelectAsset}
        onNavigateToSearch={onSearch}
        onNavigateToLicense={onNavigateToLicense}
      />
      <section className="landing-title">
        <div className="title-meta">
          <span>쌓인 작업이, 다음 작업의 시작.</span>
          <button onClick={() => onSearch("")}>
            전체 자산 <span className="asset-count">{assets.length}</span>
            <span className="circle-arrow">
              <ArrowRight size={19} />
            </span>
          </button>
        </div>
        <h1>
          <span>디자인 자산</span> <span>아카이브</span>
        </h1>
        <p>이미 만든 디자인을 찾고, 확인하고, 다시 활용하세요.</p>
      </section>
      <footer className="landing-footer">
        <span>우리의 작업을 모아두는 곳</span>
        <span>디자인 아카이브 · {new Date().getFullYear()}</span>
      </footer>
    </main>
  );
}
