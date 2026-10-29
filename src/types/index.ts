export type UserRole = 'user' | 'designer' | 'admin';

export type LicenseStatus = 'verified' | 'needs_review' | 'restricted' | 'expired';

export type AssetType = '상세페이지' | '배너' | '카드뉴스' | '포스터' | '썸네일' | '소개자료';

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
  order: Array<'year' | 'courseAndTitle' | 'tools' | 'designer' | 'version'>;
  requiredFields: string[];
  allowedTypes: string[];
  allowedTools: string[];
  versionFormat: string;
  extension: string;
}

export type ViewMode = 'grid' | 'list';
export type GroupMode = 'none' | 'course' | 'project' | 'professor';
export type SortOption = 'latest' | 'oldest' | 'title' | 'professor';
