import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  Filter,
  LayoutGrid,
  List as ListIcon,
  AlertTriangle,
  AlertCircle,
  Eye,
  Sparkles,
  Copy,
  ChevronDown,
  X,
  Menu,
} from "lucide-react";
import { DesignAsset, ViewMode, GroupMode, SortOption } from "../types";
import { SearchBox, PageTitle, Status } from "../components/Chrome";
import { getVersions } from "../lib/versions";
import {
  ASSET_TYPES,
  DESIGNERS,
  RESOURCES,
  SERVICES,
  TOOLS,
  serviceName,
} from "../lib/taxonomy";
import { DesignThumbnail } from "../components/DesignThumbnail";

interface SearchViewProps {
  assets: DesignAsset[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectAsset: (assetId: string) => void;
  onOpenPromptStudio: (asset: DesignAsset) => void;
  onOpenMenu: () => void;
  onNavigateHome: () => void;
}

export const SearchView: React.FC<SearchViewProps> = ({
  assets,
  searchQuery,
  onSearchChange,
  onSelectAsset,
  onOpenPromptStudio,
  onOpenMenu,
  onNavigateHome,
}) => {
  const [inputVal, setInputVal] = useState(searchQuery);
  useEffect(() => setInputVal(searchQuery), [searchQuery]);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [groupMode, setGroupMode] = useState<GroupMode>("none");
  const [sortBy, setSortBy] = useState<SortOption>("latest");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Filter States
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [selectedSandoll, setSelectedSandoll] = useState<
    "all" | "sandoll" | "no-sandoll"
  >("all");
  const [selectedDesigners, setSelectedDesigners] = useState<string[]>([]);

  // Distinct options
  // 필터 항목은 회사 분류 기준으로 고정 (데이터에 없어도 보여준다)
  const allTypes = ASSET_TYPES;
  const allYears = useMemo(
    () => Array.from(new Set(assets.map((a) => a.year))).sort((a, b) => b - a),
    [assets],
  );
  const allTools = TOOLS;
  const allDesigners = DESIGNERS;
  const countBy = (pick: (a: DesignAsset) => string | string[] | number) => {
    const map = new Map<string, number>();
    assets.forEach((a) => {
      const v = pick(a);
      (Array.isArray(v) ? v : [String(v)]).forEach((k) =>
        map.set(k, (map.get(k) ?? 0) + 1),
      );
    });
    return map;
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange(inputVal.trim());
  };

  const handleClearFilters = () => {
    setSelectedTypes([]);
    setSelectedServices([]);
    setSelectedResources([]);
    setSelectedPackage([]);
    setSelectedYears([]);
    setSelectedTools([]);
    setSelectedSandoll("all");
    setSelectedDesigners([]);
  };

  const hasActiveFilters =
    selectedTypes.length > 0 ||
    selectedServices.length > 0 ||
    selectedResources.length > 0 ||
    selectedPackage.length > 0 ||
    selectedYears.length > 0 ||
    selectedTools.length > 0 ||
    selectedSandoll !== "all" ||
    selectedDesigners.length > 0;

  // Filter and prioritize results
  const filteredAssets = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return assets
      .filter((asset) => {
        // Search query matching across fields
        if (q) {
          const haystack = [
            asset.title,
            asset.professor,
            asset.course,
            asset.project,
            asset.service,
            serviceName(asset.service),
            asset.device ?? "",
            asset.requestNo ?? "",
            asset.projectDate ?? "",
            ...(asset.resources ?? []),
            asset.type,
            ...asset.tools,
            asset.designer,
            String(asset.year),
            ...asset.hashtags,
            asset.fileName,
            asset.filePath,
            ...(asset.hasSandoll ? ["산돌 사용"] : []),
            ...getVersions(asset).flatMap((v) => [
              v.version,
              v.reason,
              v.note ?? "",
              v.fileName,
            ]),
          ]
            .join(" ")
            .toLowerCase();
          if (!q.split(/\s+/).every((term) => haystack.includes(term)))
            return false;
        }

        // Filter constraints
        if (selectedTypes.length > 0 && !selectedTypes.includes(asset.type))
          return false;
        if (
          selectedServices.length > 0 &&
          !selectedServices.includes(asset.service)
        )
          return false;
        // 선택한 유형을 모두 포함한 프로젝트의 파일만
        if (
          selectedPackage.length > 0 &&
          !selectedPackage.every((t) =>
            (asset.packageTypes ?? [asset.type]).includes(t as any),
          )
        )
          return false;
        if (
          selectedResources.length > 0 &&
          !selectedResources.some((r) => asset.resources?.includes(r))
        )
          return false;
        if (selectedYears.length > 0 && !selectedYears.includes(asset.year))
          return false;
        if (
          selectedTools.length > 0 &&
          !selectedTools.some((t) => asset.tools.includes(t))
        )
          return false;
        if (selectedSandoll === "sandoll" && !asset.hasSandoll) return false;
        if (selectedSandoll === "no-sandoll" && asset.hasSandoll) return false;
        if (
          selectedDesigners.length > 0 &&
          !selectedDesigners.includes(asset.designer)
        )
          return false;

        return true;
      })
      .sort((a, b) => {
        // Priority: Exact match for professor, course, or title appears top
        if (q) {
          const aExactProf = a.professor.toLowerCase() === q;
          const bExactProf = b.professor.toLowerCase() === q;
          if (aExactProf && !bExactProf) return -1;
          if (!aExactProf && bExactProf) return 1;

          const aExactCourse = a.project.toLowerCase() === q;
          const bExactCourse = b.project.toLowerCase() === q;
          if (aExactCourse && !bExactCourse) return -1;
          if (!aExactCourse && bExactCourse) return 1;
        }

        // General sort
        if (sortBy === "latest") {
          return (
            new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
          );
        }
        if (sortBy === "oldest") {
          return (
            new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime()
          );
        }
        if (sortBy === "title") {
          return a.title.localeCompare(b.title, "ko");
        }
        return 0;
      });
  }, [
    assets,
    searchQuery,
    selectedTypes,
    selectedServices,
    selectedResources,
    selectedPackage,
    selectedYears,
    selectedTools,
    selectedSandoll,
    selectedDesigners,
    sortBy,
  ]);

  // Grouping logic
  const groupedSections = useMemo(() => {
    if (groupMode === "none") {
      return [{ groupTitle: "", items: filteredAssets }];
    }
    const map = new Map<string, DesignAsset[]>();

    filteredAssets.forEach((asset) => {
      let key = "";
      if (groupMode === "project")
        key = `${serviceName(asset.service)} · ${asset.project} (${asset.year})`;
      if (groupMode === "service") key = asset.service;

      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(asset);
    });

    return Array.from(map.entries()).map(([groupTitle, items]) => ({
      groupTitle,
      items,
    }));
  }, [filteredAssets, groupMode]);

  const count =
    selectedTypes.length +
    selectedServices.length +
    selectedResources.length +
    selectedPackage.length +
    selectedYears.length +
    selectedTools.length +
    selectedDesigners.length +
    (selectedSandoll === "all" ? 0 : 1);
  const toggle = (list: any[], v: any, set: (v: any) => void) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const filterGroup = (
    title: string,
    options: any[],
    selected: any[],
    set: (v: any) => void,
    counts: Map<string, number>,
    format: (v: any) => string = (v) => String(v),
    wide = false,
  ) => (
    <fieldset className={`filter-group ${wide ? "filter-group--wide" : ""}`}>
      <legend>
        {title}
        {selected.length > 0 && (
          <button type="button" onClick={() => set([])}>
            해제
          </button>
        )}
      </legend>
      <div>
        {options.map((v) => {
          const n = counts.get(String(v)) ?? 0;
          return (
            <label key={v} className={n ? "" : "is-empty"}>
              <input
                type="checkbox"
                checked={selected.includes(v)}
                onChange={() => toggle(selected, v, set)}
              />
              <span>{format(v)}</span>
              <em>{n}</em>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
  const highlightText = (value: string, query: string) => {
    if (!query.trim()) return value;
    const escaped = query
      .trim()
      .split(/\s+/)
      .map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const pattern = new RegExp(`(${escaped.join("|")})`, "gi");
    return value
      .split(pattern)
      .map((part, i) =>
        escaped.some((x) => new RegExp(`^${x}$`, "i").test(part)) ? (
          <mark key={i}>{part}</mark>
        ) : (
          part
        ),
      );
  };
  return (
    <main className="page-shell search-page">
      <PageTitle title="자산 찾기">
        <span className="muted">전체 {assets.length}개</span>
      </PageTitle>
      <div className="search-main">
        <SearchBox
          value={inputVal}
          onChange={setInputVal}
          onSubmit={() => onSearchChange(inputVal.trim())}
        />
      </div>
      <div className="search-toolbar">
        <div className="type-tabs" role="group" aria-label="작업 유형">
          <button
            className={!selectedTypes.length ? "active" : ""}
            onClick={() => setSelectedTypes([])}
          >
            전체
          </button>
          {allTypes.map((t) => (
            <button
              className={selectedTypes.includes(t) ? "active" : ""}
              key={t}
              onClick={() =>
                setSelectedTypes(
                  selectedTypes.length === 1 && selectedTypes[0] === t
                    ? []
                    : [t],
                )
              }
            >
              {t}
            </button>
          ))}
        </div>
        <button
          className={`btn filter-toggle ${isFilterOpen || hasActiveFilters ? "selected" : ""}`}
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          aria-expanded={isFilterOpen}
          aria-controls="asset-filters"
        >
          <Filter size={16} />
          필터{count > 0 && <span>{count}</span>}
        </button>
      </div>
      {isFilterOpen && (
        <section
          id="asset-filters"
          className="filter-panel"
          aria-label="상세 검색 필터"
        >
          <div className="filter-grid">
            {filterGroup(
              "서비스 (NAS 분류)",
              [...SERVICES],
              selectedServices,
              setSelectedServices,
              countBy((a) => a.service),
              (v) => v.replace("_", ". "),
              true,
            )}
            {filterGroup(
              "작업 유형",
              allTypes,
              selectedTypes,
              setSelectedTypes,
              countBy((a) => a.type),
            )}
            {filterGroup(
              "디자이너",
              allDesigners,
              selectedDesigners,
              setSelectedDesigners,
              countBy((a) => a.designer),
            )}
            {filterGroup(
              "사용 도구",
              allTools,
              selectedTools,
              setSelectedTools,
              countBy((a) => a.tools),
            )}
            {filterGroup(
              "프로젝트 구성 (모두 포함)",
              allTypes,
              selectedPackage,
              setSelectedPackage,
              countBy((a) => a.packageTypes ?? [a.type]),
            )}
            {filterGroup(
              "리소스 (라이선스)",
              RESOURCES,
              selectedResources,
              setSelectedResources,
              countBy((a) => a.resources ?? []),
            )}
            {filterGroup(
              "연도",
              allYears,
              selectedYears,
              setSelectedYears,
              countBy((a) => a.year),
              (v) => `${v}년`,
            )}
            <fieldset className="filter-group">
              <legend>산돌 폰트</legend>
              <div>
                {[
                  ["all", "전체"],
                  ["sandoll", "사용"],
                  ["no-sandoll", "미사용"],
                ].map(([v, l]) => (
                  <label key={v}>
                    <input
                      name="sandoll"
                      type="radio"
                      checked={selectedSandoll === v}
                      onChange={() => setSelectedSandoll(v as any)}
                    />
                    <span>{l}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
          <div className="filter-footer">
            <button className="text-button" onClick={handleClearFilters}>
              초기화
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setIsFilterOpen(false)}
            >
              결과 {filteredAssets.length}개 보기
            </button>
          </div>
        </section>
      )}
      <div className="results-toolbar">
        <p aria-live="polite">
          {searchQuery && <span className="query-text">‘{searchQuery}’ </span>}
          <strong>{filteredAssets.length}</strong>개의 작업
        </p>
        <div className="result-options">
          <select
            aria-label="결과 묶어 보기"
            value={groupMode}
            onChange={(e) => setGroupMode(e.target.value as GroupMode)}
          >
            <option value="none">묶지 않음</option>
            <option value="project">프로젝트별</option>
            <option value="service">서비스별</option>
          </select>
          <select
            aria-label="결과 정렬"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
          >
            <option value="latest">최신순</option>
            <option value="oldest">오래된순</option>
            <option value="title">이름순</option>
          </select>
          <div className="view-toggle">
            <button
              aria-label="격자로 보기"
              aria-pressed={viewMode === "grid"}
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid size={17} />
            </button>
            <button
              aria-label="목록으로 보기"
              aria-pressed={viewMode === "list"}
              onClick={() => setViewMode("list")}
            >
              <ListIcon size={17} />
            </button>
          </div>
        </div>
      </div>
      {hasActiveFilters && (
        <div className="active-filters">
          {[
            ...selectedTypes,
            ...selectedServices.map(serviceName),
            ...selectedResources,
            ...selectedPackage.map((t) => `${t} 포함 프로젝트`),
            ...selectedYears,
            ...selectedTools,
            ...selectedDesigners,
            ...(selectedSandoll !== "all"
              ? [selectedSandoll === "sandoll" ? "산돌 사용" : "산돌 미사용"]
              : []),
          ].map((s, i) => (
            <span key={i}>{s}</span>
          ))}
          <button onClick={handleClearFilters}>
            모두 해제
            <X size={13} />
          </button>
        </div>
      )}
      {!filteredAssets.length ? (
        <div className="empty-state">
          <Search size={30} />
          <h2>검색 결과가 없어요</h2>
          <p>다른 검색어나 필터로 찾아보세요.</p>
          <button
            className="btn"
            onClick={() => {
              setInputVal("");
              onSearchChange("");
              handleClearFilters();
            }}
          >
            전체 자산 보기
          </button>
        </div>
      ) : (
        groupedSections.map((sec) => (
          <section key={sec.groupTitle} className="result-section">
            {sec.groupTitle && (
              <h2 className="group-title">
                {sec.groupTitle}
                <span>{sec.items.length}</span>
              </h2>
            )}
            <div className={viewMode === "grid" ? "asset-grid" : "asset-list"}>
              {sec.items.map((asset) => (
                <article key={asset.id} className="asset-item">
                  <button
                    className="asset-image"
                    onClick={() => onSelectAsset(asset.id)}
                    aria-label={`${asset.title} 상세 보기`}
                  >
                    <DesignThumbnail asset={asset} />
                    {asset.licenseStatus !== "verified" && (
                      <span className="image-status">
                        <Status value={asset.licenseStatus} />
                      </span>
                    )}
                  </button>
                  <div className="asset-caption">
                    <div>
                      <p className="asset-meta">
                        {asset.project} · {asset.type}
                        {asset.device ? ` ${asset.device}` : ""}
                        {getVersions(asset).length > 1 &&
                          ` · ${asset.version} (버전 ${getVersions(asset).length}개)`}
                      </p>
                      <button
                        className="asset-title"
                        onClick={() => onSelectAsset(asset.id)}
                      >
                        {highlightText(asset.title, searchQuery)}
                      </button>
                      {viewMode === "list" && (
                        <p className="asset-meta">
                          {serviceName(asset.service)} · {asset.designer} ·{" "}
                          {asset.tools.join(", ")} · {asset.uploadDate}
                        </p>
                      )}
                    </div>
                    <div className="asset-actions">
                      <button
                        aria-label={`${asset.title} 비슷한 작업 찾기`}
                        title="비슷한 작업"
                        onClick={() => onSearchChange(asset.project)}
                      >
                        <Search size={16} />
                      </button>
                      <button
                        aria-label={`${asset.title} 프롬프트 만들기`}
                        title="프롬프트 만들기"
                        onClick={() => onOpenPromptStudio(asset)}
                      >
                        <Sparkles size={16} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))
      )}
    </main>
  );
};
