import { AssetType } from "../types";
import {
  DEVICE_TYPES,
  DESIGNERS,
  TYPE_CODES,
  guessType,
  normalizeResources,
  typeCode,
} from "./taxonomy";

/*
 * 회사 NAS 네이밍 규칙
 *   폴더(프로젝트): 날짜_요청번호_프로젝트명_리소스_디자이너
 *     260714_21076_이룸 엑셀파워포인트AI 패키지_산돌-게티_김다은
 *   파일(결과물):   요청번호_유형-세부_PC|MO_v01.확장자   (요청번호 없으면 날짜)
 *     21076_배너-메인_PC_v01.png
 *
 * 규칙 이전에 만든 폴더(260102_제목(11340)_산돌,게티_방수림)도 읽는다.
 */

export interface FolderInfo {
  date: string; // YYMMDD
  requestNo: string; // 5자리, 없으면 ""
  project: string;
  resources: string[];
  designer: string;
  /** 새 규칙을 그대로 따랐는지 */
  followsRule: boolean;
  /** 사람이 확인할 문제 */
  issues: string[];
}

const stripExt = (name: string) => name.replace(/\.[a-z0-9]{2,5}$/i, "");

export function parseProjectFolder(raw: string): FolderInfo {
  const name = raw.trim().replace(/[\\/]+$/, "");
  const tokens = name.split("_").map((t) => t.trim());
  const issues: string[] = [];

  // 새 규칙: 6자리_5자리_이름…_리소스_디자이너
  if (
    tokens.length >= 5 &&
    /^\d{6}$/.test(tokens[0]) &&
    /^\d{5}$/.test(tokens[1])
  ) {
    const designer = tokens[tokens.length - 1];
    const resourceToken = tokens[tokens.length - 2];
    const project = tokens.slice(2, -2).join(" ").trim();
    const resources =
      resourceToken === "없음" ? [] : normalizeResources(resourceToken);
    if (resourceToken !== "없음" && !resources.length)
      issues.push(`리소스 "${resourceToken}"를 알 수 없어요`);
    if (!DESIGNERS.includes(designer))
      issues.push(`디자이너 "${designer}"가 목록에 없어요`);
    if (/[\[\](),&]/.test(project))
      issues.push("프로젝트명에 [ ] ( ) , & 는 빼주세요");
    return {
      date: tokens[0],
      requestNo: tokens[1] === "00000" ? "" : tokens[1],
      project,
      resources,
      designer,
      followsRule: issues.length === 0,
      issues,
    };
  }

  // 예전 이름: 날짜_제목(요청번호)_리소스,리소스_디자이너
  const date = /^\d{6}$/.test(tokens[0] ?? "") ? tokens[0] : "";
  const last = tokens[tokens.length - 1] ?? "";
  const designer = DESIGNERS.includes(last) ? last : "";
  const middle = tokens.slice(date ? 1 : 0, designer ? -1 : undefined);
  // 리소스 칸은 보통 디자이너 바로 앞
  let resources: string[] = [];
  if (middle.length > 1) {
    const candidate = normalizeResources(middle[middle.length - 1]);
    if (candidate.length) {
      resources = candidate;
      middle.pop();
    }
  }
  const titleRaw = middle.join(" ");
  const requestNo = titleRaw.match(/\((\d{4,6})\)/)?.[1] ?? "";
  const project = titleRaw
    .replace(/\[[^\]]*\]/g, " ") // [평생] 같은 부서 태그
    .replace(/\([^)]*\)/g, " ") // (요청번호), (강사명 목록)
    .replace(/[,&]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!date) issues.push("맨 앞에 날짜(YYMMDD)가 없어요");
  if (!requestNo) issues.push("요청번호가 없어요 (없으면 00000)");
  if (!designer) issues.push("맨 끝에 디자이너 이름이 없어요");
  if (/\[|\]/.test(titleRaw)) issues.push("[부서] 태그는 상위 폴더가 알려주니 빼주세요");
  if (/\(\d{4,6}\)/.test(titleRaw)) issues.push("요청번호는 날짜 다음 칸으로 옮겨주세요");
  return {
    date,
    requestNo,
    project,
    resources,
    designer,
    followsRule: false,
    issues,
  };
}

export interface FileInfo {
  id: string; // 요청번호 또는 날짜
  type: AssetType | "";
  label: string; // 배너-메인 의 "메인"
  device?: "PC" | "MO";
  version: string;
  followsRule: boolean;
  issues: string[];
}

export function parseDeliverable(fileName: string): FileInfo {
  const tokens = stripExt(fileName).split("_").map((t) => t.trim());
  const issues: string[] = [];
  const version = (tokens.find((t) => /^v\d+$/i.test(t)) ?? "").toLowerCase();

  // 새 규칙: ID_유형-세부(_PC|MO)_vNN
  if (/^\d{5,6}$/.test(tokens[0] ?? "") && tokens.length >= 3 && version) {
    const [code, ...rest] = tokens[1].split("-");
    const type = TYPE_CODES[code] ?? "";
    const deviceToken = tokens.find((t) => /^(PC|MO)$/i.test(t));
    const device = deviceToken
      ? (deviceToken.toUpperCase() as "PC" | "MO")
      : undefined;
    if (!type) issues.push(`유형 "${code}"를 알 수 없어요`);
    if (type && DEVICE_TYPES.includes(type) && !device)
      issues.push("PC 또는 MO를 적어주세요");
    return {
      id: tokens[0],
      type,
      label: rest.join("-"),
      device: type && DEVICE_TYPES.includes(type) ? device : undefined,
      version,
      followsRule: issues.length === 0,
      issues,
    };
  }

  // 그 밖의 이름: 키워드로 추정
  const guess = guessType(fileName);
  if (!guess.type) issues.push("유형을 알 수 없어요");
  if (!version) issues.push("버전(v01)이 없어요");
  issues.push("새 규칙(요청번호_유형_PC|MO_v01)과 달라요");
  return {
    id: "",
    type: guess.type,
    label: "",
    device: guess.device,
    version: version || "v01",
    followsRule: false,
    issues,
  };
}

export function buildFolderName(f: {
  date: string;
  requestNo?: string;
  project: string;
  resources: string[];
  designer: string;
}) {
  return [
    f.date,
    f.requestNo || "00000",
    f.project,
    f.resources.length ? f.resources.join("-") : "없음",
    f.designer,
  ].join("_");
}

export function buildDeliverableName(f: {
  id: string;
  type: AssetType;
  label?: string;
  device?: "PC" | "MO";
  version: string;
  ext?: string;
}) {
  const head = [f.id, `${typeCode(f.type)}${f.label ? `-${f.label}` : ""}`];
  if (f.device) head.push(f.device);
  head.push(f.version);
  return `${head.join("_")}.${f.ext ?? (f.type === "PPT" ? "pptx" : "png")}`;
}

/** YYMMDD → 2026 */
export const yearFromDate = (date: string) =>
  /^\d{6}$/.test(date) ? `20${date.slice(0, 2)}` : "";
