import { AssetType, DesignAsset, LicenseStatus } from "../types";
import { ASSET_TYPES, DEVICE_TYPES, typeCode } from "./taxonomy";
import { pathKey } from "./versions";

/**
 * 같은 NAS 프로젝트 폴더에 있으면 한 프로젝트(패키지).
 * 제목은 따로 고칠 수 있어서, 묶는 기준은 폴더 경로로 한다.
 */
export const projectKey = (a: Pick<DesignAsset, "filePath">) => pathKey(a.filePath);

export interface ProjectSummary {
  key: string;
  service: string;
  year: number;
  project: string;
  requestNo?: string;
  resources: string[];
  files: DesignAsset[];
  designers: string[];
  latestDate: string;
  /** 대표 썸네일 순서 (최근 것, 세로형 먼저) */
  covers: DesignAsset[];
  /** 가장 주의가 필요한 라이선스 상태 */
  license: LicenseStatus;
}

const SEVERITY: Record<LicenseStatus, number> = {
  verified: 0,
  needs_review: 1,
  restricted: 2,
  expired: 3,
};

export function groupProjects(files: DesignAsset[]): ProjectSummary[] {
  const map = new Map<string, DesignAsset[]>();
  files.forEach((a) => {
    const k = projectKey(a);
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(a);
  });
  return Array.from(map.entries()).map(([key, list]) => {
    const sorted = [...list].sort((a, b) => b.uploadDate.localeCompare(a.uploadDate));
    const first = sorted[0];
    const portrait = ["상세페이지", "풀페이지", "포스터", "카드뉴스", "팝업"];
    const covers = [
      ...sorted.filter((a) => a.imageUrl || portrait.includes(a.type)),
      ...sorted.filter((a) => !(a.imageUrl || portrait.includes(a.type))),
    ];
    return {
      key,
      service: first.service,
      year: first.year,
      project: first.project,
      requestNo: list.find((a) => a.requestNo)?.requestNo,
      resources: Array.from(new Set(list.flatMap((a) => a.resources ?? []))),
      files: sortFiles(list),
      designers: Array.from(new Set(list.map((a) => a.designer))),
      latestDate: first.uploadDate,
      covers,
      license: list.reduce<LicenseStatus>(
        (worst, a) => (SEVERITY[a.licenseStatus] > SEVERITY[worst] ? a.licenseStatus : worst),
        "verified",
      ),
    };
  });
}

/** 상세 → 풀페이지 → 배너 … 순서, 같은 유형이면 PC 먼저 */
export function sortFiles(files: DesignAsset[]) {
  const order = (a: DesignAsset) =>
    ASSET_TYPES.indexOf(a.type) * 10 + (a.device === "MO" ? 1 : 0);
  return [...files].sort((a, b) => order(a) - order(b) || a.title.localeCompare(b.title, "ko"));
}

/** "상세 PC·MO", "배너 2", "팝업" 같은 구성 요약 */
export function typeSummary(files: DesignAsset[]): string[] {
  const byType = new Map<AssetType, DesignAsset[]>();
  files.forEach((a) => {
    if (!byType.has(a.type)) byType.set(a.type, []);
    byType.get(a.type)!.push(a);
  });
  return ASSET_TYPES.filter((t) => byType.has(t)).map((t) => {
    const list = byType.get(t)!;
    const code = typeCode(t);
    if (DEVICE_TYPES.includes(t)) {
      const devices = Array.from(new Set(list.map((a) => a.device).filter(Boolean)));
      const sameCountAsDevices = devices.length === list.length;
      if (devices.length && sameCountAsDevices) return `${code} ${devices.join("·")}`;
    }
    return list.length > 1 ? `${code} ${list.length}` : code;
  });
}
