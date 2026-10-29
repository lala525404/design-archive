import React, { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sliders,
  Layers,
  Crop,
  Menu,
} from "lucide-react";
import { PageTitle, Disclosure } from "../components/Chrome";
import { DesignAsset } from "../types";
import { DesignThumbnail } from "../components/DesignThumbnail";

interface PromptStudioViewProps {
  initialAsset?: DesignAsset;
  allAssets: DesignAsset[];
  onBack: () => void;
  onOpenMenu: () => void;
}

export const PromptStudioView: React.FC<PromptStudioViewProps> = ({
  initialAsset,
  allAssets,
  onBack,
  onOpenMenu,
}) => {
  const currentAsset = initialAsset || allAssets[0];
  const [selectedAssetId, setSelectedAssetId] = useState(currentAsset.id);
  const activeAsset =
    allAssets.find((a) => a.id === selectedAssetId) || currentAsset;

  // Zoom & Pan state
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isSelectingArea, setIsSelectingArea] = useState(false);
  const [cropBox, setCropBox] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>({
    x: 15,
    y: 20,
    w: 70,
    h: 55,
  });

  // Prompt Customization Parameters
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [layoutStyle, setLayoutStyle] = useState("여백 중심 편집형");
  const [mood, setMood] = useState("정제된 미니멀");
  const [typographyFeel, setTypographyFeel] = useState(
    "산돌 네오고딕 스타일의 정갈한 한글 타이포그래피",
  );
  const [primaryColor, setPrimaryColor] = useState(
    "따뜻한 아이보리와 코발트 블루 포인트",
  );
  const [includeElements, setIncludeElements] = useState<string[]>([
    "강의 커리큘럼 인덱스",
    "기하학 도형 컬러칩",
    "단정한 여백 그리드",
  ]);
  const [excludeElements, setExcludeElements] = useState<string[]>([
    "특정 타사 브랜드 로고",
    "과도한 네온 그라데이션",
    "화려한 3D 캐릭터",
  ]);
  const [newIncludeTag, setNewIncludeTag] = useState("");
  const [copyError, setCopyError] = useState("");
  const [newExcludeTag, setNewExcludeTag] = useState("");
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Dynamic Prompt Generator
  const generatePromptDraft = () => {
    const areaDescription = cropBox
      ? `선택 영역(왼쪽 ${Math.round(cropBox.x)}%, 위쪽 ${Math.round(cropBox.y)}%, 가로 ${Math.round(cropBox.w)}%, 세로 ${Math.round(cropBox.h)}%)을 모티브로 삼아, `
      : "";

    return `[고품질 그래픽 디자인 프롬프트]
주제: ${activeAsset.course} ${activeAsset.type} 디자인을 위한 현대적인 비주얼 템플릿
레이아웃: ${layoutStyle}, 화면 비율 ${aspectRatio}. ${areaDescription}단어 단위의 정갈한 한글 배치와 넉넉한 네거티브 스페이스(여백) 확보.
타이포그래피: ${typographyFeel}, 메인 카피 800 굵기와 본문 400 굵기의 단단한 위계 구조.
컬러 팔레트: ${primaryColor}, 라이트 그레이 1px 헤어라인 테두리.
분위기: ${mood}, 과도한 광택과 그림자를 배제한 평면적 편집 디자인 감성.
포함 요소: ${includeElements.join(", ")}.
제외 요소: ${excludeElements.join(", ")}. (사내 승인된 라이선스 규정을 준수하며 임의 브랜드 복제 금지)`;
  };

  const [promptText, setPromptText] = useState(generatePromptDraft());

  const handleRegenerate = () => {
    setPromptText(generatePromptDraft());
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(promptText);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    } catch {
      setCopyError("복사하지 못했어요. 아래 문구를 선택해 직접 복사해주세요.");
    }
  };
  useEffect(() => {
    setPromptText(generatePromptDraft());
  }, [
    selectedAssetId,
    aspectRatio,
    layoutStyle,
    mood,
    typographyFeel,
    primaryColor,
    includeElements,
    excludeElements,
    cropBox,
  ]);

  const handleResetCrop = () => {
    setCropBox(null);
    setZoomLevel(1);
  };

  const point = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)),
      y: Math.max(0, Math.min(100, ((e.clientY - r.top) / r.height) * 100)),
    };
  };
  const tags = (
    label: string,
    items: string[],
    set: (a: string[]) => void,
    value: string,
    setValue: (a: string) => void,
  ) => (
    <div className="field-stack">
      <span className="field-label">{label}</span>
      <div className="tag-list editable">
        {items.map((t, i) => (
          <span key={i}>
            {t}
            <button
              aria-label={`${t} 삭제`}
              onClick={() => set(items.filter((_, idx) => idx !== i))}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="inline-input">
        <input
          aria-label={label + " 추가"}
          placeholder="요소 추가"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button
          className="btn"
          onClick={() => {
            if (value.trim()) set([...new Set([...items, value.trim()])]);
            setValue("");
          }}
        >
          추가
        </button>
      </div>
    </div>
  );
  return (
    <main className="page-shell prompt-page">
      <PageTitle title="프롬프트 만들기" onBack={onBack} />
      <div className="studio-layout">
        <section>
          <label className="field reference-select">
            참고할 작업
            <select
              value={selectedAssetId}
              onChange={(e) => setSelectedAssetId(e.target.value)}
            >
              {allAssets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title}
                </option>
              ))}
            </select>
          </label>
          <div className="canvas-toolbar">
            <div>
              <button
                className="icon-btn"
                onClick={() => setZoomLevel(Math.max(0.7, zoomLevel - 0.15))}
                aria-label="축소"
              >
                <ZoomOut size={17} />
              </button>
              <button
                className="text-button"
                onClick={() => setZoomLevel(1)}
                aria-label="원래 크기로"
              >
                {Math.round(zoomLevel * 100)}%
              </button>
              <button
                className="icon-btn"
                onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.15))}
                aria-label="확대"
              >
                <ZoomIn size={17} />
              </button>
            </div>
            <div>
              <button
                className={`btn ${isSelectingArea ? "selected" : ""}`}
                onClick={() => setIsSelectingArea(!isSelectingArea)}
                aria-pressed={isSelectingArea}
              >
                <Crop size={16} />
                {isSelectingArea ? "영역 그리기" : "영역 선택"}
              </button>
              <button
                className="icon-btn"
                onClick={() => {
                  handleResetCrop();
                  setIsSelectingArea(false);
                }}
                aria-label="영역 초기화"
              >
                <RotateCcw size={16} />
              </button>
            </div>
          </div>
          <div
            className={`studio-canvas ${isSelectingArea ? "selecting" : ""}`}
          >
            <div
              className="canvas-art"
              style={{ transform: `scale(${zoomLevel})` }}
              onPointerDown={(e) => {
                if (!isSelectingArea) return;
                e.currentTarget.setPointerCapture(e.pointerId);
                dragStart.current = point(e);
                setCropBox({
                  x: dragStart.current.x,
                  y: dragStart.current.y,
                  w: 0,
                  h: 0,
                });
              }}
              onPointerMove={(e) => {
                if (!dragStart.current) return;
                const p = point(e),
                  s = dragStart.current;
                setCropBox({
                  x: Math.min(s.x, p.x),
                  y: Math.min(s.y, p.y),
                  w: Math.abs(s.x - p.x),
                  h: Math.abs(s.y - p.y),
                });
              }}
              onPointerUp={() => {
                dragStart.current = null;
                setIsSelectingArea(false);
              }}
              onPointerCancel={() => {
                dragStart.current = null;
                setIsSelectingArea(false);
              }}
            >
              <DesignThumbnail asset={activeAsset} />
              {cropBox && (
                <div
                  className="crop-selection"
                  style={{
                    left: cropBox.x + "%",
                    top: cropBox.y + "%",
                    width: cropBox.w + "%",
                    height: cropBox.h + "%",
                  }}
                />
              )}
            </div>
          </div>
          <div className="preview-foot">
            <span>
              {isSelectingArea
                ? "드래그해서 영역을 지정하세요"
                : cropBox
                  ? `선택 영역 ${Math.round(cropBox.w)} × ${Math.round(cropBox.h)}%`
                  : "전체 레이아웃 참조"}
            </span>
            <button className="text-button" onClick={handleResetCrop}>
              초기화
            </button>
          </div>
        </section>
        <section className="studio-settings">
          <div className="field-stack">
            <span className="field-label">이미지 비율</span>
            <div className="ratio-row">
              {["1:1", "16:9", "9:16", "4:3", "3:4"].map((v) => (
                <button
                  className={`btn ${aspectRatio === v ? "selected" : ""}`}
                  key={v}
                  onClick={() => setAspectRatio(v)}
                  aria-pressed={aspectRatio === v}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div className="form-grid">
            <label className="field">
              레이아웃
              <select
                value={layoutStyle}
                onChange={(e) => setLayoutStyle(e.target.value)}
              >
                {[
                  "여백 중심 편집형",
                  "카드 그리드형",
                  "분할 히어로형",
                  "타이포그래피 강조형",
                ].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <label className="field">
              분위기
              <select value={mood} onChange={(e) => setMood(e.target.value)}>
                {[
                  "정제된 미니멀",
                  "차분한 교육형",
                  "선명한 프로모션",
                  "볼드 그래픽",
                ].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
          </div>
          <Disclosure title="서체 · 컬러 · 포함 요소">
            <label className="field">
              서체
              <select
                value={typographyFeel}
                onChange={(e) => setTypographyFeel(e.target.value)}
              >
                <option value="산돌 네오고딕 스타일의 정갈한 한글 타이포그래피">
                  산돌 네오고딕
                </option>
                <option value="산돌 명조 Neo 스타일의 우아한 세리프 타이포그래피">
                  산돌 명조
                </option>
                <option value="Pretendard 기반의 현대적 단정한 산세리프">
                  Pretendard
                </option>
              </select>
            </label>
            <label className="field">
              컬러
              <select
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
              >
                {[
                  "따뜻한 아이보리와 코발트 블루 포인트",
                  "민트와 소프트 옐로 조합",
                  "소프트 코랄과 다크 그레이 대비",
                  "모노크롬 블랙 & 화이트",
                ].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            {tags(
              "포함할 요소",
              includeElements,
              setIncludeElements,
              newIncludeTag,
              setNewIncludeTag,
            )}
            {tags(
              "제외할 요소",
              excludeElements,
              setExcludeElements,
              newExcludeTag,
              setNewExcludeTag,
            )}
          </Disclosure>
          <div className="prompt-output">
            <div className="section-heading">
              <h2>프롬프트 초안</h2>
              <button className="text-button" onClick={handleRegenerate}>
                <RotateCcw size={14} />
                다시 만들기
              </button>
            </div>
            <textarea
              aria-label="프롬프트 초안 편집"
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
            />
            <button className="btn btn-primary" onClick={handleCopyPrompt}>
              {copiedPrompt ? <Check size={17} /> : <Copy size={17} />}{" "}
              {copiedPrompt ? "복사 완료" : "프롬프트 복사"}
            </button>
            <p role="status" className="inline-feedback">
              {copyError}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};
