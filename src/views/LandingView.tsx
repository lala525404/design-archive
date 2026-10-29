import React, { useMemo, useState } from "react";
import { Menu, Plus, Search } from "lucide-react";
import { DesignAsset } from "../types";
import { DesignThumbnail } from "../components/DesignThumbnail";
import { serviceName } from "../lib/taxonomy";

interface Props {
  assets: DesignAsset[];
  onSearch: (q: string) => void;
  onOpenMenu: () => void;
  onSelectAsset: (id: string) => void;
  onNavigateToLicense: () => void;
  onNavigate?: (view: "upload" | "prompt" | "license") => void;
  canUpload?: boolean;
}

/**
 * 첫 화면: 폴더 하나.
 * 뒤에는 최근 작업 썸네일이 꽂혀 있고, 앞쪽 반투명 포켓에는 최근 등록 목록과 검색창.
 */
export function LandingView({
  assets,
  onSearch,
  onOpenMenu,
  onSelectAsset,
  onNavigate,
  canUpload = true,
}: Props) {
  const [query, setQuery] = useState("");

  const recent = useMemo(
    () => [...assets].sort((a, b) => b.uploadDate.localeCompare(a.uploadDate)),
    [assets],
  );
  // 폴더에 꽂을 카드: 최근 작업 중 서로 다른 유형 위주로 5장
  const cards = useMemo(() => {
    const picked: DesignAsset[] = [];
    const seen = new Set<string>();
    // 세로 카드에 잘 맞는 작업(올린 이미지, 세로·정사각 유형)을 먼저
    const portrait = ["상세페이지", "풀페이지", "포스터", "카드뉴스", "팝업"];
    const fits = (a: DesignAsset) => Boolean(a.imageUrl) || portrait.includes(a.type);
    [...recent.filter(fits), ...recent.filter((a) => !fits(a))].forEach((a) => {
      if (picked.length < 5 && !seen.has(a.type)) {
        seen.add(a.type);
        picked.push(a);
      }
    });
    [...recent.filter(fits), ...recent].forEach((a) => {
      if (picked.length < 5 && !picked.includes(a)) picked.push(a);
    });
    // 가운데에 가장 최근 작업이 오도록 배치
    return [picked[3], picked[1], picked[0], picked[2], picked[4]].filter(Boolean);
  }, [recent]);

  return (
    <main className="landing2">
      <button className="landing2-menu" onClick={onOpenMenu} aria-label="전체 메뉴 열기">
        <Menu size={22} />
      </button>

      <section className="hero" aria-label="디자인 자산 검색">
        <div className="folder">
          <div className="folder-back" aria-hidden="true">
            <span className="folder-back-tab" />
          </div>

          <div className="folder-cards">
            {cards.map((a, i) => (
              <button
                key={a.id}
                type="button"
                className={`folder-card folder-card--${i}`}
                style={{ animationDelay: `${120 + Math.abs(i - 2) * 70}ms` }}
                onClick={() => onSelectAsset(a.id)}
                aria-label={`${a.title} 보기`}
              >
                <DesignThumbnail asset={a} fit="cover" />
              </button>
            ))}
          </div>

          <div className="folder-front">
            <span className="folder-front-tab" aria-hidden="true" />
            <div className="folder-front-body">
              <ul className="folder-list" aria-label="최근 등록">
                {recent.slice(0, 3).map((a) => (
                  <li key={a.id}>
                    <button type="button" onClick={() => onSelectAsset(a.id)}>
                      <strong>{a.project}</strong>
                      <span>
                        {a.type}
                        {a.device ? ` ${a.device}` : ""} · {serviceName(a.service)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>

              <form
                className="folder-search"
                role="search"
                onSubmit={(e) => {
                  e.preventDefault();
                  onSearch(query.trim());
                }}
              >
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="프로젝트, 작업 유형, 디자이너로 검색"
                  aria-label="디자인 자산 검색"
                />
                <button type="submit" className="folder-search-go" aria-label="검색">
                  <Search size={22} strokeWidth={2.2} />
                </button>
              </form>
            </div>
          </div>
        </div>

        <h1 className="hero-title">디자인 자산 아카이브</h1>

        {canUpload ? (
          <button className="hero-pill" onClick={() => onNavigate?.("upload")}>
            <Plus size={16} />
            등록하기
          </button>
        ) : (
          <button className="hero-pill" onClick={() => onSearch("")}>
            전체 {assets.length}개 보기
          </button>
        )}
      </section>
    </main>
  );
}
