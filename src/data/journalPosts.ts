import { JournalPost } from '../types';
import aiNews from './ai-news.json';

/** 주간 AI 뉴스: ai-news.json에 매주 한 편씩 추가된다 (최신이 맨 앞) */
export const AI_NEWS_POSTS = aiNews as JournalPost[];

const EDITORIAL_POSTS: JournalPost[] = [
  {
    id: 'post-2027-trends',
    title: '2027 디자인 트렌드 미리 보기',
    summary:
      'WGSN·Coloro가 꼽은 올해의 색 Luminous Blue와, 내년 비주얼 키워드 12가지를 우리 작업(상세페이지·배너·카드뉴스) 기준으로 정리했어요.',
    category: '트렌드',
    tags: ['2027', '컬러', '타이포', '레이아웃'],
    author: '박정은',
    date: '2026-11-03',
    palette: [
      { name: 'Luminous Blue', hex: '#2446B8', code: 'Coloro 125-28-38' },
      { name: 'Energy Orange', hex: '#E8742C', code: 'Coloro 018-57-34' },
      { name: 'Pop Pink', hex: '#F2A3C6', code: 'Coloro 151-73-22' },
      { name: 'Meadowland Green', hex: '#9BB06A', code: 'Coloro 050-61-19' },
      { name: 'Clay', hex: '#BC8F78', code: 'Coloro 014-60-13' },
    ],
    body: `## 올해의 색: Luminous Blue
WGSN과 Coloro가 2027 올해의 색으로 Luminous Blue(Coloro 125-28-38)를 발표했어요. 신비롭고 개성 있는 느낌의 짙고 선명한 파랑이라, 행사·스포츠·일상 어디에나 어울린다는 설명이에요.
함께 발표한 S/S 27 핵심 컬러는 Energy Orange, Pop Pink, Meadowland Green, Clay예요. 위 팔레트의 HEX는 화면용 근사색이라, 정확한 값은 Coloro 코드로 확인해 주세요.

## 2027 비주얼 키워드 12
- 의도된 불완전함: 손맛이 남은 로파이, 핸드메이드 느낌
- 만지고 싶은 질감: 말랑하고 폭신한 3D 표면
- 감정을 담은 과장된 타이포그래피
- 다시 돌아온 선명한 색 (Luminous Blue 중심)
- 차분한 뉴트럴 + 넉넉한 여백
- 콜라주·몽타주·레이어 겹치기
- 왜곡·글리치·낯섦
- 요즘식 레트로 퓨처리즘, 80년대 감성
- 진(zine)·뉴스레터 같은 편집 레이아웃
- 꾸미지 않은 실제 사람과 생활 사진
- 구경거리가 아닌 '일상의 도우미'로서의 AI 표현
- 여러 매체에 맞춰 바뀌는 모듈형 브랜드 시스템

## 우리 작업에 써본다면
- 상세페이지: 큰 키 비주얼 대신 선명한 Luminous Blue 면 + 과장된 타이틀 타이포로 첫 화면 만들기
- 배너·팝업: 오렌지·핑크를 포인트로, 배경은 뉴트럴로 눌러서 정보는 차분하게
- 카드뉴스: 진·뉴스레터처럼 글이 많은 편집 레이아웃, 실제 수강생·강사 사진 활용
- 공통: 모듈형으로 만들어 두면 PC·MO·배너 사이즈를 바꿀 때 손이 덜 가요

의견이나 참고 레퍼런스가 있으면 댓글로 남겨 주세요.`,
    sources: [
      {
        title: 'WGSN · Colour of the Year 2027, Luminous Blue and S/S 27 Key Colours',
        url: 'https://www.wgsn.com/en/wgsn/press/press-releases/wgsn-and-coloro-reveal-colour-year-2027-luminous-blue-and-s-s-27-key',
      },
      {
        title: 'Lovart · 2027 Design Trend Predictions',
        url: 'https://www.lovart.ai/ko/blog/design-trends-2027',
      },
    ],
    relatedProjects: [],
    likes: ['김다은', '이혜진'],
    comments: [
      {
        id: 'c1',
        author: '김다은',
        text: '내년 1분기 상세페이지 리뉴얼 때 Luminous Blue 메인으로 시안 하나 잡아볼게요!',
        date: '2026-11-03',
      },
    ],
  },
  {
    id: 'post-naming',
    title: '[공지] 11월부터 새 폴더·파일 네이밍 규칙 적용',
    summary: '날짜_요청번호_프로젝트명_리소스_디자이너 규칙으로 통일해요. 등록할 때 자동 분류가 훨씬 정확해져요.',
    category: '공지',
    tags: ['네이밍', 'NAS'],
    author: '박정은',
    date: '2026-10-30',
    body: `## 폴더명
260120_15832_색채학 과정_산돌-AI_김다은

## 파일명
15832_상세_PC_v01.png

메뉴 > 네이밍 규칙에서 이름 만들기와 이름 검사를 쓸 수 있어요.`,
    likes: [],
    comments: [],
  },
];

export const INITIAL_POSTS: JournalPost[] = [...AI_NEWS_POSTS, ...EDITORIAL_POSTS];
