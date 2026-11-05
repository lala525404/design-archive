import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Circle, Download, FlipHorizontal2, ImagePlus, Square, Trash2, Type } from "lucide-react";
import { PageTitle } from "../components/Chrome";
import { DesignThumbnail } from "../components/DesignThumbnail";
import { DesignAsset } from "../types";
import { clampNumber, DesignObject, renderDesignSvg, resizeDesign } from "../lib/designEditor";

type Props = { allAssets: DesignAsset[]; onBack: () => void; requestedReferenceId?: string; openDesignRequest?: number; initialStage?: "brief" | "edit" };
const INITIAL: DesignObject[] = [
  { id: "shape-1", kind: "rect", x: 600, y: 337, width: 1100, height: 575, rotation: 0, flipped: false, color: "#ffffff" },
  { id: "shape-2", kind: "circle", x: 925, y: 200, width: 200, height: 200, rotation: 0, flipped: false, color: "#A9D3FF" },
  { id: "text-1", kind: "text", x: 475, y: 265, width: 640, height: 170, rotation: 0, flipped: false, color: "#191919", text: "새로운 배움의 시작", fontSize: 60, fontWeight: 800 },
  { id: "text-2", kind: "text", x: 475, y: 405, width: 580, height: 80, rotation: 0, flipped: false, color: "#555555", text: "내용을 선택해 자유롭게 수정해 보세요", fontSize: 28, fontWeight: 400 },
];
const SAMPLE: DesignObject[] = [
  { id: "sample-band", kind: "rect", x: 600, y: 556, width: 1200, height: 238, rotation: 0, flipped: false, color: "#ffffff" },
  { id: "sample-circle", kind: "circle", x: 1005, y: 155, width: 180, height: 180, rotation: 0, flipped: false, color: "#FFE59A" },
  { id: "sample-title", kind: "text", x: 435, y: 220, width: 720, height: 130, rotation: 0, flipped: false, color: "#ffffff", text: "새로운 배움의 시작", fontSize: 64, fontWeight: 800 },
  { id: "sample-body", kind: "text", x: 435, y: 330, width: 700, height: 80, rotation: 0, flipped: false, color: "#ffffff", text: "일상에 필요한 실무를 한 걸음씩", fontSize: 30, fontWeight: 400 },
  { id: "sample-caption", kind: "text", x: 395, y: 550, width: 620, height: 70, rotation: 0, flipped: false, color: "#191919", text: "나를 위한 새로운 학습을 만나보세요", fontSize: 26, fontWeight: 600 },
];
const SAMPLE_TEXT = SAMPLE.filter(object => object.kind === "text").map(object => ({ ...object, color: "#191919" }));
export const makeDesignSample = (width: number, height: number) => resizeDesign(SAMPLE.map(item => ({ ...item })), 1200, 675, width, height);
export const makeDesignSampleOriginal = (width: number, height: number) => resizeDesign(SAMPLE_TEXT.map(item => ({ ...item })), 1200, 675, width, height);
const objectName = (object: DesignObject) => object.kind === "text" ? (object.text || "텍스트").split("\n")[0].slice(0, 20) : object.kind === "rect" ? "사각형" : object.kind === "circle" ? "원형" : "업로드 이미지";

export function DesignMakerView({ allAssets, onBack, requestedReferenceId, openDesignRequest = 0, initialStage = "brief" }: Props) {
  const [width, setWidth] = useState(1200);
  const [height, setHeight] = useState(675);
  const [draftWidth, setDraftWidth] = useState("1200");
  const [draftHeight, setDraftHeight] = useState("675");
  const [background, setBackground] = useState("#F7F3EF");
  const [objects, setObjects] = useState<DesignObject[]>(INITIAL.map(item => ({ ...item })));
  const [selectedId, setSelectedId] = useState<string | null>("text-1");
  const [referenceId, setReferenceId] = useState("");
  const [referenceSearch, setReferenceSearch] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [stage, setStage] = useState<"brief" | "edit">(initialStage);
  const [sampleMode, setSampleMode] = useState(false);
  const [comparison, setComparison] = useState<"before" | "after">("after");
  const [positive, setPositive] = useState("");
  const [negative, setNegative] = useState("");
  const priorDraft = useRef<{ objects: DesignObject[]; background: string; referenceId: string; referenceSearch: string; positive: string; negative: string; selectedId: string | null; width: number; height: number; draftWidth: string; draftHeight: string } | null>(null);
  const nextId = useRef(3);
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null);
  const selected = objects.find(object => object.id === selectedId);
  useEffect(() => { if (openDesignRequest && requestedReferenceId) setReferenceId(requestedReferenceId); }, [openDesignRequest, requestedReferenceId]);
  const reference = allAssets.find(asset => asset.id === referenceId);
  const search = referenceSearch.trim().toLowerCase();
  const filtered = allAssets.filter(asset => !search || [asset.id, asset.title, asset.project, asset.requestNo || ""].some(v => v.toLowerCase().includes(search))).slice(0, 30);
  const loadSample = () => {
    if ((sampleMode || positive || negative || referenceId || objects.some((object, index) => JSON.stringify(object) !== JSON.stringify(INITIAL[index])) || objects.length !== INITIAL.length) && !window.confirm("현재 작업이 샘플로 바뀝니다. 계속할까요?")) return;
    if (!sampleMode) priorDraft.current = { objects: objects.map(object => ({ ...object })), background, referenceId, referenceSearch, positive, negative, selectedId, width, height, draftWidth, draftHeight };
    setObjects(makeDesignSample(width, height));
    setBackground("#6E9BF7");
    setReferenceId(allAssets.find(asset => asset.id === "asset-1")?.id || "");
    setReferenceSearch("");
    setPositive("레퍼런스의 파란 배경과 굵은 흰색 제목을 참고하고, 노란 원형 포인트를 넣어 주세요.");
    setNegative("사진과 복잡한 장식, 강한 그라데이션은 제외해 주세요.");
    setSelectedId(null); setSampleMode(true); setComparison("after"); setStage("brief"); setMessage("");
  };
  const exitSample = () => {
    if (!window.confirm("샘플에서 수정한 내용은 사라지고, 샘플을 열기 전 작업으로 돌아갑니다. 계속할까요?")) return;
    const previous = priorDraft.current;
    if (previous) {
      setObjects(previous.objects); setBackground(previous.background); setReferenceId(previous.referenceId); setReferenceSearch(previous.referenceSearch); setPositive(previous.positive); setNegative(previous.negative); setSelectedId(previous.selectedId);
      setWidth(previous.width); setHeight(previous.height); setDraftWidth(previous.draftWidth); setDraftHeight(previous.draftHeight);
    }
    priorDraft.current = null; setSampleMode(false); setComparison("after"); setStage("brief"); setMessage("");
  };
  const beforeObjects = makeDesignSampleOriginal(width, height);
  const change = (patch: Partial<DesignObject>) => setObjects(current => current.map(object => object.id === selectedId ? { ...object, ...patch } : object));
  const shiftLayer = (direction: -1 | 1) => setObjects(current => {
    const index = current.findIndex(object => object.id === selectedId);
    const next = index + direction;
    if (index < 0 || next < 0 || next >= current.length) return current;
    const updated = [...current];
    [updated[index], updated[next]] = [updated[next], updated[index]];
    return updated;
  });
  const applyReferenceColors = () => {
    if (!reference) return;
    const isHex = (value: string) => /^#[0-9a-f]{6}$/i.test(value);
    const bg = isHex(reference.bgColor) ? reference.bgColor : "";
    const accent = isHex(reference.accentColor) ? reference.accentColor : "";
    const circle = objects.find(object => object.kind === "circle");
    if (bg) setBackground(bg);
    if (accent && circle) setObjects(current => current.map(object => object.id === circle.id ? { ...object, color: accent } : object));
    setMessage(bg || (accent && circle) ? "등록된 색상 정보를 적용했어요." : "적용할 수 있는 등록 색상이 없어요.");
  };
  const applySize = () => {
    const w = Number(draftWidth), h = Number(draftHeight);
    if (!Number.isInteger(w) || !Number.isInteger(h) || w < 100 || h < 100 || w > 4096 || h > 4096) { setMessage("가로와 세로에 100~4096 사이의 정수를 입력해 주세요."); return; }
    setObjects(current => resizeDesign(current, width, height, w, h));
    setWidth(w); setHeight(h); setMessage("크기를 적용했어요. 요소 위치와 크기는 새 화면 비율에 맞춰 조정됩니다.");
  };
  const add = (kind: DesignObject["kind"], imageData?: string) => {
    const id = `added-${nextId.current++}`;
    const w = width * (kind === "text" ? 0.55 : 0.22), h = height * (kind === "text" ? 0.16 : 0.3);
    setObjects(current => [...current, { id, kind, x: width / 2, y: height / 2, width: w, height: h, rotation: 0, flipped: false, color: kind === "text" ? "#191919" : "#A9D3FF", ...(kind === "text" ? { text: "텍스트를 입력하세요", fontSize: Math.min(width, height) * 0.07, fontWeight: 700 } : {}), ...(imageData ? { imageData } : {}) }]);
    setSelectedId(id);
  };
  const imageUpload = (file?: File, replaceId?: string) => {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) { setMessage("PNG·JPG·WEBP 이미지를 5MB 이하로 선택해 주세요."); return; }
    setIsLoadingImage(true);
    const reader = new FileReader();
    reader.onload = () => { if (typeof reader.result === "string") { const imageData = reader.result; if (replaceId) { setObjects(current => current.map(object => object.id === replaceId && object.kind === "image" ? { ...object, imageData } : object)); setMessage("이미지를 교체했어요."); } else { add("image", imageData); setMessage("이미지를 추가했어요."); } } setIsLoadingImage(false); };
    reader.onerror = () => { setMessage("이미지를 읽지 못했어요."); setIsLoadingImage(false); };
    reader.readAsDataURL(file);
  };
  const point = (event: React.PointerEvent<SVGSVGElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return { x: (event.clientX - bounds.left) * width / bounds.width, y: (event.clientY - bounds.top) * height / bounds.height };
  };
  const exportPng = () => {
    setMessage(""); setBusy(true);
    const svg = renderDesignSvg(width, height, background, objects);
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
    const image = new Image();
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("canvas unavailable");
        context.drawImage(image, 0, 0);
        canvas.toBlob(blob => {
          URL.revokeObjectURL(url);
          if (!blob) { setMessage("이미지를 저장하지 못했어요."); setBusy(false); return; }
          const link = document.createElement("a"); const download = URL.createObjectURL(blob);
          link.href = download; link.download = "디자인-시안.png"; link.click(); window.setTimeout(() => URL.revokeObjectURL(download), 1000); setBusy(false); setMessage("PNG로 저장했어요.");
        }, "image/png");
      } catch { URL.revokeObjectURL(url); setBusy(false); setMessage("이미지를 저장하지 못했어요."); }
    };
    image.onerror = () => { URL.revokeObjectURL(url); setBusy(false); setMessage("미리보기를 이미지로 변환하지 못했어요."); };
    image.src = url;
  };
  const numeric = (label: string, value: number, field: keyof DesignObject, min: number, max: number) =>
    <label className="maker-number">{label}<input type="number" value={Math.round(value)} min={min} max={max} onChange={event => { const n = event.target.valueAsNumber; if (Number.isFinite(n)) change({ [field]: clampNumber(n, min, max) }); }}/></label>;
  return <main className="page-shell design-maker">
    <PageTitle title={stage === "brief" ? "2차 디자인 만들기" : "디자인 상세 수정"} subtitle={stage === "brief" ? "레퍼런스와 요청을 정하고 디자인 방향을 살펴보세요." : "요소를 선택해 위치와 색상, 텍스트를 수정해 보세요."} onBack={stage === "brief" ? (sampleMode ? exitSample : onBack) : () => setStage("brief")}/>
    {stage === "brief" ? <>
      <div className="maker-banner maker-intro"><span>AI 디자인 생성은 아직 연결되지 않았어요. 미리 제작한 샘플로 사용 흐름을 확인해 보세요.</span>{sampleMode ? <button type="button" className="sample-start" onClick={exitSample}>샘플 종료</button> : <button type="button" className="sample-start" onClick={loadSample}>샘플로 사용해 보기</button>}</div>
      <div className={`maker-brief-grid ${width / height >= 2 ? "is-wide" : ""}`}>
        <aside className="maker-panel maker-brief-settings">
          <h2>디자인 요청</h2>
          <label className="maker-label">작업 크기 <span>픽셀</span></label>
          <div className="maker-size"><label>가로<input type="number" value={draftWidth} min="100" max="4096" onChange={event => setDraftWidth(event.target.value)} /></label><span>×</span><label>세로<input type="number" value={draftHeight} min="100" max="4096" onChange={event => setDraftHeight(event.target.value)} /></label></div>
          <button type="button" className="maker-outline maker-full" onClick={applySize}>크기 적용</button>
          <div className="maker-divider"/>
          <label className="maker-label" htmlFor="maker-brief-search">아카이브 레퍼런스</label>
          <input id="maker-brief-search" className="maker-input" value={referenceSearch} onChange={event => setReferenceSearch(event.target.value)} placeholder="작업명 · 요청번호 · ID 검색"/>
          <select className="maker-input" aria-label="레퍼런스 선택" value={referenceId} onChange={event => setReferenceId(event.target.value)}><option value="">참고할 작업 선택</option>{filtered.map(asset => <option key={asset.id} value={asset.id}>{asset.title} · {asset.id}</option>)}{reference && !filtered.some(asset => asset.id === reference.id) && <option value={reference.id}>{reference.title} · {reference.id}</option>}</select>
          {reference && <div className="maker-reference"><div><DesignThumbnail asset={reference}/></div><span><strong>{reference.title}</strong><small>{reference.id} · {reference.type}</small></span></div>}
          <label className="maker-label" htmlFor="maker-positive">반영할 점 <span>포지티브</span></label>
          <textarea id="maker-positive" className="maker-input" rows={3} value={positive} onChange={event => setPositive(event.target.value)} placeholder="예: 레퍼런스의 색상과 여백을 참고해 주세요."/>
          <label className="maker-label" htmlFor="maker-negative">제외할 점 <span>네거티브</span></label>
          <textarea id="maker-negative" className="maker-input" rows={3} value={negative} onChange={event => setNegative(event.target.value)} placeholder="예: 사진과 복잡한 장식은 빼 주세요."/>
          <p className="maker-note">샘플은 미리 제작한 예시라 요청을 바꿔도 자동으로 다시 만들어지지 않아요.</p>
        </aside>
        <section className="maker-brief-preview" aria-label="디자인 전후 비교">
          <div className="maker-work-head"><div><strong>디자인 미리보기</strong><span>{width} × {height} px</span></div></div>
          {sampleMode ? <>
            <div className="maker-compare" aria-label="샘플 전후 선택"><button type="button" className={comparison === "before" ? "active" : ""} aria-pressed={comparison === "before"} onClick={() => setComparison("before")}>전 · 텍스트 초안</button><button type="button" className={comparison === "after" ? "active" : ""} aria-pressed={comparison === "after"} onClick={() => setComparison("after")}>후 · 디자인 적용 예시</button></div>
            <div className="maker-brief-canvas"><div className="maker-brief-art" role="img" aria-label={comparison === "before" ? "텍스트만 배치된 샘플 초안" : "레퍼런스 스타일을 반영해 미리 제작한 샘플 디자인"} dangerouslySetInnerHTML={{__html: renderDesignSvg(width, height, comparison === "before" ? "#ffffff" : background, comparison === "before" ? beforeObjects : objects)}}/></div>
            <div className="maker-brief-footer"><p>샘플 레퍼런스 ‘색채학 과정’의 파란 배경·흰색 제목·노란 원을 참고한 예시예요.</p><button type="button" className="btn btn-primary" onClick={() => { setComparison("after"); setStage("edit"); }}>샘플 확정 · 상세 수정</button></div>
          </> : <><div className="maker-brief-empty"><strong>디자인 결과를 여기에서 확인해요</strong><p>샘플 버튼을 눌러 텍스트 초안과 디자인 적용 예시를 비교해 보세요.</p></div><div className="maker-brief-footer"><p>직접 요소를 조합해 작업할 수도 있어요.</p><button type="button" className="btn" onClick={() => setStage("edit")}>직접 편집 시작</button></div></>}
          <p role="status" className="maker-feedback">{message}</p>
        </section>
      </div>
    </> : <>
    <div className="maker-back-row"><button type="button" className="maker-outline" onClick={() => setStage("brief")}>← 디자인 방향으로 돌아가기</button>{sampleMode && <button type="button" className="maker-outline" onClick={exitSample}>샘플 종료</button>}<span>이 화면을 오가도 현재 작업은 유지됩니다.</span></div>
    <div className="maker-banner">직접 편집하는 체험 화면입니다. 레퍼런스 자동 분석과 AI 디자인 생성은 아직 연결되지 않았어요.</div>
    <div className={`maker-layout ${width / height >= 2 ? "maker-wide" : ""}`}>
      <div className="maker-main-column">
      <aside className="maker-panel maker-left">
        <h2>작업 설정</h2>
        <label className="maker-label">작업 크기 <span>픽셀</span></label>
        <div className="maker-size"><label>가로<input type="number" value={draftWidth} min="100" max="4096" onChange={event => setDraftWidth(event.target.value)} /></label><span>×</span><label>세로<input type="number" value={draftHeight} min="100" max="4096" onChange={event => setDraftHeight(event.target.value)} /></label></div>
        <button type="button" className="maker-outline maker-full" onClick={applySize}>크기 적용</button>
        <div className="maker-divider"/>
        <label className="maker-label" htmlFor="maker-search">아카이브 레퍼런스</label>
        <input id="maker-search" className="maker-input" value={referenceSearch} onChange={event => setReferenceSearch(event.target.value)} placeholder="작업명 · 요청번호 · ID 검색"/>
        <select className="maker-input" aria-label="레퍼런스 선택" value={referenceId} onChange={event => setReferenceId(event.target.value)}><option value="">참고할 작업 선택</option>{filtered.map(asset => <option key={asset.id} value={asset.id}>{asset.title} · {asset.id}</option>)}{reference && !filtered.some(asset => asset.id === reference.id) && <option value={reference.id}>{reference.title} · {reference.id}</option>}</select>
        {reference && <><div className="maker-reference"><div><DesignThumbnail asset={reference}/></div><span><strong>{reference.title}</strong><small>{reference.id} · {reference.type}</small></span></div><button type="button" className="maker-outline maker-full" onClick={applyReferenceColors}>등록된 색상 적용</button></>}
        <p className="maker-note">등록된 배경색과 포인트색을 적용할 수 있어요. 이미지 분석이나 레이아웃 자동 반영은 연결 전입니다.</p>
        <div className="maker-divider"/>
        <h3>요소 추가</h3>
        <div className="maker-add"><button type="button" onClick={() => add("text")}><Type size={17}/>텍스트</button><button type="button" onClick={() => add("rect")}><Square size={17}/>사각형</button><button type="button" onClick={() => add("circle")}><Circle size={17}/>원형</button><label><ImagePlus size={17}/>이미지<input type="file" accept="image/png,image/jpeg,image/webp" disabled={isLoadingImage} onChange={event => { imageUpload(event.target.files?.[0]); event.target.value = ""; }}/></label></div>
        <p className="maker-note">이미지는 PNG·JPG·WEBP, 최대 5MB입니다.</p>
      </aside>
      <section className="maker-work" aria-label="디자인 캔버스">
        <div className="maker-work-head"><div><strong>작업 화면</strong><span>{width} × {height} px</span></div><button type="button" className="btn btn-primary" onClick={exportPng} disabled={busy || isLoadingImage}><Download size={16}/>{busy ? "저장 중" : "PNG 저장"}</button></div>
        <div className="maker-canvas-wrap"><svg ref={svgRef} className="maker-svg" role="img" aria-label="디자인 편집 캔버스. 요소를 선택하거나 끌어서 이동할 수 있습니다." width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ background }} onPointerDown={event => { if (event.target === event.currentTarget) setSelectedId(null); }} onPointerMove={event => { if (!drag.current) return; const p = point(event); const active = drag.current; setObjects(current => current.map(object => object.id === active.id ? { ...object, x: clampNumber(p.x - active.dx, 0, width), y: clampNumber(p.y - active.dy, 0, height) } : object)); }} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}>
          {objects.map(object => <g key={object.id} transform={`translate(${object.x} ${object.y}) rotate(${object.rotation}) scale(${object.flipped ? -1 : 1} 1)`} role="button" tabIndex={0} aria-label={`${objectName(object)} 선택`} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedId(object.id); } }} onPointerDown={event => { event.stopPropagation(); const svg = svgRef.current; if (!svg) return; const bounds = svg.getBoundingClientRect(); const x = (event.clientX - bounds.left) * width / bounds.width, y = (event.clientY - bounds.top) * height / bounds.height; drag.current = { id: object.id, dx: x - object.x, dy: y - object.y }; setSelectedId(object.id); svg.setPointerCapture(event.pointerId); }} style={{ cursor: "move" }}>
            {object.kind === "rect" && <rect x={-object.width / 2} y={-object.height / 2} width={object.width} height={object.height} rx={16} fill={object.color}/>}
            {object.kind === "circle" && <ellipse cx={0} cy={0} rx={object.width / 2} ry={object.height / 2} fill={object.color}/>}
            {object.kind === "image" && <image href={object.imageData} x={-object.width / 2} y={-object.height / 2} width={object.width} height={object.height} preserveAspectRatio="xMidYMid meet"/>}
            {object.kind === "text" && <><rect x={-object.width / 2} y={-object.height / 2} width={object.width} height={object.height} fill="transparent"/><text textAnchor="middle" dominantBaseline="middle" fontFamily="Pretendard, sans-serif" fontSize={object.fontSize} fontWeight={object.fontWeight} fill={object.color}>{(object.text || "").split("\n").map((line, index, lines) => <tspan key={index} x={0} y={-(lines.length - 1) * (object.fontSize || 32) * 0.6 + index * (object.fontSize || 32) * 1.2}>{line}</tspan>)}</text></>}
            {selectedId === object.id && <rect x={-object.width / 2} y={-object.height / 2} width={object.width} height={object.height} fill="none" stroke="#246BFD" strokeWidth={Math.max(2, width / 500)} strokeDasharray="8 5" pointerEvents="none"/>}
          </g>)}
        </svg></div>
        <p className="maker-work-hint">요소를 눌러 선택하고 드래그하세요. 이미지와 텍스트는 오른쪽에서 조정할 수 있어요.</p>
        <div className="maker-layer-list" aria-label="작업 요소">{objects.map(object => <button key={object.id} type="button" className={selectedId === object.id ? "active" : ""} onClick={() => setSelectedId(object.id)}>{objectName(object)}</button>)}</div>
        <p role="status" className="maker-feedback">{message}</p>
      </section>
      </div>
      <aside className="maker-panel maker-properties">
        <h2>요소 편집</h2>
        {!selected ? <p className="maker-note">수정할 요소를 선택해 주세요.</p> : <>
          <div className="maker-selected">{objectName(selected)} <span>{selected.kind === "image" ? "이미지" : selected.kind === "text" ? "텍스트" : "도형"}</span></div>
          {selected.kind === "text" && <><label className="maker-label" htmlFor="maker-text">텍스트</label><textarea id="maker-text" className="maker-input" rows={4} value={selected.text || ""} onChange={event => change({ text: event.target.value })}/><div className="maker-prop-grid">{numeric("글자 크기", selected.fontSize || 32, "fontSize", 8, 1000)}<label className="maker-number">굵기<select value={selected.fontWeight || 700} onChange={event => change({ fontWeight: Number(event.target.value) })}><option value={400}>보통</option><option value={600}>중간</option><option value={700}>굵게</option><option value={800}>아주 굵게</option></select></label></div></>}
          {selected.kind === "image" && <label className="maker-outline maker-replace"><ImagePlus size={16}/> 이미지 교체<input type="file" accept="image/png,image/jpeg,image/webp" disabled={isLoadingImage} onChange={event => { imageUpload(event.target.files?.[0], selected.id); event.target.value = ""; }}/></label>}
          {(selected.kind === "rect" || selected.kind === "circle") && <div className="maker-shape-switch"><span>도형 변경</span><button type="button" className={selected.kind === "rect" ? "active" : ""} onClick={() => change({kind:"rect"})}>사각형</button><button type="button" className={selected.kind === "circle" ? "active" : ""} onClick={() => change({kind:"circle"})}>원형</button></div>}
          {selected.kind !== "image" && <label className="maker-color">색상<input type="color" value={selected.color} onChange={event => change({ color: event.target.value })}/><span>{selected.color.toUpperCase()}</span></label>}
          <div className="maker-divider"/>
          <div className="maker-prop-grid">{numeric("가로 위치", selected.x, "x", 0, width)}{numeric("세로 위치", selected.y, "y", 0, height)}{selected.kind !== "text" && numeric("너비", selected.width, "width", 10, 8192)}{selected.kind !== "text" && numeric("높이", selected.height, "height", 10, 8192)}{numeric("회전", selected.rotation, "rotation", -360, 360)}</div>
          <div className="maker-actions"><button type="button" className="maker-outline" onClick={() => change({ flipped: !selected.flipped })} aria-pressed={selected.flipped}><FlipHorizontal2 size={16}/> 좌우 반전</button><button type="button" className="maker-outline" onClick={() => shiftLayer(1)} disabled={objects[objects.length - 1]?.id === selected.id}><ChevronUp size={16}/> 앞으로</button><button type="button" className="maker-outline" onClick={() => shiftLayer(-1)} disabled={objects[0]?.id === selected.id}><ChevronDown size={16}/> 뒤로</button><button type="button" className="maker-outline maker-delete" onClick={() => { if (!window.confirm("선택한 요소를 삭제할까요? 삭제한 내용은 되돌릴 수 없습니다.")) return; setObjects(current => current.filter(object => object.id !== selected.id)); setSelectedId(null); }}><Trash2 size={16}/> 삭제</button></div>
          <p className="maker-note">위치는 요소 중심을 기준으로 합니다.</p>
        </>}
        <div className="maker-divider"/><label className="maker-color">배경색<input type="color" value={background} onChange={event => setBackground(event.target.value)}/><span>{background.toUpperCase()}</span></label>
      </aside>
    </div>
    <p className="maker-bottom-note">작업은 현재 브라우저 화면에만 유지되며 새로고침하면 초기화됩니다. PNG는 편집이 불가능한 이미지로 저장됩니다.</p>
    </>}
  </main>;
}
