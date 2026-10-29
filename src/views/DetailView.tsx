import React, { useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Copy,
  Check,
  Search,
  Sparkles,
  Download,
  Edit3,
} from "lucide-react";
import { DesignAsset, UserRole } from "../types";
import { DesignThumbnail } from "../components/DesignThumbnail";
import { Disclosure, Status } from "../components/Chrome";
import { getVersions } from "../lib/versions";
import { serviceName } from "../lib/taxonomy";
interface Props {
  asset: DesignAsset;
  onBack: () => void;
  onSimilarSearch: (q: string) => void;
  onOpenPromptStudio: (a: DesignAsset) => void;
  onUpdateAsset: (a: DesignAsset) => void;
  onOpenMenu: () => void;
  userRole: UserRole;
  allAssets: DesignAsset[];
  onSelectAsset: (id: string) => void;
}
export function DetailView({
  asset,
  onBack,
  onSimilarSearch,
  onOpenPromptStudio,
  onUpdateAsset,
  userRole,
  allAssets,
  onSelectAsset,
}: Props) {
  const [copied, setCopied] = useState(false),
    [message, setMessage] = useState(""),
    [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    title: asset.title,
    summary: asset.summary,
    designer: asset.designer,
    version: asset.version,
  });
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(asset.filePath);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setMessage("복사하지 못했어요. 원본 경로를 직접 선택해 복사해주세요.");
    }
  };
  const versions = getVersions(asset);
  const [copiedVersion, setCopiedVersion] = useState("");
  const copyVersionPath = async (path: string, version: string) => {
    try {
      await navigator.clipboard.writeText(path);
      setCopiedVersion(version);
      setTimeout(() => setCopiedVersion(""), 2000);
    } catch {
      setMessage("복사하지 못했어요. 경로를 직접 선택해 복사해주세요.");
    }
  };
  // 같은 프로젝트(패키지)로 만든 작업을 먼저, 그다음 같은 서비스 작업
  const sameProject = allAssets.filter(
    (a) =>
      a.id !== asset.id &&
      a.service === asset.service &&
      a.project === asset.project &&
      a.year === asset.year,
  );
  const related = sameProject.length
    ? sameProject
    : allAssets.filter((a) => a.id !== asset.id && a.service === asset.service);
  return (
    <main className="page-shell detail-page">
      <div className="detail-top">
        <button className="back-link" onClick={onBack}>
          <ArrowLeft size={16} />
          검색 결과
        </button>
        <span className="muted">
          {asset.type} / {asset.version}
          {versions.length > 1 && ` · 버전 ${versions.length}개`}
        </span>
      </div>
      <div className="detail-layout">
        <section className="preview-panel">
          <DesignThumbnail asset={asset} />
          <div className="preview-foot">
            <span>{asset.imageUrl ? "업로드한 이미지" : "샘플 미리보기"}</span>
            <span>
              {asset.dimensions} · {asset.fileSize}
            </span>
          </div>
        </section>
        <section className="detail-info">
          <p className="detail-eyebrow">
            {serviceName(asset.service)} · {asset.project} 프로젝트
          </p>
          <h1>
            {asset.title}
            {asset.device && <span className="device-badge">{asset.device}</span>}
          </h1>
          <p className="detail-summary">{asset.summary}</p>
          <dl className="essential-meta">
            <div>
              <dt>디자이너</dt>
              <dd>{asset.designer}</dd>
            </div>
            <div>
              <dt>사용 도구</dt>
              <dd>{asset.tools.join(" · ")}</dd>
            </div>
            <div>
              <dt>라이선스</dt>
              <dd>
                <Status value={asset.licenseStatus} />
              </dd>
            </div>
          </dl>
          {asset.licenseStatus !== "verified" && (
            <p
              className={`license-note ${asset.licenseStatus === "needs_review" ? "license-note--warning" : "license-note--danger"}`}
            >
              {asset.licenseNote}
            </p>
          )}
          <div className="detail-primary">
            <button className="btn btn-primary" onClick={copy}>
              {copied ? <Check size={17} /> : <Copy size={17} />}{" "}
              {copied ? "복사 완료" : "원본 경로 복사"}
              <ArrowUpRight size={17} />
            </button>
            <button className="btn" onClick={() => onOpenPromptStudio(asset)}>
              <Sparkles size={17} />
              프롬프트 만들기
            </button>
          </div>
          <div className="detail-secondary">
            <button
              className="text-button"
              onClick={() => onSimilarSearch(asset.project)}
            >
              <Search size={15} />
              비슷한 작업
            </button>
            <button
              className="text-button"
              onClick={() =>
                setMessage(
                  "샘플 데이터에는 원본 파일이 연결되어 있지 않아요. 원본 경로를 복사해 파일을 확인해주세요.",
                )
              }
            >
              <Download size={15} />
              원본 다운로드
            </button>
            {userRole !== "user" && (
              <button
                className="text-button"
                onClick={() => setEditing(!editing)}
              >
                <Edit3 size={15} />
                {editing ? "수정 취소" : "정보 수정"}
              </button>
            )}
          </div>
          <p role="status" className="inline-feedback">
            {message}
          </p>
          {editing && (
            <form
              className="edit-form"
              onSubmit={(e) => {
                e.preventDefault();
                onUpdateAsset({ ...asset, ...form });
                setEditing(false);
              }}
            >
              {(["title", "summary", "designer", "version"] as const).map(
                (key, i) => (
                  <label className="field" key={key}>
                    {["작업명", "작업 설명", "디자이너", "버전"][i]}
                    {key === "summary" ? (
                      <textarea
                        value={form[key]}
                        onChange={(e) =>
                          setForm({ ...form, [key]: e.target.value })
                        }
                      />
                    ) : (
                      <input
                        required
                        value={form[key]}
                        onChange={(e) =>
                          setForm({ ...form, [key]: e.target.value })
                        }
                      />
                    )}
                  </label>
                ),
              )}
              <button className="btn btn-primary">저장</button>
            </form>
          )}
          <Disclosure title={`버전 기록 ${versions.length}`} open={versions.length > 1}>
            <ol className="version-list">
              {[...versions].reverse().map((v, i) => (
                <li key={v.version + v.uploadDate} className={i === 0 ? "is-current" : ""}>
                  <div className="version-line">
                    <strong>{v.version}</strong>
                    {i === 0 && <span className="version-current">현재</span>}
                    <span className="version-reason">{v.reason}</span>
                    <span className="version-date">{v.uploadDate}</span>
                  </div>
                  {v.note && <p className="version-note">{v.note}</p>}
                  <div className="version-foot">
                    <span>{v.designer}</span>
                    {v.originalKept ? (
                      <button
                        type="button"
                        className="text-button"
                        onClick={() => copyVersionPath(`${v.filePath}${v.fileName}`, v.version)}
                      >
                        {copiedVersion === v.version ? <Check size={13} /> : <Copy size={13} />}
                        {copiedVersion === v.version ? "복사 완료" : "파일 경로 복사"}
                      </button>
                    ) : (
                      <span className="version-gone">NAS 원본 정리됨 · 기록만 보관</span>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </Disclosure>
          <Disclosure title="파일 정보">
            <dl className="file-meta">
              {[
                ["서비스", asset.service],
                ["프로젝트", asset.project],
                ["작업 유형", `${asset.type}${asset.device ? ` · ${asset.device}` : ""}`],
                ["제작 연도", `${asset.year}년`],
                ["등록일", asset.uploadDate],
                ["버전", asset.version],
                ["파일명", asset.fileName],
                ["원본 경로", asset.filePath],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </Disclosure>
          <Disclosure title="라이선스 상세">
            <p>{asset.hasSandoll ? "산돌 폰트 사용" : "산돌 폰트 미사용"}</p>
            <p>{asset.licenseNote || "등록된 추가 설명이 없습니다."}</p>
          </Disclosure>
          <Disclosure title={`관련 태그 ${asset.hashtags.length}`}>
            <div className="tag-list">
              {asset.hashtags.map((t) => (
                <button
                  key={t}
                  onClick={() => onSimilarSearch(t.replace("#", ""))}
                >
                  {t}
                </button>
              ))}
            </div>
          </Disclosure>
        </section>
      </div>
      {related.length > 0 && (
        <section className="related-section">
          <div className="section-heading">
            <h2>
              {sameProject.length
                ? `같은 프로젝트 작업 ${sameProject.length}개`
                : "같은 서비스의 다른 작업"}
            </h2>
            <button
              className="text-button"
              onClick={() =>
                onSimilarSearch(sameProject.length ? asset.project : serviceName(asset.service))
              }
            >
              전체 보기
              <ArrowUpRight size={15} />
            </button>
          </div>
          <div className="related-grid">
            {related.slice(0, 8).map((a) => (
              <button
                className="related-item"
                key={a.id}
                onClick={() => onSelectAsset(a.id)}
              >
                <div>
                  <DesignThumbnail asset={a} />
                </div>
                <span>
                  {a.title}
                  <small>
                    {a.type}
                    {a.device ? ` ${a.device}` : ""} · {a.version}
                  </small>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
