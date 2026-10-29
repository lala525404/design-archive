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
 * NAS 경로에서 연도/교수/과정/작업유형을 읽는다.
 * \\NAS\디자인\2026\이동건\색채학\상세페이지 처럼 앞에 공유 폴더가 붙어도
 * 4자리 연도 폴더부터 읽는다.
 */
export function parseNasPath(path: string) {
  const parts = segments(path);
  let start = parts.findIndex((p) => /^\d{4}$/.test(p));
  if (start < 0) start = 0;
  const [year = "", professor = "", course = "", type = ""] = parts.slice(
    start,
    start + 4,
  );
  return { year, professor, course, type };
}

/** 비교용 경로: 연도 폴더부터 슬래시로 통일 */
export function pathKey(path: string) {
  const parts = segments(path);
  const start = Math.max(
    0,
    parts.findIndex((p) => /^\d{4}$/.test(p)),
  );
  return parts.slice(start).join("/").toLowerCase();
}

/** 파일명에서 작업명 토큰(두 번째 칸)을 꺼낸다. 없으면 버전을 뗀 이름 */
export function workToken(fileName: string) {
  const stem = fileName.replace(/\.[^/.]+$/, "");
  const tokens = stem.split("_");
  return (tokens[1] || stem.replace(/_?v\d+$/i, "")).toLowerCase();
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
