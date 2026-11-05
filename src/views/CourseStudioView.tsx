import React, { useState } from "react";
import { ArrowRight, FileText, Plus, Printer, Trash2, Upload, Search, X } from "lucide-react";
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
  const [sourceError, setSourceError] = useState("");
  const [search, setSearch] = useState("");
  const [referenceIds, setReferenceIds] = useState<string[]>([]);
  const [manualStarted, setManualStarted] = useState(false);
  const [instructions, setInstructions] = useState("");
  const [exclusions, setExclusions] = useState("");
  const selectedReferences = referenceIds.map(id => allAssets.find(asset => asset.id === id)).filter((asset): asset is DesignAsset => Boolean(asset));
  const query = search.trim().toLocaleLowerCase();
  const matches = allAssets.filter(asset => !query || [asset.id, asset.title, asset.project, asset.requestNo || "", asset.type].some(value => value.toLocaleLowerCase().includes(query))).slice(0, 6);
  const current = slides.find(slide => slide.id === currentId) || slides[0];
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
      <div className="course-notice"><FileText size={18}/><span>현재는 제작 준비 화면입니다. 파일은 이 브라우저에서만 선택되며, AI의 파일·레퍼런스 분석과 교안 자동 생성은 아직 연결되지 않았어요.</span></div>
      <div className="course-steps" aria-label="사용 순서"><span><b>01</b> 교안 선택</span><ArrowRight size={16}/><span><b>02</b> 레퍼런스 선택</span><ArrowRight size={16}/><span><b>03</b> 제작 방향 입력</span></div>
      <div className="course-workspace">
        <section className="course-editor" aria-label="교안 편집">
          <div className="brief-section"><span className="course-overline">01 · 원본 자료</span><h2>기획 교안</h2><p>기획자가 작성한 교안을 선택해 주세요.</p>
            <label className="source-upload"><Upload size={18}/><span>{sourceFile ? "파일 다시 선택" : "교안 파일 선택"}</span><input type="file" accept=".ppt,.pptx,.pdf,.doc,.docx,.txt" onChange={event => { const file = event.target.files?.[0]; event.target.value = ""; if (!file) return; if (file.size > 20 * 1024 * 1024) { setSourceError("20MB 이하의 파일을 선택해 주세요."); setSourceFile(null); return; } setSourceError(""); setSourceFile(file); }} /></label>
            {sourceFile && <div className="source-file"><FileText size={16}/><span>{sourceFile.name}</span><button type="button" onClick={() => setSourceFile(null)} aria-label="선택 파일 제거"><X size={16}/></button></div>}
            <p className="brief-hint">PPT·PDF·Word·텍스트 파일 선택 가능 · 최대 20MB<br/>선택한 파일은 서버에 전송되거나 분석되지 않습니다.</p><p role="status" className="course-error">{sourceError}</p>
          </div>
          <div className="brief-section"><span className="course-overline">02 · 참고 디자인</span><h2>아카이브에서 가져오기</h2><p>마음에 드는 디자인을 1~3개 선택해 주세요. <strong>{referenceIds.length} / 3개 선택</strong></p>
            <label className="reference-search"><Search size={17}/><span className="sr-only">레퍼런스 검색</span><input value={search} onChange={event => setSearch(event.target.value)} placeholder="작업명 · 요청번호 · 자산 ID" /></label>
            {selectedReferences.length > 0 && <div className="selected-reference-list" aria-label="선택한 레퍼런스">{selectedReferences.map(asset => <div className="selected-reference" key={asset.id}><div className="reference-image"><DesignThumbnail asset={asset}/></div><div><strong>{asset.title}</strong><small>{asset.id} · {asset.type}{asset.device ? ` ${asset.device}` : ""} · {asset.version}</small></div><button type="button" aria-label={`${asset.title} 선택 해제`} onClick={() => setReferenceIds(ids => ids.filter(id => id !== asset.id))}><X size={16}/></button></div>)}</div>}
            <div className="reference-results">{matches.map(asset => { const selected = referenceIds.includes(asset.id); return <button type="button" className={`reference-choice ${selected ? "is-selected" : ""}`} key={asset.id} aria-pressed={selected} disabled={!selected && referenceIds.length >= 3} onClick={() => setReferenceIds(ids => toggleReference(ids, asset.id))}><div className="reference-image"><DesignThumbnail asset={asset}/></div><span><strong>{asset.title}</strong><small>{asset.id} · {asset.type}{asset.device ? ` ${asset.device}` : ""}</small><small>{selected ? "선택됨" : "선택하기"}</small></span></button>})}{matches.length === 0 && <p>일치하는 작업이 없어요. 다른 검색어를 입력해 주세요.</p>}</div>
            {referenceIds.length === 3 && <p className="brief-hint" role="status">최대 3개까지 선택할 수 있어요. 다른 작업을 선택하려면 기존 선택을 해제해 주세요.</p>}
            <p className="brief-hint">원본 이미지가 없는 작업은 샘플 그래픽으로 표시됩니다. 현재 ID는 임시 식별자이며, 요청번호는 여러 작업에 공통으로 쓰일 수 있어요.</p>
          </div>
          <div className="brief-section"><span className="course-overline">03 · 제작 방향</span><h2>어떻게 꾸밀까요?</h2><p>참고할 요소와 적용하지 않을 요소를 짧고 구체적으로 적어 주세요.</p>
            <label className="course-field">반영할 점<textarea rows={4} value={instructions} onChange={event => setInstructions(event.target.value)} placeholder="예: 레퍼런스의 컬러 구성을 참고하고, 제목은 더 굵고 크게 만들어 주세요." maxLength={1000}/></label>
            <label className="course-field">제외할 점 <span className="optional-label">선택</span><textarea rows={3} value={exclusions} onChange={event => setExclusions(event.target.value)} placeholder="예: 파란색, 장식 아이콘, 지나치게 긴 문장은 제외해 주세요." maxLength={1000}/></label>
            <div className="prompt-example"><strong>이렇게 적으면 좋아요</strong><p>“레퍼런스의 차분한 컬러와 여백을 참고해 주세요. 제목은 더 굵게 하고, 파란색과 장식 아이콘은 제외해 주세요.”</p></div>
            <button type="button" className="btn btn-primary course-pending" disabled>AI 교안 만들기 · 연결 준비 중</button><p className="brief-hint">입력한 요청은 아직 AI로 전송되지 않으며 미리보기에 적용되지 않습니다.</p>
          </div>
        </section>
        <section className="course-preview-panel" aria-label="교안 미리보기">
          <div className="course-panel-heading"><div><span className="course-overline">{manualStarted ? "기본 템플릿 · 직접 편집" : "디자인 결과"}</span><h2>미리보기</h2></div><span className="course-preview-label">16:9</span></div>
          {!manualStarted ? <div className="course-preview-empty"><FileText size={28}/><strong>만들어진 교안을 이곳에서 확인해요</strong><p>AI 교안 생성은 준비 중이에요.<br/>기본 템플릿으로 직접 편집을 체험할 수 있습니다.</p><button type="button" className="btn" onClick={() => setManualStarted(true)}>기본 템플릿 열기</button></div> : <>
          <div className="course-slide-list" aria-label="교안 페이지">
            {slides.map((slide, index) => <button key={slide.id} type="button" className={slide.id === current.id ? "active" : ""} aria-pressed={slide.id === current.id} onClick={() => setCurrentId(slide.id)}>{index + 1}페이지</button>)}
            <button type="button" onClick={addSlide} aria-label="페이지 추가"><Plus size={15}/> 추가</button>
          </div>
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
      <div className="course-future"><strong>앞으로의 제작 도구</strong><span>교안 템플릿과 디자인 소스를 활용하는 기능을 시작으로, 이미지 제작까지 확장할 수 있도록 준비하고 있어요.</span></div>
    </main>
  );
}
