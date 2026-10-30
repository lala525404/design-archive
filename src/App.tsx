/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { DesignAsset, UserRole, SandollFontItem } from "./types";
import { INITIAL_ASSETS, INITIAL_SAN_DOLL_FONTS } from "./data/sampleAssets";
import { LandingView } from "./views/LandingView";
import { SearchView } from "./views/SearchView";
import { DetailView } from "./views/DetailView";
import { UploadView, UploadResult } from "./views/UploadView";
import { CURRENT_DESIGNER } from "./lib/taxonomy";
import { PromptStudioView } from "./views/PromptStudioView";
import { LicenseManagementView } from "./views/LicenseManagementView";
import { NamingRuleView } from "./views/NamingRuleView";
import { ProjectView } from "./views/ProjectView";
import { projectKey } from "./lib/projects";
import { NavigationDrawer } from "./components/NavigationDrawer";
import { BottomNav } from "./components/BottomNav";
import { Header } from "./components/Chrome";
import { CheckCircle2, AlertCircle } from "lucide-react";

type View = "landing" | "search" | "detail" | "project" | "upload" | "prompt" | "license" | "naming";
const VIEWS: View[] = ["landing", "search", "detail", "project", "upload", "prompt", "license", "naming"];

/** 화면 위치를 주소(#)에 담는다 → 브라우저 뒤로/앞으로, 새로고침, 링크 공유가 된다 */
interface Route {
  view: View;
  q?: string;
  id?: string;
  key?: string;
  folder?: string;
  revise?: string;
}

function routeToHash(r: Route) {
  const params = new URLSearchParams();
  if (r.q) params.set("q", r.q);
  if (r.id) params.set("id", r.id);
  if (r.key) params.set("key", r.key);
  if (r.folder) params.set("folder", r.folder);
  if (r.revise) params.set("revise", r.revise);
  const qs = params.toString();
  return r.view === "landing" && !qs ? "#/" : `#/${r.view}${qs ? `?${qs}` : ""}`;
}

function hashToRoute(hash: string): Route {
  const [path, qs = ""] = hash.replace(/^#\/?/, "").split("?");
  const view = (VIEWS.includes(path as View) ? path : "landing") as View;
  const p = new URLSearchParams(qs);
  return {
    view,
    q: p.get("q") ?? undefined,
    id: p.get("id") ?? undefined,
    key: p.get("key") ?? undefined,
    folder: p.get("folder") ?? undefined,
    revise: p.get("revise") ?? undefined,
  };
}

export default function App() {
  const initial = useRef(hashToRoute(window.location.hash)).current;
  const [view, setViewState] = useState<View>(initial.view);
  const [selectedProjectKey, setSelectedProjectKey] = useState(initial.key ?? "");
  // 업로드 화면을 어떤 목적으로 열었는지 (프로젝트에 파일 추가 / 특정 파일 수정본)
  const [uploadPreset, setUploadPreset] = useState<{ folder?: string; reviseId?: string }>({
    folder: initial.folder,
    reviseId: initial.revise,
  });

  // Application state
  const [assets, setAssets] = useState<DesignAsset[]>(INITIAL_ASSETS);
  const [fonts, setFonts] = useState<SandollFontItem[]>(INITIAL_SAN_DOLL_FONTS);
  const [userRole, setUserRole] = useState<UserRole>("designer");
  const [searchQuery, setSearchQuery] = useState(initial.q ?? "");
  const [selectedAssetId, setSelectedAssetId] = useState<string>(initial.id ?? "asset-1");
  const [promptAsset, setPromptAsset] = useState<DesignAsset>(
    INITIAL_ASSETS[0],
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // ── 화면 이동 기록 ──
  // 기록마다 순번(idx)을 두고, 그 순번의 스크롤 위치를 기억해 뒤로 가면 되살린다
  const idxRef = useRef<number>(0);
  const scrolls = useRef(new Map<number, number>());
  const restoreTo = useRef<number | null>(null);

  const apply = (r: Route) => {
    setViewState(r.view);
    if (r.view === "search") setSearchQuery(r.q ?? "");
    if (r.view === "detail" && r.id) setSelectedAssetId(r.id);
    if (r.view === "project" && r.key) setSelectedProjectKey(r.key);
    if (r.view === "upload") setUploadPreset({ folder: r.folder, reviseId: r.revise });
  };

  const navigate = (r: Route, replace = false) => {
    scrolls.current.set(idxRef.current, window.scrollY);
    if (!replace) idxRef.current += 1;
    const state = { idx: idxRef.current };
    if (replace) window.history.replaceState(state, "", routeToHash(r));
    else window.history.pushState(state, "", routeToHash(r));
    restoreTo.current = null;
    apply(r);
  };

  /** 화면 안의 '뒤로' 버튼: 앱 안에서 온 곳이 있으면 거기로, 없으면 fallback */
  const goBack = (fallback: Route) => {
    if (idxRef.current > 0) window.history.back();
    else navigate(fallback, true);
  };

  useEffect(() => {
    const st = window.history.state as { idx?: number } | null;
    idxRef.current = st?.idx ?? 0;
    if (st?.idx == null) window.history.replaceState({ idx: 0 }, "", routeToHash(initial));
    const onPop = (e: PopStateEvent) => {
      scrolls.current.set(idxRef.current, window.scrollY);
      const idx = (e.state as { idx?: number } | null)?.idx ?? 0;
      idxRef.current = idx;
      restoreTo.current = scrolls.current.get(idx) ?? 0;
      apply(hashToRoute(window.location.hash));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const y = restoreTo.current ?? 0;
    restoreTo.current = null;
    // 화면이 그려진 다음 위치를 맞춘다
    requestAnimationFrame(() => window.scrollTo(0, y));
  }, [view, selectedAssetId, selectedProjectKey]);

  const setView = (v: View) => navigate({ view: v });
  const openUpload = (preset: { folder?: string; reviseId?: string } = {}) =>
    navigate({ view: "upload", folder: preset.folder, revise: preset.reviseId });

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Navigators
  // 새로 검색하면 필터를 비운다 (뒤로 돌아올 때는 유지)
  const [searchSession, setSearchSession] = useState(0);
  const handleSearch = (q: string) => {
    setSearchSession((n) => n + 1);
    navigate({ view: "search", q });
  };

  const handleSelectProject = (key: string) => navigate({ view: "project", key });

  const handleSelectAsset = (id: string) => navigate({ view: "detail", id });

  // 검색어 입력은 기록을 쌓지 않고 주소만 바꾼다
  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    window.history.replaceState(window.history.state, "", routeToHash({ view: "search", q }));
  };

  const handleOpenPromptStudio = (asset: DesignAsset) => {
    setPromptAsset(asset);
    setView("prompt");
  };

  const handleUploadSubmit = ({ added, updated, project }: UploadResult) => {
    const byId = new Map(updated.map((a) => [a.id, a]));
    setAssets([...added, ...assets.map((a) => byId.get(a.id) ?? a)]);
    const total = added.length + updated.length;
    const versionText = updated.length ? ` (새 버전 ${updated.length}개)` : "";
    if (total === 1) {
      const one = added[0] ?? updated[0];
      navigate({ view: "detail", id: one.id }, true);
      showToast(`"${one.title}" ${one.version} 등록 완료`);
    } else {
      const first = added[0] ?? updated[0];
      navigate({ view: "project", key: projectKey(first) }, true);
      showToast(`${project} 프로젝트 ${total}개 등록 완료${versionText}`);
    }
  };

  const handleUpdateAssets = (list: DesignAsset[], message: string) => {
    const byId = new Map(list.map((a) => [a.id, a]));
    setAssets(assets.map((a) => byId.get(a.id) ?? a));
    showToast(message);
  };

  const handleUpdateAsset = (updated: DesignAsset) => {
    setAssets(assets.map((a) => (a.id === updated.id ? updated : a)));
    showToast("수정 내용을 저장했어요.");
  };

  const handleRoleChange = (role: UserRole) => {
    setUserRole(role);
    const roleLabels = {
      user: "일반 사용자",
      designer: "디자이너",
      admin: "관리자",
    };
    showToast(`권한이 [${roleLabels[role]}] 모드로 전환되었습니다.`);
  };

  const currentSelectedAsset =
    assets.find((a) => a.id === selectedAssetId) || assets[0];

  const myUploadsCount = assets.filter((a) => a.designer === CURRENT_DESIGNER).length;

  return (
    <div
      className={`app-shell ${view === "landing" ? "is-landing" : ""} min-h-screen bg-white text-[#1d1d1f] font-sans antialiased`}
    >
      <a className="skip-link" href="#main-content">
        본문으로 이동
      </a>
      {view !== "landing" && (
      <Header
        view={view}
        onNavigate={(v) => (v === "upload" ? openUpload() : setView(v))}
        onOpenMenu={() => setIsDrawerOpen(true)}
        canUpload={userRole !== "user"}
      />
      )}
      <div id="main-content" tabIndex={-1} />
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          className="fixed top-24 right-6 z-50 bg-[#191919] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-top-3 duration-200"
        >
          <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main View Switcher */}
      {view === "landing" && (
        <LandingView
          assets={assets}
          onSearch={handleSearch}
          onOpenMenu={() => setIsDrawerOpen(true)}
          onSelectAsset={handleSelectAsset}
          onNavigateToLicense={() => setView("license")}
          onNavigate={(v) => (v === "upload" ? openUpload() : setView(v))}
          onSelectProject={handleSelectProject}
          canUpload={userRole !== "user"}
        />
      )}

      {view === "project" && (
        <ProjectView
          projectKey={selectedProjectKey}
          assets={assets}
          onBack={() => goBack({ view: "search" })}
          onSelectAsset={handleSelectAsset}
          onAddFiles={(folder) => openUpload({ folder })}
          onReviseFile={(id, folder) => openUpload({ folder, reviseId: id })}
          onUpdateAssets={handleUpdateAssets}
          canUpload={userRole !== "user"}
        />
      )}

      {/* 검색 화면은 계속 띄워 두고 숨기기만 한다 → 뒤로 오면 필터·보기 방식이 그대로 */}
      <div hidden={view !== "search"}>
        <SearchView
          key={searchSession}
          assets={assets}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          onSelectAsset={handleSelectAsset}
          onOpenPromptStudio={handleOpenPromptStudio}
          onOpenMenu={() => setIsDrawerOpen(true)}
          onNavigateHome={() => setView("landing")}
          onSelectProject={handleSelectProject}
        />
      </div>

      {view === "detail" && (
        <DetailView
          key={currentSelectedAsset.id}
          asset={currentSelectedAsset}
          onBack={() => goBack({ view: "search" })}
          onSimilarSearch={handleSearch}
          onOpenPromptStudio={handleOpenPromptStudio}
          onUpdateAsset={handleUpdateAsset}
          onOpenMenu={() => setIsDrawerOpen(true)}
          userRole={userRole}
          allAssets={assets}
          onSelectAsset={handleSelectAsset}
          onOpenProject={handleSelectProject}
        />
      )}

      {view === "upload" && (
        <UploadView
          key={`${uploadPreset.folder ?? ""}|${uploadPreset.reviseId ?? ""}`}
          assets={assets}
          presetFolder={uploadPreset.folder}
          reviseAssetId={uploadPreset.reviseId}
          onBack={() => goBack({ view: "landing" })}
          onSubmit={handleUploadSubmit}
        />
      )}

      {view === "prompt" && (
        <PromptStudioView
          initialAsset={promptAsset}
          allAssets={assets}
          onBack={() => goBack({ view: "landing" })}
          onOpenMenu={() => setIsDrawerOpen(true)}
        />
      )}

      {view === "license" && (
        <LicenseManagementView
          fonts={fonts}
          assets={assets}
          onBack={() => goBack({ view: "landing" })}
          onOpenMenu={() => setIsDrawerOpen(true)}
          onSelectAsset={handleSelectAsset}
        />
      )}

      {view === "naming" && (
        <NamingRuleView
          onBack={() => goBack({ view: "landing" })}
          onOpenMenu={() => setIsDrawerOpen(true)}
        />
      )}

      {/* Slide-out Navigation Drawer */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        currentRole={userRole}
        onRoleChange={handleRoleChange}
        onNavigate={(newView) => (newView === "upload" ? openUpload() : setView(newView))}
        myUploadsCount={myUploadsCount}
      />

      {/* Secondary Bottom Navigation Bar */}
      <BottomNav
        currentView={view}
        onNavigate={(newView) => (newView === "upload" ? openUpload() : setView(newView))}
        onOpenMenu={() => setIsDrawerOpen(true)}
        userRole={userRole}
      />
    </div>
  );
}
