import {
  AssetType,
  DesignAsset,
  LicenseStatus,
  NamingRuleConfig,
  SandollFontItem,
  VersionEntry,
} from '../types';
import { serviceName } from '../lib/taxonomy';

interface Seed {
  id: string;
  title: string;
  service: string;
  year: number;
  project: string;
  type: AssetType;
  device?: 'PC' | 'MO';
  /** 같은 프로젝트에 같은 유형이 여러 개일 때 구분 (예: 메인, 02) */
  label?: string;
  tools: string[];
  designer: string;
  version: string;
  uploadDate: string;
  licenseStatus?: LicenseStatus;
  licenseNote?: string;
  professor?: string;
  summary: string;
  dimensions?: string;
  fileSize?: string;
  versions?: Omit<VersionEntry, 'filePath' | 'fileName' | 'designer'>[];
}

/** NAS 규칙: /서비스폴더/연도/프로젝트/  ·  연도_프로젝트_유형(PC|MO)_도구_디자이너_버전.확장자 */
export const buildFileName = (
  year: number,
  project: string,
  type: string,
  device: string | undefined,
  label: string | undefined,
  tools: string[],
  designer: string,
  version: string,
) =>
  `${year}_${project}_${label ?? ''}${type}${device ?? ''}_${tools.join('-')}_${designer}_${version}.${type === 'PPT' ? 'pptx' : 'png'}`;

function make(seed: Seed): DesignAsset {
  const filePath = `/${seed.service}/${seed.year}/${seed.project}/`;
  const nameFor = (version: string) =>
    buildFileName(seed.year, seed.project, seed.type, seed.device, seed.label, seed.tools, seed.designer, version);
  const hasSandoll = seed.tools.includes('산돌');
  return {
    id: seed.id,
    title: seed.title,
    service: seed.service,
    project: seed.project,
    device: seed.device,
    professor: seed.professor ?? '',
    course: seed.project,
    type: seed.type,
    year: seed.year,
    tools: seed.tools,
    designer: seed.designer,
    version: seed.version,
    filePath,
    fileName: nameFor(seed.version),
    hashtags: Array.from(
      new Set([
        `#${seed.year}`,
        `#${serviceName(seed.service)}`,
        `#${seed.project}`,
        `#${seed.type}`,
        ...(seed.device ? [`#${seed.device}`] : []),
        ...seed.tools.map((t) => `#${t}`),
        `#${seed.designer}`,
        ...(seed.professor ? [`#${seed.professor}`] : []),
      ]),
    ),
    hasSandoll,
    licenseStatus: seed.licenseStatus ?? 'verified',
    licenseNote:
      seed.licenseNote ??
      (hasSandoll ? '산돌 기업용 라이선스 범위 안에서 사용 확인됨' : undefined),
    uploadDate: seed.uploadDate,
    bgColor: '#F7F3EF',
    accentColor: '#246BFD',
    summary: seed.summary,
    dimensions: seed.dimensions,
    fileSize: seed.fileSize,
    versions: seed.versions?.map((v) => ({
      ...v,
      filePath,
      fileName: nameFor(v.version),
      designer: seed.designer,
    })),
  };
}

export const INITIAL_ASSETS: DesignAsset[] = [
  // 05_평생 · 색채학 — 한 과정에서 나온 패키지 (상세 PC/MO, 배너, 팝업, 카드뉴스)
  make({
    id: 'asset-1',
    title: '색채학 과정 상세페이지',
    service: '05_평생',
    year: 2026,
    project: '색채학',
    type: '상세페이지',
    device: 'PC',
    tools: ['피그마', 'AI', '산돌'],
    designer: '김다은',
    version: 'v03',
    uploadDate: '2026-03-14',
    professor: '이동건',
    summary: '색채 지각 원리와 디지털 배색 실습을 다루는 12주 과정의 PC 상세페이지입니다.',
    dimensions: '1920 × 9400 px',
    fileSize: '14.2 MB',
    versions: [
      { version: 'v01', uploadDate: '2026-01-20', reason: '최초 제작', note: '1기 모집용', originalKept: false },
      { version: 'v02', uploadDate: '2026-02-11', reason: '일자 변경', note: '개강일 3월 3일 → 3월 10일', originalKept: true },
      { version: 'v03', uploadDate: '2026-03-14', reason: '장소 변경', note: '강남캠퍼스 → 온라인 실시간 강의', originalKept: true },
    ],
  }),
  make({
    id: 'asset-2',
    title: '색채학 과정 상세페이지',
    service: '05_평생',
    year: 2026,
    project: '색채학',
    type: '상세페이지',
    device: 'MO',
    tools: ['피그마', '산돌'],
    designer: '김다은',
    version: 'v02',
    uploadDate: '2026-03-14',
    professor: '이동건',
    summary: '같은 과정의 모바일 상세페이지입니다. PC 버전과 함께 수정됩니다.',
    dimensions: '720 × 8200 px',
    fileSize: '9.8 MB',
  }),
  make({
    id: 'asset-3',
    title: '색채학 과정 메인 배너',
    service: '05_평생',
    year: 2026,
    project: '색채학',
    type: '배너',
    device: 'PC',
    label: '메인',
    tools: ['포토샵', '산돌'],
    designer: '박지원',
    version: 'v02',
    uploadDate: '2026-03-12',
    professor: '이동건',
    summary: '평생교육원 메인 화면 상단에 걸리는 과정 홍보 배너입니다.',
    dimensions: '1920 × 480 px',
    fileSize: '2.1 MB',
  }),
  make({
    id: 'asset-4',
    title: '색채학 모집 팝업',
    service: '05_평생',
    year: 2026,
    project: '색채학',
    type: '팝업',
    tools: ['포토샵'],
    designer: '박지원',
    version: 'v01',
    uploadDate: '2026-03-12',
    professor: '이동건',
    summary: '모집 마감 일주일 전 노출한 팝업 이미지입니다.',
    dimensions: '600 × 600 px',
    fileSize: '0.8 MB',
  }),
  make({
    id: 'asset-5',
    title: '이동건 교수 소개 카드뉴스',
    service: '05_평생',
    year: 2026,
    project: '색채학',
    type: '카드뉴스',
    tools: ['피그마', 'AI'],
    designer: '방수림',
    version: 'v01',
    uploadDate: '2026-03-10',
    professor: '이동건',
    summary: '교수 이력과 강의 스타일을 소개하는 SNS용 카드뉴스 6장입니다.',
    dimensions: '1080 × 1080 px × 6',
    fileSize: '6.4 MB',
  }),

  // 02_아이티뱅크 · IT스타터 — 풀페이지 PC/MO + 광고 배너
  make({
    id: 'asset-6',
    title: 'IT 스타터 과정 풀페이지',
    service: '02_아이티뱅크',
    year: 2026,
    project: 'IT스타터',
    type: '풀페이지',
    device: 'PC',
    tools: ['피그마', 'AI', '산돌'],
    designer: '양현보',
    version: 'v04',
    uploadDate: '2026-10-14',
    licenseStatus: 'needs_review',
    licenseNote: '산돌 네오고딕 Pro Heavy 굵기의 웹 사용 범위 확인 중입니다.',
    summary: '취업반 모집용 랜딩 풀페이지입니다. 커리큘럼, 수강 후기, 신청 폼을 포함합니다.',
    dimensions: '1920 × 12800 px',
    fileSize: '21.6 MB',
  }),
  make({
    id: 'asset-7',
    title: 'IT 스타터 과정 풀페이지',
    service: '02_아이티뱅크',
    year: 2026,
    project: 'IT스타터',
    type: '풀페이지',
    device: 'MO',
    tools: ['피그마', 'AI'],
    designer: '양현보',
    version: 'v02',
    uploadDate: '2026-10-14',
    summary: '같은 랜딩의 모바일 버전입니다.',
    dimensions: '720 × 11000 px',
    fileSize: '12.3 MB',
  }),
  make({
    id: 'asset-8',
    title: 'IT 스타터 검색광고 배너',
    service: '02_아이티뱅크',
    year: 2026,
    project: 'IT스타터',
    type: '배너',
    device: 'MO',
    label: '검색광고',
    tools: ['포토샵'],
    designer: '박정은',
    version: 'v01',
    uploadDate: '2026-10-15',
    summary: '포털 검색광고용 모바일 배너입니다. 배너만 따로 추가 제작했습니다.',
    dimensions: '640 × 200 px',
    fileSize: '0.4 MB',
  }),

  // 03_HRD고객사 · 제안서 PPT
  make({
    id: 'asset-9',
    title: 'HRD 고객사 교육 제안서',
    service: '03_HRD고객사',
    year: 2026,
    project: '고객사제안서',
    type: 'PPT',
    tools: ['AI', '산돌'],
    designer: '김다은',
    version: 'v05',
    uploadDate: '2026-02-02',
    summary: '기업 고객사 대상 맞춤 교육 제안서 템플릿입니다. 표지와 커리큘럼 장표를 재사용합니다.',
    dimensions: '16:9 · 32장',
    fileSize: '18.0 MB',
  }),

  // 04_HRD내부구축 · 온보딩
  make({
    id: 'asset-10',
    title: '신규 입사자 온보딩 카드뉴스',
    service: '04_HRD내부구축',
    year: 2026,
    project: '온보딩',
    type: '카드뉴스',
    tools: ['피그마', 'AI'],
    designer: '방수림',
    version: 'v01',
    uploadDate: '2026-07-10',
    summary: '사내 교육 플랫폼 사용법을 안내하는 카드뉴스입니다.',
    dimensions: '1080 × 1350 px × 8',
    fileSize: '7.2 MB',
  }),

  // 06_미래경영 · 리더십 (라이선스 만료)
  make({
    id: 'asset-11',
    title: '리더십 과정 상세페이지',
    service: '06_미래경영',
    year: 2025,
    project: '리더십',
    type: '상세페이지',
    device: 'PC',
    tools: ['포토샵', '산돌'],
    designer: '양현보',
    version: 'v02',
    uploadDate: '2025-12-30',
    licenseStatus: 'expired',
    licenseNote: '산돌 격동고딕 2025 연간 구독 만료. 재계약 전까지 이 서체가 들어간 수정·재사용 금지',
    summary: '임원 대상 리더십 과정 상세페이지입니다.',
    dimensions: '1920 × 8000 px',
    fileSize: '11.5 MB',
  }),

  // 01_교원 · 직무연수 (사용 제한)
  make({
    id: 'asset-12',
    title: '교원 직무연수 홍보 포스터',
    service: '01_교원',
    year: 2026,
    project: '직무연수',
    type: '포스터',
    tools: ['일러스트', '산돌'],
    designer: '방수림',
    version: 'v01',
    uploadDate: '2026-10-27',
    licenseStatus: 'restricted',
    licenseNote: '산돌제비는 인쇄 전용 계약입니다. 웹·SNS용으로 바꿔 쓰려면 서체를 교체해야 합니다.',
    summary: '학교 배포용 A2 포스터입니다.',
    dimensions: 'A2 · 420 × 594 mm',
    fileSize: '48.0 MB',
  }),

  // 07_전사 · 연말행사 PPT
  make({
    id: 'asset-13',
    title: '전사 연말 행사 발표 자료',
    service: '07_전사',
    year: 2026,
    project: '연말행사',
    type: 'PPT',
    tools: ['피그마'],
    designer: '김다은',
    version: 'v01',
    uploadDate: '2026-01-20',
    summary: '연말 시상식 진행용 발표 자료입니다.',
    dimensions: '16:9 · 24장',
    fileSize: '9.1 MB',
  }),

  // 08_인쇄광고물(시디) · 지하철광고
  make({
    id: 'asset-14',
    title: '지하철 역사 광고 포스터',
    service: '08_인쇄광고물(시디)',
    year: 2026,
    project: '지하철광고',
    type: '포스터',
    tools: ['일러스트'],
    designer: '박지원',
    version: 'v02',
    uploadDate: '2026-08-28',
    summary: '2호선 역사 와이드 광고 인쇄 파일입니다.',
    dimensions: '3000 × 1000 mm',
    fileSize: '120 MB',
  }),

  // 09_마케팅 · 가을프로모션
  make({
    id: 'asset-15',
    title: '가을 프로모션 유튜브 썸네일',
    service: '09_마케팅',
    year: 2026,
    project: '가을프로모션',
    type: '썸네일',
    tools: ['피그마', 'AI'],
    designer: '박정은',
    version: 'v01',
    uploadDate: '2026-10-26',
    summary: '가을 할인 프로모션 영상용 썸네일입니다.',
    dimensions: '1280 × 720 px',
    fileSize: '1.2 MB',
  }),
];

export const INITIAL_SAN_DOLL_FONTS: SandollFontItem[] = [
  {
    id: 'font-1',
    fontName: '산돌 격동고딕',
    fontFamily: 'Sandoll Gyeokdong Gothic',
    status: 'expired',
    validUntil: '2025-12-31',
    allowedDepartment: '디자인팀 전원',
    allowedAccounts: ['kim@company.com', 'park@company.com', 'lee@company.com'],
    recentAssetsCount: 4,
    assignedLicenseKey: 'SD-ENT-2025-GKD-8821',
    needsReviewReason: '2025년 12월 31일부로 연간 단체 라이선스 만료. 최신 에셋 v02 등 재계약 필요',
  },
  {
    id: 'font-2',
    fontName: '산돌 산돌제비',
    fontFamily: 'Sandoll Jebi',
    status: 'restricted',
    validUntil: '2026-11-30',
    allowedDepartment: '오프라인 출판 / 브랜딩팀',
    allowedAccounts: ['park@company.com'],
    recentAssetsCount: 1,
    assignedLicenseKey: 'SD-PUB-2026-JEB-1093',
    needsReviewReason: '인쇄/오프라인 출판 전용 라이선스로 계약됨. 디지털 웹 배너 및 SNS 게시물 사용 금지',
  },
  {
    id: 'font-3',
    fontName: '산돌 네오고딕 Pro',
    fontFamily: 'Sandoll Neo Gothic Pro',
    status: 'needs_review',
    validUntil: '2027-06-30',
    allowedDepartment: '콘텐츠제작본부',
    allowedAccounts: ['kim@company.com', 'lee@company.com', 'choi@company.com'],
    recentAssetsCount: 12,
    assignedLicenseKey: 'SD-CORP-2027-NGP-4409',
    needsReviewReason: '일부 서브패밀리(Heavy/UltraBold)의 웹폰트 임베딩 권한 확인 요청 중',
  },
  {
    id: 'font-4',
    fontName: '산돌 명조 Neo',
    fontFamily: 'Sandoll Myeongjo Neo',
    status: 'verified',
    validUntil: '2027-12-31',
    allowedDepartment: '전사 공용',
    allowedAccounts: ['전 사원 (기업용 마스터 라이선스)'],
    recentAssetsCount: 8,
    assignedLicenseKey: 'SD-ALL-2027-MJN-7731',
  },
  {
    id: 'font-5',
    fontName: '산돌 백제',
    fontFamily: 'Sandoll Baekje',
    status: 'verified',
    validUntil: '2026-12-31',
    allowedDepartment: '디자인팀',
    allowedAccounts: ['kim@company.com', 'park@company.com'],
    recentAssetsCount: 3,
    assignedLicenseKey: 'SD-DES-2026-BKJ-2201',
  },
];

export const INITIAL_NAMING_RULE: NamingRuleConfig = {
  separator: '_',
  toolSeparator: '-',
  order: ['year', 'project', 'workType', 'tools', 'designer', 'version'],
  requiredFields: ['연도', '프로젝트', '작업유형', '사용도구', '디자이너', '버전'],
  allowedTypes: ['상세페이지', '풀페이지', '배너', '팝업', '카드뉴스', '포스터', '썸네일', 'PPT'],
  allowedTools: ['AI', '산돌', '포토샵', '일러스트', '피그마'],
  versionFormat: 'vNN',
  extension: '.png',
};
