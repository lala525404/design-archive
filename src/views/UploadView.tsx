import React, { useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FolderOpen,
  FolderUp,
  CircleCheck,
  Circle,
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
import { pathKey } from "../lib/versions";

export interface UploadResult {
  added: DesignAsset[];
  updated: DesignAsset[];
  project: string;
}
interface UploadViewProps {
  assets?: DesignAsset[];
  onBack: () => void;
  onSubmit: (result: UploadResult) => void;
  /** 프로젝트 화면의 "파일 추가": 이 프로젝트 폴더에 추가 */
  presetFolder?: string;
  /** 프로젝트 화면의 "수정본 올리기": 이 파일의 새 버전으로 */
  reviseAssetId?: string;
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

const PAID_RESOURCES = ["산돌", "게티"];
/** 등록 때 확인이 필요한 리소스. 산돌·게티는 회사 구매 패키지라 확인하지 않는다 */
const CHECK_RESOURCES = ["AI"];

export const UploadView: React.FC<UploadViewProps> = ({
  assets = [],
  onBack,
  onSubmit,
  presetFolder,
  reviseAssetId,
}) => {
  const reviseTarget = reviseAssetId ? assets.find((a) => a.id === reviseAssetId) : undefined;
  const isRevision = Boolean(reviseTarget);
  const presetProject = presetFolder
    ? assets.find((a) => pathKey(a.filePath) === pathKey(presetFolder))
    : undefined;

  const [step, setStep] = useState<0 | 1>(0);
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [nasPath, setNasPath] = useState(presetFolder ?? reviseTarget?.filePath ?? "");
  const [dragging, setDragging] = useState(false);
  const [packageFolder, setPackageFolder] = useState("");
  const [skipped, setSkipped] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const folderInput = useRef<HTMLInputElement>(null);

  // 프로젝트 정보
  const [service, setService] = useState("");
  const [year, setYear] = useState("");
  const [title, setTitle] = useState("");
  const [requestNo, setRequestNo] = useState("");
  const [projectDate, setProjectDate] = useState("");
  const [lead, setLead] = useState(CURRENT_DESIGNER);
  const [resources, setResources] = useState<string[]>([]);
  const [resourceEtc, setResourceEtc] = useState("");
  const [folderIssues, setFolderIssues] = useState<string[]>([]);
  const [folder, setFolder] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [packageTypes, setPackageTypes] = useState<AssetType[]>([]);
  // 수정 내용
  const [changeReason, setChangeReason] = useState<ChangeReason | "">("");
  const [changeNote, setChangeNote] = useState("");
  // 라이선스 확인 (리소스별)
  const [licenseOk, setLicenseOk] = useState<Record<string, boolean>>({});
  // 태그
  const [extraTags, setExtraTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [proofs, setProofs] = useState<{ name: string; url?: string }[]>([]);
  const proofInput = useRef<HTMLInputElement>(null);

  const addFiles = (list: { file: File; path?: string }[]) => {
    if (!list.length) return;
    let keep = list.filter(({ file }) => isDeliverable(file.name));
    setSkipped((n) => n + (list.length - keep.length));
    if (isRevision) keep = keep.slice(0, 1); // 수정본은 파일 하나
    const top = list.find((x) => x.path?.includes("/"))?.path?.split("/")[0];
    if (top && !isRevision) setPackageFolder(top);
    const next: PickedFile[] = keep.map(({ file, path }) => ({
      key: fileKey(),
      name: file.name,
      size: sizeText(file.size),
      url: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
      relPath: path && path.includes("/") ? path.split("/").slice(1).join("/") : undefined,
    }));
    setFiles((prev) => (isRevision ? next : [...prev, ...next]));
    setError(keep.length ? "" : "올릴 수 있는 결과물(이미지·PDF·PPT)이 없어요.");
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const entries = Array.from(e.dataTransfer.items ?? [])
      .map((it) => (it as any).webkitGetAsEntry?.())
      .filter(Boolean);
    if (!isRevision && entries.some((en: any) => en.isDirectory)) {
      const all = (await Promise.all(entries.map((en: any) => readEntry(en)))).flat();
      addFiles(all);
    } else {
      addFiles(Array.from(e.dataTransfer.files).map((file) => ({ file })));
    }
  };

  const runAnalysis = async () => {
    let picked = files;
    let path = nasPath.trim();
    if (packageFolder) {
      const lastSeg = path.split(/[\\/]/).filter(Boolean).pop() ?? "";
      if (!path) path = packageFolder;
      else if (!parseProjectFolder(lastSeg).date && lastSeg !== packageFolder)
        path = `${path.replace(/[\\/]+$/, "")}/${packageFolder}`;
    }
    const last = path.split(/[\\/]/).pop() ?? "";
    if (/\.[a-z0-9]{2,5}$/i.test(last)) {
      path = path.slice(0, path.length - last.length);
      if (!picked.length) picked = [{ key: fileKey(), name: last, size: "" }];
    }
    if (!path) return setError("NAS 프로젝트 폴더 경로를 입력해주세요.");
    if (!picked.length) return setError("올릴 파일을 하나 이상 선택해주세요.");
    setError("");
    setAnalyzing(true);

    const parsed = parseNasPath(path);
    const normFolder = /[\\/]$/.test(path) ? path : `${path}/`;
    // 이미 있는 프로젝트면 그 제목과 정보를 그대로 쓴다 (폴더명 대신)
    const existing = assets.find((a) => pathKey(a.filePath) === pathKey(normFolder));
    const leadName = parsed.designer || existing?.designer || CURRENT_DESIGNER;
    const res = existing?.resources?.length ? existing.resources : parsed.resources;

    const next: Item[] = await Promise.all(
      picked.map(async (f) => {
        const info = readFileName(f.name, existing?.project ?? parsed.project, leadName, res, f.relPath);
        const colors = f.url ? await readImageColors(f.url).catch(() => []) : [];
        if (reviseTarget)
          return {
            key: f.key,
            file: f,
            colors,
            ...info,
            title: reviseTarget.title,
            type: reviseTarget.type,
            device: reviseTarget.device,
            designer: reviseTarget.designer,
          };
        return { key: f.key, file: f, colors, ...info };
      }),
    );
    await new Promise((r) => setTimeout(r, 500));

    setService(existing?.service ?? parsed.service);
    setYear(String(existing?.year ?? (parsed.year || new Date().getFullYear())));
    setTitle(existing?.project ?? parsed.project);
    setRequestNo(existing?.requestNo ?? parsed.requestNo);
    setProjectDate(existing?.projectDate ?? parsed.date);
    setLead(leadName);
    setResources(res);
    setResourceEtc(existing?.resourceEtc ?? "");
    setFolderIssues(existing ? [] : parsed.issues);
    setPackageTypes(
      Array.from(new Set(next.map((it) => it.type).filter(Boolean))) as AssetType[],
    );
    setFolder(normFolder);
    const order = (it: Item) =>
      (it.type ? ASSET_TYPES.indexOf(it.type) : 99) * 10 + (it.device === "MO" ? 1 : 0);
    setItems([...next].sort((a, b) => order(a) - order(b)));
    setChangeReason("");
    setChangeNote("");
    setLicenseOk({});
    setExtraTags([]);
    setProofs(existing?.licenseProofs ?? []);
    setAnalyzing(false);
    setStep(1);
  };

  // 같은 폴더 + 같은 결과물이면 새 버전. 수정본 모드는 지정한 파일에 붙인다
  const matches = useMemo(
    () =>
      items.map((it) => {
        const existing = reviseTarget ?? findSameWork(assets, folder, it.file.name);
        if (!existing)
          return { existing: undefined, from: "", finalVersion: it.version, fileName: it.file.name };
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
    [items, assets, folder, reviseTarget],
  );
  const versionCount = matches.filter((m) => m.existing).length;
  const existingInProject = useMemo(
    () => assets.filter((a) => folder && pathKey(a.filePath) === pathKey(folder)),
    [assets, folder],
  );
  const typeCounts = items.reduce<Record<string, number>>((acc, it) => {
    if (it.type) acc[it.type] = (acc[it.type] ?? 0) + 1;
    return acc;
  }, {});
  const checkedTypes = Array.from(
    new Set([...packageTypes, ...(Object.keys(typeCounts) as AssetType[])]),
  );
  const mergedPackage = Array.from(
    new Set([...checkedTypes, ...existingInProject.flatMap((a) => a.packageTypes ?? [a.type])]),
  ) as AssetType[];
  const paid = resources.filter((r) => CHECK_RESOURCES.includes(r));
  const etcName = resources.includes("기타") ? resourceEtc.trim() : "";
  const unconfirmed = paid.filter((r) => !licenseOk[r]);
  const commonTags = [
    year,
    serviceName(service),
    title.replace(/\s/g, ""),
    ...(requestNo ? [requestNo] : []),
    ...resources.filter((r) => r !== "기타"),
    ...(etcName ? [etcName.replace(/\s/g, "")] : []),
  ]
    .filter(Boolean)
    .map((t) => `#${t}`);

  // 등록 전 확인 목록
  const checks = [
    { label: "프로젝트 제목", ok: Boolean(title.trim()), required: true },
    { label: "서비스", ok: Boolean(service), required: true },
    {
      label: `파일 유형 (${items.filter((it) => it.type).length}/${items.length})`,
      ok: items.every((it) => it.type),
      required: true,
    },
    ...(versionCount
      ? [{ label: "수정 이유", ok: Boolean(changeReason), required: true }]
      : []),
    ...(resources.includes("기타")
      ? [{ label: "기타 리소스 이름", ok: Boolean(etcName), required: true }]
      : []),
    ...(paid.length
      ? [
          {
            label: "AI 사용 표기",
            ok: unconfirmed.length === 0,
            required: false,
          },
        ]
      : []),
  ];
  const blocking = checks.filter((c) => c.required && !c.ok);

  const patch = (key: string, p: Partial<Item>) =>
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...p } : it)));

  const submit = () => {
    if (blocking.length) {
      setError(`아직 확인이 필요해요: ${blocking.map((c) => c.label.replace(/ \(.*\)/, "")).join(", ")}`);
      return;
    }
    const today = new Date().toISOString().split("T")[0];
    const licenseStatus: DesignAsset["licenseStatus"] = unconfirmed.length ? "needs_review" : "verified";
    const licenseNote = paid.length
      ? unconfirmed.length
        ? "AI 사용 표기 여부를 확인해야 합니다."
        : "AI 사용 문구를 기재했다고 업로더가 확인했습니다."
      : undefined;
    const projectFields = {
      service,
      project: title.trim(),
      course: title.trim(),
      year: parseInt(year) || new Date().getFullYear(),
      requestNo,
      projectDate,
      resources,
      resourceEtc: etcName || undefined,
      licenseProofs: resources.includes("기타") && proofs.length ? proofs : undefined,
      packageTypes: mergedPackage,
    };
    const added: DesignAsset[] = [];
    const updated: DesignAsset[] = [];
    items.forEach((it, i) => {
      const m = matches[i];
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
        reason: m.existing ? (changeReason as ChangeReason) : "최초 제작",
        note: m.existing ? changeNote.trim() || undefined : undefined,
        originalKept: true,
        ...(it.file.url ? { imageUrl: it.file.url } : {}),
      };
      const common = {
        ...projectFields,
        title: it.title.trim() || m.existing?.title || `${title} ${it.type}`,
        type: it.type as AssetType,
        device: it.device,
        version: m.finalVersion,
        fileName: m.fileName,
        filePath: folder,
        designer: it.designer,
        tools: Array.from(new Set([...it.tools, ...resources.filter((r) => TOOLS.includes(r))])),
        hashtags: tags,
        hasSandoll: resources.includes("산돌"),
        licenseStatus: paid.length ? licenseStatus : ("verified" as const),
        licenseNote,
        uploadDate: today,
        ...(it.file.url ? { imageUrl: it.file.url } : {}),
        ...(it.file.size ? { fileSize: it.file.size } : {}),
      };
      if (m.existing) {
        updated.push({ ...m.existing, ...common, versions: [...getVersions(m.existing), entry] });
      } else {
        added.push({
          id: `asset-${Date.now()}-${i}`,
          professor: "",
          ...common,
          bgColor: "#F5F5F7",
          accentColor: "#0071E3",
          summary: `${serviceName(service)} ${title} 프로젝트의 ${it.type}${it.device ? ` ${it.device}` : ""} 작업입니다.`,
          versions: [entry],
        });
      }
    });
    // 같은 프로젝트의 다른 파일들도 프로젝트 정보(제목·구성 등)를 맞춘다
    existingInProject.forEach((a) => {
      if (!updated.some((u) => u.id === a.id)) updated.push({ ...a, ...projectFields });
    });
    onSubmit({ added, updated, project: title.trim() });
  };

  const heading = isRevision
    ? "수정본 올리기"
    : presetProject
      ? "파일 추가"
      : "자산 등록";

  return (
    <main className="page-shell upload-page quick-upload">
      <PageTitle title={heading} onBack={onBack} />
      {(reviseTarget || presetProject) && (
        <p className="upload-context">
          {reviseTarget ? (
            <>
              <History size={15} />
              <b>{reviseTarget.title}</b>
              {reviseTarget.device && ` ${reviseTarget.device}`} · 현재 {reviseTarget.version} → 올리는 파일이 새 버전이 돼요
            </>
          ) : (
            <>
              <FolderOpen size={15} />
              <b>{presetProject!.project}</b> 프로젝트에 파일을 추가해요
            </>
          )}
        </p>
      )}
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
              multiple={!isRevision}
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
                {!isRevision && (
                  <>
                    <button type="button" className="picked picked-add" onClick={() => fileInput.current?.click()}>
                      <Plus size={20} />
                      파일 추가
                    </button>
                    <button type="button" className="picked picked-add" onClick={() => folderInput.current?.click()}>
                      <FolderUp size={20} />
                      폴더 추가
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="dropzone-empty">
                <ImagePlus size={34} strokeWidth={1.4} />
                <strong>
                  {isRevision ? "수정한 파일을 끌어 놓으세요" : "프로젝트 폴더나 파일을 끌어 놓으세요"}
                </strong>
                <span>
                  {isRevision
                    ? "파일 이름이 달라도 이 작업의 새 버전으로 붙어요."
                    : "폴더째 올리면 안의 상세·배너·팝업·PPT를 모두 읽어요. 하나만 올려도 돼요."}
                </span>
                <div className="dropzone-actions">
                  {!isRevision && (
                    <button type="button" className="btn btn-primary" onClick={() => folderInput.current?.click()}>
                      <FolderUp size={16} />
                      폴더 선택
                    </button>
                  )}
                  <button
                    type="button"
                    className={`btn ${isRevision ? "btn-primary" : ""}`}
                    onClick={() => fileInput.current?.click()}
                  >
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
          {isRevision || presetProject ? (
            <p className="folder-note">
              <FolderOpen size={14} /> NAS 폴더 <b>{nasPath}</b>
            </p>
          ) : (
            <>
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
                유형·PC/MO·버전을 자동으로 채워요. 다음 화면에서 모두 확인하고 고칠 수 있어요.{" "}
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
            </>
          )}

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
                  다음
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </section>
      )}

      {step === 1 && (
        <section className="review">
          <p className="quick-status">
            <Sparkles size={15} />
            자동으로 채웠어요. 아래 내용을 확인하고 등록하세요.
          </p>

          {/* 1. 프로젝트 */}
          <section className="review-block">
            <header>
              <span className="review-no">1</span>
              <h2>프로젝트</h2>
              <em className={existingInProject.length ? "is-existing" : ""}>
                {existingInProject.length
                  ? `기존 프로젝트 · 파일 ${existingInProject.length}개`
                  : "새 프로젝트"}
              </em>
            </header>
            <div className="review-grid">
              <label className={`span-2 ${!title.trim() ? "needs" : ""}`}>
                프로젝트 제목
                <input
                  value={title}
                  placeholder="검색과 목록에 보일 이름"
                  disabled={isRevision}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </label>
              <label className={!service ? "needs" : ""}>
                서비스
                <select value={service} disabled={isRevision} onChange={(e) => setService(e.target.value)}>
                  <option value="">선택</option>
                  {SERVICES.map((sv) => (
                    <option key={sv} value={sv}>
                      {sv}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                연도
                <input value={year} disabled={isRevision} onChange={(e) => setYear(e.target.value)} />
              </label>
              <label>
                요청번호
                <input
                  value={requestNo}
                  placeholder="없음"
                  inputMode="numeric"
                  disabled={isRevision}
                  onChange={(e) => setRequestNo(e.target.value.replace(/\D/g, "").slice(0, 5))}
                />
              </label>
              <label>
                담당 디자이너
                <select
                  value={lead}
                  disabled={isRevision}
                  onChange={(e) => {
                    const next = e.target.value;
                    // 담당자를 바꾸면 아직 그대로인 파일 디자이너도 같이 바꾼다
                    setItems((prev) => prev.map((it) => (it.designer === lead ? { ...it, designer: next } : it)));
                    setLead(next);
                  }}
                >
                  {DESIGNERS.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </label>
            </div>
            <p className="review-folder">
              <FolderOpen size={14} /> {folder}
            </p>
            {folderIssues.length > 0 && (
              <p className="pkg-naming">
                <TriangleAlert size={13} />
                폴더 이름이 새 규칙과 달라서 추정해서 채웠어요 · {folderIssues[0]}
              </p>
            )}
          </section>

          {/* 2. 패키지 구성 */}
          {!isRevision && (
            <section className="review-block">
              <header>
                <span className="review-no">2</span>
                <h2>패키지 구성</h2>
                <span className="review-hint">파일 이름으로 체크했어요. 함께 만든 게 더 있으면 체크하세요.</span>
              </header>
              <div className="pkg-contents-chips">
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
                          setPackageTypes(on ? packageTypes.filter((x) => x !== t) : [...packageTypes, t])
                        }
                      />
                      {t}
                      {n > 0 && <em>{n}</em>}
                    </label>
                  );
                })}
              </div>
            </section>
          )}

          {/* 3. 파일 */}
          <section className="review-block">
            <header>
              <span className="review-no">{isRevision ? 2 : 3}</span>
              <h2>파일 {items.length}개</h2>
              <span className="review-hint">작업명·유형·PC/MO·디자이너를 확인하세요.</span>
            </header>
            <ul className="review-files">
              {items.map((it, i) => {
                const m = matches[i];
                const preview: DesignAsset = {
                  id: `asset-${(i % 6) + 1}`,
                  title: it.title,
                  service,
                  project: title,
                  device: it.device,
                  professor: "",
                  course: title,
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
                      {m.existing ? (
                        <span className="tile-version">
                          {m.from} → {m.finalVersion}
                        </span>
                      ) : (
                        <span className="tile-version is-new">새 작업 · {m.finalVersion}</span>
                      )}
                    </div>
                    <div className="review-file-fields">
                      <input
                        className="review-file-title"
                        value={m.existing ? m.existing.title : it.title}
                        disabled={Boolean(m.existing)}
                        aria-label="작업명"
                        onChange={(e) => patch(it.key, { title: e.target.value })}
                      />
                      <div className="tile-controls">
                        <select
                          value={it.type}
                          aria-label="작업 유형"
                          disabled={isRevision}
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
                                disabled={isRevision}
                                onClick={() => patch(it.key, { device: d })}
                              >
                                {d}
                              </button>
                            ))}
                          </div>
                        )}
                        <select
                          className="review-designer"
                          value={it.designer}
                          aria-label="디자이너"
                          onChange={(e) => patch(it.key, { designer: e.target.value })}
                        >
                          {DESIGNERS.map((d) => (
                            <option key={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                      <span className="tile-name" title={it.file.name}>
                        {it.file.name}
                        {it.issues.length > 0 && !isRevision && (
                          <b title={it.issues.join(" · ")}> · 파일명 규칙과 달라요</b>
                        )}
                      </span>
                    </div>
                    {!isRevision && (
                      <button
                        type="button"
                        className="pkg-remove"
                        aria-label={`${it.file.name} 빼기`}
                        onClick={() => setItems(items.filter((x) => x.key !== it.key))}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

          {/* 4. 수정 내용 */}
          {versionCount > 0 && (
            <section className={`review-block ${!changeReason ? "is-needed" : ""}`}>
              <header>
                <span className="review-no">{isRevision ? 3 : 4}</span>
                <h2>수정 내용</h2>
                <span className="review-hint">{versionCount}개가 기존 작업의 새 버전이에요.</span>
              </header>
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
                placeholder="무엇이 바뀌었나요? 예: 개강일 3월 10일 → 3월 17일"
                onChange={(e) => setChangeNote(e.target.value)}
              />
            </section>
          )}

          {/* 5. 라이선스 */}
          <section className="review-block">
            <header>
              <span className="review-no">{(isRevision ? 3 : 4) + (versionCount ? 1 : 0)}</span>
              <h2>리소스·라이선스</h2>
              <span className="review-hint">산돌·게티는 회사 구매 패키지라 따로 확인하지 않아요. AI·기타만 확인해주세요.</span>
            </header>
            <div className="builder-chips" role="group" aria-label="사용한 리소스">
              {RESOURCES.map((r) => (
                <button
                  type="button"
                  key={r}
                  className={resources.includes(r) ? "on" : ""}
                  aria-pressed={resources.includes(r)}
                  disabled={isRevision}
                  onClick={() =>
                    setResources(resources.includes(r) ? resources.filter((x) => x !== r) : [...resources, r])
                  }
                >
                  {r}
                </button>
              ))}
              {!resources.length && <span className="review-hint">사용한 리소스 없음</span>}
            </div>
            {resources.includes("기타") && (
              <div className="etc-row">
                <label className={`etc-resource ${!etcName ? "needs" : ""}`}>
                  기타 리소스 이름·출처
                  <input
                    value={resourceEtc}
                    autoFocus={!resourceEtc}
                    disabled={isRevision}
                    placeholder="예: 언스플래시 이미지, 프리픽 아이콘, 눈누 무료폰트"
                    onChange={(e) => setResourceEtc(e.target.value)}
                  />
                </label>
                <div className="proof">
                  <span className="proof-label">라이선스 증빙 (선택)</span>
                  <div className="proof-list">
                    {proofs.map((pf, i) => (
                      <span key={pf.name + i} className="proof-chip">
                        {pf.url ? <img src={pf.url} alt="" /> : <FolderOpen size={13} />}
                        {pf.name}
                        <button
                          type="button"
                          onClick={() => setProofs(proofs.filter((_, j) => j !== i))}
                          aria-label={`${pf.name} 삭제`}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                    <button type="button" className="proof-add" onClick={() => proofInput.current?.click()}>
                      <ImagePlus size={14} />
                      캡처 올리기
                    </button>
                    <input
                      ref={proofInput}
                      type="file"
                      accept="image/*,.pdf"
                      multiple
                      hidden
                      onChange={(e) => {
                        const list = Array.from(e.target.files ?? []).map((f) => ({
                          name: f.name,
                          url: f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined,
                        }));
                        setProofs([...proofs, ...list]);
                        e.target.value = "";
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
            {paid.map((r) => (
              <label key={r} className={`license-check ${licenseOk[r] ? "is-ok" : ""}`}>
                <input
                  type="checkbox"
                  checked={Boolean(licenseOk[r])}
                  onChange={(e) => setLicenseOk({ ...licenseOk, [r]: e.target.checked })}
                />
                <span>
                  결과물에 <b>AI 사용 문구</b>(예: "본 이미지는 AI로 제작되었습니다")를 기재했어요
                </span>
              </label>
            ))}
          </section>

          {/* 6. 태그 */}
          <section className="review-block review-block--tags">
            <header>
              <span className="review-no">{(isRevision ? 4 : 5) + (versionCount ? 1 : 0)}</span>
              <h2>태그</h2>
              <span className="review-hint">검색은 이 태그로 찾아요. 빠진 키워드가 없는지 한 번 더 확인해주세요.</span>
              <em className="is-key">검색 키워드</em>
            </header>
            <div className="tag-group">
              <span className="tag-group-label">프로젝트 공통</span>
              <div className="tag-list editable tag-list--key">
                {commonTags.map((t) => (
                  <span key={t}>{t}</span>
                ))}
                {extraTags.map((t) => (
                  <span key={t} className="is-added">
                    {t}
                    <button
                      onClick={() => {
                        setExtraTags(extraTags.filter((x) => x !== t));
                      }}
                      aria-label={`${t} 삭제`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
                <form
                  className="tag-add"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const v = newTag.trim().replace(/^#/, "").replace(/\s/g, "");
                    if (v && !extraTags.includes(`#${v}`)) setExtraTags([...extraTags, `#${v}`]);
                    setNewTag("");
                  }}
                >
                  <Plus size={13} />
                  <input
                    value={newTag}
                    placeholder="키워드 추가 후 Enter"
                    aria-label="추가할 태그"
                    onChange={(e) => setNewTag(e.target.value)}
                  />
                </form>
              </div>
            </div>
            <div className="tag-group">
              <span className="tag-group-label">파일마다 자동</span>
              <div className="tag-list tag-list--auto">
                {Array.from(
                  new Set(
                    items.flatMap((it) => [
                      `#${it.type}`,
                      ...(it.device ? [`#${it.device}`] : []),
                      `#${it.designer}`,
                      ...it.colors.map((c) => `#${c}`),
                    ]),
                  ),
                ).map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
            </div>
            <p className="review-hint">
              예: 행사명, 캠페인명, 시즌(가을·연말), 타깃(직장인·학부모), 강사·교수명처럼 나중에 검색할 말을 추가하면 찾기 쉬워요.
            </p>
          </section>

          {/* 확인 목록 + 등록 */}
          <div className="review-footer">
            <ul className="review-checklist" aria-label="등록 전 확인">
              {checks.map((c) => (
                <li key={c.label} className={c.ok ? "ok" : c.required ? "todo" : "warn"}>
                  {c.ok ? <CircleCheck size={15} /> : c.required ? <Circle size={15} /> : <TriangleAlert size={15} />}
                  {c.label}
                </li>
              ))}
            </ul>
            <p role="alert" className="inline-feedback">
              {error.startsWith("아직 확인이") && !blocking.length ? "" : error}
            </p>
            <div className="wizard-footer">
              <button className="btn" onClick={() => setStep(0)}>
                <ArrowLeft size={16} />
                다시 올리기
              </button>
              <button className="btn btn-primary" onClick={submit} disabled={!items.length}>
                {isRevision
                  ? `${matches[0]?.finalVersion ?? ""}로 등록하기`
                  : items.length > 1
                    ? `${items.length}개 등록하기`
                    : "등록하기"}
                <Check size={16} />
              </button>
            </div>
          </div>
        </section>
      )}
    </main>
  );
};
