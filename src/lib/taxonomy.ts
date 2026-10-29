import { AssetType } from "../types";

/** NAS 최상위 분류 폴더 (회사 NAS 구조 그대로) */
export const SERVICES = [
  "01_교원",
  "02_아이티뱅크",
  "03_HRD고객사",
  "04_HRD내부구축",
  "05_평생",
  "06_미래경영",
  "07_전사",
  "08_인쇄광고물(시디)",
  "09_마케팅",
] as const;

/** "05_평생" → "평생" */
export const serviceName = (folder?: string) =>
  (folder ?? "").replace(/^\d+_/, "");

export const ASSET_TYPES: AssetType[] = [
  "상세페이지",
  "풀페이지",
  "배너",
  "팝업",
  "카드뉴스",
  "포스터",
  "썸네일",
  "PPT",
];

/** PC/MO 버전이 따로 나오는 작업 유형 */
export const DEVICE_TYPES: AssetType[] = ["상세페이지", "풀페이지", "배너", "팝업"];

export const DESIGNERS = ["양현보", "김다은", "박정은", "박지원", "방수림"];
export const CURRENT_DESIGNER = "박정은";

export const TOOLS = ["AI", "산돌", "포토샵", "일러스트", "피그마"];

/** 파일명에 섞여 쓰이는 표기를 도구 이름 하나로 맞춘다 */
const TOOL_ALIASES: Record<string, string> = {
  ai: "AI",
  gpt: "AI",
  chatgpt: "AI",
  midjourney: "AI",
  미드저니: "AI",
  생성형ai: "AI",
  산돌: "산돌",
  sandoll: "산돌",
  ps: "포토샵",
  photoshop: "포토샵",
  포토샵: "포토샵",
  ai일러: "일러스트",
  illustrator: "일러스트",
  일러: "일러스트",
  일러스트: "일러스트",
  일러스트레이터: "일러스트",
  figma: "피그마",
  피그마: "피그마",
};
export const normalizeTool = (raw: string) =>
  TOOL_ALIASES[raw.trim().toLowerCase().replace(/\s/g, "")] ?? raw.trim();

/** 파일명·확장자에서 작업 유형과 PC/MO를 추정한다 */
export function guessType(fileName: string): {
  type: AssetType | "";
  device?: "PC" | "MO";
} {
  const lower = fileName.toLowerCase();
  let type: AssetType | "" = "";
  if (/\.(pptx?|key)$/.test(lower) || /ppt|제안서|발표/.test(lower)) type = "PPT";
  else if (/풀페이지|full/.test(lower)) type = "풀페이지";
  else if (/상세|detail/.test(lower)) type = "상세페이지";
  else if (/팝업|popup/.test(lower)) type = "팝업";
  else if (/배너|banner/.test(lower)) type = "배너";
  else if (/카드뉴스|card/.test(lower)) type = "카드뉴스";
  else if (/포스터|poster|인쇄/.test(lower)) type = "포스터";
  else if (/썸네일|thumb/.test(lower)) type = "썸네일";
  const tokens = fileName.replace(/\.[^/.]+$/, "").split(/[_\-\s().]+/);
  const isMo = tokens.some(
    (t) => /^(mo|mobile|모바일)$/i.test(t) || /(MO|모바일)$/.test(t),
  );
  const isPc = tokens.some((t) => /^pc$/i.test(t) || /PC$/.test(t));
  const device: "PC" | "MO" | undefined = isMo ? "MO" : isPc ? "PC" : undefined;
  return { type, device: type && DEVICE_TYPES.includes(type) ? device : undefined };
}
