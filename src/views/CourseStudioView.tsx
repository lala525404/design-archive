import React, { useState } from "react";
import { ChevronDown, FileText, Plus, Printer, Trash2, Upload, Search, X } from "lucide-react";
import { PageTitle } from "../components/Chrome";
import { DesignThumbnail } from "../components/DesignThumbnail";
import { DesignAsset } from "../types";

type Slide = { id: number; title: string; body: string; layout: "basic" | "split" };
const makeSlide = (id: number): Slide => ({ id, title: "", body: "", layout: "basic" });
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] || c));
export const toggleReference = (ids: string[], id: string) =>
  ids.includes(id) ? ids.filter(item => item !== id) : ids.length < 3 ? [...ids, id] : ids;

export function CourseStudioView({ onBack, allAssets }: { onBack: () => void; allAssets: DesignAsset[] }) {
  const [slides, setSlides] = useState<Slide[]>([makeSlide(1)]);
  const [currentId, setCurrentId] = useState(1);
  const [printError, setPrintError] = useState("");
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sampleSource, setSampleSource] = useState(false);
  const [samplePreview, setSamplePreview] = useState(false);
  const [sourceError, setSourceError] = useState("");
  const [search, setSearch] = useState("");
  const [referencePage, setReferencePage] = useState(0);
  const [referenceIds, setReferenceIds] = useState<string[]>([]);
  const [manualStarted, setManualStarted] = useState(false);
  const [openSection, setOpenSection] = useState<"source" | "reference" | "direction" | null>("source");
  const [instructions, setInstructions] = useState("");
  const [exclusions, setExclusions] = useState("");
  const selectedReferences = referenceIds.map(id => allAssets.find(asset => asset.id === id)).filter((asset): asset is DesignAsset => Boolean(asset));
  const query = search.trim().toLocaleLowerCase();
  const matches = allAssets.filter(asset => !query || [asset.id, asset.title, asset.project, asset.requestNo || "", asset.type].some(value => value.toLocaleLowerCase().includes(query)));
  const visibleReferences = matches.slice(referencePage * 4, referencePage * 4 + 4);
  const current = slides.find(slide => slide.id === currentId) || slides[0];
  const loadSample = () => {
    const hasWork = Boolean(sourceFile || sampleSource || referenceIds.length || instructions.trim() || exclusions.trim() || slides.some(slide => slide.title.trim() || slide.body.trim()));
    if (hasWork && !window.confirm("현재 선택하고 작성한 내용이 샘플로 바뀝니다. 샘플을 불러올까요?")) return;
    setSourceFile(null);
    setSourceError("");
    setSampleSource(true);
    setSamplePreview(true);
    setReferenceIds(allAssets.length ? [allAssets[0].id] : []);
    setSearch("");
    setReferencePage(0);
    setInstructions("정돈된 여백과 파란색 포인트를 사용하고, 제목은 굵고 크게 만들어 주세요.");
    setExclusions("화려한 그라데이션과 장식용 아이콘은 제외해 주세요.");
    setSlides([
      { id: -1, title: "고객 응대의 기본", body: "고객의 말을 끝까지 듣고,\n문의 내용을 정확히 확인합니다.\n\n공감 → 확인 → 안내", layout: "basic" },
      { id: -2, title: "고객 응대 3단계", body: "01  먼저 듣고 공감하기\n02  문의 내용과 상황 확인하기\n03  해결 방법을 쉽게 안내하기", layout: "basic" },
    ]);
    setCurrentId(-1);
    setManualStarted(true);
    setOpenSection(null);
  };
  const update = (patch: Partial<Slide>) => setSlides(previous => previous.map(s => s.id === current.id ? { ...s, ...patch } : s));
  const addSlide = () => {
    const id = Math.max(...slides.map(s => s.id)) + 1;
    setSlides(previous => [...previous, makeSlide(id)]);
    setCurrentId(id);
  };
  const removeSlide = () => {
    if (slides.length === 1) return;
    const remaining = slides.filter(slide => slide.id !== current.id);
    setSlides(remaining);
    setCurrentId(remaining[0].id);
  };
  const print = () => {
    const win = window.open("", "_blank");
    if (!win) { setPrintError("인쇄 창을 열지 못했어요. 브라우저의 팝업 차단을 해제해 주세요."); return; }
    setPrintError("");
    const pages = slides.map((slide, index) => `<article class="${slide.layout}"><div class="kicker">학습 교안 · ${String(index + 1).padStart(2, "0")}</div><h1>${escapeHtml(slide.title || "제목을 입력해 주세요")}</h1><div class="line"></div><p>${escapeHtml(slide.body || "학습 내용을 입력해 주세요")}</p></article>`).join("");
    win.document.write(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>교안 미리보기</title><style>@page{size:landscape;margin:0}*{box-sizing:border-box}body{margin:0;font-family:Pretendard,"Malgun Gothic",sans-serif}article{min-height:100vh;padding:7%;page-break-after:always}article:last-child{page-break-after:auto}.kicker{font-size:15px;color:#246bfd;font-weight:700}h1{font-size:46px;margin:32px 0 24px;word-break:keep-all}.line{width:55px;height:5px;background:#246bfd;margin-bottom:35px}p{font-size:24px;line-height:1.7;white-space:pre-wrap;word-break:keep-all}.split{background:linear-gradient(90deg,#f4f7ff 36%,white 36%)}</style></head><body>${pages}</body></html>`);
    win.document.close();
    win.focus();
    win.print();
  };
  return (
    <main className="page-shell course-studio">
      <PageTitle title="교안 만들기" subtitle="기획 교안과 참고 디자인을 선택하고 원하는 방향을 정리해 보세요." onBack={onBack} />
      <div className="course-notice"><FileText size={18}/><span>현재는 제작 준비 화면입니다. AI 분석과 자동 생성은 아직 연결되지 않았어요.</span><button type="button" className="sample-start" onClick={loadSample}>샘플로 사용해 보기</button></div>
      <div className="course-workspace">
        <section className="course-editor" aria-label="교안 편집">
          <div className="brief-section">
            <button type="button" className="brief-trigger" aria-expanded={openSection === "source"} aria-controls="course-source" onClick={() => setOpenSection(openSection === "source" ? null : "source")}><span className="brief-number">01</span><span className="brief-trigger-copy"><strong>기획 교안</strong><small>{sampleSource ? "샘플 교안 · 고객 응대 기본" : sourceFile ? sourceFile.name : "원본 파일을 선택해 주세요"}</small></span><ChevronDown size={18}/></button>
            <div id="course-source" className="brief-content" hidden={openSection !== "source"}><p>기획자가 작성한 교안을 선택해 주세요.</p>
            <label className="source-upload"><Upload size={18}/><span>{sourceFile || sampleSource ? "파일 다시 선택" : "교안 파일 선택"}</span><input type="file" accept=".ppt,.pptx,.pdf,.doc,.docx,.txt" onChange={event => { const file = event.target.files?.[0]; event.target.value = ""; if (!file) return; if (file.size > 20 * 1024 * 1024) { setSourceError("20MB 이하의 파일을 선택해 주세요."); return; } setSourceError(""); setSampleSource(false); setSourceFile(file); setOpenSection("reference"); }} /></label>
            {sampleSource && <div className="sample-source"><strong>샘플 기획 내용</strong><p>고객 응대의 기본: 고객의 말을 끝까지 듣고 문의 내용을 정확히 확인한다. 고객 응대는 공감, 확인, 안내의 3단계로 진행한다.</p><small>사용 흐름을 보여주기 위한 예시 내용이며, 실제 업로드된 파일이 아닙니다.</small></div>}
            {sourceFile && <div className="source-file"><FileText size={16}/><span>{sourceFile.name}</span><button type="button" onClick={() => setSourceFile(null)} aria-label="선택 파일 제거"><X size={16}/></button></div>}
            <p className="brief-hint">PPT·PDF·Word·텍스트 파일 선택 가능 · 최대 20MB<br/>선택한 파일은 서버에 전송되거나 분석되지 않습니다.</p><p role="status" className="course-error">{sourceError}</p>
            </div>
          </div>
          <div className="brief-section">
            <button type="button" className="brief-trigger" aria-expanded={openSection === "reference"} aria-controls="course-reference" onClick={() => setOpenSection(openSection === "reference" ? null : "reference")}><span className="brief-number">02</span><span className="brief-trigger-copy"><strong>레퍼런스 선택</strong><small>{referenceIds.length ? `${referenceIds.length}개 선택됨 · 최대 3개` : "아카이브에서 1~3개 선택"}</small></span><ChevronDown size={18}/></button>
            {openSection !== "reference" && selectedReferences.length > 0 && <div className="reference-summary" aria-label="선택한 레퍼런스">{selectedReferences.map(asset => <div className="reference-summary-item" key={asset.id} title={asset.title}><div className="reference-image"><DesignThumbnail asset={asset}/></div><span>{asset.title}</span></div>)}</div>}
            <div id="course-reference" className="brief-content" hidden={openSection !== "reference"}><p>마음에 드는 디자인을 1~3개 선택해 주세요. <strong>{referenceIds.length} / 3개</strong></p>
            <label className="reference-search"><Search size={17}/><span className="sr-only">레퍼런스 검색</span><input value={search} onChange={event => { setSearch(event.target.value); setReferencePage(0); }} placeholder="작업명 · 요청번호 · 자산 ID" /></label>
            {selectedReferences.length > 0 && <div className="selected-reference-list" aria-label="선택한 레퍼런스">{selectedReferences.map(asset => <div className="selected-reference" key={asset.id}><div className="reference-image"><DesignThumbnail asset={asset}/></div><div><strong>{asset.title}</strong><small>{asset.id} · {asset.type}{asset.device ? ` ${asset.device}` : ""} · {asset.version}</small></div><button type="button" aria-label={`${asset.title} 선택 해제`} onClick={() => setReferenceIds(ids => ids.filter(id => id !== asset.id))}><X size={16}/></button></div>)}</div>}
            <div className="reference-results">{visibleReferences.map(asset => { const selected = referenceIds.includes(asset.id); return <button type="button" className={`reference-choice ${selected ? "is-selected" : ""}`} key={asset.id} aria-pressed={selected} disabled={!selected && referenceIds.length >= 3} onClick={() => setReferenceIds(ids => toggleReference(ids, asset.id))}><div className="reference-image"><DesignThumbnail asset={asset}/></div><span><strong>{asset.title}</strong><small>{asset.id} · {asset.type}{asset.device ? ` ${asset.device}` : ""}</small><small>{selected ? "선택됨" : "선택하기"}</small></span></button>})}{matches.length === 0 && <p>일치하는 작업이 없어요. 다른 검색어를 입력해 주세요.</p>}</div>
            {matches.length > 4 && <div className="reference-pager"><button type="button" disabled={referencePage === 0} onClick={() => setReferencePage(page => page - 1)}>이전</button><span>{referencePage + 1} / {Math.ceil(matches.length / 4)}</span><button type="button" disabled={(referencePage + 1) * 4 >= matches.length} onClick={() => setReferencePage(page => page + 1)}>다음</button></div>}
            {referenceIds.length === 3 && <p className="brief-hint" role="status">최대 3개까지 선택할 수 있어요. 다른 작업을 선택하려면 기존 선택을 해제해 주세요.</p>}
            <p className="brief-hint">원본 이미지가 없는 작업은 샘플 그래픽으로 표시됩니다. 현재 ID는 임시 식별자이며, 요청번호는 여러 작업에 공통으로 쓰일 수 있어요.</p>
            <button type="button" className="brief-done" disabled={referenceIds.length === 0} onClick={() => setOpenSection("direction")}>선택 완료</button>
            </div>
          </div>
          <div className="brief-section">
            <button type="button" className="brief-trigger" aria-expanded={openSection === "direction"} aria-controls="course-direction" onClick={() => setOpenSection(openSection === "direction" ? null : "direction")}><span className="brief-number">03</span><span className="brief-trigger-copy"><strong>제작 방향</strong><small>{instructions || exclusions ? "작성한 내용을 확인하거나 수정하기" : "반영할 점과 제외할 점 입력"}</small></span><ChevronDown size={18}/></button>
            <div id="course-direction" className="brief-content" hidden={openSection !== "direction"}><p>참고할 요소와 적용하지 않을 요소를 짧고 구체적으로 적어 주세요.</p>
            <label className="course-field">반영할 점<textarea rows={2} value={instructions} onChange={event => setInstructions(event.target.value)} placeholder="예: 레퍼런스의 컬러 구성을 참고하고, 제목은 더 굵고 크게 만들어 주세요." maxLength={1000}/></label>
            <label className="course-field">제외할 점 <span className="optional-label">선택</span><textarea rows={2} value={exclusions} onChange={event => setExclusions(event.target.value)} placeholder="예: 파란색, 장식 아이콘, 지나치게 긴 문장은 제외해 주세요." maxLength={1000}/></label>
            <div className="prompt-example"><strong>이렇게 적으면 좋아요</strong><p>“레퍼런스의 차분한 컬러와 여백을 참고해 주세요. 제목은 더 굵게 하고, 파란색과 장식 아이콘은 제외해 주세요.”</p></div>
            <button type="button" className="brief-done" onClick={() => setOpenSection(null)}>작성 완료</button>
            </div>
          </div>
          <button type="button" className="btn btn-primary course-pending" disabled>AI 교안 만들기 · 연결 준비 중</button><p className="brief-hint">입력한 요청은 아직 AI로 전송되지 않으며 미리보기에 적용되지 않습니다.</p>
        </section>
        <section className="course-preview-panel" aria-label="교안 미리보기">
          <div className="course-panel-heading"><div><span className="course-overline">{samplePreview ? "샘플 결과 · 직접 편집" : manualStarted ? "기본 템플릿 · 직접 편집" : "디자인 결과"}</span><h2>미리보기</h2></div><span className="course-preview-label">16:9</span></div>
          {!manualStarted ? <div className="course-preview-empty"><FileText size={28}/><strong>만들어진 교안을 이곳에서 확인해요</strong><p>AI 교안 생성은 준비 중이에요.<br/>기본 템플릿으로 직접 편집을 체험할 수 있습니다.</p><button type="button" className="btn" onClick={() => setManualStarted(true)}>기본 템플릿 열기</button></div> : <>
          <div className="course-slide-list" aria-label="교안 페이지">
            {slides.map((slide, index) => <button key={slide.id} type="button" className={slide.id === current.id ? "active" : ""} aria-pressed={slide.id === current.id} onClick={() => setCurrentId(slide.id)}>{index + 1}페이지</button>)}
            <button type="button" onClick={addSlide} aria-label="페이지 추가"><Plus size={15}/> 추가</button>
          </div>
          {samplePreview && <p className="sample-guide">사용 가이드: 왼쪽 항목을 열어 샘플 교안·레퍼런스·요청을 확인하고, 아래 페이지를 눌러 직접 수정해 보세요. 이 결과는 미리 준비된 예시로, AI가 생성한 화면이 아닙니다.</p>}
          <p className="brief-hint preview-instruction">제목이나 본문을 눌러 화면에서 직접 수정하세요.</p>
          <div className={`course-preview ${current.layout}`}><div className="course-preview-inner"><span>학습 교안 · {String(slides.findIndex(s => s.id === current.id) + 1).padStart(2, "0")}</span><h3 key={`title-${current.id}`} contentEditable suppressContentEditableWarning role="textbox" aria-label="교안 제목 수정" data-placeholder="제목을 입력하세요" onBlur={event => update({title: event.currentTarget.innerText})}>{current.title}</h3><div className="course-preview-line"/><p key={`body-${current.id}`} contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true" aria-label="교안 본문 수정" data-placeholder="학습 내용을 입력하세요" onBlur={event => update({body: event.currentTarget.innerText})}>{current.body}</p></div></div>
          <div className="preview-controls"><div className="course-template-title">템플릿 선택</div><div className="course-templates">
            <button type="button" className={current.layout === "basic" ? "active" : ""} aria-pressed={current.layout === "basic"} onClick={() => update({ layout: "basic" })}><span className="template-icon"><i/><i/><i/></span><strong>기본형</strong><small>제목과 내용을 간결하게</small></button>
            <button type="button" className={current.layout === "split" ? "active" : ""} aria-pressed={current.layout === "split"} onClick={() => update({ layout: "split" })}><span className="template-icon split"><i/><i/><i/></span><strong>분할형</strong><small>여백으로 구성을 나누어</small></button>
          </div><button type="button" className="course-remove" onClick={removeSlide} disabled={slides.length === 1}><Trash2 size={15}/> 현재 페이지 삭제</button></div>
          <div className="course-preview-bottom"><p>인쇄 화면에서 PDF로 저장할 수 있어요.<br/>입력 내용은 페이지를 벗어나거나 새로고침하면 사라집니다.</p><button type="button" className="btn btn-primary" onClick={print}><Printer size={16}/> 인쇄 · PDF 저장</button></div>
          <p role="status" className="course-error">{printError}</p>
          </>}
        </section>
      </div>
    </main>
  );
}
