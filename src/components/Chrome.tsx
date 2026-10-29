import React from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Menu,
  Search,
  Plus,
  X,
  ChevronDown,
  AlertTriangle,
} from "lucide-react";
export type AppView =
  | "landing"
  | "search"
  | "detail"
  | "project"
  | "upload"
  | "prompt"
  | "license"
  | "naming";
export function Header({
  view,
  onNavigate,
  onOpenMenu,
  canUpload,
}: {
  view: AppView;
  onNavigate: (v: AppView) => void;
  onOpenMenu: () => void;
  canUpload: boolean;
}) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <button
          className="wordmark"
          onClick={() => onNavigate("landing")}
          aria-label="디자인 자산 아카이브 홈"
        >
          <span className="brand-mark" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
          <span>디자인 아카이브</span>
        </button>
        <nav className="desktop-nav" aria-label="주 메뉴">
          <button
            aria-current={view === "search" ? "page" : undefined}
            onClick={() => onNavigate("search")}
          >
            자산 찾기
          </button>
          <button
            aria-current={view === "prompt" ? "page" : undefined}
            onClick={() => onNavigate("prompt")}
          >
            프롬프트
          </button>
          <button
            aria-current={view === "license" ? "page" : undefined}
            onClick={() => onNavigate("license")}
          >
            라이선스
          </button>
        </nav>
        <div className="header-actions">
          {canUpload && (
            <button
              className="btn btn-primary header-upload"
              onClick={() => onNavigate("upload")}
            >
              <Plus size={17} />
              자산 등록
            </button>
          )}
          <button
            className="icon-btn"
            onClick={onOpenMenu}
            aria-label="전체 메뉴 열기"
          >
            <Menu size={21} />
          </button>
        </div>
      </div>
    </header>
  );
}
export function PageTitle({
  title,
  subtitle,
  onBack,
  children,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="page-title">
      {" "}
      <div>
        {onBack && (
          <button className="back-link" onClick={onBack}>
            <ArrowLeft size={16} />
            뒤로
          </button>
        )}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
export function Disclosure({
  title,
  children,
  open = false,
}: {
  title: string;
  children: React.ReactNode;
  open?: boolean;
}) {
  return (
    <details className="disclosure" open={open || undefined}>
      <summary>
        {title}
        <ChevronDown size={17} />
      </summary>
      <div className="disclosure-body">{children}</div>
    </details>
  );
}
export function SearchBox({
  value,
  onChange,
  onSubmit,
  compact = false,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  compact?: boolean;
}) {
  return (
    <form
      className={`search-box ${compact ? "compact" : ""}`}
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <Search className="search-leading" size={22} aria-hidden="true" />
      <input
        aria-label="디자인 자산 검색"
        placeholder="프로젝트, 작업 유형, 디자이너, 사용 도구로 검색해보세요."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          className="search-clear"
          type="button"
          onClick={() => onChange("")}
          aria-label="검색어 지우기"
        >
          <X size={16} />
        </button>
      )}
      <button className="btn btn-primary" type="submit">
        <span>검색</span>
        <Search size={17} />
      </button>
    </form>
  );
}
export const statusLabels: Record<string, string> = {
  verified: "확인 완료",
  needs_review: "확인 필요",
  restricted: "사용 제한",
  expired: "기간 만료",
};
export function Status({ value }: { value: string }) {
  const tone =
    value === "verified"
      ? ""
      : value === "needs_review"
        ? "status-warning"
        : "status-danger";
  return (
    <span className={`status ${tone}`}>
      {value === "verified" ? (
        <span />
      ) : (
        <AlertTriangle size={13} strokeWidth={2.2} aria-hidden="true" />
      )}
      {statusLabels[value] || value}
    </span>
  );
}

export function Modal({
  children,
  onClose,
  label,
}: {
  children: React.ReactNode;
  onClose: () => void;
  label: string;
}) {
  const ref = React.useRef<HTMLDialogElement>(null);
  React.useEffect(() => {
    ref.current?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="request-dialog"
      aria-label={label}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <section className="request-modal">{children}</section>
    </dialog>
  );
}
