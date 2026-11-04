import React, { useEffect, useState } from "react";
import shots from "../data/guideShots.json";
import {
  ArrowRight,
  BookOpen,
  FolderOpen,
  History,
  Lightbulb,
  PenTool,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
  ZoomIn,
} from "lucide-react";
import { Status } from "../components/Chrome";

export type GuideRole = "uploader" | "planner" | "admin";
type Go = "upload" | "search" | "browse" | "journal" | "naming" | "license";

interface Props {
  role: GuideRole;
  onRole: (r: GuideRole) => void;
  onGo: (v: Go) => void;
  onSearch: (q: string) => void;
}

const ROLES: { id: GuideRole; name: string; who: string; desc: string; icon: React.ReactNode }[] = [
  {
    id: "uploader",
    name: "업로더",
    who: "디자이너",
    desc: "작업물을 올리고, 고치고, 버전을 쌓아요",
    icon: <PenTool size={22} />,
  },
  {
    id: "planner",
    name: "기획자",
    who: "마케팅·운영 담당",
    desc: "지난 작업과 트렌드에서 레퍼런스를 찾아요",
    icon: <Lightbulb size={22} />,
  },
  {
    id: "admin",
    name: "관리자",
    who: "개발자·라이선스 담당",
    desc: "버전 기록과 라이선스 상태를 관리해요",
    icon: <ShieldCheck size={22} />,
  },
];

/** 사용자별 첫 사용 가이드 (한 페이지, 세 갈래) */
export function GuideView({ role, onRole, onGo, onSearch }: Props) {
  return (
    <main className="page-shell guide-page">
      <header className="guide-head">
        <p className="jr-eyebrow">처음이신가요?</p>
        <h1>하는 일에 맞춰 사용법을 골라 보세요</h1>
        <p>세 가지 역할로 나눠 꼭 필요한 것만 정리했어요. 다른 역할 가이드도 언제든 볼 수 있어요.</p>
      </header>

      <div className="guide-roles" role="tablist" aria-label="역할 선택">
        {ROLES.map((r) => (
          <button
            key={r.id}
            role="tab"
            aria-selected={role === r.id}
            className={`guide-role ${role === r.id ? "on" : ""}`}
            onClick={() => onRole(r.id)}
          >
            <span className="guide-role-icon">{r.icon}</span>
            <span className="guide-role-text">
              <b>
                {r.name} <small>{r.who}</small>
              </b>
              <span>{r.desc}</span>
            </span>
          </button>
        ))}
      </div>

      <RoleGuide key={role} role={role} onGo={onGo} onSearch={onSearch} />
    </main>
  );
}

/** 네이밍 예시: 부분마다 색을 나눠 보여준다 */
function NameParts({ parts }: { parts: [string, string][] }) {
  return (
    <div className="guide-name">
      <code>
        {parts.map(([v], i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="sep">_</span>}
            <span className={`p p${i}`}>{v}</span>
          </React.Fragment>
        ))}
      </code>
      <div className="guide-name-legend">
        {parts.map(([v, label], i) => (
          <span key={i}>
            <i className={`p${i}`} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}


type Shot = { w: number; h: number; pins: { x: number; y: number }[] };
const SHOTS = shots as Record<string, Shot>;

interface StepDef {
  title: string;
  sub: string;
  shot: string;
  pins: string[];
  extra?: React.ReactNode;
  action?: { label: string; go?: Go; search?: string };
}

/** 캡처 화면 + 번호 표시 + 번호별 설명 */
function ShotStep({
  no,
  step,
  onGo,
  onSearch,
  onZoom,
}: {
  no: number;
  step: StepDef;
  onGo: (v: Go) => void;
  onSearch: (q: string) => void;
  onZoom: (shot: string) => void;
}) {
  const [active, setActive] = useState<number | null>(null);
  const shot = SHOTS[step.shot];
  const tall = shot && shot.h / shot.w > 0.9;
  return (
    <section className={`gs ${tall ? "is-tall" : ""}`} id={`step-${no}`}>
      <header className="gs-head">
        <span className="gs-no">{no}</span>
        <div>
          <h3>{step.title}</h3>
          <p>{step.sub}</p>
        </div>
      </header>
      <div className="gs-body">
        {shot && (
          <button type="button" className="gs-shot" onClick={() => onZoom(step.shot)} aria-label="크게 보기">
            <img src={`/guide/${step.shot}.jpg`} alt={step.title} loading="lazy" style={{ aspectRatio: `${shot.w} / ${shot.h}` }} />
            {shot.pins.slice(0, step.pins.length).map((p, i) => (
              <span
                key={i}
                className={`gs-pin ${active === i ? "on" : ""}`}
                style={{ left: `${p.x}%`, top: `${p.y}%` }}
              >
                {i + 1}
              </span>
            ))}
            <span className="gs-zoom">
              <ZoomIn size={14} /> 크게 보기
            </span>
          </button>
        )}
        <div className="gs-side">
          <ol className="gs-pins">
            {step.pins.map((t, i) => (
              <li key={i} onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)}>
                <span className="gs-pin-no">{i + 1}</span>
                {t}
              </li>
            ))}
          </ol>
          {step.extra}
          {step.action && (
            <button
              type="button"
              className="guide-go"
              onClick={() =>
                step.action!.search !== undefined ? onSearch(step.action!.search) : step.action!.go && onGo(step.action!.go)
              }
            >
              {step.action.label}
              <ArrowRight size={15} />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function Lightbox({ shot, onClose }: { shot: string; onClose: () => void }) {
  const s = SHOTS[shot];
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="gs-light" role="dialog" aria-label="화면 크게 보기" onClick={onClose}>
      <button className="gs-light-close" aria-label="닫기" onClick={onClose}>
        <X size={20} />
      </button>
      <div className="gs-light-img" onClick={(e) => e.stopPropagation()} style={{
          aspectRatio: `${s.w} / ${s.h}`,
          width: `min(calc(100vw - 32px), 1400px, calc((100vh - 80px) * ${(s.w / s.h).toFixed(4)}))`,
        }}>
        <img src={`/guide/${shot}.jpg`} alt="" />
        {s.pins.map((p, i) => (
          <span key={i} className="gs-pin" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
            {i + 1}
          </span>
        ))}
      </div>
    </div>
  );
}

function Flow({ items }: { items: string[] }) {
  return (
    <ol className="gs-flow">
      {items.map((t, i) => (
        <li key={t}>
          <a href={`#step-${i + 1}`} onClick={(e) => {
            e.preventDefault();
            document.getElementById(`step-${i + 1}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}>
            <b>{i + 1}</b>
            {t}
          </a>
        </li>
      ))}
    </ol>
  );
}

const STATUS_CARDS: [string, string][] = [
  ["verified", "문제없음"],
  ["needs_review", "확인 중 (AI 표기 미체크 등)"],
  ["restricted", "일부 용도만 (예: 인쇄 전용 서체)"],
  ["expired", "계약 만료 · 재사용 금지"],
];

function StatusCards() {
  return (
    <div className="gs-status">
      {STATUS_CARDS.map(([v, t]) => (
        <span key={v}>
          <Status value={v} />
          <small>{t}</small>
        </span>
      ))}
    </div>
  );
}

function Rules({ items }: { items: string[] }) {
  return (
    <div className="gs-rules">
      {items.map((t) => (
        <span key={t}>{t}</span>
      ))}
    </div>
  );
}

const STEPS: Record<GuideRole, { flow: string[]; steps: StepDef[] }> = {
  uploader: {
    flow: ["이름 규칙", "파일 올리기", "자동 분류 확인", "등록", "새 버전", "되돌리기", "폴더로 찾기"],
    steps: [
      {
        title: "이름부터 규칙대로",
        sub: "이름만 맞으면 등록할 때 정보가 자동으로 채워져요",
        shot: "u-naming",
        pins: ["폴더 이름 규칙", "날짜·요청번호·프로젝트명을 넣으면", "완성된 이름을 복사해서 NAS에 그대로"],
        extra: (
          <>
            <NameParts
              parts={[
                ["260120", "날짜"],
                ["15832", "요청번호"],
                ["색채학 과정", "프로젝트"],
                ["산돌-AI", "리소스"],
                ["김다은", "디자이너"],
              ]}
            />
            <NameParts
              parts={[
                ["15832", "요청번호"],
                ["상세", "유형"],
                ["PC", "PC/MO"],
                ["v01", "버전"],
              ]}
            />
          </>
        ),
        action: { label: "이름 만들기", go: "naming" },
      },
      {
        title: "폴더째 올리기",
        sub: "파일과 NAS 경로만 있으면 끝",
        shot: "u-upload",
        pins: ["프로젝트 폴더를 끌어다 놓거나 '폴더 추가'", "NAS 프로젝트 폴더 경로 붙여 넣기", "다음 → 자동 분류"],
        action: { label: "등록하러 가기", go: "upload" },
      },
      {
        title: "자동으로 채운 내용 확인",
        sub: "틀린 곳만 고치면 돼요",
        shot: "u-review",
        pins: ["프로젝트 정보 (기존 폴더면 그대로)", "함께 만든 작업 체크", "v03 → v04 = 기존 작업의 새 버전"],
      },
      {
        title: "수정 이유·라이선스 확인 후 등록",
        sub: "아래 체크리스트가 모두 초록이면 등록",
        shot: "u-review2",
        pins: ["새 버전이면 수정 이유 필수", "AI를 썼으면 표기 체크", "기타 리소스는 출처·캡처", "빠진 항목 확인", "등록"],
      },
      {
        title: "수정본은 '새 버전'으로",
        sub: "썸네일에 마우스를 올리면 바로 보여요",
        shot: "u-newver",
        pins: ["새 버전 올리기", "파일 경로 복사", "지금 버전", "버전 기록 열기"],
      },
      {
        title: "예전 버전 보기·되돌리기",
        sub: "되돌려도 기록은 지워지지 않아요",
        shot: "u-version",
        pins: ["버전 점을 누르면", "그때 작업물이 보이고", "되돌리기 = 새 버전으로 다시 올림", "수정된 작업만 / 전체"],
      },
      {
        title: "폴더로 찾기",
        sub: "NAS와 같은 순서로 들어가요",
        shot: "u-folder",
        pins: ["올해 사업부 폴더", "지금 위치", "NAS 경로 복사", "수정 전 파일은 '이전 버전' 폴더"],
        action: { label: "폴더 열기", go: "browse" },
      },
    ],
  },
  planner: {
    flow: ["검색·필터", "프로젝트로 보기", "저널", "컬러 가져오기", "라이선스 확인"],
    steps: [
      {
        title: "키워드 + 필터로 찾기",
        sub: "띄어 쓰면 모든 단어가 들어간 작업만",
        shot: "p-search",
        pins: ["키워드 검색", "필터 열기", "조건 체크 (사업부·유형·디자이너…)", "프로젝트 / 파일 단위", "결과 카드"],
        extra: <SearchChips />,
        action: { label: "전체 둘러보기", search: "" },
      },
      {
        title: "프로젝트 단위로 레퍼런스 보기",
        sub: "한 과정의 상세·배너·팝업이 한 화면에",
        shot: "p-project",
        pins: ["이 화면 주소를 요청서에 붙이면 같은 화면이 열려요", "구성 한눈에", "NAS 경로 복사", "수정 흐름 보기", "유형별 작업"],
      },
      {
        title: "저널에서 트렌드 챙기기",
        sub: "트렌드 · AI 뉴스 · 레퍼런스 · 툴·팁 · 공지",
        shot: "p-journal",
        pins: ["카테고리", "태그", "글쓰기", "최신 글"],
        action: { label: "저널 보기", go: "journal" },
      },
      {
        title: "컬러는 눌러서 복사",
        sub: "팔레트 색을 누르면 HEX가 복사돼요",
        shot: "p-palette",
        pins: ["색 누르기", "복사됨"],
      },
      {
        title: "재사용 전 라이선스 표시 확인",
        sub: "표시가 있으면 담당 디자이너에게 먼저",
        shot: "p-license",
        pins: ["라이선스 상태", "사용 조건", "원본 경로 복사"],
        extra: <StatusCards />,
      },
    ],
  },
  admin: {
    flow: ["버전 기록", "관리자 모드", "라이선스 상태 변경", "서체 라이선스"],
    steps: [
      {
        title: "버전은 지우지 않고 쌓여요",
        sub: "모든 버전의 작업물·이유·날짜·디자이너가 남아요",
        shot: "a-version",
        pins: ["버전 골라 보기", "지금 버전으로 돌아가기", "버전 기록"],
        extra: (
          <Rules
            items={[
              "같은 NAS 폴더 = 한 프로젝트",
              "같은 작업 다시 올리면 → 다음 버전",
              "새 버전은 수정 이유 필수",
              "되돌리기도 새 버전으로 기록",
              "원본 정리된 버전은 되돌리기 불가",
              "NAS 폴더명을 바꾸면 다른 프로젝트",
            ]}
          />
        ),
      },
      {
        title: "관리자 모드로 바꾸기",
        sub: "시제품에서는 메뉴에서 바꿔요 (실서비스는 로그인 계정 기준)",
        shot: "a-role",
        pins: ["전체 메뉴 → 사용자 모드", "관리자 선택"],
      },
      {
        title: "라이선스 상태 바꾸기",
        sub: "파일 상세 → 정보 수정 → 라이선스(관리자)",
        shot: "a-license-edit",
        pins: ["상태 선택", "근거 메모 (확인 날짜·범위)", "저장"],
        extra: <StatusCards />,
      },
      {
        title: "서체 라이선스 관리",
        sub: "서체별 유효기간·허용 계정·쓴 작업 수",
        shot: "a-license",
        pins: ["상태별 보기", "서체 검색", "서체 펼치기", "라이선스 키·허용 계정·갱신 신청"],
        extra: (
          <Rules
            items={["산돌·게티 = 회사 구매 패키지", "AI = 사용 문구 표기 확인", "기타 = 출처 + 캡처 증빙", "저장소 연결 전: 새로고침 시 초기화"]}
          />
        ),
        action: { label: "라이선스 화면", go: "license" },
      },
    ],
  },
};

let searchHandler: (q: string) => void = () => {};

function SearchChips() {
  const examples: [string, string][] = [
    ["색채학", "과정명"],
    ["상세페이지 MO", "유형+기기"],
    ["평생 배너", "사업부+유형"],
    ["장소 변경", "수정 이유"],
    ["산돌", "리소스"],
  ];
  return (
    <div className="guide-chips">
      {examples.map(([q, label]) => (
        <button key={q} type="button" onClick={() => searchHandler(q)}>
          <Search size={13} />
          {q}
          <small>{label}</small>
        </button>
      ))}
    </div>
  );
}

function RoleGuide({
  role,
  onGo,
  onSearch,
}: {
  role: GuideRole;
  onGo: (v: Go) => void;
  onSearch: (q: string) => void;
}) {
  const [zoom, setZoom] = useState<string | null>(null);
  searchHandler = onSearch;
  const { flow, steps } = STEPS[role];
  return (
    <div className="guide-body">
      <Flow items={flow} />
      {steps.map((st, i) => (
        <ShotStep key={st.shot} no={i + 1} step={st} onGo={onGo} onSearch={onSearch} onZoom={setZoom} />
      ))}
      {zoom && <Lightbox shot={zoom} onClose={() => setZoom(null)} />}
    </div>
  );
}

