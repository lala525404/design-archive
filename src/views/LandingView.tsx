import React, { useState } from "react";
import { ArrowRight, Menu } from "lucide-react";
import { DesignAsset } from "../types";
import { ShapeGallery } from "../components/ShapeGallery";
import { SearchBox } from "../components/Chrome";

interface Props {
  assets: DesignAsset[];
  onSearch: (q: string) => void;
  onOpenMenu: () => void;
  onSelectAsset: (id: string) => void;
  onNavigateToLicense: () => void;
  onNavigate?: (view: "upload" | "prompt" | "license") => void;
  canUpload?: boolean;
}

const SUGGESTIONS = ["이동건", "색채학 상세페이지", "산돌 사용", "GPT"];

export function LandingView({
  assets,
  onSearch,
  onOpenMenu,
  onSelectAsset,
  onNavigateToLicense,
  onNavigate,
  canUpload = true,
}: Props) {
  const [query, setQuery] = useState("");
  return (
    <main className="landing page-shell">
      <section className="landing-top" aria-label="자산 검색">
        <div className="landing-search">
          <SearchBox
            value={query}
            onChange={setQuery}
            onSubmit={() => onSearch(query.trim())}
          />
        </div>
        <button
          className="landing-menu"
          onClick={onOpenMenu}
          aria-label="전체 메뉴 열기"
        >
          <Menu size={22} />
        </button>
      </section>

      <ShapeGallery
        assets={assets}
        onSelectAsset={onSelectAsset}
        onNavigateToSearch={onSearch}
        onNavigateToLicense={onNavigateToLicense}
      />

      <div className="landing-baseline">
        <span>자주 찾는 검색어</span>
        <nav aria-label="추천 검색어">
          {SUGGESTIONS.map((q) => (
            <button key={q} onClick={() => onSearch(q)}>
              {q}
            </button>
          ))}
        </nav>
      </div>

      <section className="landing-title">
        <h1>디자인 자산 아카이브</h1>
        <div className="landing-sub">
          <p>이미 만든 디자인을 찾고, 확인하고, 다시 활용하세요.</p>
          <button onClick={() => onSearch("")}>
            전체 자산 {assets.length}개 보기
            <span className="circle-arrow">
              <ArrowRight size={17} />
            </span>
          </button>
        </div>
      </section>

      <footer className="landing-footer">
        <button onClick={() => onSearch("")}>검색</button>
        {canUpload && (
          <button onClick={() => onNavigate?.("upload")}>업로드</button>
        )}
        <button onClick={() => onNavigate?.("prompt")}>프롬프트 스튜디오</button>
        <button onClick={() => onNavigate?.("license")}>라이선스</button>
        <button onClick={onOpenMenu}>메뉴</button>
      </footer>
    </main>
  );
}
