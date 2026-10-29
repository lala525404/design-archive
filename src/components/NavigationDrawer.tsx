import React, { useEffect, useRef } from "react";
import { X, ArrowUpRight } from "lucide-react";
import { UserRole } from "../types";
interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
  onRoleChange: (r: UserRole) => void;
  onNavigate: (
    v: "landing" | "search" | "upload" | "prompt" | "license" | "naming",
  ) => void;
  myUploadsCount: number;
}
export function NavigationDrawer({
  isOpen,
  onClose,
  currentRole,
  onRoleChange,
  onNavigate,
  myUploadsCount,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (isOpen) {
      d?.showModal();
      document.body.style.overflow = "hidden";
    } else d?.close();
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);
  const nav = (v: Parameters<Props["onNavigate"]>[0]) => {
    onNavigate(v);
    onClose();
  };
  return (
    <dialog
      ref={ref}
      className="nav-dialog"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="drawer">
        <div className="drawer-head">
          <span>전체 메뉴</span>
          <button className="icon-btn" onClick={onClose} aria-label="메뉴 닫기">
            <X size={21} />
          </button>
        </div>
        <nav>
          {(
            [
              ["landing", "처음으로"],
              ["search", "자산 찾기"],
              ...(currentRole !== "user" ? [["upload", "자산 등록"]] : []),
              ["prompt", "프롬프트 만들기"],
              ["license", "라이선스 확인"],
              ...(currentRole === "admin" ? [["naming", "파일명 규칙"]] : []),
            ] as const
          ).map(([v, label]) => (
            <button key={v} onClick={() => nav(v as any)}>
              {label}
              <ArrowUpRight size={20} />
            </button>
          ))}
        </nav>
        <div className="drawer-bottom">
          <span>내가 등록한 작업 {myUploadsCount}개</span>
          <details>
            <summary>사용자 모드</summary>
            <select
              aria-label="샘플 사용자 권한"
              value={currentRole}
              onChange={(e) => onRoleChange(e.target.value as UserRole)}
            >
              <option value="user">일반 사용자</option>
              <option value="designer">디자이너</option>
              <option value="admin">관리자</option>
            </select>
          </details>
        </div>
      </div>
    </dialog>
  );
}
