import React, { useMemo, useState } from "react";
import {
  Upload,
  ArrowLeft,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  Plus,
  X,
  Sparkles,
  ShieldCheck,
  FileText,
  FolderOpen,
  Hash,
  History,
} from "lucide-react";
import { PageTitle, Disclosure } from "../components/Chrome";
import { ChangeReason, DesignAsset, LicenseStatus } from "../types";
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

export const UploadView: React.FC<UploadViewProps> = ({
  assets = [],
  onBack,
  onUploadSuccess,
  onUploadVersion,
}) => {
  const [step, setStep] = useState(0);
  const [newTool, setNewTool] = useState("");
  const [error, setError] = useState("");
  // Step 1 & 2: File & Path Inputs with realistic default sample
  const [filePath, setFilePath] = useState("/2026/이동건/색채학/상세페이지/");
  const [fileName, setFileName] = useState(
    "2026_색채학상세페이지_Figma-GPT-산돌_김디자인_v03.png",
  );
  const [fileSize, setFileSize] = useState("14.2 MB");
  const [hasParsed, setHasParsed] = useState(true);

  // Step 4: Extracted Extensible Fields
  const [year, setYear] = useState("2026");
  const [professor, setProfessor] = useState("이동건");
  const [course, setCourse] = useState("색채학");
  const [workType, setWorkType] = useState("상세페이지");
  const [title, setTitle] = useState("색채학 과정 상세페이지");
  const [tools, setTools] = useState<string[]>(["Figma", "GPT", "산돌"]);
  const [designer, setDesigner] = useState("김디자인");
  const [version, setVersion] = useState("v03");
  const [uncertainFields, setUncertainFields] = useState<string[]>([]);

  // Step 5: Hashtags review
  const [hashtags, setHashtags] = useState<string[]>([
    "#2026",
    "#이동건",
    "#색채학",
    "#상세페이지",
    "#Figma",
    "#GPT",
    "#산돌",
    "#김디자인",
  ]);
  const [newTagInput, setNewTagInput] = useState("");
  const [isTagsApproved, setIsTagsApproved] = useState(false);

  // Step 6: Sandoll License Verification
  const [sandollUsage, setSandollUsage] = useState<
    "used" | "not_used" | "needs_check"
  >("used");
  const [matchedLicenseStatus, setMatchedLicenseStatus] =
    useState<LicenseStatus>("verified");
  const [licenseAgreed, setLicenseAgreed] = useState(false);

  // 같은 작업의 새 버전인지 확인 (같은 NAS 폴더 + 같은 작업명)
  const [registerMode, setRegisterMode] = useState<"version" | "new">(
    "version",
  );
  const [changeReason, setChangeReason] = useState<ChangeReason | "">("");
  const [changeNote, setChangeNote] = useState("");
  const sameWork = useMemo(
    () => findSameWork(assets, filePath, fileName),
    [assets, filePath, fileName],
  );
  const latest = sameWork ? getVersions(sameWork).at(-1) : undefined;
  const asNewVersion = Boolean(sameWork && registerMode === "version");
  const versionTaken = Boolean(
    latest && versionNumber(version) <= versionNumber(latest.version),
  );
  const finalVersion =
    asNewVersion && versionTaken && latest ? nextVersion(latest.version) : version;
  const finalFileName =
    finalVersion !== version ? withVersion(fileName, finalVersion) : fileName;

  // NAS 경로가 바뀌면 경로에서 읽을 수 있는 정보를 바로 갱신
  const applyPath = (path: string) => {
    setFilePath(path);
    const parsed = parseNasPath(path);
    if (parsed.year) setYear(parsed.year);
    if (parsed.professor) setProfessor(parsed.professor);
    if (parsed.course) setCourse(parsed.course);
    if (parsed.type) setWorkType(parsed.type);
  };

  // File Drag & Drop Simulation
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setFileName(file.name);
      setFileSize(`${(file.size / (1024 * 1024)).toFixed(1)} MB`);
      triggerAnalysis(file.name, filePath);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      setFileSize(`${(file.size / (1024 * 1024)).toFixed(1)} MB`);
      triggerAnalysis(file.name, filePath);
    }
  };

  // Parser: Auto-extracts metadata from filename & path
  const triggerAnalysis = (name: string, path: string) => {
    const uncertain: string[] = [];

    // NAS 경로: (공유폴더)/연도/교수명/과정명/작업유형/
    const fromPath = parseNasPath(path);
    let extractedYear = fromPath.year || "2026";
    let extractedProf = fromPath.professor;
    let extractedCourse = fromPath.course;
    let extractedType = fromPath.type || "상세페이지";
    if (!fromPath.professor) uncertain.push("교수명");
    if (!fromPath.course) uncertain.push("과정명");

    // Filename pattern: 2026_색채학상세페이지_Figma-GPT-산돌_김디자인_v03.png
    const cleanName = name.replace(/\.[^/.]+$/, "");
    const tokens = cleanName.split("_");

    if (tokens[0] && /^\d{4}$/.test(tokens[0])) {
      extractedYear = tokens[0];
    } else {
      uncertain.push("연도");
    }

    let parsedTitle = `${extractedCourse} 과정 ${extractedType}`;
    if (tokens[1]) {
      parsedTitle = tokens[1];
    }

    let extractedTools = ["Figma"];
    if (tokens[2]) {
      extractedTools = tokens[2].split("-");
    } else {
      uncertain.push("사용 도구");
    }

    let extractedDesigner = "김디자인";
    if (tokens[3]) {
      extractedDesigner = tokens[3];
    } else {
      uncertain.push("디자이너");
    }

    let extractedVersion = "v01";
    if (tokens[4]) {
      extractedVersion = tokens[4];
    } else {
      uncertain.push("버전");
    }

    setYear(extractedYear);
    setProfessor(extractedProf);
    setCourse(extractedCourse);
    setWorkType(extractedType);
    setTitle(parsedTitle);
    setTools(extractedTools);
    setDesigner(extractedDesigner);
    setVersion(extractedVersion);
    setUncertainFields(uncertain);

    // Auto-generate structured hashtags
    const generatedTags = [
      `#${extractedYear}`,
      `#${extractedProf}`,
      `#${extractedCourse}`,
      `#${extractedType}`,
      ...extractedTools.map((t) => `#${t}`),
      `#${extractedDesigner}`,
    ];
    setHashtags(Array.from(new Set(generatedTags)));
    setIsTagsApproved(false);

    // Sandoll check
    const hasSandollInTools =
      extractedTools.some((t) => t.includes("산돌")) || name.includes("산돌");
    if (hasSandollInTools) {
      setSandollUsage("used");
      setMatchedLicenseStatus("verified");
    } else {
      setSandollUsage("not_used");
      setMatchedLicenseStatus("verified");
    }

    setHasParsed(true);
  };

  const handleAddTag = () => {
    if (!newTagInput.trim()) return;
    const formatted = newTagInput.startsWith("#")
      ? newTagInput.trim()
      : `#${newTagInput.trim()}`;
    if (!hashtags.includes(formatted)) {
      setHashtags([...hashtags, formatted]);
    }
    setNewTagInput("");
  };

  const handleRemoveTag = (tag: string) => {
    setHashtags(hashtags.filter((t) => t !== tag));
  };

  const handleFinalUpload = () => {
    if (!licenseAgreed && sandollUsage === "used") {
      setError("서체 라이선스 확인을 체크해주세요.");
      return;
    }

    if (
      !title.trim() ||
      !professor.trim() ||
      !filePath.trim() ||
      !designer.trim()
    ) {
      setError("작업명, NAS 경로, 교수명, 디자이너를 입력해주세요.");
      setStep(1);
      return;
    }
    if (asNewVersion && !changeReason) {
      setError("새 버전을 만든 이유를 골라주세요.");
      setStep(1);
      return;
    }
    const licenseStatus: LicenseStatus =
      sandollUsage === "needs_check"
        ? "needs_review"
        : sandollUsage === "not_used"
          ? "verified"
          : matchedLicenseStatus;
    const licenseNote =
      sandollUsage === "needs_check"
        ? "업로더의 서체 확인이 필요합니다."
        : sandollUsage === "used"
          ? "업로더가 선택한 산돌 라이선스 상태입니다."
          : undefined;
    const today = new Date().toISOString().split("T")[0];
    const entry = {
      version: finalVersion,
      fileName: finalFileName,
      filePath,
      uploadDate: today,
      designer,
      reason: (asNewVersion ? changeReason : "최초 제작") as ChangeReason,
      note: changeNote.trim() || undefined,
      originalKept: true,
    };

    if (asNewVersion && sameWork && onUploadVersion) {
      onUploadVersion({
        ...sameWork,
        version: finalVersion,
        fileName: finalFileName,
        filePath,
        designer,
        tools,
        hashtags,
        year: parseInt(year) || sameWork.year,
        hasSandoll: sandollUsage === "used",
        licenseStatus,
        licenseNote,
        uploadDate: today,
        fileSize,
        versions: [...getVersions(sameWork), entry],
      });
      return;
    }
    const newAsset: DesignAsset = {
      id: `asset-${Date.now()}`,
      title,
      professor,
      course,
      type: workType as any,
      year: parseInt(year) || 2026,
      tools,
      designer,
      version,
      filePath,
      fileName,
      hashtags,
      hasSandoll: sandollUsage === "used",
      licenseStatus,
      licenseNote,
      uploadDate: today,
      bgColor: "#FFE59A",
      accentColor: "#246BFD",
      summary: `${professor} 교수의 ${course} ${workType} 작업물입니다. (업로더: ${designer})`,
      dimensions: "1080 x 7800 px",
      fileSize,
      versions: [{ ...entry, version, fileName }],
    };

    onUploadSuccess(newAsset);
  };

  const field = (label: string, value: string, set: (s: string) => void) => (
    <label className="field">
      {label}
      <input value={value} onChange={(e) => set(e.target.value)} />
    </label>
  );
  return (
    <main className="page-shell narrow-page upload-page">
      <PageTitle title="자산 등록" onBack={onBack} />
      <nav className="step-nav" aria-label="등록 단계">
        {["파일 선택", "정보 확인", "라이선스"].map((name, i) => (
          <button
            key={name}
            className={step === i ? "active" : step > i ? "complete" : ""}
            onClick={() => {
              setStep(i);
              setError("");
            }}
            aria-current={step === i ? "step" : undefined}
          >
            <span>{i + 1}</span>
            {name}
          </button>
        ))}
      </nav>
      {step === 0 && (
        <section className="upload-step">
          <div
            className="dropzone"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <Upload size={32} strokeWidth={1.4} />
            <h2>파일을 끌어 놓거나 선택하세요</h2>
            <p>PNG, JPG, PSD, AI, FIG</p>
            <input
              aria-label="작업물 파일 선택"
              type="file"
              accept=".png,.jpg,.jpeg,.psd,.ai,.fig"
              onChange={handleFileSelect}
            />
            <span className="btn">파일 선택</span>
          </div>
          <div className="field-stack">
            <label className="field">
              NAS 경로
              <input
                value={filePath}
                placeholder="예: \\NAS\디자인\2026\이동건\색채학\상세페이지"
                onChange={(e) => applyPath(e.target.value)}
              />
            </label>
            <label className="field">
              파일명
              <div className="inline-input">
                <input
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                />
                <button
                  className="btn"
                  onClick={() => triggerAnalysis(fileName, filePath)}
                >
                  분석
                </button>
              </div>
            </label>
            <span className="muted">
              {fileSize} · NAS 경로와 파일명에서 작업 정보를 가져옵니다.
            </span>
          </div>
        </section>
      )}
      {step === 1 && (
        <section className="upload-step">
          <h2>작업 정보를 확인하세요</h2>
          {sameWork && latest && (
            <div className="version-match">
              <div className="version-match-head">
                <History size={18} />
                <div>
                  <strong>이미 등록된 작업이에요</strong>
                  <p>
                    {sameWork.title} · 현재 {latest.version} · 버전{" "}
                    {getVersions(sameWork).length}개
                  </p>
                </div>
              </div>
              <div className="choice-row" role="radiogroup" aria-label="등록 방식">
                <button
                  type="button"
                  className={`btn ${registerMode === "version" ? "selected" : ""}`}
                  aria-pressed={registerMode === "version"}
                  onClick={() => setRegisterMode("version")}
                >
                  새 버전으로 등록 ({nextVersion(latest.version)})
                </button>
                <button
                  type="button"
                  className={`btn ${registerMode === "new" ? "selected" : ""}`}
                  aria-pressed={registerMode === "new"}
                  onClick={() => setRegisterMode("new")}
                >
                  별도 작업으로 등록
                </button>
              </div>
              {asNewVersion && (
                <>
                  <div className="field">
                    바뀐 이유
                    <div className="choice-row reason-row">
                      {CHANGE_REASONS.map((r) => (
                        <button
                          type="button"
                          key={r}
                          className={`btn ${changeReason === r ? "selected" : ""}`}
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
                  </div>
                  <label className="field">
                    변경 내용
                    <input
                      value={changeNote}
                      placeholder="예: 개강일 3월 10일 → 3월 17일, 강남캠퍼스 → 종로캠퍼스"
                      onChange={(e) => setChangeNote(e.target.value)}
                    />
                  </label>
                  {versionTaken && (
                    <p className="version-hint">
                      파일명의 버전({version})은 이미 등록되어 있어{" "}
                      <strong>{finalVersion}</strong>로 등록해요. NAS에도{" "}
                      <code>{finalFileName}</code> 이름으로 저장해주세요.
                    </p>
                  )}
                </>
              )}
            </div>
          )}
          <label className="field nas-field">
            NAS 경로
            <input
              value={filePath}
              placeholder="예: \\NAS\디자인\2026\이동건\색채학\상세페이지"
              onChange={(e) => applyPath(e.target.value)}
            />
            <span className="path-parsed">
              {[
                ["연도", year],
                ["교수", professor],
                ["과정", course],
                ["유형", workType],
              ].map(([k, v]) => (
                <span key={k} className={v ? "" : "is-missing"}>
                  {k} <b>{v || "확인 필요"}</b>
                </span>
              ))}
            </span>
          </label>
          <div className="form-grid">
            {field("작업명", title, setTitle)}
            {field("교수명", professor, setProfessor)}
            {field("디자이너", designer, setDesigner)}
            {field("제작 연도", year, setYear)}
            {field("버전", asNewVersion ? finalVersion : version, setVersion)}
            <label className="field">
              작업 유형
              <select
                value={workType}
                onChange={(e) => setWorkType(e.target.value)}
              >
                {[
                  "상세페이지",
                  "배너",
                  "카드뉴스",
                  "포스터",
                  "썸네일",
                  "소개자료",
                ].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
          </div>
          {uncertainFields.length > 0 && (
            <p className="license-note">
              확인할 항목: {uncertainFields.join(", ")}
            </p>
          )}
          <div className="field-stack">
            <div className="field">
              사용 도구
              <div className="tag-list editable">
                {tools.map((t) => (
                  <span key={t}>
                    {t}
                    <button
                      onClick={() => setTools(tools.filter((x) => x !== t))}
                      aria-label={`${t} 삭제`}
                    >
                      <X size={13} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="inline-input">
                <input
                  aria-label="추가할 도구"
                  placeholder="도구명 입력"
                  value={newTool}
                  onChange={(e) => setNewTool(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newTool.trim()) {
                      setTools([...new Set([...tools, newTool.trim()])]);
                      setNewTool("");
                    }
                  }}
                />
                <button
                  className="btn"
                  onClick={() => {
                    if (newTool.trim())
                      setTools([...new Set([...tools, newTool.trim()])]);
                    setNewTool("");
                  }}
                >
                  추가
                </button>
              </div>
            </div>
          </div>
          <Disclosure
            title={`관련 태그 · ${isTagsApproved ? "확인 완료" : hashtags.length + "개"}`}
          >
            <div className="tag-list editable">
              {hashtags.map((t) => (
                <span key={t}>
                  {t}
                  <button
                    onClick={() => handleRemoveTag(t)}
                    aria-label={`${t} 삭제`}
                  >
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
            <div className="inline-input">
              <input
                value={newTagInput}
                aria-label="추가할 태그"
                placeholder="태그 입력"
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <button className="btn" onClick={handleAddTag}>
                추가
              </button>
              <button className="btn" onClick={() => setIsTagsApproved(true)}>
                {isTagsApproved ? "확인 완료" : "태그 확인"}
              </button>
            </div>
          </Disclosure>
        </section>
      )}
      {step === 2 && (
        <section className="upload-step">
          <h2>서체 사용 상태를 확인하세요</h2>
          <div className="choice-row">
            {[
              ["used", "산돌 사용"],
              ["not_used", "미사용"],
              ["needs_check", "확인 필요"],
            ].map(([v, l]) => (
              <button
                className={`btn ${sandollUsage === v ? "selected" : ""}`}
                key={v}
                onClick={() => {
                  setSandollUsage(v as any);
                  setLicenseAgreed(false);
                  setError("");
                }}
                aria-pressed={sandollUsage === v}
              >
                {l}
              </button>
            ))}
          </div>
          {sandollUsage === "used" && (
            <label className="field">
              라이선스 상태
              <select
                value={matchedLicenseStatus}
                onChange={(e) =>
                  setMatchedLicenseStatus(e.target.value as LicenseStatus)
                }
              >
                <option value="verified">확인 완료</option>
                <option value="needs_review">확인 필요</option>
                <option value="restricted">사용 제한</option>
                <option value="expired">기간 만료</option>
              </select>
            </label>
          )}
          <p className="muted">
            파일명 분석만으로 라이선스가 확인되지는 않습니다. 계약 범위를 직접
            확인해주세요.
          </p>
          <label className="check-line">
            <input
              type="checkbox"
              checked={licenseAgreed}
              onChange={(e) => {
                setLicenseAgreed(e.target.checked);
                setError("");
              }}
            />
            사용한 서체의 라이선스와 재사용 범위를 확인했습니다.
          </label>
          <Disclosure title="등록할 작업">
            <dl className="file-meta">
              {[
                ["작업명", title],
                ["NAS 경로", filePath],
                ["파일명", asNewVersion ? finalFileName : fileName],
                ...(asNewVersion
                  ? [
                      [
                        "버전",
                        `${latest?.version} → ${finalVersion} · ${changeReason || "이유 미선택"}`,
                      ],
                    ]
                  : []),
                ["사용 도구", tools.join(", ")],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </Disclosure>
        </section>
      )}
      <p role="alert" className="inline-feedback">
        {error}
      </p>
      <div className="wizard-footer">
        <button
          className="btn"
          onClick={() => (step ? setStep(step - 1) : onBack())}
        >
          {step ? "이전" : "취소"}
        </button>
        <button
          className="btn btn-primary"
          onClick={() => {
            if (step < 2) {
              if (step === 0) triggerAnalysis(fileName, filePath);
              setStep(step + 1);
              setError("");
            } else handleFinalUpload();
          }}
        >
          {step === 2 ? "아카이브에 등록" : "다음"}
          <ArrowLeft size={16} style={{ transform: "rotate(180deg)" }} />
        </button>
      </div>
    </main>
  );
};
