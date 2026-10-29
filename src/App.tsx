/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { DesignAsset, UserRole, SandollFontItem } from "./types";
import { INITIAL_ASSETS, INITIAL_SAN_DOLL_FONTS } from "./data/sampleAssets";
import { LandingView } from "./views/LandingView";
import { SearchView } from "./views/SearchView";
import { DetailView } from "./views/DetailView";
import { UploadView } from "./views/UploadView";
import { PromptStudioView } from "./views/PromptStudioView";
import { LicenseManagementView } from "./views/LicenseManagementView";
import { NamingRuleView } from "./views/NamingRuleView";
import { NavigationDrawer } from "./components/NavigationDrawer";
import { BottomNav } from "./components/BottomNav";
import { Header } from "./components/Chrome";
import { CheckCircle2, AlertCircle } from "lucide-react";

export default function App() {
  const [view, setView] = useState<
    "landing" | "search" | "detail" | "upload" | "prompt" | "license" | "naming"
  >("landing");

  // Application state
  const [assets, setAssets] = useState<DesignAsset[]>(INITIAL_ASSETS);
  const [fonts, setFonts] = useState<SandollFontItem[]>(INITIAL_SAN_DOLL_FONTS);
  const [userRole, setUserRole] = useState<UserRole>("designer");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAssetId, setSelectedAssetId] = useState<string>("asset-1");
  const [promptAsset, setPromptAsset] = useState<DesignAsset>(
    INITIAL_ASSETS[0],
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view, selectedAssetId]);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Navigators
  const handleSearch = (q: string) => {
    setSearchQuery(q);
    setView("search");
  };

  const handleSelectAsset = (id: string) => {
    setSelectedAssetId(id);
    setView("detail");
  };

  const handleOpenPromptStudio = (asset: DesignAsset) => {
    setPromptAsset(asset);
    setView("prompt");
  };

  const handleUploadSuccess = (newAsset: DesignAsset) => {
    setAssets([newAsset, ...assets]);
    setSelectedAssetId(newAsset.id);
    setView("detail");
    showToast(`"${newAsset.title}" 등록 완료`);
  };

  const handleUploadVersion = (updated: DesignAsset) => {
    setAssets(assets.map((a) => (a.id === updated.id ? updated : a)));
    setSelectedAssetId(updated.id);
    setView("detail");
    showToast(`"${updated.title}" ${updated.version} 등록 완료`);
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

  const myUploadsCount = assets.filter((a) => a.designer === "김디자인").length;

  return (
    <div
      className={`app-shell ${view === "landing" ? "is-landing" : ""} min-h-screen bg-[#F7F3EF] text-[#191919] font-sans antialiased`}
    >
      <a className="skip-link" href="#main-content">
        본문으로 이동
      </a>
      {view !== "landing" && (
      <Header
        view={view}
        onNavigate={(v) => setView(v)}
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
          onNavigate={(v) => setView(v)}
          canUpload={userRole !== "user"}
        />
      )}

      {view === "search" && (
        <SearchView
          assets={assets}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelectAsset={handleSelectAsset}
          onOpenPromptStudio={handleOpenPromptStudio}
          onOpenMenu={() => setIsDrawerOpen(true)}
          onNavigateHome={() => setView("landing")}
        />
      )}

      {view === "detail" && (
        <DetailView
          key={currentSelectedAsset.id}
          asset={currentSelectedAsset}
          onBack={() => setView("search")}
          onSimilarSearch={handleSearch}
          onOpenPromptStudio={handleOpenPromptStudio}
          onUpdateAsset={handleUpdateAsset}
          onOpenMenu={() => setIsDrawerOpen(true)}
          userRole={userRole}
          allAssets={assets}
          onSelectAsset={handleSelectAsset}
        />
      )}

      {view === "upload" && (
        <UploadView
          assets={assets}
          onBack={() => setView("landing")}
          onUploadSuccess={handleUploadSuccess}
          onUploadVersion={handleUploadVersion}
        />
      )}

      {view === "prompt" && (
        <PromptStudioView
          initialAsset={promptAsset}
          allAssets={assets}
          onBack={() => setView("landing")}
          onOpenMenu={() => setIsDrawerOpen(true)}
        />
      )}

      {view === "license" && (
        <LicenseManagementView
          fonts={fonts}
          assets={assets}
          onBack={() => setView("landing")}
          onOpenMenu={() => setIsDrawerOpen(true)}
          onSelectAsset={handleSelectAsset}
        />
      )}

      {view === "naming" && (
        <NamingRuleView
          onBack={() => setView("landing")}
          onOpenMenu={() => setIsDrawerOpen(true)}
        />
      )}

      {/* Slide-out Navigation Drawer */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        currentRole={userRole}
        onRoleChange={handleRoleChange}
        onNavigate={(newView) => setView(newView)}
        myUploadsCount={myUploadsCount}
      />

      {/* Secondary Bottom Navigation Bar */}
      <BottomNav
        currentView={view}
        onNavigate={(newView) => setView(newView)}
        onOpenMenu={() => setIsDrawerOpen(true)}
        userRole={userRole}
      />
    </div>
  );
}
