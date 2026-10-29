import React, { useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Copy,
  Eye,
  FolderOpen,
  GitBranch,
  History,
  Pencil,
  Plus,
  RotateCcw,
  TriangleAlert,
  Upload,
  X,
} from "lucide-react";
import { AssetType, DesignAsset, VersionEntry } from "../types";
import { DesignThumbnail } from "../components/DesignThumbnail";
import { Status } from "../components/Chrome";
import {
  ASSET_TYPES,
  CURRENT_DESIGNER,
  RESOURCES,
  SERVICES,
  serviceName,
  resourceLabels,
} from "../lib/taxonomy";
import { groupProjects, projectKey, typeSummary } from "../lib/projects";
import { getVersions, nextVersion, withVersion } from "../lib/versions";

interface Props {
  projectKey: string;
  assets: DesignAsset[];
  onBack: () => void;
  onSelectAsset: (id: string) => void;
  onAddFiles?: (folder: string) => void;
  onReviseFile?: (assetId: string, folder: string) => void;
  onUpdateAssets?: (list: DesignAsset[], message: string) => void;
  canUpload?: boolean;
}

/** 프로젝트(패키지) 한 개: 정보 수정, 버전 흐름, 유형별 파일 */
export function ProjectView({
  projectKey: key,
  assets,
  onBack,
  onSelectAsset,
  onAddFiles,
  onReviseFile,
  onUpdateAssets,
  canUpload = true,
}: Props) {
  const project = useMemo(
    () => groupProjects(assets.filter((a) => projectKey(a) === key))[0],
    [assets, key],
  );
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const versioned = project ? project.files.filter((f) => getVersions(f).length > 1) : [];
  // 버전이 3개 이상 쌓인 파일이 있으면 버전 흐름을 펼쳐서 보여준다
  const [showVersions, setShowVersions] = useState(() =>
    versioned.some((f) => getVersions(f).length >= 3),
  );
  // 버전 관리: 기본은 수정된 작업만, 한 번에 하나만 펼친다
  const [vFilter, setVFilter] = useState<"changed" | "all">(versioned.length ? "changed" : "all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const managerRef = useRef<HTMLElement>(null);

  if (!project)
    return (
      <main className="page-shell project-page">
        <button className="back-link" onClick={onBack}>
          <ArrowLeft size={16} /> 검색 결과
        </button>
        <p className="muted">프로젝트를 찾을 수 없어요.</p>
      </main>
    );

  const folderPath = project.files[0].filePath;
  const sections = ASSET_TYPES.map((t) => ({
    type: t,
    files: project.files.filter((f) => f.type === t),
  })).filter((s) => s.files.length);
  const packageTypes = Array.from(
    new Set(project.files.flatMap((f) => f.packageTypes ?? [f.type])),
  ) as AssetType[];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(folderPath);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* 직접 선택해서 복사 */
    }
  };
  const copyFile = async (f: DesignAsset) => {
    const sep = /[\\/]$/.test(f.filePath) ? "" : f.filePath.includes("\\") ? "\\" : "/";
    try {
      await navigator.clipboard.writeText(`${f.filePath}${sep}${f.fileName}`);
    } catch {
      /* 무시 */
    }
    setCopiedId(f.id);
    setTimeout(() => setCopiedId((id) => (id === f.id ? null : id)), 1600);
  };
  const openVersions = (id: string) => {
    setShowVersions(true);
    if (!versioned.some((f) => f.id === id)) setVFilter("all");
    setOpenId(id);
    setTimeout(() => managerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };
  const byRecent = (list: DesignAsset[]) =>
    [...list].sort((a, b) => {
      const la = getVersions(a).at(-1)?.uploadDate ?? a.uploadDate;
      const lb = getVersions(b).at(-1)?.uploadDate ?? b.uploadDate;
      return lb.localeCompare(la);
    });
  const managerList = vFilter === "changed" ? byRecent(versioned) : project.files;

  return (
    <main className="page-shell project-page">
      <button className="back-link" onClick={onBack}>
        <ArrowLeft size={16} /> 검색 결과
      </button>

      <header className="project-head">
        <p className="project-eyebrow">
          {serviceName(project.service)} · {project.year}
          {project.requestNo && ` · 요청 ${project.requestNo}`}
        </p>
        <h1>{project.project}</h1>
        <p className="project-meta">
          파일 {project.files.length}개 · {typeSummary(project.files).join(", ")}
          {packageTypes.length > new Set(project.files.map((f) => f.type)).size &&
            ` · 구성: ${packageTypes.join(", ")}`}
        </p>
        <dl className="project-facts">
          <div>
            <dt>디자이너</dt>
            <dd>{project.designers.join(", ")}</dd>
          </div>
          <div>
            <dt>리소스</dt>
            <dd>
              {project.resources.length
                ? resourceLabels(project.resources, project.files.find((f) => f.resourceEtc)?.resourceEtc).join(" · ")
                : "없음"}
            </dd>
          </div>
          <div>
            <dt>최근 수정</dt>
            <dd>{project.latestDate}</dd>
          </div>
        </dl>
        <div className="project-actions">
          <button className="btn" onClick={copy}>
            {copied ? <Check size={16} /> : <FolderOpen size={16} />}
            {copied ? "복사 완료" : "NAS 폴더 경로 복사"}
          </button>
          {canUpload && (
            <>
              <button
                className={`btn ${showVersions ? "selected" : ""}`}
                onClick={() => setShowVersions(!showVersions)}
                aria-expanded={showVersions}
              >
                <GitBranch size={16} />
                버전 관리
                {versioned.length > 0 && <span className="btn-count">{versioned.length}</span>}
              </button>
              <button className="btn" onClick={() => setEditing(!editing)} aria-expanded={editing}>
                <Pencil size={16} />
                정보 수정
              </button>
              {onAddFiles && (
                <button className="btn btn-primary" onClick={() => onAddFiles(folderPath)}>
                  <Plus size={16} />
                  파일 추가
                </button>
              )}
            </>
          )}
        </div>
        {project.license !== "verified" && (
          <p
            className={`project-license ${project.license === "needs_review" ? "is-warning" : "is-danger"}`}
          >
            <TriangleAlert size={15} />
            라이선스를 확인해야 하는 파일이 있어요. 파일별 상태를 확인하세요.
          </p>
        )}
      </header>

      {editing && (
        <ProjectEditor
          files={project.files}
          packageTypes={packageTypes}
          onCancel={() => setEditing(false)}
          onSave={(list) => {
            onUpdateAssets?.(list, "프로젝트 정보를 저장했어요.");
            setEditing(false);
          }}
        />
      )}

      {showVersions && (
        <section className="version-manager" aria-label="버전 관리" ref={managerRef}>
          <header>
            <div>
              <h2>
                <History size={18} /> 버전 관리
              </h2>
              <p>작업마다 어떤 수정본이 쌓였는지 보여줘요. 줄을 누르면 버전별 작업물을 보고 되돌릴 수 있어요.</p>
            </div>
            <div className="seg" role="group" aria-label="보기">
              <button
                type="button"
                className={vFilter === "changed" ? "on" : ""}
                aria-pressed={vFilter === "changed"}
                onClick={() => setVFilter("changed")}
              >
                수정된 작업 {versioned.length}
              </button>
              <button
                type="button"
                className={vFilter === "all" ? "on" : ""}
                aria-pressed={vFilter === "all"}
                onClick={() => setVFilter("all")}
              >
                전체 {project.files.length}
              </button>
            </div>
          </header>
          {managerList.length === 0 ? (
            <p className="version-empty">아직 수정본이 올라온 작업이 없어요. 썸네일의 "새 버전"으로 올릴 수 있어요.</p>
          ) : (
            <div className="vrows">
              {managerList.map((f) => (
                <VersionRow
                  key={f.id}
                  asset={f}
                  open={openId === f.id}
                  onToggle={(next) => setOpenId(next ? f.id : null)}
                  canEdit={canUpload}
                  onOpen={() => onSelectAsset(f.id)}
                  onRevise={() => onReviseFile?.(f.id, folderPath)}
                  onRollback={(updated, message) => onUpdateAssets?.([updated], message)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {sections.map((sec) => (
        <section key={sec.type} className="project-section">
          <h2>
            {sec.type}
            <span>{sec.files.length}</span>
          </h2>
          <div className="project-files">
            {sec.files.map((f) => {
              const count = getVersions(f).length;
              return (
                <div key={f.id} className="project-file">
                  <div className="project-file-thumb">
                    <button
                      type="button"
                      className="project-file-open"
                      onClick={() => onSelectAsset(f.id)}
                      aria-label={`${f.title} 자세히 보기`}
                    >
                      <DesignThumbnail asset={f} />
                    </button>
                    {f.licenseStatus !== "verified" && (
                      <span className="image-status">
                        <Status value={f.licenseStatus} />
                      </span>
                    )}
                    <span className={`file-version-badge ${count > 1 ? "has-history" : ""}`}>{f.version}</span>
                    <div className="file-hover-actions">
                      <button type="button" onClick={() => onSelectAsset(f.id)}>
                        <Eye size={14} />
                        <span>자세히</span>
                      </button>
                      <button type="button" onClick={() => copyFile(f)}>
                        {copiedId === f.id ? <Check size={14} /> : <Copy size={14} />}
                        <span>{copiedId === f.id ? "복사됨" : "경로 복사"}</span>
                      </button>
                      {canUpload && onReviseFile && (
                        <button
                          type="button"
                          className="is-primary"
                          onClick={() => onReviseFile(f.id, folderPath)}
                        >
                          <Upload size={14} />
                          <span>새 버전</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <button type="button" className="project-file-title" onClick={() => onSelectAsset(f.id)}>
                    {f.title}
                    {f.device && <em>{f.device}</em>}
                  </button>
                  <span className="project-file-meta">
                    {count > 1 ? (
                      <button type="button" className="file-history-link" onClick={() => openVersions(f.id)}>
                        <History size={12} />
                        버전 {count}개
                      </button>
                    ) : (
                      "최초 버전"
                    )}
                    {" · "}
                    {f.designer} · {f.uploadDate}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <p className="project-path">
        <Copy size={13} /> {folderPath}
      </p>
    </main>
  );
}

/** 프로젝트 공통 정보 수정 — 같은 프로젝트의 모든 파일에 함께 적용 */
function ProjectEditor({
  files,
  packageTypes,
  onSave,
  onCancel,
}: {
  files: DesignAsset[];
  packageTypes: AssetType[];
  onSave: (list: DesignAsset[]) => void;
  onCancel: () => void;
}) {
  const first = files[0];
  const [title, setTitle] = useState(first.project);
  const [service, setService] = useState(first.service);
  const [year, setYear] = useState(String(first.year));
  const [requestNo, setRequestNo] = useState(first.requestNo ?? "");
  const [resources, setResources] = useState<string[]>(first.resources ?? []);
  const [resourceEtc, setResourceEtc] = useState(first.resourceEtc ?? "");
  const fileTypes = new Set(files.map((f) => f.type));
  const [pkg, setPkg] = useState<AssetType[]>(packageTypes);

  return (
    <form
      className="project-editor"
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return;
        onSave(
          files.map((f) => ({
            ...f,
            project: title.trim(),
            course: title.trim(),
            service,
            year: parseInt(year) || f.year,
            requestNo,
            resources,
            resourceEtc: resources.includes("기타") ? resourceEtc.trim() || undefined : undefined,
            hasSandoll: resources.includes("산돌"),
            packageTypes: Array.from(new Set([...pkg, ...fileTypes])) as AssetType[],
          })),
        );
      }}
    >
      <div className="review-grid">
        <label className={`span-2 ${!title.trim() ? "needs" : ""}`}>
          프로젝트 제목
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label>
          서비스
          <select value={service} onChange={(e) => setService(e.target.value)}>
            {SERVICES.map((sv) => (
              <option key={sv} value={sv}>
                {sv}
              </option>
            ))}
          </select>
        </label>
        <label>
          연도
          <input value={year} onChange={(e) => setYear(e.target.value)} />
        </label>
        <label>
          요청번호
          <input
            value={requestNo}
            placeholder="없음"
            onChange={(e) => setRequestNo(e.target.value.replace(/\D/g, "").slice(0, 5))}
          />
        </label>
      </div>
      <div className="builder-chips" role="group" aria-label="리소스">
        <span>리소스</span>
        {RESOURCES.map((r) => (
          <button
            type="button"
            key={r}
            className={resources.includes(r) ? "on" : ""}
            aria-pressed={resources.includes(r)}
            onClick={() =>
              setResources(resources.includes(r) ? resources.filter((x) => x !== r) : [...resources, r])
            }
          >
            {r}
          </button>
        ))}
      </div>
      {resources.includes("기타") && (
        <label className={`etc-resource ${!resourceEtc.trim() ? "needs" : ""}`}>
          기타 리소스 이름·출처
          <input
            value={resourceEtc}
            placeholder="예: 언스플래시 이미지, 프리픽 아이콘"
            onChange={(e) => setResourceEtc(e.target.value)}
          />
        </label>
      )}
      <div className="pkg-contents-chips">
        {ASSET_TYPES.map((t) => {
          const locked = fileTypes.has(t);
          const on = locked || pkg.includes(t);
          return (
            <label key={t} className={`${on ? "on" : ""} ${locked ? "locked" : ""}`}>
              <input
                type="checkbox"
                checked={on}
                disabled={locked}
                onChange={() => setPkg(on ? pkg.filter((x) => x !== t) : [...pkg, t])}
              />
              {t}
            </label>
          );
        })}
      </div>
      <div className="project-editor-actions">
        <button type="button" className="btn" onClick={onCancel}>
          취소
        </button>
        <button className="btn btn-primary">
          <Check size={16} />
          {files.length}개 파일에 저장
        </button>
      </div>
    </form>
  );
}

/** 작업 하나의 버전 줄: 접힌 상태는 한 줄(썸네일·노드), 펼치면 버전별 작업물·되돌리기 */
function VersionRow({
  asset,
  open,
  onToggle,
  canEdit,
  onOpen,
  onRevise,
  onRollback,
}: {
  asset: DesignAsset;
  open: boolean;
  onToggle: (open: boolean) => void;
  canEdit: boolean;
  onOpen: () => void;
  onRevise: () => void;
  onRollback: (updated: DesignAsset, message: string) => void;
}) {
  const versions = getVersions(asset);
  const [picked, setPicked] = useState(versions.length - 1);
  const [confirming, setConfirming] = useState(false);
  const v = versions[Math.min(picked, versions.length - 1)];
  const isCurrent = picked >= versions.length - 1;
  const last = versions[versions.length - 1];
  const preview: DesignAsset = {
    ...asset,
    version: v.version,
    fileName: v.fileName,
    imageUrl: v.imageUrl ?? (isCurrent ? asset.imageUrl : undefined),
  };

  const rollback = (target: VersionEntry) => {
    const version = nextVersion(last.version);
    const fileName = withVersion(target.fileName, version);
    const entry: VersionEntry = {
      version,
      fileName,
      filePath: target.filePath,
      uploadDate: new Date().toISOString().split("T")[0],
      designer: CURRENT_DESIGNER,
      reason: "되돌리기",
      note: `${target.version} 내용으로 되돌림`,
      originalKept: true,
      imageUrl: target.imageUrl,
    };
    onRollback(
      {
        ...asset,
        version,
        fileName,
        imageUrl: target.imageUrl ?? asset.imageUrl,
        uploadDate: entry.uploadDate,
        versions: [...versions, entry],
      },
      `${asset.title}${asset.device ? ` ${asset.device}` : ""}을(를) ${target.version}로 되돌렸어요 (${version})`,
    );
    setConfirming(false);
    setPicked(versions.length); // 새로 생긴 버전
  };

  return (
    <article className={`vrow ${open ? "is-open" : ""}`}>
      <div className="vrow-head">
        <button
          type="button"
          className="vrow-main"
          onClick={() => onToggle(!open)}
          aria-expanded={open}
        >
          <span className="vrow-thumb">
            <DesignThumbnail asset={asset} fit="cover" />
          </span>
          <span className="vrow-text">
            <strong>
              {asset.title}
              {asset.device && <em>{asset.device}</em>}
            </strong>
            <span>
              {versions.length > 1
                ? `${versions[0].version} → ${last.version} · 최근 ${last.reason} · ${last.uploadDate.slice(2).replace(/-/g, ".")}`
                : `${last.version} · 최초 제작 · ${last.uploadDate.slice(2).replace(/-/g, ".")}`}
            </span>
          </span>
        </button>
        <ol className="version-nodes is-mini" aria-label={`${asset.title} 버전`}>
          {versions.map((ver, i) => (
            <li
              key={ver.version + ver.uploadDate}
              className={`${open && i === picked ? "is-picked" : ""} ${i === versions.length - 1 ? "is-current" : ""} ${ver.reason === "되돌리기" ? "is-revert" : ""}`}
            >
              <button
                type="button"
                title={`${ver.version} · ${ver.reason} · ${ver.uploadDate}`}
                onClick={() => {
                  setPicked(i);
                  setConfirming(false);
                  onToggle(true);
                }}
                aria-pressed={open && i === picked}
                aria-label={`${ver.version} ${ver.reason} ${ver.uploadDate}`}
              >
                <span className="node-dot">{ver.reason === "되돌리기" ? <RotateCcw size={9} /> : null}</span>
                <span className="node-version">{ver.version}</span>
              </button>
            </li>
          ))}
        </ol>
        <button
          type="button"
          className="vrow-chevron"
          onClick={() => onToggle(!open)}
          aria-label={open ? "접기" : "펼치기"}
        >
          <ChevronDown size={18} />
        </button>
      </div>

      {open && (
        <div className="version-detail">
          <div className="version-detail-thumb">
            <DesignThumbnail asset={preview} />
            {!v.originalKept && <span className="version-gone-badge">NAS 원본 정리됨</span>}
          </div>
          <div className="version-detail-info">
            <p className="version-detail-head">
              <strong>{v.version}</strong>
              {isCurrent ? <span className="version-current">현재</span> : <span className="version-old">이전 버전</span>}
              <span className="version-reason">{v.reason}</span>
            </p>
            {v.note && <p className="version-note">{v.note}</p>}
            <dl className="file-meta">
              <div>
                <dt>올린 날</dt>
                <dd>{v.uploadDate}</dd>
              </div>
              <div>
                <dt>디자이너</dt>
                <dd>{v.designer}</dd>
              </div>
              <div>
                <dt>파일</dt>
                <dd>{v.fileName}</dd>
              </div>
            </dl>
            {!isCurrent && canEdit && (
              <div className="rollback">
                {!v.originalKept ? (
                  <p className="rollback-note">NAS 원본이 정리돼서 이 버전으로 되돌릴 수 없어요.</p>
                ) : confirming ? (
                  <>
                    <p className="rollback-note">
                      {v.version} 내용을 새 버전({nextVersion(last.version)})으로 다시 올려요. 기존 기록은 그대로 남아요.
                    </p>
                    <div className="rollback-actions">
                      <button type="button" className="btn" onClick={() => setConfirming(false)}>
                        <X size={15} />
                        취소
                      </button>
                      <button type="button" className="btn btn-primary" onClick={() => rollback(v)}>
                        <RotateCcw size={15} />
                        되돌리기
                      </button>
                    </div>
                  </>
                ) : (
                  <button type="button" className="btn" onClick={() => setConfirming(true)}>
                    <RotateCcw size={15} />
                    이 버전으로 되돌리기
                  </button>
                )}
              </div>
            )}
            <div className="vrow-actions">
              <button type="button" className="text-button" onClick={onOpen}>
                <Eye size={14} />
                자세히 보기
              </button>
              {canEdit && (
                <button type="button" className="text-button" onClick={onRevise}>
                  <Upload size={14} />
                  수정본 올리기
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
