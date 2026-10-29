export type UserRole = 'user' | 'designer' | 'admin';

export type LicenseStatus = 'verified' | 'needs_review' | 'restricted' | 'expired';

export type AssetType = '상세페이지' | '배너' | '카드뉴스' | '포스터' | '썸네일' | '소개자료';

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
