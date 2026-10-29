import React, { useMemo, useState } from "react";
import { Check, CircleCheck, Copy, TriangleAlert } from "lucide-react";
import { PageTitle } from "../components/Chrome";
import { AssetType } from "../types";
import {
  ASSET_TYPES,
  CURRENT_DESIGNER,
  DESIGNERS,
  DEVICE_TYPES,
  RESOURCES,
  SERVICES,
  typeCode,
} from "../lib/taxonomy";
import {
  buildDeliverableName,
  buildFolderName,
  parseDeliverable,
  parseProjectFolder,
} from "../lib/naming";

interface NamingRuleViewProps {
  onBack: () => void;
  onOpenMenu: () => void;
}

const today = () => {
  const d = new Date();
  return `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
};

const EXAMPLE_LINES = [
  "260714_[평생][이룸] 엑셀,파워포인트xAI 패키지 상세페이지 및 배너(21076)_산돌,게티_김다은",
  "260805_[평생교육원] 미국변호사 상품 상세페이지_산돌,GPT_박정은",
  "260714_21076_이룸 엑셀파워포인트AI 패키지_산돌-게티_김다은",
  "21076_배너-메인_PC_v01.png",
  "메인배너_최종2.png",
].join("\n");

function useCopy() {
  const [copied, setCopied] = useState("");
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      setTimeout(() => setCopied(""), 1600);
    } catch {
      /* 복사 실패 시 사용자가 직접 선택 */
    }
  };
  return { copied, copy };
}

export const NamingRuleView: React.FC<NamingRuleViewProps> = ({ onBack }) => {
  const { copied, copy } = useCopy();

  // 폴더 이름 만들기
  const [date, setDate] = useState(today());
  const [requestNo, setRequestNo] = useState("");
  const [project, setProject] = useState("");
  const [resources, setResources] = useState<string[]>(["산돌"]);
  const [designer, setDesigner] = useState(CURRENT_DESIGNER);
  const folderName = buildFolderName({
    date,
    requestNo,
    project: project.trim() || "프로젝트명",
    resources,
    designer,
  });

  // 파일 이름 만들기
  const [type, setType] = useState<AssetType>("상세페이지");
  const [label, setLabel] = useState("");
  const [device, setDevice] = useState<"PC" | "MO">("PC");
  const [version, setVersion] = useState(1);
  const fileName = buildDeliverableName({
    id: requestNo || date,
    type,
    label: label.trim().replace(/[_\s]/g, ""),
    device: DEVICE_TYPES.includes(type) ? device : undefined,
    version: `v${String(version).padStart(2, "0")}`,
  });

  // 이름 검사기
  const [checkText, setCheckText] = useState(EXAMPLE_LINES);
  const checks = useMemo(
    () =>
      checkText
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .slice(0, 30)
        .map((line) => {
          const isFile = /\.[a-z0-9]{2,5}$/i.test(line);
          if (isFile) {
            const f = parseDeliverable(line);
            return {
              line,
              kind: "파일",
              ok: f.followsRule,
              issues: f.issues,
              read: [
                f.id && `ID ${f.id}`,
                f.type && `${f.type}${f.label ? `(${f.label})` : ""}`,
                f.device,
                f.version,
              ].filter(Boolean) as string[],
              suggestion: "",
            };
          }
          const p = parseProjectFolder(line);
          return {
            line,
            kind: "폴더",
            ok: p.followsRule,
            issues: p.issues,
            read: [
              p.date && `날짜 ${p.date}`,
              `요청 ${p.requestNo || "없음"}`,
              p.project && `"${p.project}"`,
              p.resources.length ? p.resources.join("·") : "리소스 없음",
              p.designer,
            ].filter(Boolean) as string[],
            suggestion:
              !p.followsRule && p.date && p.designer
                ? buildFolderName({ ...p, project: p.project || "프로젝트명" })
                : "",
          };
        }),
    [checkText],
  );

  return (
    <main className="page-shell naming-page naming-v2">
      <PageTitle
        title="네이밍 규칙"
        subtitle="폴더는 프로젝트, 파일은 결과물 하나예요. 칸의 순서가 항상 같으면 아카이브가 자동으로 읽어요."
        onBack={onBack}
      />

      <section className="rule-cards">
        <article className="rule-card">
          <header>
            <span className="rule-kicker">프로젝트 폴더</span>
            <code className="rule-pattern">
              <b>날짜</b>_<b>요청번호</b>_<b>프로젝트명</b>_<b>리소스</b>_<b>디자이너</b>
            </code>
          </header>
          <ul className="rule-notes">
            <li>날짜는 YYMMDD 6자리, 요청번호는 5자리 (없으면 00000)</li>
            <li>프로젝트명에는 _ , [ ] ( ) &amp; 를 쓰지 않아요. 띄어쓰기는 괜찮아요</li>
            <li>리소스는 {RESOURCES.join(" · ")} 중에서 - 로 연결, 없으면 "없음"</li>
            <li>상위 폴더: {SERVICES[4]} / 2026 / 프로젝트 폴더</li>
          </ul>

          <div className="builder">
            <div className="builder-row">
              <label>
                날짜
                <input value={date} maxLength={6} inputMode="numeric" onChange={(e) => setDate(e.target.value.replace(/\D/g, ""))} />
              </label>
              <label>
                요청번호
                <input value={requestNo} placeholder="00000" maxLength={5} inputMode="numeric" onChange={(e) => setRequestNo(e.target.value.replace(/\D/g, ""))} />
              </label>
              <label className="grow">
                프로젝트명
                <input value={project} placeholder="예: 이룸 엑셀파워포인트AI 패키지" onChange={(e) => setProject(e.target.value.replace(/[_,\[\]()&]/g, " "))} />
              </label>
            </div>
            <div className="builder-row">
              <div className="builder-chips" role="group" aria-label="리소스">
                <span>리소스</span>
                {RESOURCES.map((r) => (
                  <button
                    type="button"
                    key={r}
                    className={resources.includes(r) ? "on" : ""}
                    aria-pressed={resources.includes(r)}
                    onClick={() =>
                      setResources(resources.includes(r) ? resources.filter((x) => x !== r) : RESOURCES.filter((x) => x === r || resources.includes(x)))
                    }
                  >
                    {r}
                  </button>
                ))}
              </div>
              <label>
                디자이너
                <select value={designer} onChange={(e) => setDesigner(e.target.value)}>
                  {DESIGNERS.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="built-name">
              <code>{folderName}</code>
              <button type="button" className="btn" onClick={() => copy(folderName)}>
                {copied === folderName ? <Check size={15} /> : <Copy size={15} />}
                {copied === folderName ? "복사됨" : "복사"}
              </button>
            </div>
          </div>
        </article>

        <article className="rule-card">
          <header>
            <span className="rule-kicker">결과물 파일</span>
            <code className="rule-pattern">
              <b>요청번호</b>_<b>유형-세부</b>_<b>PC|MO</b>_<b>v01</b>
            </code>
          </header>
          <ul className="rule-notes">
            <li>요청번호가 없으면 맨 앞에 날짜(YYMMDD)를 써요</li>
            <li>
              유형: {ASSET_TYPES.map(typeCode).join(" · ")}
            </li>
            <li>같은 유형이 여러 개면 - 뒤에 구분: 배너-메인, 배너-김기영</li>
            <li>PC/MO는 상세·풀페이지·배너·팝업만, 수정본은 v02, v03…</li>
          </ul>

          <div className="builder">
            <div className="builder-row">
              <label>
                유형
                <select value={type} onChange={(e) => setType(e.target.value as AssetType)}>
                  {ASSET_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {typeCode(t)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grow">
                세부 (선택)
                <input value={label} placeholder="예: 메인, 김기영" onChange={(e) => setLabel(e.target.value)} />
              </label>
              {DEVICE_TYPES.includes(type) && (
                <div className="builder-chips" role="group" aria-label="PC 또는 MO">
                  <span>기기</span>
                  {(["PC", "MO"] as const).map((d) => (
                    <button type="button" key={d} className={device === d ? "on" : ""} aria-pressed={device === d} onClick={() => setDevice(d)}>
                      {d}
                    </button>
                  ))}
                </div>
              )}
              <label>
                버전
                <input type="number" min={1} max={99} value={version} onChange={(e) => setVersion(Math.max(1, Math.min(99, Number(e.target.value) || 1)))} />
              </label>
            </div>
            <div className="built-name">
              <code>{fileName}</code>
              <button type="button" className="btn" onClick={() => copy(fileName)}>
                {copied === fileName ? <Check size={15} /> : <Copy size={15} />}
                {copied === fileName ? "복사됨" : "복사"}
              </button>
            </div>
          </div>
        </article>
      </section>

      <section className="name-checker">
        <div className="section-heading">
          <h2>이름 검사</h2>
          <span className="muted">폴더나 파일 이름을 한 줄에 하나씩 붙여 넣으세요</span>
        </div>
        <textarea
          value={checkText}
          onChange={(e) => setCheckText(e.target.value)}
          aria-label="검사할 이름"
          rows={5}
        />
        <ul className="check-list">
          {checks.map((c, i) => (
            <li key={i} className={c.ok ? "ok" : "warn"}>
              <div className="check-head">
                {c.ok ? <CircleCheck size={16} /> : <TriangleAlert size={16} />}
                <span className="check-kind">{c.kind}</span>
                <code>{c.line}</code>
              </div>
              <p className="check-read">읽은 정보 · {c.read.join(" / ")}</p>
              {!c.ok && c.issues.length > 0 && (
                <p className="check-issues">{c.issues.join(" · ")}</p>
              )}
              {c.suggestion && (
                <div className="check-suggest">
                  <span>새 규칙으로</span>
                  <code>{c.suggestion}</code>
                  <button type="button" className="text-button" onClick={() => copy(c.suggestion)}>
                    {copied === c.suggestion ? <Check size={14} /> : <Copy size={14} />}
                    {copied === c.suggestion ? "복사됨" : "복사"}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
};
