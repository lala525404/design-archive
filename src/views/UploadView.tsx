import React, { useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  History,
  ImagePlus,
  Pencil,
  Plus,
  Sparkles,
  TriangleAlert,
  X,
} from "lucide-react";
import { PageTitle } from "../components/Chrome";
import { DesignThumbnail } from "../components/DesignThumbnail";
import { AssetType, ChangeReason, DesignAsset } from "../types";
import {
  CHANGE_REASONS,
  findSameWork,
  getVersions,
  nextVersion,
  parseNasPath,
  versionNumber,
  withVersion,
} from "../lib/versions";

interface UploadViewProps {
  assets?: DesignAsset[];
  onBack: () => void;
  onUploadSuccess: (newAsset: DesignAsset) => void;
  onUploadVersion?: (updated: DesignAsset) => void;
}

const TYPES: AssetType[] = [
  "상세페이지",
  "배너",
  "카드뉴스",
  "포스터",
  "썸네일",
  "소개자료",
];
const SAMPLE_PATH =
  "/2026/이동건/색채학/상세페이지/2026_색채학상세페이지_Figma-GPT-산돌_김디자인_v03.psd";
const CURRENT_DESIGNER = "김디자인";

interface Draft {
  title: string;
  professor: string;
  course: string;
  type: string;
  year: string;
  designer: string;
  version: string;
  tools: string[];
  folder: string;
  fileName: string;
}

/** 원본 경로를 폴더와 파일명으로 나눈다. 파일명이 없으면 이미지 이름을 쓴다. */
function splitPath(raw: string, imageName: string) {
  const trimmed = raw.trim();
  const parts = trimmed.split(/[\\/]/);
  const last = parts[parts.length - 1] || "";
  if (/\.[a-z0-9]{2,5}$/i.test(last)) {
    return {
      folder: trimmed.slice(0, trimmed.length - last.length),
      fileName: last,
    };
  }
  const folder = /[\\/]$/.test(trimmed) || !trimmed ? trimmed : `${trimmed}/`;
  return { folder, fileName: imageName };
}

/** NAS 경로와 파일명에 이미 있는 정보만으로 채운다. 확실하지 않은 칸은 따로 표시한다. */
function analyze(raw: string, imageName: string) {
  const { folder, fileName } = splitPath(raw, imageName);
  const fromPath = parseNasPath(folder);
  const tokens = fileName.replace(/\.[^/.]+$/, "").split("_");
  const uncertain: (keyof Draft)[] = [];

  const year = /^\d{4}$/.test(tokens[0] ?? "") ? tokens[0] : fromPath.year;
  if (!year) uncertain.push("year");
  const professor = fromPath.professor;
  if (!professor) uncertain.push("professor");
  const course = fromPath.course;
  if (!course) uncertain.push("course");
  const type = TYPES.find((t) => t === fromPath.type) ??
    TYPES.find((t) => fileName.includes(t)) ??
    "상세페이지";
  if (!TYPES.includes(fromPath.type as AssetType)) uncertain.push("type");
  const tools = tokens[2] ? tokens[2].split("-").filter(Boolean) : [];
  if (!tools.length) uncertain.push("tools");
  const designer = tokens[3] || CURRENT_DESIGNER;
  const version = /^v\d+$/i.test(tokens[4] ?? "") ? tokens[4] : "v01";
  const title =
    course && tokens[1]?.includes(course)
      ? `${course} 과정 ${type}`
      : tokens[1] || (course ? `${course} 과정 ${type}` : "");
  if (!title) uncertain.push("title");

  return {
    draft: {
      title,
      professor,
      course,
      type,
      year: year || String(new Date().getFullYear()),
      designer,
      version,
      tools,
      folder,
      fileName,
    } as Draft,
    uncertain,
  };
}

/** 업로드한 이미지에서 많이 쓰인 색 두 가지를 이름으로 뽑는다. */
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
    const l = (max + min) / 510,
      sat = max === min ? 0 : (max - min) / (255 - Math.abs(max + min - 255));
    let name: string;
    if (sat < 0.18) name = l > 0.85 ? "화이트" : l < 0.18 ? "블랙" : "그레이";
    else {
      const d = max - min;
      let h =
        max === r
          ? ((g - b) / d) % 6
          : max === g
            ? (b - r) / d + 2
            : (r - g) / d + 4;
      h = (h * 60 + 360) % 360;
      name =
        h < 15 || h >= 340
          ? "레드"
          : h < 40
            ? "오렌지"
            : h < 65
              ? "옐로"
              : h < 150
                ? "그린"
                : h < 185
                  ? "민트"
                  : h < 250
                    ? "블루"
                    : h < 290
                      ? "퍼플"
                      : "핑크";
    }
    counts[name] = (counts[name] || 0) + 1;
  }
  return Object.entries(counts)
    .filter(([n]) => n !== "화이트" && n !== "그레이")
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([n]) => `${n}톤`);
}

const FIELD_LABELS: [keyof Draft, string][] = [
  ["title", "작업명"],
  ["professor", "교수명"],
  ["course", "과정명"],
  ["type", "작업 유형"],
  ["year", "제작 연도"],
  ["designer", "디자이너"],
];

export const UploadView: React.FC<UploadViewProps> = ({
  assets = [],
  onBack,
  onUploadSuccess,
  onUploadVersion,
}) => {
  const [step, setStep] = useState<0 | 1>(0);
  const [nasPath, setNasPath] = useState("");
  const [image, setImage] = useState<{
    url: string;
    name: string;
    size: string;
  } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");

  const [draft, setDraft] = useState<Draft | null>(null);
  const [uncertain, setUncertain] = useState<(keyof Draft)[]>([]);
  const [editing, setEditing] = useState<keyof Draft | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");

  const [registerMode, setRegisterMode] = useState<"version" | "new">(
    "version",
  );
  const [changeReason, setChangeReason] = useState<ChangeReason | "">("");
  const [changeNote, setChangeNote] = useState("");
  const [fontConfirmed, setFontConfirmed] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const takeFile = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("PNG, JPG 같은 이미지 파일을 올려주세요.");
      return;
    }
    setError("");
    setImage({
      url: URL.createObjectURL(file),
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
    });
  };

  const runAnalysis = async () => {
    if (!nasPath.trim()) {
      setError("NAS 원본 경로를 입력해주세요.");
      return;
    }
    setError("");
    setAnalyzing(true);
    const { draft: d, uncertain: u } = analyze(nasPath, image?.name ?? "");
    const colors = image ? await readImageColors(image.url).catch(() => []) : [];
    await new Promise((r) => setTimeout(r, 700));
    setDraft(d);
    setUncertain(u);
    setTags(
      Array.from(
        new Set(
          [d.year, d.professor, d.course, d.type, ...d.tools, d.designer, ...colors]
            .filter(Boolean)
            .map((t) => `#${t}`),
        ),
      ),
    );
    setRegisterMode("version");
    setChangeReason("");
    setChangeNote("");
    setFontConfirmed(false);
    setEditing(null);
    setAnalyzing(false);
    setStep(1);
  };

  const sameWork = useMemo(
    () =>
      draft ? findSameWork(assets, draft.folder, draft.fileName) : undefined,
    [assets, draft],
  );
  const latest = sameWork ? getVersions(sameWork).at(-1) : undefined;
  const asNewVersion = Boolean(sameWork && registerMode === "version");
  const finalVersion =
    draft && asNewVersion && latest &&
    versionNumber(draft.version) <= versionNumber(latest.version)
      ? nextVersion(latest.version)
      : (draft?.version ?? "v01");
  const finalFileName =
    draft && finalVersion !== draft.version
      ? withVersion(draft.fileName, finalVersion)
      : (draft?.fileName ?? "");
  const usesSandoll = Boolean(
    draft &&
      (draft.tools.some((t) => t.includes("산돌")) || nasPath.includes("산돌")),
  );

  const set = (key: keyof Draft, value: string) => {
    if (!draft) return;
    setDraft({ ...draft, [key]: value });
    if (value.trim()) setUncertain(uncertain.filter((k) => k !== key));
  };

  // 사람이 꼭 봐야 하는 것만 위로 모은다
  const checks = [
    ...uncertain.filter((k) => k !== "tools").map((k) => k),
    ...(asNewVersion && !changeReason ? ["reason"] : []),
  ];

  const submit = () => {
    if (!draft) return;
    const missing = uncertain.filter((k) => k !== "tools" && !String(draft[k]).trim());
    if (missing.length) {
      setError("빨간 칸을 채워주세요.");
      return;
    }
    if (asNewVersion && !changeReason) {
      setError("새 버전을 만든 이유를 하나 골라주세요.");
      return;
    }
    const today = new Date().toISOString().split("T")[0];
    const licenseStatus = !usesSandoll
      ? "verified"
      : fontConfirmed
        ? "verified"
        : "needs_review";
    const licenseNote = usesSandoll
      ? fontConfirmed
        ? "업로더가 회사 라이선스 범위 안에서 사용했다고 확인했습니다."
        : "산돌 서체 사용이 감지되었습니다. 관리자 확인이 필요합니다."
      : undefined;
    const entry = {
      version: finalVersion,
      fileName: finalFileName,
      filePath: draft.folder,
      uploadDate: today,
      designer: draft.designer,
      reason: (asNewVersion ? changeReason : "최초 제작") as ChangeReason,
      note: changeNote.trim() || undefined,
      originalKept: true,
    };
    const common = {
      fileName: finalFileName,
      filePath: draft.folder,
      designer: draft.designer,
      tools: draft.tools,
      hashtags: tags,
      year: parseInt(draft.year) || new Date().getFullYear(),
      hasSandoll: usesSandoll,
      licenseStatus: licenseStatus as DesignAsset["licenseStatus"],
      licenseNote,
      uploadDate: today,
      version: finalVersion,
      ...(image ? { imageUrl: image.url, fileSize: image.size } : {}),
    };
    if (asNewVersion && sameWork && onUploadVersion) {
      onUploadVersion({
        ...sameWork,
        ...common,
        versions: [...getVersions(sameWork), entry],
      });
      return;
    }
    onUploadSuccess({
      id: `asset-${Date.now()}`,
      title: draft.title,
      professor: draft.professor,
      course: draft.course,
      type: draft.type as AssetType,
      ...common,
      bgColor: "#F7F3EF",
      accentColor: "#246BFD",
      summary: `${draft.professor} 교수 ${draft.course} 과정의 ${draft.type} 작업입니다.`,
      versions: [entry],
    });
  };

  const previewAsset: DesignAsset | null = draft
    ? {
        id: "asset-1",
        title: draft.title,
        professor: draft.professor,
        course: draft.course,
        type: (TYPES.includes(draft.type as AssetType) ? draft.type : "상세페이지") as AssetType,
        year: Number(draft.year) || 2026,
        tools: draft.tools,
        designer: draft.designer,
        version: finalVersion,
        filePath: draft.folder,
        fileName: finalFileName,
        hashtags: tags,
        hasSandoll: usesSandoll,
        licenseStatus: "verified",
        uploadDate: "",
        bgColor: "",
        accentColor: "",
        summary: "",
        imageUrl: image?.url,
      }
    : null;

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
            className={`quick-dropzone ${dragging ? "is-over" : ""} ${image ? "has-image" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              takeFile(e.dataTransfer.files?.[0]);
            }}
            onClick={() => fileInput.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") fileInput.current?.click();
            }}
            aria-label="작업 이미지 선택"
          >
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => takeFile(e.target.files?.[0])}
            />
            {image ? (
              <>
                <img src={image.url} alt="올린 이미지 미리보기" />
                <span className="quick-file">
                  {image.name} · {image.size}
                  <button
                    type="button"
                    aria-label="이미지 빼기"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImage(null);
                    }}
                  >
                    <X size={14} />
                  </button>
                </span>
              </>
            ) : (
              <>
                <ImagePlus size={34} strokeWidth={1.4} />
                <strong>작업 이미지를 끌어 놓거나 눌러서 선택</strong>
                <span>PNG, JPG · 미리보기용 이미지</span>
              </>
            )}
          </div>

          <label className="field quick-path">
            NAS 원본 경로
            <input
              value={nasPath}
              placeholder="\\NAS\디자인\2026\이동건\색채학\상세페이지\파일명.psd"
              onChange={(e) => setNasPath(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") runAnalysis();
              }}
            />
          </label>
          <p className="quick-help">
            경로와 파일명만 있으면 교수·과정·유형·도구·버전과 태그를 자동으로
            채워요.{" "}
            <button
              type="button"
              className="link-button"
              onClick={() => setNasPath(SAMPLE_PATH)}
            >
              샘플 경로 넣기
            </button>
          </p>

          <p role="alert" className="inline-feedback">
            {error}
          </p>
          <div className="wizard-footer">
            <button className="btn" onClick={onBack}>
              취소
            </button>
            <button
              className="btn btn-primary"
              onClick={runAnalysis}
              disabled={analyzing}
            >
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

      {step === 1 && draft && previewAsset && (
        <section className="quick-review">
          <div className="quick-preview">
            <DesignThumbnail asset={previewAsset} />
            <p className="quick-path-line" title={`${draft.folder}${finalFileName}`}>
              {draft.folder}
              <b>{finalFileName}</b>
            </p>
          </div>

          <div className="quick-form">
            <p className="quick-status">
              <Sparkles size={15} />
              {checks.length
                ? `자동으로 채웠어요. ${checks.length}개만 확인해주세요.`
                : "자동으로 채웠어요. 맞으면 바로 등록하세요."}
            </p>

            {sameWork && latest && (
              <div className="quick-card">
                <div className="quick-card-head">
                  <History size={16} />
                  <span>
                    <b>{sameWork.title}</b>의 새 버전이에요 · {latest.version} →{" "}
                    {finalVersion}
                  </span>
                  <button
                    type="button"
                    className="link-button"
                    onClick={() =>
                      setRegisterMode(registerMode === "version" ? "new" : "version")
                    }
                  >
                    {registerMode === "version" ? "다른 작업이에요" : "새 버전으로 되돌리기"}
                  </button>
                </div>
                {asNewVersion && (
                  <>
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
                      placeholder="무엇이 바뀌었나요? (선택) 예: 3월 10일 → 3월 17일"
                      onChange={(e) => setChangeNote(e.target.value)}
                    />
                  </>
                )}
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
                  <b>산돌 서체가 쓰였어요.</b> 회사 라이선스 범위 안에서
                  사용했다면 체크해주세요. 체크하지 않으면 '확인 필요'로
                  등록되고 관리자가 확인해요.
                </span>
              </label>
            )}

            <dl className="quick-fields">
              {FIELD_LABELS.map(([key, label]) => {
                const value = String(draft[key] ?? "");
                const needs = uncertain.includes(key);
                const isEditing = editing === key || (needs && !value);
                if (asNewVersion && ["title", "professor", "course", "type"].includes(key))
                  return null;
                return (
                  <div key={key} className={needs ? "needs" : ""}>
                    <dt>{label}</dt>
                    <dd>
                      {isEditing ? (
                        key === "type" ? (
                          <select
                            autoFocus={editing === key}
                            value={value}
                            onChange={(e) => set(key, e.target.value)}
                            onBlur={() => setEditing(null)}
                          >
                            {TYPES.map((t) => (
                              <option key={t}>{t}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            autoFocus={editing === key}
                            value={value}
                            placeholder={`${label} 입력`}
                            onChange={(e) => set(key, e.target.value)}
                            onBlur={() => setEditing(null)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") setEditing(null);
                            }}
                          />
                        )
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditing(key)}
                          aria-label={`${label} 수정`}
                        >
                          <span>{value}</span>
                          {needs ? (
                            <TriangleAlert size={14} />
                          ) : (
                            <Pencil size={13} />
                          )}
                        </button>
                      )}
                    </dd>
                  </div>
                );
              })}
              <div>
                <dt>버전</dt>
                <dd className="static">{finalVersion}</dd>
              </div>
              <div>
                <dt>사용 도구</dt>
                <dd className="static">
                  {draft.tools.length ? draft.tools.join(" · ") : "없음 (태그로 추가)"}
                </dd>
              </div>
            </dl>

            <div className="quick-tags">
              <span className="field-label">자동 태그</span>
              <div className="tag-list editable">
                {tags.map((t) => (
                  <span key={t}>
                    {t}
                    <button
                      onClick={() => setTags(tags.filter((x) => x !== t))}
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
                    const v = newTag.trim().replace(/^#/, "");
                    if (v && !tags.includes(`#${v}`)) setTags([...tags, `#${v}`]);
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

            <p role="alert" className="inline-feedback">
              {error}
            </p>
            <div className="wizard-footer">
              <button className="btn" onClick={() => setStep(0)}>
                <ArrowLeft size={16} />
                다시 올리기
              </button>
              <button className="btn btn-primary" onClick={submit}>
                {asNewVersion ? `${finalVersion}로 등록` : "등록하기"}
                <Check size={16} />
              </button>
            </div>
          </div>
        </section>
      )}
    </main>
  );
};
