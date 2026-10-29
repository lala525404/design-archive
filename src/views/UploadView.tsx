import React, { useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FolderOpen,
  FolderUp,
  History,
  ImagePlus,
  Plus,
  Sparkles,
  TriangleAlert,
  X,
} from "lucide-react";
import { PageTitle } from "../components/Chrome";
import { DesignThumbnail } from "../components/DesignThumbnail";
import { AssetType, ChangeReason, DesignAsset, VersionEntry } from "../types";
import {
  CHANGE_REASONS,
  findSameWork,
  getVersions,
  nextVersion,
  parseNasPath,
  versionNumber,
  withVersion,
} from "../lib/versions";
import {
  ASSET_TYPES,
  CURRENT_DESIGNER,
  DESIGNERS,
  DEVICE_TYPES,
  SERVICES,
  RESOURCES,
  TOOLS,
  serviceName,
} from "../lib/taxonomy";
import { parseDeliverable, parseProjectFolder } from "../lib/naming";
import { guessType } from "../lib/taxonomy";

export interface UploadResult {
  added: DesignAsset[];
  updated: DesignAsset[];
  project: string;
}
interface UploadViewProps {
  assets?: DesignAsset[];
  onBack: () => void;
  onSubmit: (result: UploadResult) => void;
}

interface PickedFile {
  key: string;
  name: string;
  size: string;
  url?: string;
  /** 폴더째 올렸을 때 패키지 폴더 안에서의 경로 (예: 배너/MO/파일.png) */
  relPath?: string;
}

/** 아카이브에 올릴 결과물만 받는다. 원본(PSD·AI 등)과 시스템 파일은 건너뛴다 */
const isDeliverable = (name: string) =>
  !/^\./.test(name) &&
  !/^(thumbs\.db|desktop\.ini)$/i.test(name) &&
  /\.(png|jpe?g|gif|webp|svg|pdf|pptx?|key)$/i.test(name);

/** 드래그한 폴더를 끝까지 열어 파일 목록을 만든다 */
async function readEntry(entry: any, prefix = ""): Promise<{ file: File; path: string }[]> {
  if (entry.isFile) {
    const file: File = await new Promise((res, rej) => entry.file(res, rej));
    return [{ file, path: prefix + file.name }];
  }
  if (entry.isDirectory) {
    const reader = entry.createReader();
    const entries: any[] = [];
    // readEntries는 한 번에 일부만 돌려줘서 빌 때까지 반복
    for (;;) {
      const batch: any[] = await new Promise((res, rej) => reader.readEntries(res, rej));
      if (!batch.length) break;
      entries.push(...batch);
    }
    const nested = await Promise.all(
      entries.map((e) => readEntry(e, `${prefix}${entry.name}/`)),
    );
    return nested.flat();
  }
  return [];
}
interface Item {
  key: string;
  file: PickedFile;
  title: string;
  type: AssetType | "";
  device?: "PC" | "MO";
  tools: string[];
  designer: string;
  version: string;
  colors: string[];
  issues: string[];
}

const SAMPLE = {
  path: "\\\\NAS\\디자인\\05_평생\\2026\\260120_15832_색채학 과정_산돌-AI_김다은\\",
  files: [
    "15832_상세_PC_v04.png",
    "15832_상세_MO_v03.png",
    "15832_배너-서브_PC_v01.png",
    "15832_팝업_PC_v02.png",
  ],
};

const fileKey = () => Math.random().toString(36).slice(2, 9);
const sizeText = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

/** 파일명 하나에서 유형·PC/MO·버전을 읽는다 (새 규칙 우선, 아니면 키워드로 추정) */
function readFileName(
  name: string,
  project: string,
  lead: string,
  resources: string[],
  relPath = "",
) {
  const info = parseDeliverable(name);
  // 파일명으로 모르면 하위 폴더 이름(배너/, MO/ 등)으로 보충
  const folders = relPath.split("/").slice(0, -1).join("/");
  if (!info.type && folders) {
    const g = guessType(folders);
    if (g.type) info.type = g.type;
  }
  if (!info.device && info.type && DEVICE_TYPES.includes(info.type)) {
    if (/(^|\/)(mo|mobile|모바일)(\/|$)/i.test(folders)) info.device = "MO";
    else if (/(^|\/)pc(\/|$)/i.test(folders)) info.device = "PC";
  }
  const title = [project, info.label, info.type || "작업"].filter(Boolean).join(" ");
  return {
    type: info.type,
    device: info.device,
    tools: resources.filter((r) => TOOLS.includes(r)),
    designer: lead || CURRENT_DESIGNER,
    version: info.version,
    title,
    issues: info.issues,
  };
}

/** 업로드한 이미지에서 많이 쓰인 색 두 가지를 이름으로 뽑는다 */
async function readImageColors(url: string): Promise<string[]> {
  const img = new Image();
  img.src = url;
  await img.decode();
  const canvas = document.createElement("canvas");
  canvas.width = 48;
  canvas.height = 48;
  const ctx = canvas.getContext("2d");
  if (!ctx) return [];
  ctx.drawImage(img, 0, 0, 48, 48);
  const data = ctx.getImageData(0, 0, 48, 48).data;
  const counts: Record<string, number> = {};
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    const max = Math.max(r, g, b),
      min = Math.min(r, g, b);
    const sat = max === min ? 0 : (max - min) / (255 - Math.abs(max + min - 255));
    if (sat < 0.18) continue;
    const d = max - min;
    let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
    const name =
      h < 15 || h >= 340 ? "레드" : h < 40 ? "오렌지" : h < 65 ? "옐로" : h < 150 ? "그린" : h < 185 ? "민트" : h < 250 ? "블루" : h < 290 ? "퍼플" : "핑크";
    counts[name] = (counts[name] || 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([n]) => `${n}톤`);
}

export const UploadView: React.FC<UploadViewProps> = ({
  assets = [],
  onBack,
  onSubmit,
}) => {
  const [step, setStep] = useState<0 | 1>(0);
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [nasPath, setNasPath] = useState("");
  const [dragging, setDragging] = useState(false);
  const [packageFolder, setPackageFolder] = useState("");
  const [skipped, setSkipped] = useState(0);
  const folderInput = useRef<HTMLInputElement>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  // 프로젝트 공통 정보
  const [service, setService] = useState("");
  const [year, setYear] = useState("");
  const [project, setProject] = useState("");
  const [requestNo, setRequestNo] = useState("");
  const [projectDate, setProjectDate] = useState("");
  const [resources, setResources] = useState<string[]>([]);
  const [folderIssues, setFolderIssues] = useState<string[]>([]);
  const [folder, setFolder] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [extraTags, setExtraTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [changeReason, setChangeReason] = useState<ChangeReason | "">("");
  const [changeNote, setChangeNote] = useState("");
  const [fontConfirmed, setFontConfirmed] = useState(false);
  const [packageTypes, setPackageTypes] = useState<AssetType[]>([]);

  const addFiles = (list: { file: File; path?: string }[]) => {
    if (!list.length) return;
    const keep = list.filter(({ file }) => isDeliverable(file.name));
    setSkipped((n) => n + (list.length - keep.length));
    // 폴더째 올렸으면 맨 위 폴더 = 프로젝트 폴더
    const top = list.find((x) => x.path?.includes("/"))?.path?.split("/")[0];
    if (top) setPackageFolder(top);
    const next: PickedFile[] = keep.map(({ file, path }) => ({
      key: fileKey(),
      name: file.name,
      size: sizeText(file.size),
      url: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
      relPath: path && path.includes("/") ? path.split("/").slice(1).join("/") : undefined,
    }));
    setFiles((prev) => [...prev, ...next]);
    setError(keep.length ? "" : "올릴 수 있는 결과물(이미지·PDF·PPT)이 없어요.");
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const items = Array.from(e.dataTransfer.items ?? []);
    const entries = items
      .map((it) => (it as any).webkitGetAsEntry?.())
      .filter(Boolean);
    if (entries.some((en: any) => en.isDirectory)) {
      const all = (await Promise.all(entries.map((en: any) => readEntry(en)))).flat();
      addFiles(all);
    } else {
      addFiles(Array.from(e.dataTransfer.files).map((file) => ({ file })));
    }
  };

  const runAnalysis = async () => {
    let picked = files;
    let path = nasPath.trim();
    // 폴더째 올렸고 경로에 프로젝트 폴더가 없으면 붙여서 읽는다
    if (packageFolder) {
      const lastSeg = path.split(/[\\/]/).filter(Boolean).pop() ?? "";
      if (!path) path = packageFolder;
      else if (!parseProjectFolder(lastSeg).date && lastSeg !== packageFolder)
        path = `${path.replace(/[\\/]+$/, "")}/${packageFolder}`;
    }
    // 경로에 파일명까지 붙어 있고 파일을 안 올렸으면, 그 파일 하나로 등록
    const last = path.split(/[\\/]/).pop() ?? "";
    if (/\.[a-z0-9]{2,5}$/i.test(last)) {
      path = path.slice(0, path.length - last.length);
      if (!picked.length) picked = [{ key: fileKey(), name: last, size: "" }];
    }
    if (!path) {
      setError("NAS 프로젝트 폴더 경로를 입력해주세요.");
      return;
    }
    if (!picked.length) {
      setError("올릴 파일을 하나 이상 선택해주세요.");
      return;
    }
    setError("");
    setAnalyzing(true);
    const parsed = parseNasPath(path);
    const proj = parsed.project;
    const next: Item[] = await Promise.all(
      picked.map(async (f) => {
        const info = readFileName(f.name, proj, parsed.designer, parsed.resources, f.relPath);
        const colors = f.url ? await readImageColors(f.url).catch(() => []) : [];
        return { key: f.key, file: f, colors, ...info };
      }),
    );
    await new Promise((r) => setTimeout(r, 600));
    setService(parsed.service);
    setYear(parsed.year || String(new Date().getFullYear()));
    setProject(proj);
    setRequestNo(parsed.requestNo);
    setProjectDate(parsed.date);
    setResources(parsed.resources);
    setFolderIssues(parsed.issues);
    setPackageTypes(
      Array.from(new Set(next.map((it) => it.type).filter(Boolean))) as AssetType[],
    );
    setFolder(/[\\/]$/.test(path) ? path : `${path}/`);
    // 상세 → 풀페이지 → 배너 … 순서, 같은 유형이면 PC 먼저
    const order = (it: Item) =>
      (it.type ? ASSET_TYPES.indexOf(it.type) : 99) * 10 + (it.device === "MO" ? 1 : 0);
    setItems([...next].sort((a, b) => order(a) - order(b)));
    setExtraTags([]);
    setChangeReason("");
    setChangeNote("");
    setFontConfirmed(false);
    setAnalyzing(false);
    setStep(1);
  };

  // 같은 폴더 + 같은 작업명 파일이 이미 있으면 새 버전
  const matches = useMemo(
    () =>
      items.map((it) => {
        const existing = findSameWork(assets, folder, it.file.name);
        if (!existing) return { existing: undefined, finalVersion: it.version, fileName: it.file.name };
        const latest = getVersions(existing).at(-1)!;
        const finalVersion =
          versionNumber(it.version) <= versionNumber(latest.version)
            ? nextVersion(latest.version)
            : it.version;
        return {
          existing,
          from: latest.version,
          finalVersion,
          fileName:
            finalVersion !== it.version ? withVersion(it.file.name, finalVersion) : it.file.name,
        };
      }),
    [items, assets, folder],
  );
  const versionCount = matches.filter((m) => m.existing).length;
  const existingInProject = assets.filter(
    (a) => a.service === service && a.project === project && String(a.year) === year,
  );
  const usesSandoll = resources.includes("산돌");
  const typeCounts = items.reduce<Record<string, number>>((acc, it) => {
    if (it.type) acc[it.type] = (acc[it.type] ?? 0) + 1;
    return acc;
  }, {});
  // 파일이 있는 유형은 항상 체크된 상태로 유지
  const checkedTypes = Array.from(
    new Set([...packageTypes, ...(Object.keys(typeCounts) as AssetType[])]),
  );
  const mergedPackage = Array.from(
    new Set([
      ...checkedTypes,
      ...existingInProject.flatMap((a) => a.packageTypes ?? [a.type]),
    ]),
  ) as AssetType[];
  const commonTags = [
    year,
    serviceName(service),
    project.replace(/\s/g, ""),
    ...(requestNo ? [requestNo] : []),
    ...resources,
  ]
    .filter(Boolean)
    .map((t) => `#${t}`);
  const missing = [
    ...(!service ? ["서비스"] : []),
    ...(!project.trim() ? ["프로젝트명"] : []),
    ...(items.some((it) => !it.type) ? ["작업 유형"] : []),
  ];

  const patch = (key: string, p: Partial<Item>) =>
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...p } : it)));

  const submit = () => {
    if (missing.length) {
      setError(`${missing.join(", ")}을(를) 확인해주세요.`);
      return;
    }
    const today = new Date().toISOString().split("T")[0];
    const licenseStatus: DesignAsset["licenseStatus"] = fontConfirmed || !usesSandoll ? "verified" : "needs_review";
    const added: DesignAsset[] = [];
    const updated: DesignAsset[] = [];
    items.forEach((it, i) => {
      const m = matches[i];
      const itemSandoll = usesSandoll;
      const tags = Array.from(
        new Set([
          ...commonTags,
          `#${it.type}`,
          ...(it.device ? [`#${it.device}`] : []),
          ...it.tools.filter((t) => !resources.includes(t)).map((t) => `#${t}`),
          `#${it.designer}`,
          ...it.colors.map((c) => `#${c}`),
          ...extraTags,
        ]),
      );
      const entry: VersionEntry = {
        version: m.finalVersion,
        fileName: m.fileName,
        filePath: folder,
        uploadDate: today,
        designer: it.designer,
        reason: m.existing ? ((changeReason || "기타") as ChangeReason) : "최초 제작",
        note: m.existing ? changeNote.trim() || undefined : undefined,
        originalKept: true,
      };
      const common = {
        version: m.finalVersion,
        fileName: m.fileName,
        filePath: folder,
        designer: it.designer,
        tools: it.tools,
        hashtags: tags,
        hasSandoll: itemSandoll,
        licenseStatus: itemSandoll ? licenseStatus : ("verified" as const),
        licenseNote: itemSandoll
          ? fontConfirmed
            ? "업로더가 회사 라이선스 범위 안에서 사용했다고 확인했습니다."
            : "산돌 서체 사용이 감지되었습니다. 관리자 확인이 필요합니다."
          : undefined,
        uploadDate: today,
        packageTypes: mergedPackage,
        ...(it.file.url ? { imageUrl: it.file.url } : {}),
        ...(it.file.size ? { fileSize: it.file.size } : {}),
      };
      if (m.existing) {
        updated.push({
          ...m.existing,
          ...common,
          resources,
          versions: [...getVersions(m.existing), entry],
        });
      } else {
        added.push({
          id: `asset-${Date.now()}-${i}`,
          title: it.title,
          service,
          project: project.trim(),
          course: project.trim(),
          requestNo,
          projectDate,
          resources,
          professor: "",
          device: it.device,
          type: it.type as AssetType,
          year: parseInt(year) || new Date().getFullYear(),
          ...common,
          bgColor: "#F7F3EF",
          accentColor: "#246BFD",
          summary: `${serviceName(service)} ${project} 프로젝트의 ${it.type}${it.device ? ` ${it.device}` : ""} 작업입니다.`,
          versions: [entry],
        });
      }
    });
    // 같은 프로젝트의 기존 파일들도 패키지 구성을 함께 갱신
    existingInProject.forEach((a) => {
      if (!updated.some((u) => u.id === a.id))
        updated.push({ ...a, packageTypes: mergedPackage });
    });
    onSubmit({ added, updated, project: project.trim() });
  };

  return (
    <main className="page-shell upload-page quick-upload">
      <PageTitle title="자산 등록" onBack={onBack} />
      <ol className="quick-steps" aria-label="등록 단계">
        <li className={step === 0 ? "active" : "done"}>
          <span>{step === 0 ? 1 : <Check size={13} />}</span>올리기
        </li>
        <li className={step === 1 ? "active" : ""}>
          <span>2</span>확인하고 등록
        </li>
      </ol>

      {step === 0 && (
        <section className="quick-drop">
          <div
            className={`quick-dropzone ${dragging ? "is-over" : ""} ${files.length ? "has-files" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            <input
              ref={fileInput}
              type="file"
              multiple
              accept="image/*,.pdf,.ppt,.pptx"
              hidden
              onChange={(e) => {
                addFiles(Array.from(e.target.files ?? []).map((file) => ({ file })));
                e.target.value = "";
              }}
            />
            <input
              ref={folderInput}
              type="file"
              multiple
              hidden
              {...({ webkitdirectory: "", directory: "" } as any)}
              onChange={(e) => {
                addFiles(
                  Array.from(e.target.files ?? []).map((file) => ({
                    file,
                    path: (file as any).webkitRelativePath as string,
                  })),
                );
                e.target.value = "";
              }}
            />
            {files.length ? (
              <div className="picked-grid">
                {files.map((f) => (
                  <div key={f.key} className="picked">
                    <div className="picked-thumb">
                      {f.url ? <img src={f.url} alt="" /> : <span>{f.name.split(".").pop()?.toUpperCase()}</span>}
                    </div>
                    <span className="picked-name" title={f.name}>
                      {f.name}
                    </span>
                    <button
                      type="button"
                      aria-label={`${f.name} 빼기`}
                      onClick={() => setFiles(files.filter((x) => x.key !== f.key))}
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="picked picked-add"
                  onClick={() => fileInput.current?.click()}
                >
                  <Plus size={20} />
                  파일 추가
                </button>
                <button
                  type="button"
                  className="picked picked-add"
                  onClick={() => folderInput.current?.click()}
                >
                  <FolderUp size={20} />
                  폴더 추가
                </button>
              </div>
            ) : (
              <div className="dropzone-empty">
                <ImagePlus size={34} strokeWidth={1.4} />
                <strong>프로젝트 폴더나 파일을 끌어 놓으세요</strong>
                <span>
                  폴더째 올리면 안의 상세·배너·팝업·PPT를 모두 읽어요. 하나만 올려도 돼요.
                </span>
                <div className="dropzone-actions">
                  <button type="button" className="btn btn-primary" onClick={() => folderInput.current?.click()}>
                    <FolderUp size={16} />
                    폴더 선택
                  </button>
                  <button type="button" className="btn" onClick={() => fileInput.current?.click()}>
                    <ImagePlus size={16} />
                    파일 선택
                  </button>
                </div>
              </div>
            )}
          </div>

          {(packageFolder || skipped > 0) && (
            <p className="folder-note">
              {packageFolder && (
                <>
                  <FolderOpen size={14} /> <b>{packageFolder}</b> 폴더 · 결과물 {files.length}개
                </>
              )}
              {skipped > 0 && <span> · 원본·시스템 파일 {skipped}개는 건너뛰었어요</span>}
            </p>
          )}
          <label className="field quick-path">
            NAS 프로젝트 폴더
            <input
              value={nasPath}
              placeholder="\\NAS\디자인\05_평생\2026\260714_21076_프로젝트명_산돌-게티_김다은"
              onChange={(e) => setNasPath(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") runAnalysis();
              }}
            />
          </label>
          <p className="quick-help">
            폴더 이름에서 서비스·날짜·요청번호·프로젝트·리소스·디자이너를, 파일 이름에서
            유형·PC/MO·버전을 자동으로 채워요. 예전 이름도 최대한 읽어요.{" "}
            <button
              type="button"
              className="link-button"
              onClick={() => {
                setNasPath(SAMPLE.path);
                setPackageFolder("");
                setSkipped(0);
                setFiles(SAMPLE.files.map((name) => ({ key: fileKey(), name, size: "" })));
              }}
            >
              샘플 패키지 넣기
            </button>
          </p>

          <p role="alert" className="inline-feedback">
            {error}
          </p>
          <div className="wizard-footer">
            <button className="btn" onClick={onBack}>
              취소
            </button>
            <button className="btn btn-primary" onClick={runAnalysis} disabled={analyzing}>
              {analyzing ? (
                <>
                  <Sparkles size={16} className="spin" />
                  자동으로 채우는 중
                </>
              ) : (
                <>
                  자동으로 채우기
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </section>
      )}

      {step === 1 && (
        <section className="pkg-review is-simple">
          <p className="quick-status">
            <Sparkles size={15} />
            {missing.length
              ? `자동으로 분류했어요. ${missing.join(", ")}만 확인해주세요.`
              : "자동으로 분류했어요. 맞으면 바로 등록하세요."}
          </p>

          <div className="pkg-summary">
            <FolderOpen size={20} />
            <div>
              <strong>{project.trim() || "프로젝트명 없음"}</strong>
              <span>
                {service || "서비스 미지정"} · {year}
                {requestNo && ` · 요청 ${requestNo}`} · 파일 {items.length}개
              </span>
            </div>
            <em className={existingInProject.length ? "is-existing" : ""}>
              {existingInProject.length
                ? `기존 프로젝트에 추가 · ${versionCount ? `새 버전 ${versionCount}개` : "새 파일"}`
                : "새 프로젝트"}
            </em>
          </div>

          {(!service || !project.trim()) && (
            <div className="pkg-required">
              {!service && (
                <label>
                  서비스
                  <select value={service} onChange={(e) => setService(e.target.value)}>
                    <option value="">선택</option>
                    {SERVICES.map((sv) => (
                      <option key={sv} value={sv}>
                        {sv}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {!project.trim() && (
                <label>
                  프로젝트명
                  <input value={project} onChange={(e) => setProject(e.target.value)} />
                </label>
              )}
            </div>
          )}

          <fieldset className="pkg-contents">
            <legend>
              패키지 구성
              <span>파일 이름으로 체크했어요. 함께 만든 게 더 있으면 체크해주세요.</span>
            </legend>
            <div>
              {ASSET_TYPES.map((t) => {
                const n = typeCounts[t] ?? 0;
                const on = checkedTypes.includes(t);
                return (
                  <label key={t} className={`${on ? "on" : ""} ${n ? "locked" : ""}`}>
                    <input
                      type="checkbox"
                      checked={on}
                      disabled={n > 0}
                      onChange={() =>
                        setPackageTypes(
                          on ? packageTypes.filter((x) => x !== t) : [...packageTypes, t],
                        )
                      }
                    />
                    {t}
                    {n > 0 && <em>{n}</em>}
                  </label>
                );
              })}
            </div>
          </fieldset>


          <ul className="pkg-tiles">
            {items.map((it, i) => {
              const m = matches[i];
              const preview: DesignAsset = {
                id: `asset-${(i % 6) + 1}`,
                title: it.title,
                service,
                project,
                device: it.device,
                professor: "",
                course: project,
                type: (it.type || "카드뉴스") as AssetType,
                year: Number(year) || 2026,
                tools: it.tools,
                designer: it.designer,
                version: m.finalVersion,
                filePath: folder,
                fileName: m.fileName,
                hashtags: [],
                hasSandoll: false,
                licenseStatus: "verified",
                uploadDate: "",
                bgColor: "",
                accentColor: "",
                summary: "",
                imageUrl: it.file.url,
              };
              return (
                <li key={it.key} className={!it.type ? "needs" : ""}>
                  <div className="tile-thumb">
                    <DesignThumbnail asset={preview} />
                    <button
                      type="button"
                      className="tile-remove"
                      aria-label={`${it.file.name} 빼기`}
                      onClick={() => setItems(items.filter((x) => x.key !== it.key))}
                    >
                      <X size={13} />
                    </button>
                    {m.existing && <span className="tile-version">{m.from} → {m.finalVersion}</span>}
                  </div>
                  <div className="tile-controls">
                    <select
                      value={it.type}
                      aria-label="작업 유형"
                      onChange={(e) => {
                        const type = e.target.value as AssetType;
                        patch(it.key, {
                          type,
                          device: DEVICE_TYPES.includes(type) ? (it.device ?? "PC") : undefined,
                        });
                      }}
                    >
                      <option value="">유형 선택</option>
                      {ASSET_TYPES.map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                    {it.type && DEVICE_TYPES.includes(it.type) && (
                      <div className="seg" role="radiogroup" aria-label="PC 또는 MO">
                        {(["PC", "MO"] as const).map((d) => (
                          <button
                            type="button"
                            key={d}
                            className={it.device === d ? "on" : ""}
                            aria-pressed={it.device === d}
                            onClick={() => patch(it.key, { device: d })}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="tile-name" title={it.file.name}>
                    {it.file.name}
                  </span>
                </li>
              );
            })}
          </ul>

          <details className="pkg-more">
            <summary>세부 정보 · 자동으로 채웠어요</summary>
            <div className="pkg-more-body">
          <div className="pkg-head">
            <FolderOpen size={18} />
            <label className={!service ? "needs" : ""}>
              서비스
              <select value={service} onChange={(e) => setService(e.target.value)}>
                <option value="">선택</option>
                {SERVICES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label>
              연도
              <input value={year} onChange={(e) => setYear(e.target.value)} />
            </label>
            <label className={`pkg-project ${!project.trim() ? "needs" : ""}`}>
              프로젝트
              <input
                value={project}
                placeholder="프로젝트명"
                onChange={(e) => setProject(e.target.value)}
              />
            </label>
            <label>
              요청번호
              <input
                value={requestNo}
                placeholder="없음"
                inputMode="numeric"
                onChange={(e) => setRequestNo(e.target.value.replace(/\D/g, "").slice(0, 5))}
              />
            </label>
            <div className="pkg-resources" role="group" aria-label="리소스">
              <span>리소스</span>
              <div>
                {RESOURCES.map((r) => (
                  <button
                    type="button"
                    key={r}
                    className={resources.includes(r) ? "on" : ""}
                    aria-pressed={resources.includes(r)}
                    onClick={() =>
                      setResources(
                        resources.includes(r)
                          ? resources.filter((x) => x !== r)
                          : [...resources, r],
                      )
                    }
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            {folderIssues.length > 0 && (
              <p className="pkg-naming">
                <TriangleAlert size={13} />
                폴더 이름이 새 규칙과 달라서 추정해서 채웠어요 · {folderIssues[0]}
              </p>
            )}
            <p className="pkg-note">
              {existingInProject.length
                ? `기존 '${project}' 프로젝트에 추가돼요 · 지금 ${existingInProject.length}개 작업`
                : "새 프로젝트로 등록돼요"}
            </p>
          </div>

          {versionCount > 0 && (
            <div className="quick-card">
              <div className="quick-card-head">
                <History size={16} />
                <span>
                  <b>{versionCount}개</b>는 이미 있는 작업의 새 버전이에요. 바뀐 이유를
                  고를 수 있어요 (선택).
                </span>
              </div>
              <div className="reason-chips" role="radiogroup" aria-label="바뀐 이유">
                {CHANGE_REASONS.map((r) => (
                  <button
                    type="button"
                    key={r}
                    className={changeReason === r ? "selected" : ""}
                    aria-pressed={changeReason === r}
                    onClick={() => {
                      setChangeReason(r);
                      setError("");
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <input
                className="quick-note"
                value={changeNote}
                placeholder="무엇이 바뀌었나요? (선택) 예: 개강일 3월 10일 → 3월 17일"
                onChange={(e) => setChangeNote(e.target.value)}
              />
            </div>
          )}

          {usesSandoll && (
            <label className={`quick-card quick-font ${fontConfirmed ? "is-ok" : ""}`}>
              <input
                type="checkbox"
                checked={fontConfirmed}
                onChange={(e) => setFontConfirmed(e.target.checked)}
              />
              <span>
                <b>산돌 서체가 쓰인 파일이 있어요.</b> 회사 라이선스 범위 안에서
                사용했다면 체크해주세요. 체크하지 않으면 '확인 필요'로 등록되고 관리자가
                확인해요.
              </span>
            </label>
          )}

              <p className="pkg-more-label">파일별 작업명·디자이너</p>
          <ul className="pkg-items">
            {items.map((it, i) => {
              const m = matches[i];
              const preview: DesignAsset = {
                id: `asset-${(i % 6) + 1}`,
                title: it.title,
                service,
                project,
                device: it.device,
                professor: "",
                course: project,
                type: (it.type || "카드뉴스") as AssetType,
                year: Number(year) || 2026,
                tools: it.tools,
                designer: it.designer,
                version: m.finalVersion,
                filePath: folder,
                fileName: m.fileName,
                hashtags: [],
                hasSandoll: false,
                licenseStatus: "verified",
                uploadDate: "",
                bgColor: "",
                accentColor: "",
                summary: "",
                imageUrl: it.file.url,
              };
              return (
                <li key={it.key} className={!it.type ? "needs" : ""}>
                  <div className="pkg-thumb">
                    <DesignThumbnail asset={preview} />
                  </div>
                  <div className="pkg-main">
                    <input
                      className="pkg-title"
                      value={m.existing ? m.existing.title : it.title}
                      disabled={Boolean(m.existing)}
                      aria-label="작업명"
                      onChange={(e) => patch(it.key, { title: e.target.value })}
                    />
                    <div className="pkg-controls">
                      <select
                        value={it.type}
                        aria-label="작업 유형"
                        onChange={(e) => {
                          const type = e.target.value as AssetType;
                          patch(it.key, {
                            type,
                            device: DEVICE_TYPES.includes(type) ? (it.device ?? "PC") : undefined,
                          });
                        }}
                      >
                        <option value="">유형 선택</option>
                        {ASSET_TYPES.map((t) => (
                          <option key={t}>{t}</option>
                        ))}
                      </select>
                      {it.type && DEVICE_TYPES.includes(it.type) && (
                        <div className="seg" role="radiogroup" aria-label="PC 또는 MO">
                          {(["PC", "MO"] as const).map((d) => (
                            <button
                              type="button"
                              key={d}
                              className={it.device === d ? "on" : ""}
                              aria-pressed={it.device === d}
                              onClick={() => patch(it.key, { device: d })}
                            >
                              {d}
                            </button>
                          ))}
                        </div>
                      )}
                      <select
                        value={it.designer}
                        aria-label="디자이너"
                        onChange={(e) => patch(it.key, { designer: e.target.value })}
                      >
                        {DESIGNERS.map((d) => (
                          <option key={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                    <p className="pkg-file" title={it.file.name}>
                      {it.file.name}
                    </p>
                    <p className="pkg-meta">
                      {m.existing ? (
                        <span className="pkg-version">
                          <History size={12} /> 새 버전 {m.from} → {m.finalVersion}
                        </span>
                      ) : (
                        <span className="pkg-new">새 작업 · {m.finalVersion}</span>
                      )}
                      <span>{it.tools.length ? it.tools.join(" · ") : "도구 정보 없음"}</span>
                      {!it.type ? (
                        <span className="pkg-warn">
                          <TriangleAlert size={12} /> 유형을 골라주세요
                        </span>
                      ) : (
                        it.issues.length > 0 && (
                          <span className="pkg-hint" title={it.issues.join(" · ")}>
                            파일명 규칙과 달라요
                          </span>
                        )
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="pkg-remove"
                    aria-label={`${it.file.name} 빼기`}
                    onClick={() => setItems(items.filter((x) => x.key !== it.key))}
                  >
                    <X size={16} />
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="quick-tags">
            <span className="field-label">공통 태그 · 파일별 유형·도구·디자이너·색 태그는 자동으로 붙어요</span>
            <div className="tag-list editable">
              {commonTags.map((t) => (
                <span key={t}>{t}</span>
              ))}
              {extraTags.map((t) => (
                <span key={t}>
                  {t}
                  <button onClick={() => setExtraTags(extraTags.filter((x) => x !== t))} aria-label={`${t} 삭제`}>
                    <X size={12} />
                  </button>
                </span>
              ))}
              <form
                className="tag-add"
                onSubmit={(e) => {
                  e.preventDefault();
                  const v = newTag.trim().replace(/^#/, "");
                  if (v && !extraTags.includes(`#${v}`)) setExtraTags([...extraTags, `#${v}`]);
                  setNewTag("");
                }}
              >
                <Plus size={12} />
                <input
                  value={newTag}
                  placeholder="태그 추가"
                  aria-label="추가할 태그"
                  onChange={(e) => setNewTag(e.target.value)}
                />
              </form>
            </div>
          </div>

            </div>
          </details>

          <p role="alert" className="inline-feedback">
            {error}
          </p>
          <div className="wizard-footer">
            <button className="btn" onClick={() => setStep(0)}>
              <ArrowLeft size={16} />
              다시 올리기
            </button>
            <button className="btn btn-primary" onClick={submit} disabled={!items.length}>
              {items.length > 1 ? `${items.length}개 등록하기` : "등록하기"}
              <Check size={16} />
            </button>
          </div>
        </section>
      )}
    </main>
  );
};
