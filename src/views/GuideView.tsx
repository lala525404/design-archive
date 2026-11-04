import React from "react";
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

      {role === "uploader" && <Uploader onGo={onGo} />}
      {role === "planner" && <Planner onGo={onGo} onSearch={onSearch} />}
      {role === "admin" && <Admin onGo={onGo} />}
    </main>
  );
}

function Quick({ items }: { items: { icon: React.ReactNode; title: string; text: string }[] }) {
  return (
    <ol className="guide-quick">
      {items.map((it, i) => (
        <li key={it.title}>
          <span className="guide-quick-no">{i + 1}</span>
          <span className="guide-quick-icon">{it.icon}</span>
          <b>{it.title}</b>
          <span>{it.text}</span>
        </li>
      ))}
    </ol>
  );
}

function Step({
  no,
  title,
  lead,
  children,
  action,
}: {
  no: number;
  title: string;
  lead: string;
  children?: React.ReactNode;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <section className="guide-step">
      <span className="guide-step-no">{String(no).padStart(2, "0")}</span>
      <div className="guide-step-body">
        <h3>{title}</h3>
        <p className="guide-lead">{lead}</p>
        {children}
        {action && (
          <button type="button" className="guide-go" onClick={action.onClick}>
            {action.label}
            <ArrowRight size={15} />
          </button>
        )}
      </div>
    </section>
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

function Uploader({ onGo }: { onGo: (v: Go) => void }) {
  return (
    <div className="guide-body">
      <Quick
        items={[
          { icon: <FolderOpen size={18} />, title: "이름 맞추기", text: "NAS 폴더·파일 이름을 규칙대로" },
          { icon: <Upload size={18} />, title: "폴더째 올리기", text: "NAS 경로 붙여 넣고 확인 6단계" },
          { icon: <History size={18} />, title: "수정은 새 버전으로", text: "썸네일에서 '새 버전' 한 번" },
        ]}
      />

      <Step
        no={1}
        title="파일 이름부터 규칙대로"
        lead="이름만 맞으면 등록할 때 프로젝트·요청번호·리소스·유형·PC/MO·버전이 자동으로 채워져요."
        action={{ label: "이름 만들기·검사하러 가기", onClick: () => onGo("naming") }}
      >
        <p className="guide-label">프로젝트 폴더</p>
        <NameParts
          parts={[
            ["260120", "날짜(YYMMDD)"],
            ["15832", "요청번호(없으면 00000)"],
            ["색채학 과정", "프로젝트명"],
            ["산돌-AI", "리소스(없으면 '없음')"],
            ["김다은", "담당 디자이너"],
          ]}
        />
        <p className="guide-label">파일</p>
        <NameParts
          parts={[
            ["15832", "요청번호"],
            ["상세", "유형(-세부: 배너-메인)"],
            ["PC", "PC 또는 MO"],
            ["v01.png", "버전"],
          ]}
        />
        <ul className="guide-tips">
          <li>NAS는 <code>\\NAS\디자인\2026\05_평생\프로젝트 폴더\</code> 순서예요 (연도 → 사업부 → 프로젝트).</li>
          <li>예전 이름도 읽긴 하지만, 빠진 정보는 등록할 때 직접 채워야 해요.</li>
        </ul>
      </Step>

      <Step
        no={2}
        title="등록하기: 폴더째 올리고 확인만"
        lead="첫 화면이나 상단의 '등록하기'에서 프로젝트 폴더를 끌어다 놓고 NAS 경로를 붙여 넣으면 돼요."
        action={{ label: "등록하러 가기", onClick: () => onGo("upload") }}
      >
        <ol className="guide-flow">
          <li>
            <b>프로젝트</b> 제목·사업부·연도·요청번호 확인 (이미 있는 폴더면 기존 정보를 그대로 씀)
          </li>
          <li>
            <b>패키지 구성</b> 함께 만든 작업(상세·배너·팝업…) 체크
          </li>
          <li>
            <b>파일별 확인</b> 작업명·유형·PC/MO·디자이너
          </li>
          <li>
            <b>수정 내용</b> 기존 작업의 새 버전이 섞여 있으면 수정 이유 필수
          </li>
          <li>
            <b>리소스·라이선스</b> AI를 썼으면 'AI 사용 문구 기재' 체크, 기타 리소스는 이름·출처와 캡처
          </li>
          <li>
            <b>태그</b> 나중에 찾을 키워드(행사명·시즌·타깃) 추가
          </li>
        </ol>
        <p className="guide-note">하단 체크리스트가 모두 초록색이면 등록 버튼을 누르세요.</p>
      </Step>

      <Step
        no={3}
        title="수정본은 '새 버전'으로"
        lead="일자·장소·문구가 바뀌어 다시 만든 파일은 새 파일이 아니라 같은 작업의 다음 버전으로 올려요."
      >
        <ul className="guide-tips">
          <li>
            프로젝트 화면에서 썸네일에 마우스를 올리고 <b>새 버전</b>을 누르면 그 파일의 v02, v03…으로 올라가요.
          </li>
          <li>같은 폴더에 같은 이름(버전만 다름)으로 올려도 자동으로 새 버전이 돼요.</li>
          <li>
            새 작업을 더할 땐 프로젝트의 <b>파일 추가</b>를 누르면 NAS 경로가 미리 채워져요.
          </li>
          <li>
            제목·사업부·리소스는 프로젝트의 <b>정보 수정</b>, 작업명·유형은 파일 상세의 <b>정보 수정</b>에서 고쳐요.
          </li>
        </ul>
        <div className="guide-nodes" aria-hidden="true">
          {["v01 최초", "v02 일자 변경", "v03 장소 변경"].map((v, i) => (
            <span key={v} className={i === 2 ? "on" : ""}>
              <i />
              {v}
            </span>
          ))}
        </div>
      </Step>

      <Step
        no={4}
        title="예전 버전 보기·되돌리기"
        lead="프로젝트의 '버전 관리'나 파일 상세의 버전 버튼(v01·v02…)을 누르면 그때 작업물과 수정 이유가 보여요."
      >
        <ul className="guide-tips">
          <li>
            <b>이 버전으로 되돌리기</b>는 예전 내용을 새 버전으로 다시 올려요. 기존 기록은 지워지지 않아요.
          </li>
          <li>NAS 원본을 정리한 버전은 '원본 정리됨'으로 보이고 되돌릴 수 없어요.</li>
        </ul>
      </Step>

      <Step
        no={5}
        title="내 작업 찾기"
        lead="검색이 편하면 '자산 찾기', NAS처럼 폴더로 들어가는 게 편하면 '폴더'를 쓰세요."
        action={{ label: "폴더로 보기", onClick: () => onGo("browse") }}
      >
        <ul className="guide-tips">
          <li>폴더는 올해 사업부 폴더가 바로 열리고, 지난 해는 '이전 연도' 안에 있어요.</li>
          <li>프로젝트 폴더 안 '이전 버전' 폴더에 수정 전 파일이 모여 있어요.</li>
          <li>참고할 만한 트렌드나 툴 팁은 저널에 글로 남겨 주세요.</li>
        </ul>
      </Step>
    </div>
  );
}

function Planner({ onGo, onSearch }: { onGo: (v: Go) => void; onSearch: (q: string) => void }) {
  const examples: [string, string][] = [
    ["색채학", "과정·프로젝트 이름"],
    ["상세페이지 MO", "작업 유형 + PC/MO"],
    ["평생", "사업부"],
    ["카드뉴스", "유형만"],
    ["장소 변경", "수정 이유"],
    ["산돌", "리소스"],
  ];
  return (
    <div className="guide-body">
      <Quick
        items={[
          { icon: <Search size={18} />, title: "검색하고", text: "키워드 한두 개로 시작" },
          { icon: <FolderOpen size={18} />, title: "프로젝트로 보고", text: "한 과정의 구성 전체를 한 번에" },
          { icon: <BookOpen size={18} />, title: "저널로 넓히기", text: "트렌드·AI 뉴스·레퍼런스" },
        ]}
      />

      <Step
        no={1}
        title="키워드 한두 개로 검색하기"
        lead="과정명, 작업 유형, 사업부, 디자이너, 사용 도구, 수정 이유까지 한 칸에서 찾아요. 아래 예시를 눌러 바로 해보세요."
      >
        <div className="guide-chips">
          {examples.map(([q, label]) => (
            <button key={q} type="button" onClick={() => onSearch(q)}>
              <Search size={13} />
              {q}
              <small>{label}</small>
            </button>
          ))}
        </div>
        <p className="guide-note">여러 단어를 띄어 쓰면 모두 들어간 작업만 보여요 (예: 평생 배너).</p>
      </Step>

      <Step
        no={2}
        title="필터로 좁히기"
        lead="검색 결과 위 '필터'에서 조건을 겹쳐 고르면 숫자가 바로 바뀌어요."
        action={{ label: "전체 둘러보기", onClick: () => onSearch("") }}
      >
        <ul className="guide-tips">
          <li>
            <b>사업부·연도</b>: 같은 사업부의 작년 작업 비교
          </li>
          <li>
            <b>작업 유형·PC/MO</b>: 모바일 상세페이지만, 팝업만
          </li>
          <li>
            <b>프로젝트 구성</b>: '상세 + 배너 + 팝업'을 모두 만든 패키지만 (비슷한 규모 기획 참고)
          </li>
          <li>
            <b>디자이너·사용 도구·리소스</b>: 특정 스타일, AI 활용 작업, 산돌 서체 작업
          </li>
          <li>
            결과는 <b>프로젝트 / 파일</b> 단위로 바꿔 볼 수 있어요.
          </li>
        </ul>
      </Step>

      <Step
        no={3}
        title="프로젝트 단위로 레퍼런스 보기"
        lead="카드 하나가 한 과정의 패키지예요. 열면 상세 PC·MO, 배너, 팝업이 유형별로 모여 있어요."
      >
        <ul className="guide-tips">
          <li>요청서에 "이 프로젝트처럼"이라고 쓸 땐 프로젝트 화면 주소를 그대로 붙여 넣으세요. 받는 사람도 같은 화면이 열려요.</li>
          <li>
            <b>버전 관리</b>에서 일자·문구가 바뀔 때마다 어떻게 고쳤는지 볼 수 있어요.
          </li>
          <li>파일 상세의 '비슷한 작업', 태그를 누르면 관련 작업이 이어서 나와요.</li>
        </ul>
      </Step>

      <Step
        no={4}
        title="저널에서 트렌드 챙기기"
        lead="트렌드, AI 뉴스, 레퍼런스, 툴·팁, 공지 글이 모여 있어요."
        action={{ label: "저널 보러 가기", onClick: () => onGo("journal") }}
      >
        <ul className="guide-tips">
          <li>컬러 팔레트를 누르면 HEX 값이 복사돼요.</li>
          <li>영상이 있는 글은 '▶ 2:42부터 보기' 버튼으로 필요한 장면만 볼 수 있어요.</li>
          <li>공감과 댓글로 의견을 남기면 디자이너에게 바로 전달돼요.</li>
        </ul>
      </Step>

      <Step
        no={5}
        title="재사용 전 라이선스 표시 확인"
        lead="썸네일에 표시가 붙은 작업은 그대로 쓰기 전에 담당 디자이너에게 확인해 주세요."
      >
        <div className="guide-status">
          <span>
            <Status value="needs_review" /> 확인 중
          </span>
          <span>
            <Status value="restricted" /> 용도 제한 (예: 인쇄 전용 서체)
          </span>
          <span>
            <Status value="expired" /> 계약 만료, 재사용 금지
          </span>
        </div>
      </Step>
    </div>
  );
}

function Admin({ onGo }: { onGo: (v: Go) => void }) {
  return (
    <div className="guide-body">
      <Quick
        items={[
          { icon: <History size={18} />, title: "버전은 쌓기만", text: "지우지 않고 기록으로 남김" },
          { icon: <ShieldCheck size={18} />, title: "라이선스 4단계", text: "확인 완료·필요·제한·만료" },
          { icon: <Sparkles size={18} />, title: "운영 메모", text: "역할·저장소·자동 업데이트" },
        ]}
      />

      <Step
        no={1}
        title="버전은 이렇게 쌓여요"
        lead="같은 NAS 폴더 = 한 프로젝트, 같은 작업(폴더 + 유형 + PC/MO)이 다시 올라오면 다음 버전이에요."
      >
        <ul className="guide-tips">
          <li>버전마다 날짜·디자이너·수정 이유·메모·파일명이 기록돼요.</li>
          <li>새 버전을 올릴 땐 수정 이유가 필수라 '왜 바뀌었는지'가 항상 남아요.</li>
          <li>
            <b>되돌리기</b>도 새 버전으로 기록돼요(이유 '되돌리기'). 기록을 지우는 기능은 없어요.
          </li>
          <li>NAS 원본을 정리한 버전은 '원본 정리됨'으로 표시하고, 되돌리기를 막아요.</li>
          <li>프로젝트 제목은 폴더명과 따로 고칠 수 있어요. 묶는 기준은 폴더 경로라서 제목을 바꿔도 묶음은 그대로예요. 대신 NAS 폴더명을 바꾸면 다른 프로젝트로 인식돼요.</li>
        </ul>
      </Step>

      <Step
        no={2}
        title="라이선스 상태 4단계"
        lead="모든 작업에 상태가 붙고, 확인 완료가 아니면 썸네일과 프로젝트 화면에 표시돼요."
      >
        <table className="guide-table">
          <thead>
            <tr>
              <th>상태</th>
              <th>언제 붙나</th>
              <th>할 일</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <Status value="verified" />
              </td>
              <td>문제없음 확인, 또는 업로더가 체크 항목을 모두 확인</td>
              <td>—</td>
            </tr>
            <tr>
              <td>
                <Status value="needs_review" />
              </td>
              <td>AI를 썼는데 'AI 사용 문구 기재'를 체크하지 않음 등</td>
              <td>업로더에게 확인 후 상태 변경</td>
            </tr>
            <tr>
              <td>
                <Status value="restricted" />
              </td>
              <td>계약 범위가 일부 용도로만 허용 (예: 인쇄 전용 서체)</td>
              <td>라이선스 메모에 허용 범위 적기</td>
            </tr>
            <tr>
              <td>
                <Status value="expired" />
              </td>
              <td>서체·이미지 계약 기간이 끝남</td>
              <td>갱신 신청 또는 재사용 금지 안내</td>
            </tr>
          </tbody>
        </table>
        <ul className="guide-tips">
          <li>산돌·게티는 회사 구매 패키지라 업로드 때 따로 확인하지 않아요.</li>
          <li>기타 리소스는 이름·출처와 라이선스 캡처(증빙)가 파일 정보에 남아요.</li>
        </ul>
      </Step>

      <Step
        no={3}
        title="상태 바꾸기"
        lead="관리자 모드에서 파일 상세 → 정보 수정을 열면 '라이선스(관리자)' 칸에서 상태와 메모를 바꿀 수 있어요."
      >
        <ul className="guide-tips">
          <li>
            확인할 작업은 검색 필터의 <b>리소스</b>나, 썸네일의 '확인 필요' 표시로 찾아요.
          </li>
          <li>메모에는 근거를 남겨 주세요 (예: 산돌 기업용 범위 확인, 2026.11.04).</li>
        </ul>
      </Step>

      <Step
        no={4}
        title="서체 라이선스 관리"
        lead="'라이선스' 화면에서 서체별 상태, 유효기간, 허용 부서·계정과 이 서체를 쓴 작업 수를 봐요."
        action={{ label: "라이선스 화면 보기", onClick: () => onGo("license") }}
      >
        <ul className="guide-tips">
          <li>만료·확인 필요 서체는 위쪽 탭으로 모아 보고, 갱신 신청 내용을 바로 만들 수 있어요.</li>
        </ul>
      </Step>

      <Step
        no={5}
        title="운영 메모 (개발·관리)"
        lead="지금은 시제품이라 실제 운영 전에 정해야 할 것들이 있어요."
        action={{ label: "네이밍 규칙 관리", onClick: () => onGo("naming") }}
      >
        <ul className="guide-tips">
          <li>
            <b>역할</b>: 지금은 메뉴 → 사용자 모드에서 일반 사용자 / 디자이너 / 관리자를 바꿔 봐요. 실제로는 회사 계정 로그인 기준으로 나눠야 해요.
          </li>
          <li>
            <b>저장</b>: 등록·수정 내용은 아직 브라우저에만 있어 새로고침하면 사라져요. 저장소(DB)와 이미지 보관 방식을 정해야 해요.
          </li>
          <li>
            <b>주간 AI 뉴스</b>: 매주 월요일 자동으로 올리는 작업이 준비돼 있고, 실사용 전까지 멈춰 둔 상태예요.
          </li>
          <li>
            <b>배포</b>: GitHub main에 올리면 Vercel이 자동 배포해요.
          </li>
        </ul>
      </Step>
    </div>
  );
}
