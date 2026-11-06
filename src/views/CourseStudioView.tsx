import React, { useEffect, useState } from "react";
import { ArrowLeft, ChevronDown, FileText, Plus, Printer, Trash2, Upload, Search, X } from "lucide-react";
import { PageTitle } from "../components/Chrome";
import { DesignThumbnail } from "../components/DesignThumbnail";
import { DesignAsset } from "../types";

type SlideVariant = "cover" | "contents" | "section" | "body" | "table";
type Slide = { id: number; title: string; body: string; layout: "basic" | "split" | "reference"; variant?: SlideVariant; table?: string[][] };
const makeSlide = (id: number): Slide => ({ id, title: "", body: "", layout: "basic" });
export const SAMPLE_PAGE_COUNT = 5;
export const slideTemplates: { variant: SlideVariant; label: string; description: string }[] = [
  { variant: "cover", label: "표지", description: "교안의 제목" },
  { variant: "contents", label: "목차", description: "학습 순서" },
  { variant: "section", label: "간지", description: "새 단원 구분" },
  { variant: "body", label: "본문 (텍스트)", description: "학습 내용" },
  { variant: "table", label: "본문 (표)", description: "내용 비교·정리" },
];
export function makeTemplateSlide(variant: SlideVariant, id: number): Slide {
  const common = { id, layout: "reference" as const, variant };
  switch (variant) {
    case "cover": return { ...common, title: "교안 제목을 입력하세요", body: "부제 또는 교육 과정을 입력하세요" };
    case "contents": return { ...common, title: "학습 순서", body: "01  첫 번째 내용\n02  두 번째 내용\n03  세 번째 내용" };
    case "section": return { ...common, title: "단원 제목을 입력하세요", body: "새로운 학습 내용을 시작합니다" };
    case "body": return { ...common, title: "본문 제목을 입력하세요", body: "학습 내용을 입력하세요.\n필요한 내용을 줄마다 정리해 보세요." };
    case "table": return { ...common, title: "표 제목을 입력하세요", body: "", table: [["구분", "내용"], ["항목 1", "설명을 입력하세요"], ["항목 2", "설명을 입력하세요"]] };
  }
}
export const makeSampleSlides = (): Slide[] => [
  { id: -1, title: "고객 응대의 기본", body: "고객의 마음을 이해하는 첫걸음\n고객 서비스 교육 교안", layout: "reference", variant: "cover" },
  { id: -2, title: "오늘의 학습 순서", body: "01  고객 응대의 기본\n02  경청과 공감의 방법\n03  문의 확인과 해결 안내", layout: "reference", variant: "contents" },
  { id: -3, title: "01. 고객 이해하기", body: "고객의 이야기에 귀 기울이기", layout: "reference", variant: "section" },
  { id: -4, title: "경청에서 시작하는 상담", body: "고객의 말을 끝까지 듣고\n문의 내용을 정확히 확인합니다.\n\n공감  ·  확인  ·  안내", layout: "reference", variant: "body" },
  { id: -5, title: "고객 응대 단계별 행동", body: "", layout: "reference", variant: "table", table: [["단계", "실천 방법"], ["공감", "고객의 이야기를 끝까지 듣기"], ["확인", "문의 내용과 상황 확인하기"], ["안내", "해결 방법을 쉽게 설명하기"]] },
];
export const courseSlideClassName = (slide: Slide) =>
  ["course-preview", slide.layout, slide.variant ? `course-variant-${slide.variant}` : ""].filter(Boolean).join(" ");
export function CourseSlidePreview({ slide, pageNumber, editable = false, onUpdate }: { slide: Slide; pageNumber: number; editable?: boolean; onUpdate?: (patch: Partial<Slide>) => void }) {
  return <div className={courseSlideClassName(slide)}>
    <div className="course-preview-inner">
      <span>학습 교안 · {String(pageNumber).padStart(2, "0")}</span>
      {editable
        ? <h3 key={`title-${slide.id}`} contentEditable suppressContentEditableWarning role="textbox" aria-label="교안 제목 수정" data-placeholder="제목을 입력하세요" onBlur={event => onUpdate?.({title: event.currentTarget.innerText})}>{slide.title}</h3>
        : <h3>{slide.title || "제목을 입력하세요"}</h3>}
      <div className="course-preview-line"/>
      {slide.variant === "table" && slide.table
        ? <table className="course-slide-table" aria-label="교안 표"><tbody>{slide.table.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, colIndex) => {
          const Cell = rowIndex === 0 ? "th" : "td";
          return <Cell key={colIndex} contentEditable={editable} suppressContentEditableWarning role={editable ? "textbox" : undefined} aria-label={editable ? `표 ${rowIndex + 1}행 ${colIndex + 1}열 수정` : undefined} onBlur={editable ? event => onUpdate?.({table: slide.table!.map((line, r) => line.map((value, c) => r === rowIndex && c === colIndex ? event.currentTarget.innerText : value))}) : undefined}>{cell}</Cell>;
        })}</tr>)}</tbody></table>
        : editable
        ? <p key={`body-${slide.id}`} contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true" aria-label="교안 본문 수정" data-placeholder="학습 내용을 입력하세요" onBlur={event => onUpdate?.({body: event.currentTarget.innerText})}>{slide.body}</p>
        : <p>{slide.body || "학습 내용을 입력하세요"}</p>}
      {slide.layout === "reference" && <div className="reference-decor" aria-hidden="true"><i/><i/><i/></div>}
    </div>
  </div>;
}
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] || c));
export const toggleReference = (ids: string[], id: string) =>
  ids.includes(id) ? ids.filter(item => item !== id) : ids.length < 3 ? [...ids, id] : ids;

export type SampleJob = { status: "idle" | "running" | "complete"; startedAt: number; progress: number };
export const sampleProgressAt = (elapsedMs: number) => Math.min(SAMPLE_PAGE_COUNT, Math.max(0, Math.floor(elapsedMs / 8000 * SAMPLE_PAGE_COUNT)));
export const showSampleJobIndicator = (courseVisible: boolean, status: SampleJob["status"]) => !courseVisible && status !== "idle";
const idleJob: SampleJob = { status: "idle", startedAt: 0, progress: 0 };
export function CourseStudioView({ onBack, allAssets, sampleJob = idleJob, onStartSample, onResetSample, visible = true, onCourseVisibilityChange, openJobRequest = 0 }: { onBack: () => void; allAssets: DesignAsset[]; sampleJob?: SampleJob; onStartSample?: () => void; onResetSample?: () => void; visible?: boolean; onCourseVisibilityChange?: (visible: boolean) => void; openJobRequest?: number }) {
  const [slides, setSlides] = useState<Slide[]>([makeSlide(1)]);
  const [currentId, setCurrentId] = useState(1);
  const [printError, setPrintError] = useState("");
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sampleSource, setSampleSource] = useState(false);
  const [samplePreview, setSamplePreview] = useState(false);
  const [stage, setStage] = useState<"preview" | "progress" | "review">("preview");
  const [sourceError, setSourceError] = useState("");
  const [search, setSearch] = useState("");
  const [referencePage, setReferencePage] = useState(0);
  const [referenceIds, setReferenceIds] = useState<string[]>([]);
  const [manualStarted, setManualStarted] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [openSection, setOpenSection] = useState<"source" | "reference" | "direction" | null>("source");
  const [instructions, setInstructions] = useState("");
  const [exclusions, setExclusions] = useState("");
  const selectedReferences = referenceIds.map(id => allAssets.find(asset => asset.id === id)).filter((asset): asset is DesignAsset => Boolean(asset));
  const query = search.trim().toLocaleLowerCase();
  const matches = allAssets.filter(asset => !query || [asset.id, asset.title, asset.project, asset.requestNo || "", asset.type].some(value => value.toLocaleLowerCase().includes(query)));
  const visibleReferences = matches.slice(referencePage * 4, referencePage * 4 + 4);
  const current = slides.find(slide => slide.id === currentId) || slides[0];
  useEffect(() => {
    onCourseVisibilityChange?.(visible);
    return () => onCourseVisibilityChange?.(false);
  }, [visible, onCourseVisibilityChange]);
  useEffect(() => {
    if (openJobRequest > 0) setStage(sampleJob.status === "complete" ? "review" : "progress");
  }, [openJobRequest]);
  const loadSample = () => {
    const hasWork = Boolean(sourceFile || sampleSource || referenceIds.length || instructions.trim() || exclusions.trim() || slides.some(slide => slide.title.trim() || slide.body.trim()));
    if (hasWork && !window.confirm("현재 선택하고 작성한 내용이 샘플로 바뀝니다. 샘플을 불러올까요?")) return;
    onResetSample?.();
    setSourceFile(null);
    setSourceError("");
    setSampleSource(true);
    setSamplePreview(true);
    const sampleReference = allAssets.find(asset => asset.id === "asset-1");
    setReferenceIds(sampleReference ? [sampleReference.id] : []);
    setSearch("");
    setReferencePage(0);
    setInstructions("색채학 레퍼런스의 파란 배경과 노란 원을 참고하고, 제목은 흰색의 굵은 글자로 크게 만들어 주세요.");
    setExclusions("사진과 화려한 그라데이션은 제외해 주세요.");
    setSlides(makeSampleSlides());
    setCurrentId(-1);
    setStage("preview");
    setManualStarted(true);
    setOpenSection(null);
  };
  const update = (patch: Partial<Slide>) => setSlides(previous => previous.map(s => s.id === current.id ? { ...s, ...patch } : s));
  const addSlide = (variant: SlideVariant) => {
    const id = Math.max(0, ...slides.map(s => s.id)) + 1;
    setSlides(previous => [...previous, makeTemplateSlide(variant, id)]);
    setCurrentId(id);
    setShowTemplates(false);
  };
  const removeSlide = () => {
    if (slides.length === 1) return;
    if (!window.confirm("현재 페이지를 삭제할까요? 삭제한 내용은 되돌릴 수 없습니다.")) return;
    const remaining = slides.filter(slide => slide.id !== current.id);
    setSlides(remaining);
    setCurrentId(remaining[0].id);
  };
  const slidePreview = (editable: boolean) => <CourseSlidePreview slide={current} pageNumber={slides.findIndex(s => s.id === current.id) + 1} editable={editable} onUpdate={update} />;
  const print = () => {
    const win = window.open("", "_blank");
    if (!win) { setPrintError("인쇄 창을 열지 못했어요. 브라우저의 팝업 차단을 해제해 주세요."); return; }
    setPrintError("");
    const printBody = (slide: Slide) => slide.variant === "table" && slide.table
      ? `<table>${slide.table.map((row, index) => `<tr>${row.map(cell => index === 0 ? `<th>${escapeHtml(cell)}</th>` : `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}</table>`
      : `<p>${escapeHtml(slide.body || "학습 내용을 입력해 주세요")}</p>`;
    const pages = slides.map((slide, index) => slide.layout === "reference"
      ? `<article class="reference ${slide.variant || ""}"><div class="reference-hero"><div class="kicker">학습 교안 · ${String(index + 1).padStart(2, "0")}</div><h1>${escapeHtml(slide.title || "제목을 입력해 주세요")}</h1><span class="reference-circle"></span></div><div class="reference-body">${printBody(slide)}<div class="reference-chips"><i></i><i></i><i></i></div></div></article>`
      : `<article class="${slide.layout}"><div class="kicker">학습 교안 · ${String(index + 1).padStart(2, "0")}</div><h1>${escapeHtml(slide.title || "제목을 입력해 주세요")}</h1><div class="line"></div><p>${escapeHtml(slide.body || "학습 내용을 입력해 주세요")}</p></article>`).join("");
    win.document.write(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>교안 미리보기</title><style>@page{size:landscape;margin:0}*{box-sizing:border-box}body{margin:0;font-family:Pretendard,"Malgun Gothic",sans-serif}article{min-height:100vh;padding:7%;page-break-after:always;print-color-adjust:exact;-webkit-print-color-adjust:exact}article:last-child{page-break-after:auto}.kicker{font-size:15px;color:#246bfd;font-weight:700}h1{font-size:46px;margin:32px 0 24px;word-break:keep-all}.line{width:55px;height:5px;background:#246bfd;margin-bottom:35px}p{font-size:24px;line-height:1.7;white-space:pre-wrap;word-break:keep-all}.split{background:linear-gradient(90deg,#f4f7ff 36%,white 36%)}article.reference{padding:0}.reference-hero{position:relative;background:#6e9bf7;color:white;padding:6% 7%;min-height:42vh}.reference-hero h1{position:relative;z-index:1;color:white;max-width:72%;font-size:54px}.reference-hero .kicker{color:white}.reference-circle{position:absolute;right:8%;top:15%;width:120px;height:120px;border-radius:50%;background:#f5cc55}.reference-body{padding:3% 7%}.reference-body p{font-size:22px;margin:0}.reference-chips{display:flex;gap:12px;margin-top:20px}.reference-chips i{width:54px;height:35px;border-radius:5px;background:#f5cc55}.reference-chips i:nth-child(2){background:#6e9bf7}.reference-chips i:nth-child(3){background:#efeae4}.reference.cover,.reference.section{background:#6e9bf7}.reference.cover .reference-body,.reference.section .reference-body{background:#6e9bf7;color:white}.reference-body table{border-collapse:collapse;width:100%;font-size:18px}.reference-body th,.reference-body td{border:1px solid #d4dbe5;text-align:left;padding:8px 12px}.reference-body th{background:#eef4ff}.reference.cover .reference-chips i:nth-child(2){background:white}</style></head><body>${pages}</body></html>`);
    win.document.close();
    win.focus();
    win.print();
  };
  return (
    <main className="page-shell course-studio">
      <PageTitle title={stage === "preview" ? "교안 만들기" : stage === "progress" ? "교안 제작 상태" : "교안 검토 · 내용 수정"} subtitle={stage === "preview" ? "기획 교안과 참고 디자인을 선택하고 디자인 방향을 확인해 보세요." : stage === "progress" ? "샘플 제작 흐름을 체험해 보세요." : "페이지를 선택하고 제목이나 내용을 직접 수정해 보세요."} onBack={stage === "preview" ? onBack : () => setStage("preview")} />
      {stage === "preview" ? <>
      <div className="course-notice"><FileText size={18}/><span>현재는 제작 준비 화면입니다. AI 분석과 자동 생성은 아직 연결되지 않았어요.</span><button type="button" className="sample-start" onClick={loadSample}>샘플로 사용해 보기</button></div>
      <div className="course-workspace">
        <section className="course-editor" aria-label="교안 편집">
          <div className="brief-section">
            <button type="button" className="brief-trigger" aria-expanded={openSection === "source"} aria-controls="course-source" onClick={() => setOpenSection(openSection === "source" ? null : "source")}><span className="brief-number">01</span><span className="brief-trigger-copy"><strong>기획 교안</strong><small>{sampleSource ? "샘플 교안 · 고객 응대 기본" : sourceFile ? sourceFile.name : "원본 파일을 선택해 주세요"}</small></span><ChevronDown size={18}/></button>
            <div id="course-source" className="brief-content" hidden={openSection !== "source"}><p>기획자가 작성한 교안을 선택해 주세요.</p>
            {!sampleSource && !sourceFile && <p className="guide-caption">① 먼저 기획 교안 파일을 선택해 주세요.</p>}<label className={`source-upload ${!sampleSource && !sourceFile ? "guide-focus" : ""}`}><Upload size={18}/><span>{sourceFile || sampleSource ? "파일 다시 선택" : "교안 파일 선택"}</span><input type="file" accept=".ppt,.pptx,.pdf,.doc,.docx,.txt" onChange={event => { const file = event.target.files?.[0]; event.target.value = ""; if (!file) return; if (file.size > 20 * 1024 * 1024) { setSourceError("20MB 이하의 파일을 선택해 주세요."); return; } setSourceError(""); setSampleSource(false); setSourceFile(file); setOpenSection("reference"); }} /></label>
            {sampleSource && <div className="sample-source"><strong>샘플 기획 내용</strong><p>고객 응대의 기본: 고객의 말을 끝까지 듣고 문의 내용을 정확히 확인한다. 고객 응대는 공감, 확인, 안내의 3단계로 진행한다.</p><small>사용 흐름을 보여주기 위한 예시 내용이며, 실제 업로드된 파일이 아닙니다.</small></div>}
            {sourceFile && <div className="source-file"><FileText size={16}/><span>{sourceFile.name}</span><button type="button" onClick={() => setSourceFile(null)} aria-label="선택 파일 제거"><X size={16}/></button></div>}
            <p className="brief-hint">PPT·PDF·Word·텍스트 파일 선택 가능 · 최대 20MB<br/>선택한 파일은 서버에 전송되거나 분석되지 않습니다.</p><p role="status" className="course-error">{sourceError}</p>
            </div>
          </div>
          <div className="brief-section">
            <button type="button" className="brief-trigger" aria-expanded={openSection === "reference"} aria-controls="course-reference" onClick={() => setOpenSection(openSection === "reference" ? null : "reference")}><span className="brief-number">02</span><span className="brief-trigger-copy"><strong>레퍼런스 선택</strong><small>{referenceIds.length ? `${referenceIds.length}개 선택됨 · 최대 3개` : "아카이브에서 1~3개 선택"}</small></span><ChevronDown size={18}/></button>
            {openSection !== "reference" && selectedReferences.length > 0 && <div className="reference-summary" aria-label="선택한 레퍼런스">{selectedReferences.map(asset => <div className="reference-summary-item" key={asset.id} title={asset.title}><div className="reference-image"><DesignThumbnail asset={asset}/></div><span>{asset.title}</span></div>)}</div>}
            <div id="course-reference" className="brief-content" hidden={openSection !== "reference"}><p>마음에 드는 디자인을 1~3개 선택해 주세요. <strong>{referenceIds.length} / 3개</strong></p>
            {!sampleSource && sourceFile && referenceIds.length === 0 && <p className="guide-caption">② 작업을 검색하고 아래에서 선택해 주세요.</p>}<label className={`reference-search ${!sampleSource && sourceFile && referenceIds.length === 0 ? "guide-focus" : ""}`}><Search size={17}/><span className="sr-only">레퍼런스 검색</span><input value={search} onChange={event => { setSearch(event.target.value); setReferencePage(0); }} placeholder="작업명 · 요청번호 · 자산 ID" /></label>
            {selectedReferences.length > 0 && <div className="selected-reference-list" aria-label="선택한 레퍼런스">{selectedReferences.map(asset => <div className="selected-reference" key={asset.id}><div className="reference-image"><DesignThumbnail asset={asset}/></div><div><strong>{asset.title}</strong><small>{asset.id} · {asset.type}{asset.device ? ` ${asset.device}` : ""} · {asset.version}</small></div><button type="button" aria-label={`${asset.title} 선택 해제`} onClick={() => setReferenceIds(ids => ids.filter(id => id !== asset.id))}><X size={16}/></button></div>)}</div>}
            <div className="reference-results">{visibleReferences.map(asset => { const selected = referenceIds.includes(asset.id); return <button type="button" className={`reference-choice ${selected ? "is-selected" : ""}`} key={asset.id} aria-pressed={selected} disabled={!selected && referenceIds.length >= 3} onClick={() => setReferenceIds(ids => toggleReference(ids, asset.id))}><div className="reference-image"><DesignThumbnail asset={asset}/></div><span><strong>{asset.title}</strong><small>{asset.id} · {asset.type}{asset.device ? ` ${asset.device}` : ""}</small><small>{selected ? "선택됨" : "선택하기"}</small></span></button>})}{matches.length === 0 && <p>일치하는 작업이 없어요. 다른 검색어를 입력해 주세요.</p>}</div>
            {matches.length > 4 && <div className="reference-pager"><button type="button" disabled={referencePage === 0} onClick={() => setReferencePage(page => page - 1)}>이전</button><span>{referencePage + 1} / {Math.ceil(matches.length / 4)}</span><button type="button" disabled={(referencePage + 1) * 4 >= matches.length} onClick={() => setReferencePage(page => page + 1)}>다음</button></div>}
            {referenceIds.length === 3 && <p className="brief-hint" role="status">최대 3개까지 선택할 수 있어요. 다른 작업을 선택하려면 기존 선택을 해제해 주세요.</p>}
            <p className="brief-hint">원본 이미지가 없는 작업은 샘플 그래픽으로 표시됩니다. 현재 ID는 임시 식별자이며, 요청번호는 여러 작업에 공통으로 쓰일 수 있어요.</p>
            <button type="button" className={`brief-done ${!sampleSource && referenceIds.length > 0 ? "guide-focus" : ""}`} disabled={referenceIds.length === 0} onClick={() => setOpenSection("direction")}>선택 완료</button>
            </div>
          </div>
          <div className="brief-section">
            <button type="button" className="brief-trigger" aria-expanded={openSection === "direction"} aria-controls="course-direction" onClick={() => setOpenSection(openSection === "direction" ? null : "direction")}><span className="brief-number">03</span><span className="brief-trigger-copy"><strong>제작 방향</strong><small>{instructions || exclusions ? "작성한 내용을 확인하거나 수정하기" : "반영할 점과 제외할 점 입력"}</small></span><ChevronDown size={18}/></button>
            <div id="course-direction" className="brief-content" hidden={openSection !== "direction"}><p>참고할 요소와 적용하지 않을 요소를 짧고 구체적으로 적어 주세요.</p>
            {!sampleSource && sourceFile && referenceIds.length > 0 && !instructions.trim() && <p className="guide-caption">③ 반영할 점을 적고 작성 완료를 눌러 주세요.</p>}<label className="course-field">반영할 점<textarea className={!sampleSource && sourceFile && referenceIds.length > 0 && !instructions.trim() ? "guide-focus" : ""} rows={2} value={instructions} onChange={event => setInstructions(event.target.value)} placeholder="예: 레퍼런스의 컬러 구성을 참고하고, 제목은 더 굵고 크게 만들어 주세요." maxLength={1000}/></label>
            <label className="course-field">제외할 점 <span className="optional-label">선택</span><textarea rows={2} value={exclusions} onChange={event => setExclusions(event.target.value)} placeholder="예: 파란색, 장식 아이콘, 지나치게 긴 문장은 제외해 주세요." maxLength={1000}/></label>
            <div className="prompt-example"><strong>이렇게 적으면 좋아요</strong><p>“레퍼런스의 차분한 컬러와 여백을 참고해 주세요. 제목은 더 굵게 하고, 파란색과 장식 아이콘은 제외해 주세요.”</p></div>
            <button type="button" className={`brief-done ${!sampleSource && instructions.trim() ? "guide-focus" : ""}`} onClick={() => setOpenSection(null)}>작성 완료</button>
            </div>
          </div>
          <button type="button" className="btn btn-primary course-pending" disabled>AI 교안 만들기 · 연결 준비 중</button><p className="brief-hint">입력한 요청은 아직 AI로 전송되지 않으며 미리보기에 적용되지 않습니다.</p>
        </section>
        <section className="course-design-stage" aria-label="디자인 방향 미리보기">
          <div className="course-panel-heading"><div><span className="course-overline">디자인 방향</span><h2>미리보기</h2></div><span className="course-preview-label">{samplePreview ? "샘플 예시 · 16:9" : "16:9"}</span></div>
          <div className="course-preview-panel">
            {manualStarted ? slidePreview(false) : <div className="course-preview-empty"><FileText size={28}/><strong>디자인 예시가 여기에 표시됩니다</strong><p>샘플로 표지·목차·본문을 확인해 보세요.</p></div>}
          </div>
          {samplePreview ? <>
            <div className="course-slide-list sample-slides" aria-label="샘플 디자인 페이지">{slides.filter(slide => slide.id < 0).map((slide, index) => <button key={slide.id} type="button" className={slide.id === current.id ? "active" : ""} aria-pressed={slide.id === current.id} onClick={() => setCurrentId(slide.id)}>{slideTemplates.find(template => template.variant === slide.variant)?.label ?? `${index + 1}페이지`}</button>)}</div>
            <div className="stage-action"><p>미리 제작한 5장 예시입니다. 변경한 요청으로 자동 생성되지는 않아요.</p><button type="button" className="btn btn-primary" onClick={() => { if (sampleJob.status === "idle") onStartSample?.(); setStage(onStartSample ? "progress" : "review"); }}>샘플 확정 · 다음</button></div>
          </> : <div className="stage-action"><p>AI 디자인 생성은 연결 준비 중입니다.</p><button type="button" className="btn" onClick={() => { setManualStarted(true); setStage("review"); }}>기본 교안 직접 편집</button></div>}
        </section>
      </div>
      </> : stage === "progress" ? <>
        <div className="course-notice"><FileText size={18}/><span>실제 AI 생성이 아닌 샘플 체험입니다. 다른 메뉴로 이동해도 브라우저 탭을 열어둔 동안 상태가 이어져요. 새로고침하면 초기화됩니다.</span></div>
        <section className="sample-progress" aria-live="polite">
          <div className="progress-tag">샘플 교안 · 고객 응대의 기본</div>
          <h2>{sampleJob.status === "complete" ? "샘플 교안이 준비됐어요" : "샘플 제작 과정을 보여드리고 있어요"}</h2>
          <p>{sampleJob.status === "complete" ? "미리 준비된 5장의 예시를 확인하고 내용을 수정할 수 있어요." : "체험을 위해 약 8초 동안 진행 상태를 보여드립니다."}</p>
          <div className="progress-track" role="progressbar" aria-label="샘플 진행률" aria-valuemin={0} aria-valuemax={SAMPLE_PAGE_COUNT} aria-valuenow={sampleJob.progress}><span style={{width: `${(sampleJob.progress / SAMPLE_PAGE_COUNT) * 100}%`}}/></div>
          <div className="progress-caption"><strong>{sampleJob.progress} / {SAMPLE_PAGE_COUNT}페이지</strong><span>{sampleJob.status === "complete" ? "샘플 준비 완료" : "샘플 체험 중"}</span></div>
          <div className="progress-actions">{sampleJob.status === "complete" ? <button type="button" className="btn btn-primary" onClick={() => setStage("review")}>교안 확인하기</button> : <p>다른 메뉴로 이동하면 완료 시 알림이 표시됩니다.</p>}<button type="button" className="btn" onClick={() => setStage("preview")}>디자인 확인으로 돌아가기</button></div>
        </section>
      </> : <>
        <div className="review-stage-bar"><button type="button" className="review-back" onClick={() => setStage("preview")}><ArrowLeft size={16}/> 디자인 확인으로 돌아가기</button><span>수정한 내용은 이 화면을 오가도 유지됩니다.</span></div>
        <div className="course-notice"><FileText size={18}/><span>{samplePreview ? "미리 제작한 샘플 5장입니다. 실제 전체 교안 자동 생성은 아직 연결되지 않았어요." : "기본 교안을 직접 편집하는 화면입니다. 자동 생성은 연결되지 않았어요."}</span></div>
        <div className="course-review">
          <aside className="review-pages" aria-label="교안 페이지"><h2>페이지 <span>{slides.length}</span></h2><div className="review-pages-list">{slides.map((slide, index) => <button key={slide.id} type="button" className={slide.id === current.id ? "active" : ""} aria-pressed={slide.id === current.id} onClick={() => setCurrentId(slide.id)}><span>{String(index + 1).padStart(2, "0")}</span><strong>{slide.title || "새 페이지"}</strong></button>)}</div><button type="button" className="review-add" aria-expanded={showTemplates} aria-controls="page-template-picker" onClick={() => setShowTemplates(open => !open)}><Plus size={16}/> 페이지 추가</button>{showTemplates && <div className="page-template-picker" id="page-template-picker"><p>추가할 페이지를 선택하세요</p>{slideTemplates.map(template => <button type="button" key={template.variant} onClick={() => addSlide(template.variant)}><span className={`page-template-mark mark-${template.variant}`} aria-hidden="true"/><span><strong>{template.label}</strong><small>{template.description}</small></span></button>)}</div>}</aside>
          <section className="review-work" aria-label="페이지 내용 편집"><div className="review-topline"><div><strong>{slides.findIndex(s => s.id === current.id) + 1}페이지</strong><span>제목·내용이나 표의 셀을 눌러 수정하세요</span></div><button type="button" className="course-remove" onClick={removeSlide} disabled={slides.length === 1}><Trash2 size={15}/> 페이지 삭제</button></div><div className="review-canvas">{slidePreview(true)}</div><div className="review-actions"><p>수정한 내용은 새로고침하면 사라집니다.</p><button type="button" className="btn btn-primary" onClick={print}><Printer size={16}/> 인쇄 · PDF 저장</button></div><p role="status" className="course-error">{printError}</p></section>
        </div>
      </>}
    </main>
  );
}
