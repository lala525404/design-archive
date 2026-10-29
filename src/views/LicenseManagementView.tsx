import React, { useState } from "react";
import { Search, Copy, X, ArrowUpRight } from "lucide-react";
import { SandollFontItem, DesignAsset } from "../types";
import {
  PageTitle,
  Modal,
  Disclosure,
  Status,
  statusLabels,
} from "../components/Chrome";
interface Props {
  fonts: SandollFontItem[];
  assets: DesignAsset[];
  onBack: () => void;
  onOpenMenu: () => void;
  onSelectAsset: (id: string) => void;
}
export function LicenseManagementView({
  fonts,
  assets,
  onBack,
  onSelectAsset,
}: Props) {
  const [filter, setFilter] = useState("all"),
    [query, setQuery] = useState(""),
    [request, setRequest] = useState<SandollFontItem | null>(null),
    [feedback, setFeedback] = useState("");
  const priority: Record<string, number> = {
    expired: 0,
    restricted: 1,
    needs_review: 2,
    verified: 3,
  };
  const filtered = fonts
    .filter(
      (f) =>
        (filter === "all" ||
          (filter === "attention"
            ? f.status !== "verified"
            : filter === "warning"
              ? ["expired", "restricted"].includes(f.status)
              : filter === "review"
                ? f.status === "needs_review"
                : f.status === "verified")) &&
        [f.fontName, f.fontFamily, f.assignedLicenseKey]
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) => priority[a.status] - priority[b.status]);
  const issueCount = fonts.filter((f) => f.status !== "verified").length;
  return (
    <main className="page-shell license-page">
      <PageTitle title="라이선스 확인" onBack={onBack}>
        <span className="muted">확인할 서체 {issueCount}개</span>
      </PageTitle>
      <div className="license-controls">
        <div className="type-tabs" aria-label="라이선스 상태">
          {[
            ["all", "전체"],
            ["attention", "확인할 서체"],
            ["warning", "만료 · 제한"],
            ["review", "확인 필요"],
            ["verified", "확인 완료"],
          ].map(([v, l]) => (
            <button
              key={v}
              className={filter === v ? "active" : ""}
              onClick={() => setFilter(v)}
            >
              {l}
            </button>
          ))}
        </div>
        <label className="small-search">
          <Search size={17} />
          <input
            aria-label="서체 검색"
            placeholder="서체명 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>
      <div className="font-list">
        {filtered.map((font) => (
          <details className="font-row" key={font.id}>
            <summary>
              <span className="font-name">
                <strong>{font.fontName}</strong>
                <span>{font.fontFamily}</span>
              </span>
              <Status value={font.status} />
              <span className="font-date">{font.validUntil}</span>
              <span className="expand-label">
                상세 보기
                <ArrowUpRight size={15} />
              </span>
            </summary>
            <div className="font-details">
              {font.needsReviewReason && (
                <p className="license-note">{font.needsReviewReason}</p>
              )}
              <dl className="file-meta">
                <div>
                  <dt>계약 식별자</dt>
                  <dd>{font.assignedLicenseKey}</dd>
                </div>
                <div>
                  <dt>허용 부서</dt>
                  <dd>{font.allowedDepartment}</dd>
                </div>
                <div>
                  <dt>허용 계정</dt>
                  <dd>{font.allowedAccounts.join(", ")}</dd>
                </div>
                <div>
                  <dt>적용 작업</dt>
                  <dd>{font.recentAssetsCount}건</dd>
                </div>
                <div>
                  <dt>유효 기간</dt>
                  <dd>{font.validUntil}</dd>
                </div>
              </dl>
              <div className="choice-row">
                <button
                  className="btn"
                  onClick={() => {
                    setRequest(font);
                    setFeedback("");
                  }}
                >
                  갱신 신청
                </button>
              </div>
            </div>
          </details>
        ))}
        {!filtered.length && (
          <div className="empty-state">
            <h2>해당하는 서체가 없어요</h2>
            <button
              className="btn"
              onClick={() => {
                setQuery("");
                setFilter("all");
              }}
            >
              전체 보기
            </button>
          </div>
        )}
      </div>
      {request && (
        <Modal onClose={() => setRequest(null)} label="갱신 신청 안내">
          <div className="section-heading">
            <h2>갱신 신청</h2>
            <button
              autoFocus
              className="icon-btn"
              onClick={() => setRequest(null)}
              aria-label="닫기"
            >
              <X size={20} />
            </button>
          </div>
          <p>
            {request.fontName} · {statusLabels[request.status]}
          </p>
          <p className="muted">
            현재 샘플 화면입니다. 신청 내용을 복사해 담당자에게 전달해주세요.
          </p>
          <textarea
            aria-label="갱신 신청 내용"
            readOnly
            value={`서체 라이선스 갱신 요청\n서체: ${request.fontName}\n계약 식별자: ${request.assignedLicenseKey}\n유효 기간: ${request.validUntil}\n허용 부서: ${request.allowedDepartment}`}
          />
          <button
            className="btn btn-primary"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(
                  `서체 라이선스 갱신 요청\n서체: ${request.fontName}\n계약 식별자: ${request.assignedLicenseKey}\n유효 기간: ${request.validUntil}\n허용 부서: ${request.allowedDepartment}`,
                );
                setFeedback("복사 완료");
              } catch {
                setFeedback("문구를 직접 선택해 복사해주세요.");
              }
            }}
          >
            <Copy size={16} />
            신청 내용 복사
          </button>
          <span role="status">{feedback}</span>
        </Modal>
      )}
    </main>
  );
}
