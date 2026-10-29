import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  Copy,
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
        <section className="version-manager" aria-label="버전 관리">
          <header>
            <h2>
              <History size={18} /> 버전 흐름
            </h2>
            <p>점을 누르면 그 버전의 작업물을 볼 수 있어요. 필요하면 예전 버전으로 되돌릴 수 있어요.</p>
          </header>
          {project.files.map((f) => (
            <VersionFlow
              key={f.id}
              asset={f}
              canEdit={canUpload}
              onOpen={() => onSelectAsset(f.id)}
              onRevise={() => onReviseFile?.(f.id, folderPath)}
              onRollback={(updated, message) => onUpdateAssets?.([updated], message)}
            />
          ))}
        </section>
      )}

      {sections.map((sec) => (
        <section key={sec.type} className="project-section">
          <h2>
            {sec.type}
            <span>{sec.files.length}</span>
          </h2>
          <div className="project-files">
            {sec.files.map((f) => (
              <button key={f.id} className="project-file" onClick={() => onSelectAsset(f.id)}>
                <div className="project-file-thumb">
                  <DesignThumbnail asset={f} />
                  {f.licenseStatus !== "verified" && (
                    <span className="image-status">
                      <Status value={f.licenseStatus} />
                    </span>
                  )}
                </div>
                <span className="project-file-title">
                  {f.title}
                  {f.device && <em>{f.device}</em>}
                </span>
                <span className="project-file-meta">
                  {f.version}
                  {getVersions(f).length > 1 && ` (버전 ${getVersions(f).length}개)`} · {f.designer} ·{" "}
                  {f.uploadDate}
                </span>
              </button>
            ))}
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

/** 파일 하나의 버전 흐름 (노드) + 고른 버전 보기 + 되돌리기 */
function VersionFlow({
  asset,
  canEdit,
  onOpen,
  onRevise,
  onRollback,
}: {
  asset: DesignAsset;
  canEdit: boolean;
  onOpen: () => void;
  onRevise: () => void;
  onRollback: (updated: DesignAsset, message: string) => void;
}) {
  const versions = getVersions(asset);
  const [picked, setPicked] = useState(versions.length - 1);
  const [confirming, setConfirming] = useState(false);
  const v = versions[Math.min(picked, versions.length - 1)];
  const isCurrent = picked === versions.length - 1;
  const preview: DesignAsset = {
    ...asset,
    version: v.version,
    fileName: v.fileName,
    imageUrl: v.imageUrl ?? (isCurrent ? asset.imageUrl : undefined),
  };

  const rollback = (target: VersionEntry) => {
    const latest = versions[versions.length - 1];
    const version = nextVersion(latest.version);
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
    <article className={`version-flow ${versions.length >= 3 ? "is-long" : ""}`}>
      <div className="version-flow-head">
        <button type="button" className="version-flow-title" onClick={onOpen}>
          {asset.title}
          {asset.device && <em>{asset.device}</em>}
        </button>
        <span className="version-flow-count">버전 {versions.length}개</span>
        {canEdit && (
          <button type="button" className="text-button" onClick={onRevise}>
            <Upload size={14} />
            수정본 올리기
          </button>
        )}
      </div>

      <ol className="version-nodes" aria-label={`${asset.title} 버전`}>
        {versions.map((ver, i) => (
          <li
            key={ver.version + ver.uploadDate}
            className={`${i === picked ? "is-picked" : ""} ${i === versions.length - 1 ? "is-current" : ""} ${ver.reason === "되돌리기" ? "is-revert" : ""}`}
          >
            <button
              type="button"
              onClick={() => {
                setPicked(i);
                setConfirming(false);
              }}
              aria-pressed={i === picked}
              aria-label={`${ver.version} ${ver.reason} ${ver.uploadDate}`}
            >
              <span className="node-dot">{ver.reason === "되돌리기" ? <RotateCcw size={11} /> : null}</span>
              <span className="node-version">{ver.version}</span>
              <span className="node-reason">{ver.reason}</span>
              <span className="node-date">{ver.uploadDate.slice(2).replace(/-/g, ".")}</span>
            </button>
          </li>
        ))}
      </ol>

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
                    {v.version} 내용을 새 버전({nextVersion(versions[versions.length - 1].version)})으로
                    다시 올려요. 기존 기록은 그대로 남아요.
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
        </div>
      </div>
    </article>
  );
}
