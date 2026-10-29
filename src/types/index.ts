export type UserRole = 'user' | 'designer' | 'admin';

export type LicenseStatus = 'verified' | 'needs_review' | 'restricted' | 'expired';

export type AssetType =
  | '상세페이지'
  | '풀페이지'
  | '배너'
  | '팝업'
  | '카드뉴스'
  | '포스터'
  | '썸네일'
  | 'PPT';

export type ChangeReason =
  | '최초 제작'
  | '일자 변경'
  | '장소 변경'
  | '문구 수정'
  | '디자인 수정'
  | '기타';

/** 같은 작업의 버전 한 개. 원본 파일이 NAS에서 지워져도 기록은 남는다. */
export interface VersionEntry {
  version: string;
  fileName: string;
  filePath: string;
  uploadDate: string;
  designer: string;
  reason: ChangeReason;
  note?: string;
  originalKept: boolean;
}

export interface DesignAsset {
  id: string;
  title: string;
  /** NAS 최상위 분류 폴더, 예: 05_평생 */
  service: string;
  /** 프로젝트(패키지) 이름. 같은 프로젝트의 상세·배너·팝업이 함께 묶인다 */
  project: string;
  /** PC/MO 버전이 따로 있는 작업 */
  device?: 'PC' | 'MO';
  /** 교수 정보는 추후 추가 (지금은 검색에만 쓰임) */
  professor: string;
  course: string;
  type: AssetType;
  year: number;
  tools: string[];
  designer: string;
  version: string;
  filePath: string;
  fileName: string;
  hashtags: string[];
  hasSandoll: boolean;
  licenseStatus: LicenseStatus;
  licenseNote?: string;
  uploadDate: string;
  bgColor: string;
  accentColor: string;
  summary: string;
  dimensions?: string;
  fileSize?: string;
  /** 업로드한 실제 이미지 (있으면 그래픽 미리보기 대신 표시) */
  imageUrl?: string;
  /** 오래된 것부터 최신 순. 마지막 항목이 현재 버전이다. */
  versions?: VersionEntry[];
}

export interface SandollFontItem {
  id: string;
  fontName: string;
  fontFamily: string;
  status: LicenseStatus;
  validUntil: string;
  allowedDepartment: string;
  allowedAccounts: string[];
  recentAssetsCount: number;
  assignedLicenseKey: string;
  needsReviewReason?: string;
}

export interface NamingRuleConfig {
  separator: string;
  toolSeparator: string;
  order: Array<
    'year' | 'project' | 'workType' | 'courseAndTitle' | 'tools' | 'designer' | 'version'
  >;
  requiredFields: string[];
  allowedTypes: string[];
  allowedTools: string[];
  versionFormat: string;
  extension: string;
}

export type ViewMode = 'grid' | 'list';
export type GroupMode = 'none' | 'project' | 'service';
export type SortOption = 'latest' | 'oldest' | 'title';
