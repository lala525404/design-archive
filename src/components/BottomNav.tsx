import React from "react";
import { Search, Plus, Folder, Menu } from "lucide-react";
import { UserRole } from "../types";
interface Props {
  currentView: string;
  onNavigate: (
    v: "landing" | "search" | "browse" | "upload" | "prompt" | "license" | "naming",
  ) => void;
  onOpenMenu: () => void;
  userRole: UserRole;
}
export function BottomNav({
  currentView,
  onNavigate,
  onOpenMenu,
  userRole,
}: Props) {
  return (
    <nav className="mobile-nav" aria-label="하단 메뉴">
      <button
        className={
          ["search", "landing", "detail"].includes(currentView) ? "active" : ""
        }
        onClick={() => onNavigate("search")}
      >
        <Search size={20} />
        찾기
      </button>
      {userRole !== "user" && (
        <button
          className={currentView === "upload" ? "active" : ""}
          onClick={() => onNavigate("upload")}
        >
          <Plus size={20} />
          등록
        </button>
      )}
      <button
        className={currentView === "browse" ? "active" : ""}
        onClick={() => onNavigate("browse")}
      >
        <Folder size={20} />
        폴더
      </button>
      <button onClick={onOpenMenu}>
        <Menu size={20} />
        전체 메뉴
      </button>
    </nav>
  );
}
