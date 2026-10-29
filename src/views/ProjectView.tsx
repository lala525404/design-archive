import React, { useMemo, useState } from "react";
import { ArrowLeft, Check, Copy, FolderOpen, Plus, TriangleAlert } from "lucide-react";
import { DesignAsset } from "../types";
import { DesignThumbnail } from "../components/DesignThumbnail";
import { Status } from "../components/Chrome";
import { ASSET_TYPES, serviceName } from "../lib/taxonomy";
import { groupProjects, projectKey, typeSummary } from "../lib/projects";

interface Props {
  projectKey: string;
  assets: DesignAsset[];
  onBack: () => void;
  onSelectAsset: (id: string) => void;
  onAddFiles?: () => void;
  canUpload?: boolean;
}

/** 프로젝트(패키지) 한 개: 안에 든 상세·배너·팝업… 파일을 유형별로 모아 본다 */
export function ProjectView({
  projectKey: key,
  assets,
  onBack,
  onSelectAsset,
  onAddFiles,
  canUpload = true,
}: Props) {
  const project = useMemo(
    () => groupProjects(assets.filter((a) => projectKey(a) === key))[0],
    [assets, key],
  );
  const [copied, setCopied] = useState(false);

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
        </p>
        <dl className="project-facts">
          <div>
            <dt>디자이너</dt>
            <dd>{project.designers.join(", ")}</dd>
          </div>
          <div>
            <dt>리소스</dt>
            <dd>{project.resources.length ? project.resources.join(" · ") : "없음"}</dd>
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
          {canUpload && onAddFiles && (
            <button className="btn btn-primary" onClick={onAddFiles}>
              <Plus size={16} />
              파일 추가
            </button>
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
                  {f.version} · {f.designer} · {f.uploadDate}
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
