import { ChangeReason, DesignAsset, VersionEntry } from "../types";

export const CHANGE_REASONS: ChangeReason[] = [
  "일자 변경",
  "장소 변경",
  "문구 수정",
  "디자인 수정",
  "기타",
];

/** 저장된 기록이 없으면 현재 정보로 한 줄짜리 기록을 만든다. */
export function getVersions(asset: DesignAsset): VersionEntry[] {
  if (asset.versions?.length) return asset.versions;
  return [
    {
      version: asset.version,
      fileName: asset.fileName,
      filePath: asset.filePath,
      uploadDate: asset.uploadDate,
      designer: asset.designer,
      reason: "최초 제작",
      originalKept: true,
    },
  ];
}

const segments = (path: string) =>
  path
    .trim()
    .split(/[\\/]+/)
    .map((s) => s.trim())
    .filter(Boolean);

/**
 * NAS 경로에서 서비스 폴더/연도/프로젝트를 읽는다.
 * \\NAS\디자인\05_평생\2026\색채학\ 처럼 앞에 공유 폴더가 붙어도
 * "숫자_이름" 서비스 폴더와 4자리 연도 폴더를 찾아서 읽는다.
 */
export function parseNasPath(path: string) {
  const parts = segments(path).filter((p) => !/\.[a-z0-9]{2,5}$/i.test(p));
  const serviceIdx = parts.findIndex((p) => /^\d{2}_/.test(p));
  const yearIdx = parts.findIndex(
    (p, i) => i > serviceIdx && /^\d{4}$/.test(p),
  );
  const service = serviceIdx >= 0 ? parts[serviceIdx] : "";
  const year = yearIdx >= 0 ? parts[yearIdx] : "";
  const after = yearIdx >= 0 ? yearIdx + 1 : serviceIdx >= 0 ? serviceIdx + 1 : 0;
  const project = parts[after] ?? "";
  return { service, year, project };
}

/** 비교용 경로: 서비스 폴더(없으면 연도)부터 슬래시로 통일 */
export function pathKey(path: string) {
  const parts = segments(path).filter((p) => !/\.[a-z0-9]{2,5}$/i.test(p));
  let start = parts.findIndex((p) => /^\d{2}_/.test(p));
  if (start < 0) start = Math.max(0, parts.findIndex((p) => /^\d{4}$/.test(p)));
  return parts.slice(start).join("/").toLowerCase();
}

/**
 * 파일명에서 "어떤 작업인지"를 나타내는 부분을 꺼낸다.
 * 연도_프로젝트_유형(PC|MO)_도구_디자이너_버전 → 프로젝트_유형(PC|MO)
 * 도구·디자이너·버전이 바뀌어도 같은 작업으로 본다.
 */
export function workToken(fileName: string) {
  const stem = fileName.replace(/\.[^/.]+$/, "");
  const tokens = stem.split("_");
  if (tokens.length >= 5) return `${tokens[1]}_${tokens[2]}`.toLowerCase();
  return stem.replace(/_?v\d+$/i, "").toLowerCase();
}

/** 같은 NAS 폴더 + 같은 작업명이면 같은 작업의 다른 버전으로 본다. */
export function findSameWork(
  assets: DesignAsset[],
  filePath: string,
  fileName: string,
) {
  const key = pathKey(filePath);
  const token = workToken(fileName);
  if (!key || !token) return undefined;
  return assets.find((a) =>
    getVersions(a).some(
      (v) => pathKey(v.filePath) === key && workToken(v.fileName) === token,
    ),
  );
}

export const versionNumber = (v: string) =>
  Number((v.match(/\d+/) || ["0"])[0]);

export function nextVersion(current: string) {
  const n = versionNumber(current) + 1;
  return `v${String(n).padStart(2, "0")}`;
}

/** 파일명 끝의 _vNN을 바꾼다. 없으면 붙인다. */
export function withVersion(fileName: string, version: string) {
  const ext = fileName.match(/\.[^/.]+$/)?.[0] ?? "";
  const stem = fileName.slice(0, fileName.length - ext.length);
  return /_v\d+$/i.test(stem)
    ? `${stem.replace(/_v\d+$/i, `_${version}`)}${ext}`
    : `${stem}_${version}${ext}`;
}
