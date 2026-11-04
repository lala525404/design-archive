import {
  AssetType,
  DesignAsset,
  LicenseStatus,
  NamingRuleConfig,
  SandollFontItem,
  VersionEntry,
} from '../types';
import { serviceName } from '../lib/taxonomy';
import { buildDeliverableName, buildFolderName } from '../lib/naming';

interface Seed {
  id: string;
  title: string;
  service: string;
  year: number;
  type: AssetType;
  device?: 'PC' | 'MO';
  /** 프로젝트 폴더: 오픈일_요청번호_프로젝트명_리소스_담당디자이너 */
  folder: ProjectFolder;
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

interface ProjectFolder {
  date: string;
  requestNo: string;
  name: string;
  resources: string[];
  lead: string;
}

/** 샘플 프로젝트 폴더 (새 네이밍 규칙) */
const P = {
  색채학: { date: '260120', requestNo: '15832', name: '색채학 과정', resources: ['산돌', 'AI'], lead: '김다은' },
  IT스타터: { date: '261014', requestNo: '27410', name: 'IT 스타터 과정', resources: ['산돌', '게티', 'AI'], lead: '양현보' },
  제안서: { date: '260202', requestNo: '16021', name: 'HRD 고객사 교육 제안서', resources: ['산돌', 'AI'], lead: '김다은' },
  온보딩: { date: '260710', requestNo: '20988', name: '신규 입사자 온보딩', resources: ['AI'], lead: '방수림' },
  리더십: { date: '251230', requestNo: '14455', name: '리더십 과정', resources: ['산돌'], lead: '양현보' },
  직무연수: { date: '261027', requestNo: '27980', name: '교원 직무연수 홍보', resources: ['산돌', '게티'], lead: '방수림' },
  연말행사: { date: '260120', requestNo: '', name: '전사 연말 행사', resources: [], lead: '김다은' },
  지하철광고: { date: '260828', requestNo: '23310', name: '지하철 역사 광고', resources: ['게티'], lead: '박지원' },
  가을프로모션: { date: '261026', requestNo: '27702', name: '가을 프로모션', resources: ['산돌', 'AI'], lead: '박정은' },
  데이터분석: { date: '260915', requestNo: '25118', name: '데이터 분석 입문 과정', resources: ['산돌', 'AI'], lead: '이혜진' },
  엑셀실무: { date: '260601', requestNo: '19870', name: '엑셀 실무 과정', resources: ['산돌'], lead: '박지원' },
  겨울특강: { date: '261201', requestNo: '28105', name: '교원 겨울 특강', resources: ['산돌', '게티'], lead: '이혜진' },
  고객사세미나: { date: '260520', requestNo: '18342', name: 'HRD 고객사 세미나', resources: ['AI'], lead: '김다은' },
  사내캠페인: { date: '260401', requestNo: '00000', name: '사내 안전 캠페인', resources: [], lead: '방수림' },
  연말프로모션: { date: '261201', requestNo: '28011', name: '연말 프로모션', resources: ['산돌', 'AI', '게티'], lead: '박정은' },
  경영자과정: { date: '260310', requestNo: '16520', name: '최고경영자 과정', resources: ['산돌'], lead: '양현보' },
  봄학기: { date: '250303', requestNo: '11204', name: '봄학기 평생교육 과정', resources: ['산돌'], lead: '김다은' },
} satisfies Record<string, ProjectFolder>;

function make(seed: Seed): DesignAsset {
  const f = seed.folder;
  const folderName = buildFolderName({ ...f, project: f.name, designer: f.lead });
  const filePath = `/${seed.year}/${seed.service}/${folderName}/`;
  const nameFor = (version: string) =>
    buildDeliverableName({
      id: f.requestNo || f.date,
      type: seed.type,
      label: seed.label,
      device: seed.device,
      version,
    });
  const hasSandoll = f.resources.includes('산돌');
  return {
    id: seed.id,
    title: seed.title,
    service: seed.service,
    project: f.name,
    requestNo: f.requestNo,
    projectDate: f.date,
    resources: f.resources,
    device: seed.device,
    professor: seed.professor ?? '',
    course: f.name,
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
        `#${f.name.replace(/\s/g, '')}`,
        `#${seed.type}`,
        ...(seed.device ? [`#${seed.device}`] : []),
        ...f.resources.map((r) => `#${r}`),
        ...seed.tools.filter((t) => !f.resources.includes(t)).map((t) => `#${t}`),
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

const SEEDED: DesignAsset[] = [
  // 05_평생 · 색채학 — 한 과정에서 나온 패키지 (상세 PC/MO, 배너, 팝업, 카드뉴스)
  make({
    id: 'asset-1',
    title: '색채학 과정 상세페이지',
    service: '05_평생',
    year: 2026,
    folder: P.색채학,
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
    folder: P.색채학,
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
    versions: [
      { version: 'v01', uploadDate: '2026-01-20', reason: '최초 제작', note: '1기 모집용', originalKept: true },
      { version: 'v02', uploadDate: '2026-03-14', reason: '장소 변경', note: 'PC와 함께 온라인 실시간 강의로 수정', originalKept: true },
    ],
  }),
  make({
    id: 'asset-3',
    title: '색채학 과정 메인 배너',
    service: '05_평생',
    year: 2026,
    folder: P.색채학,
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
    versions: [
      { version: 'v01', uploadDate: '2026-01-22', reason: '최초 제작', originalKept: true },
      { version: 'v02', uploadDate: '2026-03-12', reason: '문구 수정', note: '"얼리버드 20%" → "마감 임박"', originalKept: true },
    ],
  }),
  make({
    id: 'asset-4',
    title: '색채학 모집 팝업',
    service: '05_평생',
    year: 2026,
    folder: P.색채학,
    type: '팝업',
    device: 'PC',
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
    folder: P.색채학,
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
    folder: P.IT스타터,
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
    versions: [
      { version: 'v01', uploadDate: '2026-09-02', reason: '최초 제작', note: '1기 모집 오픈', originalKept: true },
      { version: 'v02', uploadDate: '2026-09-18', reason: '디자인 수정', note: '메인 비주얼을 3D 일러스트로 교체', originalKept: true },
      { version: 'v03', uploadDate: '2026-10-02', reason: '디자인 수정', note: '메인 비주얼 실사 사진으로 변경', originalKept: true },
      { version: 'v04', uploadDate: '2026-10-14', reason: '되돌리기', note: 'v02 내용으로 되돌림 (3D 일러스트 반응이 더 좋아서 원복)', originalKept: true },
    ],
  }),
  make({
    id: 'asset-7',
    title: 'IT 스타터 과정 풀페이지',
    service: '02_아이티뱅크',
    year: 2026,
    folder: P.IT스타터,
    type: '풀페이지',
    device: 'MO',
    tools: ['피그마', 'AI'],
    designer: '양현보',
    version: 'v02',
    uploadDate: '2026-10-14',
    summary: '같은 랜딩의 모바일 버전입니다.',
    dimensions: '720 × 11000 px',
    fileSize: '12.3 MB',
    versions: [
      { version: 'v01', uploadDate: '2026-09-02', reason: '최초 제작', originalKept: true },
      { version: 'v02', uploadDate: '2026-10-14', reason: '일자 변경', note: '2기 개강일 10월 14일 → 10월 28일', originalKept: true },
    ],
  }),
  make({
    id: 'asset-8',
    title: 'IT 스타터 검색광고 배너',
    service: '02_아이티뱅크',
    year: 2026,
    folder: P.IT스타터,
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
    folder: P.제안서,
    type: 'PPT',
    tools: ['AI', '산돌'],
    designer: '김다은',
    version: 'v05',
    uploadDate: '2026-02-02',
    summary: '기업 고객사 대상 맞춤 교육 제안서 템플릿입니다. 표지와 커리큘럼 장표를 재사용합니다.',
    dimensions: '16:9 · 32장',
    fileSize: '18.0 MB',
    versions: [
      { version: 'v01', uploadDate: '2025-09-05', reason: '최초 제작', note: '공통 템플릿', originalKept: false },
      { version: 'v02', uploadDate: '2025-10-17', reason: '문구 수정', note: 'A사 맞춤 커리큘럼 반영', originalKept: true },
      { version: 'v03', uploadDate: '2025-11-28', reason: '디자인 수정', note: '표지·간지 리뉴얼', originalKept: true },
      { version: 'v04', uploadDate: '2026-01-09', reason: '문구 수정', note: 'B사 제안용 사례 장표 교체', originalKept: true },
      { version: 'v05', uploadDate: '2026-02-02', reason: '기타', note: '2026 단가표 반영', originalKept: true },
    ],
  }),

  // 04_HRD내부구축 · 온보딩
  make({
    id: 'asset-10',
    title: '신규 입사자 온보딩 카드뉴스',
    service: '04_HRD내부구축',
    year: 2026,
    folder: P.온보딩,
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
    folder: P.리더십,
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
    versions: [
      { version: 'v01', uploadDate: '2025-11-03', reason: '최초 제작', originalKept: true },
      { version: 'v02', uploadDate: '2025-12-30', reason: '일자 변경', note: '2026년 1월 기수로 변경', originalKept: true },
    ],
  }),

  // 01_교원 · 직무연수 (사용 제한)
  make({
    id: 'asset-12',
    title: '교원 직무연수 홍보 포스터',
    service: '01_교원',
    year: 2026,
    folder: P.직무연수,
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

  make({
    id: 'asset-16',
    title: '교원 직무연수 안내 리플렛',
    service: '01_교원',
    year: 2026,
    folder: P.직무연수,
    type: '편집',
    tools: ['일러스트', '산돌'],
    designer: '이혜진',
    version: 'v03',
    uploadDate: '2026-10-29',
    summary: '학교에 함께 배포하는 3단 접지 리플렛입니다.',
    dimensions: 'A4 3단 접지',
    fileSize: '32.0 MB',
    versions: [
      { version: 'v01', uploadDate: '2026-10-20', reason: '최초 제작', originalKept: true },
      { version: 'v02', uploadDate: '2026-10-24', reason: '일자 변경', note: '연수 기간 11월 → 12월', originalKept: true },
      { version: 'v03', uploadDate: '2026-10-29', reason: '장소 변경', note: '본사 강의실 → 대전 연수원', originalKept: true },
    ],
  }),

  // 07_전사 · 연말행사 PPT
  make({
    id: 'asset-13',
    title: '전사 연말 행사 발표 자료',
    service: '07_전사',
    year: 2026,
    folder: P.연말행사,
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
    folder: P.지하철광고,
    type: '포스터',
    tools: ['일러스트'],
    designer: '박지원',
    version: 'v02',
    uploadDate: '2026-08-28',
    summary: '2호선 역사 와이드 광고 인쇄 파일입니다.',
    dimensions: '3000 × 1000 mm',
    fileSize: '120 MB',
    versions: [
      { version: 'v01', uploadDate: '2026-08-11', reason: '최초 제작', note: '강남역', originalKept: true },
      { version: 'v02', uploadDate: '2026-08-28', reason: '장소 변경', note: '강남역 → 잠실역 (게재 위치 변경)', originalKept: true },
    ],
  }),

  // 09_마케팅 · 가을프로모션
  make({
    id: 'asset-15',
    title: '가을 프로모션 유튜브 썸네일',
    service: '09_마케팅',
    year: 2026,
    folder: P.가을프로모션,
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


/** 샘플을 넉넉하게: 프로젝트 8개, 파일 24개 추가 (모두 40개) */
type Quick = [
  id: number,
  folder: ProjectFolder,
  service: string,
  type: AssetType,
  device: 'PC' | 'MO' | undefined,
  label: string | undefined,
  title: string,
  designer: string,
  uploadDate: string,
  tools: string[],
  summary: string,
  more?: Partial<Seed>,
];
const QUICK: Quick[] = [
  [17, P.데이터분석, '02_아이티뱅크', '상세페이지', 'PC', undefined, '데이터 분석 입문 상세페이지', '이혜진', '2026-09-15', ['포토샵', 'AI', '산돌'], '파이썬·엑셀로 시작하는 데이터 분석 입문 과정 상세페이지입니다.', {
    version: 'v02',
    versions: [
      { version: 'v01', uploadDate: '2026-08-28', reason: '최초 제작', originalKept: true },
      { version: 'v02', uploadDate: '2026-09-15', reason: '문구 수정', note: '수강료 할인 문구 추가', originalKept: true },
    ],
  }],
  [18, P.데이터분석, '02_아이티뱅크', '상세페이지', 'MO', undefined, '데이터 분석 입문 상세페이지', '이혜진', '2026-09-15', ['포토샵', 'AI'], '같은 과정의 모바일 상세페이지입니다.'],
  [19, P.데이터분석, '02_아이티뱅크', '배너', 'PC', '메인', '데이터 분석 메인 배너', '이혜진', '2026-09-16', ['포토샵'], '아이티뱅크 메인 상단 배너입니다.'],
  [20, P.데이터분석, '02_아이티뱅크', '팝업', 'MO', undefined, '데이터 분석 얼리버드 팝업', '박정은', '2026-09-20', ['포토샵', 'AI'], '얼리버드 마감 안내 모바일 팝업입니다.', {
    licenseStatus: 'needs_review',
    licenseNote: 'AI 생성 이미지 사용 표기 여부를 확인해야 합니다.',
  }],
  [21, P.엑셀실무, '05_평생', '풀페이지', 'PC', undefined, '엑셀 실무 과정 풀페이지', '박지원', '2026-06-01', ['포토샵', '산돌'], '직장인 대상 엑셀 실무 과정 모집 풀페이지입니다.', {
    version: 'v03',
    versions: [
      { version: 'v01', uploadDate: '2026-05-12', reason: '최초 제작', originalKept: true },
      { version: 'v02', uploadDate: '2026-05-26', reason: '일자 변경', note: '개강일 6월 3일 → 6월 10일', originalKept: true },
      { version: 'v03', uploadDate: '2026-06-01', reason: '디자인 수정', note: '후기 섹션 추가', originalKept: true },
    ],
  }],
  [22, P.엑셀실무, '05_평생', '풀페이지', 'MO', undefined, '엑셀 실무 과정 풀페이지', '박지원', '2026-06-01', ['포토샵'], '같은 과정의 모바일 풀페이지입니다.'],
  [23, P.엑셀실무, '05_평생', '카드뉴스', undefined, undefined, '엑셀 단축키 카드뉴스', '방수림', '2026-06-05', ['일러스트', 'AI'], 'SNS 홍보용 엑셀 단축키 카드뉴스 5장입니다.'],
  [24, P.겨울특강, '01_교원', '포스터', undefined, undefined, '교원 겨울 특강 포스터', '이혜진', '2026-11-02', ['일러스트', '산돌'], '학교 배포용 A3 포스터입니다.'],
  [25, P.겨울특강, '01_교원', '편집', undefined, undefined, '교원 겨울 특강 리플렛', '이혜진', '2026-11-02', ['일러스트', '산돌'], '포스터와 함께 배포하는 2단 리플렛입니다.', {
    licenseStatus: 'restricted',
    licenseNote: '게티 이미지가 인쇄물 전용으로 구매되어 웹 게시 시 교체가 필요합니다.',
  }],
  [26, P.겨울특강, '01_교원', '배너', 'PC', undefined, '교원 겨울 특강 배너', '박정은', '2026-11-03', ['포토샵'], '연수원 홈페이지 배너입니다.'],
  [27, P.고객사세미나, '03_HRD고객사', 'PPT', undefined, undefined, 'HRD 고객사 세미나 발표 자료', '김다은', '2026-05-20', ['AI', '산돌'], '고객사 HRD 담당자 대상 세미나 발표 자료입니다.'],
  [28, P.고객사세미나, '03_HRD고객사', '배너', 'PC', undefined, 'HRD 세미나 신청 배너', '김다은', '2026-05-08', ['포토샵', 'AI'], '세미나 신청 페이지 배너입니다.'],
  [29, P.고객사세미나, '03_HRD고객사', '썸네일', undefined, undefined, 'HRD 세미나 다시보기 썸네일', '박지원', '2026-05-27', ['포토샵'], '세미나 다시보기 영상 썸네일입니다.'],
  [30, P.사내캠페인, '07_전사', '포스터', undefined, undefined, '사내 안전 캠페인 포스터', '방수림', '2026-04-01', ['일러스트'], '사무실 게시용 안전 캠페인 포스터입니다.'],
  [31, P.사내캠페인, '07_전사', '카드뉴스', undefined, undefined, '사내 안전 수칙 카드뉴스', '방수림', '2026-04-03', ['일러스트'], '사내 메신저 공유용 안전 수칙 카드뉴스입니다.'],
  [32, P.연말프로모션, '09_마케팅', '상세페이지', 'PC', undefined, '연말 프로모션 상세페이지', '박정은', '2026-11-04', ['포토샵', 'AI', '산돌'], '연말 전 과정 할인 프로모션 상세페이지입니다.', {
    version: 'v02',
    versions: [
      { version: 'v01', uploadDate: '2026-10-28', reason: '최초 제작', originalKept: true },
      { version: 'v02', uploadDate: '2026-11-04', reason: '문구 수정', note: '할인율 20% → 25%', originalKept: true },
    ],
  }],
  [33, P.연말프로모션, '09_마케팅', '배너', 'MO', '검색광고', '연말 프로모션 검색광고 배너', '박정은', '2026-11-04', ['포토샵'], '포털 검색광고 모바일 배너입니다.'],
  [34, P.연말프로모션, '09_마케팅', '팝업', 'PC', undefined, '연말 프로모션 팝업', '양현보', '2026-11-04', ['포토샵', 'AI'], '메인 진입 팝업입니다.'],
  [35, P.연말프로모션, '09_마케팅', '팝업', 'MO', undefined, '연말 프로모션 팝업', '양현보', '2026-11-04', ['포토샵', 'AI'], '모바일 진입 팝업입니다.'],
  [36, P.연말프로모션, '09_마케팅', '썸네일', undefined, undefined, '연말 프로모션 유튜브 썸네일', '박지원', '2026-11-04', ['포토샵', 'AI'], '프로모션 안내 영상 썸네일입니다.', {
    licenseStatus: 'needs_review',
    licenseNote: '게티 이미지 라이선스 범위(영상 썸네일)를 확인해야 합니다.',
  }],
  [37, P.경영자과정, '06_미래경영', '상세페이지', 'PC', undefined, '최고경영자 과정 상세페이지', '양현보', '2026-03-10', ['포토샵', '산돌'], '최고경영자 과정 모집 상세페이지입니다.'],
  [38, P.경영자과정, '06_미래경영', '상세페이지', 'MO', undefined, '최고경영자 과정 상세페이지', '양현보', '2026-03-10', ['포토샵', '산돌'], '같은 과정의 모바일 상세페이지입니다.'],
  [39, P.봄학기, '05_평생', '상세페이지', 'PC', undefined, '봄학기 평생교육 상세페이지', '김다은', '2025-03-03', ['포토샵', '산돌'], '2025 봄학기 평생교육 과정 안내 상세페이지입니다.'],
  [40, P.봄학기, '05_평생', '배너', 'PC', undefined, '봄학기 평생교육 배너', '김다은', '2025-03-03', ['포토샵'], '평생교육원 메인 배너입니다.'],
];
const MORE: DesignAsset[] = QUICK.map(
  ([id, folder, service, type, device, label, title, designer, uploadDate, tools, summary, more]) =>
    make({
      id: `asset-${id}`,
      title,
      service,
      year: Number(uploadDate.slice(0, 4)),
      folder,
      type,
      device,
      label,
      tools,
      designer,
      version: 'v01',
      uploadDate,
      summary,
      ...more,
    }),
);

/** 같은 프로젝트 파일들의 유형을 모아 패키지 구성으로 저장 */
function withPackageTypes(list: DesignAsset[]): DesignAsset[] {
  const byProject = new Map<string, Set<AssetType>>();
  const key = (a: DesignAsset) => `${a.service}/${a.year}/${a.project}`;
  list.forEach((a) => {
    if (!byProject.has(key(a))) byProject.set(key(a), new Set());
    byProject.get(key(a))!.add(a.type);
  });
  return list.map((a) => ({ ...a, packageTypes: [...byProject.get(key(a))!] }));
}

export const INITIAL_ASSETS: DesignAsset[] = withPackageTypes([...SEEDED, ...MORE]);

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
