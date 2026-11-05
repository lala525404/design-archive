import React, { useState } from "react";
import { ArrowRight, FileText, Plus, Printer, Trash2 } from "lucide-react";
import { PageTitle } from "../components/Chrome";

type Slide = { id: number; title: string; body: string; layout: "basic" | "split" };
const makeSlide = (id: number): Slide => ({ id, title: "", body: "", layout: "basic" });
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] || c));

export function CourseStudioView({ onBack }: { onBack: () => void }) {
  const [slides, setSlides] = useState<Slide[]>([makeSlide(1)]);
  const [currentId, setCurrentId] = useState(1);
  const [printError, setPrintError] = useState("");
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
      <PageTitle title="교안 만들기" subtitle="강의 내용을 입력하고 템플릿에 배치해 교안 초안을 살펴보세요." onBack={onBack} />
      <div className="course-notice"><FileText size={18}/><span>직접 입력한 내용을 템플릿에 배치하는 첫 단계입니다. AI 분석·파일 업로드·PPT 다운로드는 아직 연결되지 않았어요.</span></div>
      <div className="course-steps" aria-label="사용 순서"><span><b>01</b> 내용 입력</span><ArrowRight size={16}/><span><b>02</b> 템플릿 선택</span><ArrowRight size={16}/><span><b>03</b> 미리보기·검수</span></div>
      <div className="course-workspace">
        <section className="course-editor" aria-label="교안 편집">
          <div className="course-panel-heading"><div><span className="course-overline">내용 편집</span><h2>교안 내용</h2></div><span className="course-page-count">{slides.findIndex(s => s.id === current.id) + 1} / {slides.length}</span></div>
          <div className="course-slide-list" aria-label="교안 페이지">
            {slides.map((slide, index) => <button key={slide.id} type="button" className={slide.id === current.id ? "active" : ""} aria-pressed={slide.id === current.id} onClick={() => setCurrentId(slide.id)}>{index + 1}페이지</button>)}
            <button type="button" onClick={addSlide} aria-label="페이지 추가"><Plus size={15}/> 추가</button>
          </div>
          <label className="course-field">페이지 제목<input value={current.title} onChange={event => update({ title: event.target.value })} placeholder="예: 고객 상담의 이해" maxLength={100}/></label>
          <label className="course-field">학습 내용<textarea value={current.body} onChange={event => update({ body: event.target.value })} placeholder={"교안에 넣을 내용을 입력해 주세요.\n줄을 바꿔 내용을 구분할 수 있어요."} rows={8} maxLength={1500}/></label>
          <p className="course-hint">원본 교안의 내용을 확인하며 입력하고, 출력 전 정확성을 검수해 주세요.</p>
          <div className="course-template-title">템플릿 선택</div>
          <div className="course-templates">
            <button type="button" className={current.layout === "basic" ? "active" : ""} aria-pressed={current.layout === "basic"} onClick={() => update({ layout: "basic" })}><span className="template-icon"><i/><i/><i/></span><strong>기본형</strong><small>제목과 내용을 간결하게</small></button>
            <button type="button" className={current.layout === "split" ? "active" : ""} aria-pressed={current.layout === "split"} onClick={() => update({ layout: "split" })}><span className="template-icon split"><i/><i/><i/></span><strong>분할형</strong><small>여백으로 구성을 나누어</small></button>
          </div>
          <button type="button" className="course-remove" onClick={removeSlide} disabled={slides.length === 1}><Trash2 size={15}/> 현재 페이지 삭제</button>
        </section>
        <section className="course-preview-panel" aria-label="교안 미리보기">
          <div className="course-panel-heading"><div><span className="course-overline">실시간 미리보기</span><h2>이렇게 보여요</h2></div><span className="course-preview-label">16:9</span></div>
          <div className={`course-preview ${current.layout}`}><div className="course-preview-inner"><span>학습 교안 · {String(slides.findIndex(s => s.id === current.id) + 1).padStart(2, "0")}</span><h3>{current.title || "페이지 제목을 입력해 주세요"}</h3><div className="course-preview-line"/><p>{current.body || "학습 내용을 입력하면 이곳에서 확인할 수 있어요."}</p></div></div>
          <div className="course-preview-bottom"><p>인쇄 화면에서 PDF로 저장할 수 있어요.<br/>입력 내용은 페이지를 벗어나거나 새로고침하면 사라집니다.</p><button type="button" className="btn btn-primary" onClick={print}><Printer size={16}/> 인쇄 · PDF 저장</button></div>
          <p role="status" className="course-error">{printError}</p>
        </section>
      </div>
      <div className="course-future"><strong>앞으로의 제작 도구</strong><span>교안 템플릿과 디자인 소스를 활용하는 기능을 시작으로, 이미지 제작까지 확장할 수 있도록 준비하고 있어요.</span></div>
    </main>
  );
}
