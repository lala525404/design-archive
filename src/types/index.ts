export type UserRole = 'user' | 'designer' | 'admin';

export type LicenseStatus = 'verified' | 'needs_review' | 'restricted' | 'expired';

export type AssetType =
  | '상세페이지'
  | '풀페이지'
  | '배너'
  | '팝업'
  | '카드뉴스'
  | '포스터'
  | '편집'
  | '썸네일'
  | 'PPT';

export type ChangeReason =
  | '최초 제작'
  | '일자 변경'
  | '장소 변경'
  | '문구 수정'
  | '디자인 수정'
  | '기타'
  | '되돌리기';

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
  /** 그 버전을 올릴 때의 이미지 (있으면 버전별 미리보기) */
  imageUrl?: string;
}

export interface DesignAsset {
  id: string;
  title: string;
  /** NAS 최상위 분류 폴더, 예: 05_평생 */
  service: string;
  /** 프로젝트(패키지) 이름. 같은 프로젝트의 상세·배너·팝업이 함께 묶인다 */
  project: string;
  /** 업무 요청번호 (없으면 빈 값) */
  requestNo?: string;
  /** 프로젝트 오픈일 YYMMDD (폴더 이름 맨 앞) */
  projectDate?: string;
  /** 리소스(라이선스) 코드: 산돌, 게티, AI, 기타 */
  resources?: string[];
  /** '기타' 리소스의 실제 이름/출처 (예: 언스플래시, 프리픽) */
  resourceEtc?: string;
  /** 기타 리소스 라이선스 증빙(캡처·PDF) */
  licenseProofs?: { name: string; url?: string }[];
  /** 이 프로젝트(패키지)에 들어 있는 작업 유형. 업로드 때 체크한 값 */
  packageTypes?: AssetType[];
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

/** 디자인 저널 (트렌드·레퍼런스·AI 뉴스 공유) */
export type JournalCategory = '트렌드' | 'AI 뉴스' | '레퍼런스' | '툴·팁' | '공지';

export interface JournalSwatch {
  name: string;
  hex: string;
  /** 공식 코드 (예: Coloro 125-28-38) */
  code?: string;
}

export interface JournalComment {
  id: string;
  author: string;
  text: string;
  date: string;
}

export interface JournalPost {
  id: string;
  title: string;
  summary: string;
  /** 본문: 빈 줄로 문단, '## '는 소제목, '- '는 목록 */
  body: string;
  category: JournalCategory;
  tags: string[];
  author: string;
  date: string;
  /** 표지: 이미지가 없으면 팔레트나 기본 색으로 그린다 */
  coverUrl?: string;
  /** 직접 그린 예시 그림을 표지로 (TrendArt 이름) */
  coverArt?: string;
  palette?: JournalSwatch[];
  sources?: { title: string; url: string }[];
  /** 관련 프로젝트(폴더 경로 키) */
  relatedProjects?: string[];
  likes: string[];
  comments: JournalComment[];
}
