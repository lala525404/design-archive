import React, { useMemo, useState } from "react";
import {
  Check,
  ChevronRight,
  Copy,
  FileImage,
  HardDrive,
  History,
  LayoutGrid,
  List,
  Plus,
  SquareArrowOutUpRight,
} from "lucide-react";
import { DesignAsset, VersionEntry } from "../types";
import { DesignThumbnail } from "../components/DesignThumbnail";
import { SERVICES, serviceName } from "../lib/taxonomy";
import { projectKey, sortFiles, typeSummary } from "../lib/projects";
import { assetAtVersion, getVersions, parseNasPath } from "../lib/versions";

/** NAS 루트 표시 이름 */
export const NAS_ROOT = "\\\\NAS\\디자인";
const OLD = "이전 버전";
/** 지난 연도 폴더를 모아 두는 곳 */
export const PAST = "이전 연도";
/** 지금 연도 (사용자 컴퓨터 시간 기준). 해가 바뀌면 지난 연도는 '이전 연도'로 들어간다 */
const currentYear = () => String(new Date().getFullYear());

interface Props {
  assets: DesignAsset[];
  /** [연도, 서비스, 프로젝트 폴더, (이전 버전)] · 비어 있으면 올해 · ['이전 연도']는 지난 연도 목록 */
  path: string[];
  onOpen: (path: string[]) => void;
  onSelectAsset: (id: string) => void;
  onOpenProject: (key: string) => void;
  onAddFiles?: (folder: string) => void;
  canUpload?: boolean;
}

interface Located {
  asset: DesignAsset;
  service: string;
  year: string;
  folder: string;
}

/** 자산마다 NAS 상의 위치(서비스/연도/프로젝트 폴더)를 읽는다 */
export function locate(a: DesignAsset): Located {
  const p = parseNasPath(a.filePath);
  return {
    asset: a,
    service: p.service || a.service,
    year: String(p.year || a.year),
    folder: p.folder || a.project,
  };
}

/** 폴더 화면에서 프로젝트 폴더로 가는 경로 (NAS 순서: 연도/서비스/프로젝트) */
export function folderPathOf(a: DesignAsset) {
  const l = locate(a);
  return [l.year, l.service, l.folder];
}

const fmt = (d: string) => d.replace(/-/g, ".");

/** NAS 폴더처럼: 서비스 → 연도 → 프로젝트 폴더 → 파일 */
export function FolderView({
  assets,
  path,
  onOpen,
  onSelectAsset,
  onOpenProject,
  onAddFiles,
  canUpload = true,
}: Props) {
  const [mode, setMode] = useState<"icon" | "list">(() => {
    try {
      return (localStorage.getItem("folder-mode") as "icon" | "list") || "icon";
    } catch {
      return "icon";
    }
  });
  const [copied, setCopied] = useState(false);
  const setModeSaved = (m: "icon" | "list") => {
    setMode(m);
    try {
      localStorage.setItem("folder-mode", m);
    } catch {
      /* 저장 못 해도 동작 */
    }
  };

  const all = useMemo(() => assets.map(locate), [assets]);
  const CUR = currentYear();
  const pastYears = Array.from(new Set(all.map((l) => l.year).filter((y) => y !== CUR))).sort().reverse();
  const isPastList = path[0] === PAST;
  // 경로가 비어 있으면 올해 폴더를 연 것으로 본다
  const [year, service, folder, sub] = isPastList ? [] : path.length ? path : [CUR];
  const isRoot = !isPastList && path.length === 0;

  const inYear = all.filter((l) => l.year === year);
  const inService = inYear.filter((l) => !service || l.service === service);
  const inFolder = inService.filter((l) => !folder || l.folder === folder);

  const nasPath = isPastList
    ? `${NAS_ROOT}\\`
    : [NAS_ROOT, year, service, folder].filter(Boolean).join("\\") + "\\";
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(nasPath);
    } catch {
      /* 직접 선택 */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  // 지금 보는 폴더의 내용
  type Entry =
    | { kind: "folder"; name: string; label?: string; meta: string; date?: string; previews: DesignAsset[]; to: string[]; empty?: boolean; tone?: "old" }
    | { kind: "file"; name: string; label: string; meta: string; date: string; asset: DesignAsset; version?: VersionEntry };

  const entries: Entry[] = useMemo(() => {
    const projectsOf = (list: Located[]) => new Set(list.map((l) => `${l.service}/${l.year}/${l.folder}`)).size;
    const latest = (list: Located[]) =>
      list.map((l) => l.asset.uploadDate).sort().at(-1) ?? "";
    const previewsOf = (list: Located[]) =>
      [...list].sort((a, b) => b.asset.uploadDate.localeCompare(a.asset.uploadDate)).slice(0, 3).map((l) => l.asset);

    if (isPastList)
      return pastYears.map((y) => {
        const list = all.filter((l) => l.year === y);
        return {
          kind: "folder" as const,
          name: y,
          meta: `프로젝트 ${projectsOf(list)} · 파일 ${list.length}`,
          date: latest(list),
          previews: previewsOf(list),
          to: [y],
        };
      });

    if (!service) {
      // 올해는 서비스 폴더를 모두 보여주고, 지난 연도는 있는 폴더만
      const names = year === CUR ? [...SERVICES] : SERVICES.filter((sv) => inYear.some((l) => l.service === sv));
      const list: Entry[] = names.map((sv) => {
        const inSv = inYear.filter((l) => l.service === sv);
        return {
          kind: "folder" as const,
          name: sv,
          meta: inSv.length ? `프로젝트 ${projectsOf(inSv)} · 파일 ${inSv.length}` : "비어 있음",
          date: latest(inSv),
          previews: previewsOf(inSv),
          to: [year, sv],
          empty: !inSv.length,
        };
      });
      if (isRoot && pastYears.length)
        list.push({
          kind: "folder",
          name: PAST,
          meta: pastYears.join(", "),
          date: latest(all.filter((l) => l.year !== CUR)),
          previews: previewsOf(all.filter((l) => l.year !== CUR)),
          to: [PAST],
          tone: "old",
        });
      return list;
    }

    if (!folder) {
      const folders = Array.from(new Set(inService.map((l) => l.folder))).sort().reverse();
      return folders.map((f) => {
        const list = inService.filter((l) => l.folder === f);
        return {
          kind: "folder" as const,
          name: f,
          label: list[0].asset.project,
          meta: `${typeSummary(list.map((l) => l.asset)).join(", ")} · 파일 ${list.length}`,
          date: latest(list),
          previews: previewsOf(list),
          to: [year, service, f],
        };
      });
    }

    const files = sortFiles(inFolder.map((l) => l.asset));
    const olds = files.flatMap((a) =>
      getVersions(a)
        .slice(0, -1)
        .map((v) => ({ asset: a, version: v })),
    );

    if (sub === OLD)
      return [...olds]
        .sort((a, b) => b.version.uploadDate.localeCompare(a.version.uploadDate))
        .map(({ asset, version }) => ({
          kind: "file" as const,
          name: version.fileName,
          label: asset.title,
          meta: `${version.version} · ${version.reason}${version.originalKept ? "" : " · 원본 정리됨"}`,
          date: version.uploadDate,
          asset,
          version,
        }));

    const list: Entry[] = files.map((a) => ({
      kind: "file" as const,
      name: a.fileName,
      label: a.title,
      meta: `${a.version}${getVersions(a).length > 1 ? ` · 버전 ${getVersions(a).length}개` : ""} · ${a.designer}`,
      date: a.uploadDate,
      asset: a,
    }));
    if (olds.length)
      list.unshift({
        kind: "folder",
        name: OLD,
        meta: `파일 ${olds.length}`,
        date: olds.map((o) => o.version.uploadDate).sort().at(-1),
        previews: olds.slice(0, 3).map((o) => assetAtVersion(o.asset, o.version)),
        to: [year, service, folder, OLD],
        tone: "old",
      });
    return list;
  }, [all, inService, inYear, inFolder, service, year, folder, sub, isPastList, isRoot, CUR]);

  const shown = [year, service, folder, sub].filter(Boolean) as string[];
  const crumbs = [
    { name: "디자인 NAS", to: [] as string[] },
    ...(isPastList || (year && year !== CUR) ? [{ name: PAST, to: [PAST] }] : []),
    ...shown.map((p, i) => ({ name: p, to: i === 0 && p === CUR ? [] : shown.slice(0, i + 1) })),
  ];
  const inProject = Boolean(folder);
  const projectAsset = inFolder[0]?.asset;

  return (
    <main className="page-shell finder-page">
      <div className="finder">
        <aside className="finder-side" aria-label="서비스 폴더">
          <p className="finder-side-title">{CUR}년</p>
          <button type="button" className={isRoot || (year === CUR && !service) ? "on" : ""} onClick={() => onOpen([])}>
            <HardDrive size={15} />
            <span>{CUR} 전체</span>
          </button>
          {SERVICES.map((sv) => {
            const n = all.filter((l) => l.year === CUR && l.service === sv).length;
            return (
              <button
                type="button"
                key={sv}
                className={`${year === CUR && service === sv ? "on" : ""} ${n ? "" : "is-empty"}`}
                onClick={() => onOpen([CUR, sv])}
              >
                <FolderGlyph small />
                <span>{sv}</span>
                {n > 0 && <em>{n}</em>}
              </button>
            );
          })}
          {pastYears.length > 0 && (
            <>
              <p className="finder-side-title finder-side-title--gap">{PAST}</p>
              {pastYears.map((y) => (
                <button
                  type="button"
                  key={y}
                  className={year === y ? "on" : ""}
                  onClick={() => onOpen([y])}
                >
                  <FolderGlyph small old />
                  <span>{y}</span>
                  <em>{all.filter((l) => l.year === y).length}</em>
                </button>
              ))}
            </>
          )}
        </aside>

        <section className="finder-main">
          <header className="finder-bar">
            <nav className="finder-crumbs" aria-label="폴더 경로">
              {crumbs.map((c, i) => (
                <React.Fragment key={c.to.join("/") || "root"}>
                  {i > 0 && <ChevronRight size={14} aria-hidden="true" />}
                  <button
                    type="button"
                    onClick={() => onOpen(c.to)}
                    aria-current={i === crumbs.length - 1 ? "page" : undefined}
                  >
                    {i === 0 && <HardDrive size={14} />}
                    {c.name}
                  </button>
                </React.Fragment>
              ))}
            </nav>
            <div className="finder-tools">
              <button type="button" className="finder-copy" onClick={copy} title={nasPath}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "복사됨" : "경로 복사"}
              </button>
              <div className="seg finder-mode" role="group" aria-label="보기 방식">
                <button
                  type="button"
                  className={mode === "icon" ? "on" : ""}
                  aria-pressed={mode === "icon"}
                  onClick={() => setModeSaved("icon")}
                  aria-label="아이콘으로 보기"
                >
                  <LayoutGrid size={15} />
                </button>
                <button
                  type="button"
                  className={mode === "list" ? "on" : ""}
                  aria-pressed={mode === "list"}
                  onClick={() => setModeSaved("list")}
                  aria-label="목록으로 보기"
                >
                  <List size={15} />
                </button>
              </div>
            </div>
          </header>

          {isPastList && (
            <p className="finder-note">
              <History size={14} />
              해가 바뀌면 지난 연도 폴더는 자동으로 여기로 옮겨져요.
            </p>
          )}
          {inProject && projectAsset && sub !== OLD && (
            <div className="finder-project">
              <div>
                <strong>{projectAsset.project}</strong>
                <span>
                  {serviceName(projectAsset.service)}
                  {projectAsset.requestNo && ` · 요청 ${projectAsset.requestNo}`} · 파일 {inFolder.length}개
                </span>
              </div>
              <div className="finder-project-actions">
                <button type="button" className="btn" onClick={() => onOpenProject(projectKey(projectAsset))}>
                  <SquareArrowOutUpRight size={15} />
                  프로젝트 화면
                </button>
                {canUpload && onAddFiles && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => onAddFiles(projectAsset.filePath)}
                  >
                    <Plus size={15} />
                    파일 추가
                  </button>
                )}
              </div>
            </div>
          )}
          {sub === OLD && (
            <p className="finder-note">
              <History size={14} />
              수정 전 파일들이에요. 누르면 그 파일의 상세에서 버전별로 볼 수 있어요.
            </p>
          )}

          {entries.length === 0 ? (
            <p className="finder-empty">이 폴더는 비어 있어요.</p>
          ) : mode === "icon" ? (
            <ul className="finder-grid">
              {entries.map((e) => (
                <li key={e.kind + e.name + ("version" in e && e.version ? e.version.version : "")}>
                  {e.kind === "folder" ? (
                    <button
                      type="button"
                      className={`finder-item is-folder ${e.empty ? "is-empty" : ""} ${e.tone === "old" ? "is-old" : ""}`}
                      onClick={() => onOpen(e.to)}
                    >
                      <span className="finder-folder">
                        <span className="finder-folder-back" />
                        <span className="finder-folder-peek">
                          {e.previews.map((a, i) => (
                            <span key={a.id + i} className={`peek peek-${i}`}>
                              <DesignThumbnail asset={a} fit="cover" />
                            </span>
                          ))}
                        </span>
                        <span className="finder-folder-front">
                          {e.tone === "old" && <History size={22} />}
                        </span>
                      </span>
                      <span className="finder-name" title={e.name}>
                        {e.name}
                      </span>
                      {e.label && <span className="finder-label">{e.label}</span>}
                      <span className="finder-meta">{e.meta}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={`finder-item is-file ${e.version ? "is-old" : ""}`}
                      onClick={() => onSelectAsset(e.asset.id)}
                    >
                      <span className="finder-thumb">
                        <DesignThumbnail asset={e.version ? assetAtVersion(e.asset, e.version) : e.asset} />
                        <span className="finder-ver">{e.version ? e.version.version : e.asset.version}</span>
                      </span>
                      <span className="finder-name" title={e.name}>
                        {e.name}
                      </span>
                      <span className="finder-meta">{e.meta}</span>
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <table className="finder-table">
              <thead>
                <tr>
                  <th>이름</th>
                  <th>설명</th>
                  <th>수정일</th>
                  <th className="hide-sm">정보</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr
                    key={e.kind + e.name + ("version" in e && e.version ? e.version.version : "")}
                    className={e.kind === "folder" && e.empty ? "is-empty" : ""}
                    onClick={() => (e.kind === "folder" ? onOpen(e.to) : onSelectAsset(e.asset.id))}
                  >
                    <td>
                      <button
                        type="button"
                        className="finder-row-name"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          if (e.kind === "folder") onOpen(e.to);
                          else onSelectAsset(e.asset.id);
                        }}
                      >
                        {e.kind === "folder" ? <FolderGlyph small old={e.tone === "old"} /> : <FileImage size={16} />}
                        <span title={e.name}>{e.name}</span>
                      </button>
                    </td>
                    <td className="muted-cell">{e.kind === "folder" ? e.label ?? "" : e.label}</td>
                    <td className="muted-cell">{e.date ? fmt(e.date) : "—"}</td>
                    <td className="muted-cell hide-sm">{e.meta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </main>
  );
}

function FolderGlyph({ small, old }: { small?: boolean; old?: boolean }) {
  const s = small ? 16 : 40;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden="true" className="folder-glyph">
      <path d="M2 6.5A2.5 2.5 0 0 1 4.5 4h4.2l2 2h8.8A2.5 2.5 0 0 1 22 8.5v9A2.5 2.5 0 0 1 19.5 20h-15A2.5 2.5 0 0 1 2 17.5z" fill={old ? "#c7c7cc" : "#62a8f4"} />
      <path d="M2 9h20v8.5a2.5 2.5 0 0 1-2.5 2.5h-15A2.5 2.5 0 0 1 2 17.5z" fill={old ? "#d8d8dc" : "#8cc3fa"} />
    </svg>
  );
}
